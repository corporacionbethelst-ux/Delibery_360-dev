'use client';

/**
 * AuthContext - Contexto de React para autenticación
 * Proveedor global de estado de autenticación
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'superadmin' | 'gerente' | 'operador' | 'repartidor';
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
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
  hasRole: (roles: Array<'superadmin' | 'gerente' | 'operador' | 'repartidor'>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    registerRider: storeRegisterRider,
    checkAuth: storeCheckAuth,
    clearError: storeClearError,
  } = useAuthStore();

  // Wrapper para login con interfaz simplificada
  const login = async (email: string, password: string) => {
    await storeLogin({ email, password });
  };

  // Verificar si el usuario tiene alguno de los roles especificados
  const hasRole = (roles: Array<'superadmin' | 'gerente' | 'operador' | 'repartidor'>): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Check auth al montar el provider
  useEffect(() => {
    storeCheckAuth();
  }, [storeCheckAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout: storeLogout,
    registerRider: storeRegisterRider,
    checkAuth: storeCheckAuth,
    clearError: storeClearError,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
