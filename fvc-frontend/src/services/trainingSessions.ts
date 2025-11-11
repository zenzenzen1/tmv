import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { RequestParams, BaseResponse, PaginationResponse } from "../types/api";
import type {
  TrainingSessionDto,
  TrainingSessionListDto,
  TrainingSessionCreateRequest,
  TrainingSessionUpdateRequest,
  TrainingSessionCalendarParams,
} from "../types/training";

export const trainingSessionService = {
  async list(params?: RequestParams & {
    cycleId?: string;
    teamId?: string;
    phaseId?: string;
    locationId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BaseResponse<PaginationResponse<TrainingSessionListDto>>> {
    return apiService.get<PaginationResponse<TrainingSessionListDto>>(API_ENDPOINTS.TRAINING_SESSIONS.BASE, params);
  },

  async calendar(params: TrainingSessionCalendarParams): Promise<BaseResponse<PaginationResponse<TrainingSessionListDto>>> {
    return apiService.get<PaginationResponse<TrainingSessionListDto>>(API_ENDPOINTS.TRAINING_SESSIONS.CALENDAR, params);
  },

  async getById(id: string): Promise<BaseResponse<TrainingSessionDto>> {
    return apiService.get<TrainingSessionDto>(API_ENDPOINTS.TRAINING_SESSIONS.BY_ID(id));
  },

  async create(data: TrainingSessionCreateRequest): Promise<BaseResponse<TrainingSessionDto>> {
    return apiService.post<BaseResponse<TrainingSessionDto>>(API_ENDPOINTS.TRAINING_SESSIONS.BASE, data);
  },

  async update(id: string, data: TrainingSessionUpdateRequest): Promise<BaseResponse<TrainingSessionDto>> {
    return apiService.put<TrainingSessionDto>(API_ENDPOINTS.TRAINING_SESSIONS.BY_ID(id), data);
  },

  async updateStatus(id: string, status: string): Promise<BaseResponse<TrainingSessionDto>> {
    return apiService.patch<TrainingSessionDto>(API_ENDPOINTS.TRAINING_SESSIONS.STATUS(id), { status });
  },

  async remove(id: string): Promise<BaseResponse<void>> {
    return apiService.delete<void>(API_ENDPOINTS.TRAINING_SESSIONS.BY_ID(id));
  },
};


