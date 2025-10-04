import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import type {
  CompetitionResponse,
  CreateCompetitionRequest,
  UpdateCompetitionRequest,
  CompetitionFilters,
  TournamentStatus,
} from '../types';
import competitionService from '../services/competition';
import { globalErrorHandler } from '../utils/errorHandler';

// Store state interface
interface CompetitionState {
  // Data
  competitions: CompetitionResponse[];
  currentCompetition: CompetitionResponse | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error state
  error: string | null;
  
  // Filters
  filters: CompetitionFilters;
  
  // Available options for filters
  availableYears: number[];
  availableLocations: string[];
}

// Store actions interface
interface CompetitionActions {
  // Data fetching
  fetchCompetitions: (filters?: CompetitionFilters) => Promise<void>;
  fetchCompetitionById: (id: string) => Promise<void>;
  fetchAvailableYears: () => Promise<void>;
  fetchAvailableLocations: () => Promise<void>;
  
  // CRUD operations
  createCompetition: (data: CreateCompetitionRequest) => Promise<CompetitionResponse | null>;
  updateCompetition: (id: string, data: UpdateCompetitionRequest) => Promise<CompetitionResponse | null>;
  deleteCompetition: (id: string) => Promise<boolean>;
  changeStatus: (id: string, status: TournamentStatus) => Promise<CompetitionResponse | null>;
  
  // State management
  setFilters: (filters: CompetitionFilters) => void;
  setCurrentCompetition: (competition: CompetitionResponse | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Combined store type
type CompetitionStore = CompetitionState & CompetitionActions;

// Initial state
const initialState: CompetitionState = {
  competitions: [],
  currentCompetition: null,
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  filters: {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  },
  availableYears: [],
  availableLocations: [],
};

// Create the store
export const useCompetitionStore = create<CompetitionStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Fetch competitions with filters
        fetchCompetitions: async (filters?: CompetitionFilters) => {
          try {
            set({ loading: true, error: null });
            
            const currentFilters = { ...get().filters, ...filters };
            const response = await competitionService.getCompetitions(currentFilters);
            console.log('CompetitionStore - received response:', response);
            console.log('CompetitionStore - response.content:', response.content);
            
            set({
              competitions: response.content || [],
              pagination: {
                page: response.page || 0,
                size: response.size || 10,
                totalElements: response.totalElements || 0,
                totalPages: response.totalPages || 0,
                hasNext: response.last === false,
                hasPrevious: response.first === false,
              },
              filters: currentFilters,
              loading: false,
            });
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({ error: message, loading: false });
          }
        },

        // Fetch competition by ID
        fetchCompetitionById: async (id: string) => {
          try {
            set({ loading: true, error: null });
            const competition = await competitionService.getCompetitionById(id);
            set({ currentCompetition: competition, loading: false });
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({ error: message, loading: false });
          }
        },

        // Fetch available years
        fetchAvailableYears: async () => {
          try {
            const years = await competitionService.getAvailableYears();
            set({ availableYears: years });
          } catch (error) {
            // Don't set error for this, just log it
            console.warn('Failed to fetch available years:', error);
          }
        },

        // Fetch available locations
        fetchAvailableLocations: async () => {
          try {
            const locations = await competitionService.getAvailableLocations();
            set({ availableLocations: locations });
          } catch (error) {
            // Don't set error for this, just log it
            console.warn('Failed to fetch available locations:', error);
          }
        },

        // Create competition
        createCompetition: async (data: CreateCompetitionRequest) => {
          try {
            set({ creating: true, error: null });
            const newCompetition = await competitionService.createCompetition(data);
            
            // Refresh the competitions list
            await get().fetchCompetitions();
            
            set({ creating: false });
            return newCompetition;
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({ error: message, creating: false });
            return null;
          }
        },

        // Update competition
        updateCompetition: async (id: string, data: UpdateCompetitionRequest) => {
          try {
            set({ updating: true, error: null });
            const updatedCompetition = await competitionService.updateCompetition(id, data);
            
            // Update the competitions list
            const competitions = get().competitions.map(comp => 
              comp.id === id ? updatedCompetition : comp
            );
            
            set({ 
              competitions,
              currentCompetition: updatedCompetition,
              updating: false 
            });
            
            return updatedCompetition;
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({ error: message, updating: false });
            return null;
          }
        },

        // Delete competition
        deleteCompetition: async (id: string) => {
          try {
            set({ deleting: true, error: null });
            await competitionService.deleteCompetition(id);
            
            // Remove from competitions list
            const competitions = get().competitions.filter(comp => comp.id !== id);
            set({ competitions, deleting: false });
            
            return true;
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({ error: message, deleting: false });
            return false;
          }
        },

        // Change competition status
        changeStatus: async (id: string, status: TournamentStatus) => {
          try {
            set({ updating: true, error: null });
            const updatedCompetition = await competitionService.changeStatus(id, status);
            
            // Update the competitions list
            const competitions = get().competitions.map(comp => 
              comp.id === id ? updatedCompetition : comp
            );
            
            set({ 
              competitions,
              currentCompetition: updatedCompetition,
              updating: false 
            });
            
            return updatedCompetition;
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({ error: message, updating: false });
            return null;
          }
        },

        // Set filters
        setFilters: (filters: CompetitionFilters) => {
          set({ filters: { ...get().filters, ...filters } });
        },

        // Set current competition
        setCurrentCompetition: (competition: CompetitionResponse | null) => {
          set({ currentCompetition: competition });
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Reset store
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'competition-store',
        storage: createJSONStorage(() => localStorage),
        // Only persist certain parts of the state
        partialize: (state) => ({
          filters: state.filters,
          availableYears: state.availableYears,
          availableLocations: state.availableLocations,
        }),
      }
    ),
    { name: 'competition-store' }
  )
);
