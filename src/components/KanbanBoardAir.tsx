import React, { useState, useMemo } from 'react';
import { ServiceOrder, OrderStatus, Technician, AirSettings } from '../types';
import { KanbanCardAir } from './KanbanCardAir';
import { 
  Search, 
  Filter, 
  Plus, 
  Inbox, 
  Truck, 
  Wrench, 
  CheckCircle, 
  Gauge,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  X,
  ArrowRight
} from 'lucide-react';
import { format, subDays, addDays, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatAirPrice } from '../lib/countries';

interface KanbanBoardAirProps {
  orders: ServiceOrder[];
  technicians: Technician[];
  settings?: AirSettings;
  onOpenNewOrder: () => void;
  onEditOrder: (order: ServiceOrder) => void;
  onOpenInspection: (order: ServiceOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenReceipt?: (order: ServiceOrder) => void;
}

type DateRangeMode = 'today' | 'yesterday' | 'specific_day' | 'last_7_days' | 'this_month' | 'all';
type DateFilterScope = 'completed_only' | 'all_columns';

const COLUMNS: { id: OrderStatus; title: string; icon: React.ElementType; color: string; badgeColor: string }[] = [
  { id: 'ingresado', title: 'Solicitudes / Nuevas', icon: Inbox, color: 'border-slate-200 bg-slate-100/70', badgeColor: 'bg-slate-200 text-slate-700' },
  { id: 'en_ruta', title: 'Técnico en Ruta', icon: Truck, color: 'border-blue-200 bg-blue-50/50', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'en_proceso', title: 'En Terreno / Mantención', icon: Wrench, color: 'border-cyan-200 bg-cyan-50/50', badgeColor: 'bg-cyan-100 text-cyan-800' },
  { id: 'pruebas_qa', title: 'Medición & Pruebas QA', icon: Gauge, color: 'border-amber-200 bg-amber-50/50', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'completado', title: 'Finalizado / Entregado', icon: CheckCircle, color: 'border-emerald-200 bg-emerald-50/50', badgeColor: 'bg-emerald-100 text-emerald-800' },
];

/**
 * Normaliza la fecha de cierre o realización de la orden a YYYY-MM-DD.
 */
export const getOrderClosureDate = (ord: ServiceOrder): string => {
  if (ord.completed_at && ord.completed_at.trim() !== '') {
    const clean = ord.completed_at.replace('T', ' ').trim();
    return clean.split(' ')[0];
  }
  if (ord.scheduled_date && ord.scheduled_date.trim() !== '') {
    return ord.scheduled_date.split('T')[0];
  }
  if (ord.created_at && ord.created_at.trim() !== '') {
    const clean = ord.created_at.replace('T', ' ').trim();
    return clean.split(' ')[0];
  }
  return '';
};

export const KanbanBoardAir: React.FC<KanbanBoardAirProps> = ({
  orders,
  technicians,
  settings,
  onOpenNewOrder,
  onEditOrder,
  onOpenInspection,
  onUpdateStatus,
  onOpenReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTech, setFilterTech] = useState<string>('all');

  // Fechas de referencia
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const yesterdayStr = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);

  // Estados de control de fecha
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('today');
  const [dateFilterScope, setDateFilterScope] = useState<DateFilterScope>('completed_only');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const currencySymbol = settings?.currency_symbol || '$';
  const countryCode = settings?.country_code || 'CL';

  // 1. Agrupador y Auditoría de Cierres Diarios
  const dailyClosures = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'completado');
    const map = new Map<string, { date: string; orders: ServiceOrder[]; totalRevenue: number }>();

    for (const ord of completedOrders) {
      const d = getOrderClosureDate(ord);
      if (!d) continue;
      const existing = map.get(d) || { date: d, orders: [], totalRevenue: 0 };
      existing.orders.push(ord);
      existing.totalRevenue += (ord.total || 0);
      map.set(d, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  // Contadores rápidos para badges
  const todayClosuresCount = useMemo(() => {
    return dailyClosures.find((c) => c.date === todayStr)?.orders.length || 0;
  }, [dailyClosures, todayStr]);

  const yesterdayClosuresCount = useMemo(() => {
    return dailyClosures.find((c) => c.date === yesterdayStr)?.orders.length || 0;
  }, [dailyClosures, yesterdayStr]);

  // Total histórico de completadas
  const totalCompletedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'completado').length;
  }, [orders]);

  // Total recaudado histórico de completadas
  const totalCompletedRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === 'completado')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  // Formato amigable de fecha seleccionada
  const formatFriendlyDate = (dateStr: string): string => {
    try {
      const parsed = parseISO(dateStr);
      if (isToday(parsed)) return 'Hoy';
      if (isYesterday(parsed)) return 'Ayer';
      return format(parsed, "EEEE d 'de' MMMM", { locale: es });
    } catch {
      return dateStr;
    }
  };

  // 2. Comprobador de Filtro de Fecha por Orden
  const matchesDateFilter = (ord: ServiceOrder, isCompletedColumn: boolean) => {
    // Si el alcance es solo la columna completado, no filtrar las columnas activas
    if (!isCompletedColumn && dateFilterScope === 'completed_only') {
      return true;
    }

    const targetDate = isCompletedColumn
      ? getOrderClosureDate(ord)
      : (ord.scheduled_date ? ord.scheduled_date.split('T')[0] : getOrderClosureDate(ord));

    if (!targetDate) return true;

    if (dateRangeMode === 'today') {
      return targetDate === todayStr;
    }
    if (dateRangeMode === 'yesterday') {
      return targetDate === yesterdayStr;
    }
    if (dateRangeMode === 'specific_day') {
      return targetDate === selectedDate;
    }
    if (dateRangeMode === 'last_7_days') {
      const sevenDaysAgoStr = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      return targetDate >= sevenDaysAgoStr && targetDate <= todayStr;
    }
    if (dateRangeMode === 'this_month') {
      const startMonthStr = format(new Date(), 'yyyy-MM-01');
      return targetDate >= startMonthStr && targetDate <= todayStr;
    }
    if (dateRangeMode === 'all') {
      return true;
    }
    return true;
  };

  // 3. Filtrado por Búsqueda, Servicio y Técnico
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        ord.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.customer?.commune || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.equipment?.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || ord.service_type === filterType;
      const matchTech = filterTech === 'all' || ord.assigned_technician_id === filterTech;

      return matchSearch && matchType && matchTech;
    });
  }, [orders, searchTerm, filterType, filterTech]);

  // Manejadores de navegación de fecha
  const handlePrevDay = () => {
    try {
      const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
      setSelectedDate(prev);
      setDateRangeMode('specific_day');
    } catch {
      setSelectedDate(yesterdayStr);
      setDateRangeMode('specific_day');
    }
  };

  const handleNextDay = () => {
    try {
      const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
      setSelectedDate(next);
      setDateRangeMode('specific_day');
    } catch {
      setSelectedDate(todayStr);
      setDateRangeMode('specific_day');
    }
  };

  const handleSelectToday = () => {
    setSelectedDate(todayStr);
    setDateRangeMode('today');
  };

  const handleSelectYesterday = () => {
    setSelectedDate(yesterdayStr);
    setDateRangeMode('yesterday');
  };

  // Título o descripción del rango activo
  const activeDateLabel = useMemo(() => {
    if (dateRangeMode === 'today') return `Hoy (${formatFriendlyDate(todayStr)})`;
    if (dateRangeMode === 'yesterday') return `Ayer (${formatFriendlyDate(yesterdayStr)})`;
    if (dateRangeMode === 'specific_day') return formatFriendlyDate(selectedDate);
    if (dateRangeMode === 'last_7_days') return 'Últimos 7 días';
    if (dateRangeMode === 'this_month') return 'Este Mes';
    return 'Historial Completo';
  }, [dateRangeMode, selectedDate, todayStr, yesterdayStr]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. Barra Principal de Filtros & Control */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Buscador de Órdenes */}
            <div className="relative min-w-[260px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar ticket, cliente, comuna o equipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Filtro por Tipo de Servicio */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Servicios</option>
                <option value="mantencion_preventiva">Mantención Semestral (6M)</option>
                <option value="instalacion">Instalación Nueva</option>
                <option value="mantencion_correctiva">Reparación / Fuga</option>
                <option value="visita_tecnica">Visita Factibilidad</option>
                <option value="recarga_gas">Carga Gas R410A/R32</option>
              </select>
            </div>

            {/* Filtro por Técnico */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <select
                value={filterTech}
                onChange={(e) => setFilterTech(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Técnicos</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.sec_certified ? '(SEC)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón Nueva Orden */}
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Orden de Servicio</span>
          </button>
        </div>

        {/* 2. Barra Especializada de Selección de Días & Auditoría de Cierres */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-600 flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>Día de Cierre:</span>
            </span>

            {/* Botón Rápido Hoy */}
            <button
              type="button"
              onClick={handleSelectToday}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateRangeMode === 'today'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Hoy</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                dateRangeMode === 'today' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {todayClosuresCount}
              </span>
            </button>

            {/* Botón Rápido Ayer */}
            <button
              type="button"
              onClick={handleSelectYesterday}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateRangeMode === 'yesterday'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Ayer</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                dateRangeMode === 'yesterday' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {yesterdayClosuresCount}
              </span>
            </button>

            {/* Navegación Día por Día con Flechas y Date Picker */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
              <button
                type="button"
                onClick={handlePrevDay}
                title="Día anterior"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-cyan-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative flex items-center px-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setDateRangeMode('specific_day');
                    }
                  }}
                  className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                title="Día siguiente"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-cyan-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Desplegable Inteligente: Días con Cierres Registrados */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <select
                value={dateRangeMode === 'specific_day' || dateRangeMode === 'today' || dateRangeMode === 'yesterday' ? selectedDate : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    if (e.target.value === todayStr) {
                      setDateRangeMode('today');
                    } else if (e.target.value === yesterdayStr) {
                      setDateRangeMode('yesterday');
                    } else {
                      setDateRangeMode('specific_day');
                    }
                  }
                }}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[200px]"
              >
                <option value="">
                  {dailyClosures.length > 0 ? `Días con cierres (${dailyClosures.length})` : 'Sin cierres aún'}
                </option>
                {dailyClosures.map((item) => {
                  const isTod = item.date === todayStr;
                  const isYest = item.date === yesterdayStr;
                  const prefix = isTod ? 'Hoy' : isYest ? 'Ayer' : item.date;
                  return (
                    <option key={item.date} value={item.date}>
                      {prefix} — {item.orders.length} cerrada{item.orders.length > 1 ? 's' : ''} ({formatAirPrice(item.totalRevenue, currencySymbol, countryCode)})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Opciones de Alcance Mayor */}
            <button
              type="button"
              onClick={() => setDateRangeMode('last_7_days')}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                dateRangeMode === 'last_7_days'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 Días
            </button>

            <button
              type="button"
              onClick={() => setDateRangeMode('all')}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                dateRangeMode === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Histórico
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle de Ámbito de Filtro */}
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dateFilterScope === 'all_columns'}
                onChange={(e) => setDateFilterScope(e.target.checked ? 'all_columns' : 'completed_only')}
                className="rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium">
                {dateFilterScope === 'all_columns' ? 'Filtrando todo el tablero' : 'Solo columna entregados'}
              </span>
            </label>

            {/* Botón Resumen de Cierres Diarios */}
            <button
              type="button"
              onClick={() => setIsSummaryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Abrir resumen y auditoría de productividad diaria de cierres"
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resumen de Cierres ({dailyClosures.length} días)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Grid de Columnas Kanban */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto min-h-[600px] pb-4">
        {COLUMNS.map((col) => {
          const isCompletedCol = col.id === 'completado';
          const rawColOrders = filteredOrders.filter((ord) => ord.status === col.id);
          const colOrders = rawColOrders.filter((ord) => matchesDateFilter(ord, isCompletedCol));
          const ColIcon = col.icon;

          // Cálculo del subtotal facturado en la columna completado para la fecha seleccionada
          const completedColRevenue = isCompletedCol
            ? colOrders.reduce((sum, o) => sum + (o.total || 0), 0)
            : 0;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border ${col.color} p-3.5 shadow-xs`}
            >
              {/* Encabezado de Columna */}
              <div className="flex flex-col gap-1 pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ColIcon className="w-4 h-4 text-cyan-700" />
                    <h3 className="text-xs font-bold text-slate-800">{col.title}</h3>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${col.badgeColor}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Banner de Cierres en la Columna Finalizado */}
                {isCompletedCol && (
                  <div className="mt-1 p-2 rounded-xl bg-emerald-100/60 border border-emerald-300/80 text-[10.5px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-950">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-700" />
                        <span className="truncate max-w-[130px]">{activeDateLabel}</span>
                      </span>
                      <span className="font-mono bg-emerald-200/80 px-1.5 py-0.2 rounded text-emerald-900">
                        {colOrders.length} cerrada{colOrders.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-emerald-800 font-medium">
                      <span>Total facturado:</span>
                      <span className="font-mono font-bold">
                        {formatAirPrice(completedColRevenue, currencySymbol, countryCode)}
                      </span>
                    </div>

                    {/* Botones de Cambio Rápido */}
                    <div className="pt-1 border-t border-emerald-200 flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={handleSelectToday}
                        className={`hover:underline cursor-pointer font-bold ${dateRangeMode === 'today' ? 'text-emerald-950 underline' : 'text-emerald-700'}`}
                      >
                        Hoy ({todayClosuresCount})
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={handleSelectYesterday}
                        className={`hover:underline cursor-pointer font-bold ${dateRangeMode === 'yesterday' ? 'text-emerald-950 underline' : 'text-emerald-700'}`}
                      >
                        Ayer ({yesterdayClosuresCount})
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setDateRangeMode('all')}
                        className={`hover:underline cursor-pointer font-bold ${dateRangeMode === 'all' ? 'text-emerald-950 underline' : 'text-emerald-700'}`}
                      >
                        Todas ({totalCompletedOrders})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Contenedor de Tarjetas */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl space-y-2">
                    {isCompletedCol ? (
                      <>
                        <CalendarDays className="w-6 h-6 text-slate-300" />
                        <span className="font-medium text-slate-600">
                          Sin órdenes cerradas {dateRangeMode === 'today' ? 'hoy' : dateRangeMode === 'yesterday' ? 'ayer' : `en este período`}
                        </span>
                        <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                          {dailyClosures.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const lastDay = dailyClosures[0];
                                setSelectedDate(lastDay.date);
                                setDateRangeMode('specific_day');
                              }}
                              className="px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[10.5px] font-bold transition-colors cursor-pointer"
                            >
                              Ver último día con cierres ({dailyClosures[0].date})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDateRangeMode('all')}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-medium transition-colors cursor-pointer"
                          >
                            Ver historial completo ({totalCompletedOrders})
                          </button>
                        </div>
                      </>
                    ) : (
                      <span>Sin órdenes activas</span>
                    )}
                  </div>
                ) : (
                  colOrders.map((ord) => (
                    <KanbanCardAir
                      key={ord.id}
                      order={ord}
                      onEdit={onEditOrder}
                      onOpenInspection={onOpenInspection}
                      onUpdateStatus={onUpdateStatus}
                      onOpenReceipt={onOpenReceipt}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Modal de Resumen y Auditoría de Cierres Diarios */}
      {isSummaryModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSummaryModalOpen(false);
          }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    Resumen de Órdenes Cerradas por Día
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      {dailyClosures.length} Días Activos
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Historial de órdenes finalizadas, productividad y facturación diaria
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Métricas Globales de Rendimiento */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Órdenes Entregadas
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {totalCompletedOrders}
                </span>
                <span className="text-[10.5px] text-slate-500">En todo el historial operativo</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Facturado Cierres
                </span>
                <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                  {formatAirPrice(totalCompletedRevenue, currencySymbol, countryCode)}
                </span>
                <span className="text-[10.5px] text-emerald-600">Servicios e insumos completados</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Promedio por Día Activo
                </span>
                <span className="text-2xl font-black text-cyan-700 font-mono mt-1 block">
                  {dailyClosures.length > 0 ? (totalCompletedOrders / dailyClosures.length).toFixed(1) : '0'}
                </span>
                <span className="text-[10.5px] text-slate-500">Órdenes cerradas / jornada</span>
              </div>
            </div>

            {/* Lista y Tabla Día por Día */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detalle Cronológico de Cierres
                </h4>
                <span className="text-[11px] text-slate-500">
                  Haz clic en "Revisar en Tablero" para inspeccionar las órdenes de ese día
                </span>
              </div>

              {dailyClosures.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Aún no hay órdenes cerradas en el sistema.
                </div>
              ) : (
                <div className="space-y-2">
                  {dailyClosures.map((item) => {
                    const isTod = item.date === todayStr;
                    const isYest = item.date === yesterdayStr;
                    const isSelected = selectedDate === item.date && dateRangeMode === 'specific_day';

                    // Técnicos que participaron ese día
                    const techsInvolved = Array.from(
                      new Set(
                        item.orders
                          .map((o) => o.assigned_technician?.name || 'Técnico')
                          .filter(Boolean)
                      )
                    );

                    return (
                      <div
                        key={item.date}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-50/70 border-cyan-300 ring-2 ring-cyan-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold text-slate-900">
                              {item.date}
                            </span>
                            {isTod && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                                Hoy
                              </span>
                            )}
                            {isYest && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                                Ayer
                              </span>
                            )}
                            <span className="text-xs text-slate-500 font-medium">
                              ({formatFriendlyDate(item.date)})
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                            <span className="font-bold text-emerald-700">
                              {item.orders.length} orden{item.orders.length > 1 ? 'es' : ''} entregada{item.orders.length > 1 ? 's' : ''}
                            </span>
                            <span>•</span>
                            <span className="font-mono font-bold text-slate-800">
                              Facturado: {formatAirPrice(item.totalRevenue, currencySymbol, countryCode)}
                            </span>
                            {techsInvolved.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 truncate max-w-[200px]">
                                  Técnico(s): {techsInvolved.join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(item.date);
                            if (item.date === todayStr) {
                              setDateRangeMode('today');
                            } else if (item.date === yesterdayStr) {
                              setDateRangeMode('yesterday');
                            } else {
                              setDateRangeMode('specific_day');
                            }
                            setIsSummaryModalOpen(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <span>Revisar en Tablero</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
              >
                Cerrar Resumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

