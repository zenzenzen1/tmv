import { useEffect, useMemo, useState, useRef } from "react";
import MultiSelect from "@/components/common/MultiSelect";
import { useCompetitionStore } from "@/stores/competition";
import { useWeightClassStore } from "@/stores/weightClass";
import * as htmlToImage from "html-to-image";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import { drawService, type DrawResponse } from "../../services/drawService";

export default function BracketBuilder() {
  const { competitions, fetchCompetitions } = useCompetitionStore();
  const { list: wcList, fetch: fetchWc } = useWeightClassStore();

  const [competitionId, setCompetitionId] = useState<string[]>([]);
  const [weightClassId, setWeightClassId] = useState<string[]>([]);
  const [competitionType, setCompetitionType] = useState<string>("individual");
  const [athleteCount, setAthleteCount] = useState<number>(0);
  const [athleteFile, setAthleteFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");

  // New states for athlete list
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState<boolean>(false);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [showSeedingModal, setShowSeedingModal] = useState<boolean>(false);
  const [seedingList, setSeedingList] = useState<
    Array<{ id: string; name: string; seed: number }>
  >([]);
  const [showManualSeedingModal, setShowManualSeedingModal] =
    useState<boolean>(false);
  const [manualSeedingList, setManualSeedingList] = useState<
    Array<{ id: string; name: string; seed: number }>
  >([]);
  const [showDrawHistoryModal, setShowDrawHistoryModal] =
    useState<boolean>(false);
  const [drawHistory, setDrawHistory] = useState<DrawResponse[]>([]);
  const [loadingDrawHistory, setLoadingDrawHistory] = useState<boolean>(false);

  // Mock athlete names for demo
  const mockAthletes = [
    "Nguyễn Văn A",
    "Trần Thị B",
    "Lê Văn C",
    "Phạm Thị D",
    "Hoàng Văn E",
    "Vũ Thị F",
    "Đặng Văn G",
    "Bùi Thị H",
    "Phan Văn I",
    "Ngô Thị J",
    "Dương Văn K",
    "Lý Thị L",
    "Đinh Văn M",
    "Võ Thị N",
    "Tôn Văn O",
    "Hồ Thị P",
    "Lương Văn Q",
    "Chu Thị R",
    "Đỗ Văn S",
    "Cao Thị T",
    "Lưu Văn U",
    "Mai Thị V",
    "Đào Văn X",
    "Lâm Thị Y",
    "Hà Văn Z",
  ];

  const [seedNames, setSeedNames] = useState<string[]>([]);
  const [roundPairs, setRoundPairs] = useState<Array<Array<[string, string]>>>(
    []
  ); // all rounds including prelim
  const [baseSize, setBaseSize] = useState<number>(0); // largest power of two <= N (e.g., 16)
  const [roundsCount, setRoundsCount] = useState<number>(0); // total columns = 1 (prelim) + log2(base)
  const [byeCount, setByeCount] = useState<number>(0); // (2*base - N)
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const bracketRef = useRef<HTMLDivElement>(null);

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

  // Fetch athletes based on competition and weight class
  const fetchAthletes = async () => {
    if (competitionId.length === 0 || weightClassId.length === 0) {
      setAthletes([]);
      return;
    }

    setLoadingAthletes(true);
    try {
      const response = await api.get<PaginationResponse<any>>(
        API_ENDPOINTS.ATHLETES.BASE,
        {
          competitionId: competitionId[0],
          competitionType: "fighting", // Only fighting athletes for brackets
          weightClassId: weightClassId[0],
          page: 0,
          size: 100,
        }
      );

      console.log("Athletes API response:", response);
      setAthletes(response.data?.content || []);
    } catch (error) {
      console.error("Error fetching athletes:", error);
      setAthletes([]);
    } finally {
      setLoadingAthletes(false);
    }
  };

  // Fetch athletes when competition or weight class changes
  useEffect(() => {
    fetchAthletes();
    // Reset selected athletes when competition or weight class changes
    setSelectedAthletes([]);
  }, [competitionId, weightClassId]);

  const handleImport = () => {
    if (!athleteFile) {
      alert("Hãy chọn file danh sách VĐV (.csv/.xlsx)");
      return;
    }
    // Placeholder: parse file here later
    alert(
      `Đã chọn file: ${athleteFile.name}. Chức năng import sẽ được cài đặt sau.`
    );
  };

  // --- Bracket algorithm (power-of-two with balanced seeding and BYEs) ---
  function prevPowerOfTwo(n: number): number {
    if (n < 1) return 1;
    return 1 << Math.floor(Math.log2(n));
  }
  // Compute according to user's rule:
  // base = 2^k <= N, extra = N - base, bye seeds = (base - extra) i.e., seeds (extra+1..base) get byes
  // Round 1 pairs: (1..extra) vs (base+1 .. base+extra)
  function computePairings(
    n: number,
    athleteNames?: string[]
  ): Array<[string, string]> {
    console.log("Computing pairings for", n, "athletes");
    console.log("Athlete names passed:", athleteNames);

    // Use passed athleteNames or fallback to seedNames state
    const names = athleteNames || seedNames;
    if (n <= 1) {
      setBaseSize(1);
      setRoundsCount(1); // only final column
      setByeCount(0);
      setRoundPairs([]);
      return [];
    }
    const base = prevPowerOfTwo(n); // e.g., 16 for 25
    const extra = n - base; // e.g., 9
    const byes = base - extra; // e.g., 7 (seeds extra+1..base)

    console.log("Base:", base, "Extra:", extra, "Byes:", byes);

    setBaseSize(base);
    setByeCount(byes);

    const allRounds: Array<Array<[string, string]>> = [];

    // Only create preliminary round if there are extra athletes (not a perfect power of 2)
    if (extra > 0) {
      // Create preliminary round with all athletes
      const prelimPairs: Array<[string, string]> = [];
      for (let i = 0; i < n; i += 2) {
        if (i + 1 < n) {
          const leftName =
            i < names.length
              ? names[i]
              : i < mockAthletes.length
              ? mockAthletes[i]
              : `VĐV ${i + 1}`;
          const rightName =
            i + 1 < names.length
              ? names[i + 1]
              : i + 1 < mockAthletes.length
              ? mockAthletes[i + 1]
              : `VĐV ${i + 2}`;
          prelimPairs.push([
            `#${i + 1} - ${leftName}`,
            `#${i + 2} - ${rightName}`,
          ]);
        } else {
          // Odd number of athletes, single athlete gets bye
          const leftName =
            i < names.length
              ? names[i]
              : i < mockAthletes.length
              ? mockAthletes[i]
              : `VĐV ${i + 1}`;
          prelimPairs.push([`#${i + 1} - ${leftName}`, `BYE`]);
        }
      }
      allRounds.push(prelimPairs);
      // Create subsequent rounds from winners
      let currentRound = prelimPairs;
      let winnerCounter = 1;
      while (currentRound.length > 1) {
        const nextRound: Array<[string, string]> = [];
        for (let i = 0; i < currentRound.length; i += 2) {
          if (i + 1 < currentRound.length) {
            nextRound.push([`W${winnerCounter}`, `W${winnerCounter + 1}`]);
            winnerCounter += 2;
          } else {
            // Single winner, gets bye to next round
            nextRound.push([`W${winnerCounter}`, `BYE`]);
            winnerCounter += 1;
          }
        }
        allRounds.push(nextRound);
        currentRound = nextRound;
      }

      setRoundsCount(allRounds.length);
    } else {
      // Perfect power of 2 - no preliminary round needed
      const firstRoundPairs: Array<[string, string]> = [];
      for (let i = 1; i <= base; i += 2) {
        const leftName =
          i <= names.length
            ? names[i - 1]
            : i <= mockAthletes.length
            ? mockAthletes[i - 1]
            : `VĐV ${i}`;
        const rightName =
          i + 1 <= names.length
            ? names[i]
            : i + 1 <= mockAthletes.length
            ? mockAthletes[i]
            : `VĐV ${i + 1}`;
        firstRoundPairs.push([
          `#${i} - ${leftName}`,
          `#${i + 1} - ${rightName}`,
        ]);
      }
      allRounds.push(firstRoundPairs);

      // Subsequent rounds: pair winners consecutively
      let prevRoundWinnersCount = firstRoundPairs.length;
      let winnerOffset = 1;
      while (prevRoundWinnersCount > 1) {
        const nextRound: Array<[string, string]> = [];
        for (let i = 0; i < prevRoundWinnersCount; i += 2) {
          const left = `W${winnerOffset + i}`;
          const right = `W${winnerOffset + i + 1}`;
          nextRound.push([left, right]);
        }
        allRounds.push(nextRound);
        winnerOffset += prevRoundWinnersCount;
        prevRoundWinnersCount = nextRound.length;
      }

      setRoundsCount(allRounds.length);
    }

    setRoundPairs(allRounds);
    console.log("All rounds generated:", allRounds);
    return allRounds[0] || [];
  }

  const handleGenerate = () => {
    console.log("handleGenerate called, athleteCount:", athleteCount);
    const n = Math.max(0, athleteCount);
    if (n <= 0) {
      alert("Vui lòng nhập số VĐV");
      return;
    }
    // Use actual athlete names if available, otherwise use mock names
    const names =
      selectedAthletes.length > 0
        ? selectedAthletes.map((id) => {
            const athlete = athletes.find((a) => a.id === id);
            return athlete ? athlete.fullName : `VĐV ${id}`;
          })
        : mockAthletes.slice(0, n);
    setSeedNames(names);
    computePairings(n, names);
  };

  // Generate random seeding list for selected athletes (Online Draw)
  const generateSeedingList = async () => {
    if (selectedAthletes.length === 0) return;

    try {
      // Call backend API for automatic draw
      const drawResponse = await drawService.performAutomaticDraw(
        competitionId[0],
        weightClassId[0],
        selectedAthletes
      );

      // Convert API response to local format
      const seedingData = drawResponse.results.map((result) => ({
        id: result.athleteId,
        name: result.athleteName,
        seed: result.seedNumber,
      }));

      setSeedingList(seedingData);
      setShowSeedingModal(true);

      // Show success message with draw session info
      alert(
        `Đã bốc thăm tự động thành công!\nPhiên bốc thăm: ${
          drawResponse.drawSessionId
        }\nThời gian: ${new Date(drawResponse.drawDate).toLocaleString()}`
      );
    } catch (error) {
      console.error("Error performing automatic draw:", error);
      alert("Có lỗi xảy ra khi bốc thăm tự động. Vui lòng thử lại.");
    }
  };

  // Initialize manual seeding list (Offline Draw)
  const initializeManualSeeding = () => {
    if (selectedAthletes.length === 0) return;

    const seedingData = selectedAthletes.map((athleteId) => {
      const athlete = athletes.find((a) => a.id === athleteId);
      return {
        id: athleteId,
        name: athlete ? athlete.fullName : `VĐV ${athleteId}`,
        seed: 0, // Will be filled manually
      };
    });

    setManualSeedingList(seedingData);
    setShowManualSeedingModal(true);
  };

  // Update manual seed for an athlete
  const updateManualSeed = (athleteId: string, seed: number) => {
    setManualSeedingList((prev) =>
      prev.map((athlete) =>
        athlete.id === athleteId ? { ...athlete, seed } : athlete
      )
    );
  };

  // Validate and apply manual seeding
  const applyManualSeeding = async () => {
    const usedSeeds = new Set<number>();
    const errors: string[] = [];

    // Check for duplicate seeds
    manualSeedingList.forEach((athlete) => {
      if (athlete.seed > 0) {
        if (usedSeeds.has(athlete.seed)) {
          errors.push(`Số ${athlete.seed} đã được sử dụng cho nhiều VĐV`);
        } else {
          usedSeeds.add(athlete.seed);
        }
      }
    });

    // Check for missing seeds
    const missingSeeds = manualSeedingList.filter((a) => a.seed === 0);
    if (missingSeeds.length > 0) {
      errors.push(`Còn ${missingSeeds.length} VĐV chưa có số bốc thăm`);
    }

    // Check seed range
    const invalidSeeds = manualSeedingList.filter(
      (a) => a.seed < 1 || a.seed > selectedAthletes.length
    );
    if (invalidSeeds.length > 0) {
      errors.push(`Số bốc thăm phải từ 1 đến ${selectedAthletes.length}`);
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    try {
      // Prepare athlete seeds data
      const athleteSeeds = manualSeedingList.map((athlete) => {
        const athleteData = athletes.find((a) => a.id === athlete.id);
        return {
          athleteId: athlete.id,
          athleteName: athlete.name,
          athleteClub: athleteData?.club || "",
          seedNumber: athlete.seed,
        };
      });

      // Call backend API for manual draw
      const drawResponse = await drawService.performManualDraw(
        competitionId[0],
        weightClassId[0],
        athleteSeeds,
        "Manual draw performed offline"
      );

      // Apply seeding and generate bracket
      const sortedAthletes = [...manualSeedingList].sort(
        (a, b) => a.seed - b.seed
      );
      const athleteNames = sortedAthletes.map((a) => a.name);

      setSeedNames(athleteNames);
      setAthleteCount(selectedAthletes.length);

      computePairings(selectedAthletes.length, athleteNames);

      setShowManualSeedingModal(false);
      alert(
        `Đã áp dụng số bốc thăm thủ công cho ${selectedAthletes.length} VĐV!\nPhiên bốc thăm: ${drawResponse.drawSessionId}`
      );
    } catch (error) {
      console.error("Error performing manual draw:", error);
      alert("Có lỗi xảy ra khi lưu số bốc thăm thủ công. Vui lòng thử lại.");
    }
  };

  // Load draw history
  const loadDrawHistory = async () => {
    if (competitionId.length === 0 || weightClassId.length === 0) return;

    setLoadingDrawHistory(true);
    try {
      const history = await drawService.getDrawHistory(
        competitionId[0],
        weightClassId[0]
      );
      setDrawHistory(history);
      setShowDrawHistoryModal(true);
    } catch (error) {
      console.error("Error loading draw history:", error);
      alert("Có lỗi xảy ra khi tải lịch sử bốc thăm. Vui lòng thử lại.");
    } finally {
      setLoadingDrawHistory(false);
    }
  };

  const generateBracketImage = async () => {
    if (!bracketRef.current) {
      alert("Chưa có nhánh đấu để xuất. Vui lòng tạo nhánh đấu trước.");
      return;
    }

    try {
      // Add export class to disable animations
      if (bracketRef.current) {
        bracketRef.current.classList.add("bracket-export-container");
      }

      // Wait a bit for CSS to apply
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Temporarily remove overflow restrictions for image generation
      const originalOverflow = bracketRef.current.style.overflow;
      const originalMaxWidth = bracketRef.current.style.maxWidth;

      bracketRef.current.style.overflow = "visible";
      bracketRef.current.style.maxWidth = "none";

      const dataUrl = await htmlToImage.toPng(bracketRef.current, {
        quality: 1,
        backgroundColor: "#ffffff",
        pixelRatio: 1.5,
        width: bracketRef.current.scrollWidth,
        height: bracketRef.current.scrollHeight,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          overflow: "visible",
        },
        filter: (node: Element) => {
          // Skip elements that might cause issues with image generation
          return (
            !node.classList?.contains("animate-pulse") &&
            !node.classList?.contains("animate-bounce") &&
            !node.classList?.contains("group") &&
            !node.classList?.contains("cursor-help") &&
            !node.classList?.contains("opacity-0") &&
            !node.classList?.contains("group-hover:opacity-100")
          );
        },
      });

      // Restore original styles
      bracketRef.current.style.overflow = originalOverflow;
      bracketRef.current.style.maxWidth = originalMaxWidth;

      // Remove export class
      if (bracketRef.current) {
        bracketRef.current.classList.remove("bracket-export-container");
      }

      setPreviewImage(dataUrl);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating image:", error);
      // Make sure to remove export class even if error occurs
      if (bracketRef.current) {
        bracketRef.current.classList.remove("bracket-export-container");
      }
      alert("Không thể tạo ảnh. Vui lòng thử lại.");
    }
  };

  const downloadImage = () => {
    if (!previewImage) return;

    const link = document.createElement("a");
    link.download = `nhanh-dau-${competitionId[0] || "tournament"}-${
      weightClassId[0] || "weightclass"
    }.png`;
    link.href = previewImage;
    link.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chia nhánh đấu</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 relative">
        {/* Icon thông tin */}
        <div className="absolute top-4 right-4 group">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-help text-sm font-bold">
            i
          </div>
          <div className="absolute bottom-8 right-0 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            <div className="space-y-1">
              <div>
                <strong>Vòng loại:</strong> VĐV {baseSize + 1}-{athleteCount}{" "}
                đấu
              </div>
              <div>
                <strong>Vòng chính:</strong> Thắng + BYE (1-{baseSize})
              </div>
              <div>
                <strong>BYE:</strong> {byeCount} VĐV
              </div>
            </div>
            <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <MultiSelect
            options={competitionOptions}
            selectedValues={competitionId}
            onChange={(vals) => setCompetitionId(vals.slice(-1))}
            label="Chọn giải đấu"
            placeholder="Chọn 1 giải"
          />
          <MultiSelect
            options={weightClassOptions}
            selectedValues={weightClassId}
            onChange={(vals) => setWeightClassId(vals.slice(-1))}
            label="Chọn hạng cân"
            placeholder="Chọn 1 hạng cân"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại thi đấu
            </label>
            <select
              value={competitionType}
              onChange={(e) => setCompetitionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="individual">Đối kháng cá nhân</option>
              <option value="synchronized">Song luyện đối kháng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số vận động viên đã chọn
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {selectedAthletes.length} / {athletes.length} vận động viên
            </div>
          </div>
        </div>

        {/* Athletes Selection Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "manual"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ✋ Chọn thủ công
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "import"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📥 Import danh sách
            </button>
          </div>

          {/* Tab Content: Manual Selection */}
          {activeTab === "manual" && (
            <div>
              {competitionId.length === 0 || weightClassId.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">Vui lòng chọn giải đấu và hạng cân trước</p>
                  <p className="text-sm">Sau khi chọn, danh sách vận động viên sẽ hiển thị tại đây</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">
                    Danh sách vận động viên
                  </h3>

                  {loadingAthletes ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">
                        Đang tải danh sách vận động viên...
                      </p>
                    </div>
                  ) : athletes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Không có vận động viên nào trong hạng cân này</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {athletes.map((athlete) => (
                        <div
                          key={athlete.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedAthletes.includes(athlete.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAthletes([
                                    ...selectedAthletes,
                                    athlete.id,
                                  ]);
                                } else {
                                  setSelectedAthletes(
                                    selectedAthletes.filter((id) => id !== athlete.id)
                                  );
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {athlete.fullName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {athlete.studentId} • {athlete.club} •{" "}
                                {athlete.gender === "MALE" ? "Nam" : "Nữ"}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {athlete.status === "NOT_STARTED"
                              ? "Chưa bắt đầu"
                              : athlete.status === "IN_PROGRESS"
                              ? "Đang thi đấu"
                              : athlete.status === "DONE"
                              ? "Hoàn thành"
                              : "Vi phạm"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {athletes.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setSelectedAthletes(athletes.map((a) => a.id))
                          }
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Chọn tất cả
                        </button>
                        <button
                          onClick={() => setSelectedAthletes([])}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => {
                            console.log('Chia nhánh đấu clicked, selectedAthletes:', selectedAthletes.length);
                            if (selectedAthletes.length === 0) {
                              alert("Vui lòng chọn ít nhất 1 vận động viên");
                              return;
                            }
                            
                            // Set athlete count and names
                            setAthleteCount(selectedAthletes.length);
                            const selectedAthleteNames = selectedAthletes.map(id => {
                              const athlete = athletes.find(a => a.id === id);
                              return athlete ? athlete.fullName : `VĐV ${id}`;
                            });
                            
                            // Set seed names first, then generate bracket
                            setSeedNames(selectedAthleteNames);
                            
                            // Generate bracket with athlete names
                            computePairings(selectedAthletes.length, selectedAthleteNames);
                            
                            console.log('Generated bracket for', selectedAthletes.length, 'athletes');
                            console.log('Athlete names:', selectedAthleteNames);
                            console.log('All rounds:', roundPairs);
                            console.log('Rounds count:', roundsCount);
                            
                            // Show success message
                            alert(`Đã tạo nhánh đấu cho ${selectedAthletes.length} vận động viên!`);
                          }}
                          disabled={selectedAthletes.length === 0}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                          Chia nhánh đấu ({selectedAthletes.length} VĐV)
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={generateSeedingList}
                            disabled={selectedAthletes.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            title="Bốc thăm tự động (Online)"
                          >
                            🎲 Bốc thăm tự động
                          </button>
                          
                          <button
                            onClick={initializeManualSeeding}
                            disabled={selectedAthletes.length === 0}
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            title="Nhập số bốc thăm thủ công (Offline)"
                          >
                            ✏️ Nhập số thủ công
                          </button>
                          
                          <button
                            onClick={loadDrawHistory}
                            disabled={competitionId.length === 0 || weightClassId.length === 0}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            title="Xem lịch sử bốc thăm"
                          >
                            📋 Lịch sử bốc thăm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab Content: Import */}
          {activeTab === "import" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Import danh sách từ file
                </h3>

                {/* Competition and Weight Class Selection for Import */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn giải đấu
                    </label>
                    <MultiSelect
                      options={competitionOptions}
                      selectedValues={competitionId}
                      onChange={(vals) => setCompetitionId(vals.slice(-1))}
                      label=""
                      placeholder="Chọn 1 giải"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn hạng cân
                    </label>
                    <MultiSelect
                      options={weightClassOptions}
                      selectedValues={weightClassId}
                      onChange={(vals) => setWeightClassId(vals.slice(-1))}
                      label=""
                      placeholder="Chọn 1 hạng cân"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại thi đấu
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      {competitionType === "individual" ? "Đối kháng cá nhân" : "Song luyện đối kháng"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {athletes.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setSelectedAthletes(athletes.map((a) => a.id))
                    }
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={() => setSelectedAthletes([])}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      console.log(
                        "Chia nhánh đấu clicked, selectedAthletes:",
                        selectedAthletes.length
                      );
                      if (selectedAthletes.length === 0) {
                        alert("Vui lòng chọn ít nhất 1 vận động viên");
                        return;
                      }

                      // Set athlete count and names
                      setAthleteCount(selectedAthletes.length);
                      const selectedAthleteNames = selectedAthletes.map(
                        (id) => {
                          const athlete = athletes.find((a) => a.id === id);
                          return athlete ? athlete.fullName : `VĐV ${id}`;
                        }
                      );

                      // Set seed names first, then generate bracket
                      setSeedNames(selectedAthleteNames);

                      // Generate bracket with athlete names
                      computePairings(
                        selectedAthletes.length,
                        selectedAthleteNames
                      );

                      console.log(
                        "Generated bracket for",
                        selectedAthletes.length,
                        "athletes"
                      );
                      console.log("Athlete names:", selectedAthleteNames);
                      console.log("All rounds:", roundPairs);
                      console.log("Rounds count:", roundsCount);

                      // Show success message
                      alert(
                        `Đã tạo nhánh đấu cho ${selectedAthletes.length} vận động viên!`
                      );
                    }}
                    disabled={selectedAthletes.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    Chia nhánh đấu ({selectedAthletes.length} VĐV)
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={generateSeedingList}
                      disabled={selectedAthletes.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      title="Bốc thăm tự động (Online)"
                    >
                      🎲 Bốc thăm tự động
                    </button>
                    <button
                      onClick={initializeManualSeeding}
                      disabled={selectedAthletes.length === 0}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      title="Nhập số bốc thăm thủ công (Offline)"
                    >
                      ✏️ Nhập số thủ công
                    </button>

                    <button
                      onClick={loadDrawHistory}
                      disabled={
                        competitionId.length === 0 || weightClassId.length === 0
                      }
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      title="Xem lịch sử bốc thăm"
                    >
                      📋 Lịch sử bốc thăm
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn file danh sách VĐV
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => setAthleteFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="athlete-file"
                      />
                      <label
                        htmlFor="athlete-file"
                        className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-center transition-colors"
                      >
                        {athleteFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span className="font-medium">{athleteFile.name}</span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-600">📁 Chọn tệp CSV/XLSX</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Hỗ trợ định dạng: .csv, .xlsx, .xls
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {athleteFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>File đã chọn:</strong> {athleteFile.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        Nhấn "Import" để xử lý file và thêm vận động viên vào danh sách
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleImport}
                      disabled={!athleteFile}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      📥 Import danh sách
                    </button>
                    {athleteFile && (
                      <button
                        onClick={() => {
                          setAthleteFile(null);
                          const fileInput = document.getElementById("athlete-file") as HTMLInputElement;
                          if (fileInput) fileInput.value = "";
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                      >
                        Xóa file
                      </button>
                    )}
                  </div>
                </div>

                {/* Calculate Bracket Button for Import Tab */}
                <div className="mt-6 flex gap-3">
                  <button 
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleGenerate}
                    disabled={athleteCount <= 0 || competitionId.length === 0 || weightClassId.length === 0}
                  >
                    Tính nhánh
                  </button>
                  {roundsCount > 0 && (
                    <button
                      onClick={generateBracketImage}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Xuất ảnh
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-between">
          <div className="flex space-x-3">
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleGenerate}
              disabled={athleteCount <= 0}
            >
              Tính nhánh
            </button>
            {roundsCount > 0 && (
              <button
                onClick={generateBracketImage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xuất ảnh
              </button>
            )}
          </div>
          <div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleImport}
              disabled={!athleteFile}
            >
              Import
            </button>
          </div>
        </div>
      </div>

      {roundsCount > 0 && selectedAthletes.length > 0 && (
        <div
          className="bg-white rounded-lg border border-gray-200 p-0 overflow-x-auto max-w-full bracket-export-container"
          ref={bracketRef}
        >
          {/* Tournament Banner */}
          <div className="relative bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 text-gray-800 px-6 py-6 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              ></div>
            </div>

            {/* Animated elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-400 rounded-full opacity-20 animate-bounce"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* FPTU Vovinam Club Logo */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="FPTU Vovinam Club Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 drop-shadow-lg">
                    Sơ đồ nhánh đấu
                  </h2>
                  <p className="text-gray-600 text-sm mt-1 font-medium">
                    {competitionId.length > 0
                      ? competitionOptions.find(
                          (c) => c.value === competitionId[0]
                        )?.label || "Chưa chọn giải đấu"
                      : "Chưa chọn giải đấu"}
                  </p>
                  <p className="text-gray-700 text-xs mt-1">
                    {competitionType === "individual"
                      ? "Đối kháng cá nhân"
                      : "Song luyện đối kháng"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-600 text-sm font-medium">
                  Hạng cân
                </div>
                <div className="text-gray-800 font-bold text-lg">
                  {weightClassId.length > 0
                    ? weightClassOptions.find(
                        (wc) => wc.value === weightClassId[0]
                      )?.label || "Chưa chọn"
                    : "Chưa chọn"}
                </div>
              </div>
            </div>
          </div>
          {/* Scoped styles for the new playoff-table template */}
          <style>{`
          .playoff-table *{box-sizing:border-box}
          .playoff-table{font-family:sans-serif;font-size:15px;line-height:1.42857143;font-weight:400;width:100%;max-width:100vw;overflow-x:auto;-webkit-overflow-scrolling:touch;background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);position:relative;border-radius:12px;box-shadow: 0 8px 32px rgba(0,0,0,0.1)}
          .playoff-table::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");border-radius:12px;pointer-events:none}
          .playoff-table .playoff-table-content{display:flex;padding:40px 60px;justify-content:center;position:relative;z-index:1;gap:40px}
          .playoff-table .playoff-table-tour{display:flex;align-items:center;flex-direction:column;justify-content:flex-start;position:relative}
          .playoff-table .playoff-table-round-title{width:100%;margin-bottom:15px}
          .playoff-table .playoff-table-round-title div{font-size:14px;font-weight:600;color:#374151}
          .playoff-table .playoff-table-pair{position:relative;margin-bottom:35px}
          .playoff-table .playoff-table-pair:before{content:'';position:absolute;top:50%;right:-30px;width:30px;height:2px;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-pair:after{content:'';position:absolute;top:50%;right:-30px;width:2px;height:35px;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-pair-style{border:1px solid #e2e8f0;background:linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);width:220px;margin-bottom:0;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);position:relative;overflow:hidden}
          .playoff-table .playoff-table-pair-style::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);transition:left 0.5s}
          .playoff-table .playoff-table-group{padding-right:40px;padding-left:40px;margin-bottom:25px;position:relative;overflow:visible;height:100%;display:flex;align-items:center;flex-direction:column;justify-content:space-around;min-width:280px}
          .playoff-table .playoff-table-group .playoff-table-pair-style:last-child{margin-bottom:0}
          .playoff-table .playoff-table-group:after{content:'';position:absolute;top:50%;right:0;width:2px;height:100%;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-group:last-child{margin-bottom:0}
          .playoff-table .playoff-table-left-player,.playoff-table .playoff-table-right-player{min-height:38px;padding:6px 10px;position:relative;font-size:13px;line-height:1.3;font-weight:500}
          .playoff-table .playoff-table-left-player{border-bottom:1px solid #e5e7eb}
          .playoff-table .playoff-table-left-player:before{content:'';position:absolute;top:50%;left:-30px;width:30px;height:2px;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-right-player{margin-top:-1px;border-top:1px solid #e5e7eb}
          .playoff-table .playoff-table-tour:first-child .playoff-table-group{padding-left:0}
          .playoff-table .playoff-table-tour:first-child .playoff-table-left-player:before{display:none}
          .playoff-table .playoff-table-tour:last-child .playoff-table-group:after{display:none}
          .playoff-table .playoff-table-tour:last-child .playoff-table-pair:after,.playoff-table .playoff-table-tour:last-child .playoff-table-pair:before{display:none}
          
          /* Animation Effects */
          .playoff-table .playoff-table-pair-style {
            transition: all 0.3s ease;
            transform: translateY(0);
          }
          .playoff-table .playoff-table-pair-style:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-color: #3b82f6;
          }
          .playoff-table .playoff-table-pair-style:hover::before {
            left: 100%;
          }
          
          .playoff-table .playoff-table-left-player,
          .playoff-table .playoff-table-right-player {
            transition: all 0.2s ease;
          }
          .playoff-table .playoff-table-pair-style:hover .playoff-table-left-player,
          .playoff-table .playoff-table-pair-style:hover .playoff-table-right-player {
            background-color: #f8fafc;
            color: #1e40af;
            font-weight: 600;
          }
          
          /* Keep connecting lines static - no hover effects */
          
          .playoff-table .playoff-table-round-title div {
            transition: all 0.3s ease;
            position: relative;
            background: linear-gradient(135deg, #374151, #1f2937);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            padding: 8px 16px;
            border-radius: 20px;
            background-color: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .playoff-table .playoff-table-round-title div:hover {
            transform: scale(1.05);
            background-color: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: translateX(-50%) scaleX(1); }
            50% { opacity: 1; transform: translateX(-50%) scaleX(1.2); }
          }
          
          .playoff-table .playoff-table-tour {
            animation: slideInFromLeft 0.6s ease-out;
          }
          .playoff-table .playoff-table-tour:nth-child(1) { animation-delay: 0.1s; }
          .playoff-table .playoff-table-tour:nth-child(2) { animation-delay: 0.2s; }
          .playoff-table .playoff-table-tour:nth-child(3) { animation-delay: 0.3s; }
          .playoff-table .playoff-table-tour:nth-child(4) { animation-delay: 0.4s; }
          .playoff-table .playoff-table-tour:nth-child(5) { animation-delay: 0.5s; }
          
          @keyframes slideInFromLeft {
            0% {
              opacity: 0;
              transform: translateX(-30px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .playoff-table .playoff-table-pair {
            animation: fadeInUp 0.4s ease-out;
          }
          .playoff-table .playoff-table-pair:nth-child(1) { animation-delay: 0.1s; }
          .playoff-table .playoff-table-pair:nth-child(2) { animation-delay: 0.2s; }
          .playoff-table .playoff-table-pair:nth-child(3) { animation-delay: 0.3s; }
          .playoff-table .playoff-table-pair:nth-child(4) { animation-delay: 0.4s; }
          
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Disable animations and effects for image export */
          .bracket-export-container * {
            animation: none !important;
            transition: none !important;
          }
          .bracket-export-container .playoff-table-pair-style::before {
            display: none !important;
          }
          .bracket-export-container .playoff-table-round-title div {
            background: #374151 !important;
            -webkit-background-clip: unset !important;
            -webkit-text-fill-color: unset !important;
            background-clip: unset !important;
            color: #374151 !important;
            background-color: transparent !important;
            backdrop-filter: none !important;
            border: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
          
          /* Export specific styles for full bracket visibility */
          .bracket-export-container .playoff-table {
            max-width: none !important;
            overflow: visible !important;
            width: auto !important;
          }
          
          .bracket-export-container .playoff-table-content {
            overflow: visible !important;
            padding: 40px 60px !important;
            gap: 40px !important;
          }
          
          .bracket-export-container .playoff-table-tour {
            min-width: 280px !important;
            overflow: visible !important;
          }
          
          .bracket-export-container .playoff-table-group {
            min-width: 280px !important;
            overflow: visible !important;
          }
        `}</style>

          {roundsCount === 0 || baseSize === 0 ? (
            <div className="p-6 text-gray-500">
              Nhập số VĐV và bấm "Tính nhánh" để xem sơ đồ nhánh đấu.
            </div>
          ) : (
            <div className="playoff-table">
              <div className="playoff-table-content">
                {Array.from({ length: roundsCount }).map((_, rIdx) => {
                  const roundList =
                    roundPairs[rIdx] ||
                    (Array.from({
                      length:
                        rIdx === 0
                          ? Math.max(0, athleteCount - baseSize)
                          : baseSize / Math.pow(2, rIdx),
                    }).map(() => ["", ""]) as Array<[string, string]>);

                  // Round labels
                  const getRoundLabel = (idx: number) => {
                    const extra = athleteCount - baseSize;
                    const totalRounds = Math.log2(baseSize);

                    if (extra > 0) {
                      // Has preliminary round
                      if (idx === 0) return "Vòng loại";
                      if (idx === totalRounds) return "Chung kết";
                      if (idx === totalRounds - 1) return "Bán kết";
                      if (idx === totalRounds - 2) return "Tứ kết";
                      return `Vòng ${idx}`;
                    } else {
                      // No preliminary round - start from quarterfinals
                      if (idx === totalRounds - 1) return "Chung kết";
                      if (idx === totalRounds - 2) return "Bán kết";
                      if (idx === totalRounds - 3) return "Tứ kết";
                      return `Vòng ${idx + 1}`;
                    }
                  };

                  return (
                    <div className="playoff-table-tour" key={`tour-${rIdx}`}>
                      <div className="playoff-table-round-title">
                        <div className="text-center text-sm font-semibold text-gray-700 mb-3">
                          {getRoundLabel(rIdx)}
                        </div>
                      </div>
                      <div className="playoff-table-group">
                        {roundList.map((pair, pIdx) => {
                          const left = pair?.[0] || "";
                          const right = pair?.[1] || "";
                          return (
                            <div
                              className="playoff-table-pair"
                              key={`pair-${rIdx}-${pIdx}`}
                            >
                              <div className="playoff-table-pair-style">
                                <div className="playoff-table-left-player">
                                  {left}
                                </div>
                                <div className="playoff-table-right-player">
                                  {right}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Xem trước ảnh nhánh đấu</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Nhánh đấu Preview"
                  className="max-w-full h-auto border rounded"
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Đang tạo ảnh nhánh đấu...
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Đóng
              </button>
              {previewImage && (
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Tải xuống
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online Draw Modal (Random Seeding) */}
      {showSeedingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                🎲 Bốc thăm tự động (Online)
              </h3>
              <button
                onClick={() => setShowSeedingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                ✅ Hệ thống đã tự động bốc thăm ngẫu nhiên cho{" "}
                {seedingList.length} vận động viên
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Số bốc thăm được tạo bằng thuật toán ngẫu nhiên, có thể xuất
                danh sách để sử dụng tại giải đấu
              </p>
            </div>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {seedingList.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {athlete.seed}
                    </div>
                    <span className="font-medium text-gray-900">
                      {athlete.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Số {athlete.seed}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={generateSeedingList}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                🔄 Bốc thăm lại
              </button>

              <button
                onClick={() => {
                  // Export seeding list as text
                  const text = seedingList
                    .map((athlete) => `${athlete.seed}. ${athlete.name}`)
                    .join("\n");

                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `danh-sach-boc-tham-${
                    new Date().toISOString().split("T")[0]
                  }.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                📄 Xuất danh sách
              </button>
              <button
                onClick={() => setShowSeedingModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Seeding Modal (Offline Draw) */}
      {showManualSeedingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ✏️ Nhập số bốc thăm thủ công (Offline)
              </h3>
              <button
                onClick={() => setShowManualSeedingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                📝 Nhập số bốc thăm cho từng vận động viên
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Sử dụng khi bốc thăm diễn ra offline. Nhập số từ 1 đến{" "}
                {selectedAthletes.length} cho mỗi VĐV.
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
              {manualSeedingList.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {athlete.seed || "?"}
                    </div>
                    <span className="font-medium text-gray-900">
                      {athlete.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Số:</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedAthletes.length}
                      value={athlete.seed || ""}
                      onChange={(e) =>
                        updateManualSeed(
                          athlete.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="?"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={applyManualSeeding}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                ✅ Áp dụng số bốc thăm
              </button>

              <button
                onClick={() => {
                  // Reset all seeds to 0
                  setManualSeedingList((prev) =>
                    prev.map((athlete) => ({ ...athlete, seed: 0 }))
                  );
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
              >
                🔄 Làm mới
              </button>
              <button
                onClick={() => setShowManualSeedingModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw History Modal */}
      {showDrawHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Lịch sử bốc thăm
              </h3>
              <button
                onClick={() => setShowDrawHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {loadingDrawHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">
                  Đang tải lịch sử bốc thăm...
                </p>
              </div>
            ) : drawHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có lịch sử bốc thăm nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drawHistory.map((draw, index) => (
                  <div
                    key={draw.drawSessionId}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Phiên bốc thăm #{index + 1}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {draw.drawType === "ONLINE_AUTOMATIC"
                            ? "🎲 Tự động"
                            : "✏️ Thủ công"}{" "}
                          •{new Date(draw.drawDate).toLocaleString()}
                        </p>
                        {draw.isFinal && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mt-1">
                            ✅ Đã xác nhận
                          </span>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>Bởi: {draw.drawnBy}</p>
                        <p>ID: {draw.drawSessionId.substring(0, 8)}...</p>
                      </div>
                    </div>

                    {draw.notes && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        "{draw.notes}"
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {draw.results.map((result) => (
                        <div
                          key={result.athleteId}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            {result.seedNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.athleteName}
                            </p>
                            {result.athleteClub && (
                              <p className="text-xs text-gray-500 truncate">
                                {result.athleteClub}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDrawHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
