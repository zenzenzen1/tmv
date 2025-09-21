// Store state interfaces
export interface StoreState {
  // Common state properties
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Store actions interface
export interface StoreActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Store selector type
export type StoreSelector<T> = (state: any) => T;

// Store middleware type
export type StoreMiddleware = (config: any) => (set: any, get: any, api: any) => any;

// Persist options
export interface PersistOptions {
  name: string;
  storage?: 'localStorage' | 'sessionStorage';
  partialize?: (state: any) => any;
  onRehydrateStorage?: () => (state: any, error: any) => void;
}

// Devtools options
export interface DevtoolsOptions {
  name: string;
  enabled?: boolean;
}

// Store configuration
export interface StoreConfig<T> {
  name: string;
  persist?: PersistOptions;
  devtools?: DevtoolsOptions;
  middleware?: StoreMiddleware[];
}

// Common store patterns
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export interface AsyncActions<T> {
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetch: (...args: any[]) => Promise<void>;
  reset: () => void;
}

// Pagination state
export interface PaginationState {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationActions {
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  reset: () => void;
}

// Filter state
export interface FilterState {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, any>;
}

export interface FilterActions {
  setSearch: (search: string) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  reset: () => void;
}
