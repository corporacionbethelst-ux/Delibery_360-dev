import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Shift, Rider } from '@/types/riders';

interface ShiftCalendarProps {
  shifts: (Shift & { rider: Rider })[];
  onShiftClick?: (shift: Shift & { rider: Rider }) => void;
}

export function ShiftCalendar({ shifts, onShiftClick }: ShiftCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const getDaysInWeek = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para lunes
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = firstDay.getDate(); d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  const getShiftTypeColor = (type?: string) => {
    switch (type) {
      case 'morning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'afternoon': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'night': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getShiftTypeLabel = (type?: string) => {
    switch (type) {
      case 'morning': return 'Mañana';
      case 'afternoon': return 'Tarde';
      case 'night': return 'Noche';
      default: return 'General';
    }
  };

  const weekDays = view === 'week' ? getDaysInWeek(currentDate) : getDaysInMonth(currentDate);
  const today = new Date().toDateString();

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const totalShifts = shifts.length;
  const activeShifts = shifts.filter(s => s.isActive).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Calendario de Turnos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default">{totalShifts} turnos</Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">{activeShifts} activos</Badge>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[200px] text-center">
              {view === 'week' 
                ? `Semana del ${weekDays[0].toLocaleDateString()}`
                : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-2 ${view === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
          {/* Cabeceras de días */}
          {weekDays.map((day, idx) => (
            <div key={idx} className={`p-2 text-center border-b font-semibold ${day.toDateString() === today ? 'bg-blue-50 text-blue-700' : ''}`}>
              <div className="text-xs uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
              <div className={`text-lg ${day.toDateString() === today ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                {day.getDate()}
              </div>
            </div>
          ))}

          {/* Celdas de turnos */}
          {weekDays.map((day, idx) => {
            const dayShifts = getShiftsForDay(day);
            return (
              <div
                key={idx}
                className={`min-h-[120px] p-2 border rounded-lg ${day.toDateString() === today ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
              >
                {dayShifts.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center mt-4">Sin turnos</div>
                ) : (
                  <div className="space-y-1">
                    {dayShifts.map((shift) => (
                      <button
                        key={shift.id}
                        onClick={() => onShiftClick?.(shift)}
                        className={`w-full text-left p-2 rounded border text-xs transition-all hover:shadow-md ${getShiftTypeColor(shift.type)}`}
                      >
                        <div className="font-semibold truncate">{shift.rider.user.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{getShiftTypeLabel(shift.type)}</span>
                        </div>
                        {shift.isActive && (
                          <Badge className="mt-1 text-[10px] bg-green-600">Activo</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leyenda de Turnos
          </h4>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
              <span className="text-xs">Mañana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
              <span className="text-xs">Tarde</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-xs">Noche</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-600"></div>
              <span className="text-xs">Activo ahora</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ShiftCalendar;
