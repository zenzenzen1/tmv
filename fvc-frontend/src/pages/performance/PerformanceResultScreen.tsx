import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import scoringService, {
  type PerformanceResponseDto,
} from "../../services/scoringService";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";

const PerformanceResultScreen: React.FC = () => {
  const [params] = useSearchParams();
  const performanceId = params.get("performanceId") || "";
  const matchId = params.get("matchId") || "";

  const [eventTitle, setEventTitle] = useState<string>("");
  const [formatText, setFormatText] = useState<string>("");
  const [contentName, setContentName] = useState<string>("");
  const [club, setClub] = useState<string>("");
  const [venue, setVenue] = useState<string>("");
  const [notes, setNotes] = useState<string>("-");
  const [team, setTeam] = useState<Array<{ name: string; club?: string }>>([]);
  const [judgeScores, setJudgeScores] = useState<
    Array<{ name: string; number: number; score: number }>
  >([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      if (!performanceId && !matchId) {
        console.warn("Missing performanceId or matchId");
        return;
      }

      try {
        setLoading(true);
        // Load performance data
        const perf: PerformanceResponseDto = performanceId
          ? await scoringService.getPerformance(performanceId)
          : await scoringService.getPerformanceByMatch(matchId);

        // Check contentType
        const contentTypeStr = (perf as unknown as { contentType?: string })
          .contentType;
        const isQuyen =
          contentTypeStr === "QUYEN" || perf.contentType === "FIST";
        const isMusic = perf.contentType === "MUSIC";

        // Event title
        setEventTitle(
          `${perf.competitionName || "Giải đấu"} - ${
            isQuyen ? "QUYỀN" : "VÕ NHẠC"
          }`
        );

        // Format text
        setFormatText(
          `${isQuyen ? "Quyền" : "Võ nhạc"} – ${
            perf.isTeam ? "Đồng đội" : "Cá nhân"
          }`
        );

        // Team members
        const teamMembers =
          (perf.athletes || []).map(
            (a: { fullName?: string; club?: string }) => ({
              name: a.fullName || "-",
              club: a.club || undefined,
            })
          ) || [];
        setTeam(teamMembers);

        // Load content name
        if (isQuyen && perf.fistItemId) {
          try {
            const res = await api.get<{
              data?: { name?: string };
              name?: string;
            }>(API_ENDPOINTS.FIST_CONTENTS.ITEM_BY_ID(perf.fistItemId));
            const data =
              (res.data as { data?: { name?: string } })?.data ||
              (res.data as { name?: string });
            setContentName(data?.name || "Nội dung Quyền");
          } catch {
            setContentName("Nội dung Quyền");
          }
        } else if (isMusic && perf.musicContentId) {
          try {
            const res = await api.get<{
              data?: { name?: string };
              name?: string;
            }>(API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(perf.musicContentId));
            const data =
              (res.data as { data?: { name?: string } })?.data ||
              (res.data as { name?: string });
            setContentName(data?.name || "Nội dung Võ nhạc");
          } catch {
            setContentName("Nội dung Võ nhạc");
          }
        } else {
          setContentName(isQuyen ? "Nội dung Quyền" : "Nội dung Võ nhạc");
        }

        // Load team name from performance data
        if (perf.teamName) {
          setClub(perf.teamName);
        } else if (teamMembers.length > 0 && teamMembers[0].club) {
          // Fallback to club from first athlete if available
          setClub(teamMembers[0].club);
        } else {
          // No team name available
          setClub("-");
        }

        // Load PerformanceMatch for notes and venue
        try {
          if (performanceId) {
            const pmRes = await api.get<{
              data?: {
                id?: string;
                notes?: string;
                competitionId?: string;
              };
              id?: string;
              notes?: string;
              competitionId?: string;
            }>(API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(performanceId));
            const pmData = pmRes.data as {
              data?: {
                id?: string;
                notes?: string;
                competitionId?: string;
              };
              id?: string;
              notes?: string;
              competitionId?: string;
            };
            const pm = pmData?.data || pmData;
            if (pm?.notes) {
              setNotes(pm.notes);
            }
          }

          // Set venue (default to "Sân B" for now)
          setVenue("Sân B");
        } catch (error) {
          console.warn("Failed to load PerformanceMatch details:", error);
        }

        // Load scores from scoring endpoint which returns PerformanceResponse with scores array
        try {
          let scoresArray: Array<{
            assessorId?: string;
            assessorName?: string;
            score?: number | string;
            position?: number;
          }> = [];

          // Get scores from scoring endpoint (returns PerformanceResponse)
          if (performanceId) {
            try {
              const scoresRes = await scoringService.getPerformance(
                performanceId
              );
              // PerformanceResponse has scores property (from backend PerformanceResponse.scores)
              const perfWithScores = scoresRes as PerformanceResponseDto & {
                scores?: Array<{
                  assessorId?: string;
                  assessorName?: string;
                  score?: number | string;
                  position?: number;
                }>;
              };
              scoresArray = perfWithScores.scores || [];
            } catch (scoringError) {
              console.warn(
                "Failed to load scores from scoring service:",
                scoringError
              );
            }
          }

          // Map assessors to scores
          const assessorScores: Array<{
            name: string;
            number: number;
            score: number;
          }> = [];

          // Use assessors from performance data
          if (perf.assessors && perf.assessors.length > 0) {
            perf.assessors.slice(0, 5).forEach((assessor, idx) => {
              const scoreData = scoresArray.find(
                (s) =>
                  s.assessorId === assessor.id ||
                  s.assessorId === assessor.userId ||
                  s.position === idx + 1
              );
              let scoreValue = 0;
              if (scoreData?.score) {
                if (typeof scoreData.score === "number") {
                  scoreValue = scoreData.score;
                } else if (typeof scoreData.score === "string") {
                  scoreValue = parseFloat(scoreData.score) || 0;
                } else {
                  // Handle BigDecimal or other types
                  scoreValue = Number(scoreData.score) || 0;
                }
              }
              assessorScores.push({
                name: assessor.fullName || `Giám định ${idx + 1}`,
                number: idx + 1,
                score: scoreValue,
              });
            });
          } else {
            // If no assessors, use scores array directly
            scoresArray.slice(0, 5).forEach((scoreData, idx) => {
              let scoreValue = 0;
              if (scoreData?.score) {
                if (typeof scoreData.score === "number") {
                  scoreValue = scoreData.score;
                } else if (typeof scoreData.score === "string") {
                  scoreValue = parseFloat(scoreData.score) || 0;
                } else {
                  scoreValue = Number(scoreData.score) || 0;
                }
              }
              assessorScores.push({
                name: scoreData.assessorName || `Giám định ${idx + 1}`,
                number: idx + 1,
                score: scoreValue,
              });
            });
          }

          // Fill remaining slots if less than 5
          while (assessorScores.length < 5) {
            assessorScores.push({
              name: `Giám định ${assessorScores.length + 1}`,
              number: assessorScores.length + 1,
              score: 0,
            });
          }

          setJudgeScores(assessorScores);

          // Calculate total (average of non-zero scores, or use perf.totalScore)
          if (perf.totalScore) {
            const totalScore =
              typeof perf.totalScore === "string"
                ? parseFloat(perf.totalScore)
                : perf.totalScore;
            setTotal(Math.round(totalScore * 100) / 100);
          } else {
            const validScores = assessorScores
              .map((s) => s.score)
              .filter((s) => s > 0 && Number.isFinite(s));
            const sum = validScores.reduce((a, b) => a + b, 0);
            const avg = validScores.length > 0 ? sum / validScores.length : 0;
            setTotal(Math.round(avg * 100) / 100);
          }
        } catch (error) {
          console.error("Failed to load scores:", error);
          // Use default empty scores
          setJudgeScores(
            Array.from({ length: 5 }, (_, i) => ({
              name: `Giám định ${i + 1}`,
              number: i + 1,
              score: 0,
            }))
          );
          // Try to use totalScore from performance
          if (perf.totalScore) {
            const totalScore =
              typeof perf.totalScore === "string"
                ? parseFloat(perf.totalScore)
                : perf.totalScore;
            setTotal(Math.round(totalScore * 100) / 100);
          }
        }
      } catch (error) {
        console.error("Failed to load performance result:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [performanceId, matchId]);

  if (loading) {
    return (
      <div className="bg-[#F5F7FB] min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Đang tải kết quả...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FB] min-h-screen flex flex-col items-center justify-start py-6 px-4">
      {/* Title */}
      <div className="w-full max-w-[1400px] mb-6">
        <h1 className="text-xl font-bold text-[#0F172A] text-center">
          Kết quả Quyền/Võ nhạc
        </h1>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Match Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Giải đấu</div>
                <div className="font-semibold text-gray-900">{eventTitle}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Hình thức</div>
                <div className="font-semibold text-gray-900">{formatText}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Nội dung</div>
                <div className="font-semibold text-gray-900">{contentName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Tên đội</div>
                <div className="font-semibold text-gray-900">{club}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Sàn</div>
                <div className="font-semibold text-gray-900">{venue}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Ghi chú</div>
                <div className="font-semibold text-gray-900">{notes}</div>
              </div>
            </div>
          </div>

          {/* Team Members Card */}
          {team.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="text-lg font-semibold text-gray-900 mb-4">
                THÀNH VIÊN ĐỒNG ĐỘI
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {team.map((member, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8FAFC] rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <div className="font-medium text-gray-900">
                      {member.name}
                    </div>
                    {member.club && (
                      <div className="text-sm text-gray-600 mt-1">
                        Tên đội: {member.club}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Total Score */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="bg-[#1D4ED8] rounded-xl shadow-lg p-8 text-white text-center sticky top-6 flex-1 flex flex-col justify-center items-center min-h-[200px]">
            <div className="text-2xl font-bold mb-4">TỔNG ĐIỂM</div>
            <div className="text-7xl font-black">{total}</div>
          </div>
        </div>
      </div>

      {/* Judge Scores Table */}
      <div className="w-full max-w-[1400px] mt-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-lg font-semibold text-gray-900 mb-4">
            ĐIỂM GIÁM ĐỊNH
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                    TÊN
                  </th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                    GIÁM ĐỊNH SỐ
                  </th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                    ĐIỂM
                  </th>
                </tr>
              </thead>
              <tbody>
                {judgeScores.map((judge, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-900">{judge.name}</td>
                    <td className="py-3 px-4 text-gray-900">{judge.number}</td>
                    <td className="py-3 px-4 text-gray-900 font-semibold text-lg">
                      {judge.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceResultScreen;
