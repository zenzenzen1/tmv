import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { musicContentService } from '../services/musicContent';
import type { MusicContentCreateRequest, MusicContentFilters, MusicContentResponse, MusicContentUpdateRequest } from '../types';
import type { PaginationResponse } from '../types/api';
import { globalErrorHandler } from '../utils/errorHandler';

interface State {
  list: PaginationResponse<MusicContentResponse> | null;
  filters: MusicContentFilters;
  isLoading: boolean;
  error: string | null;
  modalOpen: boolean;
  editing: MusicContentResponse | null;
}

interface Actions {
  fetch: (params?: Partial<MusicContentFilters>) => Promise<void>;
  openCreate: () => void;
  openEdit: (item: MusicContentResponse) => void;
  closeModal: () => void;
  create: (payload: MusicContentCreateRequest) => Promise<void>;
  update: (id: string, payload: MusicContentUpdateRequest) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setPage: (page: number) => void;
}

type Store = State & Actions;

const initialFilters: MusicContentFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,desc',
};

export const useMusicContentStore = create<Store>()(
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
        const data = await musicContentService.list(current);
        // debugger;
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
        await musicContentService.create(payload);
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
        await musicContentService.update(id, payload);
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
        await musicContentService.remove(id);
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


