import React, { useState, useMemo } from 'react';
import { RecaptacionReminder, AirSettings, ServiceOrder } from '../types';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MessageCircle, 
  CalendarPlus, 
  Search, 
  Filter, 
  TrendingUp, 
  Wind, 
  ThermometerSnowflake, 
  Check, 
  Send,
  Calendar,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Star,
  Users,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings as SettingsIcon,
  X
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'react-hot-toast';

export type RecaptacionTab = 'preventive' | 'quality' | 'recovery';

export interface GroupedCustomerReminder {
  key: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_commune: string;
  items: RecaptacionReminder[];
  mostUrgentItem: RecaptacionReminder;
  consolidatedStatus: 'vencido' | 'por_vencer' | 'contactado' | 'al_dia';
  totalEquipments: number;
}

interface RecaptacionSemestralProps {
  reminders: RecaptacionReminder[];
  settings: AirSettings;
  orders?: ServiceOrder[];
  onMarkContacted: (equipmentId: string) => void;
  onScheduleService: (reminder: RecaptacionReminder) => void;
  generateWhatsAppUrl: (reminder: RecaptacionReminder) => string;
  onUpdateSettings?: (updates: Partial<AirSettings>) => Promise<any> | void;
}

export const RecaptacionSemestral: React.FC<RecaptacionSemestralProps> = ({
  reminders,
  settings,
  orders = [],
  onMarkContacted,
  onScheduleService,
  generateWhatsAppUrl,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<RecaptacionTab>('preventive');
  const [filterStatus, setFilterStatus] = useState<'all' | 'vencido' | 'por_vencer' | 'contactado'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const currencySymbol = settings.currency_symbol || '₡';

  // Timing Config Modal State (NK-038)
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);
  const [isSavingTiming, setIsSavingTiming] = useState(false);
  const [timingIntervalMonths, setTimingIntervalMonths] = useState<number>(settings.maintenance_interval_months || 6);
  const [timingQualityDays, setTimingQualityDays] = useState<number>(settings.quality_control_days || 7);
  const [timingRecoveryMonths, setTimingRecoveryMonths] = useState<number>(settings.inactive_recovery_months || 9);
  const [timingPreWarningDays, setTimingPreWarningDays] = useState<number>(settings.pre_expiration_warning_days || 15);

  React.useEffect(() => {
    setTimingIntervalMonths(settings.maintenance_interval_months || 6);
    setTimingQualityDays(settings.quality_control_days || 7);
    setTimingRecoveryMonths(settings.inactive_recovery_months || 9);
    setTimingPreWarningDays(settings.pre_expiration_warning_days || 15);
  }, [settings.maintenance_interval_months, settings.quality_control_days, settings.inactive_recovery_months, settings.pre_expiration_warning_days]);

  const handleSaveTiming = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTiming(true);
    try {
      if (onUpdateSettings) {
        await onUpdateSettings({
          maintenance_interval_months: timingIntervalMonths,
          quality_control_days: timingQualityDays,
          inactive_recovery_months: timingRecoveryMonths,
          pre_expiration_warning_days: timingPreWarningDays,
        });
      }
      toast.success('Plazos de recaptación actualizados y guardados correctamente');
      setIsTimingModalOpen(false);
    } catch (err: any) {
      console.error('Error saving timing:', err);
      toast.error('Error al guardar los plazos: ' + (err?.message || 'Intente nuevamente'));
    } finally {
      setIsSavingTiming(false);
    }
  };

  // Clasificación por ciclo de vida (Lógica multietapa dinámica NK-038)
  const categorized = useMemo(() => {
    const intervalMonths = settings.maintenance_interval_months || 6;
    const intervalDays = intervalMonths * 30;
    const qualityDays = settings.quality_control_days || 7;
    const recoveryMonths = settings.inactive_recovery_months || 9;
    const recoveryThresholdDays = Math.max(30, (recoveryMonths * 30) - intervalDays);

    // 1. Preventivos: ciclo normal según intervalo configurado
    const preventiveList = reminders.filter(r => {
      return r.days_until_due >= -recoveryThresholdDays;
    });

    // 2. Control de Calidad: servicios completados recientemente (primeros días post servicio)
    const qualityList = reminders.filter(r => {
      const daysSinceService = intervalDays - r.days_until_due;
      return daysSinceService >= 1 && daysSinceService <= (qualityDays * 2);
    });

    // 3. Recuperación: clientes inactivos con más de los meses configurados
    const recoveryList = reminders.filter(r => {
      return r.days_until_due < -recoveryThresholdDays;
    });

    return {
      preventive: preventiveList,
      quality: qualityList,
      recovery: recoveryList,
    };
  }, [reminders, settings.maintenance_interval_months, settings.quality_control_days, settings.inactive_recovery_months]);

  // Estado de expansión de acordeón de clientes con múltiples equipos (NK-111)
  const [expandedCustomerKeys, setExpandedCustomerKeys] = useState<Set<string>>(new Set());

  const toggleExpandCustomer = (key: string) => {
    setExpandedCustomerKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Agrupación de recordatorios por cliente para no repetir filas (NK-111)
  const groupedCustomers = useMemo(() => {
    let list = categorized[activeTab] || [];

    // Agrupar por customer_id o customer_name
    const map = new Map<string, RecaptacionReminder[]>();
    for (const item of list) {
      const key = (item.customer_id && item.customer_id.trim() !== '')
        ? item.customer_id
        : item.customer_name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }

    const groups: GroupedCustomerReminder[] = [];

    map.forEach((items, key) => {
      // Ordenar equipos dentro del cliente: el más próximo / urgente primero (menor days_until_due)
      items.sort((a, b) => a.days_until_due - b.days_until_due);
      const mostUrgent = items[0];

      let consolidatedStatus: 'vencido' | 'por_vencer' | 'contactado' | 'al_dia' = 'al_dia';
      if (items.some(i => i.status === 'vencido')) {
        consolidatedStatus = 'vencido';
      } else if (items.some(i => i.status === 'por_vencer')) {
        consolidatedStatus = 'por_vencer';
      } else if (items.some(i => i.status === 'contactado')) {
        consolidatedStatus = 'contactado';
      }

      groups.push({
        key,
        customer_id: mostUrgent.customer_id,
        customer_name: mostUrgent.customer_name,
        customer_phone: mostUrgent.customer_phone,
        customer_email: mostUrgent.customer_email,
        customer_address: mostUrgent.customer_address,
        customer_commune: mostUrgent.customer_commune,
        items,
        mostUrgentItem: mostUrgent,
        consolidatedStatus,
        totalEquipments: items.length,
      });
    });

    let filtered = groups;

    // Filtro por estado en pestaña preventiva
    if (activeTab === 'preventive' && filterStatus !== 'all') {
      filtered = filtered.filter(g => g.items.some(i => i.status === filterStatus));
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.customer_name.toLowerCase().includes(term) ||
        g.customer_commune.toLowerCase().includes(term) ||
        g.customer_address.toLowerCase().includes(term) ||
        g.items.some(i =>
          i.equipment_brand.toLowerCase().includes(term) ||
          i.equipment_location.toLowerCase().includes(term)
        )
      );
    }

    // Ordenar clientes por urgencia del equipo más próximo
    filtered.sort((a, b) => a.mostUrgentItem.days_until_due - b.mostUrgentItem.days_until_due);

    return filtered;
  }, [categorized, activeTab, filterStatus, searchTerm]);

  // Lista activa según pestaña (referencia plana)
  const currentList = useMemo(() => {
    let list = categorized[activeTab] || [];

    if (activeTab === 'preventive' && filterStatus !== 'all') {
      list = list.filter(r => r.status === filterStatus);
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(r =>
      r.customer_name.toLowerCase().includes(term) ||
      r.customer_commune.toLowerCase().includes(term) ||
      r.equipment_brand.toLowerCase().includes(term) ||
      r.equipment_location.toLowerCase().includes(term)
    );
  }, [categorized, activeTab, filterStatus, searchTerm]);

  // Estadísticas dinámicas por etapa
  const stats = useMemo(() => {
    const totalPreventive = categorized.preventive.length;
    const vencidos = reminders.filter(r => r.status === 'vencido').length;
    const porVencer = reminders.filter(r => r.status === 'por_vencer').length;
    const contactados = reminders.filter(r => r.status === 'contactado').length;
    const alDia = reminders.filter(r => r.status === 'al_dia').length;

    const totalQuality = categorized.quality.length;
    const totalRecovery = categorized.recovery.length;

    const precioMantencion = settings.standard_maintenance_price || 35000;
    const potencialPreventivo = (vencidos + porVencer) * precioMantencion;
    const potencialRecuperacion = totalRecovery * precioMantencion;

    return {
      totalPreventive,
      vencidos,
      porVencer,
      contactados,
      alDia,
      totalQuality,
      totalRecovery,
      potencialPreventivo,
      potencialRecuperacion,
    };
  }, [reminders, categorized, settings.standard_maintenance_price]);

  // Generador de WhatsApp dinámico según etapa
  const buildWhatsAppUrlForStage = (reminder: RecaptacionReminder, stage: RecaptacionTab) => {
    let text = '';
    const cleanPhone = reminder.customer_phone.replace(/[^0-9]/g, '');
    const companyName = settings.fantasy_name || settings.company_name || 'Nexus Air';

    if (stage === 'quality') {
      text = `Hola ${reminder.customer_name}, te saludamos de *${companyName}* ❄️\n\n` +
        `Queríamos confirmar cómo ha estado funcionando tu equipo *${reminder.equipment_brand}* (${reminder.equipment_location}) tras el servicio realizado recientemente.\n\n` +
        `¿Está enfriando a la perfección? ¿Quedó todo en orden con la visita del técnico? Queremos asegurarnos de que tu experiencia haya sido de 5 estrellas ⭐️⭐️⭐️⭐️⭐️.\n\n` +
        `¡Quedamos atentos a cualquier consulta!`;
    } else if (stage === 'recovery') {
      const recMonths = settings.inactive_recovery_months || 9;
      text = `Hola ${reminder.customer_name}, te escribimos de *${companyName}* ❄️\n\n` +
        `Revisando nuestros registros notamos que tu aire acondicionado *${reminder.equipment_brand}* lleva más de ${recMonths} meses sin su mantenimiento periódico.\n\n` +
        `Para evitar acumulación de hongos, malos olores y un aumento en el consumo eléctrico antes de la temporada, tenemos un *15% de descuento especial* en tu limpieza profunda de filtros y serpentín durante esta semana.\n\n` +
        `¿Te gustaría que coordinemos una visita técnica para tu comodidad?`;
    } else {
      return generateWhatsAppUrl(reminder);
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp para clientes con múltiples equipos (NK-111)
  const buildWhatsAppUrlForGroup = (group: GroupedCustomerReminder, stage: RecaptacionTab) => {
    if (group.totalEquipments === 1) {
      return buildWhatsAppUrlForStage(group.mostUrgentItem, stage);
    }

    const cleanPhone = group.customer_phone.replace(/[^0-9]/g, '');
    const companyName = settings.fantasy_name || settings.company_name || 'Nexus Air';
    const equiposTexto = group.items
      .map(i => `• ${i.equipment_brand} ${i.equipment_btu ? `${i.equipment_btu.toLocaleString()} BTU` : ''} (${i.equipment_location || 'Ubicación'})`)
      .join('\n');

    let text = '';
    if (stage === 'quality') {
      text = `Hola ${group.customer_name}, te saludamos de *${companyName}* ❄️\n\n` +
        `Queríamos confirmar cómo han estado funcionando tus equipos tras las visitas técnicas recientes:\n` +
        `${equiposTexto}\n\n` +
        `¿Están enfriando a la perfección? Queremos asegurarnos de que el servicio haya sido de 5 estrellas ⭐️⭐️⭐️⭐️⭐️.\n\n` +
        `¡Quedamos atentos a cualquier consulta!`;
    } else if (stage === 'recovery') {
      const recMonths = settings.inactive_recovery_months || 9;
      text = `Hola ${group.customer_name}, te escribimos de *${companyName}* ❄️\n\n` +
        `Revisando nuestros registros notamos que tus equipos llevan más de ${recMonths} meses sin su mantenimiento periódico:\n` +
        `${equiposTexto}\n\n` +
        `Para cuidar el rendimiento y ahorrar electricidad, tenemos un *15% de descuento especial por mantenimiento de flota/múltiples equipos* durante esta semana.\n\n` +
        `¿Te gustaría que coordinemos la visita de nuestros técnicos?`;
    } else {
      text = `Hola ${group.customer_name}, te saludamos de *${companyName}* ❄️\n\n` +
        `Te escribimos para recordarte que corresponde coordinar el mantenimiento preventivo de tus equipos de climatización:\n` +
        `${equiposTexto}\n\n` +
        `El equipo con vencimiento más próximo es *${group.mostUrgentItem.equipment_brand}* (${group.mostUrgentItem.equipment_location}), programado para *${group.mostUrgentItem.next_maintenance_due}*.\n\n` +
        `Podemos realizar el servicio a todos tus equipos en una sola visita para tu mayor comodidad. ¿Qué día te acomodaría agendar?`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleOpenWhatsApp = (reminder: RecaptacionReminder) => {
    const url = buildWhatsAppUrlForStage(reminder, activeTab);
    window.open(url, '_blank');
    onMarkContacted(reminder.equipment_id);
    toast.success('WhatsApp abierto y contacto registrado');
  };

  const handleOpenWhatsAppGroup = (group: GroupedCustomerReminder) => {
    const url = buildWhatsAppUrlForGroup(group, activeTab);
    window.open(url, '_blank');
    group.items.forEach(i => onMarkContacted(i.equipment_id));
    toast.success(`WhatsApp abierto para ${group.customer_name} (${group.totalEquipments} equipos) y contacto registrado`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Educational & Strategic Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor Integral de Fidelización & Recaptación HVAC (Multi-Etapa)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Clientes: Calidad, Preventivo & Recuperación
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Ecosistema automatizado de 3 tiempos para maximizar la vida útil del cliente: 
            <strong> Control de Calidad</strong> a los {settings.quality_control_days || 7} días, 
            <strong> Mantenimiento Preventivo</strong> cada {settings.maintenance_interval_months || 6} meses y 
            <strong> Recuperación de Inactivos</strong> a los {settings.inactive_recovery_months || 9} meses con ofertas de reactivación.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left sm:text-right shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold block">
            {activeTab === 'recovery' ? 'Potencial de Clientes Inactivos' : 'Ingresos Proyectados'}
          </span>
          <p className="text-2xl font-black text-cyan-600 font-mono">
            {currencySymbol}{(activeTab === 'recovery' ? stats.potencialRecuperacion : stats.potencialPreventivo).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">
            {currencySymbol}{(settings.standard_maintenance_price || 35000).toLocaleString()} por equipo
          </span>
        </div>
      </div>

      {/* Selector de Etapas / Pestañas Principales (Idéntico a lógica Nexus) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('preventive')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'preventive'
              ? 'bg-white text-cyan-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>1. Mantenimiento Preventivo ({settings.maintenance_interval_months || 6}M)</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-mono">
            {stats.totalPreventive}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quality')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'quality'
              ? 'bg-white text-amber-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>2. Control de Calidad ({settings.quality_control_days || 7}D)</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono">
            {stats.totalQuality}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recovery')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'recovery'
              ? 'bg-white text-rose-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-rose-500" />
          <span>3. Recuperación de Inactivos (&gt;{settings.inactive_recovery_months || 9}M)</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono">
            {stats.totalRecovery}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTimingIntervalMonths(settings.maintenance_interval_months || 6);
            setTimingQualityDays(settings.quality_control_days || 7);
            setTimingRecoveryMonths(settings.inactive_recovery_months || 9);
            setTimingPreWarningDays(settings.pre_expiration_warning_days || 15);
            setIsTimingModalOpen(true);
          }}
          className="px-3.5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-cyan-700 hover:border-cyan-300 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
          title="Configurar plazos y tiempos de recaptación"
        >
          <SettingsIcon className="w-4 h-4 text-cyan-600" />
          <span>Configurar Plazos</span>
        </button>
      </div>

      {/* KPI Cards Dinámicas según la etapa activa */}
      {activeTab === 'preventive' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Vencidos (&gt; {settings.maintenance_interval_months || 6} Meses)</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">{stats.vencidos}</p>
            <p className="text-[11px] text-white/80">Urgente de contactar</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Por Vencer (&lt; {settings.pre_expiration_warning_days || 15} días)</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">{stats.porVencer}</p>
            <p className="text-[11px] text-white/80">Aviso pre-temporada</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Contactados WhatsApp</span>
              <MessageCircle className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">{stats.contactados}</p>
            <p className="text-[11px] text-white/80">En confirmación</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Al Día</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">{stats.alDia}</p>
            <p className="text-[11px] text-white/80">Operando en norma</p>
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Servicios Recientes a Evaluar</span>
              <Star className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">{stats.totalQuality}</p>
            <p className="text-[11px] text-white/80">Visitas técnicas en últimos {settings.quality_control_days || 7} días</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Objetivo de Satisfacción</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">98.5%</p>
            <p className="text-[11px] text-white/80">Asegurar enfriamiento y fidelidad</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Reseñas Google / Referidos</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">5 Estrellas</p>
            <p className="text-[11px] text-white/80">Convertir clientes conformes en embajadores</p>
          </div>
        </div>
      )}

      {activeTab === 'recovery' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Clientes Inactivos (&gt; {settings.inactive_recovery_months || 9} Meses)</span>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">{stats.totalRecovery}</p>
            <p className="text-[11px] text-white/80">En riesgo de fuga de taller</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Potencial de Reactivación</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black font-mono">{currencySymbol}{stats.potencialRecuperacion.toLocaleString()}</p>
            <p className="text-[11px] text-white/80">Campaña de reactivación con 15% DCTO</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20 space-y-1">
            <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase">
              <span>Tasa de Reactivación Esperada</span>
              <RotateCcw className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black">24%</p>
            <p className="text-[11px] text-white/80">Conversión probada con oferta de temporada</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'preventive' && (
            <>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({stats.totalPreventive})
              </button>
              <button
                onClick={() => setFilterStatus('vencido')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'vencido'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                Vencidos ({stats.vencidos})
              </button>
              <button
                onClick={() => setFilterStatus('por_vencer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'por_vencer'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Por Vencer ({stats.porVencer})
              </button>
              <button
                onClick={() => setFilterStatus('contactado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'contactado'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
                }`}
              >
                Contactados ({stats.contactados})
              </button>
            </>
          )}

          {activeTab === 'quality' && (
            <div className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-600" />
              <span>Mostrando servicios completados recientemente (Ventana de {settings.quality_control_days || 7} días)</span>
            </div>
          )}

          {activeTab === 'recovery' && (
            <div className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Clientes sin mantenimiento hace más de {settings.inactive_recovery_months || 9} meses (Mensaje con 15% Descuento)</span>
            </div>
          )}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, comuna o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Reminders List Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Cliente & Contacto</th>
                <th className="py-3.5 px-4">Equipo & Ubicación</th>
                <th className="py-3.5 px-4">Último Servicio</th>
                <th className="py-3.5 px-4">
                  {activeTab === 'quality' ? 'Días desde Visita' : activeTab === 'recovery' ? 'Tiempo Inactivo' : `Vencimiento (${settings.maintenance_interval_months || 6}M)`}
                </th>
                <th className="py-3.5 px-4">Objetivo de Contacto</th>
                <th className="py-3.5 px-4 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron registros para esta etapa de recaptación.
                  </td>
                </tr>
              ) : (
                groupedCustomers.map((group) => {
                  const isExpanded = expandedCustomerKeys.has(group.key);
                  const intervalDays = (settings.maintenance_interval_months || 6) * 30;
                  const daysSinceService = Math.max(0, intervalDays - group.mostUrgentItem.days_until_due);

                  return (
                    <React.Fragment key={group.key}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-cyan-50/20' : ''}`}>
                        {/* Cliente & Contacto */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{group.customer_name}</span>
                            {group.totalEquipments > 1 && (
                              <button
                                type="button"
                                onClick={() => toggleExpandCustomer(group.key)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 cursor-pointer transition-colors"
                                title="Clic para desplegar u ocultar equipos"
                              >
                                <Layers className="w-3 h-3 text-cyan-600" />
                                <span>{group.totalEquipments} equipos</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-cyan-700" /> : <ChevronDown className="w-3 h-3 text-cyan-700" />}
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {group.customer_address}, {group.customer_commune}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{group.customer_phone}</div>
                        </td>

                        {/* Equipo & Ubicación */}
                        <td className="py-3.5 px-4">
                          {group.totalEquipments === 1 ? (
                            <>
                              <div className="font-bold text-cyan-700">
                                {group.mostUrgentItem.equipment_brand} {group.mostUrgentItem.equipment_btu ? `${group.mostUrgentItem.equipment_btu.toLocaleString()} BTU` : ''}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span>📍 {group.mostUrgentItem.equipment_location}</span>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              <div className="font-bold text-cyan-800 flex items-center gap-1.5">
                                <span>⭐ Próximo: {group.mostUrgentItem.equipment_brand} {group.mostUrgentItem.equipment_btu ? `${group.mostUrgentItem.equipment_btu.toLocaleString()} BTU` : ''}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span>📍 {group.mostUrgentItem.equipment_location}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleExpandCustomer(group.key)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50/80 hover:bg-cyan-100 border border-cyan-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer mt-0.5"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span>{isExpanded ? 'Ocultar equipos' : `Ver todos (${group.totalEquipments})`}</span>
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Último Servicio */}
                        <td className="py-3.5 px-4 text-slate-700 font-mono">
                          <div className="font-semibold">{group.mostUrgentItem.last_service_date}</div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {group.mostUrgentItem.last_service_type.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Vencimiento / Días */}
                        <td className="py-3.5 px-4 font-mono">
                          {activeTab === 'quality' ? (
                            <div>
                              <span className="font-bold text-amber-700">{daysSinceService} días transcurridos</span>
                              <div className="text-[10px] text-slate-400">Momento óptimo para feedback</div>
                            </div>
                          ) : activeTab === 'recovery' ? (
                            <div>
                              <span className="font-bold text-rose-700">{Math.abs(group.mostUrgentItem.days_until_due)} días de retraso</span>
                              <div className="text-[10px] text-slate-400">Más de {settings.inactive_recovery_months || 9} meses sin servicio</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-slate-900 font-bold">{group.mostUrgentItem.next_maintenance_due}</div>
                              <div className="text-[10px] text-slate-400">
                                {group.totalEquipments > 1 ? 'Fecha más próxima' : `${intervalDays} días (${settings.maintenance_interval_months || 6}M)`}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Estado & Objetivo */}
                        <td className="py-3.5 px-4">
                          {activeTab === 'quality' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Star className="w-3 h-3 text-amber-500" />
                              Encuesta de Calidad
                            </span>
                          )}
                          {activeTab === 'recovery' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <RotateCcw className="w-3 h-3" />
                              Reactivar con 15% DCTO
                            </span>
                          )}
                          {activeTab === 'preventive' && (
                            <div className="space-y-1">
                              {group.consolidatedStatus === 'vencido' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  Vencido hace {Math.abs(group.mostUrgentItem.days_until_due)} días
                                </span>
                              )}
                              {group.consolidatedStatus === 'por_vencer' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  Vence en {group.mostUrgentItem.days_until_due} días
                                </span>
                              )}
                              {group.consolidatedStatus === 'contactado' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                  <Check className="w-3 h-3" />
                                  Contactado
                                </span>
                              )}
                              {group.consolidatedStatus === 'al_dia' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Al día ({group.mostUrgentItem.days_until_due} días)
                                </span>
                              )}

                              {group.totalEquipments > 1 && (
                                <div className="text-[10px] text-slate-400">
                                  {group.totalEquipments} equipos en monitoreo
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenWhatsAppGroup(group)}
                              title={
                                group.totalEquipments > 1
                                  ? `Enviar WhatsApp resumiendo sus ${group.totalEquipments} equipos`
                                  : 'Enviar WhatsApp al cliente'
                              }
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                                activeTab === 'quality'
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : activeTab === 'recovery'
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => onScheduleService(group.mostUrgentItem)}
                              title={group.totalEquipments > 1 ? "Crear Orden (Equipo más próximo)" : "Crear Orden en el Tablero"}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 text-xs font-bold transition-all cursor-pointer"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Agendar (1-Clic)</span>
                            </button>

                            {group.totalEquipments > 1 && (
                              <button
                                type="button"
                                onClick={() => toggleExpandCustomer(group.key)}
                                className="p-1.5 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-slate-500 hover:text-cyan-700 transition-colors cursor-pointer"
                                title={isExpanded ? 'Ocultar desglose de equipos' : 'Ver desglose de equipos'}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Sub-fila de Acordeón: Detalle de todos los equipos del cliente (NK-111) */}
                      {isExpanded && group.totalEquipments > 1 && (
                        <tr className="bg-slate-50/70 border-b border-cyan-200/50 animate-in fade-in duration-150">
                          <td colSpan={6} className="py-3 px-4 sm:px-8 border-l-4 border-l-cyan-500 bg-cyan-50/15">
                            <div className="space-y-2.5 max-w-5xl">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                <span className="flex items-center gap-1.5 text-cyan-950">
                                  <Layers className="w-3.5 h-3.5 text-cyan-600" />
                                  Detalle de equipos instalados para {group.customer_name} ({group.totalEquipments} equipos):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleExpandCustomer(group.key)}
                                  className="text-[11px] text-cyan-700 hover:text-cyan-900 underline font-semibold cursor-pointer"
                                >
                                  Ocultar desglose ▲
                                </button>
                              </div>

                              <div className="grid grid-cols-1 divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                                {group.items.map((item, idx) => (
                                  <div 
                                    key={item.id || item.equipment_id || idx} 
                                    className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50/90 transition-colors"
                                  >
                                    {/* Identificador y equipo */}
                                    <div className="flex items-center gap-2.5 min-w-[220px]">
                                      <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                        #{idx + 1}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900">
                                          {item.equipment_brand} {item.equipment_btu ? `${item.equipment_btu.toLocaleString()} BTU` : ''}
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                          <span>📍 {item.equipment_location || 'Sin ubicación'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Fechas de Servicio y Vencimiento */}
                                    <div className="text-[11px] space-y-0.5 min-w-[150px] font-mono">
                                      <div className="text-slate-500">Último: <strong className="text-slate-800">{item.last_service_date}</strong></div>
                                      <div className="text-slate-500">Vencimiento: <strong className="text-cyan-800">{item.next_maintenance_due}</strong></div>
                                    </div>

                                    {/* Estado Individual */}
                                    <div className="min-w-[130px]">
                                      {item.status === 'vencido' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                          <AlertTriangle className="w-3 h-3" />
                                          Vencido ({Math.abs(item.days_until_due)}d)
                                        </span>
                                      )}
                                      {item.status === 'por_vencer' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                          <Clock className="w-3 h-3" />
                                          Vence en {item.days_until_due}d
                                        </span>
                                      )}
                                      {item.status === 'contactado' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                          <Check className="w-3 h-3" />
                                          Contactado
                                        </span>
                                      )}
                                      {item.status === 'al_dia' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Al día ({item.days_until_due}d)
                                        </span>
                                      )}
                                    </div>

                                    {/* Acciones individuales */}
                                    <div className="flex items-center gap-2 ml-auto">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenWhatsApp(item)}
                                        className="p-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                        title={`Enviar WhatsApp específico de este equipo (${item.equipment_brand})`}
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>WhatsApp</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onScheduleService(item)}
                                        className="p-1 px-2.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                        title={`Agendar visita para este equipo (${item.equipment_brand})`}
                                      >
                                        <CalendarPlus className="w-3 h-3" />
                                        <span>Agendar</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Configuración de Tiempos de Recaptación (NK-038) */}
      {isTimingModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTimingModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 my-auto cursor-default text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Configurar Tiempos de Recaptación</h3>
                  <p className="text-xs text-slate-400">Personaliza los intervalos de recordatorio automático</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimingModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTiming} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  1. Mantenimiento Preventivo Periódico (Meses):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={timingIntervalMonths}
                    onChange={(e) => setTimingIntervalMonths(parseInt(e.target.value) || 6)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  <span className="text-slate-500 font-semibold shrink-0">meses</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Estándar HVAC recomendado: 6 meses (semestral).
                </p>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  2. Control de Calidad Post-Servicio (Días):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={timingQualityDays}
                    onChange={(e) => setTimingQualityDays(parseInt(e.target.value) || 7)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  <span className="text-slate-500 font-semibold shrink-0">días</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tiempo posterior al servicio para enviar encuesta de satisfacción (rango típico: 3-14 días).
                </p>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  3. Umbral de Recuperación de Inactivos (Meses):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={6}
                    max={36}
                    value={timingRecoveryMonths}
                    onChange={(e) => setTimingRecoveryMonths(parseInt(e.target.value) || 9)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  <span className="text-slate-500 font-semibold shrink-0">meses</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Clientes sin servicio posterior a este plazo son clasificados para campañas de reactivación.
                </p>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  4. Anticipación de Alerta "Por Vencer" (Días):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={timingPreWarningDays}
                    onChange={(e) => setTimingPreWarningDays(parseInt(e.target.value) || 15)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  <span className="text-slate-500 font-semibold shrink-0">días antes</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTimingModalOpen(false)}
                  disabled={isSavingTiming}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTiming}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingTiming ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando en la nube...</span>
                    </>
                  ) : (
                    <span>Guardar Plazos</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
