import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fieldService } from '../services/fieldService';
import type { FieldFilters, FieldResponse, CreateFieldRequest, UpdateFieldRequest } from '../types';
import type { PaginationResponse } from '../types/api';
import { globalErrorHandler } from '../utils/errorHandler';

interface FieldState {
  list: PaginationResponse<FieldResponse> | null;
  filters: FieldFilters;
  isLoading: boolean;
  error: string | null;
  modalOpen: boolean;
  editing: FieldResponse | null;
}

interface FieldActions {
  fetch: (params?: Partial<FieldFilters>) => Promise<void>;
  openCreate: () => void;
  openEdit: (item: FieldResponse) => void;
  closeModal: () => void;
  create: (payload: CreateFieldRequest) => Promise<void>;
  update: (id: string, payload: UpdateFieldRequest) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setPage: (page: number) => void;
}

type Store = FieldState & FieldActions;

const initialFilters: FieldFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,desc',
};

export const useFieldStore = create<Store>()(
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
        console.log('FieldStore - fetching with params:', current);
        const data = await fieldService.list(current);
        console.log('FieldStore - received data:', data);
        set({ list: data, isLoading: false });
      } catch (err) {
        console.error('FieldStore - fetch error:', err);
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
        await fieldService.create(payload);
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
        await fieldService.update(id, payload);
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
        await fieldService.remove(id);
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

