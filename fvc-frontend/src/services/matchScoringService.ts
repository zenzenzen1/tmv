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
  roundType: string;
  currentRound: number;
  totalRounds: number;
  roundDurationSeconds: number;
  timeRemainingSeconds: number;
  status: string; // e.g., 'CHỜ BẮT ĐẦU' | 'ĐANG ĐẤU' | 'TẠM DỪNG' | 'KẾT THÚC'
  redAthlete: MatchAthleteInfo;
  blueAthlete: MatchAthleteInfo;
}

export interface MatchEvent {
  id: string;
  round: number;
  timestampInRoundSeconds: number;
  judgeId?: string | null;
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
}

export interface ControlMatchRequest {
  matchId: string;
  action: "START" | "PAUSE" | "RESUME" | "END";
  currentRound?: number;
  timeRemainingSeconds?: number;
}

function replaceMatchId(path: string, matchId: string): string {
  return path.replace("{matchId}", encodeURIComponent(matchId));
}

export const matchScoringService = {
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
};

export default matchScoringService;


