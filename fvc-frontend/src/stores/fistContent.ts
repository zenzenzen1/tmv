import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fistContentService } from '../services/fistContent';
import type { CreateFistContentRequest, FistContentFilters, FistContentResponse, UpdateFistContentRequest } from '../types';
import type { PaginationResponse } from '../types/api';
import { globalErrorHandler } from '../utils/errorHandler';

interface State {
  list: PaginationResponse<FistContentResponse> | null;
  filters: FistContentFilters;
  isLoading: boolean;
  error: string | null;
  modalOpen: boolean;
  editing: FistContentResponse | null;
}

interface Actions {
  fetch: (params?: Partial<FistContentFilters>) => Promise<void>;
  openCreate: () => void;
  openEdit: (item: FistContentResponse) => void;
  closeModal: () => void;
  create: (payload: CreateFistContentRequest) => Promise<void>;
  update: (id: string, payload: UpdateFistContentRequest) => Promise<void>;
  setPage: (page: number) => void;
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

    setPage: (page) => set({ filters: { ...get().filters, page } }),
  }))
);


