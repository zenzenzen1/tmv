import apiService from './api';
import { API_ENDPOINTS } from '../config/endpoints';
import type { BaseResponse, PaginationResponse } from '../types/api';
import type { CreateFistContentRequest, FistContentFilters, FistContentResponse, UpdateFistContentRequest, FistItemResponse } from '../types';

export const fistContentService = {
  async list(params: FistContentFilters = {}): Promise<PaginationResponse<FistContentResponse>> {
    const res = await apiService.get<PaginationResponse<FistContentResponse>>(API_ENDPOINTS.FIST_CONTENTS.BASE, params);
    
    if (!res.data) {
      console.error('FistContentService - response.data is undefined!');
      throw new Error('Invalid API response structure');
    }
    console.log('FistContentService - returning:', res.data);
    return res.data;
  },

  async get(id: string): Promise<FistContentResponse> {
    const res = await apiService.get<BaseResponse<FistContentResponse>>(API_ENDPOINTS.FIST_CONTENTS.BY_ID(id));
    return res.data.data;
  },

  async create(payload: CreateFistContentRequest): Promise<FistContentResponse> {
    const res = await apiService.post<BaseResponse<FistContentResponse>>(API_ENDPOINTS.FIST_CONTENTS.BASE, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateFistContentRequest): Promise<FistContentResponse> {
    const res = await apiService.put<BaseResponse<FistContentResponse>>(API_ENDPOINTS.FIST_CONTENTS.BY_ID(id), payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete<void>(API_ENDPOINTS.FIST_CONTENTS.BY_ID(id));
  },

  // FistItem methods
  async listItems(params: FistContentFilters = {}): Promise<PaginationResponse<FistItemResponse>> {
    const res = await apiService.get<BaseResponse<PaginationResponse<FistItemResponse>>>(API_ENDPOINTS.FIST_CONTENTS.ITEMS, params);
    return res.data.data;
  },

  async getItem(id: string): Promise<FistItemResponse> {
    const res = await apiService.get<BaseResponse<FistItemResponse>>(API_ENDPOINTS.FIST_CONTENTS.ITEM_BY_ID(id));
    return res.data.data;
  },

  async getItemsByConfig(configId: string): Promise<PaginationResponse<FistItemResponse>> {
    const res = await apiService.get<BaseResponse<PaginationResponse<FistItemResponse>>>(API_ENDPOINTS.FIST_CONTENTS.ITEMS_BY_CONFIG(configId));
    return res.data.data;
  },
};


