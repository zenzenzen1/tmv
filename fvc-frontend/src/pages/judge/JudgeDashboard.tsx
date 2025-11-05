import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import apiClient from "../../config/axios";
import { API_ENDPOINTS } from "../../config/endpoints";
import { scoringService } from "../../services/scoringService";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

type MyAssignedMatch = {
  assessorId: string;
  matchId?: string;
  performanceMatchId?: string;
  performanceId?: string;
  role?: string;
  position?: number;
  match?: {
    id: string;
    competitionId: string;
    competitionName?: string;
    redAthleteName: string;
    blueAthleteName: string;
    status: string;
  };
  performanceMatch?: {
    id: string;
    competitionId: string;
    competitionName?: string;
    performanceId: string;
    contentName?: string;
    contentType: string;
    matchOrder?: number;
    status: string;
    participants?: string;
  };
};

type DisplayMatch = {
  id: string;
  order: number;
  type: "fighting" | "quyen" | "music";
  contentName: string;
  participants: string[];
  role: string;
  tournamentName: string;
  status: "pending" | "ongoing" | "completed";
  performanceId?: string;
  assessorId?: string;
};

const ROLE_LABELS: Record<string, string> = {
  ASSESSOR: "Giám định",
  JUDGER: "Trọng tài",
};

const JudgeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "pending" | "ongoing" | "all"
  >("all");
  const stompRef = useRef<Client | null>(null);

  // Load assigned matches from API
  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      try {
        const response = await api.get<MyAssignedMatch[]>(
          API_ENDPOINTS.MATCH_ASSESSORS.MY_ASSIGNMENTS
        );
        const data = response.data || [];

        // Map + enrich content name to match ProjectionScreen
        const displayMatches: DisplayMatch[] = await Promise.all(
          data
            .filter((m) => m.performanceMatch != null)
            .map(async (m, index) => {
              const pm = m.performanceMatch!;
              const type = pm.contentType === "QUYEN" ? "quyen" : "music";
              const participants = pm.participants
                ? pm.participants.split(", ")
                : [];

              // Get content name exactly like ProjectionScreen does
              let contentName = "";
              if (pm.performanceId) {
                try {
                  const perf = await scoringService.getPerformance(
                    pm.performanceId
                  );
                  const contentTypeStr = (
                    perf as unknown as { contentType?: string }
                  )?.contentType;
                  const isQuyen =
                    contentTypeStr === "QUYEN" || perf.contentType === "FIST";
                  const isMusic = perf.contentType === "MUSIC";

                  if (isQuyen && perf.fistItemId) {
                    try {
                      const res = await apiClient.get<unknown>(
                        API_ENDPOINTS.FIST_CONTENTS.ITEM_BY_ID(perf.fistItemId)
                      );
                      // Handle both wrapped and direct response formats (same as ProjectionScreen)
                      const data = (res as { data?: unknown })?.data as
                        | { data?: { name?: string } }
                        | { name?: string }
                        | undefined;
                      contentName =
                        (data as { data?: { name?: string } })?.data?.name ||
                        (data as { name?: string })?.name ||
                        "";
                    } catch (err) {
                      console.error("Failed to fetch fist item name", err);
                    }
                  } else if (isMusic && perf.musicContentId) {
                    try {
                      const res = await apiClient.get<unknown>(
                        API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(perf.musicContentId)
                      );
                      // Handle both wrapped and direct response formats (same as ProjectionScreen)
                      const data = (res as { data?: unknown })?.data as
                        | { data?: { name?: string } }
                        | { name?: string }
                        | undefined;
                      contentName =
                        (data as { data?: { name?: string } })?.data?.name ||
                        (data as { name?: string })?.name ||
                        "";
                    } catch (err) {
                      console.error("Failed to fetch music content name", err);
                    }
                  }
                } catch (err) {
                  console.error("Failed to load performance", err);
                }
              }
              // Fallback to pm.contentName if fetch failed or not available
              if (!contentName) {
                contentName = pm.contentName || "";
              }

              return {
                id: pm.id,
                order: pm.matchOrder || index + 1,
                type: type as "quyen" | "music",
                contentName,
                participants,
                role: m.role || "ASSESSOR",
                tournamentName: pm.competitionName || "Giải đấu",
                status: mapStatus(pm.status),
                performanceId: pm.performanceId,
                assessorId: m.assessorId,
              } as DisplayMatch;
            })
        );

        setMatches(displayMatches);
      } catch (error) {
        console.error("Failed to load assigned matches:", error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const mapStatus = (status: string): "pending" | "ongoing" | "completed" => {
    const upper = status.toUpperCase();
    if (upper === "IN_PROGRESS" || upper === "ONGOING") return "ongoing";
    if (upper === "COMPLETED" || upper === "FINISHED") return "completed";
    return "pending";
  };

  const handleJoin = async (
    matchId: string,
    role: string,
    assessorId?: string,
    performanceId?: string,
    status?: "pending" | "ongoing" | "completed"
  ) => {
    // Block joining when match has not started yet
    if (status === "pending") {
      window.alert(
        "Trận chưa bắt đầu. Vui lòng quay lại khi trạng thái là ĐANG DIỄN RA."
      );
      return;
    }
    // Chỉ xử lý quyền và võ nhạc
    const params = new URLSearchParams();
    if (performanceId) params.set("performanceId", performanceId);
    if (assessorId) params.set("assessorId", assessorId);
    if (matchId) params.set("performanceMatchId", matchId);
    params.set("role", role);
    navigate(`/performance/judge?${params.toString()}`);
  };

  // Subscribe to performance status updates to reflect ongoing/completed in the grid
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "") + "/ws"
      : "http://localhost:8080/ws";
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe per performance in current list
        matches.forEach((m) => {
          if (!m.performanceId) return;
          // Subscribe to performance status topic
          client.subscribe(
            `/topic/performance/${m.performanceId}/status`,
            (msg) => {
              try {
                const payload = JSON.parse(msg.body) as {
                  status?: string;
                  performanceId?: string;
                  matchId?: string;
                };
                if (!payload?.performanceId || !payload.status) return;
                setMatches((prev) =>
                  prev.map((it) =>
                    it.performanceId === payload.performanceId
                      ? {
                          ...it,
                          status:
                            payload.status === "IN_PROGRESS"
                              ? "ongoing"
                              : payload.status === "COMPLETED"
                              ? "completed"
                              : it.status,
                        }
                      : it
                  )
                );
              } catch (e) {
                console.error("Error parsing WebSocket message:", e);
              }
            }
          );
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => {
      if (stompRef.current?.connected) stompRef.current.deactivate();
    };
  }, [matches]);

  // Also reload matches periodically to catch any missed updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Reload matches every 5 seconds to ensure we have latest status
      const loadMatches = async () => {
        try {
          const response = await api.get<MyAssignedMatch[]>(
            API_ENDPOINTS.MATCH_ASSESSORS.MY_ASSIGNMENTS
          );
          const data = response.data || [];

          const displayMatches: DisplayMatch[] = await Promise.all(
            data
              .filter((m) => m.performanceMatch != null)
              .map(async (m, index) => {
                const pm = m.performanceMatch!;
                const type = pm.contentType === "QUYEN" ? "quyen" : "music";
                const participants = pm.participants
                  ? pm.participants.split(", ")
                  : [];

                // Get content name exactly like ProjectionScreen does
                let contentName = "";
                if (pm.performanceId) {
                  try {
                    const perf = await scoringService.getPerformance(
                      pm.performanceId
                    );
                    const contentTypeStr = (
                      perf as unknown as { contentType?: string }
                    )?.contentType;
                    const isQuyen =
                      contentTypeStr === "QUYEN" || perf.contentType === "FIST";
                    const isMusic = perf.contentType === "MUSIC";

                    if (isQuyen && perf.fistItemId) {
                      try {
                        const res = await apiClient.get<unknown>(
                          API_ENDPOINTS.FIST_CONTENTS.ITEM_BY_ID(
                            perf.fistItemId
                          )
                        );
                        const data = (res as { data?: unknown })?.data as
                          | { data?: { name?: string } }
                          | { name?: string }
                          | undefined;
                        contentName =
                          (data as { data?: { name?: string } })?.data?.name ||
                          (data as { name?: string })?.name ||
                          "";
                      } catch (err) {
                        console.error("Failed to fetch fist item name", err);
                      }
                    } else if (isMusic && perf.musicContentId) {
                      try {
                        const res = await apiClient.get<unknown>(
                          API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(
                            perf.musicContentId
                          )
                        );
                        const data = (res as { data?: unknown })?.data as
                          | { data?: { name?: string } }
                          | { name?: string }
                          | undefined;
                        contentName =
                          (data as { data?: { name?: string } })?.data?.name ||
                          (data as { name?: string })?.name ||
                          "";
                      } catch (err) {
                        console.error(
                          "Failed to fetch music content name",
                          err
                        );
                      }
                    }
                  } catch (err) {
                    console.error("Failed to load performance", err);
                  }
                }
                if (!contentName) {
                  contentName = pm.contentName || "";
                }

                return {
                  id: pm.id,
                  order: pm.matchOrder || index + 1,
                  type: type,
                  contentName: contentName,
                  participants: participants,
                  role: m.role || "ASSESSOR",
                  tournamentName: pm.competitionName || "Giải đấu",
                  status: mapStatus(pm.status),
                  performanceId: pm.performanceId,
                  assessorId: m.assessorId,
                } as DisplayMatch;
              })
          );

          setMatches(displayMatches);
        } catch (error) {
          console.error("Failed to reload matches:", error);
        }
      };
      loadMatches();
    }, 5000); // Poll every 5 seconds as backup

    return () => clearInterval(interval);
  }, []);

  const filteredMatches = matches.filter(
    (m) => filterStatus === "all" || m.status === filterStatus
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Danh sách trận chấm
        </h1>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium text-gray-700">Lọc theo:</label>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "pending" | "ongoing" | "all")
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chưa bắt đầu</option>
            <option value="ongoing">Đang diễn ra</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Đang tải...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-sm text-gray-600">
          Chưa có trận nào được phân công.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Trận {match.order}
                </h3>
                <span
                  className="px-2 py-1 text-xs rounded border"
                  style={
                    match.status === "ongoing"
                      ? {
                          backgroundColor: "#E3F2FD",
                          color: "#2196F3",
                          borderColor: "#BBDEFB",
                        }
                      : match.status === "completed"
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
                  {match.status === "ongoing"
                    ? "Đang diễn ra"
                    : match.status === "completed"
                    ? "Kết thúc"
                    : "Chưa bắt đầu"}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Giải đấu:</span>{" "}
                {match.tournamentName}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Hình thức:</span>{" "}
                {match.type === "quyen" ? "QUYỀN" : "VÕ NHẠC"}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Nội dung:</span>{" "}
                {match.contentName}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Đội/VDV:</span>{" "}
                {match.participants.join(", ")}
              </p>
              <p className="text-sm text-blue-700 mb-3">
                <span className="font-medium">Vai trò:</span>{" "}
                {ROLE_LABELS[match.role]}
              </p>

              {match.status !== "completed" && (
                <button
                  onClick={() =>
                    handleJoin(
                      match.id,
                      match.role,
                      match.assessorId,
                      match.performanceId,
                      match.status
                    )
                  }
                  disabled={match.status === "pending"}
                  className={`w-full px-4 py-2 rounded transition 
                    ${
                      match.status === "pending"
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  title={match.status === "pending" ? "Trận chưa bắt đầu" : ""}
                >
                  {match.status === "pending"
                    ? "Chưa thể tham gia"
                    : "Tham gia chấm"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;
