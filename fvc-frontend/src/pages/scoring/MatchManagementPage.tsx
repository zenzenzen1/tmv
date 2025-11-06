import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import matchScoringService, { type MatchScoreboard, type MatchAssessor } from "../../services/matchScoringService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useToast } from "../../components/common/ToastContext";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [roundDuration, setRoundDuration] = useState<number>(120);
  const [showDurationModal, setShowDurationModal] = useState(false);

  const fetchMatchData = useCallback(async () => {
    if (!matchId) {
      setError("Match ID không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [data, assessorData] = await Promise.all([
        matchScoringService.getScoreboard(matchId),
        matchScoringService.getMatchAssessors(matchId).catch(() => [])
      ]);
      
      setScoreboard(data);
      setAssessors(assessorData.sort((a, b) => a.position - b.position));
      setRoundDuration(data.roundDurationSeconds);
    } catch (err: any) {
      setError(err?.message || "Không thể tải dữ liệu trận đấu");
      console.error("Error fetching match data:", err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const handleStartMatch = async () => {
    if (!matchId || !scoreboard) return;

    try {
      setActionLoading(true);
      setError(null);
      await matchScoringService.controlMatch(matchId, {
        action: "START"
      });
      await fetchMatchData();
      toast.success("Trận đấu đã được bắt đầu!", 5000);
    } catch (err: any) {
      setError(err?.message || "Không thể bắt đầu trận đấu");
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
      setError("Thời gian vòng đấu phải lớn hơn 0");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await matchScoringService.updateRoundDuration(matchId, roundDuration);
      await fetchMatchData();
      setShowDurationModal(false);
      toast.success(`Đã cập nhật thời gian vòng đấu thành ${formatTime(roundDuration)} (${roundDuration} giây)!`, 5000);
    } catch (err: any) {
      setError(err?.message || "Không thể cập nhật thời gian vòng đấu");
      console.error("Error updating duration:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const canStartMatch = scoreboard && (scoreboard.status === "CHỜ BẮT ĐẦU" || scoreboard.status === "PENDING");

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !scoreboard) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage error={error} onRetry={fetchMatchData} />
      </div>
    );
  }

  if (!scoreboard) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Không tìm thấy trận đấu</h3>
          <button
            onClick={() => navigate("/manage/scoring")}
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
            onClick={() => navigate("/manage/scoring")}
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
            onClick={() => setShowDurationModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
          >
            Cài đặt thời gian
          </button>
          {canStartMatch && (
            <button
              onClick={handleStartMatch}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? "Đang xử lý..." : "Bắt đầu trận đấu"}
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage error={error} />}

      {/* Match Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin trận đấu</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scoreboard.status)}`}>
            {scoreboard.status}
          </span>
        </div>

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
          </div>
        </div>

        {/* Match Settings */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        </div>
      </div>

      {/* Assessors Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Giám định viên</h2>
          <button
            onClick={() => navigate(`/manage/scoring/assign-assessors?matchId=${matchId}`)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Gán giám định
          </button>
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
              Vui lòng gán giám định viên cho trận đấu này
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
    </div>
  );
}

