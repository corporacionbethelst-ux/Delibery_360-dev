/**
 * Financial utilities for Delivery360
 * Handles payment calculations, earnings, taxes, and financial reporting
 */

import { PaymentTransaction, RiderEarnings, DeliveryPayment, FinancialReport } from '@/types';

export type Currency = 'BRL' | 'USD' | 'EUR';

export interface TaxConfig {
  incomeTaxRate: number; // e.g., 0.15 for 15%
  serviceTaxRate: number; // e.g., 0.05 for 5%
  socialSecurityRate: number; // e.g., 0.11 for 11%
}

const DEFAULT_TAX_CONFIG: TaxConfig = {
  incomeTaxRate: 0.15,
  serviceTaxRate: 0.05,
  socialSecurityRate: 0.11,
};

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: Currency = 'BRL'): string {
  const locales: Record<Currency, string> = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE',
  };

  const symbols: Record<Currency, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
  };

  return new Intl.NumberFormat(locales[currency], {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Calculate delivery payment based on distance, time, and base rate
 */
export function calculateDeliveryPayment(options: {
  baseRate: number;
  distanceKm: number;
  durationMinutes: number;
  perKmRate: number;
  perMinuteRate: number;
  surgeMultiplier?: number;
  tip?: number;
}): number {
  const {
    baseRate,
    distanceKm,
    durationMinutes,
    perKmRate,
    perMinuteRate,
    surgeMultiplier = 1,
    tip = 0,
  } = options;

  const distanceCost = distanceKm * perKmRate;
  const timeCost = durationMinutes * perMinuteRate;
  const subtotal = baseRate + distanceCost + timeCost;
  const withSurge = subtotal * surgeMultiplier;
  
  return withSurge + tip;
}

/**
 * Calculate rider earnings after platform commission
 */
export function calculateRiderEarnings(
  deliveryPayment: number,
  commissionRate: number = 0.25, // 25% platform commission
  bonus?: number
): number {
  const commission = deliveryPayment * commissionRate;
  const baseEarnings = deliveryPayment - commission;
  return baseEarnings + (bonus || 0);
}

/**
 * Calculate daily earnings for a rider
 */
export function calculateDailyEarnings(deliveries: DeliveryPayment[]): RiderEarnings {
  const totalDeliveries = deliveries.length;
  const totalGross = deliveries.reduce((sum, d) => sum + d.amount, 0);
  const totalTips = deliveries.reduce((sum, d) => sum + (d.tip || 0), 0);
  const totalBonuses = deliveries.reduce((sum, d) => sum + (d.bonus || 0), 0);
  
  const platformCommission = totalGross * 0.25;
  const netEarnings = totalGross - platformCommission + totalTips + totalBonuses;

  return {
    date: new Date().toISOString().split('T')[0],
    totalDeliveries,
    grossEarnings: totalGross,
    tips: totalTips,
    bonuses: totalBonuses,
    platformCommission,
    netEarnings,
    averagePerDelivery: totalDeliveries > 0 ? netEarnings / totalDeliveries : 0,
  };
}

/**
 * Calculate taxes for earnings
 */
export function calculateTaxes(
  grossEarnings: number,
  config: TaxConfig = DEFAULT_TAX_CONFIG
): {
  incomeTax: number;
  serviceTax: number;
  socialSecurity: number;
  totalTaxes: number;
  netAfterTaxes: number;
} {
  const incomeTax = grossEarnings * config.incomeTaxRate;
  const serviceTax = grossEarnings * config.serviceTaxRate;
  const socialSecurity = grossEarnings * config.socialSecurityRate;
  const totalTaxes = incomeTax + serviceTax + socialSecurity;
  const netAfterTaxes = grossEarnings - totalTaxes;

  return {
    incomeTax,
    serviceTax,
    socialSecurity,
    totalTaxes,
    netAfterTaxes,
  };
}

/**
 * Process payment transaction
 */
export function processPaymentTransaction(
  transaction: Omit<PaymentTransaction, 'id' | 'createdAt' | 'status'>
): PaymentTransaction {
  return {
    ...transaction,
    id: `txn_${Date.now}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

/**
 * Calculate platform revenue from deliveries
 */
export function calculatePlatformRevenue(
  deliveries: DeliveryPayment[],
  commissionRate: number = 0.25
): {
  totalRevenue: number;
  totalCommission: number;
  totalFees: number;
  periodStart: string;
  periodEnd: string;
} {
  const totalAmount = deliveries.reduce((sum, d) => sum + d.amount, 0);
  const totalCommission = totalAmount * commissionRate;
  const processingFees = totalAmount * 0.029 + deliveries.length * 0.30; // Typical payment processor fees

  return {
    totalRevenue: totalCommission - processingFees,
    totalCommission,
    totalFees: processingFees,
    periodStart: deliveries[0]?.date || '',
    periodEnd: deliveries[deliveries.length - 1]?.date || '',
  };
}

/**
 * Generate financial report for a period
 */
export function generateFinancialReport(
  transactions: PaymentTransaction[],
  period: { start: Date; end: Date }
): FinancialReport {
  const filteredTransactions = transactions.filter(
    t => new Date(t.createdAt) >= period.start && new Date(t.createdAt) <= period.end
  );

  const successfulTransactions = filteredTransactions.filter(t => t.status === 'completed');
  const pendingTransactions = filteredTransactions.filter(t => t.status === 'pending');
  const failedTransactions = filteredTransactions.filter(t => t.status === 'failed');

  const totalRevenue = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = successfulTransactions
    .filter(t => t.type === 'payout')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    period: {
      start: period.start.toISOString(),
      end: period.end.toISOString(),
    },
    generatedAt: new Date().toISOString(),
    summary: {
      totalTransactions: filteredTransactions.length,
      successfulTransactions: successfulTransactions.length,
      pendingTransactions: pendingTransactions.length,
      failedTransactions: failedTransactions.length,
      totalRevenue,
      totalPaid,
      netBalance: totalRevenue - totalPaid,
    },
    transactions: filteredTransactions,
  };
}

/**
 * Calculate surge pricing multiplier based on demand
 */
export function calculateSurgeMultiplier(
  activeOrders: number,
  availableRiders: number,
  baseMultiplier: number = 1.0
): number {
  if (availableRiders === 0) return Math.max(baseMultiplier, 2.0);
  
  const demandRatio = activeOrders / availableRiders;
  
  if (demandRatio > 2) {
    return Math.min(baseMultiplier + (demandRatio - 2) * 0.5, 3.0); // Cap at 3x
  }
  
  return baseMultiplier;
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (isNaN(amount)) {
    errors.push('El monto debe ser un número válido');
  }

  if (amount <= 0) {
    errors.push('El monto debe ser mayor a cero');
  }

  if (amount > 1000000) {
    errors.push('El monto excede el límite permitido');
  }

  // Check for reasonable decimal places
  const decimals = (amount.toString().split('.')[1] || '').length;
  if (decimals > 2) {
    errors.push('El monto no puede tener más de 2 decimales');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Split payment between rider and platform
 */
export function splitPayment(
  totalAmount: number,
  commissionRate: number = 0.25
): {
  riderAmount: number;
  platformAmount: number;
  commissionRate: number;
} {
  const platformAmount = totalAmount * commissionRate;
  const riderAmount = totalAmount - platformAmount;

  return {
    riderAmount,
    platformAmount,
    commissionRate,
  };
}

/**
 * Calculate refund amount with partial refund support
 */
export function calculateRefund(
  originalAmount: number,
  refundPercentage: number,
  refundFee: number = 0
): number {
  const refundAmount = originalAmount * (refundPercentage / 100);
  return Math.max(0, refundAmount - refundFee);
}

/**
 * Get payment method icon/label
 */
export function getPaymentMethodDetails(method: string): {
  label: string;
  icon: string;
} {
  const methods: Record<string, { label: string; icon: string }> = {
    credit_card: { label: 'Tarjeta de Crédito', icon: '💳' },
    debit_card: { label: 'Tarjeta de Débito', icon: '💳' },
    pix: { label: 'PIX', icon: '💠' },
    boleto: { label: 'Boleto', icon: '📄' },
    cash: { label: 'Efectivo', icon: '💵' },
    wallet: { label: 'Billetera Digital', icon: '📱' },
  };

  return methods[method] || { label: method, icon: '💰' };
}

/**
 * Calculate installment payments
 */
export function calculateInstallments(
  totalAmount: number,
  installments: number,
  interestRate: number = 0
): {
  installmentAmount: number;
  totalWithInterest: number;
  totalInterest: number;
} {
  if (installments <= 0) {
    return { installmentAmount: 0, totalWithInterest: 0, totalInterest: 0 };
  }

  const totalWithInterest = totalAmount * (1 + interestRate);
  const totalInterest = totalWithInterest - totalAmount;
  const installmentAmount = totalWithInterest / installments;

  return {
    installmentAmount,
    totalWithInterest,
    totalInterest,
  };
}

/**
 * Generate transaction ID
 */
export function generateTransactionId(prefix: string = 'txn'): string {
  return `${prefix}_${Date.now}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(dueDate: string, status: string): boolean {
  if (['completed', 'cancelled', 'refunded'].includes(status)) {
    return false;
  }
  
  return new Date(dueDate) < new Date();
}

/**
 * Calculate days until payment due
 */
export function daysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
