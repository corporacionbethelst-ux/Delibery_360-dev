// Hook personalizado para gestión de roles y permisos
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

export type Role = 'MANAGER' | 'OPERATOR' | 'RIDER';

interface Permission {
  module: string;
  actions: string[]; // 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'
}

interface RoleConfig {
  name: string;
  description: string;
  permissions: Permission[];
}

const ROLE_CONFIGURATIONS: Record<Role, RoleConfig> = {
  MANAGER: {
    name: 'Gerente',
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
  OPERATOR: {
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
  RIDER: {
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
  const { user, isAuthenticated } = useAuthStore();

  const currentRole = useMemo<Role | null>(() => {
    if (!user?.role) return null;
    return user.role as Role;
  }, [user?.role]);

  const roleConfig = useMemo<RoleConfig | null>(() => {
    if (!currentRole) return null;
    return ROLE_CONFIGURATIONS[currentRole];
  }, [currentRole]);

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

  const hasAllPermissions = (module: string, actions: string[]): boolean => {
    if (!roleConfig || !isAuthenticated) return false;
    
    const permission = roleConfig.permissions.find(p => p.module === module);
    if (!permission) return false;
    
    return actions.every(action => permission.actions.includes(action));
  };

  const canAccessModule = (module: string): boolean => {
    if (!roleConfig || !isAuthenticated) return false;
    return roleConfig.permissions.some(p => p.module === module);
  };

  const isManager = (): boolean => currentRole === 'MANAGER';
  const isOperator = (): boolean => currentRole === 'OPERATOR';
  const isRider = (): boolean => currentRole === 'RIDER';

  const getAvailableModules = (): string[] => {
    if (!roleConfig) return [];
    return roleConfig.permissions.map(p => p.module);
  };

  const checkRoleAccess = (allowedRoles: Role[]): boolean => {
    if (!currentRole || !isAuthenticated) return false;
    return allowedRoles.includes(currentRole);
  };

  return {
    // Estado
    role: currentRole,
    roleName: roleConfig?.name || '',
    roleDescription: roleConfig?.description || '',
    permissions: roleConfig?.permissions || [],
    isAuthenticated,
    
    // Verificaciones de rol
    isManager,
    isOperator,
    isRider,
    checkRoleAccess,
    
    // Verificaciones de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    getAvailableModules,
    
    // Utilidades
    config: roleConfig,
  };
};

export default useRole;
