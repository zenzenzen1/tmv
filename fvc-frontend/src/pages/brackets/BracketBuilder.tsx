import React, { useEffect, useMemo, useState, useRef } from "react";
import MultiSelect from "@/components/common/MultiSelect";
import { useCompetitionStore } from "@/stores/competition";
import { useWeightClassStore } from "@/stores/weightClass";
import * as htmlToImage from 'html-to-image';

export default function BracketBuilder() {
  const { competitions, fetchCompetitions } = useCompetitionStore();
  const { list: wcList, fetch: fetchWc } = useWeightClassStore();

  const [competitionId, setCompetitionId] = useState<string[]>([]);
  const [weightClassId, setWeightClassId] = useState<string[]>([]);
  const [competitionType, setCompetitionType] = useState<string>('individual');
  const [athleteCount, setAthleteCount] = useState<number>(0);
  const [athleteFile, setAthleteFile] = useState<File | null>(null);
  
  const [seedNames, setSeedNames] = useState<string[]>([]);
  const [pairings, setPairings] = useState<Array<[string, string]>>([]); // preliminary round pairs
  const [roundPairs, setRoundPairs] = useState<Array<Array<[string, string]>>>([]); // all rounds including prelim
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
        if (!cancelled) console.warn('fetchCompetitions error (ignored):', e);
      }
      try {
        await fetchWc({ size: 100 });
      } catch (e) {
        if (!cancelled) console.warn('fetchWeightClasses error (ignored):', e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchCompetitions, fetchWc]);

  const competitionOptions = useMemo(() => 
    (competitions || [])
      .map(c => ({ value: c.id, label: c.name })), 
    [competitions]
  );
  const weightClassOptions = useMemo(() => (wcList?.content || []).map(wc => ({ value: wc.id, label: `${wc.gender} - ${wc.minWeight}-${wc.maxWeight}kg` })), [wcList]);

  const handleImport = () => {
    if (!athleteFile) {
      alert("Hãy chọn file danh sách VĐV (.csv/.xlsx)");
      return;
    }
    // Placeholder: parse file here later
    alert(`Đã chọn file: ${athleteFile.name}. Chức năng import sẽ được cài đặt sau.`);
  };

  // --- Bracket algorithm (power-of-two with balanced seeding and BYEs) ---
  function prevPowerOfTwo(n: number): number { if (n < 1) return 1; return 1 << Math.floor(Math.log2(n)); }
  // Compute according to user's rule:
  // base = 2^k <= N, extra = N - base, bye seeds = (base - extra) i.e., seeds (extra+1..base) get byes
  // Round 1 pairs: (1..extra) vs (base+1 .. base+extra)
  function computePairings(n: number): Array<[string, string]> {
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
    const size = extra > 0 ? base * 2 : base; // overall bracket size
    setBaseSize(base);
    setByeCount(byes);
    setBracketSize(size);
    
    const allRounds: Array<Array<[string, string]>> = [];
    
    // Only create preliminary round if there are extra athletes (not a perfect power of 2)
    if (extra > 0) {
      const prelimPairs: Array<[string, string]> = [];
      for (let i = 1; i <= extra; i++) {
        const leftSeed = i;
        const rightSeed = base + i;
        const leftName = leftSeed <= seedNames.length ? seedNames[leftSeed - 1] : `VĐV ${leftSeed}`;
        const rightName = rightSeed <= seedNames.length ? seedNames[rightSeed - 1] : `VĐV ${rightSeed}`;
        prelimPairs.push([`#${leftSeed} - ${leftName}`, `#${rightSeed} - ${rightName}`]);
      }
      allRounds.push(prelimPairs);
      
      // Build base round from winners and byes
      const winnersLabels = prelimPairs.map((_, idx) => `W${idx + 1}`); // W1..Wextra
      const byeSeeds = Array.from({ length: byes }, (_, i) => {
        const seed = extra + 1 + i;
        const name = seed <= seedNames.length ? seedNames[seed - 1] : `VĐV ${seed}`;
        return `#${seed} - ${name}`;
      }); // extra+1 .. base
      const baseParticipants: string[] = [...winnersLabels, ...byeSeeds];
      
      // Form base round pairs by adjacent
      const basePairs: Array<[string, string]> = [];
      for (let i = 0; i < baseParticipants.length; i += 2) {
        basePairs.push([baseParticipants[i] || "", baseParticipants[i + 1] || ""]);
      }
      allRounds.push(basePairs);
      
      // Subsequent rounds: pair winners consecutively
      let prevRoundWinnersCount = basePairs.length;
      let winnerOffset = winnersLabels.length + 1;
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
      
      setRoundsCount(1 + Math.log2(base)); // prelim + full bracket rounds
    } else {
      // Perfect power of 2 - no preliminary round needed
      const firstRoundPairs: Array<[string, string]> = [];
      for (let i = 1; i <= base; i += 2) {
        const leftName = i <= seedNames.length ? seedNames[i - 1] : `VĐV ${i}`;
        const rightName = (i + 1) <= seedNames.length ? seedNames[i] : `VĐV ${i + 1}`;
        firstRoundPairs.push([`#${i} - ${leftName}`, `#${i + 1} - ${rightName}`]);
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
      
      setRoundsCount(Math.log2(base)); // only main bracket rounds
    }
    
    setRoundPairs(allRounds);
    return allRounds[0] || [];
  }

  const handleGenerate = () => {
    const n = Math.max(0, athleteCount);
    if (n <= 0) {
      alert("Vui lòng nhập số VĐV");
      return;
    }
    // Generate mock athlete names
    const names = Array.from({ length: n }, (_, i) => `VĐV ${i + 1}`);
    setSeedNames(names);
    const pairs = computePairings(n);
    setPairings(pairs);
  };


  const generateBracketImage = async () => {
    if (!bracketRef.current) {
      alert('Chưa có bracket để xuất. Vui lòng tạo bracket trước.');
      return;
    }
    
    try {
      const dataUrl = await htmlToImage.toPng(bracketRef.current, {
        quality: 1,
        backgroundColor: '#f5f5f5',
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        filter: (node) => {
          // Skip elements that might cause issues
          return !node.classList?.contains('animate-pulse') && 
                 !node.classList?.contains('animate-bounce');
        }
      });
      
      setPreviewImage(dataUrl);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Không thể tạo ảnh. Vui lòng thử lại.');
    }
  };

  const downloadImage = () => {
    if (!previewImage) return;
    
    const link = document.createElement('a');
    link.download = `bracket-${competitionId[0] || 'tournament'}-${weightClassId[0] || 'weightclass'}.png`;
    link.href = previewImage;
    link.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chia Bracket</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 relative">
        {/* Icon thông tin */}
        <div className="absolute top-4 right-4 group">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-help text-sm font-bold">
            i
          </div>
          <div className="absolute bottom-8 right-0 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            <div className="space-y-1">
              <div><strong>Vòng loại:</strong> VĐV {baseSize + 1}-{athleteCount} đấu</div>
              <div><strong>Vòng chính:</strong> Thắng + BYE (1-{baseSize})</div>
              <div><strong>BYE:</strong> {byeCount} VĐV</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại thi đấu</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Số vận động viên</label>
            <input
              type="number"
              min={0}
              value={athleteCount}
              onChange={(e) => setAthleteCount(Number.isNaN(parseInt(e.target.value)) ? 0 : Math.max(0, parseInt(e.target.value)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập số VĐV (VD: 16)"
            />
          </div>
        </div>


        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Import danh sách VĐV</label>
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

      {roundsCount > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-0 overflow-x-auto max-w-full" ref={bracketRef}>
        {/* Tournament Banner */}
        <div className="relative bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 text-gray-800 px-6 py-6 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
            }}></div>
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
                <h2 className="text-2xl font-bold text-gray-800 drop-shadow-lg">Sơ đồ thi đấu</h2>
                <p className="text-gray-600 text-sm mt-1 font-medium">
                  {competitionId.length > 0 ? (
                    competitionOptions.find(c => c.value === competitionId[0])?.label || "Chưa chọn giải đấu"
                  ) : (
                    "Chưa chọn giải đấu"
                  )}
                </p>
                <p className="text-gray-700 text-xs mt-1">
                  {competitionType === 'individual' ? 
                    'Đối kháng cá nhân' : 
                    'Song luyện đối kháng'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-600 text-sm font-medium">Hạng cân</div>
              <div className="text-gray-800 font-bold text-lg">
                {weightClassId.length > 0 ? (
                  weightClassOptions.find(wc => wc.value === weightClassId[0])?.label || "Chưa chọn"
                ) : (
                  "Chưa chọn"
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Scoped styles for the new playoff-table template */}
        <style>{`
          .playoff-table *{box-sizing:border-box}
          .playoff-table{font-family:sans-serif;font-size:15px;line-height:1.42857143;font-weight:400;width:100%;max-width:100vw;overflow-x:auto;-webkit-overflow-scrolling:touch;background-color:#f5f5f5}
          .playoff-table .playoff-table-content{display:flex;padding:20px;justify-content:center}
          .playoff-table .playoff-table-tour{display:flex;align-items:center;flex-direction:column;justify-content:flex-start;position:relative}
          .playoff-table .playoff-table-round-title{width:100%;margin-bottom:15px}
          .playoff-table .playoff-table-round-title div{font-size:14px;font-weight:600;color:#374151}
          .playoff-table .playoff-table-pair{position:relative;margin-bottom:25px}
          .playoff-table .playoff-table-pair:before{content:'';position:absolute;top:50%;right:-20px;width:20px;height:2px;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-pair:after{content:'';position:absolute;top:50%;right:-20px;width:2px;height:25px;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-pair-style{border:1px solid #ccc;background:#fff;width:180px;margin-bottom:0;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
          .playoff-table .playoff-table-group{padding-right:20px;padding-left:15px;margin-bottom:25px;position:relative;overflow:visible;height:100%;display:flex;align-items:center;flex-direction:column;justify-content:space-around;min-width:220px}
          .playoff-table .playoff-table-group .playoff-table-pair-style:last-child{margin-bottom:0}
          .playoff-table .playoff-table-group:after{content:'';position:absolute;top:50%;right:0;width:2px;height:100%;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-group:last-child{margin-bottom:0}
          .playoff-table .playoff-table-left-player,.playoff-table .playoff-table-right-player{min-height:38px;padding:6px 10px;position:relative;font-size:13px;line-height:1.3;font-weight:500}
          .playoff-table .playoff-table-left-player{border-bottom:1px solid #e5e7eb}
          .playoff-table .playoff-table-left-player:before{content:'';position:absolute;top:50%;left:-20px;width:20px;height:2px;background-color:#2563eb;transform:translateY(-50%)}
          .playoff-table .playoff-table-right-player{margin-top:-1px;border-top:1px solid #e5e7eb}
          .playoff-table .playoff-table-tour:first-child .playoff-table-group{padding-left:0}
          .playoff-table .playoff-table-tour:first-child .playoff-table-left-player:before{display:none}
          .playoff-table .playoff-table-tour:last-child .playoff-table-group:after{display:none}
          .playoff-table .playoff-table-tour:last-child .playoff-table-pair:after,.playoff-table .playoff-table-tour:last-child .playoff-table-pair:before{display:none}
        `}</style>

        {roundsCount === 0 || baseSize === 0 ? (
          <div className="p-6 text-gray-500">Nhập số VĐV và bấm "Tính nhánh" để xem khung playoff.</div>
        ) : (
          <div className="playoff-table">
            <div className="playoff-table-content">
              {Array.from({length: roundsCount}).map((_, rIdx) => {
                const roundList = roundPairs[rIdx] || Array.from({length: rIdx === 0 ? Math.max(0, athleteCount - baseSize) : baseSize / Math.pow(2, rIdx)}).map(() => ["", ""]) as Array<[string,string]>;
                
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
                          <div className="playoff-table-pair" key={`pair-${rIdx}-${pIdx}`}>
                            <div className="playoff-table-pair-style">
                              <div className="playoff-table-left-player">{left}</div>
                              <div className="playoff-table-right-player">{right}</div>
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
              <h3 className="text-xl font-bold">Xem trước ảnh bracket</h3>
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
                  alt="Bracket Preview" 
                  className="max-w-full h-auto border rounded"
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Đang tạo ảnh bracket...</p>
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


