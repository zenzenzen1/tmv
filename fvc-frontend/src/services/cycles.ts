import apiClient from "../config/axios";
import type { BaseResponse, PaginationResponse, RequestParams } from "../types/api";
import type {
  ChallengeCycleDto,
  ChallengeCycleCreateRequest,
  ChallengeCycleUpdateRequest,
  ChallengeCycleBulkCreateRequest,
  ChallengeCycleStatus,
} from "../types/cycle";

const basePath = "/v1/cycles";

export const cycleService = {
  list: async (params: RequestParams & { status?: ChallengeCycleStatus; search?: string }) => {
    const res = await apiClient.get<BaseResponse<PaginationResponse<ChallengeCycleDto>>>(
      basePath,
      { params }
    );
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<BaseResponse<ChallengeCycleDto>>(`${basePath}/${id}`);
    return res.data.data;
  },

  create: async (data: ChallengeCycleCreateRequest) => {
    const res = await apiClient.post<BaseResponse<ChallengeCycleDto>>(basePath, data);
    return res.data.data;
  },

  createBulk: async (data: ChallengeCycleBulkCreateRequest) => {
    const res = await apiClient.post<BaseResponse<ChallengeCycleDto>>(`${basePath}/bulk`, data);
    return res.data.data;
  },

  update: async (id: string, data: ChallengeCycleUpdateRequest) => {
    const res = await apiClient.put<BaseResponse<ChallengeCycleDto>>(`${basePath}/${id}`, data);
    return res.data.data;
  },

  activate: async (id: string) => {
    const res = await apiClient.post<BaseResponse<ChallengeCycleDto>>(`${basePath}/${id}/activate`);
    return res.data.data;
  },

  complete: async (id: string) => {
    const res = await apiClient.post<BaseResponse<ChallengeCycleDto>>(`${basePath}/${id}/complete`);
    return res.data.data;
  },

  archive: async (id: string) => {
    const res = await apiClient.post<BaseResponse<ChallengeCycleDto>>(`${basePath}/${id}/archive`);
    return res.data.data;
  },
};


