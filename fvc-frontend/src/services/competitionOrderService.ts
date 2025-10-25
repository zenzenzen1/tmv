import api from "./api";
import { API_ENDPOINTS } from "../config/endpoints";

export interface CreateCompetitionOrderRequest {
  competitionId: string;
  orderIndex: number;
  contentSelectionId?: string;
}

export const competitionOrderService = {
  async createBulkOrders(
    requests: CreateCompetitionOrderRequest[]
  ): Promise<void> {
    try {
      await api.post(`${API_ENDPOINTS.ATHLETES.BASE}/arrange-order`, {
        tournamentId: requests[0]?.competitionId,
        contentId: requests[0]?.contentSelectionId || "",
        athleteOrders: requests.map((req, index) => ({
          athleteId: `athlete-${index}`, // Mock athlete ID
          order: req.orderIndex,
        })),
      });
    } catch (error) {
      console.error("Failed to create competition orders:", error);
      throw error;
    }
  },
};
