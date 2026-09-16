import React, { useState, useMemo } from 'react';
import { ServiceOrder, Technician } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Wrench, 
  Plus
} from 'lucide-react';
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths,
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  isSameMonth,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';

interface AgendaAirProps {
  orders: ServiceOrder[];
  technicians: Technician[];
  onOpenNewOrder: () => void;
  onSelectOrder: (order: ServiceOrder) => void;
}

type CalendarViewMode = 'day' | 'week' | 'month';

const SLOTS = [
  '09:00 - 11:00',
  '11:30 - 13:30',
  '14:30 - 16:30',
  '17:00 - 19:00',
];

export const AgendaAir: React.FC<AgendaAirProps> = ({
  orders,
  technicians,
  onOpenNewOrder,
  onSelectOrder,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    if (selectedTechFilter === 'all') return orders;
    return orders.filter(o => o.assigned_technician_id === selectedTechFilter);
  }, [orders, selectedTechFilter]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const ordersForDay = useMemo(() => {
    return filteredOrders.filter(o => o.scheduled_date === selectedDateStr);
  }, [filteredOrders, selectedDateStr]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  const handlePrev = () => {
    if (viewMode === 'day') setSelectedDate(prev => subDays(prev, 1));
    else if (viewMode === 'week') setSelectedDate(prev => subWeeks(prev, 1));
    else setSelectedDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setSelectedDate(prev => addDays(prev, 1));
    else if (viewMode === 'week') setSelectedDate(prev => addWeeks(prev, 1));
    else setSelectedDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => setSelectedDate(new Date());

  const headerTitle = useMemo(() => {
    if (viewMode === 'day') {
      return format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `Semana del ${format(start, 'd MMM', { locale: es })} al ${format(end, "d 'de' MMMM yyyy", { locale: es })}`;
    }
    return format(selectedDate, "MMMM 'de' yyyy", { locale: es });
  }, [selectedDate, viewMode]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; label: string }> = {
      ingresado: { bg: 'bg-blue-500/10 text-blue-700 border-blue-200', label: 'Ingresado' },
      en_ruta: { bg: 'bg-amber-500/10 text-amber-700 border-amber-200', label: 'En Ruta' },
      en_proceso: { bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200', label: 'En Terreno' },
      pruebas_qa: { bg: 'bg-purple-500/10 text-purple-700 border-purple-200', label: 'Pruebas' },
      completado: { bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', label: 'Finalizado' },
      cancelado: { bg: 'bg-rose-500/10 text-rose-700 border-rose-200', label: 'Cancelado' },
    };
    return map[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status };
  };

  return (
    <div className="space-y-6">
      {/* Header Principal con Controles de Vista Google Calendar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
              {headerTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {viewMode === 'day' && `${ordersForDay.length} visita(s) técnica(s) para hoy`}
              {viewMode === 'week' && `Vista de cuadrícula semanal de visitas y técnicos`}
              {viewMode === 'month' && `Calendario mensual general de carga de trabajo`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Vistas: Día / Semana / Mes */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'day' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'week' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes
            </button>
          </div>

          {/* Filtro por Técnico */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Wrench className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTechFilter}
              onChange={(e) => setSelectedTechFilter(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los técnicos</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Botón Hoy y Flechas de Navegación */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Hoy
            </button>
            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-0.5">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botón Agendar Visita */}
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:brightness-105 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agendar Visita</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. VISTA SEMANAL (ESTILO GOOGLE CALENDAR)                  */}
      {/* ========================================================= */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Fila de días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 divide-x divide-slate-200 text-center">
            {weekDays.map((day) => {
              const currentToday = isToday(day);
              const isCurrentDaySelected = isSameDay(day, selectedDate);
              const dayOrders = filteredOrders.filter(o => o.scheduled_date === format(day, 'yyyy-MM-dd'));

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isCurrentDaySelected ? 'bg-cyan-50/50' : 'hover:bg-slate-100/50'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      currentToday 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : isCurrentDaySelected
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-800'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayOrders.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cuadrícula de Contenido de la Semana */}
          <div className="grid grid-cols-7 divide-x divide-slate-200 min-h-[550px] bg-white">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayOrders = filteredOrders.filter(o => o.scheduled_date === dayStr);
              const currentToday = isToday(day);

              return (
                <div 
                  key={dayStr}
                  className={`p-2 space-y-2 flex flex-col ${
                    currentToday ? 'bg-blue-50/20' : ''
                  }`}
                >
                  {dayOrders.length === 0 ? (
                    <div 
                      onClick={() => {
                        setSelectedDate(day);
                        onOpenNewOrder();
                      }}
                      className="h-full min-h-[120px] rounded-xl border border-dashed border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30 flex flex-col items-center justify-center p-2 text-center text-slate-400 text-[11px] cursor-pointer group transition-all"
                    >
                      <Plus className="w-4 h-4 mb-1 opacity-0 group-hover:opacity-100 text-cyan-600 transition-opacity" />
                      <span className="group-hover:text-cyan-700">Sin visitas</span>
                    </div>
                  ) : (
                    dayOrders.map((ord) => {
                      const badge = getStatusBadge(ord.status);
                      return (
                        <div
                          key={ord.id}
                          onClick={() => onSelectOrder(ord)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer space-y-1.5 group text-left"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-cyan-700 truncate">
                              {ord.ticket_number}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-1">
                            {ord.customer?.name}
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{ord.scheduled_time_slot.split(' - ')[0]}</span>
                          </div>

                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 truncate font-medium max-w-[90px]">
                              {ord.assigned_technician?.name ? ord.assigned_technician.name.split(' ')[0] : 'Sin asignar'}
                            </span>
                            <span className="font-bold text-slate-900 font-mono text-[10px]">
                              ${ord.total.toLocaleString('es-CL')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. VISTA MENSUAL (ESTILO GOOGLE CALENDAR)                  */}
      {/* ========================================================= */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Días de la semana header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 divide-x divide-slate-200 text-center">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Grilla de días del mes */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-slate-100">
            {monthDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurMonth = isSameMonth(day, selectedDate);
              const currentToday = isToday(day);
              const isDaySelected = isSameDay(day, selectedDate);
              const dayOrders = filteredOrders.filter(o => o.scheduled_date === dayStr);

              return (
                <div
                  key={dayStr}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                    isCurMonth ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 text-slate-400'
                  } ${isDaySelected ? 'ring-2 ring-inset ring-cyan-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentToday 
                        ? 'bg-blue-600 text-white' 
                        : isDaySelected
                        ? 'bg-slate-900 text-white'
                        : isCurMonth 
                        ? 'text-slate-800' 
                        : 'text-slate-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayOrders.length > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800">
                        {dayOrders.length} {dayOrders.length === 1 ? 'visita' : 'visitas'}
                      </span>
                    )}
                  </div>

                  {/* Chips de Órdenes */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {dayOrders.slice(0, 2).map((ord) => {
                      const badge = getStatusBadge(ord.status);
                      return (
                        <div
                          key={ord.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(ord);
                          }}
                          className="px-1.5 py-1 rounded-md text-[10px] font-semibold border truncate transition-all hover:scale-[1.02] shadow-2xs flex items-center justify-between gap-1 bg-slate-50 border-slate-200"
                        >
                          <span className="truncate text-slate-800">
                            {ord.customer?.name || ord.ticket_number}
                          </span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            ord.status === 'completado' ? 'bg-emerald-500' :
                            ord.status === 'en_ruta' ? 'bg-amber-500' : 'bg-cyan-500'
                          }`} />
                        </div>
                      );
                    })}

                    {dayOrders.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setViewMode('day');
                        }}
                        className="text-[10px] font-bold text-cyan-600 hover:text-cyan-800 px-1 block text-left cursor-pointer"
                      >
                        +{dayOrders.length - 2} más...
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. VISTA DIARIA (HORARIOS Y BLOQUES DETALLADOS)            */}
      {/* ========================================================= */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {SLOTS.map((slot) => {
            const slotOrders = ordersForDay.filter(o => o.scheduled_time_slot.includes(slot.split(' - ')[0]));

            return (
              <div
                key={slot}
                className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs"
              >
                {/* Slot Header */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-800 font-mono text-xs font-bold">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <span>Bloque {slot}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {slotOrders.length} orden(es) asignada(s)
                  </span>
                </div>

                {/* Slot Content */}
                <div className="p-4">
                  {slotOrders.length === 0 ? (
                    <div 
                      onClick={() => onOpenNewOrder()}
                      className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl hover:border-cyan-400 hover:bg-cyan-50/20 cursor-pointer transition-colors"
                    >
                      Bloque libre para despacho técnico. Haz clic para agendar aquí.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slotOrders.map((ord) => {
                        const badge = getStatusBadge(ord.status);
                        return (
                          <div
                            key={ord.id}
                            onClick={() => onSelectOrder(ord)}
                            className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-400 transition-all cursor-pointer space-y-2 group shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[11px] font-mono font-bold text-cyan-700">
                                {ord.ticket_number}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>

                            <div className="text-sm font-extrabold text-slate-900 group-hover:text-cyan-700 transition-colors">
                              {ord.customer?.name}
                            </div>

                            <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{ord.customer?.address}, {ord.customer?.commune}</span>
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-slate-700 font-medium">
                                <Wrench className="w-3 h-3 text-cyan-600" />
                                <span className="text-[11px]">{ord.assigned_technician?.name || 'Sin asignar'}</span>
                              </div>
                              <span className="text-xs font-black text-slate-900 font-mono">
                                ${ord.total.toLocaleString('es-CL')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
