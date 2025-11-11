import { useEffect, useMemo, useState } from "react";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompetitionStore } from "@/stores/competition";
import { useWeightClassStore } from "@/stores/weightClass";
import { useToast } from "../../components/common/ToastContext";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { BracketRound, BracketMatch as BracketViewMatch } from "../../components/bracket/BracketView";

interface Athlete {
  id: string;
  fullName: string;
  drawSeedNumber?: number | null;
  draw_seed_number?: number | null; // Alternative field name from API
  seedNumber?: number | null; // Alternative field name
}

export default function BracketViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { competitions, fetchCompetitions } = useCompetitionStore();
  const { list: wcList, fetch: fetchWc } = useWeightClassStore();

  const competitionId = searchParams.get("competitionId") || "";
  const weightClassId = searchParams.get("weightClassId") || "";

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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

  // Fetch athletes when competition and weight class are selected
  useEffect(() => {
    if (!competitionId || !weightClassId) {
      setAthletes([]);
      return;
    }

    let cancelled = false;
    const fetchAthletes = async () => {
      setLoading(true);
      console.log("🔍 [BracketViewPage] Starting fetch with:", { competitionId, weightClassId });
      
      try {
        // Add a small delay to ensure database is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const params = new URLSearchParams({
          competitionId,
          competitionType: "fighting",
          weightClassId,
          page: "0",
          size: "100",
          // Add timestamp to prevent caching
          _t: Date.now().toString(),
        });

        const url = `${API_ENDPOINTS.ATHLETES.BASE}?${params.toString()}`;
        console.log("🔍 [BracketViewPage] Fetching from URL:", url);

        const response = await api.get(url);
        console.log("🔍 [BracketViewPage] Raw response:", response);
        console.log("🔍 [BracketViewPage] Response data:", response.data);

        if (!cancelled) {
          const pageData =
            ((response.data as unknown as { data?: { content?: Athlete[] } })
              .data as { content?: Athlete[] }) ??
            (response.data as unknown as { content?: Athlete[] });

          console.log("🔍 [BracketViewPage] Parsed pageData:", pageData);
          const fetchedAthletes = pageData?.content || [];
          console.log("📊 [BracketViewPage] Fetched athletes count:", fetchedAthletes.length);
          
          if (fetchedAthletes.length > 0) {
            console.log("📊 [BracketViewPage] First athlete sample (raw):", fetchedAthletes[0]);
            console.log("📊 [BracketViewPage] First athlete all fields:", Object.keys(fetchedAthletes[0]));
          }
          
          // Normalize seed number field (check multiple possible field names)
          const normalizedAthletes = fetchedAthletes.map(a => ({
            ...a,
            drawSeedNumber: a.drawSeedNumber ?? a.draw_seed_number ?? a.seedNumber ?? null
          }));
          
          console.log("📊 [BracketViewPage] All athletes drawSeedNumber values:", 
            normalizedAthletes.map(a => ({ 
              name: a.fullName, 
              drawSeedNumber: a.drawSeedNumber,
              draw_seed_number: a.draw_seed_number,
              seedNumber: a.seedNumber,
              allFields: Object.keys(a)
            })));
          
          // Filter to only athletes with seed numbers (must be > 0)
          const athletesWithSeeds = normalizedAthletes.filter(
            (a) => a.drawSeedNumber != null && a.drawSeedNumber > 0
          );
          
          console.log("📊 [BracketViewPage] Filtered athletes with seeds:", athletesWithSeeds.length);
          if (athletesWithSeeds.length > 0) {
            console.log("📊 [BracketViewPage] Sample athletes with seeds:", athletesWithSeeds.slice(0, 3).map(a => ({
              name: a.fullName,
              seed: a.drawSeedNumber
            })));
          } else {
            console.warn("⚠️ [BracketViewPage] No athletes with valid seed numbers found!");
            console.warn("⚠️ [BracketViewPage] All fetched athletes:", fetchedAthletes.map(a => ({
              name: a.fullName,
              drawSeedNumber: a.drawSeedNumber
            })));
          }
          
          setAthletes(athletesWithSeeds);
        }
      } catch (error) {
        console.error("❌ [BracketViewPage] Error fetching athletes:", error);
        console.error("❌ [BracketViewPage] Error details:", error instanceof Error ? error.message : error);
        if (!cancelled) {
          toast.error("Không thể tải danh sách vận động viên");
          setAthletes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAthletes();
    return () => {
      cancelled = true;
    };
  }, [competitionId, weightClassId, toast]);

  // Calculate bracket structure
  const calculateBracket = useMemo(() => {
    if (athletes.length === 0) return null;

    // Filter athletes: must have valid seed number (> 0)
    const validAthletes = athletes.filter(
      (a) => a.drawSeedNumber != null && a.drawSeedNumber > 0
    );

    if (validAthletes.length === 0) return null;

    // Remove duplicate seed numbers - keep only the first occurrence of each seed
    const seenSeeds = new Set<number>();
    const uniqueAthletes = validAthletes.filter((a) => {
      const seed = a.drawSeedNumber!;
      if (seenSeeds.has(seed)) {
        console.warn(`⚠️ Duplicate seed number ${seed} found for athlete ${a.fullName}, skipping`);
        return false;
      }
      seenSeeds.add(seed);
      return true;
    });

    // Sort athletes by seed number
    const sortedAthletes = [...uniqueAthletes].sort(
      (a, b) => (a.drawSeedNumber || 0) - (b.drawSeedNumber || 0)
    );

    // Verify all athletes have valid seed numbers (should be true after filtering)
    if (sortedAthletes.some((a) => !a.drawSeedNumber || a.drawSeedNumber <= 0)) return null;

    const totalAthletes = sortedAthletes.length;

    // Check if totalAthletes is a power of 2
    const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
    const isExactPowerOfTwo = isPowerOfTwo(totalAthletes);

    let firstRoundMatches: number;
    let byeCount: number;
    let totalRounds: number;
    let lowerPower: number;
    let upperPower: number;

    if (isExactPowerOfTwo) {
      firstRoundMatches = totalAthletes / 2;
      byeCount = 0;
      lowerPower = totalAthletes;
      upperPower = totalAthletes;
      // For exact power of two, number of rounds equals log2(totalAthletes)
      totalRounds = Math.log2(totalAthletes);
    } else {
      lowerPower = 1;
      while (lowerPower * 2 <= totalAthletes) {
        lowerPower *= 2;
      }
      upperPower = lowerPower * 2;

      // Calculate bye positions
      byeCount = upperPower - totalAthletes;
      // Number of athletes playing in first round = total - byes
      // Number of matches in first round = (athletes playing) / 2
      const athletesPlayingRound1 = totalAthletes - byeCount;
      firstRoundMatches = athletesPlayingRound1 / 2;
      // When not a power of two, rounds equals log2(upperPower)
      totalRounds = Math.log2(upperPower);
    }

    // Create first round matches using Vovinam bracket algorithm
    // Logic: Higher seeds (1 to firstRoundMatches) vs Lower seeds (N-firstRoundMatches+1 to N)
    // Middle seeds (firstRoundMatches+1 to N-firstRoundMatches) get byes
    // Example for N=25: Seeds 1-9 vs Seeds 17-25 (9 matches), Seeds 10-16 get byes (7 byes)
    const firstRound: Array<{
      id: string;
      participants: Array<{ id: string; name: string }>;
    }> = [];
    let matchIdCounter = 1;

    // Step 1: Identify athletes by their role
    const higherSeeds: typeof sortedAthletes = []; // Seeds 1 to firstRoundMatches
    const lowerSeeds: typeof sortedAthletes = [];  // Seeds N-firstRoundMatches+1 to N
    const byeAthletes: typeof sortedAthletes = []; // Seeds firstRoundMatches+1 to N-firstRoundMatches
    
    if (!isExactPowerOfTwo) {
      // Higher seeds: 1 to firstRoundMatches
      for (let i = 0; i < firstRoundMatches; i++) {
        higherSeeds.push(sortedAthletes[i]);
      }
      
      // Lower seeds: N-firstRoundMatches+1 to N (last firstRoundMatches seeds)
      const lowerSeedStartIndex = totalAthletes - firstRoundMatches;
      for (let i = lowerSeedStartIndex; i < totalAthletes; i++) {
        lowerSeeds.push(sortedAthletes[i]);
      }
      
      // Bye athletes: firstRoundMatches+1 to N-firstRoundMatches (middle seeds)
      for (let i = firstRoundMatches; i < lowerSeedStartIndex; i++) {
        byeAthletes.push(sortedAthletes[i]);
      }
    } else {
      // If exact power of 2, no byes
      // Pair seeds: 1 vs N, 2 vs N-1, etc.
      for (let i = 0; i < firstRoundMatches; i++) {
        higherSeeds.push(sortedAthletes[i]);
        lowerSeeds.push(sortedAthletes[totalAthletes - 1 - i]);
      }
    }

    // Step 2: Create round 1 matches: Higher seeds vs Lower seeds
    // Match i: Seed (i+1) vs Seed (N-i)
    for (let i = 0; i < firstRoundMatches; i++) {
      const higherSeed = higherSeeds[i];
      const lowerSeed = lowerSeeds[i];

      firstRound.push({
        id: `match-${matchIdCounter++}`,
        participants: [
          { id: higherSeed.id, name: higherSeed.fullName },
          { id: lowerSeed.id, name: lowerSeed.fullName },
        ],
      });
    }

    return {
      firstRound,
      byeAthletes,
      totalRounds,
      lowerPower,
      upperPower,
      byeCount,
      firstRoundMatches,
      sortedAthletes,
      totalAthletes,
    };
  }, [athletes]);

  // Calculate all rounds for bracket visualization
  // Following Vovinam bracket algorithm:
  // Round 1: Higher seeds (1-9) vs Lower seeds (17-25) = 9 matches
  // Round 2: Winners from matches 1-7 + Bye seeds (10-16) = 7 matches, Winners from matches 8-9 = 1 match = 8 total
  // Subsequent rounds: 4, 2, 1 matches
  // Important: Matches must be arranged correctly for bracket visualization
  const bracketRounds = useMemo(() => {
    if (!calculateBracket) return [];

    const rounds: BracketRound[] = [];
    const { firstRound, byeAthletes, totalRounds, sortedAthletes, firstRoundMatches } = calculateBracket;

    // Round 1: Only first round matches
    const round1Matches: BracketViewMatch[] = [];
    
    firstRound.forEach((match, index) => {
      round1Matches.push({
        id: match.id,
        name: `Vòng 1 - Trận ${index + 1}`,
        round: 1,
        matchNumber: index + 1,
        redAthlete: {
          id: match.participants[0].id,
          name: match.participants[0].name,
          seedNumber: sortedAthletes.find((a) => a.id === match.participants[0].id)?.drawSeedNumber || undefined,
        },
        blueAthlete: {
          id: match.participants[1].id,
          name: match.participants[1].name,
          seedNumber: sortedAthletes.find((a) => a.id === match.participants[1].id)?.drawSeedNumber || undefined,
        },
      });
    });

    rounds.push({
      roundNumber: 1,
      roundName: "Vòng 1",
      matches: round1Matches,
    });

    // Round 2: Combine ALL winners from round 1 with ALL bye athletes
    // Total participants in round 2 = firstRoundMatches (winners) + byeCount (byes)
    // Total matches in round 2 = (firstRoundMatches + byeCount) / 2
    const round2Matches: BracketViewMatch[] = [];
    
    if (byeAthletes.length > 0) {
      // Strategy: Pair winners with byes first, then pair remaining byes with each other
      // Pair each winner with a bye athlete
      for (let i = 0; i < firstRoundMatches; i++) {
        const byeAthlete = byeAthletes[i];
        round2Matches.push({
          id: `round-2-match-${i + 1}`,
          name: `Vòng 2 - Trận ${i + 1}`,
          round: 2,
          matchNumber: i + 1,
          redAthlete: {
            id: `winner-${round1Matches[i].id}`,
            name: `Thắng ${round1Matches[i].name}`,
            seedNumber: undefined,
          },
          blueAthlete: {
            id: byeAthlete.id,
            name: byeAthlete.fullName,
            seedNumber: byeAthlete.drawSeedNumber || undefined,
          },
        });
      }
      
      // Pair remaining bye athletes with each other
      const remainingByes = byeAthletes.length - firstRoundMatches;
      let matchCounter = firstRoundMatches;
      for (let i = 0; i < remainingByes; i += 2) {
        if (i + 1 < remainingByes) {
          // Pair two bye athletes
          const bye1 = byeAthletes[firstRoundMatches + i];
          const bye2 = byeAthletes[firstRoundMatches + i + 1];
          round2Matches.push({
            id: `round-2-match-${matchCounter + 1}`,
            name: `Vòng 2 - Trận ${matchCounter + 1}`,
            round: 2,
            matchNumber: matchCounter + 1,
            redAthlete: {
              id: bye1.id,
              name: bye1.fullName,
              seedNumber: bye1.drawSeedNumber || undefined,
            },
            blueAthlete: {
              id: bye2.id,
              name: bye2.fullName,
              seedNumber: bye2.drawSeedNumber || undefined,
            },
          });
          matchCounter++;
        }
      }
    } else {
      // If no byes (exact power of 2), pair winners normally
      const matchesInRound2 = Math.ceil(firstRoundMatches / 2);
      for (let i = 0; i < matchesInRound2; i++) {
        round2Matches.push({
          id: `round-2-match-${i + 1}`,
          name: `Vòng 2 - Trận ${i + 1}`,
          round: 2,
          matchNumber: i + 1,
          redAthlete: {
            id: `winner-${round1Matches[i * 2].id}`,
            name: `Thắng ${round1Matches[i * 2].name}`,
            seedNumber: undefined,
          },
          blueAthlete: round1Matches[i * 2 + 1] ? {
            id: `winner-${round1Matches[i * 2 + 1].id}`,
            name: `Thắng ${round1Matches[i * 2 + 1].name}`,
            seedNumber: undefined,
          } : null,
        });
      }
    }

    rounds.push({
      roundNumber: 2,
      roundName: "Vòng 2",
      matches: round2Matches,
    });

    // Calculate subsequent rounds (Quarter-finals, Semi-finals, Final)
    // Each match in round N connects to match ceil(i/2) in round N+1
    let currentRoundMatches = round2Matches.length;
    for (let roundNum = 3; roundNum <= totalRounds; roundNum++) {
      const nextRoundMatches: BracketViewMatch[] = [];
      const matchesInThisRound = Math.ceil(currentRoundMatches / 2);

      for (let i = 0; i < matchesInThisRound; i++) {
        const roundName = matchesInThisRound === 4 ? "Tứ kết" :
                         matchesInThisRound === 2 ? "Bán kết" :
                         matchesInThisRound === 1 ? "Chung kết" :
                         `Vòng ${roundNum}`;

        nextRoundMatches.push({
          id: `round-${roundNum}-match-${i + 1}`,
          name: `${roundName} - Trận ${i + 1}`,
          round: roundNum,
          matchNumber: i + 1,
          redAthlete: {
            id: `winner-round-${roundNum - 1}-match-${i * 2 + 1}`,
            name: `Thắng Vòng ${roundNum - 1} - Trận ${i * 2 + 1}`,
            seedNumber: undefined,
          },
          blueAthlete: i * 2 + 1 < currentRoundMatches ? {
            id: `winner-round-${roundNum - 1}-match-${i * 2 + 2}`,
            name: `Thắng Vòng ${roundNum - 1} - Trận ${i * 2 + 2}`,
            seedNumber: undefined,
          } : null,
        });
      }

      rounds.push({
        roundNumber: roundNum,
        roundName: matchesInThisRound === 4 ? "Tứ kết" :
                   matchesInThisRound === 2 ? "Bán kết" :
                   matchesInThisRound === 1 ? "Chung kết" :
                   `Vòng ${roundNum}`,
        matches: nextRoundMatches,
      });

      currentRoundMatches = matchesInThisRound;
    }

    return rounds;
  }, [calculateBracket]);

  const competitionName = competitions?.find((c) => c.id === competitionId)?.name || "";
  const weightClass = wcList?.content?.find((wc) => wc.id === weightClassId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sơ đồ nhánh đấu</h1>
          {competitionName && (
            <p className="text-gray-600 mt-1">
              {competitionName}
              {weightClass && ` - ${weightClass.gender} ${weightClass.minWeight}-${weightClass.maxWeight}kg`}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/manage/brackets")}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Quay lại
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-gray-500">
          Đang tải dữ liệu...
        </div>
      )}

      {/* No Data State */}
      {!loading && !calculateBracket && (
        <div className="text-center py-8 text-gray-500">
          {!competitionId || !weightClassId
            ? "Vui lòng chọn giải đấu và hạng cân"
            : athletes.length === 0
            ? "Chưa có vận động viên nào được bốc thăm. Vui lòng quay lại và lưu số bốc thăm trước."
            : "Chưa có dữ liệu bracket để hiển thị"}
        </div>
      )}

      {/* Bracket Visualization (MUI tree) */}
      {!loading && calculateBracket && bracketRounds.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4 text-sm text-gray-600 space-y-1">
            <p>Tổng số vận động viên: {calculateBracket.totalAthletes}</p>
            <p>
              Số vận động viên được bye:{" "}
              {calculateBracket.byeCount > 0 ? calculateBracket.byeCount : 0}
            </p>
            <p>Số trận vòng đầu: {calculateBracket.firstRoundMatches}</p>
            <p>Tổng số vòng đấu: {calculateBracket.totalRounds}</p>
            <p className="font-semibold text-blue-600">
              Tổng số trận đấu (từ vòng đầu đến chung kết): {calculateBracket.totalAthletes - 1}
            </p>
          </div>
          <MuiBracketTree rounds={bracketRounds} />
        </div>
      )}
    </div>
  );
}

function MuiBracketTree({ rounds }: { rounds: BracketRound[] }) {
  // Group matches into pairs for CSS-based centering
  const groupMatches = (matches: BracketViewMatch[]) => {
    const groups: BracketViewMatch[][] = [];
    for (let i = 0; i < matches.length; i += 2) {
      groups.push(matches.slice(i, i + 2));
    }
    return groups;
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        pb: 2,
        "& .bracket-round": {
          minWidth: 240,
          flexShrink: 0,
          position: "relative",
        },
        "& .bracket-header": {
          textAlign: "center",
          mb: 2,
        },
        "& .bracket-match-pair": {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minHeight: "200px",
          justifyContent: "space-between",
          marginBottom: 2,
          // Horizontal line from each match
          "& .bracket-match::after": {
            content: '""',
            position: "absolute",
            top: "50%",
            right: "-48px",
            width: "48px",
            height: "1px",
            backgroundColor: "#CBD5E1",
            zIndex: 0,
          },
          // Vertical connector line connecting the two horizontal lines
          "&::before": {
            content: '""',
            position: "absolute",
            top: "25%",
            bottom: "25%",
            right: "-48px",
            width: "1px",
            backgroundColor: "#CBD5E1",
            zIndex: 0,
          },
          // Horizontal line from vertical connector to next round
          "&::after": {
            content: '""',
            position: "absolute",
            top: "50%",
            right: "-48px",
            width: "48px",
            height: "1px",
            backgroundColor: "#CBD5E1",
            zIndex: 0,
          },
        },
        "& .bracket-match": {
          position: "relative",
          zIndex: 1,
        },
        "& .bracket-single-match": {
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          marginBottom: 2,
          // Horizontal line to next round
          "&::before": {
            content: '""',
            position: "absolute",
            top: "50%",
            right: "-48px",
            width: "48px",
            height: "1px",
            backgroundColor: "#CBD5E1",
            zIndex: 0,
          },
        },
      }}
    >
      {rounds.map((round, roundIdx) => {
        const isFirstRound = roundIdx === 0;
        const isLastRound = roundIdx === rounds.length - 1;
        const matchGroups = isFirstRound ? groupMatches(round.matches) : null;

        return (
          <Box key={round.roundNumber} className="bracket-round">
            <Box className="bracket-header">
              <Typography variant="subtitle1" fontWeight={600}>
                {round.roundName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {round.matches.length} trận
              </Typography>
            </Box>

            {isFirstRound && matchGroups ? (
              // First round: group matches in pairs
              matchGroups.map((group, groupIdx) => (
                <Box
                  key={groupIdx}
                  className="bracket-match-pair"
                  sx={{
                    "&::before": !isLastRound
                      ? {
                          display: "block",
                        }
                      : { display: "none" },
                    "&::after": !isLastRound
                      ? {
                          display: "block",
                        }
                      : { display: "none" },
                  }}
                >
                  {group.map((match, matchIdx) => (
                    <Box key={match.id || `${roundIdx}-${matchIdx}`} className="bracket-match">
                      <MatchCard match={match} />
                    </Box>
                  ))}
                </Box>
              ))
            ) : (
              // Subsequent rounds: single match per group, centered between parent pairs
              (() => {
                // Calculate container height based on previous round
                const prevRound = rounds[roundIdx - 1];
                const prevMatchCount = prevRound.matches.length;
                const prevPairCount = Math.ceil(prevMatchCount / 2);
                
                const matchCardHeight = 96;
                const gapBetweenMatches = 16;
                const gapBetweenPairs = 16;
                const pairHeight = matchCardHeight * 2 + gapBetweenMatches;
                const containerHeight = prevPairCount * pairHeight + (prevPairCount - 1) * gapBetweenPairs;

                return (
                  <Box
                    sx={{
                      position: "relative",
                      minHeight: `${containerHeight}px`,
                    }}
                  >
                    {round.matches.map((match, matchIdx) => {
                      // Position this match to be centered in its corresponding pair group
                      const pairIndex = matchIdx;
                      const pairStartPosition = pairIndex * (pairHeight + gapBetweenPairs);
                      const pairCenterPosition = pairStartPosition + pairHeight / 2;

                      return (
                        <Box
                          key={match.id || `${roundIdx}-${matchIdx}`}
                          className="bracket-single-match"
                          sx={{
                            position: "absolute",
                            top: `${pairCenterPosition - matchCardHeight / 2}px`,
                            left: 0,
                            right: 0,
                            "&::before": !isLastRound
                              ? {
                                  display: "block",
                                }
                              : { display: "none" },
                          }}
                        >
                          <Box className="bracket-match">
                            <MatchCard match={match} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })()
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function MatchCard({ match }: { match: BracketViewMatch }) {
  const redSeed = match.redAthlete?.seedNumber;
  const blueSeed =
    (match.blueAthlete as { seedNumber?: number | null } | null | undefined)?.seedNumber ?? null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: 96,
        justifyContent: "center",
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {match.name}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "rgba(239, 68, 68, 0.08)",
          borderRadius: 1,
          px: 1,
          py: 0.5,
        }}
      >
        <Typography variant="body2" noWrap>
          {match.redAthlete?.name || "TBD"}
        </Typography>
        {redSeed ? (
          <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
            #{redSeed}
          </Typography>
        ) : null}
      </Box>
      <Divider flexItem />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "rgba(59, 130, 246, 0.08)",
          borderRadius: 1,
          px: 1,
          py: 0.5,
        }}
      >
        <Typography variant="body2" noWrap>
          {(match.blueAthlete as { name?: string } | null | undefined)?.name || "TBD"}
        </Typography>
        {blueSeed ? (
          <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
            #{blueSeed}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}
