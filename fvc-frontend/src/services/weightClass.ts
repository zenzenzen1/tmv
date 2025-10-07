import apiService from './api';
import { API_ENDPOINTS } from '../config/endpoints';
import type { BaseResponse, PaginationResponse } from '../types/api';
import type { CreateWeightClassRequest, UpdateWeightClassRequest, WeightClassFilters, WeightClassResponse, WeightClassStatus } from '../types';

export const weightClassService = {
  async list(params: WeightClassFilters): Promise<PaginationResponse<WeightClassResponse>> {
    const res = await apiService.get<PaginationResponse<WeightClassResponse>>(API_ENDPOINTS.WEIGHT_CLASSES.BASE, params);
    
    if (!res.data) {
      console.error('WeightClassService - response.data is undefined!');
      throw new Error('Invalid API response structure');
    }
    return res.data;
  },

  async get(id: string): Promise<WeightClassResponse> {
    const res = await apiService.get<BaseResponse<WeightClassResponse>>(API_ENDPOINTS.WEIGHT_CLASSES.BY_ID(id));
    return res.data.data;
  },

  async create(payload: CreateWeightClassRequest): Promise<WeightClassResponse> {
    const res = await apiService.post<BaseResponse<WeightClassResponse>>(API_ENDPOINTS.WEIGHT_CLASSES.BASE, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateWeightClassRequest): Promise<WeightClassResponse> {
    const res = await apiService.put<BaseResponse<WeightClassResponse>>(API_ENDPOINTS.WEIGHT_CLASSES.BY_ID(id), payload);
    return res.data.data;
  },

  async changeStatus(id: string, status: WeightClassStatus): Promise<void> {
    await apiService.patch<void>(`${API_ENDPOINTS.WEIGHT_CLASSES.STATUS(id)}?status=${status}`);
  },

  async remove(id: string): Promise<void> {
    await apiService.delete<void>(API_ENDPOINTS.WEIGHT_CLASSES.BY_ID(id));
  },
};


