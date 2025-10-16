import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { PaginationResponse, RequestParams } from "../types/api";

export type MemberListItem = {
  id: string;
  fullName: string;
  email: string;
  gender?: string;
  studentCode?: string;
  phone?: string;
  department?: string | null;
  statusLabel?: string;
  joinedAt?: string | null;
};

export type MemberFilters = RequestParams & {
  gender?: string;
  status?: string;
  search?: string;
};

class MemberService {
  private readonly baseEndpoint = API_ENDPOINTS.CLUB_MEMBERS.BASE;

  async getMembers(
    filters: MemberFilters
  ): Promise<PaginationResponse<MemberListItem>> {
    const response = await apiService.get<PaginationResponse<MemberListItem>>(
      this.baseEndpoint,
      filters
    );
    return response.data;
  }
}

const memberService = new MemberService();
export default memberService;


