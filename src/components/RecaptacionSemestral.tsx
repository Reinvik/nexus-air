import React, { useState, useMemo } from 'react';
import { RecaptacionReminder, AirSettings } from '../types';
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
  Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RecaptacionSemestralProps {
  reminders: RecaptacionReminder[];
  settings: AirSettings;
  onMarkContacted: (equipmentId: string) => void;
  onScheduleService: (reminder: RecaptacionReminder) => void;
  generateWhatsAppUrl: (reminder: RecaptacionReminder) => string;
}

export const RecaptacionSemestral: React.FC<RecaptacionSemestralProps> = ({
  reminders,
  settings,
  onMarkContacted,
  onScheduleService,
  generateWhatsAppUrl,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'vencido' | 'por_vencer' | 'contactado'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estadísticas del embudo semestral
  const stats = useMemo(() => {
    const total = reminders.length;
    const vencidos = reminders.filter(r => r.status === 'vencido').length;
    const porVencer = reminders.filter(r => r.status === 'por_vencer').length;
    const contactados = reminders.filter(r => r.status === 'contactado').length;
    const alDia = reminders.filter(r => r.status === 'al_dia').length;

    const potencialIngreso = (vencidos + porVencer) * settings.standard_maintenance_price;

    return { total, vencidos, porVencer, contactados, alDia, potencialIngreso };
  }, [reminders, settings.standard_maintenance_price]);

  // Lista filtrada
  const filteredList = useMemo(() => {
    return reminders.filter(r => {
      const matchSearch =
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.equipment_brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.equipment_location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [reminders, searchTerm, filterStatus]);

  const handleOpenWhatsApp = (reminder: RecaptacionReminder) => {
    const url = generateWhatsAppUrl(reminder);
    window.open(url, '_blank');
    onMarkContacted(reminder.equipment_id);
  };

  return (
    <div className="space-y-6">
      {/* Educational & Strategic Header Banner (Estilo Nexus Lean) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Motor de Recaptación Preventiva Semestral (Cada 6 Meses)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Fidelización & Mantenimiento Periódico HVAC
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Detección automática de equipos con <strong>más de 180 días (6 meses)</strong> sin mantención. 
            Permite reactivar el contacto con el cliente antes de la temporada de calor o frío para agendar la limpieza preventiva.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left sm:text-right shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold block">Ingresos Proyectados por Recaptación</span>
          <p className="text-2xl font-black text-cyan-600 font-mono">
            ${stats.potencialIngreso.toLocaleString('es-CL')}
          </p>
          <span className="text-[10px] text-slate-400">
            ${settings.standard_maintenance_price.toLocaleString('es-CL')} por equipo
          </span>
        </div>
      </div>

      {/* Vibrant Colored KPI Cards (Idéntico a imagen 2 de Nexus Lean) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Vencidos - Vibrant Red Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Vencidos (&gt; 6 Meses)</span>
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black tracking-tight">{stats.vencidos}</p>
          <p className="text-[11px] text-white/80 font-medium">Urgente de contactar</p>
        </div>

        {/* Por Vencer - Vibrant Amber Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Por Vencer (&lt; 30 días)</span>
            <Clock className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black tracking-tight">{stats.porVencer}</p>
          <p className="text-[11px] text-white/80 font-medium">Aviso pre-temporada</p>
        </div>

        {/* Contactados - Vibrant Cyan/Blue Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Contactados WhatsApp</span>
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black tracking-tight">{stats.contactados}</p>
          <p className="text-[11px] text-white/80 font-medium">En confirmación</p>
        </div>

        {/* Al Día - Vibrant Emerald Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Al Día</span>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black tracking-tight">{stats.alDia}</p>
          <p className="text-[11px] text-white/80 font-medium">Operando en norma</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({stats.total})
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

      {/* Reminders List Table in Crisp White */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Cliente & Ubicación</th>
                <th className="py-3.5 px-4">Equipo de Climatización</th>
                <th className="py-3.5 px-4">Última Mantención</th>
                <th className="py-3.5 px-4">Vencimiento (6 Meses)</th>
                <th className="py-3.5 px-4">Estado & Retraso</th>
                <th className="py-3.5 px-4 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron clientes para este filtro de recaptación.
                  </td>
                </tr>
              ) : (
                filteredList.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{r.customer_name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {r.customer_address}, {r.customer_commune}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.customer_phone}</div>
                      </td>

                      {/* Equipo */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-cyan-700">
                          {r.equipment_brand} {r.equipment_btu.toLocaleString('es-CL')} BTU
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>📍 {r.equipment_location}</span>
                        </div>
                      </td>

                      {/* Último Servicio */}
                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        <div className="font-semibold">{r.last_service_date}</div>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {r.last_service_type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Vencimiento 6M */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-900 font-bold">{r.next_maintenance_due}</div>
                        <div className="text-[10px] text-slate-400">180 días exactos</div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {r.status === 'vencido' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            Vencido hace {Math.abs(r.days_until_due)} días
                          </span>
                        )}
                        {r.status === 'por_vencer' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Vence en {r.days_until_due} días
                          </span>
                        )}
                        {r.status === 'contactado' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            <Check className="w-3 h-3" />
                            Contactado {r.contacted_at ? `(${r.contacted_at.split(' ')[0]})` : ''}
                          </span>
                        )}
                        {r.status === 'al_dia' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Al día ({r.days_until_due} días)
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenWhatsApp(r)}
                            title="Enviar WhatsApp de Recaptación"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => onScheduleService(r)}
                            title="Crear Orden Preventiva en el Tablero"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 text-xs font-bold transition-all cursor-pointer"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Agendar (1-Clic)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
