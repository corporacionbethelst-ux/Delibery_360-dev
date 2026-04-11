'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { UserRole, Permission } from '@/types';

interface RoleContextType {
  currentRole: UserRole | null;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  canAccessPage: (page: string) => boolean;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const { currentRole, hasPermission, hasRole, isLoading } = useRole();

  // Define page access rules based on roles
  const canAccessPage = (page: string): boolean => {
    if (!currentRole) return false;

    const rolePageAccess: Record<UserRole, string[]> = {
      admin: ['*'], // Admin can access all pages
      manager: [
        '/manager',
        '/manager/financial',
        '/manager/riders',
        '/manager/reports',
        '/manager/settings',
        '/orders',
      ],
      operator: [
        '/operator',
        '/operator/orders',
        '/operator/deliveries',
        '/operator/shifts',
        '/operator/alerts',
        '/operator/live-map',
      ],
      rider: [
        '/rider',
        '/rider/my-orders',
        '/rider/productivity',
        '/rider/earnings',
        '/rider/profile',
        '/rider/start-delivery',
        '/rider/finish-delivery',
      ],
    };

    const allowedPages = rolePageAccess[currentRole];
    
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
