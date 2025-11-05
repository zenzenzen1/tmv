import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User, AuthResponse, LoginRequest, FvcRegisterRequest, FvcRegisterResponse } from "../types";
import authService from "../services/authService";
import { globalErrorHandler } from "../utils/errorHandler";

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthActions {
  // Authentication actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: FvcRegisterRequest) => Promise<FvcRegisterResponse>;
  logout: () => void;

  // State management
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Combined auth store type
type AuthStore = AuthState & AuthActions;

// Initial state - try to restore from localStorage
const getInitialState = (): AuthState => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("auth-state");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          user: parsed.user,
          isAuthenticated: parsed.isAuthenticated || false,
          isLoading: false,
          error: null,
        };
      }
    } catch (error) {
      console.warn("Failed to restore auth state:", error);
    }
  }
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

// Helper function to save auth state to localStorage
const saveAuthState = (state: AuthState) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "auth-state",
        JSON.stringify({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        })
      );
    } catch (error) {
      console.warn("Failed to save auth state:", error);
    }
  }
};

// Auth store with localStorage persistence
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Login action
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          const data = await authService.login(credentials);

          const newState = {
            user: data, // backend returns LoginResponse as data payload
            isAuthenticated: true,
            isLoading: false,
            error: null,
          };
          set(newState);
          saveAuthState(newState);
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
      register: async (userData: FvcRegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          const data = await authService.register(userData);

          set({
            isLoading: false,
            error: null,
          });

          return data;
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
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Reset state
          const newState: AuthState = {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          };
          set(newState);
          saveAuthState(newState);
        }
      },

      // State setters
      setUser: (user: User | null) => set({ user }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: "auth-store",
    }
  )
);

// Hydrate user on app start using /auth/me (only if not already authenticated)
if (typeof window !== "undefined") {
  (async () => {
    const currentState = useAuthStore.getState();
    // Only check /auth/me if we don't have auth state in localStorage
    if (!currentState.isAuthenticated) {
      try {
        useAuthStore.getState().setLoading(true);
        const data = await authService.getCurrentUser();
        const newState = {
          user: data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        };
        useAuthStore.setState(newState);
        saveAuthState(newState);
      } catch {
        // not logged in; ignore
        useAuthStore.getState().setLoading(false);
      }
    }
  })();
}

// Simple selectors
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  return { user, isAuthenticated, isLoading, error };
};

export const useAuthActions = () => {
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);

  return { login, register, logout, clearError };
};

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

export const useIsAdmin = () =>
  useAuthStore((state) => state.user?.systemRole === "ADMIN");

export const useIsAssessor = () => {
  const user = useAuthStore((state) => state.user);
  // Only TEACHER role can access assessor dashboard
  return user && user.systemRole === "TEACHER";
};
