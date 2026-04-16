
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse
} from 'axios';

// Tipos para los tokens
interface TokenPair {
  access_token: string;
  refresh_token: string;
}

interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

// Configuracion base
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const REFRESH_THRESHOLD = parseInt(process.env.NEXT_PUBLIC_REFRESH_THRESHOLD || '300');

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Estado de autenticacion en memoria
let authTokens: AuthTokens = {
  accessToken: null,
  refreshToken: null,
};

// Flag para evitar multiples refresh simultaneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: Error) => void;
}> = [];

// Procesar la cola de peticiones fallidas
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Obtener tokens desde localStorage
export const getStoredTokens = (): AuthTokens => {
  if (typeof window === 'undefined') return authTokens;

  try {
    const accessToken = localStorage.getItem('access_token'); // Get from localStorage
    const refreshToken = localStorage.getItem('refresh_token'); // Get from localStorage

    authTokens = { accessToken, refreshToken };
    return authTokens;
  } catch (error) {
    console.error('Error reading tokens from localStorage:', error); // Log error for debugging
    return authTokens;
  }
};

// Guardar tokens en localStorage
export const storeTokens = (tokens: TokenPair): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('access_token', tokens.access_token); // Store in localStorage
    localStorage.setItem('refresh_token', tokens.refresh_token); // Store in localStorage
    authTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  } catch (error) {
    console.error('Error storing tokens to localStorage:', error); // Log error for debugging
  }
};

// Eliminar tokens almacenados
export const clearStoredTokens = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('access_token'); // Remove from localStorage
    localStorage.removeItem('refresh_token'); // Remove from localStorage
    authTokens = { accessToken: null, refreshToken: null };
  } catch (error) {
    console.error('Error clearing tokens from localStorage:', error); // Log error for debugging
  }
};

// Interceptor de request - Agregar token de autorizacion
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Si no hay URL definida, usar la base
    if (!config.url && config.baseURL) {
      config.url = '/';
    }

    // Obtener tokens actualizados
    const tokens = getStoredTokens();

    // Agregar header de autorizacion si existe access token
    if (tokens.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de response - Manejar errores y refresh automatico
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Si el error es 401 y no hemos intentado refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya hay un refresh en curso, encolar la peticion
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = getStoredTokens();

      if (!tokens.refreshToken) {
        // No hay refresh token, redirigir a login
        clearStoredTokens();
        isRefreshing = false;
        processQueue(new Error('No refresh token available'));

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }

      try {
        // Intentar refresh del token
        const response = await axios.post<TokenPair>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: tokens.refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const { access_token, refresh_token } = response.data;

        // Guardar nuevos tokens
        storeTokens({ access_token, refresh_token });

        // Actualizar header de la peticion original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        // Procesar cola de peticiones exitosamente
        processQueue(null, access_token);

        // Reintentar la peticion original
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh fallo, limpiar tokens y redirigir a login
        clearStoredTokens();
        isRefreshing = false;
        processQueue(refreshError as Error);

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Metodos de autenticacion
export const authApi = {
  /**
   * Login con email y password
   */
  login: async (email: string, password: string) => {
    const response = await apiClient.post<TokenPair>('/auth/login', {
      email,
      password,
    });

    if (response.data.access_token && response.data.refresh_token) {
      storeTokens(response.data);
    }

    return response.data;
  },

  /**
   * Registro de repartidor
   */
  registerRider: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    vehicle_type: string;
    license_plate?: string;
  }) => {
    const response = await apiClient.post<TokenPair>('/auth/register-rider', data);

    if (response.data.access_token && response.data.refresh_token) {
      storeTokens(response.data);
    }

    return response.data;
  },

  /**
   * Refresh de token
   */
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<TokenPair>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (response.data.access_token && response.data.refresh_token) {
      storeTokens(response.data);
    }

    return response.data;
  },

  /**
   * Logout - Limpia tokens locales
   */
  logout: () => {
    clearStoredTokens();
  },

  /**
   * Obtener informacion del usuario actual
   */
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// Exportar instancia principal para uso directo
export default apiClient;

// Exportar metodos utilitarios
export {
  API_BASE_URL,
  getStoredTokens,
  storeTokens,
  clearStoredTokens,
};
