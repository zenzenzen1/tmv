import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { RequestParams, BaseResponse, PaginationResponse } from "../types/api";
import type { LocationDto, LocationCreateRequest, LocationUpdateRequest } from "../types/location";

export const locationService = {
  async list(params?: RequestParams & { isActive?: boolean; search?: string }): Promise<BaseResponse<PaginationResponse<LocationDto>>> {
    return apiService.get<PaginationResponse<LocationDto>>(API_ENDPOINTS.LOCATIONS.BASE, params);
  },

  async getById(id: string): Promise<BaseResponse<LocationDto>> {
    return apiService.get<LocationDto>(API_ENDPOINTS.LOCATIONS.BY_ID(id));
  },

  async create(data: LocationCreateRequest): Promise<BaseResponse<LocationDto>> {
    return apiService.post<BaseResponse<LocationDto>>(API_ENDPOINTS.LOCATIONS.BASE, data);
  },

  async update(id: string, data: LocationUpdateRequest): Promise<BaseResponse<LocationDto>> {
    return apiService.put<LocationDto>(API_ENDPOINTS.LOCATIONS.BY_ID(id), data);
  },

  async deactivate(id: string): Promise<BaseResponse<LocationDto>> {
    return apiService.patch<LocationDto>(API_ENDPOINTS.LOCATIONS.DEACTIVATE(id), {});
  },

  async remove(id: string): Promise<BaseResponse<void>> {
    return apiService.delete<void>(API_ENDPOINTS.LOCATIONS.BY_ID(id));
  },
};


