/**
 * Auth Store - Zustand store para gestión de autenticación
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

      // Login
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials.email, credentials.password);
          
          // Construir usuario desde la respuesta plana del backend
          const user: User = {
            id: response.user_id,
            email: credentials.email,
            full_name: response.full_name,
            role: response.role as User['role'],
          };
          localStorage.setItem('user', JSON.stringify(user));
          
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

      // Logout
      logout: async () => {
        set({ isLoading: true });
        try {
          authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          // Limpiar localStorage
          localStorage.removeItem('user');
        }
      },

      // Registro de repartidor
      registerRider: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.registerRider(data);
          
          // Construir usuario desde la respuesta plana del backend
          const user: User = {
            id: response.user_id,
            email: data.email,
            full_name: data.full_name,
            role: response.role as User['role'],
          };
          localStorage.setItem('user', JSON.stringify(user));
          
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
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authApi.me();
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          clearStoredTokens();
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Actualizar usuario
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
