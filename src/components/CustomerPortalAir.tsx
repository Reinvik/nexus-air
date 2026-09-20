import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
  Download,
  LogOut,
  Eye,
  UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { formatAirPrice } from '../lib/countries';
import { parseVideoUrl } from '../lib/videoUtils';
import { calculateLiveRouteETA, getCustomerCoordinates, RouteETA } from '../lib/routingService';
import { generateReceiptPdfAir } from '../lib/pdfServiceAir';

interface CustomerPortalAirProps {
  customers: Customer[];
  equipments: AirEquipment[];
  orders: ServiceOrder[];
  settings: AirSettings;
  isStaff?: boolean;
  onBackToApp: () => void;
  onOpenBooking: (customer?: Customer, equipment?: AirEquipment) => void;
}

const LiveRadarGpsCard: React.FC<{
  liveOrd: ServiceOrder;
  matchedCustomer?: Customer;
  isEnRuta: boolean;
  isEnProceso: boolean;
  techName: string;
}> = ({ liveOrd, matchedCustomer, isEnRuta, isEnProceso, techName }) => {
  const loc = liveOrd.technician_location;
  const [routeEta, setRouteEta] = useState<RouteETA | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!loc || !loc.lat || !loc.lng) return;

    const destination = getCustomerCoordinates(
      matchedCustomer?.commune,
      matchedCustomer?.city,
      matchedCustomer?.address
    );

    setIsCalculating(true);
    calculateLiveRouteETA(
      { lat: loc.lat, lng: loc.lng },
      destination,
      matchedCustomer?.commune || 'Tu Domicilio'
    )
      .then((res) => {
        setRouteEta(res);
        setIsCalculating(false);
      })
      .catch((err) => {
        console.warn('Error calculando ruta dinámica:', err);
        setIsCalculating(false);
      });
  }, [loc?.lat, loc?.lng, loc?.updated_at, matchedCustomer?.commune, matchedCustomer?.address]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
      <div className="md:col-span-2 relative h-52 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#00d2ff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Cabecera del Radar */}
        <div className="flex items-center justify-between z-10">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-emerald-400 font-bold">GPS Satelital Activo</span>
            <span className="text-slate-500">•</span>
            <span className="text-[10px] text-cyan-300">
              {routeEta?.source === 'osrm' ? 'Red vial OSRM en vivo' : 'Ruta vial calculada'}
            </span>
          </span>
          {loc?.updated_at && (
            <span className="text-[10px] text-cyan-300/80 font-mono">
              Actualizado en vivo
            </span>
          )}
        </div>

        {/* Indicadores de ruta y progreso */}
        <div className="flex items-center justify-around py-3 z-10">
          {/* Técnico Origen */}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400 text-blue-300 flex items-center justify-center shadow-lg">
              🚐
            </div>
            <span className="text-[11px] font-bold text-white">{techName.split(' ')[0]}</span>
            <span className="text-[9px] text-cyan-300">{isEnRuta ? 'En trayecto (GPS)' : 'En tu domicilio'}</span>
          </div>

          {/* Barra y ETA Dinámico */}
          <div className="flex-1 mx-4 flex flex-col items-center">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div className={`h-full bg-gradient-to-r from-cyan-400 to-emerald-400 ${isEnRuta ? 'w-2/3 animate-pulse' : 'w-full'}`} />
            </div>

            {/* Tiempo Dinámico Calculado */}
            <div className="text-center mt-1.5 space-y-0.5">
              <div className="text-[11px] font-extrabold text-cyan-300 flex items-center justify-center gap-1">
                {isEnRuta ? (
                  isCalculating && !routeEta ? (
                    <span className="animate-pulse">Calculando tiempo de viaje...</span>
                  ) : routeEta ? (
                    <>
                      <span>⏱️ Tiempo estimado:</span>
                      <span className="text-white bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                        {routeEta.durationFormatted}
                      </span>
                      <span className="text-cyan-400 font-normal">({routeEta.distanceFormatted})</span>
                    </>
                  ) : (
                    <span>Tiempo estimado: 35 - 45 min aprox.</span>
                  )
                ) : (
                  <span className="text-emerald-300">🛠️ Técnico trabajando en terreno</span>
                )}
              </div>

              {/* Alerta de tráfico si aplica */}
              {isEnRuta && routeEta?.trafficStatus === 'alto' && (
                <span className="inline-block text-[9px] text-amber-300 font-medium px-1.5 py-0.2 rounded bg-amber-950/40 border border-amber-500/30">
                  ⚠️ Tráfico horario punta considerado
                </span>
              )}
            </div>
          </div>

          {/* Domicilio Destino */}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400 text-emerald-300 flex items-center justify-center shadow-lg">
              📍
            </div>
            <span className="text-[11px] font-bold text-white">Tu Domicilio</span>
            <span className="text-[9px] text-emerald-300 font-medium">{matchedCustomer?.commune || 'Destino'}</span>
          </div>
        </div>

        {/* Footer con información de llegada */}
        <div className="z-10 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
          <span>
            Destino: <strong className="text-white">{matchedCustomer?.address}</strong> ({matchedCustomer?.commune})
          </span>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            {routeEta && (
              <span className="text-emerald-300 font-bold">
                Distancia: {routeEta.distanceFormatted}
              </span>
            )}
            {loc && (
              <span className="text-cyan-300/80">
                GPS: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
              </span>
            )}
          </div>
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
  );
};

export const CustomerPortalAir: React.FC<CustomerPortalAirProps> = ({
  customers,
  equipments,
  orders,
  settings,
  onBackToApp,
  onOpenBooking,
}) => {
  // Helper to normalize RUT / strings for robust matching
  const cleanDoc = (val?: string) => (val || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const [inputRut, setInputRut] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Client identifier from URL param (?rut or ?p) or sessionStorage
  const [activeIdentifier, setActiveIdentifier] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rutParam = params.get('rut') || params.get('p');
      if (rutParam) return rutParam;
      const stored = sessionStorage.getItem('nexus_air_portal_identifier');
      if (stored) return stored;
    }
    return '';
  });

  // Selected customer for staff admin preview
  const [adminSelectedCustomerId, setAdminSelectedCustomerId] = useState<string>(() => {
    return customers[0]?.id || '';
  });

  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  // Determine matchedCustomer:
  // - If isStaff: preview any customer via adminSelectedCustomerId, default to customers[0]
  // - If !isStaff: ONLY match if activeIdentifier is present and matches a customer. NEVER default to customers[0].
  const matchedCustomer = useMemo(() => {
    if (isStaff) {
      return customers.find(c => c.id === adminSelectedCustomerId) || customers[0] || null;
    }

    if (!activeIdentifier) return null;

    const query = cleanDoc(activeIdentifier);
    return customers.find(c => {
      const r = cleanDoc(c.rut);
      const p = cleanDoc(c.phone);
      const id = cleanDoc(c.id);
      return (r && r === query) || (p && p.includes(query)) || (id && id === query);
    }) || null;
  }, [isStaff, adminSelectedCustomerId, activeIdentifier, customers]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = cleanDoc(inputRut);
    if (!query) {
      toast.error(`Por favor ingresa tu ${settings.tax_id_label || 'RUT'} o teléfono`);
      return;
    }

    const found = customers.find(c => {
      const r = cleanDoc(c.rut);
      const p = cleanDoc(c.phone);
      const id = cleanDoc(c.id);
      return (r && r === query) || (p && p.includes(query)) || (id && id === query);
    });

    if (found) {
      setActiveIdentifier(found.rut || found.id);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nexus_air_portal_identifier', found.rut || found.id);
      }
      setHasSearched(false);
      toast.success(`¡Bienvenido/a, ${found.name}!`);
    } else {
      setHasSearched(true);
    }
  };

  const handleExitPortal = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nexus_air_portal_identifier');
      const url = new URL(window.location.href);
      url.searchParams.delete('rut');
      url.searchParams.delete('p');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
    setActiveIdentifier('');
    setInputRut('');
    setHasSearched(false);
  };

  // VISTA PARA CLIENTES NO IDENTIFICADOS (Evita mostrar datos de otros usuarios)
  if (!matchedCustomer && !isStaff) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Wind className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900">
                {settings?.company_name || 'NEXUS AIR'}
              </span>
              <p className="text-xs text-slate-500">Portal Mi Climatización & Historial</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenBooking()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Mantención</span>
            </button>

            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Inicio</span>
            </button>
          </div>
        </header>

        {/* Identification Form Card */}
        <main className="max-w-md w-full mx-auto p-6 my-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-cyan-600 tracking-wider uppercase">
                Acceso Exclusivo a Clientes
              </span>
              <h2 className="text-2xl font-black text-slate-900">Consulta tu Historial</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ingresa tu {settings.tax_id_label || 'RUT'} o teléfono para consultar tus equipos registrados, historial de mantenciones y el seguimiento satelital de tu técnico en terreno.
              </p>
            </div>

            <form onSubmit={handleLookupSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {settings.tax_id_label || 'RUT'} del Titular o Teléfono
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputRut}
                    onChange={(e) => {
                      setInputRut(e.target.value);
                      if (hasSearched) setHasSearched(false);
                    }}
                    placeholder="Ej: 17.257.060-7 o +56 9 1234 5678"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {hasSearched && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>No encontramos servicios asociados</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    No encontramos ningún cliente registrado con el identificador ingresado. Si aún no tienes un servicio agendado, puedes solicitarlo a continuación:
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenBooking()}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Agendar Atención Ahora
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Consultar Mis Servicios</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacidad garantizada bajo cifrado SSL 256-bit</span>
            </div>
          </div>
        </main>

        <footer className="text-center py-6 text-xs text-slate-400">
          © {new Date().getFullYear()} {settings.company_name || 'Nexus Air'}. Todos los derechos reservados.
        </footer>
      </div>
    );
  }

  const clientEquipments = matchedCustomer ? equipments.filter(e => e.customer_id === matchedCustomer.id) : [];
  const clientOrders = matchedCustomer ? orders.filter(o => o.customer_id === matchedCustomer.id) : [];

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
              {settings?.company_name || 'NEXUS'}<span className="text-cyan-600">{settings?.company_name ? '' : 'AIR'}</span>
            </span>
            <p className="text-xs text-slate-500">Portal Mi Climatización & Historial de Equipos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenBooking(matchedCustomer || undefined)}
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
            <span>{isStaff ? 'Volver al Panel' : 'Volver al Inicio'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Banner de Previsualización para Administradores / Staff */}
        {isStaff && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-900">Modo Vista Previa Administrador</span>
                <p className="text-[11px] text-amber-700">
                  Esta barra y el selector de perfiles solo son visibles para administradores y técnicos logeados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Simular Cliente:</span>
              <select
                value={matchedCustomer?.id || ''}
                onChange={(e) => setAdminSelectedCustomerId(e.target.value)}
                className="p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none shadow-xs"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.commune || 'Sin comuna'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Customer Identity Bar */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">
              Bienvenido/a a tu Portal de Climatización
            </span>
            <h2 className="text-2xl font-black text-slate-900">{matchedCustomer?.name || 'Cliente'}</h2>
            <p className="text-xs text-slate-500">
              {matchedCustomer?.address}, {matchedCustomer?.commune} • {settings.tax_id_label || 'RUT'}: {matchedCustomer?.rut}
            </p>
          </div>

          {!isStaff && (
            <button
              onClick={handleExitPortal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200 self-start md:self-center"
              title="Salir y consultar con otro documento"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Consultar otro {settings.tax_id_label || 'RUT'}</span>
            </button>
          )}
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

                  {/* Si está en ruta o en proceso: Radar GPS y Mapa con ETA Dinámico OSRM */}
                  {(isEnRuta || isEnProceso) && (
                    <LiveRadarGpsCard 
                      liveOrd={liveOrd} 
                      matchedCustomer={matchedCustomer} 
                      isEnRuta={isEnRuta} 
                      isEnProceso={isEnProceso} 
                      techName={techName} 
                    />
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

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Fecha de atención: {ord.scheduled_date || 'Atención técnica'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">
                        Total: {formatAirPrice(ord.total, settings?.currency_symbol, settings?.country_code)}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setDownloadingReceiptId(ord.id);
                            toast.loading('Generando comprobante de servicio...', { id: `rc-${ord.id}` });
                            await generateReceiptPdfAir(ord, settings);
                            toast.success('¡Comprobante descargado en PDF!', { id: `rc-${ord.id}` });
                          } catch (err) {
                            console.error('Error generando comprobante:', err);
                            toast.error('Error al descargar comprobante', { id: `rc-${ord.id}` });
                          } finally {
                            setDownloadingReceiptId(null);
                          }
                        }}
                        disabled={downloadingReceiptId === ord.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 font-bold text-xs border border-slate-200 transition-colors shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Descargar Comprobante / Recibo Oficial en PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingReceiptId === ord.id ? 'Generando...' : 'Descargar Recibo (PDF)'}</span>
                      </button>
                    </div>
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
