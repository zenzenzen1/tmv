import apiClient from "../config/axios";
import type { BaseResponse, PaginationResponse, RequestParams } from "../types/api";
import type {
  TeamMemberDto,
  TeamMemberAddRequest,
  TeamMemberBulkAddRequest,
  TeamMemberRemoveRequest,
} from "../types/teammember";

const teamsPath = "/v1/teams";

export const teamMemberService = {
  listByTeam: async (
    teamId: string,
    params: RequestParams & { activeOnly?: boolean }
  ) => {
    const res = await apiClient.get<BaseResponse<PaginationResponse<TeamMemberDto>>>(
      `${teamsPath}/${teamId}/members`,
      { params }
    );
    return res.data.data;
  },

  add: async (teamId: string, data: TeamMemberAddRequest) => {
    const res = await apiClient.post<BaseResponse<TeamMemberDto>>(
      `${teamsPath}/${teamId}/members`,
      data
    );
    return res.data.data;
  },

  remove: async (teamId: string, userId: string, data?: TeamMemberRemoveRequest) => {
    const res = await apiClient.delete<BaseResponse<TeamMemberDto>>(
      `${teamsPath}/${teamId}/members/${userId}`,
      { data }
    );
    return res.data.data;
  },

  bulkAdd: async (teamId: string, data: TeamMemberBulkAddRequest, params?: RequestParams) => {
    const res = await apiClient.post<BaseResponse<PaginationResponse<TeamMemberDto>>>(
      `${teamsPath}/${teamId}/members/bulk`,
      data,
      { params }
    );
    return res.data.data;
  },

  reAdd: async (teamId: string, userId: string) => {
    const res = await apiClient.post<BaseResponse<TeamMemberDto>>(
      `${teamsPath}/${teamId}/members/${userId}/readd`
    );
    return res.data.data;
  },
};


