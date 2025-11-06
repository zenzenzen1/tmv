import { useEffect, useMemo, useState } from "react";
import { useCompetitionStore } from "@/stores/competition";
import { useWeightClassStore } from "@/stores/weightClass";
import { useToast } from "../../components/common/ToastContext";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";

interface Athlete {
  id: string;
  fullName: string;
  email?: string;
  gender?: "MALE" | "FEMALE" | string;
  studentId?: string | null;
  club?: string | null;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "VIOLATED" | string;
  competitionId?: string | null;
  weightClassId?: string | null;
  drawSeedNumber?: number | null;
}

interface SelectedAthlete extends Athlete {
  seedNumber: number | null;
}

interface BracketMatch {
  id: string;
  name: string;
  nextMatchId: string | null;
  tournamentRoundText: string;
  startTime: string;
  state: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  participants: Array<{
    id: string;
    resultText: string | null;
    isWinner: boolean;
    status: string | null;
    name: string;
  }>;
}

export default function BracketBuilder() {
  const toast = useToast();
  const { competitions, fetchCompetitions } = useCompetitionStore();
  const { list: wcList, fetch: fetchWc } = useWeightClassStore();

  const [competitionId, setCompetitionId] = useState<string>("");
  const [weightClassId, setWeightClassId] = useState<string>("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState<boolean>(false);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [competitionAthletes, setCompetitionAthletes] = useState<SelectedAthlete[]>([]);
  const [savingSeedNumbers, setSavingSeedNumbers] = useState<boolean>(false);
  const [seedNumberErrors, setSeedNumberErrors] = useState<Record<string, string>>({});
  const [creatingMatches, setCreatingMatches] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchCompetitions();
      } catch (e) {
        if (!cancelled) console.warn("fetchCompetitions error (ignored):", e);
      }
      try {
        await fetchWc({ size: 100 });
      } catch (e) {
        if (!cancelled) console.warn("fetchWeightClasses error (ignored):", e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchCompetitions, fetchWc]);

  const competitionOptions = useMemo(
    () => (competitions || []).map((c) => ({ value: c.id, label: c.name })),
    [competitions]
  );

  const weightClassOptions = useMemo(
    () =>
      (wcList?.content || []).map((wc) => ({
        value: wc.id,
        label: `${wc.gender} - ${wc.minWeight}-${wc.maxWeight}kg`,
      })),
    [wcList]
  );

  // Get selected weight class gender
  const selectedWeightClass = useMemo(
    () => wcList?.content?.find((wc) => wc.id === weightClassId),
    [wcList, weightClassId]
  );

  // Fetch athletes when competition and weight class are selected
  useEffect(() => {
    if (!competitionId || !weightClassId) {
      setAthletes([]);
      return;
    }

    let cancelled = false;
    const fetchAthletes = async () => {
    setLoadingAthletes(true);
    try {
        const params = new URLSearchParams({
          competitionId,
          competitionType: "fighting",
          weightClassId,
          page: "0",
          size: "100",
        });

        const response = await api.get<PaginationResponse<Athlete>>(
          `${API_ENDPOINTS.ATHLETES.BASE}?${params.toString()}`
        );

        if (!cancelled) {
          const pageData =
            ((response.data as unknown as { data?: PaginationResponse<Athlete> })
              .data as PaginationResponse<Athlete>) ??
            (response.data as unknown as PaginationResponse<Athlete>);
          
          // Filter athletes by gender matching the selected weight class
          let filteredAthletes = pageData?.content || [];
          if (selectedWeightClass?.gender) {
            filteredAthletes = filteredAthletes.filter(
              (athlete) => athlete.gender === selectedWeightClass.gender
            );
          }
          
          setAthletes(filteredAthletes);
        }
    } catch (error) {
      console.error("Error fetching athletes:", error);
        if (!cancelled) setAthletes([]);
    } finally {
        if (!cancelled) setLoadingAthletes(false);
    }
  };

    fetchAthletes();
    return () => {
      cancelled = true;
    };
  }, [competitionId, weightClassId, selectedWeightClass?.gender]);

  // Handle athlete selection
  const handleToggleSelect = (athleteId: string) => {
    setSelectedAthleteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(athleteId)) {
        newSet.delete(athleteId);
      } else {
        newSet.add(athleteId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAthleteIds.size === athletes.length) {
      setSelectedAthleteIds(new Set());
    } else {
      setSelectedAthleteIds(new Set(athletes.map((a) => a.id)));
    }
  };

  // Add selected athletes to competition list
  const handleAddToCompetition = async () => {
    const selectedAthletes = athletes
      .filter((a) => selectedAthleteIds.has(a.id))
      .map((a) => ({
        ...a,
        seedNumber: a.drawSeedNumber || null,
      }));

    // Add only new athletes (not already in competition list)
    const newAthleteIds: string[] = [];
    setCompetitionAthletes((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const newAthletes = selectedAthletes.filter((a) => !existingIds.has(a.id));
      newAthleteIds.push(...newAthletes.map((a) => a.id));
      return [...prev, ...newAthletes];
    });

    // Update status to IN_PROGRESS for newly added athletes
    if (newAthleteIds.length > 0) {
      try {
        console.log(`🔄 Attempting to update status for ${newAthleteIds.length} athletes:`, newAthleteIds);
        const response = await api.put(`${API_ENDPOINTS.ATHLETES.STATUS}`, {
          athleteIds: newAthleteIds,
          status: "IN_PROGRESS",
        });
        console.log(`✅ Updated status to IN_PROGRESS for ${newAthleteIds.length} athletes`, response);
        toast.success(`Đã thêm ${newAthleteIds.length} vận động viên vào danh sách thi đấu!`);
      } catch (error: any) {
        console.error("❌ Error updating athletes status:", error);
        console.error("Error details:", error?.response?.data || error?.message);
        // Show error to user
        const errorMessage = error?.response?.data?.message || error?.message || "Unknown error";
        toast.error(`Có lỗi khi cập nhật trạng thái: ${errorMessage}`);
      }
    }

    // Clear selection
    setSelectedAthleteIds(new Set());
  };

  // Update seed number for an athlete with validation
  const handleSeedNumberChange = (athleteId: string, seedNumber: number | null) => {
    // Update athlete first
    setCompetitionAthletes((prev) => {
      const updated = prev.map((a) =>
        a.id === athleteId ? { ...a, seedNumber: seedNumber || null } : a
      );
      
      // Validate all athletes after update
      const errors: Record<string, string> = {};
      const seedNumberMap = new Map<number, string[]>();
      
      updated.forEach((a) => {
        if (a.seedNumber !== null && a.seedNumber > 0) {
          if (!seedNumberMap.has(a.seedNumber)) {
            seedNumberMap.set(a.seedNumber, []);
          }
          seedNumberMap.get(a.seedNumber)!.push(a.id);
        }
      });
      
      // Check for duplicates and range
      updated.forEach((a) => {
        if (a.seedNumber !== null && a.seedNumber > 0) {
          // Check if seed number is within valid range
          if (a.seedNumber > updated.length) {
            errors[a.id] = `Số bốc thăm phải từ 1 đến ${updated.length}`;
          } else {
            // Check for duplicate
            const athletesWithSameSeed = seedNumberMap.get(a.seedNumber) || [];
            if (athletesWithSameSeed.length > 1) {
              errors[a.id] = "Số bốc thăm này đã được sử dụng";
            }
          }
        }
      });
      
      setSeedNumberErrors(errors);
      return updated;
    });
  };

  // Auto draw seed numbers - bốc lại hoàn toàn ngẫu nhiên mỗi lần
  const handleAutoDraw = () => {
    const totalAthletes = competitionAthletes.length;
    
    // Generate all seed numbers (1 to totalAthletes)
    const allSeedNumbers = Array.from({ length: totalAthletes }, (_, i) => i + 1);
    
    // Shuffle all seed numbers randomly
    for (let i = allSeedNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSeedNumbers[i], allSeedNumbers[j]] = [allSeedNumbers[j], allSeedNumbers[i]];
    }

    // Assign shuffled seed numbers to all athletes (bốc lại hoàn toàn)
    setCompetitionAthletes((prev) =>
      prev.map((a, index) => ({
        ...a,
        seedNumber: allSeedNumbers[index],
      }))
    );
    
    // Clear validation errors after auto draw
    setSeedNumberErrors({});
  };

  // Save seed numbers to backend with validation
  const handleSaveSeedNumbers = async () => {
    // Validate before saving
    const seedNumbers = competitionAthletes
      .filter((a) => a.seedNumber !== null)
      .map((a) => a.seedNumber!);
    
    const duplicates = seedNumbers.filter((num, index) => seedNumbers.indexOf(num) !== index);
    
    if (duplicates.length > 0) {
      toast.error("Có số bốc thăm trùng lặp! Vui lòng kiểm tra lại.");
      return;
    }
    
    // Check if all athletes have seed numbers
    if (competitionAthletes.some((a) => !a.seedNumber)) {
      toast.error("Vui lòng nhập số bốc thăm cho tất cả vận động viên!");
      return;
    }
    
    // Check for validation errors
    if (Object.keys(seedNumberErrors).length > 0) {
      toast.error("Có lỗi validation! Vui lòng kiểm tra lại số bốc thăm.");
      return;
    }
    
    setSavingSeedNumbers(true);
    try {
      const updates = competitionAthletes.map((a) => ({
        athleteId: a.id,
        seedNumber: a.seedNumber!,
      }));

      await api.put(`${API_ENDPOINTS.ATHLETES.SEED_NUMBERS}`, { updates });
      
      toast.success("Đã lưu số bốc thăm thành công!");
    } catch (error: any) {
      console.error("Error saving seed numbers:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi lưu số bốc thăm!";
      toast.error(errorMessage);
    } finally {
      setSavingSeedNumbers(false);
    }
  };

  // Remove athlete from competition list
  const handleRemoveFromCompetition = (athleteId: string) => {
    setCompetitionAthletes((prev) => prev.filter((a) => a.id !== athleteId));
    // Clear validation errors when removing athlete
    setSeedNumberErrors({});
  };

  // Create matches from bracket structure
  const handleCreateMatches = async () => {
    if (!calculateBracket || !competitionId || !weightClassId) {
      toast.error("Vui lòng chọn giải đấu và hạng cân!");
      return;
    }

    if (competitionAthletes.some((a) => !a.seedNumber)) {
      toast.error("Vui lòng nhập số bốc thăm cho tất cả vận động viên!");
      return;
    }

    setCreatingMatches(true);
    try {
      const matchesToCreate = calculateBracket.firstRound.map((match) => ({
        competitionId,
        weightClassId,
        roundType: "Vòng 1",
        redAthleteId: match.participants[0].id,
        blueAthleteId: match.participants[1].id,
        redAthleteName: match.participants[0].name,
        blueAthleteName: match.participants[1].name,
        totalRounds: 3, // Default 3 rounds per match
        roundDurationSeconds: 120, // Default 120 seconds
      }));

      // Call API to create matches
      await api.post(`${API_ENDPOINTS.MATCHES.BULK_CREATE}`, {
        matches: matchesToCreate,
      });

      toast.success(`Đã tạo thành công ${matchesToCreate.length} trận đấu vòng đầu!`);
    } catch (error: any) {
      console.error("Error creating matches:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi tạo trận đấu!";
      toast.error(errorMessage);
    } finally {
      setCreatingMatches(false);
    }
  };

  // Calculate bracket structure
  const calculateBracket = useMemo(() => {
    if (competitionAthletes.length === 0) return null;

    // Sort athletes by seed number
    const sortedAthletes = [...competitionAthletes].sort(
      (a, b) => (a.seedNumber || 0) - (b.seedNumber || 0)
    );

    // Check if all athletes have seed numbers
    if (sortedAthletes.some((a) => !a.seedNumber)) return null;

    const totalAthletes = sortedAthletes.length;

    // Find nearest power of 2
    let lowerPower = 1;
    while (lowerPower * 2 <= totalAthletes) {
      lowerPower *= 2;
    }
    const upperPower = lowerPower * 2;

    // Calculate bye positions
    const byeCount = upperPower - totalAthletes;
    const firstRoundMatches = totalAthletes - lowerPower;

    // Create first round matches
    const firstRound: BracketMatch[] = [];
    let matchIdCounter = 1;

    // First round: top seeds vs bottom seeds
    for (let i = 0; i < firstRoundMatches; i++) {
      const topSeed = sortedAthletes[i];
      const bottomSeed = sortedAthletes[totalAthletes - 1 - i];

      firstRound.push({
        id: `match-${matchIdCounter++}`,
        name: `Vòng 1 - Trận ${i + 1}`,
        nextMatchId: `match-${Math.floor(matchIdCounter / 2) + Math.ceil(lowerPower / 2)}`,
        tournamentRoundText: "Vòng 1",
        startTime: "",
        state: "SCHEDULED",
        participants: [
          {
            id: topSeed.id,
            resultText: null,
            isWinner: false,
            status: null,
            name: topSeed.fullName,
          },
          {
            id: bottomSeed.id,
            resultText: null,
            isWinner: false,
            status: null,
            name: bottomSeed.fullName,
          },
        ],
      });
    }

    // Create bye entries (athletes who advance directly to second round)
    const byeAthletes = sortedAthletes.slice(
      firstRoundMatches,
      firstRoundMatches + byeCount
    );

    return {
      firstRound,
      byeAthletes,
      totalRounds: Math.log2(lowerPower) + 1,
      lowerPower,
      upperPower,
      byeCount,
      firstRoundMatches,
    };
  }, [competitionAthletes]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Thiết lập thông tin nhánh đấu</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn giải đấu
            </label>
            <select
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Chọn giải --</option>
              {competitionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn hạng cân
            </label>
            <select
              value={weightClassId}
              onChange={(e) => setWeightClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Chọn hạng cân --</option>
              {weightClassOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          {competitionId && (
            <div>
              <span className="font-medium">Giải đấu: </span>
              {competitionOptions.find((c) => c.value === competitionId)?.label}
          </div>
          )}
          {weightClassId && (
            <div>
              <span className="font-medium">Hạng cân: </span>
              {weightClassOptions.find((w) => w.value === weightClassId)?.label}
                </div>
          )}
        </div>
      </div>

      {/* Athletes List - Only show when no competition athletes selected */}
      {competitionId && weightClassId && competitionAthletes.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Danh sách vận động viên</h2>

                  {loadingAthletes ? (
            <div className="text-center py-8 text-gray-500">
                        Đang tải danh sách vận động viên...
                    </div>
                  ) : athletes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
              Không có vận động viên nào trong giải đấu và hạng cân này.
                    </div>
                  ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                    checked={selectedAthleteIds.size === athletes.length && athletes.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Chọn tất cả ({selectedAthleteIds.size}/{athletes.length})
                    </label>
                  </div>
                  <button
                  onClick={handleAddToCompetition}
                  disabled={selectedAthleteIds.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Thêm vào danh sách thi đấu ({selectedAthleteIds.size})
                  </button>
                </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        Chọn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Họ và tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã sinh viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Câu lạc bộ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giới tính
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {athletes.map((athlete, index) => (
                      <tr key={athlete.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                      <input
                            type="checkbox"
                            checked={selectedAthleteIds.has(athlete.id)}
                            onChange={() => handleToggleSelect(athlete.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {athlete.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.studentId || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.club || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.gender === "MALE" ? "Nam" : athlete.gender === "FEMALE" ? "Nữ" : athlete.gender || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            athlete.status === "DONE" ? "bg-green-100 text-green-800" :
                            athlete.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                            athlete.status === "VIOLATED" ? "bg-red-100 text-red-800" :
                            athlete.status === "NOT_STARTED" ? "bg-gray-100 text-gray-800" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {athlete.status === "DONE" ? "Hoàn thành" :
                             athlete.status === "IN_PROGRESS" ? "Đang thi đấu" :
                             athlete.status === "VIOLATED" ? "Vi phạm" :
                             athlete.status === "NOT_STARTED" ? "Chưa bắt đầu" :
                             athlete.status || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                          </div>
            </>
          )}
                    </div>
                  )}

      {/* Competition Athletes List with Seed Numbers */}
      {competitionAthletes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Danh sách thi đấu</h2>
            <div className="flex gap-2">
              <button
                onClick={handleAutoDraw}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Bốc tự động
              </button>
              <button
                onClick={handleSaveSeedNumbers}
                disabled={savingSeedNumbers}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {savingSeedNumbers ? "Đang lưu..." : "Lưu số bốc thăm"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ và tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã sinh viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Câu lạc bộ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số bốc thăm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {competitionAthletes.map((athlete, index) => (
                  <tr key={athlete.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {athlete.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {athlete.studentId || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {athlete.club || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                    <input
                      type="number"
                      min="1"
                          max={competitionAthletes.length}
                          value={athlete.seedNumber || ""}
                      onChange={(e) =>
                            handleSeedNumberChange(
                          athlete.id,
                              e.target.value ? parseInt(e.target.value, 10) : null
                            )
                          }
                          placeholder="Nhập số bốc thăm"
                          className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            seedNumberErrors[athlete.id]
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                        />
                        {seedNumberErrors[athlete.id] && (
                          <span className="text-xs text-red-600 mt-1">
                            {seedNumberErrors[athlete.id]}
                          </span>
                        )}
                  </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
              <button
                        onClick={() => handleRemoveFromCompetition(athlete.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
              >
                        Xóa
              </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bracket Info and Create Matches */}
      {calculateBracket && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Thông tin nhánh đấu</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Tổng số vận động viên: {competitionAthletes.length}
              </p>
              <p>
                Số vận động viên được bye: {calculateBracket.byeCount} (từ số {calculateBracket.firstRoundMatches + 1} đến {calculateBracket.firstRoundMatches + calculateBracket.byeCount})
              </p>
              <p>
                Số trận vòng đầu: {calculateBracket.firstRoundMatches}
              </p>
              <p>
                Tổng số vòng đấu: {calculateBracket.totalRounds}
              </p>
                          </div>
                        </div>
          
          <div className="mt-4">
              <button
              onClick={handleCreateMatches}
              disabled={creatingMatches}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
              {creatingMatches ? "Đang tạo trận đấu..." : "Tạo trận đấu"}
              </button>
          </div>
        </div>
      )}
    </div>
  );
}



