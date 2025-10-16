import apiService from './api';
import { API_ENDPOINTS } from '../config/endpoints';
import type { BaseResponse, PaginationResponse } from '../types/api';
import type { CreateFistContentRequest, FistContentFilters, FistContentResponse, UpdateFistContentRequest, FistItemResponse, FistTypeResponse, CreateFistTypeRequest, UpdateFistTypeRequest, CreateFistItemRequest, UpdateFistItemRequest } from '../types';

export const fistContentService = {
  async list(params: FistContentFilters = {}): Promise<PaginationResponse<FistContentResponse>> {
    const res = await apiService.get<PaginationResponse<FistContentResponse>>(API_ENDPOINTS.FIST_CONTENTS.BASE, params);
    
    if (!res.data) {
      console.error('FistContentService - response.data is undefined!');
      throw new Error('Invalid API response structure');
    }
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
    const res = await apiService.get<PaginationResponse<FistItemResponse>>(API_ENDPOINTS.FIST_CONTENTS.ITEMS, params);
    return res.data;
  },

  async getItem(id: string): Promise<FistItemResponse> {
    const res = await apiService.get<BaseResponse<FistItemResponse>>(API_ENDPOINTS.FIST_CONTENTS.ITEM_BY_ID(id));
    return res.data.data;
  },

  async getItemsByConfig(configId: string): Promise<PaginationResponse<FistItemResponse>> {
    const res = await apiService.get<BaseResponse<PaginationResponse<FistItemResponse>>>(API_ENDPOINTS.FIST_CONTENTS.ITEMS_BY_CONFIG(configId));
    return res.data.data;
  },
  async createItem(configId: string, payload: CreateFistItemRequest): Promise<FistItemResponse> {
    const url = `${API_ENDPOINTS.FIST_CONTENTS.BY_ID(configId)}/items`;
    const res = await apiService.post<BaseResponse<FistItemResponse>>(url, payload);
    return res.data.data;
  },
  async updateItem(configId: string, itemId: string, payload: UpdateFistItemRequest): Promise<FistItemResponse> {
    const url = `${API_ENDPOINTS.FIST_CONTENTS.BY_ID(configId)}/items/${itemId}`;
    const res = await apiService.put<BaseResponse<FistItemResponse>>(url, payload);
    return res.data.data;
  },
  async deleteItem(configId: string, itemId: string): Promise<void> {
    const url = `${API_ENDPOINTS.FIST_CONTENTS.BY_ID(configId)}/items/${itemId}`;
    await apiService.delete<void>(url);
  },
};

// Fist Types (dynamic)
export const fistTypeService = {
  async list(params: { page?: number; size?: number } = {}): Promise<PaginationResponse<FistTypeResponse>> {
    const res = await apiService.get<PaginationResponse<FistTypeResponse>>(API_ENDPOINTS.FIST_CONTENTS.TYPES.BASE, params);
    return res.data;
  },
  async create(payload: CreateFistTypeRequest): Promise<FistTypeResponse> {
    const res = await apiService.post<BaseResponse<FistTypeResponse>>(API_ENDPOINTS.FIST_CONTENTS.TYPES.BASE, payload);
    return res.data.data;
  },
  async update(id: string, payload: UpdateFistTypeRequest): Promise<FistTypeResponse> {
    const res = await apiService.put<BaseResponse<FistTypeResponse>>(API_ENDPOINTS.FIST_CONTENTS.TYPES.BY_ID(id), payload);
    return res.data.data;
  },
  async remove(id: string): Promise<void> {
    await apiService.delete<void>(API_ENDPOINTS.FIST_CONTENTS.TYPES.BY_ID(id));
  },
};


