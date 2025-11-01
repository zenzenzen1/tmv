import api from "./api";
import { API_ENDPOINTS } from "../config/endpoints";

export interface CreateCompetitionOrderRequest {
  competitionId: string;
  orderIndex: number;
  contentSelectionId?: string;
}

export interface CompetitionOrderResponse {
  id: string;
  competitionId: string;
  competitionName: string;
  orderIndex: number;
  contentSelectionId?: string;
  athleteCount: number;
  athleteIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class CompetitionOrderService {
  async createOrder(
    request: CreateCompetitionOrderRequest
  ): Promise<CompetitionOrderResponse> {
    const response = await api.post<BaseResponse<CompetitionOrderResponse>>(
      API_ENDPOINTS.COMPETITION_ORDERS.BASE,
      request
    );
    return response.data.data;
  }

  async createBulkOrders(
    requests: CreateCompetitionOrderRequest[]
  ): Promise<CompetitionOrderResponse[]> {
    const response = await api.post<BaseResponse<CompetitionOrderResponse[]>>(
      API_ENDPOINTS.COMPETITION_ORDERS.BULK,
      requests
    );
    return response.data.data;
  }

  async getOrdersByCompetition(
    competitionId: string
  ): Promise<CompetitionOrderResponse[]> {
    const response = await api.get<BaseResponse<CompetitionOrderResponse[]>>(
      API_ENDPOINTS.COMPETITION_ORDERS.BY_COMPETITION(competitionId)
    );
    return response.data.data;
  }

  async getOrdersByCompetitionAndContent(
    competitionId: string,
    contentSelectionId: string
  ): Promise<CompetitionOrderResponse[]> {
    const response = await api.get<BaseResponse<CompetitionOrderResponse[]>>(
      API_ENDPOINTS.COMPETITION_ORDERS.BY_COMPETITION_AND_CONTENT(
        competitionId,
        contentSelectionId
      )
    );
    return response.data.data;
  }

  async getOrderById(id: string): Promise<CompetitionOrderResponse> {
    const response = await api.get<BaseResponse<CompetitionOrderResponse>>(
      API_ENDPOINTS.COMPETITION_ORDERS.BY_ID(id)
    );
    return response.data.data;
  }

  async updateOrder(
    id: string,
    request: Partial<CreateCompetitionOrderRequest>
  ): Promise<CompetitionOrderResponse> {
    const response = await api.put<BaseResponse<CompetitionOrderResponse>>(
      API_ENDPOINTS.COMPETITION_ORDERS.BY_ID(id),
      request
    );
    return response.data.data;
  }

  async deleteOrder(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.COMPETITION_ORDERS.BY_ID(id));
  }

  async deleteOrdersByCompetition(competitionId: string): Promise<void> {
    await api.delete(
      API_ENDPOINTS.COMPETITION_ORDERS.BY_COMPETITION(competitionId)
    );
  }
}

export const competitionOrderService = new CompetitionOrderService();
