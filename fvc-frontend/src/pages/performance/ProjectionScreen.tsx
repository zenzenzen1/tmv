import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const stompRef = useRef<Client | null>(null);
  const assessorIndexMapRef = useRef<Record<string, number>>({});
  const historyKeysRef = useRef<Set<string>>(new Set());
  const roundSecondsRef = useRef<number>(120);
  const startTimeMsRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);
  const completionSentRef = useRef<boolean>(false);

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
            durationSeconds?: number;
            status?: string;
            actualStartTime?: string;
          } | null;
          const comp: CompetitionInfo = compRes?.data ?? {};
          const pm: PerformanceMatchInfo = pmRes ? pmRes.data ?? null : null;

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
            setTimeLeft(display);
            roundSecondsRef.current = seconds;
          } else {
            setRoundTime("02:00");
            setTimeLeft("02:00");
            roundSecondsRef.current = 120;
          }

          // We always display 5 assessors; keep timing logic only
        } else {
          setRoundTime("02:00");
          setTimeLeft("02:00");
        }
      } catch {
        // fallback to placeholder if competition fetch fails
        setRoundTime("02:00");
        setTimeLeft("02:00");
      }
      // If backend already in progress, start local countdown immediately
      try {
        const statusStr = (perf as unknown as { status?: string })?.status;
        const startTimeStr = (perf as unknown as { startTime?: string })
          ?.startTime;
        if (statusStr === "IN_PROGRESS") {
          runningRef.current = true;
          startTimeMsRef.current = startTimeStr
            ? Date.parse(startTimeStr)
            : Date.now();
        } else {
          runningRef.current = false;
          startTimeMsRef.current = null;
        }
      } catch {
        // ignore parse issues
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
              if (payload.status === "IN_PROGRESS") {
                runningRef.current = true;
                startTimeMsRef.current = payload.startTime
                  ? Date.parse(payload.startTime)
                  : Date.now();
              } else if (
                payload.status === "COMPLETED" ||
                payload.status === "CANCELLED"
              ) {
                runningRef.current = false;
                startTimeMsRef.current = null;
                setTimeLeft("00:00");
              }
            } catch {
              // ignore parse issues
            }
          }
        );
        // Score subscription: update judge scores and history immediately
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
              const idx = payload.assessorId
                ? assessorIndexMapRef.current[payload.assessorId]
                : undefined;
              setJudgeScores((prev) => {
                const next = [...prev];
                if (idx && idx >= 1 && idx <= next.length) {
                  next[idx - 1] = payload.score as number;
                } else {
                  const zeroAt = next.findIndex((v) => v === 0);
                  if (zeroAt >= 0) next[zeroAt] = payload.score as number;
                }
                // Compute average of submitted scores (ignore zeros and non-finite)
                const valid = next.filter((v) => Number.isFinite(v) && v > 0);
                const sum = valid.reduce((a, b) => a + b, 0);
                const avg = valid.length > 0 ? sum / valid.length : 0;
                const rounded = Math.round(avg * 100) / 100;
                setTotal(rounded);
                return next;
              });
              // de-duplicate history by (assessorId, score)
              const key = `${payload.assessorId || "_"}:${payload.score}`;
              if (historyKeysRef.current.has(key)) return;
              historyKeysRef.current.add(key);
              setHistory((prev) =>
                [
                  { score: payload.score!, time: "", judge: idx || 0 },
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
    };
    // Removed timeLeft from dependencies - it updates every 500ms and causes infinite reconnection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceId, matchId]);

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
        runningRef.current = false;
        if (!completionSentRef.current) {
          completionSentRef.current = true;
          // PerformanceMatch status is now the source of truth, it will sync to Performance automatically
          const finalizeMatchStatus = async () => {
            try {
              let pmId = matchId;
              if (!pmId && performanceId) {
                const res = await api.get(
                  API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(
                    performanceId
                  )
                );
                const payload: any = (res as any)?.data;
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
            } catch (_) {
              // ignore errors
            }
          };
          finalizeMatchStatus();
        }
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);
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
            <div className="text-[#374151] font-semibold text-xl pb-2 pt-3 md:text-xl text-lg tracking-wide">
              TỔNG ĐIỂM
            </div>
            <div className="text-5xl md:text-5xl font-black text-black pb-3">
              {total}
            </div>
          </div>
          <div className="md:col-span-3 col-span-1 bg-white rounded-xl flex flex-col justify-center border border-gray-200 p-5 min-h-[120px] shadow-sm overflow-auto">
            <table className="w-full text-[13px] md:text-sm text-[#0F172A]">
              <thead>
                <tr className="border-b text-gray-500 font-semibold">
                  <th className="text-left w-12">#</th>
                  <th className="text-left w-24">ĐIỂM</th>
                  <th className="text-left">GIÁM ĐỊNH</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-b-0 h-10">
                    <td className="text-gray-600">{idx + 1}</td>
                    <td className="font-semibold">+{item.score}</td>
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
