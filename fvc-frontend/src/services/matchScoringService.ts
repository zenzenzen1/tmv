import apiClient from "../config/axios";
import { API_ENDPOINTS } from "../config/endpoints";

export type Corner = "RED" | "BLUE";

export interface MatchAthleteInfo {
  id: string;
  name: string;
  unit: string;
  sbtNumber: string;
  score: number;
  medicalTimeoutCount: number;
  warningCount: number;
}

export interface MatchScoreboard {
  matchId: string;
  matchName: string;
  weightClass: string;
  field: string;
  roundType: string;
  currentRound: number;
  totalRounds: number;
  roundDurationSeconds: number; // Duration for current round
  mainRoundDurationSeconds?: number; // Duration for main rounds (hiệp chính)
  tiebreakerDurationSeconds?: number; // Duration for tiebreaker rounds (hiệp phụ)
  status: string; // e.g., 'CHỜ BẮT ĐẦU' | 'ĐANG ĐẤU' | 'TẠM DỪNG' | 'KẾT THÚC'
  scheduledStartTime?: string | null; // Giờ bắt đầu dự kiến
  redAthlete: MatchAthleteInfo;
  blueAthlete: MatchAthleteInfo;
  redAthletePresent?: boolean; // Xác nhận vận động viên đỏ có mặt
  blueAthletePresent?: boolean; // Xác nhận vận động viên xanh có mặt
}

export interface MatchEvent {
  id: string;
  round: number;
  timestampInRoundSeconds: number;
  judgeId?: string | null;
  assessorIds?: string | null; // Comma-separated list of assessor IDs who voted
  corner: Corner | null;
  eventType:
    | "SCORE_PLUS_1"
    | "SCORE_PLUS_2"
    | "SCORE_MINUS_1"
    | "MEDICAL_TIMEOUT"
    | "WARNING"
    | string;
  description?: string | null;
}

export interface MatchAssessor {
  id: string;
  matchId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  position: number; // 1-5
  role: "ASSESSOR" | "JUDGER";
  notes?: string | null;
}

export interface RecordScoreEventRequest {
  matchId: string;
  round: number;
  timestampInRoundSeconds: number;
  corner: Corner;
  eventType:
    | "SCORE_PLUS_1"
    | "SCORE_PLUS_2"
    | "SCORE_MINUS_1"
    | "MEDICAL_TIMEOUT"
    | "WARNING";
  judgeId?: string | null;
}

export interface ControlMatchRequest {
  matchId: string;
  action: "START" | "PAUSE" | "RESUME" | "NEXT_ROUND" | "END";
  currentRound?: number;
}

export interface MatchListItem {
  id: string;
  competitionId: string;
  weightClassId: string | null;
  roundType: string;
  redAthleteId: string;
  blueAthleteId: string;
  redAthleteName: string;
  blueAthleteName: string;
  redAthleteUnit: string | null;
  blueAthleteUnit: string | null;
  status: string;
  currentRound: number;
  totalRounds: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  scheduledStartTime?: string | null; // Giờ bắt đầu dự kiến
}

function replaceMatchId(path: string, matchId: string): string {
  return path.replace("{matchId}", encodeURIComponent(matchId));
}

export const matchScoringService = {
  async listMatches(competitionId?: string, status?: string): Promise<MatchListItem[]> {
    const params = new URLSearchParams();
    if (competitionId) params.append("competitionId", competitionId);
    if (status) params.append("status", status);
    const url = `${API_ENDPOINTS.MATCHES.LIST}${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiClient.get<{ success: boolean; data: MatchListItem[] }>(url);
    return res.data.data;
  },

  async listMyAssignedMatches(status?: string): Promise<MatchListItem[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    const url = `${API_ENDPOINTS.MATCH_ASSESSORS.MY_ASSIGNMENTS}${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiClient.get<{ success: boolean; data: MatchListItem[] }>(url);
    return res.data.data;
  },

  async getScoreboard(matchId: string): Promise<MatchScoreboard> {
    const url = replaceMatchId(API_ENDPOINTS.MATCHES.SCOREBOARD, matchId);
    const res = await apiClient.get<{ success: boolean; data: MatchScoreboard }>(url);
    return res.data.data;
  },

  async getEventHistory(matchId: string): Promise<MatchEvent[]> {
    const url = replaceMatchId(API_ENDPOINTS.MATCHES.EVENTS, matchId);
    const res = await apiClient.get<{ success: boolean; data: MatchEvent[] }>(url);
    return res.data.data;
  },

  async recordScoreEvent(matchId: string, body: Omit<RecordScoreEventRequest, "matchId">): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.SCORE;
    await apiClient.post(url, { matchId, ...body });
  },

  async controlMatch(matchId: string, body: Omit<ControlMatchRequest, "matchId">): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.CONTROL;
    await apiClient.post(url, { matchId, ...body });
  },

  async undoLastEvent(matchId: string): Promise<void> {
    const url = replaceMatchId(API_ENDPOINTS.MATCHES.UNDO, matchId);
    await apiClient.post(url);
  },

  async getMatchAssessors(matchId: string): Promise<MatchAssessor[]> {
    const url = API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace("{matchId}", matchId);
    const res = await apiClient.get<{ success: boolean; data: MatchAssessor[] }>(url);
    return res.data.data;
  },

  async updateRoundDuration(matchId: string, roundDurationSeconds: number): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.UPDATE_ROUND_DURATION.replace("{matchId}", matchId);
    await apiClient.patch(url, null, {
      params: { roundDurationSeconds },
    });
  },

  async updateField(matchId: string, fieldId: string | null): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.UPDATE_FIELD.replace("{matchId}", matchId);
    await apiClient.patch(url, null, {
      params: fieldId ? { fieldId } : {},
    });
  },

  async updateTotalRounds(matchId: string, totalRounds: number): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.UPDATE_TOTAL_ROUNDS.replace("{matchId}", matchId);
    await apiClient.patch(url, null, {
      params: { totalRounds },
    });
  },

  async updateMainRoundDuration(matchId: string, mainRoundDurationSeconds: number): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.UPDATE_MAIN_ROUND_DURATION.replace("{matchId}", matchId);
    await apiClient.patch(url, null, {
      params: { mainRoundDurationSeconds },
    });
  },

  async updateTiebreakerDuration(matchId: string, tiebreakerDurationSeconds: number): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.UPDATE_TIEBREAKER_DURATION.replace("{matchId}", matchId);
    await apiClient.patch(url, null, {
      params: { tiebreakerDurationSeconds },
    });
  },

  async updateScheduledStartTime(matchId: string, scheduledStartTime: string | null): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.UPDATE_SCHEDULED_START_TIME.replace("{matchId}", matchId);
    await apiClient.patch(url, null, {
      params: scheduledStartTime ? { scheduledStartTime } : {},
    });
  },

  async updateAthletePresence(
    matchId: string,
    redAthletePresent: boolean,
    blueAthletePresent: boolean
  ): Promise<void> {
    const url = API_ENDPOINTS.MATCHES.UPDATE_ATHLETE_PRESENCE.replace("{matchId}", matchId);
    await apiClient.patch(url, {
      redAthletePresent,
      blueAthletePresent,
    });
  },
};

export default matchScoringService;


