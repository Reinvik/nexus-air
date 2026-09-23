import React, { useState, useMemo } from 'react';
import { ServiceOrder, AirSettings, TechnicianPayout } from '../types';
import { formatAirPrice } from '../lib/countries';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  CreditCard,
  Filter,
  Clock,
  BarChart3,
  CalendarDays,
  X,
  Upload,
  Receipt,
  FileCheck2,
  Trash2,
  Image as ImageIcon,
  MessageSquare,
  Share2,
  Copy,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  format, 
  isToday, 
  isSameDay, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  subWeeks, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  parseISO, 
  isValid 
} from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesAirProps {
  orders: ServiceOrder[];
  settings?: AirSettings;
  technicianPayouts?: TechnicianPayout[];
  onUpdateOrder?: (orderId: string, updates: Partial<ServiceOrder>) => void;
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_30_days' | 'custom';
type ProgressViewMode = 'weekly' | 'daily';

export const SalesAir: React.FC<SalesAirProps> = ({ orders, settings, technicianPayouts = [], onUpdateOrder }) => {
  const currencySymbol = settings?.currency_symbol || '₡';
  const countryCode = settings?.country_code || 'CR';

  // Date Filter State (NK-037)
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [progressViewMode, setProgressViewMode] = useState<ProgressViewMode>('weekly');

  // Tab para historial de movimientos (NK-043)
  const [transactionTab, setTransactionTab] = useState<'todos' | 'ordenes' | 'honorarios'>('todos');

  // Modal para ver detalle de liquidación de egreso (NK-043)
  const [selectedPayoutForView, setSelectedPayoutForView] = useState<TechnicianPayout | null>(null);

  // Payment Confirmation & Collection State (NK-041)
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<ServiceOrder | null>(null);
  const [payStatus, setPayStatus] = useState<'pendiente' | 'pagado' | 'abono'>('pagado');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<ServiceOrder['payment_method']>('transferencia');
  const [payReference, setPayReference] = useState('');
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [payNotes, setPayNotes] = useState('');
  const [payProofUrl, setPayProofUrl] = useState('');

  // Payment Reminder WhatsApp Modal State (NK-044)
  const [selectedOrderForReminder, setSelectedOrderForReminder] = useState<ServiceOrder | null>(null);
  const [reminderPhone, setReminderPhone] = useState('');
  const [reminderBankName, setReminderBankName] = useState('');
  const [reminderAccountType, setReminderAccountType] = useState('');
  const [reminderAccountNumber, setReminderAccountNumber] = useState('');
  const [reminderAccountRut, setReminderAccountRut] = useState('');
  const [reminderAccountEmail, setReminderAccountEmail] = useState('');
  const [reminderCustomMessage, setReminderCustomMessage] = useState('');
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);

  const buildReminderMessage = (
    order: ServiceOrder,
    bName: string,
    bType: string,
    bNum: string,
    bRut: string,
    bEmail: string
  ) => {
    const custName = order.customer?.name ? order.customer.name.split(' ')[0] : 'Estimado/a cliente';
    const compName = settings?.company_name || 'Nexus Air';
    const pendingBalance = Math.max(0, order.total - (order.paid_amount || 0));
    const formattedBalance = formatAirPrice(pendingBalance, currencySymbol, countryCode);

    return `Hola ${custName}, te saludamos de ${compName} 👋\n\nLe recordamos que su orden ${order.ticket_number} por un monto pendiente de ${formattedBalance} se encuentra disponible para su pago o abono.\n\nDatos para transferencia bancaria:\n• Banco: ${bName || settings?.bank_name || 'Por definir'}\n• Tipo de Cuenta: ${bType || settings?.bank_account_type || 'Cuenta Corriente'}\n• N° de Cuenta: ${bNum || settings?.bank_account_number || '---'}\n• RUT: ${bRut || settings?.bank_account_rut || '---'}\n• Email comprobantes: ${bEmail || settings?.bank_account_email || '---'}\n\nPor favor envíenos el comprobante respondiendo a este mensaje para registrarlo de inmediato.\n¡Muchas gracias por su preferencia!`;
  };

  const handleOpenReminderModal = (order: ServiceOrder) => {
    const bName = settings?.bank_name || '';
    const bType = settings?.bank_account_type || '';
    const bNum = settings?.bank_account_number || '';
    const bRut = settings?.bank_account_rut || '';
    const bEmail = settings?.bank_account_email || '';

    setSelectedOrderForReminder(order);
    setReminderPhone(order.customer?.phone || '');
    setReminderBankName(bName);
    setReminderAccountType(bType);
    setReminderAccountNumber(bNum);
    setReminderAccountRut(bRut);
    setReminderAccountEmail(bEmail);
    setIsEditingBankDetails(false);

    setReminderCustomMessage(buildReminderMessage(order, bName, bType, bNum, bRut, bEmail));
  };

  const updateMessageWithBank = (bName: string, bType: string, bNum: string, bRut: string, bEmail: string) => {
    if (!selectedOrderForReminder) return;
    setReminderCustomMessage(buildReminderMessage(selectedOrderForReminder, bName, bType, bNum, bRut, bEmail));
  };

  const handleSendWhatsAppReminder = () => {
    if (!selectedOrderForReminder) return;
    const cleanPhone = (reminderPhone || selectedOrderForReminder.customer?.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      toast.error('No hay un número de teléfono válido para el cliente');
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderCustomMessage)}`;
    window.open(url, '_blank');
    toast.success('Abriendo WhatsApp para enviar recordatorio de cobro');
    setSelectedOrderForReminder(null);
  };

  const handleCopyReminderMessage = () => {
    navigator.clipboard.writeText(reminderCustomMessage);
    toast.success('Mensaje copiado al portapapeles');
  };

  const handleOpenPaymentModal = (order: ServiceOrder) => {
    setSelectedOrderForPayment(order);
    setPayStatus(order.payment_status || 'pagado');
    setPayAmount(order.paid_amount !== undefined ? order.paid_amount : order.total);
    setPayMethod(order.payment_method || 'transferencia');
    setPayReference(order.payment_reference || '');
    setPayDate(order.payment_date || format(new Date(), 'yyyy-MM-dd'));
    setPayNotes(order.payment_notes || '');
    setPayProofUrl(order.payment_proof_url || '');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;

    if (onUpdateOrder) {
      onUpdateOrder(selectedOrderForPayment.id, {
        payment_status: payStatus,
        paid_amount: payAmount,
        payment_method: payMethod,
        payment_reference: payReference.trim(),
        payment_date: payDate,
        payment_notes: payNotes.trim(),
        payment_proof_url: payProofUrl.trim() || undefined,
      });
    }

    toast.success(`Cobro de orden ${selectedOrderForPayment.ticket_number} guardado`);
    setSelectedOrderForPayment(null);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setPayProofUrl(b64);
    };
    reader.readAsDataURL(file);
  };

  // Helper para parsear la fecha de una orden (scheduled_date o created_at)
  const parseOrderDate = (order: ServiceOrder): Date | null => {
    if (order.scheduled_date) {
      const parsed = parseISO(order.scheduled_date);
      if (isValid(parsed)) return parsed;
    }
    if (order.created_at) {
      const parsed = parseISO(order.created_at);
      if (isValid(parsed)) return parsed;
    }
    return null;
  };

  // Filtrar órdenes por fecha seleccionada
  const filteredOrders = useMemo(() => {
    if (selectedPreset === 'all') return orders;

    const now = new Date();

    return orders.filter(o => {
      const d = parseOrderDate(o);
      if (!d) return false;

      switch (selectedPreset) {
        case 'today':
          return isToday(d);
        case 'yesterday':
          return isSameDay(d, subDays(now, 1));
        case 'this_week': {
          const start = startOfWeek(now, { weekStartsOn: 1 });
          const end = endOfWeek(now, { weekStartsOn: 1 });
          return isWithinInterval(d, { start, end });
        }
        case 'last_week': {
          const prevWeek = subWeeks(now, 1);
          const start = startOfWeek(prevWeek, { weekStartsOn: 1 });
          const end = endOfWeek(prevWeek, { weekStartsOn: 1 });
          return isWithinInterval(d, { start, end });
        }
        case 'this_month': {
          const start = startOfMonth(now);
          const end = endOfMonth(now);
          return isWithinInterval(d, { start, end });
        }
        case 'last_30_days': {
          const start = subDays(now, 30);
          return isWithinInterval(d, { start, end: now });
        }
        case 'custom': {
          if (!customStartDate || !customEndDate) return true;
          const start = parseISO(customStartDate);
          const end = parseISO(`${customEndDate}T23:59:59`);
          if (!isValid(start) || !isValid(end)) return true;
          return isWithinInterval(d, { start, end });
        }
        default:
          return true;
      }
    });
  }, [orders, selectedPreset, customStartDate, customEndDate]);

  // Filtrar liquidaciones de técnicos por fecha (NK-043)
  const filteredPayouts = useMemo(() => {
    if (!technicianPayouts || technicianPayouts.length === 0) return [];
    if (selectedPreset === 'all') return technicianPayouts;

    const now = new Date();

    return technicianPayouts.filter(p => {
      if (!p.payment_date) return false;
      const d = parseISO(p.payment_date);
      if (!isValid(d)) return false;

      switch (selectedPreset) {
        case 'today':
          return isToday(d);
        case 'yesterday':
          return isSameDay(d, subDays(now, 1));
        case 'this_week': {
          const start = startOfWeek(now, { weekStartsOn: 1 });
          const end = endOfWeek(now, { weekStartsOn: 1 });
          return isWithinInterval(d, { start, end });
        }
        case 'last_week': {
          const prevWeek = subWeeks(now, 1);
          const start = startOfWeek(prevWeek, { weekStartsOn: 1 });
          const end = endOfWeek(prevWeek, { weekStartsOn: 1 });
          return isWithinInterval(d, { start, end });
        }
        case 'this_month': {
          const start = startOfMonth(now);
          const end = endOfMonth(now);
          return isWithinInterval(d, { start, end });
        }
        case 'last_30_days': {
          const start = subDays(now, 30);
          return isWithinInterval(d, { start, end: now });
        }
        case 'custom': {
          if (!customStartDate || !customEndDate) return true;
          const start = parseISO(customStartDate);
          const end = parseISO(`${customEndDate}T23:59:59`);
          if (!isValid(start) || !isValid(end)) return true;
          return isWithinInterval(d, { start, end });
        }
        default:
          return true;
      }
    });
  }, [technicianPayouts, selectedPreset, customStartDate, customEndDate]);

  // Estadísticas calculadas sobre las órdenes y egresos filtrados (NK-043)
  const stats = useMemo(() => {
    let totalIngresos = 0;
    let totalCobrado = 0;
    let totalPendiente = 0;
    let totalAbonado = 0;
    let totalSubtotal = 0;
    let totalTax = 0;

    let mantencionesTotal = 0;
    let instalacionesTotal = 0;
    let reparacionesTotal = 0;
    let completadas = 0;
    let activas = 0;

    filteredOrders.forEach(o => {
      // Excluir órdenes canceladas de los ingresos
      if (o.status === 'cancelado') return;

      activas++;
      const orderTotal = Number(o.total) || 0;
      const orderSubtotal = o.subtotal !== undefined ? Number(o.subtotal) : orderTotal;
      const orderTax = o.tax !== undefined ? Number(o.tax) : 0;

      totalIngresos += orderTotal;
      totalSubtotal += orderSubtotal;
      totalTax += orderTax;

      if (o.payment_status === 'pagado') {
        totalCobrado += orderTotal;
      } else if (o.payment_status === 'abono') {
        totalAbonado += orderTotal;
      } else {
        totalPendiente += orderTotal;
      }

      const sType = o.service_type || '';
      if (sType.includes('mantencion') || sType === 'recaptacion') {
        mantencionesTotal += orderTotal;
      } else if (sType.includes('instalacion')) {
        instalacionesTotal += orderTotal;
      } else {
        reparacionesTotal += orderTotal;
      }

      if (o.status === 'completado') {
        completadas++;
      }
    });

    const ticketPromedio = activas > 0 ? Math.round(totalIngresos / activas) : 0;
    const totalHonorariosPagados = filteredPayouts.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const balanceNeto = totalCobrado - totalHonorariosPagados;

    return { 
      totalIngresos, 
      totalCobrado,
      totalPendiente,
      totalAbonado,
      totalSubtotal,
      totalTax,
      mantencionesTotal, 
      instalacionesTotal, 
      reparacionesTotal,
      completadas, 
      activas,
      ticketPromedio,
      totalHonorariosPagados,
      balanceNeto
    };
  }, [filteredOrders, filteredPayouts]);

  // Agrupamiento Semanal (NK-037)
  const weeklyProgress = useMemo(() => {
    const map = new Map<string, {
      weekKey: string;
      label: string;
      sublabel: string;
      startDate: Date;
      totalRevenue: number;
      collectedRevenue: number;
      pendingRevenue: number;
      orderCount: number;
      completedCount: number;
      serviceBreakdown: { mantencion: number; instalacion: number; reparacion: number };
      orders: ServiceOrder[];
    }>();

    filteredOrders.forEach(o => {
      const d = parseOrderDate(o);
      if (!d) return;

      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!map.has(weekKey)) {
        map.set(weekKey, {
          weekKey,
          label: `Semana del ${format(weekStart, "d 'de' MMM", { locale: es })}`,
          sublabel: `${format(weekStart, 'dd/MM/yyyy')} al ${format(weekEnd, 'dd/MM/yyyy')}`,
          startDate: weekStart,
          totalRevenue: 0,
          collectedRevenue: 0,
          pendingRevenue: 0,
          orderCount: 0,
          completedCount: 0,
          serviceBreakdown: { mantencion: 0, instalacion: 0, reparacion: 0 },
          orders: []
        });
      }

      const grp = map.get(weekKey)!;
      grp.orders.push(o);
      grp.orderCount++;

      if (o.status !== 'cancelado') {
        const amt = Number(o.total) || 0;
        grp.totalRevenue += amt;
        if (o.payment_status === 'pagado') {
          grp.collectedRevenue += amt;
        } else {
          grp.pendingRevenue += amt;
        }

        const sType = o.service_type || '';
        if (sType.includes('mantencion') || sType === 'recaptacion') {
          grp.serviceBreakdown.mantencion++;
        } else if (sType.includes('instalacion')) {
          grp.serviceBreakdown.instalacion++;
        } else {
          grp.serviceBreakdown.reparacion++;
        }
      }

      if (o.status === 'completado') {
        grp.completedCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [filteredOrders]);

  // Agrupamiento Diario (NK-037)
  const dailyProgress = useMemo(() => {
    const map = new Map<string, {
      dateKey: string;
      label: string;
      isCurrentDay: boolean;
      dateObj: Date;
      totalRevenue: number;
      collectedRevenue: number;
      pendingRevenue: number;
      orderCount: number;
      completedCount: number;
      orders: ServiceOrder[];
    }>();

    filteredOrders.forEach(o => {
      const d = parseOrderDate(o);
      if (!d) return;

      const dateKey = format(d, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        let label = format(d, "EEEE, d 'de' MMMM yyyy", { locale: es });
        label = label.charAt(0).toUpperCase() + label.slice(1);
        if (isToday(d)) label = `Hoy • ${label}`;
        else if (isSameDay(d, subDays(new Date(), 1))) label = `Ayer • ${label}`;

        map.set(dateKey, {
          dateKey,
          label,
          isCurrentDay: isToday(d),
          dateObj: d,
          totalRevenue: 0,
          collectedRevenue: 0,
          pendingRevenue: 0,
          orderCount: 0,
          completedCount: 0,
          orders: []
        });
      }

      const dayGrp = map.get(dateKey)!;
      dayGrp.orders.push(o);
      dayGrp.orderCount++;

      if (o.status !== 'cancelado') {
        const amt = Number(o.total) || 0;
        dayGrp.totalRevenue += amt;
        if (o.payment_status === 'pagado') {
          dayGrp.collectedRevenue += amt;
        } else {
          dayGrp.pendingRevenue += amt;
        }
      }

      if (o.status === 'completado') {
        dayGrp.completedCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [filteredOrders]);

  // Texto descriptivo del filtro activo
  const filterLabel = useMemo(() => {
    switch (selectedPreset) {
      case 'today': return 'Hoy';
      case 'yesterday': return 'Ayer';
      case 'this_week': return 'Esta Semana';
      case 'last_week': return 'Semana Pasada';
      case 'this_month': return 'Este Mes';
      case 'custom': return `${customStartDate} al ${customEndDate}`;
      default: return 'Todo el Historial';
    }
  }, [selectedPreset, customStartDate, customEndDate]);

  // Movimientos unificados de ingresos y egresos (NK-043)
  type MovementItem = 
    | { type: 'order'; date: string; data: ServiceOrder }
    | { type: 'payout'; date: string; data: TechnicianPayout };

  const displayedMovements = useMemo<MovementItem[]>(() => {
    const list: MovementItem[] = [];
    if (transactionTab === 'todos' || transactionTab === 'ordenes') {
      filteredOrders.forEach(o => {
        list.push({
          type: 'order',
          date: o.scheduled_date || o.created_at?.split('T')[0] || '',
          data: o
        });
      });
    }
    if (transactionTab === 'todos' || transactionTab === 'honorarios') {
      filteredPayouts.forEach(p => {
        list.push({
          type: 'payout',
          date: p.payment_date || p.created_at?.split('T')[0] || '',
          data: p
        });
      });
    }

    return list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [transactionTab, filteredOrders, filteredPayouts]);

  return (
    <div className="space-y-6">
      {/* Header Principal con Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Ventas & Métricas Financieras HVAC</h2>
              {selectedPreset !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-bold">
                  {filterLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Rendimiento por venta de equipos, mantenciones e ingresos recurrentes
            </p>
          </div>
        </div>

        {/* Resumen de cobros y balance cuadrado (NK-043) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cobrado: <strong>{formatAirPrice(stats.totalCobrado, currencySymbol, countryCode)}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Honorarios Pagados: <strong>-{formatAirPrice(stats.totalHonorariosPagados, currencySymbol, countryCode)}</strong></span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 font-bold ${
            stats.balanceNeto >= 0
              ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
              : 'bg-rose-100 border-rose-300 text-rose-900'
          }`}>
            <Wallet className="w-3.5 h-3.5 text-cyan-600" />
            <span>Balance Neto: <strong>{formatAirPrice(stats.balanceNeto, currencySymbol, countryCode)}</strong></span>
          </div>
          {stats.totalPendiente > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1.5 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <span>Por Cobrar: <strong>{formatAirPrice(stats.totalPendiente, currencySymbol, countryCode)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Filtro de Fechas (NK-037) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-bold text-slate-700">Filtrar período de ventas:</span>
          </div>

          {selectedPreset !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedPreset('all')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-start md:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar Filtro (Ver Todo)</span>
            </button>
          )}
        </div>

        {/* Botones de Presets de Fecha */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedPreset('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todo el Historial
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'today'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'yesterday'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Ayer
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('this_week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'this_week'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            Esta Semana
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('last_week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'last_week'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semana Pasada
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('this_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'this_month'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            Este Mes
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('last_30_days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'last_30_days'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Últimos 30 Días
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPreset === 'custom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            📅 Personalizado
          </button>
        </div>

        {/* Selector de Rango Personalizado */}
        {selectedPreset === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Desde:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Hasta:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Órdenes filtradas: <strong>{filteredOrders.length}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Vibrant Colored KPI Cards (Estilo Nexus Lean & Flujo Cuadrado NK-043) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facturación Total - Vibrant Purple Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Facturación Activa</span>
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            {formatAirPrice(stats.totalIngresos, currencySymbol, countryCode)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
            <span>{stats.activas} órdenes activas</span>
            <span>Cobrado: {Math.round(stats.totalIngresos > 0 ? (stats.totalCobrado / stats.totalIngresos) * 100 : 0)}%</span>
          </div>
        </div>

        {/* Total Cobrado (+) - Vibrant Emerald Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Ingresos Cobrados (+)</span>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            {formatAirPrice(stats.totalCobrado, currencySymbol, countryCode)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
            <span>En caja / recaudado</span>
            <span>Por cobrar: {formatAirPrice(stats.totalPendiente, currencySymbol, countryCode)}</span>
          </div>
        </div>

        {/* Honorarios Colaboradores (-) - Vibrant Rose Card (NK-043) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Honorarios Técnicos (-)</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            -{formatAirPrice(stats.totalHonorariosPagados, currencySymbol, countryCode)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
            <span>{filteredPayouts.length} liquidaciones pagadas</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">Egreso operativo</span>
          </div>
        </div>

        {/* Balance Neto Cuadrado (=) - Vibrant Cyan/Blue Card (NK-043) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-md shadow-cyan-600/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Balance Neto Cuadrado (=)</span>
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            {formatAirPrice(stats.balanceNeto, currencySymbol, countryCode)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
            <span>Cobros (+) menos Honorarios (-)</span>
            <span className="font-bold">Margen Real</span>
          </div>
        </div>
      </div>

      {/* Resumen secundario de servicios HVAC */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Mantenciones 6M</span>
            <strong className="text-slate-900 font-mono font-bold text-sm">
              {formatAirPrice(stats.mantencionesTotal, currencySymbol, countryCode)}
            </strong>
          </div>
          <ShieldCheck className="w-5 h-5 text-cyan-600" />
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Venta & Instalación</span>
            <strong className="text-slate-900 font-mono font-bold text-sm">
              {formatAirPrice(stats.instalacionesTotal, currencySymbol, countryCode)}
            </strong>
          </div>
          <Layers className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Ticket Promedio</span>
            <strong className="text-slate-900 font-mono font-bold text-sm">
              {formatAirPrice(stats.ticketPromedio, currencySymbol, countryCode)}
            </strong>
          </div>
          <CreditCard className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      {/* Sección Progreso Semanal / Diario (NK-037) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Progreso & Desglose Temporal</h3>
              <p className="text-[11px] text-slate-400">
                Visualización agrupada para control de flujo de caja y ritmo comercial
              </p>
            </div>
          </div>

          {/* Selector de modo Semanal / Diario */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto border border-slate-200">
            <button
              type="button"
              onClick={() => setProgressViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                progressViewMode === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-cyan-600" />
              <span>Progreso Semanal</span>
            </button>
            <button
              type="button"
              onClick={() => setProgressViewMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                progressViewMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Progreso Diario</span>
            </button>
          </div>
        </div>

        {/* Renderizado de Vista Semanal */}
        {progressViewMode === 'weekly' && (
          <div className="space-y-3">
            {weeklyProgress.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No hay ventas registradas en el período seleccionado.
              </div>
            ) : (
              weeklyProgress.map(wk => {
                const percentCollected = wk.totalRevenue > 0 
                  ? Math.round((wk.collectedRevenue / wk.totalRevenue) * 100) 
                  : 0;

                return (
                  <div 
                    key={wk.weekKey}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{wk.label}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({wk.sublabel})</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span>{wk.orderCount} {wk.orderCount === 1 ? 'orden' : 'órdenes'}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">{wk.completedCount} completadas</span>
                          <span>•</span>
                          <span>
                            {wk.serviceBreakdown.mantencion} mantenciones, {wk.serviceBreakdown.instalacion} inst.
                          </span>
                        </div>
                      </div>

                      <div className="text-right sm:self-center">
                        <div className="text-base font-black font-mono text-slate-900">
                          {formatAirPrice(wk.totalRevenue, currencySymbol, countryCode)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-end gap-2">
                          <span className="text-emerald-700 font-medium">
                            Cobrado: {formatAirPrice(wk.collectedRevenue, currencySymbol, countryCode)}
                          </span>
                          {wk.pendingRevenue > 0 && (
                            <span className="text-amber-700 font-medium">
                              (Pendiente: {formatAirPrice(wk.pendingRevenue, currencySymbol, countryCode)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso de cobro */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${percentCollected}%` }}
                          title={`Cobrado: ${percentCollected}%`}
                        />
                        <div 
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${100 - percentCollected}%` }}
                          title={`Pendiente: ${100 - percentCollected}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Cobrado: {percentCollected}%</span>
                        <span>{wk.orderCount} servicios programados</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Renderizado de Vista Diaria */}
        {progressViewMode === 'daily' && (
          <div className="space-y-3">
            {dailyProgress.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No hay ventas registradas en el período seleccionado.
              </div>
            ) : (
              dailyProgress.map(day => (
                <div 
                  key={day.dateKey}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    day.isCurrentDay 
                      ? 'border-cyan-300 bg-cyan-50/40 shadow-2xs' 
                      : 'border-slate-200 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${day.isCurrentDay ? 'text-cyan-950' : 'text-slate-900'}`}>
                          {day.label}
                        </span>
                        {day.isCurrentDay && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider">
                            Hoy
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {day.orderCount} {day.orderCount === 1 ? 'servicio' : 'servicios'} • {day.completedCount} terminados
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <span className="block font-black font-mono text-sm text-slate-900">
                          {formatAirPrice(day.totalRevenue, currencySymbol, countryCode)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          Cobrado: {formatAirPrice(day.collectedRevenue, currencySymbol, countryCode)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista rápida de folios del día */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Folios:</span>
                    {day.orders.map(o => (
                      <span 
                        key={o.id}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          o.payment_status === 'pagado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                        title={`${o.customer?.name || 'Cliente'} - ${formatAirPrice(o.total, currencySymbol, countryCode)}`}
                      >
                        {o.ticket_number} ({o.customer?.name ? o.customer.name.split(' ')[0] : 'S/N'})
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Unified Transactions Table in Crisp White (NK-043 & NK-044) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-800">Historial Detallado de Movimientos</h3>
            <p className="text-[11px] text-slate-500">
              Control integral de flujo: {filteredOrders.length} ventas/ingresos y {filteredPayouts.length} egresos de honorarios
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setTransactionTab('todos')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transactionTab === 'todos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({filteredOrders.length + filteredPayouts.length})
              </button>
              <button
                type="button"
                onClick={() => setTransactionTab('ordenes')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transactionTab === 'ordenes'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ventas ({filteredOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setTransactionTab('honorarios')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transactionTab === 'honorarios'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Honorarios Técnicos ({filteredPayouts.length})
              </button>
            </div>

            {selectedPreset !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
                Filtro: <strong className="text-cyan-700">{filterLabel}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Folio / N°</th>
                <th className="py-3 px-4">Cliente / Beneficiario</th>
                <th className="py-3 px-4">Concepto / Servicio</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Estado Pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No se encontraron movimientos para el filtro y rango de fechas seleccionado.
                  </td>
                </tr>
              ) : (
                displayedMovements.map((item) => {
                  if (item.type === 'order') {
                    const o = item.data;
                    const isCanceled = o.status === 'cancelado';
                    return (
                      <tr key={`ord-${o.id}`} className={`hover:bg-slate-50/80 transition-colors ${isCanceled ? 'bg-slate-50/50 opacity-60' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-700">
                          {o.ticket_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{o.customer?.name}</div>
                          <div className="text-[10px] text-slate-400">{o.customer?.commune}</div>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-700 font-medium">
                          {o.service_type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{o.scheduled_date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            o.status === 'completado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            o.status === 'en_proceso' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            o.status === 'cancelado' ? 'bg-rose-50 text-rose-700 border border-rose-200 line-through' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              o.payment_status === 'pagado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              o.payment_status === 'abono' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {o.payment_status}
                            </span>
                            {o.payment_reference && (
                              <div className="text-[9px] font-mono text-slate-500 font-medium truncate max-w-[120px]" title={o.payment_reference}>
                                Ref: {o.payment_reference}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-black text-sm ${isCanceled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          +{formatAirPrice(o.total, currencySymbol, countryCode)}
                          {o.payment_status === 'abono' && o.paid_amount !== undefined && (
                            <div className="text-[10px] text-emerald-700 font-medium">
                              Abonado: {formatAirPrice(o.paid_amount, currencySymbol, countryCode)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Botón WhatsApp de Recordatorio de Cobro (NK-044) */}
                            {o.payment_status !== 'pagado' && !isCanceled && (
                              <button
                                type="button"
                                onClick={() => handleOpenReminderModal(o)}
                                className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                title="Enviar recordatorio de cobro por WhatsApp con datos bancarios editables"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(o)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                o.payment_status === 'pagado'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : o.payment_status === 'abono'
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                              }`}
                              title="Gestionar estado de pago, número de comprobante o referencia y voucher"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{o.payment_status === 'pagado' ? 'Ver Pago' : 'Registrar Cobro'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Renderizar Egreso de Liquidación a Técnico (NK-043)
                  const p = item.data;
                  return (
                    <tr key={`pay-${p.id}`} className="hover:bg-rose-50/40 bg-rose-50/15 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                          {p.payout_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{p.technician_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {p.technician_role} • Período {p.period_month}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          EGRESO • Liquidación Honorarios
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.payment_date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Liquidado
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                            Pagado ({p.payment_method})
                          </span>
                          {p.payment_reference && (
                            <div className="text-[9px] font-mono text-slate-500 font-medium truncate max-w-[120px]" title={p.payment_reference}>
                              Ref: {p.payment_reference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm text-rose-600">
                        -{formatAirPrice(p.amount, currencySymbol, countryCode)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPayoutForView(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all shadow-2xs cursor-pointer"
                          title="Ver detalle y comprobante de la liquidación de honorarios"
                        >
                          <Receipt className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ver Egreso</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación y Gestión de Cobro (NK-041) */}
      {selectedOrderForPayment && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForPayment(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 my-auto cursor-default text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    Confirmación de Pago
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                      {selectedOrderForPayment.ticket_number}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cliente: <strong className="text-slate-700">{selectedOrderForPayment.customer?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del Monto */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Total del Servicio:</span>
                <span className="font-mono font-black text-base text-slate-900">
                  {formatAirPrice(selectedOrderForPayment.total, currencySymbol, countryCode)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">Estado Actual:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  selectedOrderForPayment.payment_status === 'pagado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  selectedOrderForPayment.payment_status === 'abono' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {selectedOrderForPayment.payment_status}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              {/* Estado de Pago */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Nuevo Estado de Pago:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pagado', label: 'Pagado Total', color: 'peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600' },
                    { id: 'abono', label: 'Abono Parcial', color: 'peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600' },
                    { id: 'pendiente', label: 'Pendiente', color: 'peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500' },
                  ].map((st) => (
                    <label key={st.id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="payStatus"
                        value={st.id}
                        checked={payStatus === st.id}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setPayStatus(val);
                          if (val === 'pagado') {
                            setPayAmount(selectedOrderForPayment.total);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className={`p-2 rounded-xl border border-slate-200 text-center font-bold text-xs transition-all bg-white text-slate-700 hover:bg-slate-50 shadow-2xs ${st.color}`}>
                        {st.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Monto y Método */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Monto Cobrado / Abono:</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">{currencySymbol}</span>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Método de Pago:</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta_debito">Tarjeta de Débito (POS)</option>
                    <option value="tarjeta_credito">Tarjeta de Crédito</option>
                    <option value="sinpe_movil">SINPE Móvil / Pago Móvil</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Referencia y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">N° Transacción / Referencia:</label>
                  <input
                    type="text"
                    placeholder="Ej: TR-994182 o N° Operación"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Fecha de Pago:</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Comprobante / Voucher (NK-041) */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Comprobante de Pago / Voucher (Captura):</label>
                {payProofUrl ? (
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <img src={payProofUrl} alt="Comprobante" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block">Comprobante adjuntado</span>
                        <a href={payProofUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-600 hover:underline">
                          Ver imagen completa
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPayProofUrl('')}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Eliminar comprobante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-300 hover:border-cyan-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Subir foto o captura del comprobante</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG o WebP hasta 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Notas de Pago */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Notas u Observaciones del Cobro:</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ej: Cliente canceló vía transferencia BCI. Comprobante validado por contabilidad..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Guardar Confirmación de Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recordatorio de Cobro por WhatsApp (NK-044) */}
      {selectedOrderForReminder && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForReminder(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 my-auto cursor-default text-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    Recordatorio de Cobro WhatsApp
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                      {selectedOrderForReminder.ticket_number}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cliente: <strong className="text-slate-700">{selectedOrderForReminder.customer?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForReminder(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de la Orden */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Total Orden</span>
                <strong className="font-mono text-slate-800">
                  {formatAirPrice(selectedOrderForReminder.total, currencySymbol, countryCode)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Abonado</span>
                <strong className="font-mono text-emerald-700">
                  {formatAirPrice(selectedOrderForReminder.paid_amount || 0, currencySymbol, countryCode)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block font-bold text-amber-700">Saldo Pendiente</span>
                <strong className="font-mono text-amber-700 text-sm">
                  {formatAirPrice(
                    Math.max(0, selectedOrderForReminder.total - (selectedOrderForReminder.paid_amount || 0)),
                    currencySymbol,
                    countryCode
                  )}
                </strong>
              </div>
            </div>

            {/* Teléfono de Contacto */}
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">
                Teléfono de WhatsApp del Cliente
              </label>
              <input
                type="text"
                value={reminderPhone}
                onChange={(e) => setReminderPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Datos Bancarios Editables (NK-044) */}
            <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-700" />
                  Datos Bancarios para la Transferencia
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingBankDetails(!isEditingBankDetails)}
                  className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
                >
                  {isEditingBankDetails ? 'Listo' : 'Modificar Datos'}
                </button>
              </div>

              {isEditingBankDetails ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Banco</label>
                    <input
                      type="text"
                      value={reminderBankName}
                      onChange={(e) => {
                        setReminderBankName(e.target.value);
                        updateMessageWithBank(e.target.value, reminderAccountType, reminderAccountNumber, reminderAccountRut, reminderAccountEmail);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      placeholder="Banco Santander"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Tipo de Cuenta</label>
                    <input
                      type="text"
                      value={reminderAccountType}
                      onChange={(e) => {
                        setReminderAccountType(e.target.value);
                        updateMessageWithBank(reminderBankName, e.target.value, reminderAccountNumber, reminderAccountRut, reminderAccountEmail);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      placeholder="Cuenta Corriente"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">N° de Cuenta</label>
                    <input
                      type="text"
                      value={reminderAccountNumber}
                      onChange={(e) => {
                        setReminderAccountNumber(e.target.value);
                        updateMessageWithBank(reminderBankName, reminderAccountType, e.target.value, reminderAccountRut, reminderAccountEmail);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">RUT / ID Titular</label>
                    <input
                      type="text"
                      value={reminderAccountRut}
                      onChange={(e) => {
                        setReminderAccountRut(e.target.value);
                        updateMessageWithBank(reminderBankName, reminderAccountType, reminderAccountNumber, e.target.value, reminderAccountEmail);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      placeholder="76.123.456-7"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Email Comprobantes</label>
                    <input
                      type="email"
                      value={reminderAccountEmail}
                      onChange={(e) => {
                        setReminderAccountEmail(e.target.value);
                        updateMessageWithBank(reminderBankName, reminderAccountType, reminderAccountNumber, reminderAccountRut, e.target.value);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      placeholder="pagos@empresa.com"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Banco:</span>
                    <strong className="font-semibold">{reminderBankName || 'No definido'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cuenta:</span>
                    <span className="font-mono">{reminderAccountType || 'Cta. Cte.'} N° {reminderAccountNumber || '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RUT:</span>
                    <span className="font-mono">{reminderAccountRut || '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span>{reminderAccountEmail || '---'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mensaje Editable */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold block text-xs">
                  Mensaje para el Cliente (Editable)
                </label>
                <button
                  type="button"
                  onClick={handleCopyReminderMessage}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Copiar Texto
                </button>
              </div>
              <textarea
                rows={6}
                value={reminderCustomMessage}
                onChange={(e) => setReminderCustomMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed font-sans focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Puedes personalizar cualquier línea del texto antes de enviar al cliente por WhatsApp.
              </span>
            </div>

            {/* Botones */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForReminder(null)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppReminder}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-600/25 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Liquidación / Egreso (NK-043) */}
      {selectedPayoutForView && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayoutForView(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 my-auto cursor-default text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Comprobante de Egreso</h3>
                  <span className="text-xs font-mono font-bold text-rose-700">{selectedPayoutForView.payout_number}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayoutForView(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1">
                <span className="text-rose-700 block font-semibold">Monto Pagado (Egreso):</span>
                <strong className="font-mono text-2xl font-black text-rose-900 block">
                  -{formatAirPrice(selectedPayoutForView.amount, currencySymbol, countryCode)}
                </strong>
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Colaborador:</span>
                  <strong className="text-slate-900">{selectedPayoutForView.technician_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rol Operativo:</span>
                  <span className="capitalize text-slate-700 font-medium">{selectedPayoutForView.technician_role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Período Liquidado:</span>
                  <span className="font-mono font-bold text-cyan-800">{selectedPayoutForView.period_month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de Pago:</span>
                  <span className="font-mono text-slate-800">{selectedPayoutForView.payment_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Método de Pago:</span>
                  <span className="capitalize text-slate-800 font-medium">{selectedPayoutForView.payment_method}</span>
                </div>
                {selectedPayoutForView.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Referencia:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedPayoutForView.payment_reference}</span>
                  </div>
                )}
                {selectedPayoutForView.order_ids && selectedPayoutForView.order_ids.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Órdenes Asociadas:</span>
                    <span className="font-mono text-slate-800">{selectedPayoutForView.order_ids.length} órdenes</span>
                  </div>
                )}
                {selectedPayoutForView.notes && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-slate-500 block mb-0.5">Notas:</span>
                    <p className="text-slate-700 text-[11px] leading-relaxed italic">{selectedPayoutForView.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayoutForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
