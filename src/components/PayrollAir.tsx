import React, { useState, useMemo } from 'react';
import { 
  Technician, 
  ServiceOrder, 
  AirSettings, 
  TechnicianPayout, 
  StaffRole, 
  SalaryMode, 
  formatStaffRole, 
  formatSalaryMode, 
  isTechnicalStaff 
} from '../types';
import { 
  Banknote, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Share2, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  HelpCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Building, 
  HardHat, 
  Sparkles, 
  Filter,
  Check,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { formatAirPrice } from '../lib/countries';
import { format, subMonths, addMonths } from 'date-fns';

interface PayrollAirProps {
  technicians: Technician[];
  orders?: ServiceOrder[];
  settings?: AirSettings;
  technicianPayouts?: TechnicianPayout[];
  onAddTechnician: (tech: Omit<Technician, 'id'>) => void;
  onUpdateTechnician: (id: string, updates: Partial<Technician>) => void;
  onDeleteTechnician?: (id: string) => void;
  onAddTechnicianPayout?: (payout: Omit<TechnicianPayout, 'id' | 'company_id' | 'created_at'>) => Promise<any> | void;
  onDeleteTechnicianPayout?: (id: string) => Promise<any> | void;
  onNavigateToTechnicians?: () => void;
}

export const PayrollAir: React.FC<PayrollAirProps> = ({
  technicians,
  orders = [],
  settings,
  technicianPayouts = [],
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
  onAddTechnicianPayout,
  onDeleteTechnicianPayout,
  onNavigateToTechnicians,
}) => {
  // Período seleccionado (formato YYYY-MM)
  const currentMonthStr = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'pagados'>('todos');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'tecnicos' | 'administrativos'>('todos');
  const [modeFilter, setModeFilter] = useState<'todos' | 'fixed' | 'commission' | 'fixed_and_commission'>('todos');

  // Modales
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Technician | null>(null);
  const [payingStaff, setPayingStaff] = useState<Technician | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<{
    staff: Technician;
    payout: TechnicianPayout;
  } | null>(null);
  const [viewingOrdersDetail, setViewingOrdersDetail] = useState<{
    staff: Technician;
    services: {
      order: ServiceOrder;
      serviceName: string;
      roleInService: 'Técnico Líder' | 'Ayudante';
      commissionEarned: number;
    }[];
  } | null>(null);

  // Form State para Registrar / Aprobar Liquidación
  const [payWorkingDays, setPayWorkingDays] = useState<number>(30);
  const [payBaseSalary, setPayBaseSalary] = useState<number>(0);
  const [payCommissionAmount, setPayCommissionAmount] = useState<number>(0);
  const [payBonusAmount, setPayBonusAmount] = useState<number>(0);
  const [payDeductionAmount, setPayDeductionAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [payMethod, setPayMethod] = useState<'transferencia' | 'efectivo' | 'cheque' | 'otro'>('transferencia');
  const [payReference, setPayReference] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Form State para Agregar / Editar Colaborador
  const [staffName, setStaffName] = useState('');
  const [staffRut, setStaffRut] = useState('');
  const [staffPhone, setStaffPhone] = useState('+56 9 ');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('tecnico');
  const [staffCustomTitle, setStaffCustomTitle] = useState('');
  const [staffSalaryMode, setStaffSalaryMode] = useState<SalaryMode>('commission');
  const [staffBaseSalary, setStaffBaseSalary] = useState<number>(0);
  const [staffWorkingDays, setStaffWorkingDays] = useState<number>(30);
  const [staffSecCertified, setStaffSecCertified] = useState(true);
  const [staffCertNumber, setStaffCertNumber] = useState('SEC-HVAC-');

  // Comisiones
  const [commMantType, setCommMantType] = useState<'fixed' | 'percentage'>('fixed');
  const [commMantVal, setCommMantVal] = useState<number>(20000);
  const [commInstType, setCommInstType] = useState<'fixed' | 'percentage'>('fixed');
  const [commInstVal, setCommInstVal] = useState<number>(35000);
  const [commRepType, setCommRepType] = useState<'fixed' | 'percentage'>('fixed');
  const [commRepVal, setCommRepVal] = useState<number>(15000);

  const currencySymbol = settings?.currency_symbol || '$';
  const countryCode = settings?.country_code || 'CL';

  // Manejador Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddStaffModalOpen(false);
        setEditingStaff(null);
        setPayingStaff(null);
        setViewingReceipt(null);
        setViewingOrdersDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cálculo de Comisiones por colaborador para el mes seleccionado
  const techCommissionsMap = useMemo(() => {
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

        if (order.technician_payout_value !== undefined && order.technician_payout_value > 0) {
          const pType = order.technician_payout_type || 'fixed';
          comm = pType === 'percentage'
            ? Math.round((orderTotal * order.technician_payout_value) / 100)
            : order.technician_payout_value;
        } else if (tech) {
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

  // Helper para buscar pagos de nómina existentes en el mes (NK-062 & NK-065)
  const getStaffPayouts = (techId: string, month: string): TechnicianPayout[] => {
    return (technicianPayouts || []).filter(p => p.technician_id === techId && p.period_month === month);
  };

  const getExistingPayout = (techId: string, month: string): TechnicianPayout | undefined => {
    const list = getStaffPayouts(techId, month);
    return list.find(p => p.payout_type !== 'adelanto') || list[list.length - 1];
  };

  // Cálculo individual para cada colaborador en el mes actual
  const staffPayrollList = useMemo(() => {
    return technicians.map(tech => {
      const commData = techCommissionsMap.get(tech.id) || { completedCount: 0, totalCommission: 0, services: [] };
      const existing = getExistingPayout(tech.id, selectedMonth);
      const allPayouts = getStaffPayouts(tech.id, selectedMonth);
      const adelantosPrevios = allPayouts
        .filter(p => p.payout_type === 'adelanto')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const mode: SalaryMode = existing?.salary_mode || tech.salary_mode || ((tech.role === 'ayudante' || tech.role === 'administracion') ? 'fixed' : 'commission');
      
      let baseSalary = 0;
      let commissionAmount = 0;
      let bonusAmount = 0;
      let deductionAmount = 0;
      let workingDays = tech.working_days_default || 30;
      let netPayable = 0;
      let isPaid = false;

      if (existing && existing.payout_type !== 'adelanto') {
        isPaid = true;
        baseSalary = existing.base_salary !== undefined ? existing.base_salary : (mode === 'commission' ? 0 : (tech.base_salary || 0));
        commissionAmount = existing.commission_amount !== undefined ? existing.commission_amount : (mode === 'fixed' ? 0 : commData.totalCommission);
        bonusAmount = existing.bonus_amount || 0;
        deductionAmount = (existing.deduction_amount !== undefined ? existing.deduction_amount : 0) + adelantosPrevios;
        workingDays = existing.working_days || workingDays;
        netPayable = existing.amount;
      } else {
        isPaid = false;
        baseSalary = mode === 'commission' ? 0 : (tech.base_salary || 0);
        commissionAmount = mode === 'fixed' ? 0 : commData.totalCommission;
        bonusAmount = 0;
        deductionAmount = adelantosPrevios;
        netPayable = Math.max(0, (baseSalary + commissionAmount + bonusAmount) - deductionAmount);
      }

      const totalEarnings = baseSalary + commissionAmount + bonusAmount;
      const totalDeductions = deductionAmount;

      return {
        tech,
        mode,
        isPaid,
        existingPayout: existing,
        baseSalary,
        commissionAmount,
        bonusAmount,
        deductionAmount,
        totalEarnings,
        totalDeductions,
        netPayable,
        workingDays,
        vacationDays: 0,
        servicesCount: commData.completedCount,
        servicesList: commData.services
      };
    });
  }, [technicians, techCommissionsMap, technicianPayouts, selectedMonth]);

  // Filtrado de la nómina
  const filteredStaffList = useMemo(() => {
    return staffPayrollList.filter(item => {
      const { tech, isPaid, mode } = item;

      // Búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = tech.name.toLowerCase().includes(term);
        const matchRut = tech.rut.toLowerCase().includes(term);
        const matchRole = (tech.custom_role_title || formatStaffRole(tech.role)).toLowerCase().includes(term);
        if (!matchName && !matchRut && !matchRole) return false;
      }

      // Estado
      if (statusFilter === 'pendientes' && isPaid) return false;
      if (statusFilter === 'pagados' && !isPaid) return false;

      // Rol
      if (roleFilter === 'tecnicos' && !isTechnicalStaff(tech.role)) return false;
      if (roleFilter === 'administrativos' && isTechnicalStaff(tech.role)) return false;

      // Modalidad
      if (modeFilter !== 'todos' && mode !== modeFilter) return false;

      return true;
    });
  }, [staffPayrollList, searchTerm, statusFilter, roleFilter, modeFilter]);

  // KPIs Superiores (estilo nk062_1.png)
  const payrollStats = useMemo(() => {
    let totalPayroll = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let countPaid = 0;
    let countPending = 0;
    let countTechnical = 0;
    let countAdmin = 0;

    staffPayrollList.forEach(item => {
      totalPayroll += item.netPayable;
      if (item.isPaid) {
        totalPaid += item.netPayable;
        countPaid += 1;
      } else {
        totalPending += item.netPayable;
        if (item.netPayable > 0 || item.servicesCount > 0) {
          countPending += 1;
        }
      }

      if (isTechnicalStaff(item.tech.role)) {
        countTechnical += 1;
      } else {
        countAdmin += 1;
      }
    });

    return {
      totalPayroll,
      totalPaid,
      totalPending,
      countPaid,
      countPending,
      countTechnical,
      countAdmin,
      totalStaff: technicians.length
    };
  }, [staffPayrollList, technicians]);

  // Manejo de Período (Mes Anterior / Siguiente)
  const handlePrevMonth = () => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevDate = subMonths(new Date(year, month - 1, 1), 1);
      setSelectedMonth(format(prevDate, 'yyyy-MM'));
    } catch {}
  };

  const handleNextMonth = () => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const nextDate = addMonths(new Date(year, month - 1, 1), 1);
      setSelectedMonth(format(nextDate, 'yyyy-MM'));
    } catch {}
  };

  // Abrir Modal de Aprobar Liquidación / Registrar Pago
  const handleOpenPayModal = (item: typeof staffPayrollList[0]) => {
    setPayingStaff(item.tech);
    setPayWorkingDays(item.workingDays);
    setPayBaseSalary(item.baseSalary);
    setPayCommissionAmount(item.commissionAmount);
    setPayBonusAmount(item.bonusAmount);
    setPayDeductionAmount(item.deductionAmount);
    setPayDate(item.existingPayout?.payment_date || format(new Date(), 'yyyy-MM-dd'));
    setPayMethod((item.existingPayout?.payment_method as any) || 'transferencia');
    setPayReference(item.existingPayout?.payment_reference || '');
    setPayNotes(item.existingPayout?.notes || `Liquidación de sueldo y honorarios correspondiente a ${selectedMonth}.`);
  };

  // Confirmar Pago / Liquidación
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStaff || !onAddTechnicianPayout) return;

    const commData = techCommissionsMap.get(payingStaff.id) || { completedCount: 0, totalCommission: 0, services: [] };
    const netAmount = Math.max(0, (payBaseSalary + payCommissionAmount + payBonusAmount) - payDeductionAmount);

    await onAddTechnicianPayout({
      technician_id: payingStaff.id,
      technician_name: payingStaff.name,
      technician_role: payingStaff.role || 'tecnico',
      salary_mode: payingStaff.salary_mode || 'commission',
      base_salary: Number(payBaseSalary) || 0,
      commission_amount: Number(payCommissionAmount) || 0,
      bonus_amount: Number(payBonusAmount) || 0,
      deduction_amount: Number(payDeductionAmount) || 0,
      working_days: Number(payWorkingDays) || 30,
      period_month: selectedMonth,
      amount: netAmount,
      payment_date: payDate,
      payment_method: payMethod,
      payment_reference: payReference.trim(),
      notes: payNotes.trim(),
      order_ids: commData.services.map(s => s.order.id)
    });

    setPayingStaff(null);
  };

  // Abrir Modal Agregar Colaborador
  const handleOpenAddStaff = () => {
    setStaffName('');
    setStaffRut('');
    setStaffPhone(settings?.phone || '+56 9 ');
    setStaffEmail('');
    setStaffRole('tecnico');
    setStaffCustomTitle('');
    setStaffSalaryMode('commission');
    setStaffBaseSalary(0);
    setStaffWorkingDays(30);
    setStaffSecCertified(true);
    setStaffCertNumber('SEC-HVAC-');
    setCommMantVal(20000);
    setCommInstVal(35000);
    setCommRepVal(15000);
    setIsAddStaffModalOpen(true);
  };

  // Abrir Modal Editar Colaborador
  const handleOpenEditStaff = (tech: Technician) => {
    setEditingStaff(tech);
    setStaffName(tech.name);
    setStaffRut(tech.rut);
    setStaffPhone(tech.phone);
    setStaffEmail(tech.email || '');
    setStaffRole((tech.role as StaffRole) || 'tecnico');
    setStaffCustomTitle(tech.custom_role_title || '');
    setStaffSalaryMode(tech.salary_mode || ((tech.role === 'ayudante' || tech.role === 'administracion') ? 'fixed' : 'commission'));
    setStaffBaseSalary(tech.base_salary || 0);
    setStaffWorkingDays(tech.working_days_default || 30);
    setStaffSecCertified(Boolean(tech.sec_certified));
    setStaffCertNumber(tech.certification_number || '');
    setCommMantType(tech.commission_mantencion_type || 'fixed');
    setCommMantVal(tech.commission_mantencion_value ?? 20000);
    setCommInstType(tech.commission_instalacion_type || 'fixed');
    setCommInstVal(tech.commission_instalacion_value ?? 35000);
    setCommRepType(tech.commission_reparacion_type || 'fixed');
    setCommRepVal(tech.commission_reparacion_value ?? 15000);
  };

  // Submit Agregar Colaborador
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTechnician({
      name: staffName,
      rut: staffRut,
      phone: staffPhone,
      email: staffEmail || undefined,
      role: staffRole,
      custom_role_title: staffCustomTitle || undefined,
      salary_mode: staffSalaryMode,
      base_salary: Number(staffBaseSalary) || 0,
      working_days_default: Number(staffWorkingDays) || 30,
      sec_certified: staffRole === 'tecnico' ? staffSecCertified : false,
      certification_number: (staffRole === 'tecnico' && staffSecCertified) ? staffCertNumber : undefined,
      status: 'disponible',
      commission_mantencion_type: commMantType,
      commission_mantencion_value: commMantVal,
      commission_instalacion_type: commInstType,
      commission_instalacion_value: commInstVal,
      commission_reparacion_type: commRepType,
      commission_reparacion_value: commRepVal,
    });
    setIsAddStaffModalOpen(false);
  };

  // Submit Editar Colaborador
  const handleEditStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    onUpdateTechnician(editingStaff.id, {
      name: staffName,
      rut: staffRut,
      phone: staffPhone,
      email: staffEmail || undefined,
      role: staffRole,
      custom_role_title: staffCustomTitle || undefined,
      salary_mode: staffSalaryMode,
      base_salary: Number(staffBaseSalary) || 0,
      working_days_default: Number(staffWorkingDays) || 30,
      sec_certified: staffRole === 'tecnico' ? staffSecCertified : false,
      certification_number: (staffRole === 'tecnico' && staffSecCertified) ? staffCertNumber : undefined,
      commission_mantencion_type: commMantType,
      commission_mantencion_value: commMantVal,
      commission_instalacion_type: commInstType,
      commission_instalacion_value: commInstVal,
      commission_reparacion_type: commRepType,
      commission_reparacion_value: commRepVal,
    });
    setEditingStaff(null);
  };

  // Generar WhatsApp de Liquidación
  const handleSendWhatsApp = (item: typeof staffPayrollList[0]) => {
    const message = `*LIQUIDACIÓN MENSUAL DE SUELDO & HONORARIOS* ❄️\n` +
      `🏢 Empresa: *${settings?.company_name || 'Nexus Air'}*\n` +
      `👤 Colaborador: *${item.tech.name}*\n` +
      `🆔 RUT: *${item.tech.rut}*\n` +
      `💼 Cargo: *${item.tech.custom_role_title || formatStaffRole(item.tech.role)}*\n` +
      `⚙️ Modalidad: *${formatSalaryMode(item.mode)}*\n` +
      `📅 Período: *${selectedMonth}*\n` +
      `⏱️ Días Trabajados: *${item.workingDays} días*\n\n` +
      `*DETALLE DE HABERES:*\n` +
      (item.baseSalary > 0 ? `• Sueldo Base: ${formatAirPrice(item.baseSalary, currencySymbol, countryCode)}\n` : '') +
      (item.commissionAmount > 0 ? `• Comisiones por Servicios (${item.servicesCount}): ${formatAirPrice(item.commissionAmount, currencySymbol, countryCode)}\n` : '') +
      (item.bonusAmount > 0 ? `• Bonos Adicionales: ${formatAirPrice(item.bonusAmount, currencySymbol, countryCode)}\n` : '') +
      `*Total Haberes: ${formatAirPrice(item.totalEarnings, currencySymbol, countryCode)}*\n\n` +
      (item.totalDeductions > 0 ? `*DESCUENTOS / ANTICIPOS:*\n• Total Descuentos: -${formatAirPrice(item.totalDeductions, currencySymbol, countryCode)}\n\n` : '') +
      `💵 *LÍQUIDO A PAGAR: ${formatAirPrice(item.netPayable, currencySymbol, countryCode)}*\n` +
      `Estado: *${item.isPaid ? `PAGADO el ${item.existingPayout?.payment_date}` : 'PENDIENTE DE PAGO'}*\n\n` +
      `_Comprobante generado por Nexus Air_`;

    const cleanPhone = item.tech.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Helper de iniciales
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] ? parts[0].slice(0, 2) : 'NA').toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header con Selector de Período y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shadow-xs">
            <Banknote className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {settings?.staff_payroll_title || 'Sueldos & Pagos del Personal'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                Módulo Nómina
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Liquidaciones mensuales, sueldos fijos, comisiones operativas y emisión de comprobantes
            </p>
          </div>
        </div>

        {/* Período Selector y Botones */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector Mes / Año */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Registrar Colaborador */}
          <button
            onClick={handleOpenAddStaff}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Colaborador</span>
          </button>

          {/* Botón Ir a Equipo Técnico */}
          {onNavigateToTechnicians && (
            <button
              onClick={onNavigateToTechnicians}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="Ir a gestión técnica"
            >
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Equipo Técnico</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Fila de KPIs Superiores (estilo nk062_1.png) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              Resumen de Nómina y Liquidaciones • <span className="font-mono text-emerald-300">{selectedMonth}</span>
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {payrollStats.totalStaff} colaboradores registrados ({payrollStats.countTechnical} operativos / {payrollStats.countAdmin} administrativos)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Nómina Mes */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all">
            <span className="text-[11px] text-slate-400 block font-medium mb-1">
              Total Nómina del Período
            </span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {formatAirPrice(payrollStats.totalPayroll, currencySymbol, countryCode)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-medium">
              Suma de sueldos base + comisiones
            </span>
          </div>

          {/* Ya Liquidado / Pagado */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
              <span>Total Ya Liquidado</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {payrollStats.countPaid} pagado{payrollStats.countPaid !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatAirPrice(payrollStats.totalPaid, currencySymbol, countryCode)}
            </span>
            <span className="text-[10px] text-emerald-300/80 block mt-1 font-medium">
              Egresos confirmados en balance
            </span>
          </div>

          {/* Pendiente por Liquidar */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
              <span>Pendiente de Pago</span>
              {payrollStats.totalPending === 0 ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Al día
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {payrollStats.countPending} pendiente{payrollStats.countPending !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <span className={`text-xl sm:text-2xl font-black font-mono ${
              payrollStats.totalPending === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {formatAirPrice(payrollStats.totalPending, currencySymbol, countryCode)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-medium">
              Por liquidar y transferir
            </span>
          </div>

          {/* Personal Activo */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
              <span>Colaboradores en Nómina</span>
              <span className="text-[10px] text-purple-300 font-mono">
                {payrollStats.totalStaff} activos
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {payrollStats.totalStaff} <span className="text-xs font-normal text-slate-400">personas</span>
            </span>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
              <span className="text-cyan-300">{payrollStats.countTechnical} Terreno</span>
              <span>•</span>
              <span className="text-purple-300">{payrollStats.countAdmin} Oficina</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por colaborador, RUT o cargo..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Filtros Píldoras */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Estado */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'todos' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('pendientes')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'pendientes' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('pagados')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'pagados' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pagados
            </button>
          </div>

          {/* Filtro Rol */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setRoleFilter('todos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                roleFilter === 'todos' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas Áreas
            </button>
            <button
              onClick={() => setRoleFilter('tecnicos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                roleFilter === 'tecnicos' ? 'bg-cyan-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Operativos
            </button>
            <button
              onClick={() => setRoleFilter('administrativos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                roleFilter === 'administrativos' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Administrativos
            </button>
          </div>
        </div>
      </div>

      {/* 4. Grid de Tarjetas de Colaboradores (Diseño idéntico a nk062_2.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredStaffList.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center bg-white border border-slate-200/90 rounded-2xl space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No se encontraron colaboradores</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay colaboradores que coincidan con los filtros seleccionados o no hay personal registrado en este período.
            </p>
            <button
              onClick={handleOpenAddStaff}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2 mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Colaborador</span>
            </button>
          </div>
        ) : (
          filteredStaffList.map((item) => {
            const { tech, isPaid, mode, existingPayout } = item;
            const isTechnical = isTechnicalStaff(tech.role);
            const initials = getInitials(tech.name);

            return (
              <div
                key={tech.id}
                className={`p-5 rounded-2xl bg-white border transition-all duration-200 space-y-4 shadow-xs hover:shadow-md ${
                  isPaid 
                    ? 'border-emerald-200/90 hover:border-emerald-400' 
                    : 'border-slate-200/90 hover:border-cyan-400'
                }`}
              >
                {/* Header de la Tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar Circular con Iniciales */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0 ${
                      isTechnical
                        ? (tech.role === 'ayudante' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600')
                        : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    }`}>
                      {initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-slate-900 leading-tight">
                          {tech.name}
                        </h3>
                      </div>
                      
                      {/* Badge de Cargo + Modalidad */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isTechnical
                            ? (tech.role === 'ayudante' 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                : 'bg-cyan-50 text-cyan-800 border border-cyan-200')
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {tech.custom_role_title || formatStaffRole(tech.role)} • {formatSalaryMode(mode)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Edición */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditStaff(tech)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar datos y sueldo del colaborador"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {onDeleteTechnician && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar a ${tech.name}?`)) {
                            onDeleteTechnician(tech.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bloque RUT / Días Trabajados / Días Vacaciones (3 casillas idénticas a nk062_2.png) */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                      RUT / ID
                    </span>
                    <strong className="text-xs font-mono text-slate-800 font-bold">
                      {tech.rut || 'S/N'}
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                      DÍAS TRAB.
                    </span>
                    <strong className="text-xs font-mono text-slate-800 font-bold">
                      {item.workingDays} días
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                      VACACIONES
                    </span>
                    <strong className="text-xs font-mono text-slate-800 font-bold">
                      {item.vacationDays} días
                    </strong>
                  </div>
                </div>

                {/* Tabla a 2 Columnas: HABERES vs DESCUENTOS (idéntica a nk062_2.png) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Columna Izquierda: HABERES */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Haberes
                      </span>
                      <span className="text-[10px] text-slate-400">Total Ingresos</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-600">Sueldo Base:</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {formatAirPrice(item.baseSalary, currencySymbol, countryCode)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600">Comisiones ({item.servicesCount}):</span>
                          {item.servicesCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setViewingOrdersDetail({ staff: tech, services: item.servicesList })}
                              className="text-[10px] text-cyan-700 hover:text-cyan-900 underline font-semibold cursor-pointer"
                              title="Ver detalle de servicios"
                            >
                              Ver
                            </button>
                          )}
                        </div>
                        <span className="font-mono text-cyan-900 font-bold">
                          {formatAirPrice(item.commissionAmount, currencySymbol, countryCode)}
                        </span>
                      </div>

                      {item.bonusAmount > 0 && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600">Bonos Adicionales:</span>
                          <span className="font-mono text-emerald-800 font-bold">
                            +{formatAirPrice(item.bonusAmount, currencySymbol, countryCode)}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center font-bold text-[11px] text-slate-900">
                        <span>Total Haberes:</span>
                        <span className="font-mono text-slate-900">
                          {formatAirPrice(item.totalEarnings, currencySymbol, countryCode)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: DESCUENTOS */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        Descuentos
                      </span>
                      <span className="text-[10px] text-slate-400">Deducciones</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-600">Leyes Sociales:</span>
                        <span className="font-mono text-slate-700">
                          {formatAirPrice(0, currencySymbol, countryCode)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-600">Anticipos / Préstamos:</span>
                        <span className="font-mono text-slate-700">
                          {formatAirPrice(item.deductionAmount, currencySymbol, countryCode)}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center font-bold text-[11px] text-slate-900">
                        <span>Total Descuentos:</span>
                        <span className="font-mono text-slate-700">
                          {formatAirPrice(item.totalDeductions, currencySymbol, countryCode)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recuadro Destacado: LÍQUIDO A PAGAR (idéntico a nk062_2.png) */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isPaid
                    ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-emerald-500/30'
                    : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-200'
                }`}>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      LÍQUIDO A PAGAR
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isPaid ? `Liquidado el ${existingPayout?.payment_date}` : 'Monto neto a transferir al colaborador'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-emerald-600 tracking-tight">
                      {formatAirPrice(item.netPayable, currencySymbol, countryCode)}
                    </span>
                  </div>
                </div>

                {/* Footer de Tarjeta con Estado y Botones de Acción */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                  {/* Badge de Estado */}
                  <div>
                    {isPaid ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pagado • {existingPayout?.payment_method?.toUpperCase()}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Liquidación Pendiente</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(item)}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      title="Enviar comprobante por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {isPaid ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewingReceipt({ staff: tech, payout: existingPayout! })}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          title="Ver o imprimir comprobante formal de liquidación"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Comprobante</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(item)}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          title="Ajustar o editar liquidación ya registrada"
                        >
                          <span>Ajustar</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPayModal(item)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        title="Aprobar liquidación y registrar egreso en el negocio"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Aprobar & Pagar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Modal: Registrar / Aprobar Pago de Liquidación */}
      {payingStaff && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayingStaff(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl my-6 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Aprobar Liquidación & Pago
                  </h3>
                  <p className="text-xs text-slate-400">
                    Período: <strong className="text-cyan-800 font-mono">{selectedMonth}</strong> • {payingStaff.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingStaff(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              {/* Resumen del Colaborador */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Colaborador:</span>
                  <span className="font-bold text-slate-900">{payingStaff.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Cargo & Modalidad:</span>
                  <span className="font-semibold text-cyan-800">
                    {payingStaff.custom_role_title || formatStaffRole(payingStaff.role)} ({formatSalaryMode(payingStaff.salary_mode)})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">RUT / Identificación:</span>
                  <span className="font-mono text-slate-700">{payingStaff.rut}</span>
                </div>
              </div>

              {/* Ajuste de Componentes de Nómina */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Días Trabajados
                  </label>
                  <input
                    type="number"
                    value={payWorkingDays}
                    onChange={(e) => setPayWorkingDays(Number(e.target.value))}
                    min={1}
                    max={31}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Sueldo Base ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={payBaseSalary}
                    onChange={(e) => setPayBaseSalary(Number(e.target.value))}
                    min={0}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Comisiones Acumuladas ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={payCommissionAmount}
                    onChange={(e) => setPayCommissionAmount(Number(e.target.value))}
                    min={0}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Bonos Adicionales ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={payBonusAmount}
                    onChange={(e) => setPayBonusAmount(Number(e.target.value))}
                    min={0}
                    placeholder="0"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Descuentos / Anticipos ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={payDeductionAmount}
                  onChange={(e) => setPayDeductionAmount(Number(e.target.value))}
                  min={0}
                  placeholder="0"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Total Líquido Calculado en Vivo */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide block">
                    TOTAL LÍQUIDO A PAGAR
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    (Base + Comisiones + Bonos) - Descuentos
                  </span>
                </div>
                <span className="text-xl font-black font-mono text-emerald-800">
                  {formatAirPrice(
                    Math.max(0, (Number(payBaseSalary) + Number(payCommissionAmount) + Number(payBonusAmount)) - Number(payDeductionAmount)),
                    currencySymbol,
                    countryCode
                  )}
                </span>
              </div>

              {/* Datos de Transferencia */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Fecha de Pago</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Método de Pago</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
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
                  N° de Referencia / Comprobante Bancario
                </label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="Ej: Transf. Banco Santander #98214"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Observaciones de la Liquidación
                </label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Notas internas..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingStaff(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprobar & Registrar Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Comprobante Formal de Liquidación de Sueldo (Imprimible) */}
      {viewingReceipt && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingReceipt(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 cursor-default"
          >
            {/* Header del modal */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-sm">
                  Comprobante de Liquidación • {viewingReceipt.payout.payout_number}
                </span>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hoja Imprimible */}
            <div className="p-8 space-y-6 text-slate-900 text-xs" id="official-payroll-receipt">
              {/* Membrete de la Empresa */}
              <div className="flex items-start justify-between border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    {settings?.company_name || 'Nexus Air Climatización SpA'}
                  </h2>
                  <p className="text-slate-600 font-mono text-[11px]">
                    RUT: {settings?.rut || '77.890.123-K'}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {settings?.address || 'Av. Las Condes 10450'} • {settings?.city || 'Santiago'}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Tel: {settings?.phone || '+56 9 8765 4321'} • {settings?.email || 'contacto@nexusair.cl'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 font-mono font-bold text-xs text-slate-800 border border-slate-200 block">
                    {viewingReceipt.payout.payout_number}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Período: <strong className="text-slate-800 font-mono">{viewingReceipt.payout.period_month}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Fecha de Pago: <strong className="text-slate-800 font-mono">{viewingReceipt.payout.payment_date}</strong>
                  </span>
                </div>
              </div>

              {/* Título Central */}
              <div className="text-center py-1 bg-slate-100/70 rounded-lg border border-slate-200">
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                  LIQUIDACIÓN DE SUELDO Y HONORARIOS
                </h3>
              </div>

              {/* Datos del Trabajador */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Colaborador:</span>
                  <strong className="text-slate-900 text-sm font-bold block">{viewingReceipt.staff.name}</strong>
                  <span className="text-slate-600 font-mono text-[11px]">RUT: {viewingReceipt.staff.rut}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Cargo & Modalidad:</span>
                  <strong className="text-slate-900 text-sm font-bold block">
                    {viewingReceipt.staff.custom_role_title || formatStaffRole(viewingReceipt.staff.role)}
                  </strong>
                  <span className="text-slate-600 text-[11px]">
                    {formatSalaryMode(viewingReceipt.payout.salary_mode || viewingReceipt.staff.salary_mode)} • {viewingReceipt.payout.working_days || 30} días trabajados
                  </span>
                </div>
              </div>

              {/* Tabla Haberes vs Descuentos */}
              <div className="grid grid-cols-2 gap-4">
                {/* Haberes */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-2 border-b border-slate-200 font-bold text-slate-800 uppercase text-[11px]">
                    HABERES
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sueldo Base:</span>
                      <span className="font-mono font-bold">
                        {formatAirPrice(viewingReceipt.payout.base_salary || 0, currencySymbol, countryCode)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Comisiones Servicios:</span>
                      <span className="font-mono font-bold">
                        {formatAirPrice(viewingReceipt.payout.commission_amount || 0, currencySymbol, countryCode)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bonos Adicionales:</span>
                      <span className="font-mono font-bold">
                        {formatAirPrice(viewingReceipt.payout.bonus_amount || 0, currencySymbol, countryCode)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                      <span>TOTAL HABERES:</span>
                      <span className="font-mono">
                        {formatAirPrice(
                          (viewingReceipt.payout.base_salary || 0) + (viewingReceipt.payout.commission_amount || 0) + (viewingReceipt.payout.bonus_amount || 0),
                          currencySymbol,
                          countryCode
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Descuentos */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-2 border-b border-slate-200 font-bold text-slate-800 uppercase text-[11px]">
                    DESCUENTOS
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Leyes Sociales / Previsión:</span>
                      <span className="font-mono">
                        {formatAirPrice(0, currencySymbol, countryCode)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Anticipos / Préstamos:</span>
                      <span className="font-mono font-bold">
                        {formatAirPrice(viewingReceipt.payout.deduction_amount || 0, currencySymbol, countryCode)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Otros Descuentos:</span>
                      <span className="font-mono">
                        {formatAirPrice(0, currencySymbol, countryCode)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                      <span>TOTAL DESCUENTOS:</span>
                      <span className="font-mono">
                        {formatAirPrice(viewingReceipt.payout.deduction_amount || 0, currencySymbol, countryCode)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Líquido en Grande */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-black text-sm text-emerald-950 uppercase tracking-wider block">
                    ALCANCE LÍQUIDO A PAGAR:
                  </span>
                  <span className="text-xs text-emerald-800">
                    Método: {viewingReceipt.payout.payment_method?.toUpperCase()}
                    {viewingReceipt.payout.payment_reference ? ` • Ref: ${viewingReceipt.payout.payment_reference}` : ''}
                  </span>
                </div>
                <span className="text-2xl font-black font-mono text-emerald-900">
                  {formatAirPrice(viewingReceipt.payout.amount, currencySymbol, countryCode)}
                </span>
              </div>

              {/* Firma y Conforme */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
                <div className="border-t border-slate-400 pt-2 space-y-1">
                  <p className="font-bold text-slate-900">FIRMA EMPLEADOR</p>
                  <p className="text-[11px] text-slate-500">{settings?.company_name || 'Nexus Air'}</p>
                </div>
                <div className="border-t border-slate-400 pt-2 space-y-1">
                  <p className="font-bold text-slate-900">FIRMA TRABAJADOR</p>
                  <p className="text-[11px] text-slate-500">Recibí conforme el alcance líquido indicado</p>
                </div>
              </div>
            </div>

            {/* Footer con Botones de Imprimir */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Detalle de Servicios Realizados (Auditoría de Comisiones) */}
      {viewingOrdersDetail && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingOrdersDetail(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl my-6 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Servicios de {viewingOrdersDetail.staff.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Período {selectedMonth} • {viewingOrdersDetail.services.length} órdenes completadas
                </p>
              </div>
              <button
                onClick={() => setViewingOrdersDetail(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
              {viewingOrdersDetail.services.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-cyan-800">
                        {item.order.ticket_number}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="font-medium text-slate-800">{item.serviceName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cliente: {item.order.customer?.name || 'Cliente Particular'} • Fecha: {item.order.completed_at?.split('T')[0] || item.order.scheduled_date}
                    </p>
                  </div>
                  <span className="font-mono font-black text-emerald-700 text-sm shrink-0">
                    +{formatAirPrice(item.commissionEarned, currencySymbol, countryCode)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-700 text-xs">TOTAL COMISIONES:</span>
              <span className="font-mono font-black text-emerald-800 text-base">
                {formatAirPrice(
                  viewingOrdersDetail.services.reduce((acc, s) => acc + s.commissionEarned, 0),
                  currencySymbol,
                  countryCode
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Agregar Colaborador */}
      {isAddStaffModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddStaffModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl my-6 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Registrar Nuevo Colaborador
              </h3>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3.5 text-xs">
              {/* Rol / Área */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Cargo / Área de Trabajo</label>
                <select
                  value={staffRole}
                  onChange={(e) => {
                    const newRole = e.target.value as StaffRole;
                    setStaffRole(newRole);
                    if (newRole === 'tecnico') {
                      setStaffSalaryMode('commission');
                    } else if (newRole === 'ayudante') {
                      setStaffSalaryMode('fixed');
                      setStaffBaseSalary(600000);
                    } else {
                      setStaffSalaryMode('fixed');
                      setStaffBaseSalary(750000);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="tecnico">🔧 Técnico Líder (Asignable a órdenes)</option>
                  <option value="ayudante">👷 Ayudante Técnico (Asignable como apoyo)</option>
                  <option value="administracion">💼 Administración / Facturación (No asignable)</option>
                  <option value="recepcion">📞 Recepción / Atención al Cliente (No asignable)</option>
                  <option value="limpieza">🧹 Aseo & Mantención (No asignable)</option>
                  <option value="chofer_logistica">🚚 Chofer / Logística (No asignable)</option>
                  <option value="otro">👤 Otro Cargo Personalizado (No asignable)</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isTechnicalStaff(staffRole) 
                    ? '✓ Este colaborador podrá ser asignado a órdenes de servicio.' 
                    : '🔒 Los cargos administrativos conviven en la nómina pero tienen bloqueada la asignación en órdenes de terreno.'}
                </span>
              </div>

              {/* Título de Cargo Personalizado */}
              <div>
                <label className="text-slate-700 font-medium">Título de Cargo para Liquidación (Opcional)</label>
                <input
                  type="text"
                  value={staffCustomTitle}
                  onChange={(e) => setStaffCustomTitle(e.target.value)}
                  placeholder="Ej: Jefa de Finanzas, Coordinador de Terreno, Mecánico Senior"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium">Nombre Completo</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Ej: Rodrigo Araya Silva"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">RUT / Identificación</label>
                  <input
                    type="text"
                    value={staffRut}
                    onChange={(e) => setStaffRut(e.target.value)}
                    placeholder="17.821.340-9"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Teléfono</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="colaborador@nexusair.cl"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                />
              </div>

              {/* Configuración de Remuneración y Modalidad */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 text-xs block">
                  Modalidad de Remuneración
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffSalaryMode('fixed')}
                    className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      staffSalaryMode === 'fixed'
                        ? 'bg-purple-50 border-purple-500 text-purple-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Solo Fijo
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffSalaryMode('commission')}
                    className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      staffSalaryMode === 'commission'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Solo Comisión
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffSalaryMode('fixed_and_commission')}
                    className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      staffSalaryMode === 'fixed_and_commission'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Fijo + Comisión
                  </button>
                </div>

                {staffSalaryMode !== 'commission' && (
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Sueldo Base Mensual ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={staffBaseSalary}
                      onChange={(e) => setStaffBaseSalary(Number(e.target.value))}
                      placeholder="Ej: 550000"
                      min={0}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Si es técnico: Comisiones */}
              {isTechnicalStaff(staffRole) && staffSalaryMode !== 'fixed' && (
                <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-2.5">
                  <span className="font-bold text-cyan-950 text-xs block">
                    Tarifas de Comisión Pactadas por Orden
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Mantenimiento:</span>
                      <input
                        type="number"
                        value={commMantVal}
                        onChange={(e) => setCommMantVal(Number(e.target.value))}
                        className="w-full p-1 bg-slate-50 border rounded text-xs font-mono font-bold mt-1"
                      />
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Instalación:</span>
                      <input
                        type="number"
                        value={commInstVal}
                        onChange={(e) => setCommInstVal(Number(e.target.value))}
                        className="w-full p-1 bg-slate-50 border rounded text-xs font-mono font-bold mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
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

      {/* 9. Modal: Editar Colaborador */}
      {editingStaff && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingStaff(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl my-6 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Editar Colaborador • {editingStaff.name}
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStaffSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Cargo / Área de Trabajo</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="tecnico">🔧 Técnico Líder (Asignable a órdenes)</option>
                  <option value="ayudante">👷 Ayudante Técnico (Asignable como apoyo)</option>
                  <option value="administracion">💼 Administración / Facturación (No asignable)</option>
                  <option value="recepcion">📞 Recepción / Atención al Cliente (No asignable)</option>
                  <option value="limpieza">🧹 Aseo & Mantención (No asignable)</option>
                  <option value="chofer_logistica">🚚 Chofer / Logística (No asignable)</option>
                  <option value="otro">👤 Otro Cargo Personalizado (No asignable)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Título de Cargo para Liquidación</label>
                <input
                  type="text"
                  value={staffCustomTitle}
                  onChange={(e) => setStaffCustomTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium">Nombre Completo</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">RUT / Identificación</label>
                  <input
                    type="text"
                    value={staffRut}
                    onChange={(e) => setStaffRut(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Teléfono</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  />
                </div>
              </div>

              {/* Remuneración y Modalidad */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 text-xs block">
                  Modalidad de Remuneración
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffSalaryMode('fixed')}
                    className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      staffSalaryMode === 'fixed'
                        ? 'bg-purple-50 border-purple-500 text-purple-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Solo Fijo
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffSalaryMode('commission')}
                    className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      staffSalaryMode === 'commission'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Solo Comisión
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffSalaryMode('fixed_and_commission')}
                    className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      staffSalaryMode === 'fixed_and_commission'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Fijo + Comisión
                  </button>
                </div>

                {staffSalaryMode !== 'commission' && (
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Sueldo Base Mensual ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={staffBaseSalary}
                      onChange={(e) => setStaffBaseSalary(Number(e.target.value))}
                      min={0}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Si es técnico: Comisiones */}
              {isTechnicalStaff(staffRole) && staffSalaryMode !== 'fixed' && (
                <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-2.5">
                  <span className="font-bold text-cyan-950 text-xs block">
                    Tarifas de Comisión Pactadas por Orden
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Mantenimiento:</span>
                      <input
                        type="number"
                        value={commMantVal}
                        onChange={(e) => setCommMantVal(Number(e.target.value))}
                        className="w-full p-1 bg-slate-50 border rounded text-xs font-mono font-bold mt-1"
                      />
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Instalación:</span>
                      <input
                        type="number"
                        value={commInstVal}
                        onChange={(e) => setCommInstVal(Number(e.target.value))}
                        className="w-full p-1 bg-slate-50 border rounded text-xs font-mono font-bold mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
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
    </div>
  );
};
