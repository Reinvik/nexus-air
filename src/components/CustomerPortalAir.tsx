import React, { useState } from 'react';
import { Customer, AirEquipment, ServiceOrder, AirSettings } from '../types';
import { 
  Wind, 
  Thermometer, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  FileText,
  Phone,
  MessageCircle,
  HelpCircle,
  Navigation,
  MapPin,
  Camera,
  Video,
  Play,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { formatAirPrice } from '../lib/countries';
import { parseVideoUrl } from '../lib/videoUtils';

interface CustomerPortalAirProps {
  customers: Customer[];
  equipments: AirEquipment[];
  orders: ServiceOrder[];
  settings: AirSettings;
  onBackToApp: () => void;
  onOpenBooking: (customer?: Customer, equipment?: AirEquipment) => void;
}

export const CustomerPortalAir: React.FC<CustomerPortalAirProps> = ({
  customers,
  equipments,
  orders,
  settings,
  onBackToApp,
  onOpenBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('rut') || params.get('p') || '';
    }
    return '';
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rutParam = params.get('rut') || params.get('p');
      if (rutParam) {
        const found = customers.find(c => c.rut.toLowerCase() === rutParam.toLowerCase() || c.id === rutParam);
        if (found) return found.id;
      }
    }
    return customers[0]?.id || '';
  });

  // Buscar cliente por RUT o Teléfono o Nombre
  const matchedCustomer = customers.find(c => 
    (selectedCustomerId && c.id === selectedCustomerId) ||
    (searchQuery && (
      c.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  ) || customers[0];

  const clientEquipments = equipments.filter(e => e.customer_id === matchedCustomer?.id);
  const clientOrders = orders.filter(o => o.customer_id === matchedCustomer?.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Wind className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900">
              NEXUS<span className="text-cyan-600">AIR</span>
            </span>
            <p className="text-xs text-slate-500">Portal Mi Climatización & Historial de Equipos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenBooking(matchedCustomer)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar Nueva Mantención</span>
          </button>

          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Customer Identity Bar & Search */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">
              Bienvenido/a a tu Portal de Climatización
            </span>
            <h2 className="text-2xl font-black text-slate-900">{matchedCustomer?.name}</h2>
            <p className="text-xs text-slate-500">
              {matchedCustomer?.address}, {matchedCustomer?.commune} • {settings.tax_id_label || 'RUT'}: {matchedCustomer?.rut}
            </p>
          </div>

          {/* Quick Client Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  Ver perfil: {c.name} ({c.commune})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SECCIÓN EN VIVO: SEGUIMIENTO DE TRABAJO (STEPPER EN VIVO & GPS - NK-025) */}
        {clientOrders.some(o => o.status !== 'cancelado') && (
          <div className="space-y-4">
            {clientOrders.filter(o => o.status !== 'cancelado').slice(0, 1).map((liveOrd) => {
              const techName = liveOrd.assigned_technician?.name || 'Técnico Especialista';
              const isEnRuta = liveOrd.status === 'en_ruta';
              const isEnProceso = liveOrd.status === 'en_proceso';
              const isQA = liveOrd.status === 'pruebas_qa';
              const isCompleted = liveOrd.status === 'completado';
              const loc = liveOrd.technician_location;

              const stages = [
                { id: 'ingresado', step: 1, label: 'Agendado', desc: 'Confirmado', icon: '📝' },
                { id: 'en_ruta', step: 2, label: 'En Camino', desc: 'Trayecto GPS', icon: '🚐' },
                { id: 'en_proceso', step: 3, label: 'En Terreno', desc: 'Servicio HVAC', icon: '🛠️' },
                { id: 'pruebas_qa', step: 4, label: 'Pruebas QA', desc: 'Salto Térmico', icon: '🧪' },
                { id: 'completado', step: 5, label: 'Finalizado', desc: 'Garantía Activa', icon: '✅' },
              ];

              const currentStepIdx = stages.findIndex(s => s.id === liveOrd.status);

              return (
                <div key={`live-${liveOrd.id}`} className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-cyan-500/40 text-white shadow-xl space-y-6">
                  {/* Encabezado del Servicio en Vivo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center">
                          {isCompleted ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Navigation className="w-5 h-5 animate-pulse" />}
                        </div>
                        {!isCompleted && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                            {isCompleted ? '✅ Servicio Técnico Finalizado' :
                             isEnRuta ? '🚐 Técnico en Camino a tu Domicilio' :
                             isEnProceso ? '🛠️ Técnico en Terreno Realizando Servicio' :
                             isQA ? '🧪 Pruebas de Calidad y Rendimiento HVAC' :
                             '📅 Orden Técnica Agendada'}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white">{techName}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                        Orden #{liveOrd.ticket_number}
                      </span>
                      {liveOrd.assigned_technician?.phone && !isCompleted && (
                        <a
                          href={`https://wa.me/${liveOrd.assigned_technician.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(techName)}%2C%20te%20escribo%20del%20domicilio%20por%20la%20orden%20${liveOrd.ticket_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-xs"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* STEPPER EN VIVO (NK-025) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        Estado del Proceso en Tiempo Real
                      </span>
                      <span className="text-[11px] text-cyan-400 font-mono font-bold">
                        Etapa {currentStepIdx + 1} de 5
                      </span>
                    </div>

                    {/* Barra Visual de Etapas */}
                    <div className="grid grid-cols-5 gap-1 sm:gap-2 pt-2">
                      {stages.map((stg, idx) => {
                        const isPast = idx < currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={stg.id} className="flex flex-col items-center text-center space-y-1.5">
                            <div className="w-full flex items-center">
                              <div className={`h-1.5 w-full rounded-full transition-all ${
                                isPast ? 'bg-emerald-400' :
                                isCurrent ? 'bg-cyan-400 animate-pulse' :
                                'bg-slate-700'
                              }`} />
                            </div>

                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                              isPast ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' :
                              isCurrent ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/30 scale-105 font-black shadow-lg shadow-cyan-400/30' :
                              'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {isPast ? '✓' : stg.icon}
                            </div>

                            <div className="hidden sm:block">
                              <span className={`text-[11px] font-bold block leading-tight ${
                                isCurrent ? 'text-cyan-300' : isPast ? 'text-emerald-300' : 'text-slate-400'
                              }`}>
                                {stg.label}
                              </span>
                              <span className="text-[9px] text-slate-400 block">{stg.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Si está en ruta o en proceso: Radar GPS y Mapa */}
                  {(isEnRuta || isEnProceso) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
                      <div className="md:col-span-2 relative h-48 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4">
                        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#00d2ff_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="flex items-center justify-between z-10">
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                            GPS Satelital Activo (watchPosition)
                          </span>
                          {loc?.updated_at && (
                            <span className="text-[10px] text-cyan-300/80 font-mono">
                              Actualizado en vivo
                            </span>
                          )}
                        </div>

                        {/* Indicadores de ruta */}
                        <div className="flex items-center justify-around py-4 z-10">
                          <div className="flex flex-col items-center gap-1 text-center">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400 text-blue-300 flex items-center justify-center shadow-lg">
                              🚐
                            </div>
                            <span className="text-[11px] font-bold text-white">{techName.split(' ')[0]}</span>
                            <span className="text-[9px] text-cyan-300">{isEnRuta ? 'En trayecto' : 'En tu domicilio'}</span>
                          </div>

                          <div className="flex-1 mx-4 flex flex-col items-center">
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                              <div className={`h-full bg-gradient-to-r from-cyan-400 to-emerald-400 ${isEnRuta ? 'w-2/3 animate-pulse' : 'w-full'}`} />
                            </div>
                            <span className="text-[10px] text-cyan-400 mt-1 font-bold">
                              {isEnRuta ? 'Tiempo estimado: 10 - 15 min' : 'Técnico trabajando en terreno'}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1 text-center">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400 text-emerald-300 flex items-center justify-center shadow-lg">
                              📍
                            </div>
                            <span className="text-[11px] font-bold text-white">Tu Domicilio</span>
                            <span className="text-[9px] text-slate-400">{matchedCustomer?.commune}</span>
                          </div>
                        </div>

                        <div className="z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                          <span>Destino: <strong className="text-white">{matchedCustomer?.address}</strong></span>
                          {loc && (
                            <span className="font-mono text-[10px] text-cyan-300">
                              Lat: {loc.lat.toFixed(4)} • Lng: {loc.lng.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recomendaciones de Espera */}
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                        <strong className="text-cyan-300 block">ℹ️ Al momento de la visita:</strong>
                        <ul className="space-y-1.5 text-[11px] text-slate-300">
                          <li>• Mantén despejada el área cercana al equipo split interior o condensador.</li>
                          <li>• Si vives en edificio, autoriza el ingreso en conserjería para evitar demoras.</li>
                          <li>• El técnico cuenta con implementos de seguridad y acreditación SEC.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Installed Equipments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wind className="w-5 h-5 text-cyan-600" />
              Tus Equipos de Aire Acondicionado ({clientEquipments.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Ciclo de Mantención Semestral (180 Días)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {clientEquipments.map((eq) => (
              <div
                key={eq.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs hover:border-cyan-500/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-cyan-600">{eq.brand}</span>
                    <h4 className="text-lg font-bold text-slate-900">
                      {eq.btu.toLocaleString('es-CL')} BTU ({eq.technology.toUpperCase()})
                    </h4>
                    <p className="text-xs text-slate-500">Ubicación: 📍 {eq.location_in_property}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                    Gas {eq.refrigerant}
                  </span>
                </div>

                {/* Maintenance Timeline Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Última Mantención:</span>
                    <span className="text-slate-800 font-mono font-medium">{eq.last_maintenance_date || 'Instalación nueva'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cyan-700 font-semibold">Próxima Mantención (6 Meses):</span>
                    <span className="text-cyan-600 font-mono font-bold">{eq.next_maintenance_date}</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mt-1">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 w-3/4 rounded-full" />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Garantía Vigente</span>
                  </div>
                  <button
                    onClick={() => onOpenBooking(matchedCustomer, eq)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Agendar Mantención
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service History Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600" />
            Historial de Servicios Técnicos & Fichas de Medición
          </h3>

          <div className="space-y-3">
            {clientOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-3xl shadow-xs">
                No hay servicios anteriores registrados para esta cuenta.
              </div>
            ) : (
              clientOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-600 text-xs">{ord.ticket_number}</span>
                      <span className="text-sm font-bold text-slate-900 capitalize">
                        {ord.service_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{ord.description}</p>

                  {/* Checklist & QA Results */}
                  {ord.checklist?.delta_t_celsius && (
                    <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-100 flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-cyan-700 font-mono font-medium">
                        <Thermometer className="w-4 h-4 text-cyan-600" />
                        <span>Salto Térmico ΔT: {ord.checklist.delta_t_celsius}°C (Óptimo)</span>
                      </div>
                      {ord.checklist.suction_pressure_psi && (
                        <div className="text-slate-700 font-mono">
                          Presión: {ord.checklist.suction_pressure_psi} PSI
                        </div>
                      )}
                      {ord.checklist.amperage_amps && (
                        <div className="text-slate-700 font-mono">
                          Consumo: {ord.checklist.amperage_amps} Amperes
                        </div>
                      )}
                    </div>
                  )}
                  {/* Evidencia Fotográfica y Videos Antes y Después */}
                  {((ord.checklist?.photos_before?.length || 0) > 0 || 
                    (ord.checklist?.photos_after?.length || 0) > 0 || 
                    (ord.checklist?.videos_before?.length || 0) > 0 || 
                    (ord.checklist?.videos_after?.length || 0) > 0) && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-cyan-600" />
                          Evidencia del Trabajo Realizado (Antes y Después)
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Transparencia técnica de mantención
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Columna Antes */}
                        <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 block pb-1 border-b border-slate-100">
                            🔍 Estado Inicial (Antes)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {(ord.checklist?.photos_before || []).map((url, i) => (
                              <a
                                key={`pb-${i}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black block"
                              >
                                <img src={url} alt={`Antes ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded flex items-center gap-0.5">
                                  <ExternalLink className="w-2.5 h-2.5" /> Ver
                                </span>
                              </a>
                            ))}
                            {(ord.checklist?.videos_before || []).map((url, i) => {
                              const vInfo = parseVideoUrl(url);
                              return (
                                <div key={`vb-${i}`} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black">
                                  {vInfo.isEmbed ? (
                                    <iframe
                                      src={vInfo.embedUrl}
                                      className="w-full h-full border-0"
                                      allow="autoplay; encrypted-media"
                                      allowFullScreen
                                      title={`Video Antes ${i + 1}`}
                                    />
                                  ) : (
                                    <video src={url} controls className="w-full h-full object-cover" />
                                  )}
                                  {vInfo.isDrive && (
                                    <a
                                      href={vInfo.rawUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute top-1 left-1 bg-blue-600/90 hover:bg-blue-700 text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow-xs transition-colors z-10"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" /> Drive
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Columna Después */}
                        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                          <span className="text-[11px] font-bold text-emerald-800 block pb-1 border-b border-emerald-100">
                            ✨ Resultado Final (Después)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {(ord.checklist?.photos_after || []).map((url, i) => (
                              <a
                                key={`pa-${i}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-video rounded-lg overflow-hidden border border-emerald-200 bg-black block"
                              >
                                <img src={url} alt={`Después ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded flex items-center gap-0.5">
                                  <ExternalLink className="w-2.5 h-2.5" /> Ver
                                </span>
                              </a>
                            ))}
                            {(ord.checklist?.videos_after || []).map((url, i) => {
                              const vInfo = parseVideoUrl(url);
                              return (
                                <div key={`va-${i}`} className="relative aspect-video rounded-lg overflow-hidden border border-emerald-200 bg-black">
                                  {vInfo.isEmbed ? (
                                    <iframe
                                      src={vInfo.embedUrl}
                                      className="w-full h-full border-0"
                                      allow="autoplay; encrypted-media"
                                      allowFullScreen
                                      title={`Video Después ${i + 1}`}
                                    />
                                  ) : (
                                    <video src={url} controls className="w-full h-full object-cover" />
                                  )}
                                  {vInfo.isDrive && (
                                    <a
                                      href={vInfo.rawUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute top-1 left-1 bg-blue-600/90 hover:bg-blue-700 text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow-xs transition-colors z-10"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" /> Drive
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Fecha de atención: {ord.scheduled_date}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      Total: {formatAirPrice(ord.total, settings?.currency_symbol, settings?.country_code)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Energy Efficiency & Care Tips Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-50 via-blue-50/40 to-slate-50 border border-cyan-200 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-cyan-800 font-bold text-sm">
            <Zap className="w-4 h-4 text-cyan-600" />
            <span>Recomendaciones Nexus Air para Ahorro Eléctrico</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-2xl bg-white border border-cyan-100 shadow-xs">
              <strong className="text-slate-900 block mb-1">🌡️ Temperatura Ideal en Verano: 24°C</strong>
              Cada grado menos que fijes en el termostato incrementa hasta un 8% el consumo de tu boleta eléctrica.
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-cyan-100 shadow-xs">
              <strong className="text-slate-900 block mb-1">🧼 Limpieza Periódica de Filtros</strong>
              Filtros limpios aseguran flujo libre de aire y evitan que el compresor Inverter trabaje forzado.
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-cyan-100 shadow-xs">
              <strong className="text-slate-900 block mb-1">⏱️ Mantención Semestral 6M</strong>
              Garantiza la eliminación de bacterias, previene fugas de refrigerante y alarga la vida útil a más de 12 años.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
