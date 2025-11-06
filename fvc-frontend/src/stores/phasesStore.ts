import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ChallengePhaseDto, ChallengePhaseCreateRequest, ChallengePhaseUpdateRequest, PhaseStatus, PhaseOrderUpdate } from "../types/phase";
import type { PaginationResponse, RequestParams } from "../types/api";
import { phaseService } from "../services/phases";

interface PhasesState {
  items: ChallengePhaseDto[];
  page: PaginationResponse<ChallengePhaseDto> | null;
  loading: boolean;
  error: string | null;
}

interface PhasesActions {
  fetchByCycle: (cycleId: string, params?: RequestParams & { status?: PhaseStatus; search?: string }) => Promise<void>;
  create: (cycleId: string, data: ChallengePhaseCreateRequest) => Promise<ChallengePhaseDto>;
  update: (id: string, data: ChallengePhaseUpdateRequest) => Promise<ChallengePhaseDto>;
  reorder: (cycleId: string, order: PhaseOrderUpdate[]) => Promise<void>;
}

export const usePhasesStore = create<PhasesState & PhasesActions>()(
  devtools((set, get) => ({
    items: [],
    page: null,
    loading: false,
    error: null,

    fetchByCycle: async (cycleId, params) => {
      set({ loading: true, error: null });
      try {
        const page = await phaseService.listByCycle(cycleId, params || {});
        set({ page, items: page.content, loading: false });
      } catch (e: any) {
        set({ error: e?.message || "Failed to fetch phases", loading: false });
      }
    },

    create: async (cycleId, data) => {
      const created = await phaseService.create(cycleId, data);
      await get().fetchByCycle(cycleId, { page: 0 });
      return created;
    },

    update: async (id, data) => {
      const updated = await phaseService.update(id, data);
      return updated;
    },

    reorder: async (cycleId, order) => {
      await phaseService.reorder(cycleId, order);
      await get().fetchByCycle(cycleId, { page: 0 });
    },
  }))
);


