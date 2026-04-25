// src/types/auth.ts

export type UserRole = 'superadmin' | 'gerente' | 'operador' | 'repartidor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface Permission {
  module: string;
  actions: string[];
}