import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cycleService } from "../../services/cycles";
import { phaseService } from "../../services/phases";
import { teamService } from "../../services/teams";
import { teamMemberService } from "../../services/teamMembers";
import userService from "../../services/userService";
import type { ChallengeCycleDto } from "../../types/cycle";
import type { ChallengePhaseDto } from "../../types/phase";
import type { TeamDto } from "../../types/team";
import type { TeamMemberDto } from "../../types/teammember";
import type { UserResponse } from "../../types/user";

interface TeamWithMembers extends TeamDto {
  members: Array<TeamMemberDto & { user?: UserResponse }>;
}

export default function CycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<ChallengeCycleDto | null>(null);
  const [phases, setPhases] = useState<ChallengePhaseDto[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [cycleData, phasesData, teamsData] = await Promise.all([
        cycleService.getById(id),
        phaseService.listByCycle(id, { page: 0, size: 100 }),
        teamService.listByCycle(id, { page: 0, size: 100 }),
      ]);

      setCycle(cycleData);
      setPhases(phasesData.content);

      // Load members for each team
      const teamsWithMembers = await Promise.all(
        teamsData.content.map(async (team) => {
          const membersData = await teamMemberService.listByTeam(team.id, { activeOnly: true, page: 0, size: 100 });
          const membersWithUsers = await Promise.all(
            membersData.content.map(async (member) => {
              try {
                const user = await userService.getUserById(member.userId);
                return { ...member, user };
              } catch {
                return member;
              }
            })
          );
          return { ...team, members: membersWithUsers };
        })
      );
      setTeams(teamsWithMembers);
    } catch (error) {
      console.error("Error loading cycle detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!cycle) return;
    try {
      const updated = await cycleService.activate(cycle.id);
      setCycle(updated);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Không thể kích hoạt chu kỳ");
    }
  };

  const handleComplete = async () => {
    if (!cycle) return;
    try {
      const updated = await cycleService.complete(cycle.id);
      setCycle(updated);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Không thể hoàn thành chu kỳ");
    }
  };

  const handleArchive = async () => {
    if (!cycle) return;
    try {
      const updated = await cycleService.archive(cycle.id);
      setCycle(updated);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Không thể lưu trữ chu kỳ");
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  if (!cycle) {
    return <div className="p-6">Không tìm thấy chu kỳ</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Chi Tiết Chu Kỳ</h1>
          <p className="text-gray-600">Xem thông tin chu kỳ, giai đoạn, đội và thành viên</p>
        </div>
        <button
          type="button"
          className="text-sm text-indigo-700 hover:text-indigo-800 underline"
          onClick={() => navigate("/manage/cycles")}
        >
          Quay lại Danh Sách
        </button>
      </header>

      {/* Cycle Summary */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Tên Chu Kỳ</p>
            <p className="text-base font-medium text-gray-900">{cycle.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Ngày Bắt Đầu</p>
            <p className="text-base font-medium text-gray-900">{cycle.startDate}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Ngày Kết Thúc</p>
            <p className="text-base font-medium text-gray-900">{cycle.endDate}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Trạng Thái</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
              {cycle.status}
            </span>
          </div>
        </div>
        {cycle.description && (
          <div className="mt-4">
            <p className="text-xs uppercase text-gray-500 mb-1">Mô Tả</p>
            <p className="text-sm text-gray-700">{cycle.description}</p>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          {cycle.status === "DRAFT" && (
            <button className="btn-primary" onClick={handleActivate}>
              Kích Hoạt Chu Kỳ
            </button>
          )}
          {cycle.status === "ACTIVE" && (
            <button className="btn-primary" onClick={handleComplete}>
              Hoàn Thành Chu Kỳ
            </button>
          )}
          {cycle.status === "COMPLETED" && (
            <button className="btn-primary" onClick={handleArchive}>
              Lưu Trữ Chu Kỳ
            </button>
          )}
        </div>
      </section>

      {/* Phases Timeline */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Giai Đoạn</h2>
        {phases.length > 0 ? (
          <ol className="relative border-s border-gray-200">
            {phases.map((phase, index) => (
              <li key={phase.id} className={index < phases.length - 1 ? "mb-8 ms-6" : "ms-6"}>
                <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs">
                  {index + 1}
                </span>
                <h3 className="font-medium text-gray-900">{phase.name}</h3>
                <p className="text-sm text-gray-600">{phase.startDate} → {phase.endDate}</p>
                {phase.description && (
                  <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                )}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(phase.status)}`}>
                  {phase.status}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">Chưa có giai đoạn nào</div>
        )}
      </section>

      {/* Teams and Members */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Đội</h2>
          <div className="text-sm text-gray-500">Tổng Số Đội: {teams.length}</div>
        </div>
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{team.name || `Đội ${team.code}`}</p>
                      <p className="text-xs text-gray-500">Mã: {team.code}</p>
                    </div>
                    <span className="text-xs text-gray-500">{team.members.length} thành viên</span>
                  </div>
                  {team.description && (
                    <p className="text-xs text-gray-500 mt-1">{team.description}</p>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {team.members.length > 0 ? (
                    team.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                          {member.user?.fullName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.user?.fullName || member.userId}
                          </p>
                          {member.user?.studentCode && (
                            <p className="text-xs text-gray-500">{member.user.studentCode}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-2">Không có thành viên</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">Chưa có đội nào</div>
        )}
      </section>
    </div>
  );
}
