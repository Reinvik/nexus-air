import React, { useState, useMemo } from 'react';
import { Technician, ServiceOrder, AirSettings, TechnicianPayout } from '../types';
import { 
  Wrench, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  UserCheck, 
  Users, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  FileText, 
  Printer, 
  Share2, 
  TrendingUp, 
  Award, 
  Filter,
  CheckCircle2,
  HardHat,
  Sparkles,
  CreditCard,
  Receipt,
  Banknote,
  Upload,
  Image as ImageIcon,
  Paperclip,
  MinusCircle,
  Eye,
  Check
} from 'lucide-react';
import { formatAirPrice } from '../lib/countries';
import { format } from 'date-fns';

interface TechniciansAirProps {
  technicians: Technician[];
  orders?: ServiceOrder[];
  settings?: AirSettings;
  technicianPayouts?: TechnicianPayout[];
  onAddTechnician: (tech: Omit<Technician, 'id'>) => void;
  onUpdateTechnician: (id: string, updates: Partial<Technician>) => void;
  onDeleteTechnician?: (id: string) => void;
  onAddTechnicianPayout?: (payout: Omit<TechnicianPayout, 'id' | 'company_id' | 'created_at'>) => Promise<any> | void;
  onDeleteTechnicianPayout?: (id: string) => Promise<any> | void;
  onNavigateToPayroll?: () => void;
}

export const TechniciansAir: React.FC<TechniciansAirProps> = ({
  technicians,
  orders = [],
  settings,
  technicianPayouts = [],
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
  onAddTechnicianPayout,
  onDeleteTechnicianPayout,
  onNavigateToPayroll,
}) => {
  const [roleFilter, setRoleFilter] = useState<'todos' | 'tecnico' | 'ayudante'>('todos');
  
  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [selectedTechForSettlement, setSelectedTechForSettlement] = useState<Technician | null>(null);
  const [liquidatingTech, setLiquidatingTech] = useState<Technician | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null); // NK-065: Visor de comprobante adjunto

  // Form State para Liquidar Pago o Adelanto (NK-043 & NK-065)
  const [payoutType, setPayoutType] = useState<'liquidacion' | 'adelanto'>('liquidacion');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutDate, setPayoutDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [payoutMethod, setPayoutMethod] = useState<'transferencia' | 'efectivo' | 'cheque' | 'otro'>('transferencia');
  const [payoutReference, setPayoutReference] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>(''); // NK-065: Comprobante en base64/url


  // Form State para Agregar
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('+506 ');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'tecnico' | 'ayudante'>('tecnico');
  const [secCertified, setSecCertified] = useState(true);
  const [certNumber, setCertNumber] = useState('SEC-HVAC-');

  // Comisiones diferenciadas por tipo de trabajo (NK-012)
  const [commMantType, setCommMantType] = useState<'fixed' | 'percentage'>('fixed');
  const [commMantVal, setCommMantVal] = useState<number>(20000);
  const [commInstType, setCommInstType] = useState<'fixed' | 'percentage'>('fixed');
  const [commInstVal, setCommInstVal] = useState<number>(35000);
  const [commRepType, setCommRepType] = useState<'fixed' | 'percentage'>('fixed');
  const [commRepVal, setCommRepVal] = useState<number>(15000);

  // Form State para Editar
  const [editName, setEditName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'tecnico' | 'ayudante'>('tecnico');
  const [editSecCertified, setEditSecCertified] = useState(false);
  const [editCertNumber, setEditCertNumber] = useState('');
  const [editStatus, setEditStatus] = useState<'disponible' | 'en_servicio' | 'vacaciones' | 'inactivo'>('disponible');

  const [editCommMantType, setEditCommMantType] = useState<'fixed' | 'percentage'>('fixed');
  const [editCommMantVal, setEditCommMantVal] = useState<number>(20000);
  const [editCommInstType, setEditCommInstType] = useState<'fixed' | 'percentage'>('fixed');
  const [editCommInstVal, setEditCommInstVal] = useState<number>(35000);
  const [editCommRepType, setEditCommRepType] = useState<'fixed' | 'percentage'>('fixed');
  const [editCommRepVal, setEditCommRepVal] = useState<number>(15000);

  // Filtro de mes para liquidaciones (por defecto mes actual: YYYY-MM)
  const currentMonthStr = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const currencySymbol = settings?.currency_symbol || '₡';
  const countryCode = settings?.country_code || 'CR';

  // Filtrado de técnicos según rol
  const filteredTechnicians = useMemo(() => {
    if (roleFilter === 'todos') return technicians;
    return technicians.filter(t => (t.role || 'tecnico') === roleFilter);
  }, [technicians, roleFilter]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setEditingTech(null);
        setSelectedTechForSettlement(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cálculo de liquidaciones y comisiones por colaborador para el mes seleccionado
  const techSettlementMap = useMemo(() => {
    const map = new Map<string, {
      completedCount: number;
      totalCommission: number;
      services: {
        order: ServiceOrder;
        serviceName: string;
        roleInService: 'Técnico Líder' | 'Ayudante';
        commissionEarned: number;
      }[];
    }>();

    technicians.forEach(t => {
      map.set(t.id, {
        completedCount: 0,
        totalCommission: 0,
        services: []
      });
    });

    orders.forEach(order => {
      if (order.status !== 'completado') return;
      
      const orderDate = order.completed_at || order.scheduled_date || '';
      if (!orderDate.startsWith(selectedMonth)) return;

      const orderTotal = order.total || 0;
      const sType = order.service_type || 'mantencion_preventiva';
      const prettyServiceName = 
        sType === 'mantencion_preventiva' || sType === 'mantenimiento_preventivo' ? 'Mantenimiento Preventivo' :
        sType === 'instalacion' ? 'Instalación de Equipo' :
        sType === 'reparacion' ? 'Reparación / Corrección' :
        sType === 'recaptacion' ? 'Recaptación 6M' :
        sType.replace('_', ' ');

      // Si es el técnico líder asignado
      if (order.assigned_technician_id && map.has(order.assigned_technician_id)) {
        const item = map.get(order.assigned_technician_id)!;
        const tech = technicians.find(t => t.id === order.assigned_technician_id);
        let comm = 0;

        // Si la orden trae valor explícito asignado
        if (order.technician_payout_value !== undefined && order.technician_payout_value > 0) {
          const pType = order.technician_payout_type || 'fixed';
          comm = pType === 'percentage'
            ? Math.round((orderTotal * order.technician_payout_value) / 100)
            : order.technician_payout_value;
        } else if (tech) {
          // Si no, tomar la comisión pactada por tipo de servicio
          if (sType === 'instalacion') {
            const pType = tech.commission_instalacion_type || 'fixed';
            const val = tech.commission_instalacion_value ?? 35000;
            comm = pType === 'percentage' ? Math.round((orderTotal * val) / 100) : val;
          } else if (sType === 'mantencion_preventiva' || sType === 'mantenimiento_preventivo' || sType === 'recaptacion') {
            const pType = tech.commission_mantencion_type || 'fixed';
            const val = tech.commission_mantencion_value ?? 20000;
            comm = pType === 'percentage' ? Math.round((orderTotal * val) / 100) : val;
          } else {
            const pType = tech.commission_reparacion_type || tech.default_commission_type || 'fixed';
            const val = tech.commission_reparacion_value ?? tech.default_commission_value ?? 15000;
            comm = pType === 'percentage' ? Math.round((orderTotal * val) / 100) : val;
          }
        }

        item.completedCount += 1;
        item.totalCommission += comm;
        item.services.push({
          order,
          serviceName: prettyServiceName,
          roleInService: 'Técnico Líder',
          commissionEarned: comm
        });
      }

      // Si es el ayudante asignado
      if (order.assigned_assistant_id && map.has(order.assigned_assistant_id)) {
        const item = map.get(order.assigned_assistant_id)!;
        const asst = technicians.find(t => t.id === order.assigned_assistant_id);
        let comm = 0;

        if (order.assistant_payout_value !== undefined && order.assistant_payout_value > 0) {
          const pType = order.assistant_payout_type || 'fixed';
          comm = pType === 'percentage'
            ? Math.round((orderTotal * order.assistant_payout_value) / 100)
            : order.assistant_payout_value;
        } else if (asst) {
          if (sType === 'instalacion') {
            const pType = asst.commission_instalacion_type || 'fixed';
            const val = asst.commission_instalacion_value ?? 25000;
            comm = pType === 'percentage' ? Math.round((orderTotal * val) / 100) : val;
          } else if (sType === 'mantencion_preventiva' || sType === 'mantenimiento_preventivo' || sType === 'recaptacion') {
            const pType = asst.commission_mantencion_type || 'fixed';
            const val = asst.commission_mantencion_value ?? 10000;
            comm = pType === 'percentage' ? Math.round((orderTotal * val) / 100) : val;
          } else {
            const pType = asst.commission_reparacion_type || asst.default_commission_type || 'fixed';
            const val = asst.commission_reparacion_value ?? asst.default_commission_value ?? 8000;
            comm = pType === 'percentage' ? Math.round((orderTotal * val) / 100) : val;
          }
        }

        item.completedCount += 1;
        item.totalCommission += comm;
        item.services.push({
          order,
          serviceName: prettyServiceName,
          roleInService: 'Ayudante',
          commissionEarned: comm
        });
      }
    });

    return map;
  }, [technicians, orders, selectedMonth]);

  // Helpers para Liquidación de Honorarios y Múltiples Pagos / Adelantos (NK-043 & NK-065)
  const getTechPayouts = (techId: string, month: string) => {
    return (technicianPayouts || [])
      .filter(p => p.technician_id === techId && p.period_month === month)
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
  };

  const getExistingPayout = (techId: string, month: string) => {
    const list = getTechPayouts(techId, month);
    return list.length > 0 ? list[list.length - 1] : undefined;
  };

  // Totales globales del mes con cálculo exacto de saldo pendiente vs liquidado (NK-043 & NK-065 fix)
  const monthGlobalStats = useMemo(() => {
    let totalCommissions = 0;
    let totalOrders = 0;
    let totalLiquidated = 0;
    let totalPending = 0;
    let activeWorkers = 0;
    let pendingWorkers = 0;
    let liquidatedWorkers = 0;

    techSettlementMap.forEach((val, techId) => {
      totalCommissions += val.totalCommission;
      totalOrders += val.completedCount;
      if (val.completedCount > 0) activeWorkers += 1;

      const techPaid = (technicianPayouts || [])
        .filter(p => p.technician_id === techId && p.period_month === selectedMonth)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      totalLiquidated += techPaid;
      const remaining = Math.max(0, val.totalCommission - techPaid);
      totalPending += remaining;

      if (remaining > 0) {
        pendingWorkers += 1;
      } else if (val.totalCommission > 0 && techPaid >= val.totalCommission) {
        liquidatedWorkers += 1;
      }
    });

    return { 
      totalCommissions, 
      totalOrders, 
      totalLiquidated,
      totalPending,
      activeWorkers,
      pendingWorkers,
      liquidatedWorkers
    };
  }, [techSettlementMap, technicianPayouts, selectedMonth]);

  const handleOpenLiquidation = (tech: Technician, mode: 'liquidacion' | 'adelanto' = 'liquidacion') => {
    const settlement = techSettlementMap.get(tech.id) || { completedCount: 0, totalCommission: 0, services: [] };
    const payouts = getTechPayouts(tech.id, selectedMonth);
    const totalPaid = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingBalance = Math.max(0, settlement.totalCommission - totalPaid);

    setLiquidatingTech(tech);
    setPayoutType(mode);
    setPayoutAmount(mode === 'liquidacion' ? (pendingBalance > 0 ? pendingBalance : settlement.totalCommission) : 0);
    setPayoutDate(format(new Date(), 'yyyy-MM-dd'));
    setPayoutMethod('transferencia');
    setPayoutReference('');
    setPaymentProofUrl('');
    setPayoutNotes(
      mode === 'liquidacion'
        ? `Liquidación de honorarios correspondiente al período ${selectedMonth}.`
        : `Adelanto / Préstamo solicitado a cuenta de honorarios período ${selectedMonth}.`
    );
  };

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('El comprobante no debe superar los 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentProofUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liquidatingTech || !onAddTechnicianPayout) return;
    const settlement = techSettlementMap.get(liquidatingTech.id) || { completedCount: 0, totalCommission: 0, services: [] };

    await onAddTechnicianPayout({
      technician_id: liquidatingTech.id,
      technician_name: liquidatingTech.name,
      technician_role: liquidatingTech.role || 'tecnico',
      period_month: selectedMonth,
      payout_type: payoutType,
      amount: Number(payoutAmount) || 0,
      payment_date: payoutDate,
      payment_method: payoutMethod,
      payment_reference: payoutReference.trim(),
      payment_proof_url: paymentProofUrl || undefined,
      notes: payoutNotes.trim(),
      order_ids: settlement.services.map(s => s.order.id)
    });

    setLiquidatingTech(null);
    setPaymentProofUrl('');
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (t: Technician) => {
    setEditingTech(t);
    setEditName(t.name);
    setEditRut(t.rut);
    setEditPhone(t.phone);
    setEditEmail(t.email || '');
    setEditRole(t.role === 'ayudante' ? 'ayudante' : 'tecnico');
    setEditSecCertified(Boolean(t.sec_certified));
    setEditCertNumber(t.certification_number || '');
    setEditStatus(t.status || 'disponible');

    // Tarifas
    const isAyud = t.role === 'ayudante';
    setEditCommMantType(t.commission_mantencion_type || 'fixed');
    setEditCommMantVal(t.commission_mantencion_value ?? (isAyud ? 10000 : 20000));
    setEditCommInstType(t.commission_instalacion_type || 'fixed');
    setEditCommInstVal(t.commission_instalacion_value ?? (isAyud ? 25000 : 35000));
    setEditCommRepType(t.commission_reparacion_type || 'fixed');
    setEditCommRepVal(t.commission_reparacion_value ?? (isAyud ? 8000 : 15000));
  };

  // Submit Agregar
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTechnician({
      name,
      rut,
      phone,
      email: email || undefined,
      role,
      sec_certified: role === 'tecnico' ? secCertified : false,
      certification_number: role === 'tecnico' && secCertified ? certNumber : undefined,
      default_commission_type: commMantType,
      default_commission_value: commMantVal,
      commission_mantencion_type: commMantType,
      commission_mantencion_value: commMantVal,
      commission_instalacion_type: commInstType,
      commission_instalacion_value: commInstVal,
      commission_reparacion_type: commRepType,
      commission_reparacion_value: commRepVal,
      status: 'disponible',
    });
    setIsAddModalOpen(false);
    setName('');
    setRut('');
    setEmail('');
  };

  // Submit Editar
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech) return;

    onUpdateTechnician(editingTech.id, {
      name: editName,
      rut: editRut,
      phone: editPhone,
      email: editEmail || undefined,
      role: editRole,
      sec_certified: editRole === 'tecnico' ? editSecCertified : false,
      certification_number: editRole === 'tecnico' && editSecCertified ? editCertNumber : undefined,
      default_commission_type: editCommMantType,
      default_commission_value: editCommMantVal,
      commission_mantencion_type: editCommMantType,
      commission_mantencion_value: editCommMantVal,
      commission_instalacion_type: editCommInstType,
      commission_instalacion_value: editCommInstVal,
      commission_reparacion_type: editCommRepType,
      commission_reparacion_value: editCommRepVal,
      status: editStatus,
    });
    setEditingTech(null);
  };

  // Eliminar
  const handleDeleteTech = (t: Technician) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${t.name} (${t.role === 'ayudante' ? 'Ayudante' : 'Técnico'})?`)) {
      if (onDeleteTechnician) {
        onDeleteTechnician(t.id);
      }
    }
  };

  // Generar WhatsApp de liquidación con desglose de servicios (+), pagos previos (-) y saldo pendiente (NK-065)
  const handleSendWhatsAppSettlement = (t: Technician) => {
    const settlement = techSettlementMap.get(t.id);
    if (!settlement) return;

    const payouts = getTechPayouts(t.id, selectedMonth);
    const totalPaid = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingBalance = Math.max(0, settlement.totalCommission - totalPaid);

    let message = `*LIQUIDACIÓN DE PAGO DE SERVICIOS HVAC* ❄️\n` +
      `👤 Colaborador: *${t.name}* (${t.role === 'ayudante' ? 'Ayudante' : 'Técnico Líder'})\n` +
      `📅 Período: *${selectedMonth}*\n` +
      `🔧 Servicios Realizados: *${settlement.completedCount}*\n` +
      `📈 *Comisiones Generadas:* ${formatAirPrice(settlement.totalCommission, currencySymbol, countryCode)}\n`;

    if (totalPaid > 0) {
      message += `💸 *Total Ya Pagado / Liquidado:* -${formatAirPrice(totalPaid, currencySymbol, countryCode)}\n`;
    }

    message += `💰 *SALDO PENDIENTE A LIQUIDAR:* *${formatAirPrice(pendingBalance, currencySymbol, countryCode)}*\n\n`;

    if (settlement.services.length > 0) {
      message += `*📋 Detalle de Trabajos Realizados (+):*\n` +
        settlement.services.map((s, i) => `${i + 1}. #${s.order.ticket_number} • ${s.serviceName}\n   Cliente: ${s.order.customer?.name || 'Cliente Particular'}\n   Pago: *+${formatAirPrice(s.commissionEarned, currencySymbol, countryCode)}*`).join('\n\n') +
        `\n\n`;
    }

    if (payouts.length > 0) {
      message += `*🧾 Pagos y Adelantos Realizados (-):*\n` +
        payouts.map((p, i) => `${i + 1}. [${p.payment_date}] ${p.payout_type === 'adelanto' ? 'Adelanto / Préstamo' : 'Liquidación'}: *-${formatAirPrice(p.amount, currencySymbol, countryCode)}* ${p.payment_reference ? `(Ref: ${p.payment_reference})` : ''}`).join('\n') +
        `\n\n`;
    }

    message += `_Generado automáticamente por ${settings?.company_name || 'Nexus Air'}_`;

    const cleanPhone = t.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Role Badges Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Equipo Técnico & Ayudantes HVAC</h2>
            <p className="text-xs text-slate-500">
              Control de personal operativo, tarifas por tipo de servicio y liquidación de pagos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToPayroll && (
            <button
              type="button"
              onClick={onNavigateToPayroll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Banknote className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              <span>Sueldos & Nómina</span>
            </button>
          )}

          <button
            onClick={() => {
              setRole('tecnico');
              setCommMantVal(20000);
              setCommInstVal(35000);
              setCommRepVal(15000);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Personal</span>
          </button>
        </div>
      </div>

      {/* KPI Liquidaciones y Acumulado Mensual (NK-012) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">
              Resumen Acumulado de Liquidaciones Técnicas
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">Período Mensual:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
              <span>Pendiente por Liquidar</span>
              {monthGlobalStats.totalPending === 0 ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Al día
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {monthGlobalStats.pendingWorkers} pendiente{monthGlobalStats.pendingWorkers !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <span className={`text-xl sm:text-2xl font-black font-mono ${
              monthGlobalStats.totalPending === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {formatAirPrice(monthGlobalStats.totalPending, currencySymbol, countryCode)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
              <span>Total Ya Liquidado</span>
              <span className="text-[10px] text-emerald-300/80 font-mono">
                {monthGlobalStats.liquidatedWorkers} pagado{monthGlobalStats.liquidatedWorkers !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatAirPrice(monthGlobalStats.totalLiquidated, currencySymbol, countryCode)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium mb-1">Total Comisiones Mes</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {formatAirPrice(monthGlobalStats.totalCommissions, currencySymbol, countryCode)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium mb-1">Servicios Realizados</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {monthGlobalStats.totalOrders} órdenes
            </span>
          </div>
        </div>
      </div>

      {/* Role Filter Tabs (NK-029) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setRoleFilter('todos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            roleFilter === 'todos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Todos ({technicians.length})</span>
        </button>

        <button
          onClick={() => setRoleFilter('tecnico')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            roleFilter === 'tecnico'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Técnicos Líderes ({technicians.filter(t => (t.role || 'tecnico') === 'tecnico').length})</span>
        </button>

        <button
          onClick={() => setRoleFilter('ayudante')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            roleFilter === 'ayudante'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          <span>Ayudantes & Asistentes ({technicians.filter(t => t.role === 'ayudante').length})</span>
        </button>
      </div>

      {/* Grid de Técnicos y Ayudantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTechnicians.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center bg-white border border-slate-200/90 rounded-2xl space-y-3">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No hay técnicos o ayudantes registrados</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Registra a los colaboradores de terreno para asignar órdenes de trabajo y calcular liquidaciones automáticas de comisión.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2 mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Colaborador</span>
            </button>
          </div>
        ) : (
          filteredTechnicians.map((t) => {
          const settlement = techSettlementMap.get(t.id) || { completedCount: 0, totalCommission: 0, services: [] };
          const isAyudante = t.role === 'ayudante';

          const mantVal = t.commission_mantencion_value ?? (isAyudante ? 10000 : 20000);
          const instVal = t.commission_instalacion_value ?? (isAyudante ? 25000 : 35000);

          return (
            <div
              key={t.id}
              className={`p-5 rounded-2xl bg-white border space-y-4 shadow-xs transition-all ${
                isAyudante ? 'border-amber-200 hover:border-amber-400' : 'border-slate-200/90 hover:border-cyan-400'
              }`}
            >
              {/* Header de Tarjeta */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isAyudante 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}>
                      {isAyudante ? '👷 Ayudante' : '🔧 Técnico Líder'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{t.rut}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar tarifas y datos"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteTechnician && (
                    <button
                      onClick={() => handleDeleteTech(t)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar colaborador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Badge SEC o Asistencia */}
              {!isAyudante ? (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">Certificación SEC</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-900 font-bold">
                    {t.sec_certified ? (t.certification_number || 'Acreditado') : 'No Registrado'}
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-800">
                    <HardHat className="w-4 h-4 text-amber-600" />
                    <span className="font-bold">Asistente Operativo</span>
                  </div>
                  <span className="text-[11px] text-amber-900 font-bold">
                    Apoyo en Terreno HVAC
                  </span>
                </div>
              )}

              {/* Datos de Contacto */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-800 font-medium">{t.phone}</span>
                </div>
                {t.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate text-slate-600">{t.email}</span>
                  </div>
                )}
              </div>

              {/* Tarifas pactadas por tipo de servicio (NK-012) */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Tarifas Pactadas por Servicio:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Mantenimiento:</span>
                    <strong className="text-slate-900 font-mono">
                      {t.commission_mantencion_type === 'percentage'
                        ? `${mantVal}%`
                        : formatAirPrice(mantVal, currencySymbol, countryCode)}
                    </strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Instalación:</span>
                    <strong className="text-cyan-800 font-mono">
                      {t.commission_instalacion_type === 'percentage'
                        ? `${instVal}%`
                        : formatAirPrice(instVal, currencySymbol, countryCode)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Resumen de Liquidación del Mes (NK-012, NK-043 & NK-065) */}
              {(() => {
                const payoutsThisMonth = getTechPayouts(t.id, selectedMonth);
                const totalPaid = payoutsThisMonth.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const pendingBalance = Math.max(0, settlement.totalCommission - totalPaid);
                const isSettled = settlement.totalCommission > 0 && pendingBalance === 0;
                const isPartial = totalPaid > 0 && pendingBalance > 0;

                return (
                  <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isSettled 
                      ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-emerald-300' 
                      : isPartial
                        ? 'bg-gradient-to-br from-amber-50/60 to-orange-50/30 border-amber-300'
                        : 'bg-gradient-to-br from-cyan-50/50 to-blue-50/30 border-cyan-200/80'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isSettled ? 'text-emerald-800' : isPartial ? 'text-amber-900' : 'text-cyan-800'}`}>
                        Liquidación ({selectedMonth}):
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{settlement.completedCount} servicios</span>
                    </div>

                    {/* Desglose resumido de montos */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Comisiones generadas:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatAirPrice(settlement.totalCommission, currencySymbol, countryCode)}
                        </span>
                      </div>

                      {totalPaid > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-700 font-medium">Ya Liquidado / Pagado:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            -{formatAirPrice(totalPaid, currencySymbol, countryCode)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-xs font-bold text-slate-700">
                          {isSettled ? 'Estado:' : 'Saldo Pendiente:'}
                        </span>
                        <span className={`font-mono font-black text-sm ${
                          isSettled 
                            ? 'text-emerald-700' 
                            : isPartial 
                              ? 'text-amber-600' 
                              : 'text-cyan-900'
                        }`}>
                          {isSettled ? 'Al Día' : formatAirPrice(pendingBalance, currencySymbol, countryCode)}
                        </span>
                      </div>
                    </div>

                    {/* Historial de pagos y adelantos realizados */}
                    {payoutsThisMonth.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {payoutsThisMonth.map((p, pIdx) => (
                          <div key={p.id || pIdx} className="p-1.5 rounded-lg bg-white/90 border border-slate-200 text-[10px] flex items-center justify-between shadow-2xs">
                            <span className="font-medium flex items-center gap-1 text-slate-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              {p.payout_type === 'adelanto' ? 'Adelanto' : 'Pagado'} {p.payment_date}:
                              <strong className="font-mono font-bold text-slate-900">
                                {formatAirPrice(p.amount, currencySymbol, countryCode)}
                              </strong>
                            </span>
                            <div className="flex items-center gap-1">
                              {p.payment_proof_url && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingProofUrl(p.payment_proof_url!);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-cyan-100 hover:bg-cyan-200 text-cyan-800 font-bold text-[9px] flex items-center gap-0.5 cursor-pointer"
                                  title="Ver comprobante de transferencia"
                                >
                                  <Paperclip className="w-2.5 h-2.5" />
                                  <span>Voucher</span>
                                </button>
                              )}
                              {p.payment_reference && (
                                <span className="font-mono text-slate-400 text-[9px] truncate max-w-[70px]" title={p.payment_reference}>
                                  {p.payment_reference}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botonera de la tarjeta */}
                    <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedTechForSettlement(t)}
                        className="flex-1 min-w-[65px] flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Detalle</span>
                      </button>

                      {pendingBalance > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenLiquidation(t, 'liquidacion')}
                          className="flex-1 min-w-[75px] flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                          title="Liquidar saldo pendiente de comisiones"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-white" />
                          <span>Liquidar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedTechForSettlement(t)}
                          className="flex-1 min-w-[75px] flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                          title="Comisiones al día. Clic para ver comprobante."
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Liquidado</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenLiquidation(t, 'adelanto')}
                        className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                        title="Registrar un adelanto o préstamo para este colaborador"
                      >
                        <Plus className="w-3 h-3 text-amber-700" />
                        <span>Adelanto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppSettlement(t)}
                        disabled={settlement.completedCount === 0 && payoutsThisMonth.length === 0}
                        className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white transition-colors cursor-pointer shadow-2xs"
                        title="Enviar estado de liquidación por WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        }))}
      </div>

      {/* Modal Agregar Personal (NK-029 & NK-012) */}
      {isAddModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl my-6 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registrar Colaborador HVAC</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              {/* Selector de Rol */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Rol en Terreno</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('tecnico');
                      setCommMantVal(20000);
                      setCommInstVal(35000);
                      setCommRepVal(15000);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      role === 'tecnico'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🔧 Técnico Líder
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('ayudante');
                      setCommMantVal(10000);
                      setCommInstVal(25000);
                      setCommRepVal(8000);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      role === 'ayudante'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    👷 Ayudante / Asistente
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marcelo Díaz"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">Identificación / Cédula</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="1-1234-0567"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Teléfono Celular</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tecnico@nexusair.cl"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                />
              </div>

              {/* Certificación SEC solo para técnicos */}
              {role === 'tecnico' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secCertified}
                      onChange={(e) => setSecCertified(e.target.checked)}
                      className="w-4 h-4 accent-cyan-600 rounded"
                    />
                    <span className="font-bold text-slate-800">Cuenta con Certificación SEC Climatización</span>
                  </label>
                  {secCertified && (
                    <input
                      type="text"
                      value={certNumber}
                      onChange={(e) => setCertNumber(e.target.value)}
                      placeholder="Número de registro SEC (ej: SEC-HVAC-9940)"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                    />
                  )}
                </div>
              )}

              {/* Tarifas Diferenciadas por Tipo de Trabajo (NK-012) */}
              <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-3">
                <div>
                  <label className="font-bold text-cyan-950 block text-xs">
                    Tarifas Pactadas por Tipo de Trabajo
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Define montos fijos o % independientes para mantenimientos e instalaciones
                  </p>
                </div>

                {/* Mantenimiento */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                    <span>🔧 Mantenimientos Preventivos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={commMantType}
                      onChange={(e) => setCommMantType(e.target.value as any)}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs"
                    >
                      <option value="fixed">Monto Fijo ({currencySymbol})</option>
                      <option value="percentage">Porcentaje (%)</option>
                    </select>
                    <input
                      type="number"
                      value={commMantVal === 0 ? '' : commMantVal}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCommMantVal(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Instalación */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                    <span>❄️ Instalación de Equipos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={commInstType}
                      onChange={(e) => setCommInstType(e.target.value as any)}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs"
                    >
                      <option value="fixed">Monto Fijo ({currencySymbol})</option>
                      <option value="percentage">Porcentaje (%)</option>
                    </select>
                    <input
                      type="number"
                      value={commInstVal === 0 ? '' : commInstVal}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCommInstVal(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold cursor-pointer"
                >
                  Guardar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Personal (NK-029 & NK-012) */}
      {editingTech && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTech(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl my-6 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Editar Colaborador HVAC</h3>
              <button onClick={() => setEditingTech(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Rol en Terreno</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('tecnico')}
                    className={`py-2 px-3 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      editRole === 'tecnico'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🔧 Técnico Líder
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('ayudante')}
                    className={`py-2 px-3 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      editRole === 'ayudante'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    👷 Ayudante / Asistente
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Nombre Completo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">Identificación / Cédula</label>
                  <input
                    type="text"
                    value={editRut}
                    onChange={(e) => setEditRut(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Teléfono</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Estado Operativo</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="en_servicio">En Servicio</option>
                    <option value="vacaciones">Vacaciones</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {editRole === 'tecnico' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSecCertified}
                      onChange={(e) => setEditSecCertified(e.target.checked)}
                      className="w-4 h-4 accent-cyan-600 rounded"
                    />
                    <span className="font-bold text-slate-800">Cuenta con Certificación SEC</span>
                  </label>
                  {editSecCertified && (
                    <input
                      type="text"
                      value={editCertNumber}
                      onChange={(e) => setEditCertNumber(e.target.value)}
                      placeholder="Número de registro SEC"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                    />
                  )}
                </div>
              )}

              {/* Tarifas Diferenciadas por Tipo de Trabajo (NK-012) */}
              <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-3">
                <div>
                  <label className="font-bold text-cyan-950 block text-xs">
                    Tarifas Pactadas por Tipo de Trabajo
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Ajusta montos fijos o % independientes para mantenimientos e instalaciones
                  </p>
                </div>

                {/* Mantenimiento */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 block">🔧 Mantenimientos Preventivos</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editCommMantType}
                      onChange={(e) => setEditCommMantType(e.target.value as any)}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs"
                    >
                      <option value="fixed">Monto Fijo ({currencySymbol})</option>
                      <option value="percentage">Porcentaje (%)</option>
                    </select>
                    <input
                      type="number"
                      value={editCommMantVal === 0 ? '' : editCommMantVal}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setEditCommMantVal(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Instalación */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 block">❄️ Instalación de Equipos</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editCommInstType}
                      onChange={(e) => setEditCommInstType(e.target.value as any)}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs"
                    >
                      <option value="fixed">Monto Fijo ({currencySymbol})</option>
                      <option value="percentage">Porcentaje (%)</option>
                    </select>
                    <input
                      type="number"
                      value={editCommInstVal === 0 ? '' : editCommInstVal}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setEditCommInstVal(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTech(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Liquidación & Resumen Detallado (NK-012) - SIN MOSTRAR FACTURACIÓN TOTAL AL CLIENTE */}
      {selectedTechForSettlement && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTechForSettlement(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 cursor-default"
          >
            {/* Encabezado */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Liquidación de Mano de Obra • {selectedMonth}
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  {selectedTechForSettlement.name}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    selectedTechForSettlement.role === 'ayudante'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {selectedTechForSettlement.role === 'ayudante' ? 'Ayudante' : 'Técnico Líder'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  ID: {selectedTechForSettlement.rut} • Tel: {selectedTechForSettlement.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedTechForSettlement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Imprimible */}
            <div className="p-6 space-y-6 text-xs text-slate-900" id="settlement-print-sheet">
              {/* Tarjeta de Resumen (Sin facturación del cliente) */}
              {(() => {
                const s = techSettlementMap.get(selectedTechForSettlement.id) || { completedCount: 0, totalCommission: 0, services: [] };
                const avgPerService = s.completedCount > 0 ? Math.round(s.totalCommission / s.completedCount) : 0;
                const payoutsThisMonth = getTechPayouts(selectedTechForSettlement.id, selectedMonth);
                const totalPaid = payoutsThisMonth.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const pendingBalance = Math.max(0, s.totalCommission - totalPaid);

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium block">Servicios Realizados</span>
                        <strong className="text-lg text-slate-900 font-mono">{s.completedCount} órdenes</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Comisiones Ganadas</span>
                        <strong className="text-lg text-slate-900 font-mono">
                          {formatAirPrice(s.totalCommission, currencySymbol, countryCode)}
                        </strong>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${
                        pendingBalance > 0 
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
                          : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      }`}>
                        <span className="font-bold block text-[11px]">
                          {pendingBalance > 0 ? 'Saldo Pendiente a Liquidar' : 'Totalmente Liquidado (Al Día)'}
                        </span>
                        <strong className={`text-xl font-mono font-black ${
                          pendingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {formatAirPrice(pendingBalance > 0 ? pendingBalance : totalPaid, currencySymbol, countryCode)}
                        </strong>
                      </div>
                    </div>

                    {/* Tabla de Servicios & Pagos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-sm">Desglose de Servicios & Pagos</h4>
                        <span className="text-[11px] text-slate-500">Historial período {selectedMonth}</span>
                      </div>

                      {s.services.length === 0 && payoutsThisMonth.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                          No hay órdenes completadas ni pagos registrados para este colaborador en el mes {selectedMonth}.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                                <th className="p-2.5">Ticket / Tipo</th>
                                <th className="p-2.5">Fecha</th>
                                <th className="p-2.5">Detalle / Referencia</th>
                                <th className="p-2.5">Rol / Comprobante</th>
                                <th className="p-2.5 text-center">Acción</th>
                                <th className="p-2.5 text-right">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {/* 1. Servicios Realizados en positivo (+) */}
                              {s.services.map((item, idx) => (
                                <tr key={`srv-${idx}`} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-mono font-bold text-cyan-800">{item.order.ticket_number}</td>
                                  <td className="p-2.5 font-mono text-slate-600">
                                    {item.order.completed_at?.split('T')[0] || item.order.scheduled_date}
                                  </td>
                                  <td className="p-2.5 text-slate-800 font-medium">
                                    {item.serviceName}
                                    <span className="block text-[10px] text-slate-400">Cliente: {item.order.customer?.name || 'Cliente Particular'}</span>
                                  </td>
                                  <td className="p-2.5">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                      item.roleInService === 'Ayudante'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                    }`}>
                                      {item.roleInService}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-center text-slate-400 text-[10px]">
                                    Completado
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-black text-emerald-700 text-sm">
                                    +{formatAirPrice(item.commissionEarned, currencySymbol, countryCode)}
                                  </td>
                                </tr>
                              ))}

                              {/* Subtotal Servicios Ganados si hay servicios */}
                              {s.services.length > 0 && (
                                <tr className="bg-slate-50 font-bold border-t border-b border-slate-200 text-slate-700">
                                  <td colSpan={5} className="p-2.5 text-right uppercase tracking-wider text-[11px]">
                                    Subtotal Comisiones Ganadas (+):
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-emerald-700 font-black">
                                    +{formatAirPrice(s.totalCommission, currencySymbol, countryCode)}
                                  </td>
                                </tr>
                              )}

                              {/* 2. DEDUCCIONES: Liquidaciones Previas y Adelantos en NEGATIVO (NK-065) */}
                              {payoutsThisMonth.map((p, idx) => {
                                const isAdelanto = p.payout_type === 'adelanto';
                                return (
                                  <tr key={`payout-${p.id || idx}`} className="bg-rose-50/50 hover:bg-rose-50/80 text-slate-800">
                                    <td className="p-2.5 font-mono font-bold text-rose-700">
                                      <div className="flex items-center gap-1.5">
                                        <MinusCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        <span>{p.payout_number || (isAdelanto ? 'ADELANTO' : 'PAGO')}</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5 font-mono text-slate-700 font-medium">
                                      {p.payment_date}
                                    </td>
                                    <td className="p-2.5">
                                      <div className="font-semibold text-slate-900">
                                        {isAdelanto ? '(-) Adelanto / Préstamo a Colaborador' : '(-) Liquidación / Pago Parcial'}
                                      </div>
                                      {p.payment_reference && (
                                        <span className="text-[10px] text-slate-500 font-mono block">Ref: {p.payment_reference}</span>
                                      )}
                                      {p.notes && (
                                        <span className="text-[10px] text-slate-600 italic block">{p.notes}</span>
                                      )}
                                    </td>
                                    <td className="p-2.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                          isAdelanto 
                                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        }`}>
                                          {isAdelanto ? 'Préstamo' : 'Liquidado'}
                                        </span>
                                        {p.payment_proof_url && (
                                          <button
                                            type="button"
                                            onClick={() => setViewingProofUrl(p.payment_proof_url!)}
                                            className="px-2 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                            title="Ver comprobante de transferencia bancaria adjunto"
                                          >
                                            <Paperclip className="w-3 h-3" />
                                            <span>Ver Voucher</span>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-slate-400 text-center">
                                      {onDeleteTechnicianPayout && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (confirm(`¿Eliminar este registro de pago por ${formatAirPrice(p.amount, currencySymbol, countryCode)}?`)) {
                                              onDeleteTechnicianPayout(p.id);
                                            }
                                          }}
                                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                                          title="Eliminar este pago o adelanto"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-black text-rose-700 text-sm">
                                      -{formatAirPrice(p.amount, currencySymbol, countryCode)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td colSpan={5} className="p-3 text-slate-900 uppercase tracking-wide text-xs">
                                  {pendingBalance > 0 ? 'TOTAL SALDO PENDIENTE A LIQUIDAR:' : 'TOTAL LIQUIDADO DEL MES (AL DÍA):'}
                                </td>
                                <td className={`p-3 text-right font-mono text-base font-black ${
                                  pendingBalance > 0 ? 'text-amber-600' : 'text-emerald-700'
                                }`}>
                                  {formatAirPrice(pendingBalance > 0 ? pendingBalance : totalPaid, currencySymbol, countryCode)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Botones de Acción (NK-012, NK-043 & NK-065) */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppSettlement(selectedTechForSettlement)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold cursor-pointer transition-all text-xs"
                  >
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <span>Enviar WhatsApp</span>
                  </button>

                  {(() => {
                    const s = techSettlementMap.get(selectedTechForSettlement.id) || { completedCount: 0, totalCommission: 0, services: [] };
                    const payouts = getTechPayouts(selectedTechForSettlement.id, selectedMonth);
                    const totalPaid = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    const pending = Math.max(0, s.totalCommission - totalPaid);

                    return (
                      <>
                        {pending > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const tech = selectedTechForSettlement;
                              setSelectedTechForSettlement(null);
                              handleOpenLiquidation(tech, 'liquidacion');
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold cursor-pointer transition-all shadow-md shadow-cyan-500/20 text-xs"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Liquidar Saldo ({formatAirPrice(pending, currencySymbol, countryCode)})</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Liquidado Totalmente</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const tech = selectedTechForSettlement;
                            setSelectedTechForSettlement(null);
                            handleOpenLiquidation(tech, 'adelanto');
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold cursor-pointer transition-all text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-700" />
                          <span>+ Adelanto / Préstamo</span>
                        </button>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer transition-all text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Resumen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTechForSettlement(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer transition-all text-xs"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Liquidar Pago de Honorarios o Registrar Adelanto (NK-043 & NK-065) */}
      {liquidatingTech && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLiquidatingTech(null);
              setPaymentProofUrl('');
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl my-6 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  payoutType === 'adelanto' 
                    ? 'bg-amber-50 border border-amber-200 text-amber-600' 
                    : 'bg-cyan-50 border border-cyan-200 text-cyan-600'
                }`}>
                  {payoutType === 'adelanto' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {payoutType === 'adelanto' ? 'Registrar Adelanto / Préstamo' : 'Liquidar Honorarios de Colaborador'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Período: <strong className="text-cyan-800 font-mono">{selectedMonth}</strong> • {liquidatingTech.name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setLiquidatingTech(null);
                  setPaymentProofUrl('');
                }} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Tipo: Liquidación vs Adelanto (NK-065) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setPayoutType('liquidacion');
                  const settlement = techSettlementMap.get(liquidatingTech.id) || { completedCount: 0, totalCommission: 0, services: [] };
                  const payouts = getTechPayouts(liquidatingTech.id, selectedMonth);
                  const totalPaid = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                  const pending = Math.max(0, settlement.totalCommission - totalPaid);
                  setPayoutAmount(pending > 0 ? pending : settlement.totalCommission);
                  setPayoutNotes(`Liquidación de honorarios correspondiente al período ${selectedMonth}.`);
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  payoutType === 'liquidacion'
                    ? 'bg-white text-cyan-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Liquidación Normal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayoutType('adelanto');
                  setPayoutNotes(`Adelanto / Préstamo a cuenta de honorarios período ${selectedMonth}.`);
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  payoutType === 'adelanto'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Adelanto / Préstamo</span>
              </button>
            </div>

            <form onSubmit={handleConfirmLiquidation} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Colaborador:</span>
                  <span className="font-bold text-slate-900">{liquidatingTech.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Rol Operativo:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    liquidatingTech.role === 'ayudante'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                  }`}>
                    {liquidatingTech.role === 'ayudante' ? 'Ayudante' : 'Técnico Líder'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Identificación / RUT:</span>
                  <span className="font-mono text-slate-700 font-medium">{liquidatingTech.rut}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {payoutType === 'adelanto' ? 'Monto del Adelanto / Préstamo' : 'Monto a Transferir / Liquidar'} ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    value={payoutAmount === 0 ? '' : payoutAmount}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPayoutAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    required
                    min={1}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-black focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {payoutType === 'adelanto'
                    ? '💡 Este monto se registrará como egreso y se descontará en negativo (-) de la liquidación del colaborador.'
                    : '💡 Este monto se registrará como pago de comisiones ganadas y se deducirá del saldo pendiente.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Fecha de Pago</label>
                  <input
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Método de Pago</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  N° de Referencia / Comprobante
                </label>
                <input
                  type="text"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  placeholder="Ej: Transf. Banco Estado #92841"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Carga de Comprobante / Voucher de Transferencia (NK-065) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-slate-700 font-bold block text-xs flex items-center justify-between">
                  <span>Comprobante de Transferencia / Voucher</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional (JPG, PNG, PDF)</span>
                </label>

                {paymentProofUrl ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-900 font-medium text-xs truncate">
                        Comprobante adjuntado correctamente
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingProofUrl(paymentProofUrl)}
                        className="px-2 py-1 rounded bg-white text-emerald-800 border border-emerald-300 font-bold text-[10px] hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentProofUrl('')}
                        className="p-1 rounded text-rose-500 hover:bg-rose-100 cursor-pointer"
                        title="Quitar comprobante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-cyan-400 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 mb-1" />
                    <span className="text-xs text-slate-600 font-medium group-hover:text-cyan-700">
                      Haga clic para cargar foto o voucher de la transferencia
                    </span>
                    <span className="text-[10px] text-slate-400">Archivos de imagen hasta 8MB</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleProofFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  rows={2}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Detalles sobre la liquidación o adelanto..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setLiquidatingTech(null);
                    setPaymentProofUrl('');
                  }}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold cursor-pointer shadow-md transition-all ${
                    payoutType === 'adelanto'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{payoutType === 'adelanto' ? 'Confirmar Adelanto' : 'Confirmar Liquidación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor de Comprobante / Voucher (NK-065) */}
      {viewingProofUrl && (
        <div 
          onClick={() => setViewingProofUrl(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 shadow-2xl cursor-default text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm">Comprobante de Transferencia / Voucher</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingProofUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl bg-black/40 flex items-center justify-center p-2">
              {viewingProofUrl.startsWith('data:image') || viewingProofUrl.startsWith('http') ? (
                <img 
                  src={viewingProofUrl} 
                  alt="Comprobante de transferencia" 
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="p-8 text-center text-slate-300">
                  <FileText className="w-12 h-12 mx-auto text-cyan-400 mb-2" />
                  <p className="text-sm font-medium">Documento adjunto disponible</p>
                  <a 
                    href={viewingProofUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-3 inline-block px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold"
                  >
                    Abrir archivo en nueva pestaña
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <a
                href={viewingProofUrl}
                download="comprobante_pago.png"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-colors"
              >
                Descargar Comprobante
              </a>
              <button
                type="button"
                onClick={() => setViewingProofUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors cursor-pointer"
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
