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
      {/* Educational & Strategic Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-cyan-500/20 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Motor de Recaptación Preventiva Semestral (Cada 6 Meses)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Fidelización & Mantenimiento Periódico HVAC
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Los equipos de aire acondicionado acumulan moho y pierden eficiencia tras cada temporada (invierno/verano). 
              Este módulo detecta de forma automática los equipos con <strong>más de 180 días (6 meses)</strong> sin servicio técnico para reactivar el contacto con el cliente y agendar la mantención preventiva.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center sm:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Ingresos Proyectados por Recaptación</span>
              <p className="text-2xl font-black text-cyan-400 font-mono">
                ${stats.potencialIngreso.toLocaleString('es-CL')}
              </p>
              <span className="text-[10px] text-slate-500">
                Basado en ${settings.standard_maintenance_price.toLocaleString('es-CL')} por equipo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Vencidos (&gt; 6 Meses)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{stats.vencidos}</p>
          <p className="text-[11px] text-rose-400/80 font-medium">Urgente de contactar</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Por Vencer (&lt; 30 días)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.porVencer}</p>
          <p className="text-[11px] text-amber-400/80 font-medium">Aviso preventivo pre-temporada</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Contactados WhatsApp</span>
            <MessageCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400">{stats.contactados}</p>
          <p className="text-[11px] text-cyan-400/80 font-medium">En proceso de confirmación</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Al Día</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats.alDia}</p>
          <p className="text-[11px] text-emerald-400/80 font-medium">Operando en norma</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-200 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('vencido')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'vencido'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
            }`}
          >
            Vencidos ({stats.vencidos})
          </button>
          <button
            onClick={() => setFilterStatus('por_vencer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'por_vencer'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            Por Vencer ({stats.porVencer})
          </button>
          <button
            onClick={() => setFilterStatus('contactado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'contactado'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
            }`}
          >
            Contactados ({stats.contactados})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, comuna o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Reminders List Table / Grid */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Cliente & Ubicación</th>
                <th className="py-3.5 px-4">Equipo de Climatización</th>
                <th className="py-3.5 px-4">Última Mantención</th>
                <th className="py-3.5 px-4">Vencimiento (6 Meses)</th>
                <th className="py-3.5 px-4">Estado & Retraso</th>
                <th className="py-3.5 px-4 text-right">Acción Rápida de Recaptación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron clientes para este filtro de recaptación.
                  </td>
                </tr>
              ) : (
                filteredList.map((r) => {
                  const isOverdue = r.days_until_due < 0;
                  const isNear = r.days_until_due >= 0 && r.days_until_due <= 30;

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{r.customer_name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {r.customer_address}, {r.customer_commune}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.customer_phone}</div>
                      </td>

                      {/* Equipo */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-cyan-300">
                          {r.equipment_brand} {r.equipment_btu.toLocaleString('es-CL')} BTU
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>📍 {r.equipment_location}</span>
                        </div>
                      </td>

                      {/* Último Servicio */}
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        <div>{r.last_service_date}</div>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {r.last_service_type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Vencimiento 6M */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-white font-medium">{r.next_maintenance_due}</div>
                        <div className="text-[10px] text-slate-500">180 días exactos</div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {r.status === 'vencido' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            Vencido hace {Math.abs(r.days_until_due)} días
                          </span>
                        )}
                        {r.status === 'por_vencer' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            Vence en {r.days_until_due} días
                          </span>
                        )}
                        {r.status === 'contactado' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            <Check className="w-3 h-3" />
                            Contactado {r.contacted_at ? `(${r.contacted_at.split(' ')[0]})` : ''}
                          </span>
                        )}
                        {r.status === 'al_dia' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => onScheduleService(r)}
                            title="Crear Orden Preventiva en el Tablero"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
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
