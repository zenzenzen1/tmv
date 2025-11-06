import apiService from './api';
import { API_ENDPOINTS } from '../config/endpoints';
import type { BaseResponse, PaginationResponse } from '../types/api';
import type { CreateFieldRequest, UpdateFieldRequest, FieldFilters, FieldResponse } from '../types';

export const fieldService = {
  async list(params: FieldFilters): Promise<PaginationResponse<FieldResponse>> {
    const res = await apiService.get<PaginationResponse<FieldResponse>>(API_ENDPOINTS.FIELDS.BASE, params);
    
    if (!res.data) {
      console.error('FieldService - response.data is undefined!');
      throw new Error('Invalid API response structure');
    }
    return res.data;
  },

  async get(id: string): Promise<FieldResponse> {
    const res = await apiService.get<BaseResponse<FieldResponse>>(API_ENDPOINTS.FIELDS.BY_ID(id));
    return res.data.data;
  },

  async create(payload: CreateFieldRequest): Promise<FieldResponse> {
    const res = await apiService.post<BaseResponse<FieldResponse>>(API_ENDPOINTS.FIELDS.BASE, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateFieldRequest): Promise<FieldResponse> {
    const res = await apiService.put<BaseResponse<FieldResponse>>(API_ENDPOINTS.FIELDS.BY_ID(id), payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete<void>(API_ENDPOINTS.FIELDS.BY_ID(id));
  },
};

