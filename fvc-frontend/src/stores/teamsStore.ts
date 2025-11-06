import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TeamDto, TeamCreateRequest, TeamUpdateRequest } from "../types/team";
import type { PaginationResponse, RequestParams } from "../types/api";
import { teamService } from "../services/teams";

interface TeamsState {
  items: TeamDto[];
  page: PaginationResponse<TeamDto> | null;
  loading: boolean;
  error: string | null;
}

interface TeamsActions {
  fetchByCycle: (cycleId: string, params?: RequestParams & { search?: string }) => Promise<void>;
  create: (cycleId: string, data: TeamCreateRequest) => Promise<TeamDto>;
  update: (id: string, data: TeamUpdateRequest) => Promise<TeamDto>;
  remove: (id: string) => Promise<void>;
}

export const useTeamsStore = create<TeamsState & TeamsActions>()(
  devtools((set, get) => ({
    items: [],
    page: null,
    loading: false,
    error: null,

    fetchByCycle: async (cycleId, params) => {
      set({ loading: true, error: null });
      try {
        const page = await teamService.listByCycle(cycleId, params || {});
        set({ page, items: page.content, loading: false });
      } catch (e: any) {
        set({ error: e?.message || "Failed to fetch teams", loading: false });
      }
    },

    create: async (cycleId, data) => {
      const created = await teamService.create(cycleId, data);
      await get().fetchByCycle(cycleId, { page: 0 });
      return created;
    },

    update: async (id, data) => {
      const updated = await teamService.update(id, data);
      return updated;
    },

    remove: async (id) => {
      await teamService.delete(id);
    },
  }))
);


