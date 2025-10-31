import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import type { CompetitionType } from "./ArrangeOrderWrapper";

type AthleteApi = {
  id: string;
  fullName: string;
  email: string;
  gender: "MALE" | "FEMALE";
  studentId?: string | null;
  club?: string | null;
  subCompetitionType?: string | null;
  detailSubCompetitionType?: string | null;
};

type AthleteRow = {
  id: string;
  name: string;
  email: string;
  gender: "Nam" | "Nữ";
  studentId: string;
  club: string;
  subCompetitionType: string;
  detailSubCompetitionType: string;
};

type Match = {
  id: string;
  order: number;
  type: CompetitionType;
  contentName: string;
  participantIds: string[];
  participants: string[];
  assessors: {
    referee?: string;
    judgeA?: string;
    judgeB?: string;
    judgeC?: string;
    timekeeper?: string;
  };
  judgesCount?: number;
  timerSec?: number;
};

const COMPETITION_TYPES: Record<CompetitionType, string> = {
  quyen: "Quyền",
  music: "Võ nhạc",
};

const ASSESSOR_ROLES: Array<{ key: keyof Match["assessors"]; label: string }> =
  [
    { key: "referee", label: "Assesor" },
    { key: "judgeA", label: "Assesor A" },
    { key: "judgeB", label: "Assesor B" },
    { key: "judgeC", label: "Assesor C" },
    { key: "timekeeper", label: "Assesor" },
  ];

interface ArrangeOrderPageProps {
  activeTab: CompetitionType;
  onTabChange: (tab: CompetitionType) => void;
}

export default function ArrangeOrderPage({
  activeTab,
  onTabChange,
}: ArrangeOrderPageProps) {
  const [tournaments, setTournaments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const matchesForActiveType = useMemo(
    () =>
      matches
        .filter((match) => match.type === activeTab)
        .slice()
        .sort((a, b) => a.order - b.order),
    [matches, activeTab]
  );

  const mockAssessors = useMemo(
    () => [
      "Nguyễn Văn A",
      "Trần Thị B",
      "Lê Văn C",
      "Phạm Thị D",
      "Hoàng Văn E",
      "Vũ Thị F",
      "Đỗ Văn G",
    ],
    []
  );

  // Auto-create 4 empty matches for the active type if none exist (Jira-like preset cards)
  useEffect(() => {
    const current = matches.filter((m) => m.type === activeTab);
    if (current.length === 0) {
      const baseOrder = 0;
      const defaults: Match[] = Array.from({ length: 4 }).map((_, idx) => ({
        id: `preset-${activeTab}-${Date.now()}-${idx}`,
        order: baseOrder + idx + 1,
        type: activeTab,
        contentName:
          activeTab === "quyen" ? "Nội dung Quyền" : "Nội dung Võ nhạc",
        participantIds: [],
        participants: [],
        assessors: {},
      }));
      setMatches((prev) => [
        ...prev.filter((m) => m.type !== activeTab),
        ...defaults,
      ]);
    }
  }, [activeTab, matches]);

  // Start modal removed; settings handled in setupModal per match

  const [teamSearch, setTeamSearch] = useState<string>("");
  const [setupModal, setSetupModal] = useState<{
    open: boolean;
    matchId?: string;
    selectedIds: string[];
    assessors: Record<string, string>;
    judgesCount: number;
    defaultTimerSec: number;
  }>({
    open: false,
    selectedIds: [],
    assessors: {},
    judgesCount: 5,
    defaultTimerSec: 120,
  });

  const filteredAthletes = useMemo(() => {
    const keyword = teamSearch.trim().toLowerCase();
    if (!keyword) return athletes;
    return athletes.filter(
      (athlete) =>
        athlete.name.toLowerCase().includes(keyword) ||
        athlete.studentId.toLowerCase().includes(keyword) ||
        athlete.club.toLowerCase().includes(keyword)
    );
  }, [athletes, teamSearch]);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        type CompetitionOption = { id: string; name: string };
        const res = await api.get<CompetitionOption[]>(
          API_ENDPOINTS.TOURNAMENT_FORMS.COMPETITIONS
        );
        const list = res.data ?? [];
        setTournaments(list);
        if (list.length > 0) {
          setSelectedTournament((prev) => prev || list[0].id);
        }
      } catch (error) {
        console.error("Failed to load tournaments:", error);
      }
    };

    loadTournaments();
  }, []);

  useEffect(() => {
    const loadAthletes = async () => {
      if (!selectedTournament) {
        setAthletes([]);
        return;
      }

      try {
        const qs = new URLSearchParams();
        qs.set("page", "0");
        qs.set("size", "200");
        qs.set("competitionType", activeTab);
        qs.set("tournamentId", selectedTournament);

        const res = await api.get<PaginationResponse<AthleteApi>>(
          `${API_ENDPOINTS.ATHLETES.BASE}?${qs.toString()}`
        );

        const rootAny = res.data as unknown as Record<string, unknown>;
        const outer = (rootAny?.data as Record<string, unknown>) ?? rootAny;
        const inner =
          (outer?.data as PaginationResponse<AthleteApi>) ??
          (outer as unknown as PaginationResponse<AthleteApi>);
        const content = inner?.content ?? [];

        setAthletes(
          content.map((athlete) => ({
            id: athlete.id,
            name: athlete.fullName,
            email: athlete.email,
            gender: athlete.gender === "FEMALE" ? "Nữ" : "Nam",
            studentId: (athlete.studentId || "").toString(),
            club: athlete.club || "",
            subCompetitionType: athlete.subCompetitionType || "",
            detailSubCompetitionType: athlete.detailSubCompetitionType || "",
          }))
        );
      } catch (error) {
        console.error("Failed to load athletes:", error);
        setAthletes([]);
      }
    };

    loadAthletes();
  }, [activeTab, selectedTournament]);

  // Note: mock generator removed from UI; keep for potential dev usage

  const addManualMatch = () => {
    setMatches((prev) => {
      const sameType = prev.filter((match) => match.type === activeTab);
      const newMatch: Match = {
        id: `manual-${activeTab}-${Date.now()}`,
        order: sameType.length + 1,
        type: activeTab,
        contentName:
          activeTab === "quyen" ? "Nội dung Quyền" : "Nội dung Võ nhạc",
        participantIds: [],
        participants: [],
        assessors: {},
      };
      return [...prev, newMatch];
    });
  };

  const deleteMatch = (matchId: string) => {
    setMatches((prev) => {
      const target = prev.find((m) => m.id === matchId);
      if (!target) return prev;
      const sameType = prev
        .filter((m) => m.type === target.type && m.id !== matchId)
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((m, idx) => ({ ...m, order: idx + 1 }));
      const others = prev.filter((m) => m.type !== target.type);
      return [...others, ...sameType];
    });
  };

  const beginMatch = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const judgesCount = match.judgesCount ?? 5;
    const defaultTimerSec = match.timerSec ?? 120;

    const projectionPayload = {
      matchId: match.id,
      tournamentId: selectedTournament,
      type: match.type,
      contentName: match.contentName,
      participants: match.participants.map((name, idx) => ({
        id: match.participantIds[idx] || String(idx),
        name,
      })),
      judgesCount,
      defaultTimerMs: defaultTimerSec * 1000,
      theme: "light" as const,
      fontScale: "md" as const,
      showParticipants: true,
      startedAt: Date.now(),
    };

    try {
      localStorage.setItem(
        `projection:${match.id}`,
        JSON.stringify(projectionPayload)
      );
    } catch {
      // ignore storage errors
    }

    const url = `/performance/projection?matchId=${encodeURIComponent(
      match.id
    )}`;
    window.open(url, "_blank");
  };

  // Arrow move buttons removed in favor of drag-and-drop

  // Combined setup modal (team + assessors)
  const openSetupModal = (matchId: string) => {
    const m = matches.find((it) => it.id === matchId);
    setSetupModal({
      open: true,
      matchId,
      selectedIds: m?.participantIds ?? [],
      assessors: { ...(m?.assessors ?? {}) },
      judgesCount: m?.judgesCount ?? 5,
      defaultTimerSec: m?.timerSec ?? 120,
    });
    setTeamSearch("");
  };
  const closeSetupModal = () =>
    setSetupModal({
      open: false,
      selectedIds: [],
      assessors: {},
      judgesCount: 5,
      defaultTimerSec: 120,
    });

  const toggleTeamMember = (athleteId: string) => {
    setSetupModal((prev) => {
      const exists = prev.selectedIds.includes(athleteId);
      return {
        ...prev,
        selectedIds: exists
          ? prev.selectedIds.filter((id) => id !== athleteId)
          : [...prev.selectedIds, athleteId],
      };
    });
  };

  const updateSetupAssessor = (
    role: keyof Match["assessors"],
    value: string
  ) => {
    setSetupModal((prev) => ({
      ...prev,
      assessors: { ...prev.assessors, [role]: value },
    }));
  };

  const saveSetup = () => {
    if (!setupModal.matchId) return;
    const selected = athletes.filter((a) =>
      setupModal.selectedIds.includes(a.id)
    );
    const names = selected.map((a) => a.name);
    setMatches((prev) =>
      prev.map((m) =>
        m.id === setupModal.matchId
          ? {
              ...m,
              participantIds: setupModal.selectedIds,
              participants: names,
              assessors: { ...m.assessors, ...setupModal.assessors },
              judgesCount: setupModal.judgesCount,
              timerSec: setupModal.defaultTimerSec,
            }
          : m
      )
    );
    closeSetupModal();
  };

  // assessor summary hidden on cards

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Sắp xếp nội dung & gán trọng tài
        </h1>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Chọn giải:
          </label>
          <select
            value={selectedTournament}
            onChange={(event) => setSelectedTournament(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tournaments.length === 0 && (
              <option value="">-- Chưa có giải --</option>
            )}
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Loại nội dung:
          </label>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {Object.entries(COMPETITION_TYPES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => onTabChange(key as CompetitionType)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {setupModal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Thiết lập trận</h3>
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={closeSetupModal}
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="mb-3">
                  <input
                    value={teamSearch}
                    onChange={(event) => setTeamSearch(event.target.value)}
                    placeholder="Tìm theo tên, MSSV, CLB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="max-h-72 overflow-auto border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Chọn</th>
                        <th className="px-3 py-2 text-left">Tên</th>
                        <th className="px-3 py-2 text-left">
                          Nội dung đăng ký
                        </th>
                        <th className="px-3 py-2 text-left">MSSV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAthletes.map((athlete) => {
                        const checked = setupModal.selectedIds.includes(
                          athlete.id
                        );
                        return (
                          <tr key={athlete.id} className="border-t">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600"
                                checked={checked}
                                onChange={() => toggleTeamMember(athlete.id)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-900">
                                {athlete.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {athlete.email}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {athlete.detailSubCompetitionType ||
                                athlete.subCompetitionType ||
                                "-"}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {athlete.studentId}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredAthletes.length === 0 && (
                        <tr>
                          <td
                            className="px-3 py-4 text-center text-sm text-gray-500"
                            colSpan={4}
                          >
                            Không tìm thấy vận động viên phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Đã chọn: <strong>{setupModal.selectedIds.length}</strong>{" "}
                  VĐV/đội
                </div>
              </div>
              <div className="space-y-3">
                {ASSESSOR_ROLES.map((role) => (
                  <div key={role.key} className="space-y-1">
                    <label className="block text-sm text-gray-700">
                      {role.label}
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={setupModal.assessors[role.key as string] || ""}
                      onChange={(e) =>
                        updateSetupAssessor(role.key, e.target.value)
                      }
                    >
                      <option value="">Chọn người chấm</option>
                      {mockAssessors.map((assessor) => (
                        <option key={assessor} value={assessor}>
                          {assessor}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-sm text-gray-700">
                      Số assesor
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={setupModal.judgesCount}
                      onChange={(e) =>
                        setSetupModal((p) => ({
                          ...p,
                          judgesCount: Number(e.target.value),
                        }))
                      }
                    >
                      {[3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">
                      Thời gian (giây)
                    </label>
                    <input
                      type="number"
                      min={30}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={setupModal.defaultTimerSec}
                      onChange={(e) =>
                        setSetupModal((p) => ({
                          ...p,
                          defaultTimerSec: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                onClick={closeSetupModal}
              >
                Hủy
              </button>
              <button
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={saveSetup}
              >
                Lưu thiết lập
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={addManualMatch}
          className="rounded-md bg-emerald-500 px-3 py-2 text-white text-sm shadow hover:bg-emerald-600"
        >
          Thêm trận trống
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {matchesForActiveType.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 col-span-full">
            Chưa có trận nào.
          </div>
        ) : (
          matchesForActiveType.map((match) => (
            <div
              key={match.id}
              className={`rounded-lg border border-gray-200 p-3 shadow transition-colors outline-none`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">
                      Trận {match.order}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {COMPETITION_TYPES[match.type]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    <span className="font-medium">Nội dung:</span>{" "}
                    {match.contentName}
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    <span className="font-medium">Đội/VDV biểu diễn:</span>{" "}
                    {match.participants.length > 0
                      ? match.participants.join(", ")
                      : "Chưa chọn"}
                  </p>
                  {/* Hidden assessor summary per request */}
                </div>

                <div className="flex flex-col items-end gap-1 w-28">
                  <button
                    onClick={() => openSetupModal(match.id)}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-blue-500 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Thiết lập
                  </button>
                  <button
                    onClick={() => beginMatch(match.id)}
                    className="w-full px-2.5 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Bắt đầu trận
                  </button>
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="mt-1 h-7 w-7 text-xs bg-white border border-red-300 text-red-500 rounded hover:bg-red-50"
                    title="Xóa trận"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* start modal removed */}
    </div>
  );
}
