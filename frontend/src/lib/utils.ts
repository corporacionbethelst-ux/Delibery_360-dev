import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind CSS de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda
 * @param value - El valor numérico a formatear
 * @param currency - Código de moneda (default: 'BRL' para Real Brasileño)
 * @param locale - Locale para formato (default: 'pt-BR')
 * @returns String formateado como moneda (ej: "R$ 1.234,56")
 */
export function formatCurrency(
  value: number | string, 
  currency: string = 'BRL', 
  locale: string = 'pt-BR'
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

/**
 * Formatea una fecha en formato legible
 * @param date - La fecha a formatear
 * @param format - Tipo de formato ('short', 'long', 'time')
 * @returns String con la fecha formateada
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '--/--/----';
  }

  if (format === 'time') {
    return dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Genera un ID único aleatorio
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}