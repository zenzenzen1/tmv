import apiService from "../services/api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { BaseResponse, PaginationResponse } from "../types/api";

export type AthleteResponse = {
  id: string;
  name: string;
  email: string;
  gender: "Nam" | "Nữ";
  content: string;
  studentId: string;
  club: string;
  tournament: string;
  status: "ĐÃ ĐẦU" | "HOÀN ĐẦU" | "VI PHẠM" | "CHỜ ĐẦU" | "ĐANG ĐẦU" | "-";
  submittedAt: string;
};

export type AthleteFilters = {
  page?: number;
  size?: number;
  search?: string;
  tournament?: string;
  competitionType?: "fighting" | "quyen" | "music";
  gender?: "Nam" | "Nữ";
  club?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

class AthleteService {
  private readonly baseEndpoint = "/v1/athletes";

  // Get all athletes with filters and pagination
  async getAthletes(
    filters: AthleteFilters = {}
  ): Promise<PaginationResponse<AthleteResponse>> {
    console.log("AthleteService - calling API with filters:", filters);
    const response = await apiService.get<PaginationResponse<AthleteResponse>>(
      this.baseEndpoint,
      filters
    );

    if (!response.data) {
      console.error("AthleteService - response.data is undefined!");
      throw new Error("Invalid API response structure");
    }

    return response.data;
  }

  // Get athlete by ID
  async getAthleteById(id: string): Promise<AthleteResponse> {
    const response = await apiService.get<BaseResponse<AthleteResponse>>(
      `${this.baseEndpoint}/${id}`
    );
    return response.data.data;
  }

  // Update athlete status
  async updateAthleteStatus(id: string, status: string): Promise<void> {
    await apiService.patch<void>(`${this.baseEndpoint}/${id}/status`, {
      status,
    });
  }

  // Export athletes to Excel
  async exportAthletes(filters: AthleteFilters = {}): Promise<Blob> {
    const response = await apiService.get<Blob>(
      `${this.baseEndpoint}/export`,
      filters,
      { responseType: "blob" }
    );
    return response.data;
  }

  // Get tournaments list for dropdown
  async getTournaments(): Promise<Array<{ id: string; name: string }>> {
    const response = await apiService.get<Array<{ id: string; name: string }>>(
      "/v1/tournaments"
    );
    return response.data;
  }

  // Get clubs list for filter
  async getClubs(): Promise<Array<{ id: string; name: string }>> {
    const response = await apiService.get<Array<{ id: string; name: string }>>(
      "/v1/clubs"
    );
    return response.data;
  }
}

// Create and export singleton instance
const athleteService = new AthleteService();
export default athleteService;
