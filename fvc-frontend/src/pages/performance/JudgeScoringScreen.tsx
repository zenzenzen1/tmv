import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import type { IStompSocket } from "@stomp/stompjs";
import type { ErrorResponse } from "../../types/api";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { scoringService } from "../../services/scoringService";

const JudgeScoringScreen: React.FC = () => {
  const [params] = useSearchParams();
  const performanceId = params.get("performanceId") || "";
  const assessorId = params.get("assessorId") || "";
  const performanceMatchId = params.get("performanceMatchId") || "";
  const [value, setValue] = useState("0");
  const [status, setStatus] = useState<string>("PENDING");
  const [canScore, setCanScore] = useState<boolean>(false);
  const [hasScored, setHasScored] = useState<boolean>(false);
  const [assessorName, setAssessorName] = useState<string>("");
  const judgeNumber = Number(params.get("position") || 0) || 1;
  const stompRef = useRef<Client | null>(null);

  // Refresh status periodically to avoid race conditions
  const refreshStatus = useCallback(async () => {
    if (!performanceId) return;
    try {
      // Load both Performance and PerformanceMatch status
      const [perfRes, pmRes] = await Promise.allSettled([
        scoringService.getPerformance(performanceId),
        performanceMatchId
          ? api.get<unknown>(
              API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(performanceId)
            )
          : Promise.resolve(null),
      ]);

      // Get status from PerformanceMatch (primary) or Performance (fallback)
      // PerformanceMatch status is the actual match status, Performance status might be outdated
      let finalStatus = "PENDING";

      // Get PerformanceMatch status first (this is the actual match status)
      if (pmRes.status === "fulfilled" && pmRes.value) {
        const res = pmRes.value as { data?: unknown };
        const base = res?.data as
          | { data?: { status?: string } }
          | { status?: string }
          | undefined;
        const pm =
          (base && (base as { data?: { status?: string } }).data) ||
          (base as { status?: string });
        const pmStatus = pm?.status?.toUpperCase();
        console.log("PerformanceMatch status:", pmStatus);
        if (pmStatus) {
          // Map READY to PENDING for display (both mean "not started yet")
          // Only IN_PROGRESS and COMPLETED are actual match states
          if (pmStatus === "READY") {
            finalStatus = "PENDING";
            console.log("Mapped READY to PENDING for display");
          } else {
            finalStatus = pmStatus;
            console.log("Using PerformanceMatch status:", finalStatus);
          }
        }
      } else {
        console.log("PerformanceMatch not available or failed");
      }

      // Fallback to Performance status only if PerformanceMatch status is not available
      // IMPORTANT: If PerformanceMatch exists and is READY/PENDING, NEVER use Performance IN_PROGRESS
      const hasPerformanceMatch = pmRes.status === "fulfilled" && pmRes.value;
      const performanceMatchIsNotStarted = finalStatus === "PENDING"; // This means READY was mapped to PENDING, or it's actually PENDING

      if (finalStatus === "PENDING" && perfRes.status === "fulfilled") {
        const perf = perfRes.value;
        const s = (perf as unknown as { status?: string })?.status;
        if (s) {
          const perfStatus = s.toUpperCase();
          console.log("Performance status:", perfStatus);

          // If PerformanceMatch exists and is READY/PENDING, NEVER trust Performance IN_PROGRESS
          // PerformanceMatch status is the source of truth for the actual match
          if (hasPerformanceMatch && performanceMatchIsNotStarted) {
            if (perfStatus === "IN_PROGRESS" || perfStatus === "COMPLETED") {
              console.log(
                "Ignoring Performance IN_PROGRESS/COMPLETED because PerformanceMatch is READY/PENDING (not started)"
              );
              // Keep finalStatus as PENDING (from PerformanceMatch) - DO NOT override
            } else {
              // Only use Performance status if it's PENDING (matches PerformanceMatch)
              finalStatus = perfStatus;
              console.log(
                "Using Performance status (matches PerformanceMatch):",
                finalStatus
              );
            }
          } else {
            // No PerformanceMatch or PerformanceMatch is IN_PROGRESS/COMPLETED, use Performance status
            finalStatus = perfStatus;
            console.log(
              "Using Performance status (no PerformanceMatch or match started):",
              finalStatus
            );
          }
        }
        // Load assessor name
        const assessors = perf.assessors || [];
        const found = assessors.find(
          (a) => a.id === assessorId || a.userId === assessorId
        );
        if (found?.fullName) setAssessorName(found.fullName);
      }

      // Check if assessor has already scored by calling API
      if (performanceId && assessorId) {
        try {
          const scoresRes = await api.get<
            Array<{
              assessor?: { id?: string; userId?: string };
              id?: string;
            }>
          >(`/v1/performance-scoring/performance/${performanceId}/scores`);
          const scores = scoresRes.data || [];
          const assessorScored = scores.some(
            (s) =>
              s.assessor?.id === assessorId || s.assessor?.userId === assessorId
          );
          if (assessorScored) {
            setHasScored(true);
          }
        } catch (err) {
          // Ignore errors - will be handled by WebSocket or on submit
          console.warn("Failed to check if assessor has scored:", err);
        }
      }

      console.log("Final status determined:", finalStatus);
      setStatus(finalStatus);
      // Allow scoring when status is IN_PROGRESS or COMPLETED, but only if not already scored
      // READY = setup done but not started (can join but cannot score)
      // PENDING = not setup (can join but cannot score)
      // IN_PROGRESS = ongoing (can score)
      // COMPLETED = finished (can score)
      const allowScore =
        (finalStatus === "IN_PROGRESS" || finalStatus === "COMPLETED") &&
        !hasScored;
      console.log("Can score:", allowScore);
      setCanScore(allowScore);
    } catch (err) {
      console.error("Failed to refresh status", err);
    }
  }, [performanceId, assessorId, performanceMatchId, hasScored]);

  useEffect(() => {
    // Load initial status once
    refreshStatus();
    // Polling removed - WebSocket handles all real-time status updates
    // If WebSocket fails, the page can be manually refreshed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceId, assessorId, performanceMatchId]);

  useEffect(() => {
    if (!performanceId) return;
    const wsUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "") + "/ws"
      : "http://localhost:8080/ws";
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket as unknown as IStompSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to performance status
        client.subscribe(
          `/topic/performance/${performanceId}/status`,
          (msg) => {
            try {
              const payload = JSON.parse(msg.body) as {
                status?: string;
                startTime?: string;
              };
              // If backend sends status, update immediately without delay
              if (payload?.status) {
                const newStatus = payload.status.toUpperCase();
                setStatus(newStatus);
                setCanScore(
                  (newStatus === "IN_PROGRESS" || newStatus === "COMPLETED") &&
                    !hasScored
                );
                // Don't call refreshStatus here to avoid flickering - WebSocket is source of truth
                return;
              } else if (payload?.startTime) {
                // Only set IN_PROGRESS if we have startTime AND status is actually IN_PROGRESS
                // Don't auto-set to IN_PROGRESS just because startTime exists
                // Let refreshStatus handle the actual status check
                refreshStatus();
                return;
              }
              // Only refresh if no status was provided (fallback)
              refreshStatus();
            } catch (e) {
              console.warn("WS status parse error", e);
            }
          }
        );

        // Subscribe to score-submitted to detect when this assessor has scored
        if (performanceId && assessorId) {
          client.subscribe(
            `/topic/performance/${performanceId}/score-submitted`,
            (msg) => {
              try {
                const payload = JSON.parse(msg.body) as {
                  type?: string;
                  assessorId?: string;
                  userId?: string;
                };
                // If this assessor submitted a score, mark as scored
                if (
                  payload?.assessorId === assessorId ||
                  payload?.userId === assessorId
                ) {
                  setHasScored(true);
                  setCanScore(false);
                }
              } catch (e) {
                console.warn("WS score-submitted parse error", e);
              }
            }
          );
        }

        // Register assessor connection for real-time tracking on projection screen
        if (performanceMatchId && assessorId) {
          setTimeout(() => {
            if (client.connected) {
              console.log("Registering assessor connection:", {
                matchId: performanceMatchId,
                assessorId,
              });
              client.publish({
                destination: "/app/assessor/register",
                body: JSON.stringify({
                  matchId: performanceMatchId,
                  assessorId: assessorId,
                }),
              });
            }
          }, 500);
        }
      },
    });
    client.activate();
    stompRef.current = client;
    return () => {
      // Unregister assessor connection on disconnect
      if (stompRef.current?.connected && performanceMatchId && assessorId) {
        try {
          stompRef.current.publish({
            destination: "/app/assessor/unregister",
            body: JSON.stringify({
              matchId: performanceMatchId,
              assessorId: assessorId,
            }),
          });
        } catch (e) {
          console.error("Error unregistering assessor:", e);
        }
      }
      if (stompRef.current?.connected) stompRef.current.deactivate();
    };
    // Removed refreshStatus from dependencies - it's a function that changes on every render
    // WebSocket handles real-time updates, refreshStatus is only called manually when needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceId, performanceMatchId, assessorId]);

  const handleNumClick = (num: string) => {
    if (!canScore) return; // Don't allow input when scoring is disabled
    const next = value === "0" ? num : value + num;
    // Allow up to 3 digits
    if (next.length > 3) return;
    const n = Number(next);
    if (!Number.isFinite(n)) return;
    // Cap at 100; allow exactly 100
    if (n > 100) return;
    setValue(next);
  };
  const handleClear = () => setValue("0");
  const handleConfirm = () => {
    if (!canScore || !performanceId || !assessorId || hasScored) return;
    const scoreNum = Number(value);
    if (!Number.isFinite(scoreNum)) return;
    scoringService
      .submitScore({ performanceId, assessorId, score: scoreNum })
      .then(() => {
        alert("Đã gửi điểm: " + scoreNum);
        setValue("0");
        setHasScored(true); // Mark as scored to disable further scoring
      })
      .catch((err: ErrorResponse | unknown) => {
        let msg = "Gửi điểm thất bại";
        if (typeof err === "object" && err !== null) {
          const withMsg = err as { message?: string };
          const withData = err as { data?: { message?: string } };
          msg = withMsg.message || withData.data?.message || msg;

          // If error is "Score already submitted", mark as scored
          const errorMsg = (
            withMsg.message ||
            withData.data?.message ||
            ""
          ).toLowerCase();
          if (
            errorMsg.includes("already submitted") ||
            errorMsg.includes("đã được gửi")
          ) {
            setHasScored(true);
            setCanScore(false);
          }
        }
        alert(msg);
      });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-[700px] bg-white border-0 rounded-xl shadow p-4 flex flex-col gap-6 items-center">
        <div className="w-full flex flex-row items-center justify-between mb-4">
          <span className="text-base text-black font-semibold">
            {assessorName ? (
              <>
                Giám định: <strong>{assessorName}</strong>
              </>
            ) : (
              <>
                Assesor số: <strong>{judgeNumber}</strong>
              </>
            )}
          </span>
          <span
            className="px-4 py-1 rounded text-xs border font-semibold"
            style={
              status === "IN_PROGRESS"
                ? {
                    backgroundColor: "#E3F2FD",
                    color: "#2196F3",
                    borderColor: "#BBDEFB",
                  }
                : status === "COMPLETED"
                ? {
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                    borderColor: "#E5E7EB",
                  }
                : {
                    backgroundColor: "#FFF7ED",
                    color: "#9A3412",
                    borderColor: "#FED7AA",
                  }
            }
          >
            Trạng thái:{" "}
            {status === "IN_PROGRESS"
              ? "Đang diễn ra"
              : status === "COMPLETED"
              ? "Kết thúc"
              : status === "READY" || status === "PENDING"
              ? "Chưa bắt đầu"
              : "Chưa bắt đầu"}
          </span>
          <span className="text-base text-gray-700 font-medium">Sân: ?</span>
        </div>
        <div
          className="w-full relative flex flex-row items-center justify-center mb-2 mt-2"
          style={{ minHeight: "60px" }}
        >
          <div className="flex-1 flex justify-center items-center">
            <span className="text-[40px] font-bold text-black select-none">
              {value || "0"}
            </span>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <button
              aria-label="clear"
              onClick={handleClear}
              disabled={!canScore}
              className={`p-2 rounded-md border border-gray-300 bg-white shadow-sm transition flex items-center justify-center ${
                canScore ? "hover:bg-gray-100" : "opacity-50 cursor-not-allowed"
              }`}
              style={{ fontSize: 28, minWidth: 40, minHeight: 40 }}
            >
              {/* Left straight arrow icon SVG */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 36 36"
                fill="none"
                stroke="#111"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="31" y1="18" x2="8" y2="18" />
                <polyline points="15,25 8,18 15,11" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-2 w-full justify-center">
          {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              className={`h-16 w-[96px] text-3xl rounded-lg border font-bold transition-all duration-75 ${
                ["8", "9"].includes(num)
                  ? "bg-yellow-200 border-yellow-300"
                  : "bg-gray-50 border-gray-200"
              } ${
                canScore
                  ? "hover:bg-yellow-100"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => handleNumClick(num)}
              disabled={!canScore}
            >
              {num}
            </button>
          ))}
        </div>
        {!canScore && (status === "PENDING" || status === "READY") && (
          <div className="mt-4 px-6 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-yellow-800 font-semibold">
              Trận chưa bắt đầu
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              Bạn có thể tham gia nhưng chỉ được chấm điểm khi trận đã bắt đầu.
            </div>
          </div>
        )}
        {hasScored && (
          <div className="mt-4 px-6 py-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-green-800 font-semibold">Đã chấm điểm</div>
            <div className="text-sm text-green-700 mt-1">
              Bạn đã gửi điểm cho trận đấu này. Không thể chấm điểm thêm lần
              nữa.
            </div>
          </div>
        )}
        <button
          className="mt-8 bg-green-600 hover:bg-green-700 text-white rounded px-8 py-4 text-xl font-bold w-full max-w-md shadow disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleConfirm}
          disabled={!canScore || hasScored}
          title={
            hasScored
              ? "Bạn đã chấm điểm rồi"
              : !canScore
              ? "Chỉ được chấm điểm khi trận đã bắt đầu"
              : ""
          }
        >
          {hasScored ? "ĐÃ CHẤM ĐIỂM" : "XÁC NHẬN"}
        </button>
      </div>
    </div>
  );
};

export default JudgeScoringScreen;
