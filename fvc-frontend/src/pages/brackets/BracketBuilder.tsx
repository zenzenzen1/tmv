import { useEffect, useMemo, useState, useRef } from "react";
import MultiSelect from "@/components/common/MultiSelect";
import { useCompetitionStore } from "@/stores/competition";
import { useWeightClassStore } from "@/stores/weightClass";
import * as htmlToImage from "html-to-image";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";

export default function BracketBuilder() {
  const { competitions, fetchCompetitions } = useCompetitionStore();
  const { list: wcList, fetch: fetchWc } = useWeightClassStore();

  const [competitionId, setCompetitionId] = useState<string[]>([]);
  const [weightClassId, setWeightClassId] = useState<string[]>([]);
  const [competitionType, setCompetitionType] = useState<string>("individual");
  const [athleteCount, setAthleteCount] = useState<number>(0);
  const [athleteFile, setAthleteFile] = useState<File | null>(null);

  // New states for athlete list
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState<boolean>(false);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);

  const [seedNames, setSeedNames] = useState<string[]>([]);
  const [pairings, setPairings] = useState<Array<[string, string]>>([]); // preliminary round pairs
  const [roundPairs, setRoundPairs] = useState<Array<Array<[string, string]>>>(
    []
  ); // all rounds including prelim
  const [baseSize, setBaseSize] = useState<number>(0); // largest power of two <= N (e.g., 16)
  const [roundsCount, setRoundsCount] = useState<number>(0); // total columns = 1 (prelim) + log2(base)
  const [byeCount, setByeCount] = useState<number>(0); // (2*base - N)
  const [bracketSize, setBracketSize] = useState<number>(0); // display: next power-of-two size
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
          tournamentId: competitionId[0],
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
      setRoundsCount(1);
      setByeCount(0);
      setRoundPairs([]);
      return [];
    }

    // Calculate bracket structure
    const base = prevPowerOfTwo(n);
    const extra = n - base;
    const byes = base - extra;
    const size = extra > 0 ? base * 2 : base;

    setBaseSize(base);
    setByeCount(byes);
    setBracketSize(size);

    const allRounds: Array<Array<[string, string]>> = [];
    if (extra > 0) {
      // Has preliminary round
      const prelimPairs: Array<[string, string]> = [];
      for (let i = 0; i < extra; i++) {
        const leftName = names[i] || `VĐV ${i + 1}`;
        const rightName = names[base + i] || `VĐV ${base + i + 1}`;
        prelimPairs.push([
          `#${i + 1} - ${leftName}`,
          `#${base + i + 1} - ${rightName}`,
        ]);
      }
      allRounds.push(prelimPairs);

      // Main bracket: combine winners from prelim with byes
      const mainBracketPairs: Array<[string, string]> = [];
      // Add winners from preliminary round (pairs of 2)
      for (let i = 0; i < extra; i += 2) {
        if (i + 1 < extra) {
          mainBracketPairs.push([`W${i + 1}`, `W${i + 2}`]);
        } else {
          // Single winner from prelim, pair with a bye
          const byeName = names[extra] || `VĐV ${extra + 1}`;
          mainBracketPairs.push([`W${i + 1}`, `#${extra + 1} - ${byeName}`]);
        }
      }

      // Add remaining byes (athletes who get direct entry to main bracket)
      for (let i = extra + 1; i < base; i += 2) {
        if (i + 1 < base) {
          const leftName = names[i] || `VĐV ${i + 1}`;
          const rightName = names[i + 1] || `VĐV ${i + 2}`;
          mainBracketPairs.push([
            `#${i + 1} - ${leftName}`,
            `#${i + 2} - ${rightName}`,
          ]);
        }
      }

      allRounds.push(mainBracketPairs);
      // Create subsequent rounds
      let currentRound = mainBracketPairs;
      let winnerCounter = 1;
      while (currentRound.length > 1) {
        const nextRound: Array<[string, string]> = [];
        for (let i = 0; i < currentRound.length; i += 2) {
          if (i + 1 < currentRound.length) {
            nextRound.push([`W${winnerCounter}`, `W${winnerCounter + 1}`]);
            winnerCounter += 2;
          }
        }
        allRounds.push(nextRound);
        currentRound = nextRound;
      }

      setRoundsCount(allRounds.length);
    } else {
      // Perfect power of 2 - no preliminary round
      const firstRoundPairs: Array<[string, string]> = [];
      for (let i = 0; i < base; i += 2) {
        const leftName = names[i] || `VĐV ${i + 1}`;
        const rightName = names[i + 1] || `VĐV ${i + 2}`;
        firstRoundPairs.push([
          `#${i + 1} - ${leftName}`,
          `#${i + 2} - ${rightName}`,
        ]);
      }
      allRounds.push(firstRoundPairs);
      // Create subsequent rounds
      let currentRound = firstRoundPairs;
      let winnerCounter = 1;
      while (currentRound.length > 1) {
        const nextRound: Array<[string, string]> = [];
        for (let i = 0; i < currentRound.length; i += 2) {
          if (i + 1 < currentRound.length) {
            nextRound.push([`W${winnerCounter}`, `W${winnerCounter + 1}`]);
            winnerCounter += 2;
          }
        }
        allRounds.push(nextRound);
        currentRound = nextRound;
      }

      setRoundsCount(allRounds.length);
    }

    setRoundPairs(allRounds);
    console.log("All rounds generated:", allRounds);
    return allRounds[0] || [];
  }

  const handleGenerate = () => {
    const n = Math.max(0, athleteCount);
    if (n <= 0) {
      alert("Vui lòng nhập số VĐV");
      return;
    }
    // Use actual athlete names if available, otherwise generate mock names
    const names =
      selectedAthletes.length > 0
        ? selectedAthletes.map((id) => {
            const athlete = athletes.find((a) => a.id === id);
            return athlete ? athlete.fullName : `VĐV ${id}`;
          })
        : Array.from({ length: n }, (_, i) => `VĐV ${i + 1}`);
    setSeedNames(names);
    const pairs = computePairings(n, names);
    setPairings(pairs);
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

      const dataUrl = await htmlToImage.toPng(bracketRef.current, {
        quality: 1,
        backgroundColor: "#f5f5f5",
        pixelRatio: 2,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
        filter: (node) => {
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

        {/* Athletes List */}
        {competitionId.length > 0 && weightClassId.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
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
                <button
                  onClick={() => {
                    if (selectedAthletes.length === 0) {
                      alert("Vui lòng chọn ít nhất 1 vận động viên");
                      return;
                    }

                    // Set athlete count and names
                    setAthleteCount(selectedAthletes.length);
                    const selectedAthleteNames = selectedAthletes.map((id) => {
                      const athlete = athletes.find((a) => a.id === id);
                      return athlete ? athlete.fullName : `VĐV ${id}`;
                    });

                    // Set seed names first, then generate bracket
                    setSeedNames(selectedAthleteNames);

                    // Generate bracket with athlete names
                    const pairs = computePairings(
                      selectedAthletes.length,
                      selectedAthleteNames
                    );
                    setPairings(pairs);

                    console.log(
                      "Generated bracket for",
                      selectedAthletes.length,
                      "athletes"
                    );
                    console.log("Athlete names:", selectedAthleteNames);
                    console.log("Pairs:", pairs);
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
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Import danh sách VĐV (Tùy chọn)
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-center"
              >
                {athleteFile ? athleteFile.name : "Chọn tệp CSV/XLSX"}
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-between">
          <div className="flex space-x-3">
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
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
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
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
    </div>
  );
}
