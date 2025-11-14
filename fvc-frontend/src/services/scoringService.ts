import apiClient from "../config/axios";
import { API_ENDPOINTS } from "../config/endpoints";

export type PerformanceType = "FIST" | "MUSIC";
export type ContentType = "FIST" | "MUSIC";

export interface PerformanceAthleteInfo {
  id: string;
  fullName: string;
  email?: string;
  approved?: boolean;
}

export interface PerformanceAssessorInfo {
  id: string;
  userId?: string;
  fullName?: string;
  email?: string;
  position?: number;
  role?: string;
  specialization?: string;
}

export interface PerformanceResponseDto {
  id: string;
  competitionId: string;
  competitionName: string;
  isTeam: boolean;
  teamId?: string | null;
  teamName?: string | null;
  participantsPerEntry?: number | null;
  performanceType: PerformanceType;
  contentType: ContentType;
  contentId?: string | null;
  fistConfigId?: string | null;
  fistItemId?: string | null;
  musicContentId?: string | null;
  status: string;
  totalScore?: string | number | null;
  athletes: PerformanceAthleteInfo[];
  assessors: PerformanceAssessorInfo[];
}

const replacePerformanceId = (path: string, id: string) =>
  path.replace("{performanceId}", encodeURIComponent(id));

export const scoringService = {
  async getPerformance(performanceId: string): Promise<PerformanceResponseDto> {
    try {
      const url = replacePerformanceId(
        API_ENDPOINTS.SCORING.PERFORMANCE_BY_ID,
        performanceId
      );
      const res = await apiClient.get<PerformanceResponseDto>(url);
      // Backend returns PerformanceResponse directly, not wrapped
      return res.data;
    } catch {
      // Fallback to basic performance endpoint
      const url = API_ENDPOINTS.PERFORMANCES.BY_ID.replace(
        "{id}",
        encodeURIComponent(performanceId)
      );
      const res = await apiClient.get<PerformanceResponseDto>(url);
      return res.data;
    }
  },
  async getPerformanceByMatch(
    matchId: string
  ): Promise<PerformanceResponseDto> {
    const url = API_ENDPOINTS.PERFORMANCES.BY_MATCH_ID.replace(
      "{matchId}",
      encodeURIComponent(matchId)
    );
    const res = await apiClient.get<PerformanceResponseDto>(url);
    return res.data;
  },
  async submitScore(params: {
    performanceId: string;
    assessorId: string;
    score: number;
    criteriaScores?: string;
    notes?: string;
  }): Promise<void> {
    const url = API_ENDPOINTS.SCORING.SUBMIT;
    const body = {
      ...params,
      criteriaScores: params.criteriaScores ?? "{}",
    };
    await apiClient.post(url, body);
  },
};

export default scoringService;
