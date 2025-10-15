import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fistContentService, fistTypeService } from '../services/fistContent';
import type { CreateFistContentRequest, FistContentFilters, FistContentResponse, UpdateFistContentRequest, FistConfigResponse, FistItemResponse, FistTypeResponse } from '../types';
import type { PaginationResponse } from '../types/api';
import { globalErrorHandler } from '../utils/errorHandler';

interface State {
  list: PaginationResponse<FistContentResponse> | null;
  filters: FistContentFilters;
  isLoading: boolean;
  error: string | null;
  modalOpen: boolean;
  editing: FistContentResponse | null;
  
  // Additional data for CompetitionModal
  fistConfigs: FistConfigResponse[];
  fistItems: FistItemResponse[];
  loading: boolean;
  types: FistTypeResponse[];
}

interface Actions {
  fetch: (params?: Partial<FistContentFilters>) => Promise<void>;
  openCreate: () => void;
  openEdit: (item: FistContentResponse) => void;
  closeModal: () => void;
  create: (payload: CreateFistContentRequest) => Promise<void>;
  update: (id: string, payload: UpdateFistContentRequest) => Promise<void>;
  setPage: (page: number) => void;
  remove: (id: string) => Promise<void>;
  // Additional methods for CompetitionModal
  fetchFistConfigs: () => Promise<void>;
  fetchFistItems: () => Promise<void>;
  fetchTypes: () => Promise<void>;
}

type Store = State & Actions;

const initialFilters: FistContentFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,desc',
};

export const useFistContentStore = create<Store>()(
  devtools((set, get) => ({
    list: null,
    filters: initialFilters,
    isLoading: false,
    error: null,
    modalOpen: false,
    editing: null,
    
    // Additional data for CompetitionModal
    fistConfigs: [],
    fistItems: [],
    loading: false,
    types: [],

    fetch: async (params) => {
      const current = { ...get().filters, ...(params || {}) };
      set({ isLoading: true, error: null, filters: current });
      try {
        const data = await fistContentService.list(current);
        set({ list: data, isLoading: false });
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
        await fistContentService.create(payload);
        set({ modalOpen: false });
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    update: async (id, payload) => {
      set({ isLoading: true, error: null });
      try {
        await fistContentService.update(id, payload);
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
        await fistContentService.remove(id);
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message });
        throw err;
      }
    },

    setPage: (page) => set({ filters: { ...get().filters, page } }),

    // Additional methods for CompetitionModal
    fetchFistConfigs: async () => {
      try {
        set({ loading: true, error: null });
        const data = await fistContentService.list({ size: 100 }); // Get all configs
        const configs = data.content as FistConfigResponse[];
        set({ fistConfigs: configs, loading: false });
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, loading: false });
      }
    },

    fetchFistItems: async () => {
      try {
        set({ loading: true, error: null });
        const data = await fistContentService.listItems({ size: 100 }); // Get all items
        set({ fistItems: data.content, loading: false });
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, loading: false });
      }
    },

    fetchTypes: async () => {
      try {
        const data = await fistTypeService.list({ size: 100 });
        set({ types: data.content });
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message });
      }
    },
  }))
);


