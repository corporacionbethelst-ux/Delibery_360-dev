import { create } from 'zustand'; // State management library
import { persist } from 'zustand/middleware'; // Persist state to localStorage
import { authApi, clearStoredTokens } from '../lib/api';

// Tipos locales ya que api.ts no los exporta directamente
interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'gerente' | 'operador' | 'repartidor';
}

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  registerRider: (data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    vehicle_type: string;
    license_plate?: string;
  }) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login con credenciales
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null }); // Set loading state // Set loading state
        try {
          const response = await authApi.login(credentials.email, credentials.password); // Call login API // Call auth login method
          
          // Construir usuario desde la respuesta plana del backend
          const user: User = {
            id: response.user_id,
            email: credentials.email,
            full_name: response.full_name,
            role: response.role as User['role'],
          };
          localStorage.setItem('user', JSON.stringify(user)); // Store user in localStorage // Store in localStorage
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      // Logout y limpieza de sesión
      logout: async () => {
        set({ isLoading: true }); // Set loading state // Set loading state
        try {
          authApi.logout(); // Clear tokens from API layer
        } catch (error) {
          console.error('Logout error:', error); // Log error but continue cleanup // Log error but continue cleanup
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          // Limpiar localStorage
          localStorage.removeItem('user'); // Remove user from storage // Remove from localStorage
        }
      },

      // Registro de repartidor
      registerRider: async (data) => {
        set({ isLoading: true, error: null }); // Set loading state // Set loading state
        try {
          const response = await authApi.registerRider(data); // Call register API // Call auth registerRider method
          
          // Construir usuario desde la respuesta plana del backend
          const user: User = {
            id: response.user_id,
            email: data.email,
            full_name: data.full_name,
            role: response.role as User['role'],
          };
          localStorage.setItem('user', JSON.stringify(user)); // Store user in localStorage // Store in localStorage
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al registrar';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Verificar autenticación al cargar la app
      checkAuth: async () => {
        const token = localStorage.getItem('access_token'); // Get token from storage // Get from localStorage
        
        if (!token) {
          set({ isAuthenticated: false, user: null }); // No token, not authenticated
          return;
        }

        set({ isLoading: true }); // Set loading state // Set loading state
        try {
          const user = await authApi.me(); // Get current user from API // Call auth me method
          localStorage.setItem('user', JSON.stringify(user)); // Store user in localStorage // Store in localStorage
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Auth check failed:', error); // Log authentication error // Log authentication error
          clearStoredTokens(); // Clear invalid tokens
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      },

      // Limpiar error
      clearError: () => set({ error: null }), // Clear error state // Clear error state

      // Actualizar usuario
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user; // Get current user
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData }; // Merge updates
          localStorage.setItem('user', JSON.stringify(updatedUser)); // Save to storage // Store in localStorage
          set({ user: updatedUser }); // Update state
        }
      },
    }),
    {
      name: 'auth-storage', // Storage key name
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
