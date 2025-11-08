import apiClient from "../config/axios";
import type { BaseResponse, PaginationResponse, RequestParams } from "../types/api";
import type { TeamDto, TeamCreateRequest, TeamUpdateRequest } from "../types/team";

const cyclesPath = "/v1/cycles";
const teamsPath = "/teams"; // For nested paths under cycles
const teamsBasePath = "/v1/teams"; // For direct team operations

export const teamService = {
  listByCycle: async (cycleId: string, params: RequestParams & { search?: string }) => {
    const res = await apiClient.get<BaseResponse<PaginationResponse<TeamDto>>>(
      `${cyclesPath}/${cycleId}${teamsPath}`,
      { params }
    );
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<BaseResponse<TeamDto>>(`${teamsBasePath}/${id}`);
    return res.data.data;
  },

  create: async (cycleId: string, data: TeamCreateRequest) => {
    const res = await apiClient.post<BaseResponse<TeamDto>>(
      `${cyclesPath}/${cycleId}${teamsPath}`,
      data
    );
    return res.data.data;
  },

  update: async (id: string, data: TeamUpdateRequest) => {
    const res = await apiClient.put<BaseResponse<TeamDto>>(`${teamsBasePath}/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete<BaseResponse<void>>(`${teamsBasePath}/${id}`);
    return res.data;
  },
};


