import React, { useState, useMemo } from 'react';
import { 
  ServiceOrder, 
  Technician, 
  Customer, 
  AirEquipment, 
  AirSettings, 
  RecurringMaintenanceSchedule 
} from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Wrench, 
  Plus,
  Bell,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  Repeat,
  Check,
  CalendarCheck,
  Flame,
  ShieldCheck,
  Phone,
  UserCheck
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
  isToday,
  differenceInDays,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface AgendaAirProps {
  orders: ServiceOrder[];
  technicians: Technician[];
  customers?: Customer[];
  equipments?: AirEquipment[];
  settings?: AirSettings;
  recurringSchedules?: RecurringMaintenanceSchedule[];
  onOpenNewOrder: () => void;
  onSelectOrder: (order: ServiceOrder) => void;
  onAddRecurringSchedule?: (data: Omit<RecurringMaintenanceSchedule, 'id' | 'created_at'>) => Promise<RecurringMaintenanceSchedule>;
  onUpdateRecurringSchedule?: (id: string, updates: Partial<RecurringMaintenanceSchedule>) => Promise<void>;
  onDeleteRecurringSchedule?: (id: string) => Promise<void>;
  onConfirmAndScheduleRecurringOrder?: (
    scheduleId: string,
    scheduledDate: string,
    scheduledSlot: string,
    technicianId?: string,
    customPrice?: number
  ) => Promise<ServiceOrder | null>;
  onGenerateWhatsAppRecurringUrl?: (schedule: RecurringMaintenanceSchedule) => string;
}

type CalendarViewMode = 'day' | 'week' | 'month' | 'recurring';

const SLOTS = [
  '09:00 - 11:00',
  '11:30 - 13:30',
  '14:30 - 16:30',
  '17:00 - 19:00',
];

export const AgendaAir: React.FC<AgendaAirProps> = ({
  orders,
  technicians,
  customers = [],
  equipments = [],
  settings,
  recurringSchedules = [],
  onOpenNewOrder,
  onSelectOrder,
  onAddRecurringSchedule,
  onUpdateRecurringSchedule,
  onDeleteRecurringSchedule,
  onConfirmAndScheduleRecurringOrder,
  onGenerateWhatsAppRecurringUrl,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');

  // NK-053: Estados para Mantenimientos Periódicos Acordados
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'por_confirmar' | 'confirmado_agendado' | 'programado'>('all');
  const [recurringSearch, setRecurringSearch] = useState('');
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [schedulingTarget, setSchedulingTarget] = useState<RecurringMaintenanceSchedule | null>(null);

  // Formulario nuevo acuerdo
  const [formCustId, setFormCustId] = useState('');
  const [formEqIds, setFormEqIds] = useState<string[]>([]);
  const [formFreqMonths, setFormFreqMonths] = useState<number>(6);
  const [formStartDate, setFormStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formTimeSlot, setFormTimeSlot] = useState('09:00 - 11:00');
  const [formTechId, setFormTechId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Formulario agendamiento de visita
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmSlot, setConfirmSlot] = useState('09:00 - 11:00');
  const [confirmTechId, setConfirmTechId] = useState('');
  const [confirmPrice, setConfirmPrice] = useState<number>(settings?.standard_maintenance_price || 45000);

  // Auto-cargar primer cliente si está disponible al abrir modal
  const handleOpenAddModal = () => {
    const firstCust = customers[0];
    if (firstCust) {
      setFormCustId(firstCust.id);
      const custEqs = equipments.filter(e => e.customer_id === firstCust.id);
      setFormEqIds(custEqs.map(e => e.id));
    }
    setFormFreqMonths(6);
    setFormStartDate(format(new Date(), 'yyyy-MM-dd'));
    setFormTimeSlot('09:00 - 11:00');
    setFormTechId('');
    setFormNotes('');
    setIsAddScheduleModalOpen(true);
  };

  const handleSelectCustomerForSchedule = (custId: string) => {
    setFormCustId(custId);
    const custEqs = equipments.filter(e => e.customer_id === custId);
    setFormEqIds(custEqs.map(e => e.id));
  };

  const handleToggleEquipment = (eqId: string) => {
    setFormEqIds(prev => 
      prev.includes(eqId) ? prev.filter(id => id !== eqId) : [...prev, eqId]
    );
  };

  // Guardar nuevo acuerdo periódico
  const handleSaveNewSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === formCustId);
    if (!cust) {
      toast.error('Selecciona un cliente válido');
      return;
    }

    const selectedEquipments = equipments.filter(e => formEqIds.includes(e.id));
    let summary = 'Equipos de climatización';
    if (selectedEquipments.length > 0) {
      summary = `${selectedEquipments.length} equipo(s): ` + 
        selectedEquipments.map(e => `${e.brand} ${e.btu} BTU (${e.location_in_property})`).join(', ');
    }

    let nextDate = formStartDate;
    try {
      nextDate = format(addDays(parseISO(formStartDate), formFreqMonths * 30), 'yyyy-MM-dd');
    } catch {
      nextDate = format(addDays(new Date(), formFreqMonths * 30), 'yyyy-MM-dd');
    }

    if (onAddRecurringSchedule) {
      await onAddRecurringSchedule({
        customer_id: cust.id,
        customer_name: cust.name,
        customer_phone: cust.phone,
        customer_address: cust.address,
        customer_commune: cust.commune,
        equipment_ids: formEqIds,
        equipments_summary: summary,
        frequency_months: formFreqMonths,
        start_date: formStartDate,
        next_suggested_date: nextDate,
        preferred_time_slot: formTimeSlot,
        preferred_technician_id: formTechId || undefined,
        notes: formNotes.trim(),
        status: 'programado',
      });
    }

    setIsAddScheduleModalOpen(false);
  };

  // Abrir modal de agendamiento definitivo
  const handleOpenConfirmSchedule = (schedule: RecurringMaintenanceSchedule) => {
    setSchedulingTarget(schedule);
    setConfirmDate(schedule.next_suggested_date || format(new Date(), 'yyyy-MM-dd'));
    setConfirmSlot(schedule.preferred_time_slot || '09:00 - 11:00');
    setConfirmTechId(schedule.preferred_technician_id || technicians[0]?.id || '');
    setConfirmPrice(settings?.standard_maintenance_price || 45000);
  };

  // Confirmar y generar orden
  const handleExecuteScheduleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingTarget) return;

    if (onConfirmAndScheduleRecurringOrder) {
      await onConfirmAndScheduleRecurringOrder(
        schedulingTarget.id,
        confirmDate,
        confirmSlot,
        confirmTechId || undefined,
        confirmPrice
      );
    }
    setSchedulingTarget(null);
  };

  // Enviar mensaje por WhatsApp
  const handleSendWhatsApp = (schedule: RecurringMaintenanceSchedule) => {
    let url = '';
    if (onGenerateWhatsAppRecurringUrl) {
      url = onGenerateWhatsAppRecurringUrl(schedule);
    } else {
      const template = settings?.whatsapp_template_recurring_confirmation || 
        'Hola {cliente}, le saludamos de {empresa}. Le recordamos que según lo acordado tenemos programado el mantenimiento periódico de sus equipos de aire acondicionado ({equipos}) para estas fechas. Nos comunicamos para coordinar con usted el día y bloque horario que le resulte más conveniente para la visita del técnico. ¿Le acomoda agendar esta semana?';
      const company = settings?.fantasy_name || settings?.company_name || 'Nexus Air';
      const text = template
        .replace(/{cliente}/g, schedule.customer_name)
        .replace(/{empresa}/g, company)
        .replace(/{equipos}/g, schedule.equipments_summary)
        .replace(/{fecha}/g, schedule.confirmed_date || schedule.next_suggested_date);
      const cleanPhone = schedule.customer_phone.replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  // Lista enriquecida con cálculo dinámico de días y estado
  const enrichedRecurring = useMemo(() => {
    const today = new Date();
    return recurringSchedules.map(schedule => {
      let daysRemaining = 999;
      try {
        daysRemaining = differenceInDays(parseISO(schedule.next_suggested_date), today);
      } catch {}

      let computedStatus = schedule.status;
      if (schedule.status !== 'confirmado_agendado') {
        if (daysRemaining <= 15) {
          computedStatus = 'por_confirmar';
        } else {
          computedStatus = 'programado';
        }
      }

      return {
        ...schedule,
        daysRemaining,
        effectiveStatus: computedStatus
      };
    });
  }, [recurringSchedules]);

  // Alerta de mantenimientos por confirmar fecha (<= 15 días o cumplidos)
  const pendingConfirmCount = useMemo(() => {
    return enrichedRecurring.filter(s => s.effectiveStatus === 'por_confirmar').length;
  }, [enrichedRecurring]);

  // Lista filtrada
  const filteredRecurringList = useMemo(() => {
    let list = enrichedRecurring;
    if (recurringFilter !== 'all') {
      list = list.filter(s => s.effectiveStatus === recurringFilter || s.status === recurringFilter);
    }
    if (recurringSearch.trim()) {
      const q = recurringSearch.toLowerCase();
      list = list.filter(s => 
        s.customer_name.toLowerCase().includes(q) ||
        s.customer_phone.includes(q) ||
        s.customer_address.toLowerCase().includes(q) ||
        s.equipments_summary.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [enrichedRecurring, recurringFilter, recurringSearch]);

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
    if (viewMode === 'recurring') {
      return 'Plan de Mantenimientos Periódicos Acordados';
    }
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
              {viewMode === 'recurring' && `${recurringSchedules.length} clientes con periodicidad pactada (${pendingConfirmCount} por confirmar fecha)`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Vistas: Día / Semana / Mes / Periódicos Acordados */}
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
            <button
              onClick={() => setViewMode('recurring')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'recurring' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-amber-800 hover:text-amber-900 hover:bg-amber-50'
              }`}
              title="Mantenimientos periódicos confirmados por clientes (NK-053)"
            >
              <span>⭐ Acuerdos</span>
              {pendingConfirmCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  viewMode === 'recurring' ? 'bg-white text-amber-700' : 'bg-rose-500 text-white animate-pulse'
                }`}>
                  {pendingConfirmCount}
                </span>
              )}
            </button>
          </div>

          {/* Filtro por Técnico (solo visible en vistas de calendario) */}
          {viewMode !== 'recurring' && (
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
          )}

          {/* Botón Hoy y Flechas de Navegación (solo visible en calendario) */}
          {viewMode !== 'recurring' && (
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
          )}

          {/* Botón de Acción Principal */}
          {viewMode === 'recurring' ? (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nuevo Plan Periódico</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewOrder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:brightness-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Agendar Visita</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de aviso para mantenimientos periódicos por confirmar (NK-053) */}
      {viewMode !== 'recurring' && pendingConfirmCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              🔔
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">
                Tienes {pendingConfirmCount} cliente(s) con mantenimiento periódico acordado por confirmar este mes
              </span>
              <span className="text-slate-600 text-xs">
                Clientes que solicitaron agendar de forma periódica. Contáctalos por WhatsApp para acordar el día y horario definitivo.
              </span>
            </div>
          </div>
          <button
            onClick={() => setViewMode('recurring')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs shrink-0 flex items-center gap-1.5"
          >
            <span>Gestionar Acuerdos Periódicos</span>
            <span>→</span>
          </button>
        </div>
      )}

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
                            <div className="flex items-center gap-1">
                              {ord.is_recurring_confirmed && (
                                <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  ⭐ Plan
                                </span>
                              )}
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
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
                              <div className="flex items-center gap-1">
                                {ord.is_recurring_confirmed && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                    ⭐ Plan Periódico
                                  </span>
                                )}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </div>
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

      {/* ========================================================= */}
      {/* 4. VISTA DE MANTENIMIENTOS PERIÓDICOS ACORDADOS (NK-053)  */}
      {/* ========================================================= */}
      {viewMode === 'recurring' && (
        <div className="space-y-5 animate-fade-in">
          {/* Explicación y Propósito de la Vista */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                ⭐
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Agenda de Mantenimientos Periódicos Confirmados
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Clientes que formalizaron realizar sus mantenimientos de forma periódica (cada 3, 6 o 12 meses). 
                  Esta lógica es independiente de recaptación fría: te avisa cerca de la fecha para coordinar con el cliente el día exacto de la visita por WhatsApp y agendarlo directamente.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-1.5 self-start md:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Nuevo Plan Periódico</span>
            </button>
          </div>

          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Total Acuerdos</span>
                <Repeat className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {recurringSchedules.length}
              </div>
              <span className="text-[11px] text-slate-400">Planes activos en cartera</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-800 text-xs mb-1 font-semibold">
                <span>Por Confirmar Día</span>
                <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
              </div>
              <div className="text-2xl font-black text-amber-900">
                {pendingConfirmCount}
              </div>
              <span className="text-[11px] text-amber-700">Próximos 15 días o fecha cumplida</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-800 text-xs mb-1 font-semibold">
                <span>Agendados en Calendario</span>
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900">
                {enrichedRecurring.filter(s => s.status === 'confirmado_agendado').length}
              </div>
              <span className="text-[11px] text-emerald-700">Visita técnica fijada</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
              <div className="flex items-center justify-between text-blue-800 text-xs mb-1 font-semibold">
                <span>En Espera de Ciclo</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900">
                {enrichedRecurring.filter(s => s.effectiveStatus === 'programado').length}
              </div>
              <span className="text-[11px] text-blue-700">Próximos mantenimientos</span>
            </div>
          </div>

          {/* Filtros & Barra de Búsqueda */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Pestañas de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <button
                onClick={() => setRecurringFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  recurringFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({recurringSchedules.length})
              </button>
              <button
                onClick={() => setRecurringFilter('por_confirmar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  recurringFilter === 'por_confirmar'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <span>🚨 Por Confirmar</span>
                <span>({pendingConfirmCount})</span>
              </button>
              <button
                onClick={() => setRecurringFilter('confirmado_agendado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  recurringFilter === 'confirmado_agendado'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                🟢 Agendados ({enrichedRecurring.filter(s => s.status === 'confirmado_agendado').length})
              </button>
              <button
                onClick={() => setRecurringFilter('programado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  recurringFilter === 'programado'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                }`}
              >
                ⏱️ En Espera ({enrichedRecurring.filter(s => s.effectiveStatus === 'programado').length})
              </button>
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recurringSearch}
                onChange={(e) => setRecurringSearch(e.target.value)}
                placeholder="Buscar cliente, teléfono o equipo..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Listado de Tarjetas de Acuerdos Periódicos */}
          {filteredRecurringList.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto text-2xl">
                ⭐
              </div>
              <h4 className="text-base font-bold text-slate-900">No se encontraron mantenimientos periódicos</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No hay planes registrados con los filtros aplicados. Puedes registrar clientes que confirmaron mantenimientos periódicos con el botón superior.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Registrar Primer Plan Periódico
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRecurringList.map((schedule) => {
                const isUrgentToConfirm = schedule.effectiveStatus === 'por_confirmar';
                const isAlreadyScheduled = schedule.status === 'confirmado_agendado';

                return (
                  <div
                    key={schedule.id}
                    className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between space-y-4 shadow-xs relative ${
                      isUrgentToConfirm
                        ? 'border-amber-300 ring-2 ring-amber-400/20'
                        : isAlreadyScheduled
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Badge de Estatus y Días */}
                      <div className="flex items-center justify-between gap-2">
                        {isAlreadyScheduled ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Agendado en Calendario
                          </span>
                        ) : isUrgentToConfirm ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {schedule.daysRemaining <= 0 
                              ? '¡Fecha acordada cumplida!' 
                              : `Por confirmar (Faltan ${schedule.daysRemaining} días)`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            En Espera (Faltan {schedule.daysRemaining} días)
                          </span>
                        )}

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono">
                          Cada {schedule.frequency_months} meses
                        </span>
                      </div>

                      {/* Info del Cliente */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-extrabold text-slate-900 hover:text-cyan-700 transition-colors">
                            {schedule.customer_name}
                          </h4>
                          {onDeleteRecurringSchedule && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar el plan periódico para ${schedule.customer_name}?`)) {
                                  onDeleteRecurringSchedule(schedule.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar acuerdo periódico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`tel:${schedule.customer_phone}`} className="hover:underline font-mono">
                            {schedule.customer_phone}
                          </a>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{schedule.customer_address}{schedule.customer_commune ? `, ${schedule.customer_commune}` : ''}</span>
                        </div>
                      </div>

                      {/* Equipos Incluidos */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-cyan-600" />
                          <span>Equipos en Plan Recurrente:</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium line-clamp-2">
                          {schedule.equipments_summary || 'Equipos de climatización acordados'}
                        </p>
                      </div>

                      {/* Fechas y Notas */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Último Servicio:</span>
                          <span className="font-bold text-slate-800 font-mono text-[11px]">
                            {schedule.start_date || 'No registrado'}
                          </span>
                        </div>
                        <div className={`p-2 rounded-xl border ${
                          isUrgentToConfirm 
                            ? 'bg-amber-50 border-amber-200 text-amber-950' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                          <span className="text-[10px] text-slate-500 block">
                            {isAlreadyScheduled ? 'Fecha Confirmada:' : 'Fecha Estimada:'}
                          </span>
                          <span className="font-bold font-mono text-[11px]">
                            {schedule.confirmed_date || schedule.next_suggested_date}
                          </span>
                        </div>
                      </div>

                      {schedule.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-2 rounded-lg border border-amber-100">
                          "{schedule.notes}"
                        </p>
                      )}
                    </div>

                    {/* Acciones de la Tarjeta */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Botón WhatsApp */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(schedule)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          title="Enviar mensaje por WhatsApp para confirmar día y horario"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Confirmar</span>
                        </button>

                        {/* Botón Agendar Visita Técnica */}
                        <button
                          type="button"
                          onClick={() => handleOpenConfirmSchedule(schedule)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                            isAlreadyScheduled
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>{isAlreadyScheduled ? 'Reagendar Visita' : 'Agendar Visita'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: REGISTRAR NUEVO PLAN PERIÓDICO (NK-053)          */}
      {/* ========================================================= */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  ⭐
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Nuevo Plan Periódico Acordado</h3>
                  <span className="text-xs text-slate-500">Mantenimiento preventivo recurrente pactado con el cliente</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSchedule} className="space-y-3.5 text-xs">
              {/* Selector de Cliente */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cliente</label>
                <select
                  value={formCustId}
                  onChange={(e) => handleSelectCustomerForSchedule(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                >
                  <option value="" disabled>Selecciona un cliente</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.commune || c.city || 'Chile'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Equipos del Cliente */}
              {clientEquipments.length > 0 ? (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Equipos a Incluir en el Plan ({formEqIds.length} seleccionados):
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {clientEquipments.map(eq => (
                      <label 
                        key={eq.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 hover:border-amber-300 cursor-pointer text-xs"
                      >
                        <span className="font-semibold text-slate-800">
                          {eq.brand} {eq.btu} BTU - <span className="text-slate-500 font-normal">{eq.location_in_property}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={formEqIds.includes(eq.id)}
                          onChange={() => handleToggleEquipment(eq.id)}
                          className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  ℹ️ Este cliente no tiene equipos registrados individualmente. El acuerdo se creará para su dirección.
                </div>
              )}

              {/* Frecuencia Pactada */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Frecuencia Pactada</label>
                  <select
                    value={formFreqMonths}
                    onChange={(e) => setFormFreqMonths(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value={3}>Cada 3 meses (Trimestral)</option>
                    <option value={4}>Cada 4 meses (Cuatrimestral)</option>
                    <option value={6}>Cada 6 meses (Semestral)</option>
                    <option value={12}>Cada 12 meses (Anual)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha Primer Servicio / Inicio</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Preferencias de Horario y Técnico */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Horario Preferente</label>
                  <select
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="09:00 - 11:00">09:00 - 11:00 (Mañana 1)</option>
                    <option value="11:30 - 13:30">11:30 - 13:30 (Mañana 2)</option>
                    <option value="14:30 - 16:30">14:30 - 16:30 (Tarde 1)</option>
                    <option value="17:00 - 19:00">17:00 - 19:00 (Tarde 2)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Técnico Preferido</label>
                  <select
                    value={formTechId}
                    onChange={(e) => setFormTechId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Cualquiera disponible</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observaciones del Acuerdo</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: Cliente acordó recordar 1 semana antes. Prefiere atención los días viernes..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer"
                >
                  Guardar Plan Periódico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRMAR Y AGENDAR VISITA EN CALENDARIO (NK-053)*/}
      {/* ========================================================= */}
      {schedulingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Agendar Visita en Calendario</h3>
                  <span className="text-xs text-slate-500">Crear orden de servicio confirmada con el cliente</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del Cliente y Acuerdo */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1 text-amber-950">
              <div className="font-bold text-sm">{schedulingTarget.customer_name}</div>
              <div className="text-[11px] text-amber-800">{schedulingTarget.equipments_summary}</div>
              <div className="text-[11px] text-amber-700">Acuerdo cada {schedulingTarget.frequency_months} meses</div>
            </div>

            <form onSubmit={handleExecuteScheduleOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fecha Definitiva de Atención</label>
                <input
                  type="date"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bloque Horario</label>
                <select
                  value={confirmSlot}
                  onChange={(e) => setConfirmSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="09:00 - 11:00">09:00 - 11:00 (Mañana 1)</option>
                  <option value="11:30 - 13:30">11:30 - 13:30 (Mañana 2)</option>
                  <option value="14:30 - 16:30">14:30 - 16:30 (Tarde 1)</option>
                  <option value="17:00 - 19:00">17:00 - 19:00 (Tarde 2)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Técnico Asignado</label>
                <select
                  value={confirmTechId}
                  onChange={(e) => setConfirmTechId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="" disabled>Selecciona un técnico</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Técnico)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tarifa del Servicio ({settings?.currency_symbol || '$'})</label>
                <input
                  type="number"
                  value={confirmPrice === 0 ? '' : confirmPrice}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setConfirmPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSchedulingTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirmar y Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
