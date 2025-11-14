import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type {
  CompetitionResponse,
  CreateCompetitionRequest,
  UpdateCompetitionRequest,
  CompetitionFilters,
  PaginationResponse,
  TournamentStatus,
} from "../types";
import type { BaseResponse } from "../types/api";

// Tournament/Competition API service
class CompetitionService {
  private readonly baseEndpoint = API_ENDPOINTS.COMPETITIONS.BASE;
  private readonly arrangeOrderEndpoint = API_ENDPOINTS.ATHLETES.ARRANGE_ORDER;

  // Get all competitions with filters and pagination
  async getCompetitions(
    filters: CompetitionFilters = {}
  ): Promise<PaginationResponse<CompetitionResponse>> {
    console.log("CompetitionService - calling API with filters:", filters);
    console.log("CompetitionService - endpoint:", this.baseEndpoint);
    const response = await apiService.get<
      PaginationResponse<CompetitionResponse>
    >(this.baseEndpoint, filters);
    console.log("CompetitionService - raw response:", response);
    console.log("CompetitionService - response data:", response.data);
    console.log(
      "CompetitionService - response.data.content:",
      response.data?.content
    );

    if (!response.data) {
      console.error("CompetitionService - response.data is undefined!");
      throw new Error("Invalid API response structure");
    }

    console.log("CompetitionService - returning:", response.data);
    return response.data;
  }

  // Get competition by ID
  async getCompetitionById(id: string): Promise<CompetitionResponse> {
    const response = await apiService.get<BaseResponse<CompetitionResponse>>(
      `${this.baseEndpoint}/${id}`
    );
    // Handle different response structures
    if (response?.data?.data) {
      return response.data.data;
    }
    if (response?.data) {
      return response.data as CompetitionResponse;
    }
    if (response) {
      return response as unknown as CompetitionResponse;
    }
    throw new Error(`Competition not found with id: ${id}`);
  }

  // Create new competition
  async createCompetition(
    data: CreateCompetitionRequest
  ): Promise<CompetitionResponse> {
    console.log("CompetitionService - creating competition with data:", data);
    const response = await apiService.post<CompetitionResponse>(
      this.baseEndpoint,
      data
    );
    console.log("CompetitionService - create response:", response);
    console.log("CompetitionService - create response.data:", response.data);
    return response.data;
  }

  // Update competition
  async updateCompetition(
    id: string,
    data: UpdateCompetitionRequest
  ): Promise<CompetitionResponse> {
    const response = await apiService.put<BaseResponse<CompetitionResponse>>(
      `${this.baseEndpoint}/${id}`,
      data
    );
    return response.data.data;
  }

  // Delete competition
  async deleteCompetition(id: string): Promise<void> {
    await apiService.delete<void>(`${this.baseEndpoint}/${id}`);
  }

  // Change competition status
  async changeStatus(
    id: string,
    status: TournamentStatus
  ): Promise<CompetitionResponse> {
    const response = await apiService.patch<BaseResponse<CompetitionResponse>>(
      `${this.baseEndpoint}/${id}/status?status=${status}`
    );
    return response.data.data;
  }

  // Get available years for filtering
  async getAvailableYears(): Promise<number[]> {
    // This would typically be a separate endpoint, but for now we'll extract from competitions
    const response = await apiService.get<CompetitionResponse[]>(
      `${this.baseEndpoint}/years`
    );
    return response.data.map((comp) => new Date(comp.startDate).getFullYear());
  }

  // Get available locations for filtering
  async getAvailableLocations(): Promise<string[]> {
    // This would typically be a separate endpoint, but for now we'll extract from competitions
    const response = await apiService.get<CompetitionResponse[]>(
      `${this.baseEndpoint}/locations`
    );
    return response.data
      .map((comp) => comp.location)
      .filter(Boolean) as string[];
  }

  async arrangeOrder(payload: {
    competitionId: string;
    contentId: string;
    athleteOrders: Array<{ athleteId: string; order: number }>;
  }): Promise<void> {
    await apiService.post(this.arrangeOrderEndpoint, payload);
  }
}

// Create and export singleton instance
const competitionService = new CompetitionService();
export default competitionService;
