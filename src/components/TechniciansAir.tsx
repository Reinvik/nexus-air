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
  HardHat
} from 'lucide-react';
import { formatAirPrice } from '../lib/countries';
import { format, parseISO } from 'date-fns';

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
  const [phone, setPhone] = useState('+56 9 ');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'tecnico' | 'ayudante'>('tecnico');
  const [secCertified, setSecCertified] = useState(true);
  const [certNumber, setCertNumber] = useState('SEC-HVAC-');
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [commissionValue, setCommissionValue] = useState<number>(15);

  // Form State para Editar
  const [editName, setEditName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'tecnico' | 'ayudante'>('tecnico');
  const [editSecCertified, setEditSecCertified] = useState(false);
  const [editCertNumber, setEditCertNumber] = useState('');
  const [editCommissionType, setEditCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [editCommissionValue, setEditCommissionValue] = useState<number>(15);
  const [editStatus, setEditStatus] = useState<'disponible' | 'en_servicio' | 'vacaciones' | 'inactivo'>('disponible');

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

  // Cálculo de liquidaciones y comisiones por técnico para el mes seleccionado
  const techSettlementMap = useMemo(() => {
    const map = new Map<string, {
      completedCount: number;
      totalBilled: number;
      totalCommission: number;
      services: {
        order: ServiceOrder;
        roleInService: 'Técnico Líder' | 'Ayudante';
        commissionEarned: number;
      }[];
    }>();

    technicians.forEach(t => {
      map.set(t.id, {
        completedCount: 0,
        totalBilled: 0,
        totalCommission: 0,
        services: []
      });
    });

    orders.forEach(order => {
      if (order.status !== 'completado') return;
      
      const orderDate = order.completed_at || order.scheduled_date || '';
      if (!orderDate.startsWith(selectedMonth)) return;

      const orderTotal = order.total || 0;

      // Si es el técnico líder asignado
      if (order.assigned_technician_id && map.has(order.assigned_technician_id)) {
        const item = map.get(order.assigned_technician_id)!;
        let comm = 0;
        const pType = order.technician_payout_type || 'percentage';
        const pVal = order.technician_payout_value ?? 15;

        if (pType === 'percentage') {
          comm = Math.round((orderTotal * pVal) / 100);
        } else {
          comm = pVal;
        }

        item.completedCount += 1;
        item.totalBilled += orderTotal;
        item.totalCommission += comm;
        item.services.push({
          order,
          roleInService: 'Técnico Líder',
          commissionEarned: comm
        });
      }

      // Si es el ayudante asignado
      if (order.assigned_assistant_id && map.has(order.assigned_assistant_id)) {
        const item = map.get(order.assigned_assistant_id)!;
        let comm = 0;
        const pType = order.assistant_payout_type || 'percentage';
        const pVal = order.assistant_payout_value ?? 8;

        if (pType === 'percentage') {
          comm = Math.round((orderTotal * pVal) / 100);
        } else {
          comm = pVal;
        }

        item.completedCount += 1;
        item.totalBilled += orderTotal;
        item.totalCommission += comm;
        item.services.push({
          order,
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
    setEditCommissionType(t.default_commission_type || 'percentage');
    setEditCommissionValue(t.default_commission_value ?? (t.role === 'ayudante' ? 8 : 15));
    setEditStatus(t.status || 'disponible');
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
      default_commission_type: commissionType,
      default_commission_value: commissionValue,
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
      default_commission_type: editCommissionType,
      default_commission_value: editCommissionValue,
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

  // Generar WhatsApp de liquidación
  const handleSendWhatsAppSettlement = (t: Technician) => {
    const settlement = techSettlementMap.get(t.id);
    if (!settlement) return;

    const message = `*LIQUIDACIÓN MENSUAL DE SERVICIOS HVAC*\n` +
      `👤 Colaborador: *${t.name}* (${t.role === 'ayudante' ? 'Ayudante' : 'Técnico'})\n` +
      `📅 Período: *${selectedMonth}*\n` +
      `🔧 Servicios Finalizados: *${settlement.completedCount}*\n` +
      `💰 Facturación Atendida: *${formatAirPrice(settlement.totalBilled, currencySymbol, countryCode)}*\n` +
      `💵 *TOTAL COMISIÓN A PAGAR: ${formatAirPrice(settlement.totalCommission, currencySymbol, countryCode)}*\n\n` +
      `*Detalle de Servicios:*\n` +
      settlement.services.map((s, i) => `${i + 1}. #${s.order.ticket_number} - ${s.order.service_type.replace('_', ' ')} (${formatAirPrice(s.commissionEarned, currencySymbol, countryCode)})`).join('\n') +
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
              Control de personal operativo, certificaciones SEC y liquidación de comisiones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRole('tecnico');
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
              Resumen Acumulado de Comisiones por Servicios Técnicos
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
            <span className="text-[11px] text-slate-400 block font-medium">Servicios Técnicos Completados</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {monthGlobalStats.totalOrders} órdenes
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Personal Activo con Liquidación</span>
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
        {filteredTechnicians.map((t) => {
          const settlement = techSettlementMap.get(t.id) || { completedCount: 0, totalBilled: 0, totalCommission: 0, services: [] };
          const isAyudante = t.role === 'ayudante';

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
                    title="Editar datos"
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
                    <span className="font-bold">Asistente en Terreno</span>
                  </div>
                  <span className="text-[11px] text-amber-900 font-bold">
                    Apoyo Operativo HVAC
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

              {/* Configuración de Comisión */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Comisión pactada:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {t.default_commission_type === 'fixed'
                    ? `${formatAirPrice(t.default_commission_value || 0, currencySymbol, countryCode)} fijo / orden`
                    : `${t.default_commission_value ?? (isAyudante ? 8 : 15)}% del total`}
                </span>
              </div>

              {/* Resumen de Liquidación del Mes (NK-012) */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/30 border border-cyan-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-800 font-bold">Acumulado ({selectedMonth}):</span>
                  <span className="text-[11px] text-slate-500">{settlement.completedCount} servicios</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Comisión a Pagar:</span>
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
                    title="Enviar liquidación por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Agregar Personal (NK-029) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
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
                      setCommissionValue(15);
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
                      setCommissionValue(8);
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
                  <label className="text-slate-700 font-medium">RUT / Identificación</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-9"
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

              {/* Esquema de Comisiones Predeterminado */}
              <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-200 space-y-2">
                <label className="font-bold text-cyan-900 block">
                  Comisión Predeterminada por Servicio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 text-[11px]">Tipo de Pago</label>
                    <select
                      value={commissionType}
                      onChange={(e) => setCommissionType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs mt-0.5 text-slate-900"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto Fijo ({currencySymbol})</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 text-[11px]">Valor de Comisión</label>
                    <input
                      type="number"
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs mt-0.5 text-slate-900 font-mono"
                      min={0}
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

      {/* Modal Editar Personal (NK-029) */}
      {editingTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
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
                  <label className="text-slate-700 font-medium">RUT / Identificación</label>
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

              <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-200 space-y-2">
                <label className="font-bold text-cyan-900 block">
                  Comisión Predeterminada por Servicio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 text-[11px]">Tipo</label>
                    <select
                      value={editCommissionType}
                      onChange={(e) => setEditCommissionType(e.target.value as any)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs mt-0.5 text-slate-900"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto Fijo ({currencySymbol})</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 text-[11px]">Valor</label>
                    <input
                      type="number"
                      value={editCommissionValue}
                      onChange={(e) => setEditCommissionValue(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs mt-0.5 text-slate-900 font-mono"
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

      {/* Modal Liquidación & Resumen Detallado (NK-012) */}
      {selectedTechForSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Encabezado */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Liquidación de Servicios HVAC • {selectedMonth}
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
                  RUT: {selectedTechForSettlement.rut} • Tel: {selectedTechForSettlement.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedTechForSettlement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Imprimible */}
            <div className="p-6 space-y-6 text-xs text-slate-900" id="settlement-print-sheet">
              {/* Tarjeta de Resumen */}
              {(() => {
                const s = techSettlementMap.get(selectedTechForSettlement.id) || { completedCount: 0, totalBilled: 0, totalCommission: 0, services: [] };
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium block">Servicios del Mes</span>
                        <strong className="text-lg text-slate-900 font-mono">{s.completedCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Facturación Atendida</span>
                        <strong className="text-lg text-slate-900 font-mono">
                          {formatAirPrice(s.totalBilled, currencySymbol, countryCode)}
                        </strong>
                      </div>
                      <div className="bg-cyan-100/60 p-2 rounded-lg border border-cyan-200">
                        <span className="text-cyan-900 font-bold block">Total a Liquidar</span>
                        <strong className="text-lg text-cyan-900 font-mono font-black">
                          {formatAirPrice(s.totalCommission, currencySymbol, countryCode)}
                        </strong>
                      </div>
                    </div>

                    {/* Tabla de Servicios */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">Desglose de Órdenes Realizadas</h4>
                      {s.services.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                          No hay órdenes completadas para este colaborador en el mes {selectedMonth}.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-2.5">Ticket</th>
                                <th className="p-2.5">Fecha</th>
                                <th className="p-2.5">Cliente</th>
                                <th className="p-2.5">Rol</th>
                                <th className="p-2.5 text-right">Total Orden</th>
                                <th className="p-2.5 text-right">Comisión</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {s.services.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-mono font-bold text-cyan-700">{item.order.ticket_number}</td>
                                  <td className="p-2.5 font-mono text-slate-600">{item.order.completed_at?.split('T')[0] || item.order.scheduled_date}</td>
                                  <td className="p-2.5 text-slate-800 font-medium">{item.order.customer?.name || 'Cliente'}</td>
                                  <td className="p-2.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                                      {item.roleInService}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-slate-600">
                                    {formatAirPrice(item.order.total, currencySymbol, countryCode)}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                                    +{formatAirPrice(item.commissionEarned, currencySymbol, countryCode)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                <td colSpan={4} className="p-2.5 text-slate-700">TOTAL COMISIONES</td>
                                <td className="p-2.5 text-right font-mono text-slate-900">
                                  {formatAirPrice(s.totalBilled, currencySymbol, countryCode)}
                                </td>
                                <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Resumen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTechForSettlement(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
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
