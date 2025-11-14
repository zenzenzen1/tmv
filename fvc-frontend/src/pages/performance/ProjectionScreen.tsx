import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import scoringService, {
  type PerformanceResponseDto,
} from "../../services/scoringService";
import apiClient from "../../config/axios";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import type { IStompSocket } from "@stomp/stompjs";

type JudgeHistory = { score: number; time: string; judge: number };

const ProjectionScreen: React.FC = () => {
  const [params] = useSearchParams();
  const performanceId = params.get("performanceId") || "";
  const matchId = params.get("matchId") || "";
  const hasLoadedRef = useRef<string>("");

  const [eventTitle, setEventTitle] = useState<string>("FPTU Vovinam Club");
  const [formatText, setFormatText] = useState<string>("Đang cập nhật…");
  const [contentName, setContentName] = useState<string>("Đang cập nhật…");
  const [roundTime, setRoundTime] = useState<string>("00:00");
  const [team, setTeam] = useState<Array<{ name: string; unit?: string }>>([]);
  const [judgeScores, setJudgeScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [judgeNames, setJudgeNames] = useState<string[]>([]);
  const [history, setHistory] = useState<JudgeHistory[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>("00:00");
  const [total, setTotal] = useState<number>(0);
  const navigate = useNavigate();
  const stompRef = useRef<Client | null>(null);
  const assessorIndexMapRef = useRef<Record<string, number>>({});
  const historyKeysRef = useRef<Set<string>>(new Set());
  const roundSecondsRef = useRef<number>(120);
  const startTimeMsRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);
  const completionSentRef = useRef<boolean>(false);
  const allJudgesScoredRef = useRef<boolean>(false);
  const redirectTimerRef = useRef<number | null>(null);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [connectedAssessorsCount, setConnectedAssessorsCount] =
    useState<number>(0);
  const [performanceMatchId, setPerformanceMatchId] = useState<string | null>(
    null
  );
  const projectionStorageKey = useMemo(() => {
    if (performanceId) return `projection:${performanceId}`;
    if (matchId) return `projection:${matchId}`;
    return null;
  }, [performanceId, matchId]);
  const projectionStorageKeyRef = useRef<string | null>(null);
  useEffect(() => {
    projectionStorageKeyRef.current = projectionStorageKey;
  }, [projectionStorageKey]);
  const [projectionStorageState, setProjectionStorageState] = useState<Record<
    string,
    any
  > | null>(null);

  const updateProjectionStorage = useCallback(
    (patch: Record<string, unknown>) => {
      if (!projectionStorageKey) return;
      try {
        const previousRaw = localStorage.getItem(projectionStorageKey);
        const previous = previousRaw
          ? (JSON.parse(previousRaw) as Record<string, unknown>)
          : {};
        const next = { ...previous, ...patch };
        localStorage.setItem(projectionStorageKey, JSON.stringify(next));
        setProjectionStorageState(next as Record<string, any>);
      } catch (error) {
        console.warn("Failed to update projection storage", error);
      }
    },
    [projectionStorageKey]
  );
  const updateProjectionStorageRef = useRef<
    (patch: Record<string, unknown>) => void
  >(() => {});
  useEffect(() => {
    updateProjectionStorageRef.current = updateProjectionStorage;
  }, [updateProjectionStorage]);

  useEffect(() => {
    if (!projectionStorageKey) {
      setProjectionStorageState(null);
      return;
    }
    try {
      const raw = localStorage.getItem(projectionStorageKey);
      if (!raw) {
        setProjectionStorageState(null);
        return;
      }
      setProjectionStorageState(JSON.parse(raw));
    } catch (error) {
      console.warn("Failed to read projection storage", error);
      setProjectionStorageState(null);
    }
  }, [projectionStorageKey]);

  useEffect(() => {
    if (
      !projectionStorageState?.isRunning ||
      !projectionStorageState?.startedAt ||
      isStarted
    ) {
      return;
    }
    const totalSeconds =
      typeof projectionStorageState.durationSeconds === "number" &&
      projectionStorageState.durationSeconds > 0
        ? projectionStorageState.durationSeconds
        : roundSecondsRef.current;
    if (!totalSeconds || totalSeconds <= 0) return;
    const elapsedSeconds = Math.floor(
      (Date.now() - projectionStorageState.startedAt) / 1000
    );
    if (elapsedSeconds >= totalSeconds) {
      setTimeLeft("00:00");
      runningRef.current = false;
      setIsStarted(false);
      updateProjectionStorage({
        isRunning: false,
        startedAt: null,
      });
      return;
    }
    roundSecondsRef.current = totalSeconds;
    runningRef.current = true;
    startTimeMsRef.current = Date.now() - elapsedSeconds * 1000;
    setIsStarted(true);
    const remaining = totalSeconds - elapsedSeconds;
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    setTimeLeft(`${m}:${s}`);
  }, [projectionStorageState, isStarted, updateProjectionStorage]);

  useEffect(() => {
    const key = performanceId || matchId;
    if (!key) {
      console.warn("Missing performanceId or matchId in query string");
      return;
    }
    // Prevent infinite loop: only load once per key
    if (hasLoadedRef.current === key) {
      return;
    }
    hasLoadedRef.current = key;

    (async () => {
      let perf: PerformanceResponseDto;
      try {
        perf = performanceId
          ? await scoringService.getPerformance(performanceId)
          : await scoringService.getPerformanceByMatch(matchId);
      } catch (err) {
        console.error("Load performance failed", err);
        hasLoadedRef.current = ""; // Reset on error
        return;
      }

      // Check contentType (handle legacy QUYEN string from BE defensively)
      const contentTypeStr = (perf as unknown as { contentType?: string })
        .contentType;
      const isQuyen = contentTypeStr === "QUYEN" || perf.contentType === "FIST";
      const isMusic = perf.contentType === "MUSIC";

      // Check initial status - but don't auto-start, wait for user to click "Bắt đầu"
      const perfStatus = (perf as unknown as { status?: string })?.status;
      // Always start with isStarted = false, user must click "Bắt đầu" button
      setIsStarted(false);
      runningRef.current = false;
      startTimeMsRef.current = null;

      // Event title
      setEventTitle(
        `${perf.competitionName || "Giải đấu"} - ${
          isQuyen ? "QUYỀN" : "VÕ NHẠC"
        }`
      );
      // Format text
      setFormatText(
        `${isQuyen ? "Quyền" : "Võ nhạc"} – ${
          perf.isTeam ? "Đồng đội" : "Cá nhân"
        }`
      );
      // Team
      setTeam(
        (perf.athletes || []).map((a: { fullName?: string }) => ({
          name: a.fullName || "-",
        }))
      );
      // Judges -> always 5 assessors
      const idxMap: Record<string, number> = {};
      let names: string[] = [];
      if (perf.assessors && perf.assessors.length > 0) {
        perf.assessors.slice(0, 5).forEach((a, idx) => {
          if (a.id) idxMap[a.id] = idx + 1;
          if (a.userId) idxMap[a.userId] = idx + 1;
          names[idx] = a.fullName || `Assesor ${idx + 1}`;
        });
      }
      // pad names to length 5 with defaults
      names = new Array(5)
        .fill(0)
        .map((_, i) => names[i] || `Assesor ${i + 1}`);
      assessorIndexMapRef.current = idxMap;
      setJudgeNames(names);
      setJudgeScores(new Array(5).fill(0));
      setTotal(0);
      setHistory([]);
      // Time: try to get from competition.roundDurationSeconds
      const fmt = (secs: number) => {
        const m = Math.floor(secs / 60)
          .toString()
          .padStart(2, "0");
        const s = Math.floor(secs % 60)
          .toString()
          .padStart(2, "0");
        return `${m}:${s}`;
      };
      try {
        if (perf.competitionId) {
          const compRes = await api.get<CompetitionInfo>(
            API_ENDPOINTS.COMPETITIONS.BY_ID(perf.competitionId)
          );
          const pmRes = performanceId
            ? await api
                .get<PerformanceMatchInfo>(
                  API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(
                    performanceId
                  )
                )
                .catch(() => null)
            : null;

          type CompetitionInfo = {
            roundDurationSeconds?: number;
            assessorCount?: number;
          };
          type PerformanceMatchInfo = {
            id?: string;
            durationSeconds?: number;
            status?: string;
            actualStartTime?: string;
          } | null;
          const comp: CompetitionInfo = compRes?.data ?? {};
          const pm: PerformanceMatchInfo = pmRes ? pmRes.data ?? null : null;

          // Get PerformanceMatch ID for assessor connection tracking
          if (pmRes) {
            const pmData = pmRes.data as any;
            // Try different response structures
            const pmId =
              pmData?.id ||
              pmData?.data?.id ||
              (pm as any)?.id ||
              (typeof pmData === "object" && pmData !== null && "id" in pmData
                ? (pmData as any).id
                : null);
            if (pmId) {
              setPerformanceMatchId(pmId);
            }
          } else if (matchId) {
            // If we have matchId directly, use it
            setPerformanceMatchId(matchId);
          }

          // Ignore any local overrides for judges count; always use 5

          const seconds =
            pm && pm.durationSeconds != null
              ? Number(pm.durationSeconds)
              : comp?.roundDurationSeconds != null
              ? Number(comp.roundDurationSeconds)
              : NaN;
          if (Number.isFinite(seconds) && seconds > 0) {
            const display = fmt(seconds);
            setRoundTime(display);
            roundSecondsRef.current = seconds;
          } else {
            setRoundTime("02:00");
            roundSecondsRef.current = 120;
          }

          // Check if match is IN_PROGRESS and resume timer from actualStartTime
          // Priority: backend actualStartTime > localStorage > default
          if (pm && pm.status === "IN_PROGRESS") {
            if (pm.actualStartTime) {
              // Use backend actualStartTime (most accurate)
              try {
                const actualStart = new Date(pm.actualStartTime).getTime();
                const now = Date.now();
                const elapsedMs = now - actualStart;
                const elapsedSeconds = Math.floor(elapsedMs / 1000);
                const totalSeconds = roundSecondsRef.current;

                if (elapsedSeconds >= 0 && elapsedSeconds < totalSeconds) {
                  // Match is running, resume timer
                  const remaining = totalSeconds - elapsedSeconds;
                  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
                  const s = String(remaining % 60).padStart(2, "0");
                  setTimeLeft(`${m}:${s}`);
                  runningRef.current = true;
                  startTimeMsRef.current = actualStart;
                  setIsStarted(true);
                  // Update localStorage to sync with backend
                  if (projectionStorageKey) {
                    updateProjectionStorage({
                      isRunning: true,
                      startedAt: actualStart,
                      durationSeconds: totalSeconds,
                    });
                  }
                } else if (elapsedSeconds >= totalSeconds) {
                  // Match time has expired
                  setTimeLeft("00:00");
                  runningRef.current = false;
                  startTimeMsRef.current = null;
                  setIsStarted(false);
                } else {
                  // Match hasn't started yet (negative elapsed)
                  setTimeLeft(fmt(totalSeconds));
                  runningRef.current = false;
                  startTimeMsRef.current = null;
                  setIsStarted(false);
                }
              } catch (e) {
                console.warn(
                  "Failed to parse actualStartTime, falling back to localStorage",
                  e
                );
                // Fallback to localStorage if actualStartTime parsing fails
                setTimeLeft(fmt(roundSecondsRef.current));
                runningRef.current = false;
                startTimeMsRef.current = null;
                setIsStarted(false);
              }
            } else {
              // Backend says IN_PROGRESS but no actualStartTime yet (race condition)
              // Fallback to localStorage if available
              setTimeLeft(fmt(roundSecondsRef.current));
              runningRef.current = false;
              startTimeMsRef.current = null;
              setIsStarted(false);
              // Let the localStorage useEffect handle resume if available
            }
          } else {
            // Match not started or not IN_PROGRESS
            setTimeLeft(fmt(roundSecondsRef.current));
            runningRef.current = false;
            startTimeMsRef.current = null;
            setIsStarted(false);
          }

          // We always display 5 assessors; keep timing logic only
        } else {
          setRoundTime("02:00");
          setTimeLeft("02:00");
          roundSecondsRef.current = 120;
          runningRef.current = false;
          startTimeMsRef.current = null;
          setIsStarted(false);
        }
      } catch {
        // fallback to placeholder if competition fetch fails
        setRoundTime("02:00");
        setTimeLeft("02:00");
        roundSecondsRef.current = 120;
        runningRef.current = false;
        startTimeMsRef.current = null;
        setIsStarted(false);
      }
      // Content name: fetch by ID when available
      if (isQuyen && perf.fistItemId) {
        try {
          const res = await apiClient.get<unknown>(
            API_ENDPOINTS.FIST_CONTENTS.ITEM_BY_ID(perf.fistItemId)
          );
          // Handle both wrapped and direct response formats
          const data = (res as { data?: unknown })?.data as
            | { data?: { name?: string } }
            | { name?: string }
            | undefined;
          const name =
            (data as { data?: { name?: string } })?.data?.name ||
            (data as { name?: string })?.name ||
            "";
          setContentName(name);
        } catch (err) {
          console.error("Failed to fetch fist item name", err);
        }
      } else if (isMusic && perf.musicContentId) {
        try {
          const res = await apiClient.get<unknown>(
            API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(perf.musicContentId)
          );
          // Handle both wrapped and direct response formats
          const data = (res as { data?: unknown })?.data as
            | { data?: { name?: string } }
            | { name?: string }
            | undefined;
          const name =
            (data as { data?: { name?: string } })?.data?.name ||
            (data as { name?: string })?.name ||
            "";
          setContentName(name);
        } catch (err) {
          console.error("Failed to fetch music content name", err);
        }
      } else {
        setContentName("Đang cập nhật…");
      }
    })();
  }, [performanceId, matchId]);

  // WebSocket: subscribe to status and score events
  // Removed timeLeft from dependencies to prevent infinite reconnection loop
  useEffect(() => {
    const key = performanceId || matchId;
    if (!key) return;

    const wsUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "") + "/ws"
      : "http://localhost:8080/ws";
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket as unknown as IStompSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        const pid = performanceId; // prefer performanceId
        if (!pid) return;

        // Status subscription: start/stop countdown
        client.subscribe(
          `/topic/performance/${pid}/status`,
          (msg: { body: string }) => {
            try {
              const payload = JSON.parse(msg.body) as {
                status?: string;
                startTime?: string;
              };
              if (!payload) return;
              // Only update status from WebSocket if user has already clicked "Bắt đầu"
              // This prevents auto-starting when status is IN_PROGRESS from backend
              if (payload.status === "IN_PROGRESS" && isStarted) {
                runningRef.current = true;
                startTimeMsRef.current = payload.startTime
                  ? Date.parse(payload.startTime)
                  : Date.now();
              } else if (
                payload.status === "COMPLETED" ||
                payload.status === "CANCELLED"
              ) {
                runningRef.current = false;
                // Don't reset isStarted to false - match has already started, don't show "Bắt đầu" button again
                // Keep isStarted = true so button doesn't reappear
                startTimeMsRef.current = null;
                setTimeLeft("00:00");
              }
              // Don't auto-start if status is IN_PROGRESS but user hasn't clicked "Bắt đầu"
            } catch {
              // ignore parse issues
            }
          }
        );

        // Score subscription: update judge scores and history immediately
        // Track assessor to slot mapping to prevent duplicates
        const assessorSlotMap = new Map<string, number>();
        client.subscribe(
          `/topic/performance/${pid}/score-submitted`,
          (msg: { body: string }) => {
            try {
              const payload = JSON.parse(msg.body) as {
                assessorId?: string;
                score?: number;
                submittedAt?: string;
              };
              if (!payload || typeof payload.score !== "number") return;
              const assessorIdKey = payload.assessorId || "";

              // Get index from assessorIndexMap first (preferred)
              let idx = assessorIdKey
                ? assessorIndexMapRef.current[assessorIdKey]
                : undefined;

              // If not in map, check if we've already assigned a slot for this assessor
              if (!idx && assessorIdKey) {
                idx = assessorSlotMap.get(assessorIdKey);
              }

              // If still no index, find first available slot (value is 0)
              if (!idx) {
                setJudgeScores((prev) => {
                  const firstZeroIndex = prev.findIndex((v) => v === 0);
                  if (firstZeroIndex >= 0 && assessorIdKey) {
                    // Remember this mapping to prevent duplicates
                    assessorSlotMap.set(assessorIdKey, firstZeroIndex + 1);
                    idx = firstZeroIndex + 1;
                  }
                  return prev;
                });
              }

              // Update score at the correct slot
              setJudgeScores((prev) => {
                const next = [...prev];
                if (idx && idx >= 1 && idx <= next.length) {
                  next[idx - 1] = payload.score as number;
                }
                // Compute average of submitted scores (ignore zeros and non-finite)
                const valid = next.filter((v) => Number.isFinite(v) && v > 0);
                const sum = valid.reduce((a, b) => a + b, 0);
                const avg = valid.length > 0 ? sum / valid.length : 0;
                const rounded = Math.round(avg * 100) / 100;
                setTotal(rounded);

                // Check if all 5 judges have scored (all scores > 0)
                const allScored =
                  valid.length >= 5 &&
                  next.filter((v) => Number.isFinite(v) && v > 0).length >= 5;
                if (allScored && !allJudgesScoredRef.current) {
                  allJudgesScoredRef.current = true;
                  // Don't navigate immediately - wait for timer to finish, then wait 5 more seconds
                  // Navigation will be handled in the timer countdown effect when time reaches 00:00
                }

                return next;
              });

              // de-duplicate history by (assessorId, score, timestamp)
              const key = `${assessorIdKey}:${payload.score}:${
                payload.submittedAt || ""
              }`;
              if (historyKeysRef.current.has(key)) return;
              historyKeysRef.current.add(key);

              // Calculate time elapsed from match start
              let timeStr = "";
              if (startTimeMsRef.current) {
                const now = Date.now();
                const elapsedMs = now - startTimeMsRef.current;
                const elapsedSeconds = Math.floor(elapsedMs / 1000);
                const minutes = Math.floor(elapsedSeconds / 60);
                const seconds = elapsedSeconds % 60;
                timeStr = `${minutes}:${String(seconds).padStart(2, "0")}`;
              }

              setHistory((prev) =>
                [
                  { score: payload.score!, time: timeStr, judge: idx || 0 },
                  ...prev,
                ].slice(0, 100)
              );
            } catch {
              // ignore parse issues
            }
          }
        );
      },
    });
    client.activate();
    stompRef.current = client;
    return () => {
      if (stompRef.current?.connected) stompRef.current.deactivate();
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [performanceId, matchId, navigate]);

  // WebSocket: subscribe to assessor connection status for real-time updates
  useEffect(() => {
    const pmId = performanceMatchId || matchId;
    if (!pmId) return;

    // Wait for WebSocket to be connected
    const checkAndSubscribe = () => {
      if (!stompRef.current || !stompRef.current.connected) {
        return null;
      }

      const client = stompRef.current;

      // Subscribe to assessor connection status
      const subscription = client.subscribe(
        `/topic/match/${pmId}/assessor-connections`,
        (msg: { body: string }) => {
          try {
            const payload = JSON.parse(msg.body) as {
              connectedCount?: number;
              connectedAssessors?: string[];
            };
            console.log("Assessor connection update received:", payload);
            if (payload && typeof payload.connectedCount === "number") {
              setConnectedAssessorsCount(payload.connectedCount);
              console.log(
                `Updated connected assessors count: ${payload.connectedCount}/5`
              );
            }
          } catch (e) {
            console.error("Error parsing assessor connection status:", e);
          }
        }
      );

      // Request initial connection status
      setTimeout(() => {
        if (client.connected) {
          console.log(
            "Requesting initial assessor connection status for match:",
            pmId
          );
          client.publish({
            destination: `/app/match/connections/request`,
            body: JSON.stringify({ matchId: pmId }),
          });
        }
      }, 500);

      return () => {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing from assessor connections:", e);
        }
      };
    };

    // Try immediately if already connected
    let cleanup: (() => void) | null = null;
    if (stompRef.current?.connected) {
      cleanup = checkAndSubscribe();
    }

    // If not connected yet, wait and retry
    let interval: NodeJS.Timeout | null = null;
    if (!stompRef.current?.connected) {
      interval = setInterval(() => {
        if (stompRef.current?.connected) {
          cleanup = checkAndSubscribe();
          if (cleanup && interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      }, 500);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [performanceMatchId, matchId]);

  // Local countdown based on startTime and roundSeconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!runningRef.current || !startTimeMsRef.current) return;
      const elapsed = (Date.now() - startTimeMsRef.current) / 1000;
      const remaining = Math.max(
        0,
        Math.floor(roundSecondsRef.current - elapsed)
      );
      const m = String(Math.floor(remaining / 60)).padStart(2, "0");
      const s = String(remaining % 60).padStart(2, "0");
      setTimeLeft(`${m}:${s}`);
      if (remaining <= 0) {
        // Set time to 00:00 immediately when time expires
        setTimeLeft("00:00");
        runningRef.current = false;
        updateProjectionStorageRef.current({
          isRunning: false,
          startedAt: null,
        });
        if (!completionSentRef.current) {
          completionSentRef.current = true;
          // PerformanceMatch status is now the source of truth, it will sync to Performance automatically
          const finalizeMatchStatus = async () => {
            try {
              let pmId = matchId;
              if (!pmId && performanceId) {
                const res = await api.get<{
                  data?:
                    | { data?: { id?: string } | { id?: string } }
                    | { id?: string };
                }>(
                  API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(
                    performanceId
                  )
                );
                const payload = res?.data;
                const pm = (payload && (payload.data || payload)) as
                  | { id?: string }
                  | undefined;
                pmId = pm?.id || pmId;
              }
              // Update PerformanceMatch status, which will sync to Performance
              if (pmId) {
                await api.put(
                  `/v1/performance-matches/${encodeURIComponent(
                    pmId
                  )}/status/COMPLETED`
                );
              } else if (performanceId) {
                // Fallback: if no PerformanceMatch, update Performance directly
                await api.put(
                  API_ENDPOINTS.PERFORMANCES.COMPLETE(performanceId)
                );
              }
            } catch {
              // ignore errors
            }
          };
          finalizeMatchStatus();

          // Navigate to result screen after 5 seconds, but only if all judges have scored
          if (allJudgesScoredRef.current) {
            if (redirectTimerRef.current) {
              clearTimeout(redirectTimerRef.current);
            }
            redirectTimerRef.current = window.setTimeout(() => {
              const resultUrl = performanceId
                ? `/performance/result?performanceId=${encodeURIComponent(
                    performanceId
                  )}`
                : `/performance/result?matchId=${encodeURIComponent(matchId)}`;
              navigate(resultUrl);
            }, 5000); // 5 seconds delay after timer expires
          }
        }
      }
    }, 500);
    return () => clearInterval(timer);
    // Dependencies: matchId and performanceId are stable, no need to re-run effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to start the match
  const handleStartMatch = async () => {
    if (!performanceId && !matchId) {
      console.error("Missing performanceId or matchId");
      return;
    }

    // Check if all 5 assessors are connected
    if (connectedAssessorsCount < 5) {
      alert(
        `Vui lòng đợi đủ 5 giám định kết nối. Hiện tại: ${connectedAssessorsCount}/5`
      );
      return;
    }

    setIsStarting(true);
    try {
      let pmId = matchId;

      // If we have performanceId but not matchId, try to get PerformanceMatch ID
      if (!pmId && performanceId) {
        try {
          const res = await api.get<{
            data?: { id?: string } | { id?: string };
            id?: string;
          }>(API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(performanceId));
          const payload = res?.data;
          const pm = (payload && (payload.data || payload)) as
            | { id?: string }
            | undefined;
          pmId = pm?.id || pmId;
        } catch (error) {
          console.warn("Failed to get PerformanceMatch ID:", error);
        }
      }

      // Start the match by updating status to IN_PROGRESS
      if (pmId) {
        await api.put(
          `/v1/performance-matches/${encodeURIComponent(
            pmId
          )}/status/IN_PROGRESS`
        );
      } else if (performanceId) {
        // Fallback: update Performance status directly
        await api.put(API_ENDPOINTS.PERFORMANCES.START(performanceId));
      } else {
        throw new Error("No PerformanceMatch ID or Performance ID available");
      }

      const startedAt = Date.now();
      setIsStarted(true);
      runningRef.current = true;
      startTimeMsRef.current = startedAt;
      updateProjectionStorage({
        startedAt,
        isRunning: true,
        durationSeconds: roundSecondsRef.current,
      });
    } catch (error) {
      console.error("Failed to start match:", error);
      alert("Không thể bắt đầu trận đấu. Vui lòng thử lại.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="bg-[#F5F7FB] min-h-screen flex flex-col items-center justify-start py-4">
      {/* Header / Info */}
      <div className="w-full max-w-[1400px] rounded-xl bg-white px-8 py-4 mb-3 flex flex-col gap-2 shadow-sm border border-gray-100">
        <div className="font-bold text-[22px] md:text-[20px] text-[#0F172A] pb-2 border-b-2 border-blue-100">
          {eventTitle}
        </div>
        <div className="flex flex-row flex-wrap gap-8 items-center text-[13px]">
          <div>
            <span className="font-semibold text-gray-600 mr-2">HÌNH THỨC</span>
            <span className="text-black font-medium">{formatText}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600 mr-2">NỘI DUNG</span>
            <span className="text-black font-medium">{contentName || ""}</span>
          </div>
          <div
            className={`text-xs rounded-md px-4 py-1 font-semibold border ${
              connectedAssessorsCount >= 5
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200"
            }`}
          >
            Đã kết nối: {connectedAssessorsCount}/5 giám định
          </div>
          <div className="ml-auto text-xs bg-green-100 rounded-md px-4 py-1 font-semibold text-[#226e39] border border-green-200">
            Thời gian thi đấu: {roundTime}
          </div>
        </div>
      </div>
      {/* Main Layout */}
      <div className="w-full max-w-[1400px] flex flex-col gap-6 px-2 md:px-0">
        {/* Row 1: Team & Timer */}
        <div className="grid md:grid-cols-5 grid-cols-1 gap-6">
          {/* Team: 3/5 */}
          <div className="md:col-span-3 col-span-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white rounded-xl shadow-sm p-5 min-h-[100px]">
            {team.map((mem, i) => (
              <div
                key={i}
                className="bg-[#F8FAFC] rounded-lg border border-gray-200 px-4 py-3 text-[15px] md:text-sm font-medium text-black flex flex-col text-xs sm:text-base"
              >
                <span className="font-semibold text-[15px] md:text-base text-[#0F172A]">
                  {mem.name}
                </span>
                {mem.unit ? (
                  <span className="text-gray-500 text-[12px] mt-0.5">
                    Đơn vị: {mem.unit}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {/* Timer: 2/5 */}
          <div className="md:col-span-2 col-span-1 flex flex-col justify-center items-center bg-white rounded-xl shadow-sm p-7 min-h-[170px] mt-3 md:mt-0">
            <div className="text-[26px] sm:text-[20px] font-semibold text-gray-500 mb-3 tracking-wide">
              THỜI GIAN
            </div>
            <div className="text-[76px] sm:text-[52px] font-extrabold text-[#1D4ED8] leading-none tracking-wider">
              {timeLeft}
            </div>
            {!isStarted && (
              <button
                onClick={handleStartMatch}
                disabled={isStarting || connectedAssessorsCount < 5}
                className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
                title={
                  connectedAssessorsCount < 5
                    ? `Cần đủ 5 giám định kết nối. Hiện tại: ${connectedAssessorsCount}/5`
                    : ""
                }
              >
                {isStarting ? "Đang bắt đầu..." : "Bắt đầu"}
              </button>
            )}
          </div>
        </div>
        {/* Row 2: Judges */}
        <div className="grid md:grid-cols-5 grid-cols-2 gap-3 md:gap-6">
          {judgeScores.map((score, idx) => (
            <div
              key={idx}
              className="flex flex-col text-center items-center justify-center border border-gray-200 rounded-xl bg-gray-50 px-5 py-8 min-w-[88px] md:min-w-[104px] min-h-[150px] shadow-sm text-xs sm:text-base"
            >
              <div className="text-gray-600 text-[13px] md:text-[15px] mb-2 font-semibold">
                {judgeNames[idx] || `Assesor ${idx + 1}`}
              </div>
              <div className="text-[38px] md:text-[40px] font-extrabold tracking-wide text-[#111827]">
                {score}
              </div>
            </div>
          ))}
        </div>
        {/* Row 3: Total & History */}
        <div className="grid md:grid-cols-5 grid-cols-1 gap-3 md:gap-6">
          <div className="md:col-span-2 col-span-1 bg-[#FACC15] rounded-xl flex flex-col items-center justify-center min-h-[140px] md:min-h-[150px] shadow font-bold mb-3 md:mb-0">
            <div className="text-[#374151] font-semibold text-xl pb-2 pt-3 tracking-wide">
              TỔNG ĐIỂM
            </div>
            <div className="text-5xl md:text-5xl font-black text-black pb-3">
              {total}
            </div>
          </div>
          <div className="md:col-span-3 col-span-1 bg-white rounded-xl flex flex-col justify-center border border-gray-200 p-5 min-h-[120px] shadow-sm overflow-auto">
            <table className="w-full text-[13px] md:text-sm text-[#0F172A] table-fixed">
              <thead>
                <tr className="border-b text-gray-500 font-semibold">
                  <th className="text-left w-1/4">#</th>
                  <th className="text-left w-1/4">ĐIỂM</th>
                  <th className="text-left w-1/4">THỜI GIAN</th>
                  <th className="text-left w-1/4">GIÁM ĐỊNH</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-b-0 h-10">
                    <td className="text-gray-600">{idx + 1}</td>
                    <td className="font-semibold">+{item.score}</td>
                    <td className="text-gray-600 font-medium">
                      {item.time || "-"}
                    </td>
                    <td className="text-gray-700">
                      {judgeNames[(item.judge || 1) - 1] ||
                        `Assesor ${item.judge}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectionScreen;
