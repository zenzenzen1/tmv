import apiService from './api';
import { API_ENDPOINTS } from '../config/endpoints';
import type { BaseResponse, PaginationResponse } from '../types/api';
import type { MusicContentCreateRequest, MusicContentFilters, MusicContentResponse, MusicContentUpdateRequest } from '../types';

export const musicContentService = {
  async list(params: MusicContentFilters): Promise<PaginationResponse<MusicContentResponse>> {
    const res = await apiService.get<PaginationResponse<MusicContentResponse>>(API_ENDPOINTS.MUSIC_CONTENTS.BASE, params);
    return res.data;
  },

  async get(id: string): Promise<MusicContentResponse> {
    const res = await apiService.get<MusicContentResponse>(API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(id));
    return res.data;
  },

  async create(payload: MusicContentCreateRequest): Promise<MusicContentResponse> {
    const res = await apiService.post<MusicContentResponse>(API_ENDPOINTS.MUSIC_CONTENTS.BASE, payload);
    return res.data;
  },

  async update(id: string, payload: MusicContentUpdateRequest): Promise<MusicContentResponse> {
    const res = await apiService.put<MusicContentResponse>(API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(id), payload);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete<void>(API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(id));
  },
};


