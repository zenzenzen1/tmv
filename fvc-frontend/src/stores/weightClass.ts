import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { weightClassService } from '../services/weightClass';
import type { WeightClassFilters, WeightClassResponse, CreateWeightClassRequest, UpdateWeightClassRequest, WeightClassStatus } from '../types';
import type { PaginationResponse } from '../types/api';
import { globalErrorHandler } from '../utils/errorHandler';

interface WeightClassState {
  list: PaginationResponse<WeightClassResponse> | null;
  filters: WeightClassFilters;
  isLoading: boolean;
  error: string | null;
  modalOpen: boolean;
  editing: WeightClassResponse | null;
}

interface WeightClassActions {
  fetch: (params?: Partial<WeightClassFilters>) => Promise<void>;
  openCreate: () => void;
  openEdit: (item: WeightClassResponse) => void;
  closeModal: () => void;
  create: (payload: CreateWeightClassRequest) => Promise<void>;
  update: (id: string, payload: UpdateWeightClassRequest) => Promise<void>;
  changeStatus: (id: string, status: WeightClassStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setPage: (page: number) => void;
}

type Store = WeightClassState & WeightClassActions;

const initialFilters: WeightClassFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,desc',
};

export const useWeightClassStore = create<Store>()(
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
        const data = await weightClassService.list(current);
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
        await weightClassService.create(payload);
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
        await weightClassService.update(id, payload);
        set({ modalOpen: false, editing: null });
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    changeStatus: async (id, status) => {
      try {
        await weightClassService.changeStatus(id, status);
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message });
        throw err;
      }
    },

    remove: async (id) => {
      try {
        await weightClassService.remove(id);
        await get().fetch();
      } catch (err) {
        const { message } = globalErrorHandler(err);
        set({ error: message });
        throw err;
      }
    },

    setPage: (page) => set({ filters: { ...get().filters, page } }),
  }))
);


