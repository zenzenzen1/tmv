import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { locationService } from "@/services/locations";
import type {
  LocationCreateRequest,
  LocationDto,
  LocationFilters,
  LocationUpdateRequest,
} from "@/types/location";
import type { PaginationResponse } from "@/types/api";
import { globalErrorHandler } from "@/utils/errorHandler";

interface LocationState {
  list: PaginationResponse<LocationDto> | null;
  filters: LocationFilters;
  isLoading: boolean;
  error: string | null;
  modalOpen: boolean;
  editing: LocationDto | null;
}

interface LocationActions {
  fetch: (params?: Partial<LocationFilters>) => Promise<void>;
  openCreate: () => void;
  openEdit: (item: LocationDto) => void;
  closeModal: () => void;
  create: (payload: LocationCreateRequest) => Promise<void>;
  update: (id: string, payload: LocationUpdateRequest) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setPage: (page: number) => void;
}

type Store = LocationState & LocationActions;

const initialFilters: LocationFilters = {
  page: 0,
  size: 10,
  search: undefined,
  isActive: undefined,
};

export const useLocationStore = create<Store>()(
  devtools((set, get) => ({
    list: null,
    filters: initialFilters,
    isLoading: false,
    error: null,
    modalOpen: false,
    editing: null,

    fetch: async (params) => {
      const current = { ...get().filters, ...(params || {}) };
      set({ isLoading: true, error: null, filters: current });
      try {
        const response = await locationService.list(current);
        set({
          list: response.data,
          isLoading: false,
        });
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, isLoading: false });
      }
    },

    openCreate: () => set({ modalOpen: true, editing: null }),
    openEdit: (item) => set({ modalOpen: true, editing: item }),
    closeModal: () => set({ modalOpen: false, editing: null }),

    create: async (payload) => {
      set({ isLoading: true, error: null });
      try {
        await locationService.create(payload);
        set({ modalOpen: false });
        await get().fetch({ page: 0 });
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    update: async (id, payload) => {
      set({ isLoading: true, error: null });
      try {
        await locationService.update(id, payload);
        set({ modalOpen: false, editing: null });
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    deactivate: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await locationService.deactivate(id);
        set({ modalOpen: false, editing: null });
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    remove: async (id) => {
      try {
        await locationService.remove(id);
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message });
        throw err;
      }
    },

    setPage: (page) => {
      set({ filters: { ...get().filters, page } });
    },
  }))
);


