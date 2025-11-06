import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import matchScoringService, { type MatchListItem } from "../../services/matchScoringService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useWeightClassStore } from "../../stores/weightClass";
import type { WeightClassResponse } from "../../types";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "CHỜ BẮT ĐẦU":
      return "bg-gray-100 text-gray-800";
    case "ĐANG ĐẤU":
      return "bg-blue-100 text-blue-800";
    case "TẠM DỪNG":
      return "bg-yellow-100 text-yellow-800";
    case "KẾT THÚC":
      return "bg-green-100 text-green-800";
    case "HỦY":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function SelectMatchPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { list: weightClassList, fetch: fetchWeightClasses } = useWeightClassStore();

  // Fetch weight classes on mount
  useEffect(() => {
    fetchWeightClasses({ size: 100 });
  }, [fetchWeightClasses]);

  // Create a map of weightClassId -> weight class name
  const weightClassMap = useMemo(() => {
    const map = new Map<string, string>();
    if (weightClassList?.content) {
      weightClassList.content.forEach((wc: WeightClassResponse) => {
        const genderLabel = wc.gender === "MALE" ? "Nam" : wc.gender === "FEMALE" ? "Nữ" : "";
        const weightRange = `${wc.minWeight}-${wc.maxWeight}kg`;
        map.set(wc.id, genderLabel ? `${genderLabel} - ${weightRange}` : weightRange);
      });
    }
    return map;
  }, [weightClassList]);

  // Function to get weight class display name
  const getWeightClassName = (weightClassId: string | null): string => {
    if (!weightClassId) return "";
    return weightClassMap.get(weightClassId) || weightClassId;
  };

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        setError(null);
        const data = await matchScoringService.listMatches(undefined, statusFilter || undefined);
        setMatches(data);
      } catch (err: any) {
        setError(err?.message || "Không thể tải danh sách trận đấu");
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [statusFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chấm điểm</h1>
          <p className="text-sm text-gray-600">
            Chọn một trận đấu để bắt đầu chấm điểm
          </p>
        </div>
        <button
          onClick={() => navigate('/manage/scoring/assign-assessors')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Gán giám định
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ bắt đầu</option>
            <option value="IN_PROGRESS">Đang đấu</option>
            <option value="PAUSED">Tạm dừng</option>
            <option value="ENDED">Kết thúc</option>
            <option value="CANCELLED">Hủy</option>
          </select>
          <div className="ml-auto text-sm text-gray-600">
            Tổng: {matches.length} trận đấu
          </div>
        </div>
      </div>

      {error && <ErrorMessage error={error} />}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Không có trận đấu</h3>
          <p className="mt-2 text-sm text-gray-500">
            {statusFilter
              ? "Không có trận đấu nào với trạng thái này"
              : "Chưa có trận đấu nào được tạo"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/scoring/${match.id}`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {match.roundType}
                    </h3>
                    {match.weightClassId && (
                      <p className="text-sm text-gray-500">
                        Hạng cân: {getWeightClassName(match.weightClassId)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}
                  >
                    {match.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{match.redAthleteName}</p>
                      {match.redAthleteUnit && (
                        <p className="text-xs text-gray-500">{match.redAthleteUnit}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{match.blueAthleteName}</p>
                      {match.blueAthleteUnit && (
                        <p className="text-xs text-gray-500">{match.blueAthleteUnit}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>
                      Vòng {match.currentRound}/{match.totalRounds}
                    </span>
                    <span>{formatDate(match.createdAt)}</span>
                  </div>
                  {match.startedAt && (
                    <p className="text-xs text-gray-500 mb-3">
                      Bắt đầu: {formatDate(match.startedAt)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manage/scoring/${match.id}/manage`);
                      }}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                    >
                      Quản lý
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/scoring/${match.id}`);
                      }}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                    >
                      Chấm điểm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
