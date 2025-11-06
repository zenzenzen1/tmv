import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import matchScoringService, {
  type MatchScoreboard,
  type MatchEvent,
  type MatchAssessor,
  type Corner,
} from "../../services/matchScoringService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useToast } from "../../components/common/ToastContext";
import { useAuthStore } from "../../stores/authStore";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function formatEventTime(timestampInRoundSeconds: number): string {
  return formatTime(timestampInRoundSeconds);
}

function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "SCORE_PLUS_1":
      return "+1";
    case "SCORE_PLUS_2":
      return "+2";
    case "SCORE_MINUS_1":
      return "-1";
    case "MEDICAL_TIMEOUT":
      return "Tạm dừng y tế";
    case "WARNING":
      return "Cảnh cáo";
    default:
      return eventType;
  }
}

function getCornerLabel(corner: string | null): string {
  switch (corner) {
    case "RED":
      return "Đỏ";
    case "BLUE":
      return "Xanh";
    default:
      return "-";
  }
}

export default function MatchScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [scoreboard, setScoreboard] = useState<MatchScoreboard | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [assessors, setAssessors] = useState<MatchAssessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAssessor, setSelectedAssessor] = useState<number | null>(null);
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number | null>(
    null
  );
  const [connectedAssessors, setConnectedAssessors] = useState<string[]>([]);
  const [connectedAssessorsCount, setConnectedAssessorsCount] = useState(0);
  const [selectedRound, setSelectedRound] = useState<number | "all">("all");
  const [isReferee, setIsReferee] = useState<boolean>(false);
  const stompClientRef = useRef<Client | null>(null);

  // Check if match has ended
  const isMatchEnded =
    scoreboard?.status === "KẾT THÚC" ||
    scoreboard?.status === "ENDED" ||
    scoreboard?.status === "FINISHED";

  // Check if match hasn't started yet
  const isMatchPending =
    scoreboard?.status === "CHỜ BẮT ĐẦU" || scoreboard?.status === "PENDING";

  const fetchScoreboard = useCallback(async () => {
    if (!matchId) {
      toast.error("Match ID không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      const [data, eventData, assessorData] = await Promise.all([
        matchScoringService.getScoreboard(matchId),
        matchScoringService.getEventHistory(matchId),
        matchScoringService.getMatchAssessors(matchId).catch(() => []),
      ]);

      setScoreboard(data);
      setEvents(eventData);
      const sortedAssessors = assessorData.sort((a, b) => a.position - b.position);
      setAssessors(sortedAssessors);

      // Check if current user has permission to access this page
      // Allow: 1) Referee (JUDGER at position 6), 2) Organization Committee members
      if (sortedAssessors.length > 0 && user?.id) {
        // Check if user is organization committee member
        const isOrgCommittee = user.systemRole === "ORGANIZATION_COMMITTEE";
        
        // Check if user is the referee (JUDGER at position 6)
        const refereeAssessor = sortedAssessors.find(
          (a) => (a.role === "JUDGER" || a.position === 6) && a.userId === user.id
        );
        
        if (!isOrgCommittee && !refereeAssessor) {
          toast.error("Chỉ trọng tài (vị trí 6) hoặc ban tổ chức mới được phép vào màn hình này");
          setTimeout(() => navigate(-1), 2000);
          return;
        }
        
        if (refereeAssessor) {
          setIsReferee(true);
        }
      } else if (!user?.id) {
        toast.error("Bạn cần đăng nhập để truy cập màn hình này");
        setTimeout(() => navigate(-1), 2000);
        return;
      }

      // Initialize timer from roundDurationSeconds when match starts or round changes
      if (data.status === "ĐANG ĐẤU") {
        setLocalTimeRemaining((prev) => {
          // Only reset timer when round actually changes (not on first load when scoreboard is null)
          if (scoreboard && scoreboard.currentRound !== data.currentRound) {
            console.log(
              `Round changed: ${scoreboard.currentRound} -> ${data.currentRound}, resetting timer to ${data.roundDurationSeconds}s`
            );
            return data.roundDurationSeconds;
          }
          // If prev is null (first load or timer not initialized), initialize with full duration
          if (prev === null) {
            console.log(
              `Initializing timer for round ${data.currentRound} with ${data.roundDurationSeconds}s`
            );
            return data.roundDurationSeconds;
          }
          // Keep current local time if same round and timer is already running
          return prev;
        });
      } else {
        // When match is not in progress, reset local time
        setLocalTimeRemaining(null);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể tải dữ liệu trận đấu";
      toast.error(errorMessage);
      console.error("Error fetching scoreboard:", err);
    } finally {
      setLoading(false);
    }
  }, [matchId, toast, user]);

  const handleRoundEnd = useCallback(async () => {
    if (!matchId || !scoreboard || actionLoading) return;

    // Cannot end round if match hasn't started
    if (
      scoreboard.status === "CHỜ BẮT ĐẦU" ||
      scoreboard.status === "PENDING"
    ) {
      toast.warning("Không thể kết thúc vòng khi trận đấu chưa bắt đầu", 5000);
      return;
    }

    try {
      setActionLoading(true);
      await matchScoringService.controlMatch(matchId, {
        action: "NEXT_ROUND",
      });

      const updatedScoreboard = await matchScoringService.getScoreboard(
        matchId
      );
      setScoreboard(updatedScoreboard);

      // If match ended, show notification
      if (
        updatedScoreboard.status === "KẾT THÚC" ||
        updatedScoreboard.status === "ENDED"
      ) {
        const redScore = updatedScoreboard.redAthlete.score || 0;
        const blueScore = updatedScoreboard.blueAthlete.score || 0;

        if (redScore > blueScore) {
          toast.success(
            `🎉 Trận đấu kết thúc! Vận động viên ĐỎ thắng với tỷ số ${redScore} - ${blueScore}!`,
            10000
          );
        } else if (blueScore > redScore) {
          toast.success(
            `🎉 Trận đấu kết thúc! Vận động viên XANH thắng với tỷ số ${blueScore} - ${redScore}!`,
            10000
          );
        } else {
          toast.warning(
            `Trận đấu kết thúc! Hòa! Tỷ số ${redScore} - ${blueScore}`,
            10000
          );
        }
      } else {
        // Round ended, moved to next round
        toast.info(
          `⏱️ Vòng ${scoreboard.currentRound} kết thúc! Chuyển sang vòng ${updatedScoreboard.currentRound}`,
          5000
        );
        // Update scoreboard state first
        setScoreboard(updatedScoreboard);
        // Reset timer for new round immediately
        setLocalTimeRemaining(updatedScoreboard.roundDurationSeconds);
      }

      // Refresh data to ensure everything is in sync
      await fetchScoreboard();
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể chuyển vòng";
      toast.error(errorMessage);
      console.error("Error ending round:", err);
    } finally {
      setActionLoading(false);
    }
  }, [matchId, scoreboard, actionLoading, toast, fetchScoreboard]);

  useEffect(() => {
    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 5000);
    return () => clearInterval(interval);
  }, [fetchScoreboard]);

  // WebSocket connection for assessor connections tracking
  useEffect(() => {
    if (!matchId) return;

    const wsUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "") + "/ws"
      : "http://localhost:8080/ws";
    const socket = new SockJS(wsUrl);
    const stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("WebSocket connected for assessor tracking");

        // Subscribe to assessor connection status
        const subscription = stompClient.subscribe(
          `/topic/match/${matchId}/assessor-connections`,
          (message) => {
            try {
              const status = JSON.parse(message.body);
              console.log("✅ Assessor connection status received:", status);
              console.log("   - Connected count:", status.connectedCount);
              console.log(
                "   - Connected assessors:",
                status.connectedAssessors
              );
              setConnectedAssessors(status.connectedAssessors || []);
              setConnectedAssessorsCount(status.connectedCount || 0);
            } catch (e) {
              console.error(
                "❌ Error parsing connection status:",
                e,
                message.body
              );
            }
          }
        );

        console.log(
          "Subscribed to connection status:",
          `/topic/match/${matchId}/assessor-connections`
        );

        // Request initial connection status after a delay
        setTimeout(() => {
          if (stompClient.connected) {
            console.log("Requesting initial connection status...");
            stompClient.publish({
              destination: `/app/match/connections/request`,
              body: JSON.stringify({ matchId }),
            });
          }
        }, 1000);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, [matchId]);

  // Timer countdown when match is in progress
  useEffect(() => {
    if (
      !scoreboard ||
      scoreboard.status !== "ĐANG ĐẤU" ||
      localTimeRemaining === null
    ) {
      return;
    }

    // Prevent multiple timer intervals
    let isHandlingRoundEnd = false;

    // Countdown timer - update every second
    const timerInterval = setInterval(() => {
      setLocalTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          // Time's up - automatically move to next round or end match
          if (!isHandlingRoundEnd) {
            isHandlingRoundEnd = true;
            handleRoundEnd().finally(() => {
              isHandlingRoundEnd = false;
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [
    scoreboard?.status,
    scoreboard?.currentRound,
    localTimeRemaining,
    handleRoundEnd,
  ]);

  const handleScoreEvent = async (
    corner: Corner,
    eventType:
      | "SCORE_PLUS_1"
      | "SCORE_PLUS_2"
      | "SCORE_MINUS_1"
      | "MEDICAL_TIMEOUT"
      | "WARNING"
  ) => {
    if (!matchId || !scoreboard || actionLoading) return;

    const assessor = selectedAssessor
      ? assessors.find((a) => a.position === selectedAssessor)
      : null;

    try {
      setActionLoading(true);
      const currentTime =
        scoreboard.status === "ĐANG ĐẤU" && localTimeRemaining !== null
          ? localTimeRemaining
          : scoreboard.roundDurationSeconds;
      const timestampInRoundSeconds =
        scoreboard.roundDurationSeconds - currentTime;

      await matchScoringService.recordScoreEvent(matchId, {
        round: scoreboard.currentRound,
        timestampInRoundSeconds: Math.max(0, timestampInRoundSeconds),
        corner,
        eventType,
        judgeId: assessor?.id || null,
      });

      setSelectedAssessor(null);
      await fetchScoreboard();
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể ghi nhận sự kiện";
      toast.error(errorMessage);
      console.error("Error recording score event:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMatchControl = async (
    action: "START" | "PAUSE" | "RESUME" | "END"
  ) => {
    if (!matchId || !scoreboard || actionLoading) return;

    // For START action, check if all 6 assessors (5 ASSESSOR + 1 JUDGER) are connected
    if (action === "START") {
      // Check if we have exactly 6 assessors
      if (assessors.length !== 6) {
        toast.error(
          `Trận đấu cần đúng 6 người (5 giám định + 1 trọng tài) trước khi bắt đầu. Hiện tại có ${assessors.length} người.`,
          5000
        );
        return;
      }

      // Check if we have exactly 1 JUDGER (position 6)
      const judgerCount = assessors.filter(
        (a) => a.role === "JUDGER" || a.position === 6
      ).length;
      if (judgerCount !== 1) {
        toast.error(
          `Trận đấu cần đúng 1 trọng tài (vị trí 6). Hiện tại có ${judgerCount} trọng tài.`,
          5000
        );
        return;
      }

      // Check if all 6 assessors are connected
      if (connectedAssessorsCount < 6) {
        const missingCount = 6 - connectedAssessorsCount;
        toast.error(
          `Tất cả 6 người (5 giám định + 1 trọng tài) phải kết nối trước khi bắt đầu trận đấu. Hiện tại có ${connectedAssessorsCount}/6 người đã kết nối. Thiếu ${missingCount} người.`,
          5000
        );
        return;
      }
    }

    // Cannot end match if it hasn't started
    if (
      action === "END" &&
      (scoreboard.status === "CHỜ BẮT ĐẦU" || scoreboard.status === "PENDING")
    ) {
      toast.warning(
        "Không thể kết thúc trận đấu khi trận đấu chưa bắt đầu",
        5000
      );
      return;
    }

    try {
      setActionLoading(true);
      await matchScoringService.controlMatch(matchId, {
        action,
        currentRound: scoreboard.currentRound,
      });

      const updatedScoreboard = await matchScoringService.getScoreboard(
        matchId
      );
      setScoreboard(updatedScoreboard);

      // If ending match, show winner toast
      if (action === "END" && updatedScoreboard) {
        const redScore = updatedScoreboard.redAthlete.score || 0;
        const blueScore = updatedScoreboard.blueAthlete.score || 0;

        if (redScore > blueScore) {
          toast.success(
            `🎉 Vận động viên ĐỎ thắng với tỷ số ${redScore} - ${blueScore}!`,
            5000
          );
        } else if (blueScore > redScore) {
          toast.success(
            `🎉 Vận động viên XANH thắng với tỷ số ${blueScore} - ${redScore}!`,
            5000
          );
        } else {
          toast.warning(`Hòa! Tỷ số ${redScore} - ${blueScore}`, 5000);
        }
      }

      await fetchScoreboard();
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể điều khiển trận đấu";
      toast.error(errorMessage);
      console.error("Error controlling match:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWinner = async (corner: Corner) => {
    if (!matchId || actionLoading) return;

    try {
      setActionLoading(true);
      await matchScoringService.controlMatch(matchId, {
        action: "END",
      });

      toast.success(`Vận động viên ${corner === "RED" ? "Đỏ" : "Xanh"} thắng!`);
      navigate(-1);
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể kết thúc trận đấu";
      toast.error(errorMessage);
      console.error("Error ending match:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!matchId || actionLoading || isMatchEnded) return;

    try {
      setActionLoading(true);
      await matchScoringService.undoLastEvent(matchId);
      await fetchScoreboard();
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể hoàn tác";
      toast.error(errorMessage);
      console.error("Error undoing:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getAssessorPositionFromEvent = (
    judgeId: string | null | undefined
  ): number | null => {
    if (!judgeId) return null;
    const assessor = assessors.find((a) => a.id === judgeId);
    return assessor?.position || null;
  };

  const getAssessorPositionsFromEvent = (event: MatchEvent): number[] => {
    if (!event.assessorIds) {
      // Fallback to judgeId if assessorIds is not available
      const position = getAssessorPositionFromEvent(event.judgeId);
      return position ? [position] : [];
    }

    // Parse comma-separated assessor IDs and convert to positions
    const assessorIdList = event.assessorIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);
    return assessorIdList
      .map((assessorId) => {
        const assessor = assessors.find((a) => a.id === assessorId);
        return assessor?.position;
      })
      .filter((pos): pos is number => pos !== undefined)
      .sort((a, b) => a - b);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading && !scoreboard) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!scoreboard) {
    return (
      <div className="p-6">
        <p>Không tìm thấy dữ liệu trận đấu</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Check if user has permission - allow referee or organization committee
  const isOrgCommittee = user?.systemRole === "ORGANIZATION_COMMITTEE";
  const hasPermission = isReferee || isOrgCommittee;
  
  if (assessors.length > 0 && user?.id && !hasPermission) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-red-600 mb-4">
            Chỉ trọng tài (vị trí 6) hoặc ban tổ chức mới được phép vào màn hình này.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusColor =
    scoreboard.status === "ĐANG ĐẤU"
      ? "text-green-600"
      : scoreboard.status === "TẠM DỪNG"
      ? "text-yellow-600"
      : "text-gray-600";

  return (
    <div className="font-sans bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="font-bold text-2xl mb-3">{scoreboard.matchName}</div>
        <div className="flex items-center gap-4 flex-wrap">
          {scoreboard.weightClass && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
              Hạng cân: {scoreboard.weightClass}
            </span>
          )}
          {scoreboard.field && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
              Sân: {scoreboard.field}
            </span>
          )}
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm font-medium">
            Vòng: {scoreboard.roundType}
          </span>
          <span className="text-sm">
            Hiệp: {scoreboard.currentRound}/{scoreboard.totalRounds}
          </span>
          <span className="text-sm text-blue-600">
            Thời lượng hiệp: {formatTime(scoreboard.roundDurationSeconds)}
          </span>
          <span
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              connectedAssessorsCount === 6
                ? "bg-green-100 text-green-800"
                : connectedAssessorsCount >= 3
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
            title={`Connected assessors: ${
              connectedAssessors.join(", ") || "none"
            }`}
          >
            Đã kết nối: {connectedAssessorsCount}/6 (5 giám định + 1 trọng tài)
          </span>
          <button
            onClick={() =>
              navigate(`/manage/scoring/assign-assessors/${matchId}`)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Chỉ định giám định
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Quay lại
          </button>
        </div>
      </div>

      {/* Competitor Information Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* RED Competitor */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="font-bold text-lg text-red-600 mb-1">
            {scoreboard.redAthlete.name}
          </div>
          <div className="text-sm text-gray-600">
            {scoreboard.redAthlete.unit} • SBT #
            {scoreboard.redAthlete.sbtNumber}
          </div>
        </div>

        {/* CENTER - Status and Timer */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <div className="font-semibold text-base mb-1">
            Trạng thái: <span className={statusColor}>{scoreboard.status}</span>
          </div>
          <div className="text-base mb-2">
            Hiệp {scoreboard.currentRound}/{scoreboard.totalRounds}
          </div>
          <div className="text-6xl font-extrabold tracking-wider text-blue-600">
            {formatTime(
              scoreboard.status === "ĐANG ĐẤU" && localTimeRemaining !== null
                ? localTimeRemaining
                : scoreboard.roundDurationSeconds
            )}
          </div>
        </div>

        {/* BLUE Competitor */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="font-bold text-lg text-blue-600 mb-1">
            {scoreboard.blueAthlete.name}
          </div>
          <div className="text-sm text-gray-600">
            {scoreboard.blueAthlete.unit} • SBT #
            {scoreboard.blueAthlete.sbtNumber}
          </div>
        </div>
      </div>

      {/* Score Display with Assessor Inputs */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* RED Side - Score Box with Assessor Inputs */}
        <div className="flex gap-3">
          {/* Assessor Input Columns - Left of red box */}
          <div className="flex gap-2">
            {/* Column 1: GD */}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-xs font-semibold mb-1 text-gray-600">GD</div>
              {[1, 2, 3, 4, 5, 6].map((pos) => {
                const assessor = assessors.find((a) => a.position === pos);
                const isSelected = selectedAssessor === pos;
                const isJudger = assessor?.role === "JUDGER";
                return (
                  <button
                    key={pos}
                    onClick={() => setSelectedAssessor(pos)}
                    className={`w-12 h-12 rounded-lg text-lg font-bold transition-all ${
                      isSelected
                        ? "bg-yellow-400 text-yellow-900 shadow-lg"
                        : isJudger
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    disabled={!assessor || isMatchEnded}
                    title={
                      assessor
                        ? `Giám định ${pos}: ${assessor.userFullName}`
                        : ""
                    }
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
            {/* Column 2: 1 */}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-xs font-semibold mb-1 text-gray-600">1</div>
              {[1, 2, 3, 4, 5, 6].map((pos) => {
                const assessor = assessors.find((a) => a.position === pos);
                const isSelected = selectedAssessor === pos;
                return (
                  <button
                    key={pos}
                    onClick={() => setSelectedAssessor(pos)}
                    className={`w-12 h-12 rounded-lg text-lg font-bold transition-all ${
                      isSelected
                        ? "bg-yellow-400 text-yellow-900 shadow-lg"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    disabled={!assessor || isMatchEnded}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RED Score Box */}
          <div className="flex-1 bg-red-600 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-red-700 text-white px-6 py-4 text-center font-bold text-xl">
              ĐỎ
            </div>
            <div className="bg-red-600 text-white text-center py-12">
              <div className="text-9xl font-extrabold">
                {scoreboard.redAthlete.score}
              </div>
            </div>
            <div className="bg-white px-6 py-4">
              <div className="text-sm text-gray-600 mb-2">
                Cảnh cáo y tế lần thứ:{" "}
                <span className="font-semibold">
                  {scoreboard.redAthlete.medicalTimeoutCount}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Cảnh cáo lần thứ:{" "}
                <span className="font-semibold">
                  {scoreboard.redAthlete.warningCount}
                </span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded border-2 ${
                      i < scoreboard.redAthlete.warningCount
                        ? "bg-yellow-400 border-yellow-500"
                        : "bg-white border-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER - Empty space or can add timer here */}
        <div></div>

        {/* BLUE Side - Score Box with Assessor Inputs */}
        <div className="flex gap-3 flex-row-reverse">
          {/* Assessor Input Columns - Right of blue box */}
          <div className="flex gap-2">
            {/* Column 1: 1 */}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-xs font-semibold mb-1 text-gray-600">1</div>
              {[1, 2, 3, 4, 5, 6].map((pos) => {
                const assessor = assessors.find((a) => a.position === pos);
                const isSelected = selectedAssessor === pos;
                return (
                  <button
                    key={pos}
                    onClick={() => setSelectedAssessor(pos)}
                    className={`w-12 h-12 rounded-lg text-lg font-bold transition-all ${
                      isSelected
                        ? "bg-yellow-400 text-yellow-900 shadow-lg"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    disabled={!assessor || isMatchEnded}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
            {/* Column 2: GD */}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-xs font-semibold mb-1 text-gray-600">GD</div>
              {[1, 2, 3, 4, 5, 6].map((pos) => {
                const assessor = assessors.find((a) => a.position === pos);
                const isSelected = selectedAssessor === pos;
                const isJudger = assessor?.role === "JUDGER";
                return (
                  <button
                    key={pos}
                    onClick={() => setSelectedAssessor(pos)}
                    className={`w-12 h-12 rounded-lg text-lg font-bold transition-all ${
                      isSelected
                        ? "bg-yellow-400 text-yellow-900 shadow-lg"
                        : isJudger
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    disabled={!assessor || isMatchEnded}
                    title={
                      assessor
                        ? `Giám định ${pos}: ${assessor.userFullName}`
                        : ""
                    }
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BLUE Score Box */}
          <div className="flex-1 bg-blue-600 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-blue-700 text-white px-6 py-4 text-center font-bold text-xl">
              XANH
            </div>
            <div className="bg-blue-600 text-white text-center py-12">
              <div className="text-9xl font-extrabold">
                {scoreboard.blueAthlete.score}
              </div>
            </div>
            <div className="bg-white px-6 py-4">
              <div className="text-sm text-gray-600 mb-2">
                Cảnh cáo y tế lần thứ:{" "}
                <span className="font-semibold">
                  {scoreboard.blueAthlete.medicalTimeoutCount}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Cảnh cáo lần thứ:{" "}
                <span className="font-semibold">
                  {scoreboard.blueAthlete.warningCount}
                </span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded border-2 ${
                      i < scoreboard.blueAthlete.warningCount
                        ? "bg-yellow-400 border-yellow-500"
                        : "bg-white border-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="font-bold text-lg mb-4">Tình huống đặc biệt</div>

        {/* Top Row */}
        <div className="flex gap-3 mb-3 flex-wrap justify-center">
          <button
            onClick={() => handleScoreEvent("RED", "WARNING")}
            disabled={actionLoading || isMatchEnded}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            CẢNH CÁO
          </button>
          <button
            onClick={() => handleScoreEvent("RED", "MEDICAL_TIMEOUT")}
            disabled={actionLoading || isMatchEnded}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            TẠM DỪNG Y TẾ
          </button>
          {scoreboard.status === "CHỜ BẮT ĐẦU" && (
            <button
              onClick={() => handleMatchControl("START")}
              disabled={actionLoading || isMatchEnded || connectedAssessorsCount < 6}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={connectedAssessorsCount < 6 ? "Cần tất cả 6 người (5 giám định + 1 trọng tài) kết nối để bắt đầu" : ""}
            >
              Bắt đầu {connectedAssessorsCount < 6 && `(${connectedAssessorsCount}/6)`}
            </button>
          )}
          {scoreboard.status === "ĐANG ĐẤU" && (
            <button
              onClick={() => handleMatchControl("PAUSE")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              Tạm dừng
            </button>
          )}
          {scoreboard.status === "TẠM DỪNG" && (
            <button
              onClick={() => handleMatchControl("RESUME")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              Tiếp tục
            </button>
          )}
          <button
            onClick={() => handleScoreEvent("BLUE", "MEDICAL_TIMEOUT")}
            disabled={actionLoading || isMatchEnded}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            TẠM DỪNG Y TẾ
          </button>
          <button
            onClick={() => handleScoreEvent("BLUE", "WARNING")}
            disabled={actionLoading || isMatchEnded}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            CẢNH CÁO
          </button>
        </div>

        {/* Middle Row */}
        <div className="flex gap-3 mb-3 flex-wrap justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => handleScoreEvent("RED", "SCORE_PLUS_1")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              +1
            </button>
            <button
              onClick={() => handleScoreEvent("RED", "SCORE_PLUS_2")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              +2
            </button>
            <button
              onClick={() => handleWinner("RED")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50"
            >
              ĐỎ THẮNG
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleWinner("BLUE")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              XANH THẮNG
            </button>
            <button
              onClick={() => handleScoreEvent("BLUE", "SCORE_PLUS_2")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              +2
            </button>
            <button
              onClick={() => handleScoreEvent("BLUE", "SCORE_PLUS_1")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              +1
            </button>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex gap-3 flex-wrap justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => handleScoreEvent("RED", "SCORE_MINUS_1")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              ĐÒN CHÂN
            </button>
            <button
              onClick={() => handleScoreEvent("RED", "SCORE_MINUS_1")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              -1
            </button>
          </div>
          <button
            onClick={() => {
              if (
                scoreboard &&
                scoreboard.currentRound < scoreboard.totalRounds
              ) {
                handleRoundEnd();
              } else {
                handleMatchControl("END");
              }
            }}
            disabled={actionLoading || isMatchEnded || isMatchPending}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scoreboard && scoreboard.currentRound < scoreboard.totalRounds
              ? `Kết thúc vòng ${scoreboard.currentRound}`
              : "Kết thúc trận đấu"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleScoreEvent("BLUE", "SCORE_MINUS_1")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              -1
            </button>
            <button
              onClick={() => handleScoreEvent("BLUE", "SCORE_MINUS_1")}
              disabled={actionLoading || isMatchEnded}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              ĐÒN CHÂN
            </button>
          </div>
        </div>
      </div>

      {/* Round tabs and event history */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-lg">Lịch sử sự kiện</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Hiệp hiện tại: {scoreboard.currentRound}
            </span>
            <button
              onClick={handleUndo}
              disabled={actionLoading || events.length === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hoàn tác
            </button>
          </div>
        </div>

        {/* Round tabs */}
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setSelectedRound("all")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              selectedRound === "all"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tất cả
          </button>
          {Array.from({ length: scoreboard.totalRounds }, (_, i) => i + 1).map(
            (round) => {
              const roundEvents = events.filter((e) => e.round === round);
              const redScore =
                roundEvents
                  .filter(
                    (e) =>
                      e.corner === "RED" &&
                      (e.eventType === "SCORE_PLUS_1" ||
                        e.eventType === "SCORE_PLUS_2")
                  )
                  .reduce(
                    (sum, e) => sum + (e.eventType === "SCORE_PLUS_1" ? 1 : 2),
                    0
                  ) -
                roundEvents.filter(
                  (e) => e.corner === "RED" && e.eventType === "SCORE_MINUS_1"
                ).length;
              const blueScore =
                roundEvents
                  .filter(
                    (e) =>
                      e.corner === "BLUE" &&
                      (e.eventType === "SCORE_PLUS_1" ||
                        e.eventType === "SCORE_PLUS_2")
                  )
                  .reduce(
                    (sum, e) => sum + (e.eventType === "SCORE_PLUS_1" ? 1 : 2),
                    0
                  ) -
                roundEvents.filter(
                  (e) => e.corner === "BLUE" && e.eventType === "SCORE_MINUS_1"
                ).length;

              return (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                    selectedRound === round
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Vòng {round}
                  {roundEvents.length > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({redScore} - {blueScore})
                    </span>
                  )}
                  {round === scoreboard.currentRound && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                      Đang đấu
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* Round summary (if specific round selected) */}
        {selectedRound !== "all" &&
          (() => {
            const roundEvents = events.filter((e) => e.round === selectedRound);
            const redScore =
              roundEvents
                .filter(
                  (e) =>
                    e.corner === "RED" &&
                    (e.eventType === "SCORE_PLUS_1" ||
                      e.eventType === "SCORE_PLUS_2")
                )
                .reduce(
                  (sum, e) => sum + (e.eventType === "SCORE_PLUS_1" ? 1 : 2),
                  0
                ) -
              roundEvents.filter(
                (e) => e.corner === "RED" && e.eventType === "SCORE_MINUS_1"
              ).length;
            const blueScore =
              roundEvents
                .filter(
                  (e) =>
                    e.corner === "BLUE" &&
                    (e.eventType === "SCORE_PLUS_1" ||
                      e.eventType === "SCORE_PLUS_2")
                )
                .reduce(
                  (sum, e) => sum + (e.eventType === "SCORE_PLUS_1" ? 1 : 2),
                  0
                ) -
              roundEvents.filter(
                (e) => e.corner === "BLUE" && e.eventType === "SCORE_MINUS_1"
              ).length;
            const redWarnings = roundEvents.filter(
              (e) => e.corner === "RED" && e.eventType === "WARNING"
            ).length;
            const blueWarnings = roundEvents.filter(
              (e) => e.corner === "BLUE" && e.eventType === "WARNING"
            ).length;
            const redMedicalTimeouts = roundEvents.filter(
              (e) => e.corner === "RED" && e.eventType === "MEDICAL_TIMEOUT"
            ).length;
            const blueMedicalTimeouts = roundEvents.filter(
              (e) => e.corner === "BLUE" && e.eventType === "MEDICAL_TIMEOUT"
            ).length;

            return (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-semibold text-red-600 mb-2">
                      Vận động viên Đỏ - Vòng {selectedRound}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        Điểm: <span className="font-bold">{redScore}</span>
                      </div>
                      <div>
                        Cảnh cáo:{" "}
                        <span className="font-bold">{redWarnings}</span>
                      </div>
                      <div>
                        Tạm dừng y tế:{" "}
                        <span className="font-bold">{redMedicalTimeouts}</span>
                      </div>
                      <div>
                        Số sự kiện:{" "}
                        <span className="font-bold">
                          {roundEvents.filter((e) => e.corner === "RED").length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-blue-600 mb-2">
                      Vận động viên Xanh - Vòng {selectedRound}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        Điểm: <span className="font-bold">{blueScore}</span>
                      </div>
                      <div>
                        Cảnh cáo:{" "}
                        <span className="font-bold">{blueWarnings}</span>
                      </div>
                      <div>
                        Tạm dừng y tế:{" "}
                        <span className="font-bold">{blueMedicalTimeouts}</span>
                      </div>
                      <div>
                        Số sự kiện:{" "}
                        <span className="font-bold">
                          {
                            roundEvents.filter((e) => e.corner === "BLUE")
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left border">#</th>
                <th className="p-2 text-left border">Hiệp</th>
                <th className="p-2 text-left border">Thời gian</th>
                <th className="p-2 text-left border">Giám định</th>
                <th className="p-2 text-left border">Góc</th>
                <th className="p-2 text-left border">Sự kiện</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-gray-500 border"
                  >
                    Chưa có sự kiện nào
                  </td>
                </tr>
              ) : (
                (selectedRound === "all"
                  ? events
                  : events.filter((e) => e.round === selectedRound)
                ).map((event, idx) => {
                  const assessorPositions =
                    getAssessorPositionsFromEvent(event);
                  const displayIndex =
                    selectedRound === "all"
                      ? idx + 1
                      : events.findIndex((e) => e.id === event.id) + 1;
                  return (
                    <tr
                      key={event.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-2 text-center border">{displayIndex}</td>
                      <td className="p-2 text-center border">{event.round}</td>
                      <td className="p-2 text-center border">
                        {formatEventTime(event.timestampInRoundSeconds)}
                      </td>
                      <td className="p-2 text-center border">
                        {assessorPositions.length > 0
                          ? assessorPositions.join(", ")
                          : event.judgeId
                          ? getAssessorPositionFromEvent(event.judgeId) || "-"
                          : "-"}
                      </td>
                      <td className="p-2 text-center border">
                        {getCornerLabel(event.corner)}
                      </td>
                      <td className="p-2 text-center border">
                        {getEventTypeLabel(event.eventType)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Assessor Indicator */}
      {selectedAssessor && (
        <div className="fixed bottom-4 right-4 bg-yellow-400 px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-semibold text-yellow-900">
            Giám định được chọn: {selectedAssessor}
            {assessors.find((a) => a.position === selectedAssessor) && (
              <span className="ml-2 text-xs">
                (
                {
                  assessors.find((a) => a.position === selectedAssessor)
                    ?.userFullName
                }
                )
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
