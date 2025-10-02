import apiService from './api';
import { API_ENDPOINTS } from '../config/endpoints';
import type { PaginationResponse } from '../types/api';
import type { CreateFistContentRequest, FistContentFilters, FistContentResponse, UpdateFistContentRequest } from '../types';

export const fistContentService = {
  async list(params: FistContentFilters = {}): Promise<PaginationResponse<FistContentResponse>> {
    const res = await apiService.get<PaginationResponse<FistContentResponse>>(API_ENDPOINTS.FIST_CONTENTS.BASE, params);
    return res.data;
  },

  async get(id: string): Promise<FistContentResponse> {
    const res = await apiService.get<FistContentResponse>(API_ENDPOINTS.FIST_CONTENTS.BY_ID(id));
    return res.data;
  },

  async create(payload: CreateFistContentRequest): Promise<FistContentResponse> {
    const res = await apiService.post<FistContentResponse>(API_ENDPOINTS.FIST_CONTENTS.BASE, payload);
    return res.data;
  },

  async update(id: string, payload: UpdateFistContentRequest): Promise<FistContentResponse> {
    const res = await apiService.put<FistContentResponse>(API_ENDPOINTS.FIST_CONTENTS.BY_ID(id), payload);
    return res.data;
  },
};


