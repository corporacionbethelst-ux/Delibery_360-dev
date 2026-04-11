'use client';

/**
 * Componente StatsCards - Tarjetas de estadísticas reutilizables
 * Delivery360/LogiRider
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend,
  subtitle,
  onClick,
}: StatsCardProps) {
  const CardContent = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}{trend.label || '%'} {trend.isPositive ? 'vs ayer' : 'vs ayer'}
            </span>
          </div>
        )}
        {subtitle && !trend && (
          <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
      <div className={`${iconBgColor} rounded-full p-4`}>
        {React.cloneElement(icon as React.ReactElement, {
          className: `h-8 w-8 ${iconColor}`,
        })}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div 
        className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        {CardContent}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {CardContent}
    </div>
  );
}

interface StatsGridProps {
  stats: Array<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    iconBgColor: string;
    iconColor: string;
    trend?: {
      value: number;
      isPositive: boolean;
      label?: string;
    };
    subtitle?: string;
    onClick?: () => void;
  }>;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}
