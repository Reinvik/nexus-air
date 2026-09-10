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
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface CustomerPortalAirProps {
  customers: Customer[];
  equipments: AirEquipment[];
  orders: ServiceOrder[];
  settings: AirSettings;
  onBackToApp: () => void;
  onOpenBooking: () => void;
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
            onClick={onOpenBooking}
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
              {matchedCustomer?.address}, {matchedCustomer?.commune} • RUT: {matchedCustomer?.rut}
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
                    onClick={onOpenBooking}
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

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Fecha de atención: {ord.scheduled_date}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      Total: ${ord.total.toLocaleString('es-CL')}
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
