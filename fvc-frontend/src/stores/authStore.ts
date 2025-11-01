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

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth store without persist to avoid hydration issues
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Login action
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          const data = await authService.login(credentials);

          set({
            user: data, // backend returns LoginResponse as data payload
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
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
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

// Hydrate user on app start using /auth/me
if (typeof window !== "undefined") {
  (async () => {
    try {
      const data = await authService.getCurrentUser();
      useAuthStore.getState().setUser(data);
      useAuthStore.setState({ isAuthenticated: true });
    } catch {
      // not logged in; ignore
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
