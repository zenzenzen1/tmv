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
  const [assessorName, setAssessorName] = useState<string>("");
  const [notAllowed, setNotAllowed] = useState<boolean>(true);
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

      // Get status from Performance (primary) or PerformanceMatch (fallback)
      let finalStatus = "PENDING";

      // Get Performance status first
      if (perfRes.status === "fulfilled") {
        const perf = perfRes.value;
        const s = (perf as unknown as { status?: string })?.status;
        if (s) {
          finalStatus = s.toUpperCase();
        }
        // Load assessor name
        const assessors = perf.assessors || [];
        const found = assessors.find(
          (a) => a.id === assessorId || a.userId === assessorId
        );
        if (found?.fullName) setAssessorName(found.fullName);
      }

      // Fallback to PerformanceMatch status if Performance status is PENDING
      if (
        finalStatus === "PENDING" &&
        pmRes.status === "fulfilled" &&
        pmRes.value
      ) {
        const res = pmRes.value as { data?: unknown };
        const base = res?.data as
          | { data?: { status?: string } }
          | { status?: string }
          | undefined;
        const pm =
          (base && (base as { data?: { status?: string } }).data) ||
          (base as { status?: string });
        const pmStatus = pm?.status?.toUpperCase();
        if (pmStatus) {
          finalStatus = pmStatus;
        }
      }

      setStatus(finalStatus);
      // Only allow scoring when status is COMPLETED
      // READY = setup done but not started (not allowed)
      // IN_PROGRESS = ongoing (not allowed)
      // PENDING = not setup (not allowed)
      const allowScore = finalStatus === "COMPLETED";
      setCanScore(allowScore);
      setNotAllowed(finalStatus === "PENDING" || finalStatus === "READY");
    } catch (err) {
      console.error("Failed to refresh status", err);
    }
  }, [performanceId, assessorId, performanceMatchId]);

  useEffect(() => {
    // Load initial status
    refreshStatus();
    // Poll every 2 seconds to catch status changes
    const interval = setInterval(refreshStatus, 2000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

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
        client.subscribe(
          `/topic/performance/${performanceId}/status`,
          (msg) => {
            try {
              const payload = JSON.parse(msg.body) as {
                status?: string;
                startTime?: string;
              };
              // If backend sends status, or only startTime, update immediately
              if (payload?.status) {
                setStatus(payload.status);
                setCanScore(payload.status === "COMPLETED");
                setNotAllowed(payload.status === "PENDING");
              } else if (payload?.startTime) {
                setStatus("IN_PROGRESS");
                setCanScore(false);
                setNotAllowed(false);
              }
              // Also trigger refresh to reconcile PM status
              refreshStatus();
            } catch (e) {
              console.warn("WS status parse error", e);
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
  }, [performanceId, refreshStatus]);

  const handleNumClick = (num: string) => {
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
    if (!canScore || !performanceId || !assessorId) return;
    const scoreNum = Number(value);
    if (!Number.isFinite(scoreNum)) return;
    scoringService
      .submitScore({ performanceId, assessorId, score: scoreNum })
      .then(() => {
        alert("Đã gửi điểm: " + scoreNum);
        setValue("0");
      })
      .catch((err: ErrorResponse | unknown) => {
        let msg = "Gửi điểm thất bại";
        if (typeof err === "object" && err !== null) {
          const withMsg = err as { message?: string };
          const withData = err as { data?: { message?: string } };
          msg = withMsg.message || withData.data?.message || msg;
        }
        alert(msg);
      });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center py-8">
      {notAllowed ? (
        <div className="w-full max-w-[700px] bg-white border-0 rounded-xl shadow p-6 flex flex-col gap-4 items-center text-center">
          <div className="text-xl font-bold text-black">Trận chưa bắt đầu</div>
          <div className="text-gray-600">
            Giám định chưa thể vào màn hình chấm khi trận ở trạng thái chờ.
          </div>
          <div className="text-sm text-gray-500">
            Vui lòng quay lại khi trạng thái là "ĐANG DIỄN RA".
          </div>
        </div>
      ) : (
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
                className="p-2 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-100 transition flex items-center justify-center"
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
                } hover:bg-yellow-100`}
                onClick={() => handleNumClick(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <button
            className="mt-8 bg-green-600 hover:bg-green-700 text-white rounded px-8 py-4 text-xl font-bold w-full max-w-md shadow disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!canScore}
          >
            XÁC NHẬN
          </button>
        </div>
      )}
    </div>
  );
};

export default JudgeScoringScreen;
