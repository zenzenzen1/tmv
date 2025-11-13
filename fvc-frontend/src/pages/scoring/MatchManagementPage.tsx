import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import matchScoringService, { type MatchScoreboard, type MatchAssessor } from "../../services/matchScoringService";
import { fieldService } from "../../services/fieldService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useToast } from "../../components/common/ToastContext";
import type { FieldResponse } from "../../types";
import apiClient from "../../config/axios";
import { API_ENDPOINTS } from "../../config/endpoints";

interface User {
  id: string;
  fullName: string;
  personalMail?: string;
  eduMail?: string;
  systemRole: string;
}

interface AssessorAssignment {
  userId: string;
  position: number;
  role: 'ASSESSOR' | 'JUDGER';
  notes?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "CHỜ BẮT ĐẦU":
    case "PENDING":
      return "bg-gray-100 text-gray-800";
    case "ĐANG ĐẤU":
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "TẠM DỪNG":
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800";
    case "KẾT THÚC":
    case "ENDED":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function MatchManagementPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [scoreboard, setScoreboard] = useState<MatchScoreboard | null>(null);
  const [assessors, setAssessors] = useState<MatchAssessor[]>([]);
  const [fields, setFields] = useState<FieldResponse[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [roundDuration, setRoundDuration] = useState<number>(120);
  const [mainRoundDuration, setMainRoundDuration] = useState<number>(120);
  const [tiebreakerDuration, setTiebreakerDuration] = useState<number>(60);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showRoundsConfigModal, setShowRoundsConfigModal] = useState(false);
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduledTimeModal, setShowScheduledTimeModal] = useState(false);
  const [scheduledStartTimeInput, setScheduledStartTimeInput] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignments, setAssignments] = useState<Record<number, AssessorAssignment | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });
  const [redAthletePresent, setRedAthletePresent] = useState<boolean>(false);
  const [blueAthletePresent, setBlueAthletePresent] = useState<boolean>(false);

  const fetchMatchData = useCallback(async () => {
    if (!matchId) {
      toast.error("Match ID không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      const [data, assessorData] = await Promise.all([
        matchScoringService.getScoreboard(matchId),
        matchScoringService.getMatchAssessors(matchId).catch(() => [])
      ]);
      
      setScoreboard(data);
      setAssessors(assessorData.sort((a, b) => a.position - b.position));
      setRoundDuration(data.roundDurationSeconds);
      setMainRoundDuration(data.mainRoundDurationSeconds || 120);
      setTiebreakerDuration(data.tiebreakerDurationSeconds || 60);
      setTotalRounds(data.totalRounds);
      setRedAthletePresent(data.redAthletePresent || false);
      setBlueAthletePresent(data.blueAthletePresent || false);
      // Set scheduled start time input for editing
      if (data.scheduledStartTime) {
        const date = new Date(data.scheduledStartTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setScheduledStartTimeInput(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setScheduledStartTimeInput("");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể tải dữ liệu trận đấu";
      toast.error(errorMessage);
      console.error("Error fetching match data:", err);
    } finally {
      setLoading(false);
    }
  }, [matchId, toast]);

  // Fetch fields list
  useEffect(() => {
    async function fetchFields() {
      try {
        const response = await fieldService.list({ page: 0, size: 100 });
        if (response.content) {
          setFields(response.content);
        }
      } catch (err) {
        console.error("Error fetching fields:", err);
      }
    }
    fetchFields();
  }, []);

  // Sync selectedFieldId when scoreboard or fields change
  useEffect(() => {
    if (scoreboard?.field && fields.length > 0) {
      const currentField = fields.find(f => f.location === scoreboard.field);
      if (currentField) {
        setSelectedFieldId(currentField.id);
      }
    } else if (!scoreboard?.field) {
      setSelectedFieldId(null);
    }
  }, [scoreboard?.field, fields]);

  // Load assignments from existing assessors when modal opens
  useEffect(() => {
    if (showAssignModal && assessors.length > 0) {
      const newAssignments: Record<number, AssessorAssignment | null> = {
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
      };
      assessors.forEach((assessor) => {
        newAssignments[assessor.position] = {
          userId: assessor.userId,
          position: assessor.position,
          role: assessor.role as 'ASSESSOR' | 'JUDGER',
          notes: assessor.notes || undefined,
        };
      });
      setAssignments(newAssignments);
    } else if (showAssignModal && assessors.length === 0) {
      setAssignments({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
    }
  }, [showAssignModal, assessors]);

  // Fetch users when modal opens
  useEffect(() => {
    if (showAssignModal && users.length === 0) {
      async function fetchUsers() {
        try {
          setUsersLoading(true);
          const response = await apiClient.get(API_ENDPOINTS.USERS.BASE);
          setUsers(response.data?.data?.content || response.data?.data || []);
        } catch (err: any) {
          console.error('Error fetching users:', err);
        } finally {
          setUsersLoading(false);
        }
      }
      fetchUsers();
    }
  }, [showAssignModal, users.length]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const handleStartMatch = async () => {
    if (!matchId || !scoreboard) return;

    try {
      setActionLoading(true);
      
      // Check if we have exactly 6 assessors (5 ASSESSOR + 1 JUDGER)
      if (assessors.length !== 6) {
        toast.error(`Trận đấu cần đúng 6 người (5 giám định + 1 trọng tài) trước khi bắt đầu. Hiện tại có ${assessors.length} người.`, 5000);
        setActionLoading(false);
        return;
      }

      // Check if we have exactly 1 JUDGER (position 6)
      const judgerCount = assessors.filter(
        (a) => a.role === "JUDGER" || a.position === 6
      ).length;
      if (judgerCount !== 1) {
        toast.error(`Trận đấu cần đúng 1 trọng tài (vị trí 6). Hiện tại có ${judgerCount} trọng tài.`, 5000);
        setActionLoading(false);
        return;
      }

      // Validate scheduled start time
      if (scoreboard.scheduledStartTime) {
        const scheduledTime = new Date(scoreboard.scheduledStartTime);
        const now = new Date();
        if (now < scheduledTime) {
          const timeDiff = Math.ceil((scheduledTime.getTime() - now.getTime()) / 1000 / 60); // minutes
          toast.error(`Chưa đến giờ bắt đầu trận đấu. Giờ bắt đầu: ${scheduledTime.toLocaleString('vi-VN')}. Còn ${timeDiff} phút nữa.`, 5000);
          setActionLoading(false);
          return;
        }
      }

      // Validate both athletes are present
      if (!redAthletePresent || !blueAthletePresent) {
        const missingAthletes = [];
        if (!redAthletePresent) missingAthletes.push(scoreboard.redAthlete.name);
        if (!blueAthletePresent) missingAthletes.push(scoreboard.blueAthlete.name);
        toast.error(`Vui lòng xác nhận cả hai vận động viên đã có mặt: ${missingAthletes.join(", ")}`, 5000);
        setActionLoading(false);
        return;
      }

      // Note: Connection check will be done on backend
      // Frontend can show a warning but backend will enforce it
      
      await matchScoringService.controlMatch(matchId, {
        action: "START"
      });
      await fetchMatchData();
      toast.success("Trận đấu đã được bắt đầu!", 5000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể bắt đầu trận đấu";
      toast.error(errorMessage, 5000);
      console.error("Error starting match:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDuration = async () => {
    if (!matchId || !scoreboard) return;

    // Only allow updating if match hasn't started
    if (scoreboard.status !== "CHỜ BẮT ĐẦU" && scoreboard.status !== "PENDING") {
      setShowDurationModal(false);
      toast.warning("Chỉ có thể thay đổi thời gian vòng đấu khi trận đấu chưa bắt đầu.", 5000);
      return;
    }

    if (roundDuration <= 0) {
      toast.error("Thời gian vòng đấu phải lớn hơn 0");
      return;
    }

    try {
      setActionLoading(true);
      await matchScoringService.updateRoundDuration(matchId, roundDuration);
      await fetchMatchData();
      setShowDurationModal(false);
      toast.success(`Đã cập nhật thời gian vòng đấu thành ${formatTime(roundDuration)} (${roundDuration} giây)!`, 5000);
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể cập nhật thời gian vòng đấu";
      toast.error(errorMessage);
      console.error("Error updating duration:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRoundsConfig = async () => {
    if (!matchId || !scoreboard) return;

    // Only allow updating if match hasn't started
    if (scoreboard.status !== "CHỜ BẮT ĐẦU" && scoreboard.status !== "PENDING") {
      setShowRoundsConfigModal(false);
      toast.warning("Chỉ có thể thay đổi cấu hình rounds khi trận đấu chưa bắt đầu.", 5000);
      return;
    }

    if (mainRoundDuration <= 0 || tiebreakerDuration <= 0) {
      toast.error("Thời gian hiệp chính và hiệp phụ phải lớn hơn 0");
      return;
    }

    try {
      setActionLoading(true);
      
      // Update both durations
      await Promise.all([
        matchScoringService.updateMainRoundDuration(matchId, mainRoundDuration),
        matchScoringService.updateTiebreakerDuration(matchId, tiebreakerDuration)
      ]);
      
      await fetchMatchData();
      setShowRoundsConfigModal(false);
      toast.success(`Đã cập nhật cấu hình rounds! Hiệp chính: ${formatTime(mainRoundDuration)}, Hiệp phụ: ${formatTime(tiebreakerDuration)}`, 5000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể cập nhật cấu hình rounds";
      toast.error(errorMessage, 5000);
      console.error("Error updating rounds config:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTotalRounds = async () => {
    if (!matchId || !scoreboard) return;

    // Only allow updating if match hasn't started
    if (scoreboard.status !== "CHỜ BẮT ĐẦU" && scoreboard.status !== "PENDING") {
      setShowRoundsModal(false);
      toast.warning("Chỉ có thể thay đổi số lượng vòng đấu khi trận đấu chưa bắt đầu.", 5000);
      return;
    }

    if (totalRounds < 1) {
      toast.error("Số lượng vòng đấu phải lớn hơn hoặc bằng 1");
      return;
    }

    try {
      setActionLoading(true);
      await matchScoringService.updateTotalRounds(matchId, totalRounds);
      await fetchMatchData();
      setShowRoundsModal(false);
      toast.success(`Đã cập nhật số lượng vòng đấu thành ${totalRounds}!`, 5000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể cập nhật số lượng vòng đấu";
      toast.error(errorMessage, 5000);
      console.error("Error updating total rounds:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateField = async () => {
    if (!matchId || !scoreboard) return;

    // Only allow updating if match hasn't started
    if (scoreboard.status !== "CHỜ BẮT ĐẦU" && scoreboard.status !== "PENDING") {
      toast.warning("Chỉ có thể thay đổi sân thi đấu khi trận đấu chưa bắt đầu.", 5000);
      return;
    }

    try {
      setActionLoading(true);
      await matchScoringService.updateField(matchId, selectedFieldId);
      await fetchMatchData();
      const fieldName = selectedFieldId 
        ? fields.find(f => f.id === selectedFieldId)?.location || "đã chọn"
        : "đã bỏ chọn";
      toast.success(`Đã cập nhật sân thi đấu thành ${fieldName}!`, 5000);
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể cập nhật sân thi đấu";
      toast.error(errorMessage);
      console.error("Error updating field:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignUser = (position: number, userId: string, role: 'ASSESSOR' | 'JUDGER') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setAssignments(prev => ({
      ...prev,
      [position]: {
        userId,
        position,
        role,
      },
    }));
  };

  const handleRemoveAssessor = (position: number) => {
    setAssignments(prev => ({
      ...prev,
      [position]: null,
    }));
  };

  const handleAssignAssessors = async () => {
    if (!matchId) return;

    // Collect all assignments
    const assessorsList = Object.values(assignments)
      .filter((a): a is AssessorAssignment => a !== null)
      .map(a => ({
        userId: a.userId,
        position: a.position,
        role: a.role,
        notes: a.notes,
      }));

    if (assessorsList.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một giám định viên", 5000);
      return;
    }

    // Check for duplicate positions
    const positions = assessorsList.map(a => a.position);
    if (new Set(positions).size !== positions.length) {
      toast.warning("Mỗi vị trí chỉ có thể có 1 giám định", 5000);
      return;
    }

    try {
      setAssigning(true);
      await apiClient.post(API_ENDPOINTS.MATCH_ASSESSORS.ASSIGN, {
        matchId,
        assessors: assessorsList,
      });

      toast.success("Chỉ định giám định viên thành công!", 5000);
      await fetchMatchData();
      setShowAssignModal(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể chỉ định giám định viên";
      toast.error(errorMessage);
      console.error("Error assigning assessors:", err);
    } finally {
      setAssigning(false);
    }
  };

  // Update athlete presence when checkbox changes
  const handleAthletePresenceChange = async (athlete: 'red' | 'blue', present: boolean) => {
    if (!matchId) return;

    const newRedPresent = athlete === 'red' ? present : redAthletePresent;
    const newBluePresent = athlete === 'blue' ? present : blueAthletePresent;

    // Update local state immediately for better UX
    if (athlete === 'red') {
      setRedAthletePresent(present);
    } else {
      setBlueAthletePresent(present);
    }

    try {
      await matchScoringService.updateAthletePresence(matchId, newRedPresent, newBluePresent);
      // Optionally show a subtle success message
    } catch (err: any) {
      // Revert on error
      if (athlete === 'red') {
        setRedAthletePresent(!present);
      } else {
        setBlueAthletePresent(!present);
      }
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể cập nhật trạng thái";
      toast.error(errorMessage);
      console.error("Error updating athlete presence:", err);
    }
  };

  const handleUpdateScheduledStartTime = async () => {
    if (!matchId) return;

    try {
      setActionLoading(true);
      
      // Convert datetime-local format to ISO string
      let scheduledTime: string | null = null;
      if (scheduledStartTimeInput) {
        const date = new Date(scheduledStartTimeInput);
        scheduledTime = date.toISOString();
      }

      await matchScoringService.updateScheduledStartTime(matchId, scheduledTime);
      await fetchMatchData();
      setShowScheduledTimeModal(false);
      toast.success("Giờ bắt đầu dự kiến đã được cập nhật!", 5000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể cập nhật giờ bắt đầu";
      toast.error(errorMessage, 5000);
      console.error("Error updating scheduled start time:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const canStartMatch = scoreboard && (scoreboard.status === "CHỜ BẮT ĐẦU" || scoreboard.status === "PENDING");

  // Check if all conditions are met to start match
  const canStartMatchNow = useMemo(() => {
    if (!scoreboard || !canStartMatch) return false;
    
    // Check scheduled time
    if (scoreboard.scheduledStartTime) {
      const scheduledTime = new Date(scoreboard.scheduledStartTime);
      const now = new Date();
      if (now < scheduledTime) {
        return false;
      }
    }
    
    // Check athletes are present
    if (!redAthletePresent || !blueAthletePresent) {
      return false;
    }
    
    return true;
  }, [scoreboard, canStartMatch, redAthletePresent, blueAthletePresent]);

  // Get reason why match cannot start
  const getStartMatchReason = useMemo(() => {
    if (!scoreboard || !canStartMatch) return "";
    
    const reasons: string[] = [];
    
    // Check scheduled time
    if (scoreboard.scheduledStartTime) {
      const scheduledTime = new Date(scoreboard.scheduledStartTime);
      const now = new Date();
      if (now < scheduledTime) {
        const timeDiff = Math.ceil((scheduledTime.getTime() - now.getTime()) / 1000 / 60);
        reasons.push(`Chưa đến giờ bắt đầu (còn ${timeDiff} phút)`);
      }
    }
    
    // Check athletes
    if (!redAthletePresent) {
      reasons.push(`Chưa xác nhận ${scoreboard.redAthlete.name} có mặt`);
    }
    if (!blueAthletePresent) {
      reasons.push(`Chưa xác nhận ${scoreboard.blueAthlete.name} có mặt`);
    }
    
    return reasons.join(", ");
  }, [scoreboard, canStartMatch, redAthletePresent, blueAthletePresent]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }


  if (!scoreboard) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Không tìm thấy trận đấu</h3>
          <button
            onClick={() => navigate("/manage/scoring/matches")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/manage/scoring/matches")}
            className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Quay lại danh sách trận đấu
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý trận đấu</h1>
          <p className="text-sm text-gray-600">
            {scoreboard.roundType}
            {scoreboard.weightClass && ` - ${scoreboard.weightClass}`}
            {scoreboard.field && ` - Sân: ${scoreboard.field}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRoundsConfigModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            Cấu hình rounds
          </button>
          {canStartMatch && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleStartMatch}
                disabled={actionLoading || !canStartMatchNow}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canStartMatchNow ? getStartMatchReason : ""}
              >
                {actionLoading ? "Đang xử lý..." : "Bắt đầu trận đấu"}
              </button>
              {!canStartMatchNow && getStartMatchReason && (
                <p className="text-xs text-red-600 max-w-xs text-right">
                  {getStartMatchReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Match Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin trận đấu</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scoreboard.status)}`}>
            {scoreboard.status}
          </span>
        </div>

        {/* Scheduled Start Time */}
        {canStartMatch && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-blue-900">Giờ bắt đầu dự kiến</p>
                  <button
                    onClick={() => setShowScheduledTimeModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    {scoreboard.scheduledStartTime ? "Chỉnh sửa" : "Thiết lập"}
                  </button>
                </div>
                {scoreboard.scheduledStartTime ? (
                  <>
                    <p className="text-lg font-semibold text-blue-700">
                      {new Date(scoreboard.scheduledStartTime).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {(() => {
                      const scheduledTime = new Date(scoreboard.scheduledStartTime!);
                      const now = new Date();
                      const isTimeReached = now >= scheduledTime;
                      return (
                        <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          isTimeReached 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isTimeReached ? '✓ Đã đến giờ' : '⏰ Chưa đến giờ'}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">Chưa thiết lập giờ bắt đầu</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Red Athlete */}
          <div className="border-l-4 border-red-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <h3 className="font-semibold text-gray-900">Vận động viên đỏ</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">{scoreboard.redAthlete.name}</p>
            <p className="text-sm text-gray-600">{scoreboard.redAthlete.unit}</p>
            {scoreboard.redAthlete.sbtNumber && (
              <p className="text-xs text-gray-500 mt-1">SBT: {scoreboard.redAthlete.sbtNumber}</p>
            )}
            {canStartMatch && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="red-athlete-present"
                  checked={redAthletePresent}
                  onChange={(e) => handleAthletePresenceChange('red', e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="red-athlete-present" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Xác nhận vận động viên đã có mặt
                </label>
              </div>
            )}
            {!canStartMatch && redAthletePresent && (
              <div className="mt-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  ✓ Đã xác nhận có mặt
                </span>
              </div>
            )}
          </div>

          {/* Blue Athlete */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <h3 className="font-semibold text-gray-900">Vận động viên xanh</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">{scoreboard.blueAthlete.name}</p>
            <p className="text-sm text-gray-600">{scoreboard.blueAthlete.unit}</p>
            {scoreboard.blueAthlete.sbtNumber && (
              <p className="text-xs text-gray-500 mt-1">SBT: {scoreboard.blueAthlete.sbtNumber}</p>
            )}
            {canStartMatch && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="blue-athlete-present"
                  checked={blueAthletePresent}
                  onChange={(e) => handleAthletePresenceChange('blue', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="blue-athlete-present" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Xác nhận vận động viên đã có mặt
                </label>
              </div>
            )}
            {!canStartMatch && blueAthletePresent && (
              <div className="mt-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  ✓ Đã xác nhận có mặt
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Match Settings */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Vòng hiện tại</p>
                <p className="text-lg font-semibold text-gray-900">
                  {scoreboard.currentRound}/{scoreboard.totalRounds}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Thời gian mỗi vòng</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(scoreboard.roundDurationSeconds)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Sân thi đấu</p>
              <div className="flex gap-2">
                <select
                  value={selectedFieldId || ""}
                  onChange={(e) => setSelectedFieldId(e.target.value || null)}
                  disabled={!canStartMatch || actionLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Chọn sân --</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.location} {field.isUsed ? "(Đang dùng)" : ""}
                    </option>
                  ))}
                </select>
                {canStartMatch && (
                  <button
                    onClick={handleUpdateField}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? "Đang lưu..." : "Lưu"}
                  </button>
                )}
              </div>
              {scoreboard.field && (
                <p className="text-xs text-gray-500 mt-1">
                  Sân hiện tại: {scoreboard.field}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assessors Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Giám định viên</h2>
          {canStartMatch && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Chỉ định giám định
            </button>
          )}
        </div>

        {assessors.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">Chưa có giám định viên</h3>
            <p className="mt-2 text-sm text-gray-500">
              Vui lòng chỉ định giám định viên cho trận đấu này
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessors.map((assessor) => (
              <div
                key={assessor.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{assessor.userFullName}</p>
                    <p className="text-sm text-gray-600">{assessor.userEmail}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    Vị trí {assessor.position}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    assessor.role === "JUDGER" 
                      ? "bg-purple-100 text-purple-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {assessor.role === "JUDGER" ? "Trọng tài" : "Giám định"}
                  </span>
                </div>
                {assessor.notes && (
                  <p className="text-xs text-gray-500 mt-2">{assessor.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duration Modal */}
      {showDurationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thời gian vòng đấu</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian vòng đấu (giây)
              </label>
              <input
                type="number"
                min="1"
                max="600"
                value={roundDuration}
                onChange={(e) => setRoundDuration(parseInt(e.target.value) || 120)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Hiện tại: {formatTime(roundDuration)} ({roundDuration} giây)
              </p>
              {canStartMatch ? (
                <p className="mt-2 text-sm text-blue-600">
                  ℹ️ Bạn có thể thay đổi thời gian vòng đấu trước khi bắt đầu trận đấu.
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ Không thể thay đổi thời gian vòng đấu khi trận đấu đã bắt đầu.
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDurationModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateDuration}
                disabled={actionLoading || !canStartMatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Đang cập nhật..." : canStartMatch ? "Cập nhật" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rounds Config Modal */}
      {showRoundsConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình rounds</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian hiệp chính (giây)
                </label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={mainRoundDuration}
                  onChange={(e) => setMainRoundDuration(parseInt(e.target.value) || 120)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Hiện tại: {formatTime(mainRoundDuration)} ({mainRoundDuration} giây)
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Áp dụng cho round 1 và 2
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian hiệp phụ (giây)
                </label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={tiebreakerDuration}
                  onChange={(e) => setTiebreakerDuration(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Hiện tại: {formatTime(tiebreakerDuration)} ({tiebreakerDuration} giây)
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Áp dụng cho round 3 trở đi
                </p>
              </div>

              {canStartMatch ? (
                <p className="mt-2 text-sm text-blue-600">
                  ℹ️ Bạn có thể thay đổi cấu hình rounds trước khi bắt đầu trận đấu.
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ Không thể thay đổi cấu hình rounds khi trận đấu đã bắt đầu.
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRoundsConfigModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateRoundsConfig}
                disabled={actionLoading || !canStartMatch}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Đang cập nhật..." : canStartMatch ? "Cập nhật" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total Rounds Modal */}
      {showRoundsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt số vòng đấu</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số vòng đấu
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={totalRounds}
                onChange={(e) => setTotalRounds(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Hiện tại: {totalRounds} vòng đấu
              </p>
              {canStartMatch ? (
                <p className="mt-2 text-sm text-blue-600">
                  ℹ️ Bạn có thể thay đổi số vòng đấu trước khi bắt đầu trận đấu.
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ Không thể thay đổi số vòng đấu khi trận đấu đã bắt đầu.
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRoundsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateTotalRounds}
                disabled={actionLoading || !canStartMatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Đang cập nhật..." : canStartMatch ? "Cập nhật" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Assessors Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Chỉ định giám định viên</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Vị trí 1-5: Giám định | Vị trí 6: Trọng tài máy
            </p>

            {usersLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {[1, 2, 3, 4, 5, 6].map((position) => {
                  const assignment = assignments[position];
                  const role = position === 6 ? 'JUDGER' : 'ASSESSOR';
                  const isAutoJudge = position === 6;
                  
                  return (
                    <div key={position} className={`flex items-center gap-4 p-4 border rounded-lg ${isAutoJudge ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="w-20 text-sm font-medium">
                        Vị trí {position}:<br />
                        <span className="text-xs text-gray-500">
                          {isAutoJudge ? 'Trọng tài máy' : 'Giám định'}
                        </span>
                      </div>
                      
                      {assignment ? (
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {users.find(u => u.id === assignment.userId)?.fullName || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {users.find(u => u.id === assignment.userId)?.personalMail || 
                               users.find(u => u.id === assignment.userId)?.eduMail || ''}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAssessor(position)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignUser(position, e.target.value, role);
                              }
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Chọn giám định --</option>
                            {users
                              .filter(user => {
                                // Only show users with TEACHER or EXECUTIVE_BOARD role
                                const hasValidRole = user.systemRole === 'TEACHER' || user.systemRole === 'EXECUTIVE_BOARD';
                                if (!hasValidRole) return false;
                                
                                // Don't show users already assigned
                                const alreadyAssigned = Object.values(assignments)
                                  .some(a => a && a.userId === user.id);
                                return !alreadyAssigned;
                              })
                              .map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.fullName} ({user.personalMail || user.eduMail || 'No email'})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignAssessors}
                disabled={assigning}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? "Đang chỉ định..." : "Chỉ định giám định"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Start Time Modal */}
      {showScheduledTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình giờ bắt đầu dự kiến</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ bắt đầu dự kiến
              </label>
              <input
                type="datetime-local"
                value={scheduledStartTimeInput}
                onChange={(e) => setScheduledStartTimeInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                ℹ️ Trận đấu chỉ có thể bắt đầu khi đã đến giờ này và cả hai vận động viên đã được xác nhận có mặt.
              </p>
              <button
                onClick={() => {
                  setScheduledStartTimeInput("");
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Xóa giờ bắt đầu
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowScheduledTimeModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateScheduledStartTime}
                disabled={actionLoading || !canStartMatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Đang cập nhật..." : canStartMatch ? "Lưu" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

