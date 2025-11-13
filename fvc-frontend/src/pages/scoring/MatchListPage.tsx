import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import matchScoringService, { type MatchListItem } from "../../services/matchScoringService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useToast } from "../../components/common/ToastContext";
import { useWeightClassStore } from "../../stores/weightClass";
import type { WeightClassResponse } from "../../types";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string | null): string {
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

function formatTime(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return dateString;
  }
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
    case "HỦY":
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function MatchListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [weightClassFilter, setWeightClassFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<string>("");
  const { list: weightClassList, fetch: fetchWeightClasses } = useWeightClassStore();

  // Fetch weight classes on mount
  useEffect(() => {
    fetchWeightClasses({ size: 100 });
  }, [fetchWeightClasses]);

  // Create a map of weightClassId -> weight class info
  const weightClassMap = useMemo(() => {
    const map = new Map<string, { name: string; gender: string }>();
    if (weightClassList?.content) {
      weightClassList.content.forEach((wc: WeightClassResponse) => {
        const genderLabel = wc.gender === "MALE" ? "Nam" : wc.gender === "FEMALE" ? "Nữ" : "";
        const weightRange = `${wc.minWeight}-${wc.maxWeight}kg`;
        map.set(wc.id, {
          name: genderLabel ? `${genderLabel} - ${weightRange}` : weightRange,
          gender: wc.gender || "",
        });
      });
    }
    return map;
  }, [weightClassList]);

  // Get unique weight classes for filter
  const uniqueWeightClasses = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; gender: string }>();
    if (weightClassList?.content) {
      weightClassList.content.forEach((wc: WeightClassResponse) => {
        if (!unique.has(wc.id)) {
          const genderLabel = wc.gender === "MALE" ? "Nam" : wc.gender === "FEMALE" ? "Nữ" : "";
          const weightRange = `${wc.minWeight}-${wc.maxWeight}kg`;
          unique.set(wc.id, {
            id: wc.id,
            name: genderLabel ? `${genderLabel} - ${weightRange}` : weightRange,
            gender: wc.gender || "",
          });
        }
      });
    }
    return Array.from(unique.values());
  }, [weightClassList]);

  // Function to get weight class display name
  const getWeightClassName = (weightClassId: string | null): string => {
    if (!weightClassId) return "";
    return weightClassMap.get(weightClassId)?.name || weightClassId;
  };

  // Fetch matches
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const data = await matchScoringService.listMatches(undefined, statusFilter || undefined);
        setMatches(data);
      } catch (err: any) {
        const errorMessage = err?.message || "Không thể tải danh sách trận đấu";
        toast.error(errorMessage);
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [statusFilter, toast]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // Filter by weight class
      if (weightClassFilter && match.weightClassId !== weightClassFilter) {
        return false;
      }

      // Filter by date (scheduledStartTime or startedAt or createdAt)
      if (dateFilter) {
        const matchDate = match.scheduledStartTime || match.startedAt || match.createdAt;
        if (matchDate) {
          const matchDateStr = formatDate(matchDate);
          if (matchDateStr !== dateFilter) {
            return false;
          }
        } else {
          return false;
        }
      }

      // Filter by time (scheduledStartTime or startedAt)
      if (timeFilter) {
        const matchTime = match.scheduledStartTime || match.startedAt;
        if (matchTime) {
          const matchTimeStr = formatTime(matchTime);
          if (matchTimeStr !== timeFilter) {
            return false;
          }
        } else {
          return false;
        }
      }

      return true;
    });
  }, [matches, weightClassFilter, dateFilter, timeFilter, weightClassMap]);

  // Get unique dates from matches for date filter
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    matches.forEach((match) => {
      const matchDate = match.scheduledStartTime || match.startedAt || match.createdAt;
      if (matchDate) {
        dates.add(formatDate(matchDate));
      }
    });
    return Array.from(dates).sort();
  }, [matches]);

  // Get unique times from matches for time filter
  const availableTimes = useMemo(() => {
    const times = new Set<string>();
    matches.forEach((match) => {
      const matchTime = match.scheduledStartTime || match.startedAt;
      if (matchTime) {
        times.add(formatTime(matchTime));
      }
    });
    return Array.from(times).sort();
  }, [matches]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Danh sách trận đấu</h1>
          <p className="text-sm text-gray-600">
            Xem và quản lý tất cả các trận đấu
          </p>
        </div>
        <button
          onClick={() => navigate('/manage/scoring/assign-assessors')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Chỉ định giám định
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ bắt đầu</option>
              <option value="IN_PROGRESS">Đang đấu</option>
              <option value="PAUSED">Tạm dừng</option>
              <option value="ENDED">Kết thúc</option>
              <option value="CANCELLED">Hủy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hạng cân
            </label>
            <select
              value={weightClassFilter}
              onChange={(e) => setWeightClassFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {uniqueWeightClasses.map((wc) => (
                <option key={wc.id} value={wc.id}>
                  {wc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày đấu
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giờ đấu
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị: <span className="font-semibold">{filteredMatches.length}</span> / {matches.length} trận đấu
          </div>
          {(weightClassFilter || dateFilter || timeFilter) && (
            <button
              onClick={() => {
                setWeightClassFilter("");
                setDateFilter("");
                setTimeFilter("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredMatches.length === 0 ? (
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
            {statusFilter || weightClassFilter || dateFilter || timeFilter
              ? "Không có trận đấu nào phù hợp với bộ lọc"
              : "Chưa có trận đấu nào được tạo"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vòng đấu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạng cân
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vận động viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiến độ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{match.roundType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {match.weightClassId ? getWeightClassName(match.weightClassId) : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="font-medium text-gray-900">{match.redAthleteName}</span>
                          {match.redAthleteUnit && (
                            <span className="text-xs text-gray-500">({match.redAthleteUnit})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="font-medium text-gray-900">{match.blueAthleteName}</span>
                          {match.blueAthleteUnit && (
                            <span className="text-xs text-gray-500">({match.blueAthleteUnit})</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {match.scheduledStartTime
                          ? formatDateTime(match.scheduledStartTime)
                          : match.startedAt
                          ? formatDateTime(match.startedAt)
                          : "-"}
                      </div>
                      {match.scheduledStartTime && (
                        <div className="text-xs text-gray-500">
                          {formatTime(match.scheduledStartTime)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}
                      >
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Vòng {match.currentRound}/{match.totalRounds}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/manage/scoring/${match.id}/manage`)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Quản lý
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
