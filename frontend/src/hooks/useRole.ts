// src/hooks/useRole.ts
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

export type Role = 'SUPERADMIN' | 'GERENTE' | 'OPERADOR' | 'REPARTIDOR';

// Definición simple de permisos para el hook
interface PermissionDef {
  module: string;
  actions: string[];
}

interface RoleConfig {
  name: string;
  description: string;
  permissions: PermissionDef[];
}

const ROLE_CONFIGURATIONS: Record<Role, RoleConfig> = {
  SUPERADMIN: {
    name: 'Superadministrador',
    description: 'Acceso completo al sistema',
    permissions: [
      { module: 'orders', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
      { module: 'deliveries', actions: ['create', 'read', 'update', 'delete', 'assign', 'export'] },
      { module: 'riders', actions: ['create', 'read', 'update', 'delete', 'approve', 'suspend', 'export'] },
      { module: 'financial', actions: ['read', 'export', 'configure', 'approve_payments'] },
      { module: 'reports', actions: ['read', 'export', 'configure'] },
      { module: 'settings', actions: ['read', 'update', 'configure'] },
      { module: 'users', actions: ['create', 'read', 'update', 'delete', 'manage_roles'] },
      { module: 'alerts', actions: ['read', 'create', 'update', 'delete', 'configure'] },
      { module: 'audit', actions: ['read', 'export'] },
    ],
  },
  GERENTE: {
    name: 'Gerente',
    description: 'Gestión general',
    permissions: [
      { module: 'orders', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
      { module: 'deliveries', actions: ['create', 'read', 'update', 'delete', 'assign', 'export'] },
      { module: 'riders', actions: ['create', 'read', 'update', 'delete', 'approve', 'suspend', 'export'] },
      { module: 'financial', actions: ['read', 'export', 'configure', 'approve_payments'] },
      { module: 'reports', actions: ['read', 'export', 'configure'] },
      { module: 'settings', actions: ['read', 'update', 'configure'] },
      { module: 'users', actions: ['create', 'read', 'update', 'delete', 'manage_roles'] },
      { module: 'alerts', actions: ['read', 'create', 'update', 'delete', 'configure'] },
      { module: 'audit', actions: ['read', 'export'] },
    ],
  },
  OPERADOR: {
    name: 'Operador',
    description: 'Gestión operativa diaria',
    permissions: [
      { module: 'orders', actions: ['create', 'read', 'update'] },
      { module: 'deliveries', actions: ['read', 'update', 'assign'] },
      { module: 'riders', actions: ['read'] },
      { module: 'live-map', actions: ['read'] },
      { module: 'shifts', actions: ['read', 'update'] },
      { module: 'alerts', actions: ['read', 'create', 'update'] },
    ],
  },
  REPARTIDOR: {
    name: 'Repartidor',
    description: 'App del repartidor',
    permissions: [
      { module: 'my-orders', actions: ['read', 'update'] },
      { module: 'earnings', actions: ['read'] },
      { module: 'productivity', actions: ['read'] },
      { module: 'profile', actions: ['read', 'update'] },
      { module: 'shifts', actions: ['read', 'create', 'update'] },
    ],
  },
};

export const useRole = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore(); // Asegúrate de extraer isLoading del store

  const currentRole = useMemo<Role | null>(() => {
    if (!user?.role) return null;
    return user.role as Role;
  }, [user?.role]);

  const roleConfig = useMemo<RoleConfig | null>(() => {
    if (!currentRole) return null;
    return ROLE_CONFIGURATIONS[currentRole];
  }, [currentRole]);

  // Función corregida: recibe module y action por separado
  const hasPermission = (module: string, action: string): boolean => {
    if (!roleConfig || !isAuthenticated) return false;
    
    const permission = roleConfig.permissions.find(p => p.module === module);
    if (!permission) return false;
    
    return permission.actions.includes(action);
  };

  const hasAnyPermission = (module: string, actions: string[]): boolean => {
    if (!roleConfig || !isAuthenticated) return false;
    const permission = roleConfig.permissions.find(p => p.module === module);
    if (!permission) return false;
    return actions.some(action => permission.actions.includes(action));
  };

  const canAccessModule = (module: string): boolean => {
    if (!roleConfig || !isAuthenticated) return false;
    return roleConfig.permissions.some(p => p.module === module);
  };

  const hasRole = (roleToCheck: Role): boolean => {
    return currentRole === roleToCheck;
  };

  return {
    // Estado
    currentRole, // Cambiado de 'role' a 'currentRole' para coincidir con el contexto
    roleName: roleConfig?.name || '',
    roleDescription: roleConfig?.description || '',
    permissions: roleConfig?.permissions || [],
    isAuthenticated,
    isLoading, // Ahora se exporta explícitamente
    
    // Verificaciones
    hasRole,
    hasPermission,
    hasAnyPermission,
    canAccessModule,
    
    // Utilidades
    config: roleConfig,
    isSuperadmin: () => currentRole === 'SUPERADMIN',
    isGerente: () => currentRole === 'GERENTE',
    isOperador: () => currentRole === 'OPERADOR',
    isRepartidor: () => currentRole === 'REPARTIDOR',
  };
};

export default useRole;