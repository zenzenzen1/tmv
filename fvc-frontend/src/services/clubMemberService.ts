import api from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { PaginationResponse } from "../types/api";

export type ClubMember = {
  id: string;
  fullName: string;
  email: string;
  gender: string;
  studentCode: string;
  phone: string;
  department: string | null;
  status: string;
  joinedAt?: string | null;
};

export type ClubMemberFilters = {
  page?: number;
  size?: number;
  name?: string;
  gender?: string;
  status?: string;
};

class ClubMemberService {
  async list(
    filters: ClubMemberFilters = {}
  ): Promise<PaginationResponse<ClubMember>> {
    const params = new URLSearchParams();
    const page = (filters.page ?? 1) - 1;
    const size = filters.size ?? 10;
    params.set("page", String(page));
    params.set("size", String(size));
    if (filters.name) params.set("name", filters.name);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.status) params.set("status", filters.status);

    const res = await api.get<PaginationResponse<ClubMember>>(
      `${API_ENDPOINTS.CLUB_MEMBERS.BASE}?${params.toString()}`
    );

    const rootAny = res.data as unknown as Record<string, unknown>;
    const outer = (rootAny?.data as Record<string, unknown>) ?? rootAny;
    const inner =
      (outer?.data as PaginationResponse<ClubMember>) ||
      (outer as unknown as PaginationResponse<ClubMember>);

    return inner;
  }
}

const clubMemberService = new ClubMemberService();
export default clubMemberService;


