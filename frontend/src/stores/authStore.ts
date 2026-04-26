/**
 * Auth Store - Zustand store para gestión de autenticación
 * CORREGIDO: Login envía form-data compatible con FastAPI OAuth2
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api'; // Importamos la instancia base de axios
import { clearStoredTokens, getStoredTokens } from '../lib/api';

// Tipos locales
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPERADMIN' | 'GERENTE' | 'OPERADOR' | 'REPARTIDOR';
}

interface LoginRequest {
  email: string;
  password: string;
}

// Definimos explícitamente lo que esperamos del backend al hacer login
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: string;
  full_name: string;
  email?: string;
}

interface RegisterResponse {
  message: string;
  user_id: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

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
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // --- LOGIN CORREGIDO ---
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          // 1. Preparar datos como formulario (x-www-form-urlencoded)
          const params = new URLSearchParams();
          params.append('username', credentials.email); // FastAPI OAuth2 requiere 'username'
          params.append('password', credentials.password);

          // 2. Enviar petición manual con axios
          const response = await api.post<LoginResponse>('/auth/login', params, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });

          const data = response.data;

          // 3. Construir objeto de usuario
          const user: User = {
            id: data.user_id,
            email: data.email || credentials.email,
            full_name: data.full_name,
            role: data.role as User['role'],
          };

          // 4. Guardar en localStorage y estado
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Login error:', error);
          const errorMessage = error.response?.data?.detail || 'Error al iniciar sesión';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw new Error(errorMessage);
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        try {
          // Llamada opcional al backend para invalidar token si existiera
          // await api.post('/auth/logout'); 
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          clearStoredTokens();
          localStorage.removeItem('user');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Registro de repartidor
      registerRider: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Nota: Asumimos que registerRider acepta JSON según tu schema Pydantic
          const response = await api.post<RegisterResponse>('/register', data);
          
          const user: User = {
            id: response.data.user_id,
            email: data.email,
            full_name: data.full_name,
            role: 'REPARTIDOR',
          };
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Error al registrar';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Verificar autenticación
      checkAuth: async () => {
        const tokens = getStoredTokens();
        
        if (!tokens.accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        // Si hay usuario en localStorage, lo restauramos rápido (optimista)
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr);
            set({ user: storedUser, isAuthenticated: true });
          } catch (e) {
            localStorage.removeItem('user');
          }
        }

        set({ isLoading: true });
        try {
          // Validamos con el backend
          const response = await api.get<{ id: string; email: string; full_name: string; role: string }>('/auth/me');
          const userData = response.data;
          
          const user: User = {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role as User['role'],
          };
          
          localStorage.setItem('user', JSON.stringify(user));
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          clearStoredTokens();
          localStorage.removeItem('user');
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

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