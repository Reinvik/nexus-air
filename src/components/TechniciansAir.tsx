import React, { useState, useMemo } from 'react';
import { Technician, ServiceOrder, AirSettings } from '../types';
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
  Sparkles
} from 'lucide-react';
import { formatAirPrice } from '../lib/countries';
import { format } from 'date-fns';

interface TechniciansAirProps {
  technicians: Technician[];
  orders?: ServiceOrder[];
  settings?: AirSettings;
  onAddTechnician: (tech: Omit<Technician, 'id'>) => void;
  onUpdateTechnician: (id: string, updates: Partial<Technician>) => void;
  onDeleteTechnician?: (id: string) => void;
}

export const TechniciansAir: React.FC<TechniciansAirProps> = ({
  technicians,
  orders = [],
  settings,
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
}) => {
  const [roleFilter, setRoleFilter] = useState<'todos' | 'tecnico' | 'ayudante'>('todos');
  
  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [selectedTechForSettlement, setSelectedTechForSettlement] = useState<Technician | null>(null);

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
        sType === 'mantencion_preventiva' ? 'Mantención Preventiva' :
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
          } else if (sType === 'mantencion_preventiva' || sType === 'recaptacion') {
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
          } else if (sType === 'mantencion_preventiva' || sType === 'recaptacion') {
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

  // Totales globales del mes
  const monthGlobalStats = useMemo(() => {
    let totalCommissions = 0;
    let totalOrders = 0;
    let activeWorkers = 0;

    techSettlementMap.forEach(val => {
      totalCommissions += val.totalCommission;
      totalOrders += val.completedCount;
      if (val.completedCount > 0) activeWorkers += 1;
    });

    return { totalCommissions, totalOrders, activeWorkers };
  }, [techSettlementMap]);

  // Abrir Modal de Edición
  const handleOpenEdit = (t: Technician) => {
    setEditingTech(t);
    setEditName(t.name);
    setEditRut(t.rut);
    setEditPhone(t.phone);
    setEditEmail(t.email || '');
    setEditRole(t.role || 'tecnico');
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

  // Generar WhatsApp de liquidación (SIN MOSTRAR EL TOTAL FACTURADO AL CLIENTE - NK-012)
  const handleSendWhatsAppSettlement = (t: Technician) => {
    const settlement = techSettlementMap.get(t.id);
    if (!settlement) return;

    const message = `*LIQUIDACIÓN DE PAGO DE SERVICIOS HVAC* ❄️\n` +
      `👤 Colaborador: *${t.name}* (${t.role === 'ayudante' ? 'Ayudante' : 'Técnico Líder'})\n` +
      `📅 Período: *${selectedMonth}*\n` +
      `🔧 Servicios Realizados: *${settlement.completedCount}*\n` +
      `💵 *TOTAL LIQUIDACIÓN A PAGAR: ${formatAirPrice(settlement.totalCommission, currencySymbol, countryCode)}*\n\n` +
      `*Detalle de Trabajos Realizados:*\n` +
      settlement.services.map((s, i) => `${i + 1}. #${s.order.ticket_number} • ${s.serviceName}\n   Cliente: ${s.order.customer?.name || 'Cliente Particular'}\n   Pago Asignado: *${formatAirPrice(s.commissionEarned, currencySymbol, countryCode)}*`).join('\n\n') +
      `\n\n_Generado por ${settings?.company_name || 'Nexus Air'}_`;

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Total Comisiones a Liquidar</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {formatAirPrice(monthGlobalStats.totalCommissions, currencySymbol, countryCode)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Servicios Técnicos Realizados</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {monthGlobalStats.totalOrders} órdenes
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Personal con Liquidación Activa</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {monthGlobalStats.activeWorkers} colaboradores
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
                    <span className="text-slate-500 block">Mantención:</span>
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

              {/* Resumen de Liquidación del Mes (NK-012) */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/30 border border-cyan-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-800 font-bold">Liquidación ({selectedMonth}):</span>
                  <span className="text-[11px] text-slate-500">{settlement.completedCount} servicios</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Total a Pagar:</span>
                  <span className="font-mono font-black text-sm text-cyan-900">
                    {formatAirPrice(settlement.totalCommission, currencySymbol, countryCode)}
                  </span>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTechForSettlement(t)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Ver Liquidación</span>
                  </button>
                  <button
                    onClick={() => handleSendWhatsAppSettlement(t)}
                    disabled={settlement.completedCount === 0}
                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white transition-colors cursor-pointer shadow-2xs"
                    title="Enviar liquidación al colaborador por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
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
                    Define montos fijos o % independientes para mantenciones e instalaciones
                  </p>
                </div>

                {/* Mantención */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                    <span>🔧 Mantenciones Preventivas</span>
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
                      value={commMantVal}
                      onChange={(e) => setCommMantVal(Number(e.target.value))}
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
                      value={commInstVal}
                      onChange={(e) => setCommInstVal(Number(e.target.value))}
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
                    Ajusta montos fijos o % independientes para mantenciones e instalaciones
                  </p>
                </div>

                {/* Mantención */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 block">🔧 Mantenciones Preventivas</span>
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
                      value={editCommMantVal}
                      onChange={(e) => setEditCommMantVal(Number(e.target.value))}
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
                      value={editCommInstVal}
                      onChange={(e) => setEditCommInstVal(Number(e.target.value))}
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

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium block">Servicios Realizados</span>
                        <strong className="text-lg text-slate-900 font-mono">{s.completedCount} órdenes</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Promedio por Servicio</span>
                        <strong className="text-lg text-slate-900 font-mono">
                          {formatAirPrice(avgPerService, currencySymbol, countryCode)}
                        </strong>
                      </div>
                      <div className="bg-cyan-100/70 p-2.5 rounded-xl border border-cyan-200">
                        <span className="text-cyan-950 font-bold block text-[11px]">Total a Liquidar</span>
                        <strong className="text-xl text-cyan-950 font-mono font-black">
                          {formatAirPrice(s.totalCommission, currencySymbol, countryCode)}
                        </strong>
                      </div>
                    </div>

                    {/* Tabla de Servicios (Solo muestra datos técnicos y pago del colaborador, NUNCA el cobro al cliente) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-sm">Desglose de Servicios & Pagos</h4>
                        <span className="text-[11px] text-slate-500">Comisiones aprobadas</span>
                      </div>

                      {s.services.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                          No hay órdenes completadas para este colaborador en el mes {selectedMonth}.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                                <th className="p-2.5">Ticket</th>
                                <th className="p-2.5">Fecha</th>
                                <th className="p-2.5">Cliente</th>
                                <th className="p-2.5">Servicio Realizado</th>
                                <th className="p-2.5">Rol</th>
                                <th className="p-2.5 text-right">Pago Asignado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {s.services.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-mono font-bold text-cyan-800">{item.order.ticket_number}</td>
                                  <td className="p-2.5 font-mono text-slate-600">
                                    {item.order.completed_at?.split('T')[0] || item.order.scheduled_date}
                                  </td>
                                  <td className="p-2.5 text-slate-800 font-medium">
                                    {item.order.customer?.name || 'Cliente Particular'}
                                  </td>
                                  <td className="p-2.5 text-slate-700 font-medium">
                                    {item.serviceName}
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
                                  <td className="p-2.5 text-right font-mono font-black text-emerald-700 text-sm">
                                    +{formatAirPrice(item.commissionEarned, currencySymbol, countryCode)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 font-bold border-t border-slate-200">
                                <td colSpan={5} className="p-2.5 text-slate-800 uppercase tracking-wide">
                                  TOTAL LIQUIDACIÓN DEL MES:
                                </td>
                                <td className="p-2.5 text-right font-mono text-emerald-800 text-base font-black">
                                  {formatAirPrice(s.totalCommission, currencySymbol, countryCode)}
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

              {/* Botones de Acción */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppSettlement(selectedTechForSettlement)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold cursor-pointer transition-all"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Resumen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTechForSettlement(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
