import apiClient from "../config/axios";
import { API_ENDPOINTS } from "../config/endpoints";

export interface PerformanceMatchListItem {
  id: string;
  competitionId: string;
  competitionName: string;
  performanceId: string;
  matchOrder: number | null;
  scheduledTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  contentType: "QUYEN" | "MUSIC";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isTeam: boolean;
  teamName: string | null;
  contentId: string | null;
  fistConfigId: string | null;
  fistItemId: string | null;
  musicContentId: string | null;
  durationSeconds: number | null;
  fieldId: string | null;
  fieldLocation: string | null;
  selectedAthletes: Array<{
    id: string;
    fullName: string;
  }>;
}

export const performanceMatchService = {
  async listMatches(
    competitionId?: string,
    status?: string
  ): Promise<PerformanceMatchListItem[]> {
    try {
      if (!competitionId) {
        return [];
      }
      const url =
        API_ENDPOINTS.PERFORMANCE_MATCHES.BY_COMPETITION(competitionId);
      const res = await apiClient.get<{
        success: boolean;
        data: PerformanceMatchListItem[];
      }>(url);
      let matches = res.data.data || [];

      // Filter by status if provided
      if (status) {
        matches = matches.filter((match) => match.status === status);
      }

      return matches;
    } catch (error) {
      console.error("Error fetching performance matches:", error);
      return [];
    }
  },
};

export default performanceMatchService;
