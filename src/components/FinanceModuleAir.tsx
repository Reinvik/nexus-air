import React, { useState, useMemo } from 'react';
import { 
  ServiceOrder, 
  AirSettings, 
  FixedCosts, 
  Expense, 
  ExpenseCategory, 
  FinanceSettings,
  TechnicianPayout,
  formatServiceType 
} from '../types';
import { DualCurrencyAir } from './DualCurrencyAir';
import { formatAirPrice, findCountry } from '../lib/countries';
import { 
  Scale, 
  Target, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calculator, 
  Building2, 
  Calendar, 
  CreditCard, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Share2, 
  Sliders, 
  Receipt, 
  Sparkles,
  HelpCircle,
  Truck,
  Wrench,
  Snowflake,
  ShieldCheck,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FinanceModuleAirProps {
  orders: ServiceOrder[];
  settings: AirSettings;
  fixedCosts: FixedCosts;
  expenses: Expense[];
  financeSettings: FinanceSettings;
  technicianPayouts?: TechnicianPayout[];
  onUpdateFixedCosts: (newCosts: Partial<FixedCosts>) => void;
  onAddExpense: (data: Omit<Expense, 'id' | 'created_at'>) => void;
  onUpdateExpense: (id: string, updates: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateFinanceSettings: (newSettings: Partial<FinanceSettings>) => void;
}

const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; icon: React.ElementType; color: string }> = {
  combustible: { label: 'Combustible & Vehículos', icon: Truck, color: 'text-amber-500 bg-amber-500/10' },
  repuestos_insumos: { label: 'Repuestos & Tuberías', icon: Wrench, color: 'text-cyan-500 bg-cyan-500/10' },
  herramientas: { label: 'Herramientas & Manómetros', icon: Snowflake, color: 'text-blue-500 bg-blue-500/10' },
  arriendo: { label: 'Arriendo Taller & Bodega', icon: Building2, color: 'text-purple-500 bg-purple-500/10' },
  nomina_viaticos: { label: 'Nómina & Viáticos', icon: CreditCard, color: 'text-emerald-500 bg-emerald-500/10' },
  servicios_basicos: { label: 'Servicios Básicos (Luz/Agua)', icon: Flame, color: 'text-rose-500 bg-rose-500/10' },
  marketing: { label: 'Marketing & Publicidad', icon: Sparkles, color: 'text-pink-500 bg-pink-500/10' },
  impuestos_tasas: { label: 'Impuestos & Patentes', icon: Receipt, color: 'text-slate-400 bg-slate-500/10' },
  otro: { label: 'Otros Gastos Operativos', icon: HelpCircle, color: 'text-indigo-400 bg-indigo-500/10' },
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const FinanceModuleAir: React.FC<FinanceModuleAirProps> = ({
  orders,
  settings,
  fixedCosts,
  expenses,
  financeSettings,
  technicianPayouts = [],
  onUpdateFixedCosts,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateFinanceSettings,
}) => {
  // Contexto de país y moneda
  const countryCode = settings?.country_code || 'CL';
  const countryInfo = findCountry(countryCode);
  const isVE = countryCode === 'VE';
  const isCL = countryCode === 'CL';
  const isCR = countryCode === 'CR';

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'breakeven' | 'expenses' | 'pnl'>('breakeven');

  // Selector de período mensual
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed

  // Modales
  const [showFixedCostsModal, setShowFixedCostsModal] = useState(false);
  const [tempFixedCosts, setTempFixedCosts] = useState<FixedCosts>({ ...fixedCosts });
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Formulario de nuevo / editar egreso
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('combustible');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expPaymentMethod, setExpPaymentMethod] = useState('transferencia');
  const [expSupplier, setExpSupplier] = useState('');
  const [expInvoiceNumber, setExpInvoiceNumber] = useState('');
  const [expIsFixed, setExpIsFixed] = useState(false);
  const [expStatus, setExpStatus] = useState<'pagado' | 'pendiente'>('pagado');

  // Filtros de egresos
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');

  // Modal de configuración de país / tipo de cambio
  const [showCountrySettingsModal, setShowCountrySettingsModal] = useState(false);
  const [tempExchangeRate, setTempExchangeRate] = useState(financeSettings?.exchange_rate || (isVE ? 36.5 : isCR ? 520 : 940));
  const [tempUfValue, setTempUfValue] = useState(financeSettings?.uf_value || 38200);

  // Navegación de mes
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  // -------------------------------------------------------------
  // CÁLCULOS FINANCIEROS Y PUNTO DE EQUILIBRIO (useMemo)
  // -------------------------------------------------------------

  // 1. Órdenes del mes seleccionado (excluyendo canceladas)
  const monthOrders = useMemo(() => {
    return orders.filter(ord => {
      if (ord.status === 'cancelado') return false;
      const d = new Date(ord.scheduled_date || ord.created_at || Date.now());
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [orders, selectedMonth, selectedYear]);

  // Total facturado en el mes
  const monthSalesTotal = useMemo(() => {
    return monthOrders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
  }, [monthOrders]);

  const monthOrdersCount = monthOrders.length;

  // Ticket promedio del mes
  const avgTicket = useMemo(() => {
    if (monthOrdersCount === 0) return settings.standard_maintenance_price || 45000;
    return Math.max(1, monthSalesTotal / monthOrdersCount);
  }, [monthSalesTotal, monthOrdersCount, settings.standard_maintenance_price]);

  // 2. Costos Variables del Mes:
  // - Insumos consumidos en órdenes
  // - Honorarios y comisiones de técnicos
  // - Egresos variables registrados
  const monthVariableExpensesTotal = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      const d = new Date(exp.date || Date.now());
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        if (!exp.is_fixed) {
          return sum + (Number(exp.amount) || 0);
        }
      }
      return sum;
    }, 0);
  }, [expenses, selectedMonth, selectedYear]);

  const monthTechCommissionsTotal = useMemo(() => {
    return monthOrders.reduce((sum, ord) => {
      let techComm = 0;
      if (ord.technician_payout_type === 'percentage') {
        techComm = Math.round((ord.total * (ord.technician_payout_value || 0)) / 100);
      } else {
        techComm = ord.technician_payout_value || 0;
      }
      let assComm = 0;
      if (ord.assigned_assistant_id) {
        if (ord.assistant_payout_type === 'percentage') {
          assComm = Math.round((ord.total * (ord.assistant_payout_value || 0)) / 100);
        } else {
          assComm = ord.assistant_payout_value || 0;
        }
      }
      return sum + techComm + assComm;
    }, 0);
  }, [monthOrders]);

  const totalVariableCosts = monthVariableExpensesTotal + monthTechCommissionsTotal;

  // 3. Costos Fijos Estructurales del Mes
  const structuralFixedCosts = useMemo(() => {
    const fc = fixedCosts || { rent: 0, salaries: 0, services: 0, software: 0, marketing: 0, transport: 0, other: 0 };
    return (
      (Number(fc.rent) || 0) +
      (Number(fc.salaries) || 0) +
      (Number(fc.services) || 0) +
      (Number(fc.software) || 0) +
      (Number(fc.marketing) || 0) +
      (Number(fc.transport) || 0) +
      (Number(fc.other) || 0)
    );
  }, [fixedCosts]);

  // Gastos registrados en el mes con flag is_fixed: true
  const monthRegisteredFixedExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      const d = new Date(exp.date || Date.now());
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        if (exp.is_fixed) {
          return sum + (Number(exp.amount) || 0);
        }
      }
      return sum;
    }, 0);
  }, [expenses, selectedMonth, selectedYear]);

  // NK-045: Desglose específico para servicios públicos, gasolina/combustible e insumos del mes
  const monthPublicServicesExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      const d = new Date(exp.date || Date.now());
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        if (exp.category === 'servicios_basicos') {
          return sum + (Number(exp.amount) || 0);
        }
      }
      return sum;
    }, 0);
  }, [expenses, selectedMonth, selectedYear]);

  const monthFuelExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      const d = new Date(exp.date || Date.now());
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        if (exp.category === 'combustible') {
          return sum + (Number(exp.amount) || 0);
        }
      }
      return sum;
    }, 0);
  }, [expenses, selectedMonth, selectedYear]);

  const monthSuppliesExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      const d = new Date(exp.date || Date.now());
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        if (exp.category === 'repuestos_insumos' || exp.category === 'herramientas') {
          return sum + (Number(exp.amount) || 0);
        }
      }
      return sum;
    }, 0);
  }, [expenses, selectedMonth, selectedYear]);

  // Total de Costos Fijos
  const totalFixedCosts = Math.max(structuralFixedCosts, monthRegisteredFixedExpenses > 0 ? (structuralFixedCosts + monthRegisteredFixedExpenses) : structuralFixedCosts);

  // 4. Margen de Contribución Promedio (%)
  const calculatedMarginPct = useMemo(() => {
    if (monthSalesTotal <= 0) return 42; // Estándar promedio de la industria HVAC
    const margin = ((monthSalesTotal - totalVariableCosts) / monthSalesTotal) * 100;
    return Math.max(5, Math.min(95, Math.round(margin)));
  }, [monthSalesTotal, totalVariableCosts]);

  const effectiveMarginPct = financeSettings?.manual_margin_pct != null
    ? financeSettings.manual_margin_pct
    : calculatedMarginPct;

  // 5. Punto de Equilibrio en Facturación ($)
  // Fórmula: Costos Fijos / (Margen de Contribución / 100)
  const breakEvenAmount = useMemo(() => {
    if (effectiveMarginPct <= 0) return 0;
    return Math.round(totalFixedCosts / (effectiveMarginPct / 100));
  }, [totalFixedCosts, effectiveMarginPct]);

  // 6. Punto de Equilibrio en Unidades / Servicios
  const breakEvenMaintenances = useMemo(() => {
    const price = settings.standard_maintenance_price || 45000;
    if (price <= 0) return 0;
    return Math.ceil(breakEvenAmount / price);
  }, [breakEvenAmount, settings.standard_maintenance_price]);

  const breakEvenInstallations = useMemo(() => {
    const price = settings.standard_installation_price || 120000;
    if (price <= 0) return 0;
    return Math.ceil(breakEvenAmount / price);
  }, [breakEvenAmount, settings.standard_installation_price]);

  const breakEvenOrdersCount = useMemo(() => {
    if (avgTicket <= 0) return 0;
    return Math.ceil(breakEvenAmount / avgTicket);
  }, [breakEvenAmount, avgTicket]);

  // 7. Porcentaje de Cobertura del Equilibrio
  const breakevenCoveragePct = useMemo(() => {
    if (breakEvenAmount <= 0) return 0;
    return Math.min(300, Math.round((monthSalesTotal / breakEvenAmount) * 100));
  }, [monthSalesTotal, breakEvenAmount]);

  // 8. Ritmo y Cadencia Diaria (Run Rate)
  const now = new Date();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const isCurrentMonth = now.getMonth() === selectedMonth && now.getFullYear() === selectedYear;
  const isPastMonth = selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth());
  const daysElapsed = isCurrentMonth ? Math.max(1, now.getDate()) : (isPastMonth ? daysInMonth : 0);
  const timeProgressPct = daysInMonth > 0 ? Number(((daysElapsed / daysInMonth) * 100).toFixed(1)) : 0;
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const currentDailyRate = daysElapsed > 0 ? Math.round(monthSalesTotal / daysElapsed) : 0;
  const requiredDailyRate = daysRemaining > 0 
    ? Math.max(0, Math.round((breakEvenAmount - monthSalesTotal) / daysRemaining))
    : 0;

  // 9. Resultado Operativo Neto (P&L)
  const netOperatingProfit = monthSalesTotal - totalVariableCosts - totalFixedCosts;
  const isBreakevenReached = monthSalesTotal >= breakEvenAmount && breakEvenAmount > 0;

  // 10. Simulador de Ganancia Deseada
  const desiredProfit = financeSettings?.target_monthly_profit || (isVE ? 2000 : isCR ? 800000 : 1500000);
  const simulatedSalesNeeded = useMemo(() => {
    const targetCosts = totalFixedCosts + Number(desiredProfit || 0);
    if (effectiveMarginPct <= 0) return 0;
    return Math.round(targetCosts / (effectiveMarginPct / 100));
  }, [totalFixedCosts, desiredProfit, effectiveMarginPct]);

  const simulatedMaintenancesNeeded = useMemo(() => {
    const price = settings.standard_maintenance_price || 45000;
    return Math.ceil(simulatedSalesNeeded / price);
  }, [simulatedSalesNeeded, settings.standard_maintenance_price]);

  // -------------------------------------------------------------
  // ACCIONES Y HANDLERS
  // -------------------------------------------------------------

  const handleSaveFixedCosts = () => {
    onUpdateFixedCosts(tempFixedCosts);
    setShowFixedCostsModal(false);
  };

  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpCategory('combustible');
    setExpDescription('');
    setExpAmount(0);
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpPaymentMethod(isVE ? 'pago_movil' : isCR ? 'sinpe' : 'transferencia');
    setExpSupplier('');
    setExpInvoiceNumber('');
    setExpIsFixed(false);
    setExpStatus('pagado');
    setShowAddExpenseModal(true);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpCategory(exp.category);
    setExpDescription(exp.description);
    setExpAmount(exp.amount);
    setExpDate(exp.date);
    setExpPaymentMethod(exp.payment_method);
    setExpSupplier(exp.supplier || '');
    setExpInvoiceNumber(exp.invoice_number || '');
    setExpIsFixed(Boolean(exp.is_fixed));
    setExpStatus(exp.status);
    setShowAddExpenseModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) {
      toast.error('Ingresa un monto válido mayor a 0');
      return;
    }
    if (!expDescription.trim()) {
      toast.error('Ingresa una descripción del gasto');
      return;
    }

    if (editingExpenseId) {
      onUpdateExpense(editingExpenseId, {
        category: expCategory,
        description: expDescription.trim(),
        amount: Number(expAmount),
        date: expDate,
        payment_method: expPaymentMethod,
        supplier: expSupplier.trim(),
        invoice_number: expInvoiceNumber.trim(),
        is_fixed: expIsFixed,
        status: expStatus,
      });
    } else {
      onAddExpense({
        category: expCategory,
        description: expDescription.trim(),
        amount: Number(expAmount),
        date: expDate,
        payment_method: expPaymentMethod,
        supplier: expSupplier.trim(),
        invoice_number: expInvoiceNumber.trim(),
        is_fixed: expIsFixed,
        status: expStatus,
      });
    }
    setShowAddExpenseModal(false);
  };

  const handleSaveCountrySettings = () => {
    onUpdateFinanceSettings({
      exchange_rate: Number(tempExchangeRate),
      uf_value: Number(tempUfValue),
    });
    setShowCountrySettingsModal(false);
    toast.success('Parámetros monetarios actualizados');
  };

  // Compartir reporte ejecutivo vía WhatsApp
  const handleShareExecutiveWhatsApp = () => {
    const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    const company = settings.fantasy_name || settings.company_name || 'Nexus Air';
    const statusEmoji = isBreakevenReached ? '🟢 ZONA DE GANANCIA' : '🟡 EN PROCESO DE COBERTURA';

    const message = 
      `📊 *INFORME FINANCIERO & PUNTO DE EQUILIBRIO*\n` +
      `🏢 *${company}* • ${monthLabel}\n` +
      `📍 *País:* ${countryInfo.name} ${countryInfo.flag}\n\n` +
      `🎯 *ESTADO DEL EQUILIBRIO:*\n` +
      `• Estado: *${statusEmoji}*\n` +
      `• Facturación Lograda: *${formatAirPrice(monthSalesTotal, settings.currency_symbol, countryCode)}*\n` +
      `• Punto de Equilibrio: *${formatAirPrice(breakEvenAmount, settings.currency_symbol, countryCode)}*\n` +
      `• Cobertura: *${breakevenCoveragePct}%* (Meta mínima)\n` +
      `• Margen de Contribución: *${effectiveMarginPct}%*\n\n` +
      `📦 *EQUIVALENCIA EN SERVICIOS:*\n` +
      `• Mantenimientos Requeridos: *${breakEvenMaintenances} servicios*\n` +
      `• Instalaciones Requeridas: *${breakEvenInstallations} servicios*\n` +
      `• Servicios Realizados este mes: *${monthOrdersCount} órdenes*\n\n` +
      `💸 *ESTRUCTURA DE COSTOS:*\n` +
      `• Costos Fijos Totales: *${formatAirPrice(totalFixedCosts, settings.currency_symbol, countryCode)}*\n` +
      `• Costos Variables / Insumos: *${formatAirPrice(totalVariableCosts, settings.currency_symbol, countryCode)}*\n` +
      `• Resultado Neto Operativo: *${formatAirPrice(netOperatingProfit, settings.currency_symbol, countryCode)}*\n\n` +
      `_Generado automáticamente desde ${company} HVAC OS._`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filtrado de egresos
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const d = new Date(exp.date || Date.now());
      if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;
      if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) return false;
      if (expenseSearch.trim()) {
        const q = expenseSearch.toLowerCase();
        const desc = (exp.description || '').toLowerCase();
        const sup = (exp.supplier || '').toLowerCase();
        const inv = (exp.invoice_number || '').toLowerCase();
        if (!desc.includes(q) && !sup.includes(q) && !inv.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, selectedMonth, selectedYear, expenseCategoryFilter, expenseSearch]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ------------------------------------------------------------- */}
      {/* CABECERA PRINCIPAL: TÍTULO, SELECTOR DE MES Y BOTONES DE ACCIÓN */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Finanzas & Punto de Equilibrio
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {countryInfo.flag} {countryInfo.name}
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Gestión marginal, umbral de rentabilidad y ritmo operativo en tiempo real para climatización.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navegación Mes a Mes */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 font-mono">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              title="Ir a mes actual"
              className="ml-1 px-2 py-1 text-[11px] font-bold rounded-lg bg-white text-cyan-700 shadow-xs hover:bg-cyan-50 transition-colors cursor-pointer"
            >
              Hoy
            </button>
          </div>

          {/* Ajuste de Parámetros de País / Moneda */}
          <button
            type="button"
            onClick={() => setShowCountrySettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            title="Ajustar tasa de cambio o parámetros monetarios del país"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {isVE ? `Tasa: Bs. ${financeSettings?.exchange_rate || 36.5}` : isCL ? `UF: $${(financeSettings?.uf_value || 38200).toLocaleString('es-CL')}` : 'Moneda & Tasa'}
            </span>
          </button>

          {/* Compartir WhatsApp */}
          <button
            type="button"
            onClick={handleShareExecutiveWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
            title="Compartir resumen ejecutivo mensual por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir Resumen</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TABS DE NAVEGACIÓN SECUNDARIA */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('breakeven')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'breakeven'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Punto de Equilibrio & Ritmo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Egresos & Gastos Operativos</span>
          {expenses.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'expenses' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {expenses.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pnl'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Estado de Resultados (P&L)</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VISTA 1: PUNTO DE EQUILIBRIO & RITMO OPERATIVO */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'breakeven' && (
        <div className="space-y-6">
          {/* Fila de Tarjetas KPI Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Punto de Equilibrio Mensual */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Punto de Equilibrio (Breakeven)
                </span>
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <DualCurrencyAir
                  amount={breakEvenAmount}
                  countryCode={countryCode}
                  fontSize="22px"
                  primaryColor="#0284c7"
                  exchangeRate={financeSettings?.exchange_rate}
                  ufValue={financeSettings?.uf_value}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Facturación mínima requerida para no ganar ni perder este mes.
              </p>
            </div>

            {/* KPI 2: Facturación Real del Mes */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Ventas Logradas ({monthOrdersCount} órdenes)
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isBreakevenReached ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <DualCurrencyAir
                  amount={monthSalesTotal}
                  countryCode={countryCode}
                  fontSize="22px"
                  primaryColor={isBreakevenReached ? '#059669' : '#2563eb'}
                  exchangeRate={financeSettings?.exchange_rate}
                  ufValue={financeSettings?.uf_value}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`text-xs font-bold ${isBreakevenReached ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {breakevenCoveragePct}% cubierto
                </span>
                <span className="text-[11px] text-slate-400">• Ticket Prom: {formatAirPrice(avgTicket, settings.currency_symbol, countryCode)}</span>
              </div>
            </div>

            {/* KPI 3: Resultado Neto Operativo */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Resultado Operativo Estimado
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  netOperatingProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {netOperatingProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
              </div>
              <div className="mt-2">
                <DualCurrencyAir
                  amount={netOperatingProfit}
                  countryCode={countryCode}
                  fontSize="22px"
                  primaryColor={netOperatingProfit >= 0 ? '#059669' : '#e11d48'}
                  exchangeRate={financeSettings?.exchange_rate}
                  ufValue={financeSettings?.uf_value}
                />
              </div>
              <p className={`text-[11px] font-semibold mt-2 ${netOperatingProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netOperatingProfit >= 0 ? '✓ Ganancia neta operativa positiva' : '⚠️ Por debajo del costo estructural'}
              </p>
            </div>

            {/* KPI 4: Margen y Servicios Necesarios */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Margen Contribución
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {effectiveMarginPct}%
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-slate-700 flex justify-between">
                  <span>Mantenimientos 6M:</span>
                  <strong className="font-mono text-cyan-800">{breakEvenMaintenances} eq.</strong>
                </div>
                <div className="text-xs text-slate-700 flex justify-between">
                  <span>Instalaciones Split:</span>
                  <strong className="font-mono text-cyan-800">{breakEvenInstallations} eq.</strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Basado en precios estándar configurados en el sistema.
              </p>
            </div>
          </div>

          {/* Barra de Progreso de Cobertura con Semáforo */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-600" />
                  Barra de Cobertura de Costos Fijos
                </h3>
                <p className="text-xs text-slate-500">
                  {isBreakevenReached 
                    ? '¡Felicitaciones! Has superado el 100% de cobertura. Toda orden adicional genera utilidad neta directa.'
                    : `Faltan ${formatAirPrice(Math.max(0, breakEvenAmount - monthSalesTotal), settings.currency_symbol, countryCode)} para llegar a zona de rentabilidad.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  isBreakevenReached
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : breakevenCoveragePct >= 70
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {isBreakevenReached ? '🟢 Zona Ganancia' : breakevenCoveragePct >= 70 ? '🟡 Zona Aceleración' : '🔴 Zona Pérdida'}
                </span>
                <span className="text-lg font-black font-mono text-slate-900">
                  {breakevenCoveragePct}%
                </span>
              </div>
            </div>

            {/* Barra Visual */}
            <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isBreakevenReached 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : breakevenCoveragePct >= 70 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                    : 'bg-gradient-to-r from-rose-500 to-orange-400'
                }`}
                style={{ width: `${Math.min(100, breakevenCoveragePct)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>$0 (Inicio de mes)</span>
              <span className="font-bold text-slate-700">100% Breakeven ({formatAirPrice(breakEvenAmount, settings.currency_symbol, countryCode)})</span>
              <span>Zona de Expansión</span>
            </div>
          </div>

          {/* Cadencia Diaria (Run Rate) & Costos Fijos Estructurales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ritmo y Cadencia Diaria */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  Ritmo y Cadencia Diaria (Run Rate)
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Día {daysElapsed} de {daysInMonth} ({timeProgressPct}% del mes)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Ritmo Diario Logrado</span>
                  <span className="text-base font-black font-mono text-slate-900 mt-1 block">
                    {formatAirPrice(currentDailyRate, settings.currency_symbol, countryCode)}
                  </span>
                  <span className="text-[10px] text-slate-400">Promedio por día transcurrido</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Ritmo Requerido Restante</span>
                  <span className={`text-base font-black font-mono mt-1 block ${
                    requiredDailyRate === 0 ? 'text-emerald-600' : 'text-cyan-700'
                  }`}>
                    {requiredDailyRate === 0 ? '¡Meta Cubierta!' : formatAirPrice(requiredDailyRate, settings.currency_symbol, countryCode)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {daysRemaining > 0 ? `Por día en los ${daysRemaining} días restantes` : 'Mes concluido'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                  Diagnóstico Operativo Climatización:
                </div>
                <p className="text-[11px] text-cyan-800 leading-relaxed">
                  {isBreakevenReached
                    ? `Has alcanzado el punto de equilibrio en el día ${daysElapsed}. Las órdenes restantes de este mes son ganancia neta pura para el taller.`
                    : breakevenCoveragePct >= timeProgressPct
                    ? `Vas a buen ritmo (+${Math.round(breakevenCoveragePct - timeProgressPct)}% arriba del tiempo). Mantén el agendamiento constante de mantenimientos e instalaciones.`
                    : `Estás ligeramente por detrás del tiempo transcurrido (${breakevenCoveragePct}% ventas vs ${timeProgressPct}% días). Promueve la recaptación semestral de 6M para asegurar el objetivo.`}
                </p>
              </div>
            </div>

            {/* Estructura de Gastos: Fijos vs Variables (NK-045 Estilo Solago Residencial) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-600" />
                    Estructura de Gastos: Fijos vs Variables
                  </h3>
                  <p className="text-xs text-slate-500">
                    Costos fijos recurrentes + servicios variables de {MONTH_NAMES[selectedMonth]} {selectedYear}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempFixedCosts({ ...fixedCosts });
                    setShowFixedCostsModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Fijos</span>
                </button>
              </div>

              {/* Contenedor 1: GASTOS FIJOS RECURRENTES (BASE MENSUAL) */}
              <div className="rounded-2xl border border-sky-200/90 bg-sky-50/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    GASTOS FIJOS RECURRENTES (BASE MENSUAL)
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                    Se repiten mes a mes
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-sky-100/60">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span>🏠</span>
                      <span className="font-medium">Arriendo / Alquiler:</span>
                    </span>
                    <DualCurrencyAir amount={fixedCosts?.rent || 0} countryCode={countryCode} fontSize="12.5px" primaryColor="#0f172a" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-sky-100/60">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span>👥</span>
                      <span className="font-medium">Sueldos y Nómina Fija:</span>
                    </span>
                    <DualCurrencyAir amount={fixedCosts?.salaries || 0} countryCode={countryCode} fontSize="12.5px" primaryColor="#0f172a" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-sky-100/60">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span>💻</span>
                      <span className="font-medium">Software y POS:</span>
                    </span>
                    <DualCurrencyAir amount={fixedCosts?.software || 0} countryCode={countryCode} fontSize="12.5px" primaryColor="#0f172a" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-sky-100/60">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span>📢</span>
                      <span className="font-medium">Publicidad Fija:</span>
                    </span>
                    <DualCurrencyAir amount={fixedCosts?.marketing || 0} countryCode={countryCode} fontSize="12.5px" primaryColor="#0f172a" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-sky-100/60">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span>📦</span>
                      <span className="font-medium">Otros Fijos:</span>
                    </span>
                    <DualCurrencyAir amount={(fixedCosts?.transport || 0) + (fixedCosts?.other || 0)} countryCode={countryCode} fontSize="12.5px" primaryColor="#0f172a" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs font-black bg-sky-100/60 px-2.5 py-1.5 rounded-xl text-sky-950">
                    <span>Subtotal Fijos Base:</span>
                    <DualCurrencyAir amount={structuralFixedCosts} countryCode={countryCode} fontSize="13px" primaryColor="#0369a1" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>
                </div>
              </div>

              {/* Contenedor 2: SERVICIOS PÚBLICOS Y GASTOS VARIABLES */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    SERVICIOS PÚBLICOS Y GASTOS VARIABLES ({MONTH_NAMES[selectedMonth].toUpperCase()} {selectedYear})
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Se rellena mes a mes
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-amber-100/60">
                    <div>
                      <span className="text-slate-800 font-bold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        Servicios Públicos del Mes:
                      </span>
                      <span className="text-[10.5px] text-slate-500 block">Luz, agua, gas e internet para {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
                    </div>
                    <DualCurrencyAir amount={monthPublicServicesExpense} countryCode={countryCode} fontSize="12.5px" primaryColor="#b45309" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-amber-100/60">
                    <div>
                      <span className="text-slate-800 font-bold flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                        Gasolina & Combustible:
                      </span>
                      <span className="text-[10.5px] text-slate-500 block">Combustible y movilidad de camionetas</span>
                    </div>
                    <DualCurrencyAir amount={monthFuelExpense} countryCode={countryCode} fontSize="12.5px" primaryColor="#b45309" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-800 font-bold">Subtotal Variables del Mes:</span>
                    <DualCurrencyAir amount={monthVariableExpensesTotal} countryCode={countryCode} fontSize="13px" primaryColor="#92400e" align="right" exchangeRate={financeSettings?.exchange_rate} ufValue={financeSettings?.uf_value} />
                  </div>
                </div>

                {/* Botones Directos de Carga */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpCategory('servicios_basicos');
                      setExpDescription(`Servicios públicos ${MONTH_NAMES[selectedMonth]} ${selectedYear}`);
                      setExpAmount(0);
                      setExpDate(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`);
                      setShowAddExpenseModal(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Cargar Servicios de {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExpCategory('combustible');
                      setExpDescription(`Gasolina camionetas ${MONTH_NAMES[selectedMonth]} ${selectedYear}`);
                      setExpAmount(0);
                      setExpDate(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`);
                      setShowAddExpenseModal(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>+ Cargar Gasolina</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Simulador de Ganancia Neta Deseada */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#080c16] text-white shadow-xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  Simulador de Metas & Ganancia Neta
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  ¿Cuánto quieres ganar de utilidad líquida este mes?
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Meta Utilidad:</span>
                <input
                  type="number"
                  value={desiredProfit}
                  onChange={(e) => onUpdateFinanceSettings({ target_monthly_profit: Number(e.target.value) })}
                  className="w-36 p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-right focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ventas Totales Requeridas</span>
                <span className="text-base font-black font-mono text-cyan-300 mt-1 block">
                  {formatAirPrice(simulatedSalesNeeded, settings.currency_symbol, countryCode)}
                </span>
                <span className="text-[10px] text-slate-400">Costos fijos + Meta de ganancia</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Mantenimientos 6M Meta</span>
                <span className="text-base font-black font-mono text-amber-300 mt-1 block">
                  {simulatedMaintenancesNeeded} servicios
                </span>
                <span className="text-[10px] text-slate-400">A {formatAirPrice(settings.standard_maintenance_price, settings.currency_symbol, countryCode)} c/u</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Instalaciones Split Meta</span>
                <span className="text-base font-black font-mono text-emerald-300 mt-1 block">
                  {Math.ceil(simulatedSalesNeeded / (settings.standard_installation_price || 120000))} servicios
                </span>
                <span className="text-[10px] text-slate-400">A {formatAirPrice(settings.standard_installation_price, settings.currency_symbol, countryCode)} c/u</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VISTA 2: EGRESOS OPERATIVOS & GASTOS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Barra Superior de Egresos: Totales + Botón Nuevo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Egresos Registrados</span>
              <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
                {formatAirPrice(monthVariableExpensesTotal + monthRegisteredFixedExpenses, settings.currency_symbol, countryCode)}
              </span>
              <span className="text-[10px] text-slate-400">En {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Egresos Fijos vs Variables</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono font-bold text-purple-700">Fijos: {formatAirPrice(monthRegisteredFixedExpenses, settings.currency_symbol, countryCode)}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-mono font-bold text-cyan-700">Var: {formatAirPrice(monthVariableExpensesTotal, settings.currency_symbol, countryCode)}</span>
              </div>
              <span className="text-[10px] text-slate-400">Clasificación automática para el equilibrio</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Registro Rápido</span>
                <p className="text-xs text-slate-600 mt-0.5">Combustible, gas, repuestos, etc.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddExpense}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Egreso</span>
              </button>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por descripción, proveedor o N°..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Todas las categorías</option>
                {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => (
                  <option key={catKey} value={catKey}>{catInfo.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Egresos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Descripción & Proveedor</th>
                    <th className="p-3.5">Comprobante / N°</th>
                    <th className="p-3.5">Método de Pago</th>
                    <th className="p-3.5 text-right">Monto</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((exp) => {
                      const catInfo = CATEGORY_LABELS[exp.category] || CATEGORY_LABELS.otro;
                      const IconComp = catInfo.icon;

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${catInfo.color}`}>
                              <IconComp className="w-3 h-3" />
                              {catInfo.label}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{exp.description}</div>
                            {exp.supplier && (
                              <div className="text-[11px] text-slate-500">Prov: {exp.supplier}</div>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {exp.invoice_number || '—'}
                          </td>
                          <td className="p-3.5 capitalize text-slate-700">
                            {exp.payment_method.replace('_', ' ')}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                            <DualCurrencyAir
                              amount={exp.amount}
                              countryCode={countryCode}
                              fontSize="13px"
                              primaryColor="#0f172a"
                              align="right"
                              showSwap={false}
                              exchangeRate={financeSettings?.exchange_rate}
                              ufValue={financeSettings?.uf_value}
                            />
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              exp.status === 'pagado'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {exp.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditExpense(exp)}
                                className="p-1 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Editar egreso"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('¿Seguro que deseas eliminar este egreso?')) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Eliminar egreso"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No hay egresos registrados en este período. Haz clic en "Registrar Egreso" para añadir combustible, insumos o gastos operativos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VISTA 3: ESTADO DE RESULTADOS RÁPIDO (P&L CLIMATIZACIÓN) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pnl' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Estado de Resultados Operativo (P&L)
                </h3>
                <p className="text-xs text-slate-500">
                  {settings.fantasy_name || settings.company_name} • Período: {MONTH_NAMES[selectedMonth]} {selectedYear}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                netOperatingProfit >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {netOperatingProfit >= 0 ? 'EBITDA POSITIVO' : 'EBITDA NEGATIVO'}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Ingresos Operacionales */}
              <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl font-bold text-slate-800">
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  (+) INGRESOS TOTALES POR SERVICIOS HVAC ({monthOrdersCount} órdenes)
                </span>
                <span className="text-sm text-slate-900">
                  {formatAirPrice(monthSalesTotal, settings.currency_symbol, countryCode)}
                </span>
              </div>

              {/* Costos Variables */}
              <div className="pl-6 space-y-2 border-l-2 border-slate-200 py-1">
                <div className="flex justify-between text-slate-600">
                  <span>(-) Comisiones a Técnicos y Ayudantes de Terreno:</span>
                  <span>{formatAirPrice(monthTechCommissionsTotal, settings.currency_symbol, countryCode)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>(-) Egresos e Insumos Variables Directos (Gas/Tuberías/Combustible):</span>
                  <span>{formatAirPrice(monthVariableExpensesTotal, settings.currency_symbol, countryCode)}</span>
                </div>
              </div>

              {/* Margen Bruto */}
              <div className="flex justify-between items-center py-2 px-3 bg-blue-50/60 rounded-xl font-bold text-blue-900 border border-blue-200">
                <span>(=) MARGEN DE CONTRIBUCIÓN BRUTO ({effectiveMarginPct}%)</span>
                <span>{formatAirPrice(monthSalesTotal - totalVariableCosts, settings.currency_symbol, countryCode)}</span>
              </div>

              {/* Costos Fijos */}
              <div className="pl-6 space-y-2 border-l-2 border-slate-200 py-1">
                <div className="flex justify-between text-slate-600">
                  <span>(-) Costos Fijos Estructurales (Arriendo, Nómina, Serv., Mktg):</span>
                  <span>{formatAirPrice(totalFixedCosts, settings.currency_symbol, countryCode)}</span>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t-2 border-slate-300 my-2"></div>

              {/* Resultado Operativo Neto */}
              <div className={`flex justify-between items-center py-3 px-4 rounded-xl text-sm font-black border ${
                netOperatingProfit >= 0
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}>
                <span>(=) RESULTADO OPERATIVO NETO (UTILIDAD ANTES DE IMPUESTOS)</span>
                <span className="text-base">
                  {formatAirPrice(netOperatingProfit, settings.currency_symbol, countryCode)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: EDITAR COSTOS FIJOS ESTRUCTURALES */}
      {/* ------------------------------------------------------------- */}
      {showFixedCostsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-base">Costos Fijos Estructurales Mensuales</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFixedCostsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Define los compromisos fijos que tu empresa debe cubrir cada mes independientemente de la cantidad de instalaciones realizadas.
            </p>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">🏢 Arriendo Taller / Bodega</label>
                <input
                  type="number"
                  value={tempFixedCosts.rent}
                  onChange={(e) => setTempFixedCosts({ ...tempFixedCosts, rent: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">👥 Nómina / Sueldos Fijos (Administrativo, etc.)</label>
                <input
                  type="number"
                  value={tempFixedCosts.salaries}
                  onChange={(e) => setTempFixedCosts({ ...tempFixedCosts, salaries: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">🚚 Movilización & Combustible Fijo Camionetas</label>
                <input
                  type="number"
                  value={tempFixedCosts.transport}
                  onChange={(e) => setTempFixedCosts({ ...tempFixedCosts, transport: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">📢 Marketing & Publicidad (Google/Meta Ads)</label>
                <input
                  type="number"
                  value={tempFixedCosts.marketing}
                  onChange={(e) => setTempFixedCosts({ ...tempFixedCosts, marketing: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">⚡ Servicios Básicos (Luz trifásica, Agua, Internet)</label>
                <input
                  type="number"
                  value={tempFixedCosts.services}
                  onChange={(e) => setTempFixedCosts({ ...tempFixedCosts, services: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">💻 Software, Hosting & Telefonía</label>
                <input
                  type="number"
                  value={tempFixedCosts.software}
                  onChange={(e) => setTempFixedCosts({ ...tempFixedCosts, software: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">📦 Otros Costos Fijos Imprevistos</label>
                <input
                  type="number"
                  value={tempFixedCosts.other}
                  onChange={(e) => setTempFixedCosts({ ...tempFixedCosts, other: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-500">Nuevo Total Fijo: </span>
                <strong className="font-mono text-slate-900">
                  {formatAirPrice(
                    Number(tempFixedCosts.rent || 0) +
                    Number(tempFixedCosts.salaries || 0) +
                    Number(tempFixedCosts.transport || 0) +
                    Number(tempFixedCosts.marketing || 0) +
                    Number(tempFixedCosts.services || 0) +
                    Number(tempFixedCosts.software || 0) +
                    Number(tempFixedCosts.other || 0),
                    settings.currency_symbol,
                    countryCode
                  )}
                </strong>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFixedCostsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFixedCosts}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 shadow-xs"
                >
                  Guardar Plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: REGISTRAR / EDITAR EGRESO OPERATIVO */}
      {/* ------------------------------------------------------------- */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveExpense} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingExpenseId ? 'Editar Egreso Operativo' : 'Registrar Nuevo Egreso / Gasto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoría HVAC</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => (
                      <option key={catKey} value={catKey}>{catInfo.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descripción del Egreso *</label>
                <input
                  type="text"
                  placeholder="Ej: Carga de gas R410A / Diésel camioneta / Cañería cobre..."
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Monto ({settings.currency_symbol || '$'}) *</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Forma de Pago</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta Débito / Crédito</option>
                    {isVE && <option value="pago_movil">Pago Móvil</option>}
                    {isVE && <option value="zelle">Zelle / USD</option>}
                    {isCR && <option value="sinpe">SINPE Móvil</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Proveedor / Beneficiario</label>
                  <input
                    type="text"
                    placeholder="Ej: Distribuidora Anwo / Copec"
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">N° Factura / Boleta</label>
                  <input
                    type="text"
                    placeholder="Ej: FAC-12093"
                    value={expInvoiceNumber}
                    onChange={(e) => setExpInvoiceNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">¿Es Costo Fijo Recurrente?</span>
                  <span className="text-[11px] text-slate-500">
                    Marca si este gasto debe sumarse a los costos fijos estructurales del mes.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={expIsFixed}
                  onChange={(e) => setExpIsFixed(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 shadow-xs"
              >
                {editingExpenseId ? 'Guardar Cambios' : 'Registrar Egreso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: CONFIGURACIÓN MONETARIA Y REALIDAD DEL PAÍS */}
      {/* ------------------------------------------------------------- */}
      {showCountrySettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{countryInfo.flag}</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Parámetros Monetarios</h3>
                  <span className="text-xs text-slate-500">{countryInfo.name} ({countryInfo.currency_code})</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCountrySettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {isVE && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tasa de Cambio USD a Bolívares (Bs. por dólar)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempExchangeRate}
                    onChange={(e) => setTempExchangeRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Permite convertir los montos en USD a Bolívares automáticamente en toda la vista financiera.
                  </span>
                </div>
              )}

              {isCL && (
                <>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Valor UF (Unidad de Fomento en CLP)
                    </label>
                    <input
                      type="number"
                      value={tempUfValue}
                      onChange={(e) => setTempUfValue(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Utilizado para equivalencias en arriendos comerciales y proyectos climatización.
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tasa de Cambio CLP por Dólar (USD)
                    </label>
                    <input
                      type="number"
                      value={tempExchangeRate}
                      onChange={(e) => setTempExchangeRate(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                    />
                  </div>
                </>
              )}

              {isCR && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tipo de Cambio CRC por Dólar (USD)
                  </label>
                  <input
                    type="number"
                    value={tempExchangeRate}
                    onChange={(e) => setTempExchangeRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              )}

              {!isVE && !isCL && !isCR && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tipo de Cambio ({countryInfo.currency_code} por USD)
                  </label>
                  <input
                    type="number"
                    value={tempExchangeRate}
                    onChange={(e) => setTempExchangeRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCountrySettingsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCountrySettings}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 shadow-xs"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
