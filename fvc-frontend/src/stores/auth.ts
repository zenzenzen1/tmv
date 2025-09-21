import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import apiService from '../services/api';
import { API_ENDPOINTS } from '../config/endpoints';
import { globalErrorHandler } from '../utils/errorHandler';

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthActions {
  // Authentication actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  
  // State management
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Combined auth store type
type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth store
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Login action
        login: async (credentials: LoginRequest) => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await apiService.post<AuthResponse>(
              API_ENDPOINTS.AUTH.LOGIN,
              credentials
            );

            const { user, token, refreshToken } = response.data;
            
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({
              isLoading: false,
              error: message,
            });
            throw error;
          }
        },

        // Register action
        register: async (userData: RegisterRequest) => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await apiService.post<AuthResponse>(
              API_ENDPOINTS.AUTH.REGISTER,
              userData
            );

            const { user, token, refreshToken } = response.data;
            
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({
              isLoading: false,
              error: message,
            });
            throw error;
          }
        },

        // Logout action
        logout: () => {
          // Clear tokens from localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          
          // Reset state
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        },

        // Refresh authentication
        refreshAuth: async () => {
          try {
            const { refreshToken } = get();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await apiService.post<AuthResponse>(
              API_ENDPOINTS.AUTH.REFRESH,
              { refreshToken }
            );

            const { user, token, refreshToken: newRefreshToken } = response.data;
            
            set({
              user,
              token,
              refreshToken: newRefreshToken,
              isAuthenticated: true,
            });
          } catch (error) {
            // If refresh fails, logout user
            get().logout();
            throw error;
          }
        },

        // State setters
        setUser: (user: User | null) => set({ user }),
        setToken: (token: string | null) => set({ token }),
        setLoading: (isLoading: boolean) => set({ isLoading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
        reset: () => set(initialState),
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Failed to rehydrate auth store:', error);
            return;
          }
          if (state) {
            // Update localStorage with current tokens
            if (state.token) {
              localStorage.setItem('authToken', state.token);
            }
            if (state.refreshToken) {
              localStorage.setItem('refreshToken', state.refreshToken);
            }
          }
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Selectors
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  refreshAuth: state.refreshAuth,
  clearError: state.clearError,
}));

// Computed selectors
export const useIsAdmin = () => useAuthStore((state) => 
  state.user?.role === 'ADMIN'
);

export const useIsAuthenticated = () => useAuthStore((state) => 
  state.isAuthenticated
);
