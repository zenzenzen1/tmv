import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ChallengeCycleDto, ChallengeCycleCreateRequest, ChallengeCycleUpdateRequest, ChallengeCycleStatus } from "../types/cycle";
import type { PaginationResponse, RequestParams } from "../types/api";
import { cycleService } from "../services/cycles";

interface CyclesState {
  items: ChallengeCycleDto[];
  page: PaginationResponse<ChallengeCycleDto> | null;
  loading: boolean;
  error: string | null;
}

interface CyclesActions {
  fetch: (params?: RequestParams & { status?: ChallengeCycleStatus; search?: string }) => Promise<void>;
  getById: (id: string) => Promise<ChallengeCycleDto>;
  create: (data: ChallengeCycleCreateRequest) => Promise<ChallengeCycleDto>;
  update: (id: string, data: ChallengeCycleUpdateRequest) => Promise<ChallengeCycleDto>;
  activate: (id: string) => Promise<ChallengeCycleDto>;
  complete: (id: string) => Promise<ChallengeCycleDto>;
  archive: (id: string) => Promise<ChallengeCycleDto>;
}

export const useCyclesStore = create<CyclesState & CyclesActions>()(
  devtools((set, get) => ({
    items: [],
    page: null,
    loading: false,
    error: null,

    fetch: async (params) => {
      set({ loading: true, error: null });
      try {
        const page = await cycleService.list(params || {});
        set({ page, items: page.content, loading: false });
      } catch (e: any) {
        set({ error: e?.message || "Failed to fetch cycles", loading: false });
      }
    },

    getById: async (id) => {
      return await cycleService.getById(id);
    },

    create: async (data) => {
      const created = await cycleService.create(data);
      await get().fetch({ page: 0 });
      return created;
    },

    update: async (id, data) => {
      const updated = await cycleService.update(id, data);
      await get().fetch({ page: 0 });
      return updated;
    },

    activate: async (id) => {
      const updated = await cycleService.activate(id);
      await get().fetch({ page: 0 });
      return updated;
    },

    complete: async (id) => {
      const updated = await cycleService.complete(id);
      await get().fetch({ page: 0 });
      return updated;
    },

    archive: async (id) => {
      const updated = await cycleService.archive(id);
      await get().fetch({ page: 0 });
      return updated;
    },
  }))
);


