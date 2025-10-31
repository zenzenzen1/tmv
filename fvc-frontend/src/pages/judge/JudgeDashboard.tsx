import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Match = {
  id: string;
  order: number;
  type: "quyen" | "music";
  contentName: string;
  participants: string[];
  role: string;
  tournamentName: string;
  status: "pending" | "ongoing" | "completed";
};

const JUDGE_ROLES = ["referee", "judgeA", "judgeB", "judgeC", "timekeeper"];
const ROLE_LABELS: Record<string, string> = {
  referee: "Assesor",
  judgeA: "Assesor A",
  judgeB: "Assesor B",
  judgeC: "Assesor C",
  timekeeper: "Assesor",
};

const JudgeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "pending" | "ongoing" | "all"
  >("all");

  // Mock data: replace with actual API call
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMatches([
        {
          id: "m1",
          order: 1,
          type: "quyen",
          contentName: "Đơn luyện",
          participants: ["Nguyễn Văn A"],
          role: "judgeA",
          tournamentName: "FVCUP 2025 - Spring",
          status: "ongoing",
        },
        {
          id: "m2",
          order: 2,
          type: "quyen",
          contentName: "Song luyện đồng đội",
          participants: ["Trần Thị B", "Lê Văn C"],
          role: "judgeB",
          tournamentName: "FVCUP 2025 - Spring",
          status: "pending",
        },
        {
          id: "m3",
          order: 3,
          type: "music",
          contentName: "Võ nhạc cá nhân",
          participants: ["Phạm Duy D"],
          role: "timekeeper",
          tournamentName: "FVCUP 2025 - Spring",
          status: "completed",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleJoin = (matchId: string, role: string) => {
    navigate(`/performance/judge?matchId=${matchId}&role=${role}`);
  };

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
                  className={`px-2 py-1 text-xs rounded ${
                    match.status === "ongoing"
                      ? "bg-green-100 text-green-700"
                      : match.status === "completed"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {match.status === "ongoing"
                    ? "Đang diễn ra"
                    : match.status === "completed"
                    ? "Hoàn thành"
                    : "Chưa bắt đầu"}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                {match.tournamentName}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Loại:</span>{" "}
                {match.type === "quyen" ? "Quyền" : "Võ nhạc"}
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
                  onClick={() => handleJoin(match.id, match.role)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  {match.status === "ongoing" ? "Tham gia chấm" : "Chờ bắt đầu"}
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
