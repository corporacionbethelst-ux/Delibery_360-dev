// Tipos TypeScript para Users - Delivery360

export type UserRole = 'superadmin' | 'gerente' | 'operador' | 'repartidor';
export type UserStatus = 'activo' | 'inactivo' | 'suspendido';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
  
  // Autenticación
  lastLoginAt?: Date;
  lastPasswordChange?: Date;
  
  // LGPD
  lgpdConsent: boolean;
  lgpdConsentDate?: Date;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
}

export interface UserUpdateInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  status?: UserStatus;
  lgpdConsent?: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface PasswordReset {
  email: string;
  token: string;
  expiresAt: Date;
}

export interface UserFilters {
  role?: UserRole[];
  status?: UserStatus[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
