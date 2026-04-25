'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRole, Role } from '@/hooks/useRole';

// 1. Actualiza la interfaz para que coincida con el hook
interface RoleContextType {
  currentRole: Role | null;
  // hasPermission ahora recibe dos strings, no un objeto
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (role: Role) => boolean;
  canAccessPage: (page: string) => boolean;
  isLoading: boolean;
  roleName: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  // 2. Desestructura correctamente lo que devuelve el hook
  const { 
    currentRole, 
    hasPermission, 
    hasRole, 
    isLoading, 
    roleName 
  } = useRole();

  const canAccessPage = (page: string): boolean => {
    if (!currentRole) return false;

    const rolePageAccess: Record<Role, string[]> = {
      superadmin: ['*'],
      gerente: [
        '/manager', '/manager/financial', '/manager/riders', 
        '/manager/reports', '/manager/settings', '/orders',
      ],
      operador: [
        '/operator', '/operator/orders', '/operator/deliveries', 
        '/operator/shifts', '/operator/alerts', '/operator/live-map',
      ],
      repartidor: [
        '/rider', '/rider/my-orders', '/rider/productivity', 
        '/rider/earnings', '/rider/profile', '/rider/start-delivery', 
        '/rider/finish-delivery',
      ],
    };

    // 3. Cast seguro para evitar errores de índice
    const allowedPages = rolePageAccess[currentRole as Role];
    
    if (!allowedPages) return false;
    if (allowedPages.includes('*')) return true;

    return allowedPages.some(allowedPage => page.startsWith(allowedPage));
  };

  const value: RoleContextType = {
    currentRole,
    hasPermission,
    hasRole,
    canAccessPage,
    isLoading,
    roleName,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleContext() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRoleContext must be used within a RoleProvider');
  }
  return context;
}

export default RoleProvider;