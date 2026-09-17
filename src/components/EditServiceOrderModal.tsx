import React, { useState } from 'react';
import { ServiceOrder, Technician, OrderStatus, ServiceType, AirSettings } from '../types';
import { X, Save, Trash2, Calendar, Clock, Wrench, DollarSign, CheckCircle, Navigation, Radio, MapPin, Users, Percent, Check, FileText } from 'lucide-react';

interface EditServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  technicians: Technician[];
  settings?: AirSettings;
  onUpdateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  onDeleteOrder: (id: string) => void;
  onOpenReceipt?: (order: ServiceOrder) => void;
}

export const EditServiceOrderModal: React.FC<EditServiceOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  technicians,
  settings,
  onUpdateOrder,
  onDeleteOrder,
  onOpenReceipt,
}) => {
  if (!isOpen || !order) return null;

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [technicianId, setTechnicianId] = useState(order.assigned_technician_id || '');
  const [assistantId, setAssistantId] = useState(order.assigned_assistant_id || '');
  const [techPayoutType, setTechPayoutType] = useState<'fixed' | 'percentage'>(order.technician_payout_type || 'fixed');
  const [techPayoutValue, setTechPayoutValue] = useState<number>(order.technician_payout_value ?? 20000);
  const [assistantPayoutType, setAssistantPayoutType] = useState<'fixed' | 'percentage'>(order.assistant_payout_type || 'fixed');
  const [assistantPayoutValue, setAssistantPayoutValue] = useState<number>(order.assistant_payout_value ?? 10000);

  const [scheduledDate, setScheduledDate] = useState(order.scheduled_date);
  const [scheduledSlot, setScheduledSlot] = useState(order.scheduled_time_slot);
  const [description, setDescription] = useState(order.description);
  const [diagnosis, setDiagnosis] = useState(order.diagnosis || '');
  const [resolution, setResolution] = useState(order.resolution || '');
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [total, setTotal] = useState(order.total);

  // GPS Live Tracking State
  const [isTrackingGps, setIsTrackingGps] = useState(order.status === 'en_ruta' && !!order.technician_location?.is_active);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(
    order.technician_location ? { lat: order.technician_location.lat, lng: order.technician_location.lng } : null
  );
  const [geoWatchId, setGeoWatchId] = useState<number | null>(null);

  const calculatedTechPayout = techPayoutType === 'percentage' 
    ? Math.round((total * techPayoutValue) / 100) 
    : techPayoutValue;
  const calculatedAssistantPayout = assistantId 
    ? (assistantPayoutType === 'percentage' 
        ? Math.round((total * assistantPayoutValue) / 100) 
        : assistantPayoutValue)
    : 0;

  const handleStartTrip = () => {
    setStatus('en_ruta');
    setIsTrackingGps(true);

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          setLastCoords({ lat: latitude, lng: longitude });
          const assignedTech = technicians.find(t => t.id === technicianId);
          onUpdateOrder(order.id, {
            status: 'en_ruta',
            technician_location: {
              order_id: order.id,
              technician_name: assignedTech?.name || 'Técnico HVAC',
              lat: latitude,
              lng: longitude,
              accuracy,
              speed,
              heading,
              updated_at: new Date().toISOString(),
              is_active: true,
            }
          });
        },
        (err) => {
          console.warn('Geolocation fallback:', err);
          const defaultLat = -33.4180;
          const defaultLng = -70.6010;
          setLastCoords({ lat: defaultLat, lng: defaultLng });
          const assignedTech = technicians.find(t => t.id === technicianId);
          onUpdateOrder(order.id, {
            status: 'en_ruta',
            technician_location: {
              order_id: order.id,
              technician_name: assignedTech?.name || 'Técnico HVAC',
              lat: defaultLat,
              lng: defaultLng,
              accuracy: 15,
              updated_at: new Date().toISOString(),
              is_active: true,
            }
          });
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
      );
      setGeoWatchId(watchId);
    }
  };

  const handleArrived = () => {
    if (geoWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchId);
      setGeoWatchId(null);
    }
    setIsTrackingGps(false);
    setStatus('en_proceso');
    onUpdateOrder(order.id, {
      status: 'en_proceso',
      technician_location: order.technician_location ? {
        ...order.technician_location,
        is_active: false,
        updated_at: new Date().toISOString(),
      } : undefined
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateOrder(order.id, {
      status,
      assigned_technician_id: technicianId,
      assigned_assistant_id: assistantId || undefined,
      technician_payout_type: techPayoutType,
      technician_payout_value: techPayoutValue,
      assistant_payout_type: assistantPayoutType,
      assistant_payout_value: assistantPayoutValue,
      scheduled_date: scheduledDate,
      scheduled_time_slot: scheduledSlot,
      description,
      diagnosis,
      resolution,
      payment_status: paymentStatus,
      total,
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta orden de servicio?')) {
      onDeleteOrder(order.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              Editar Orden Técnica
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                {order.ticket_number}
              </span>
            </h3>
            <p className="text-xs text-slate-500">{order.customer?.name} • {order.customer?.commune}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Status & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Estado de la Orden</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
              >
                <option value="ingresado">Ingresado / Solicitud</option>
                <option value="en_ruta">En Ruta (Despachado)</option>
                <option value="en_proceso">En Proceso / Terreno</option>
                <option value="pruebas_qa">Pruebas QA & Medición</option>
                <option value="completado">Completado / Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Estado de Pago</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
              >
                <option value="pendiente">Pendiente de Pago</option>
                <option value="abono">Abono Inicial Recibido</option>
                <option value="pagado">Pagado Total</option>
              </select>
            </div>
          </div>

          {/* SECCIÓN 1: GPS & TRAYECTO EN VIVO AL CLIENTE */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-blue-950 text-white border border-blue-900/40 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isTrackingGps ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="font-bold text-xs tracking-wide flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#00d2ff]" />
                  Despacho & Trayecto en Vivo (GPS)
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isTrackingGps 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isTrackingGps ? 'Transmitiendo GPS' : 'GPS Inactivo'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Al pulsar <strong>Iniciar Trayecto</strong>, la orden pasa a <em>Técnico en Ruta</em> y el Portal Cliente muestra el mapa con tu ubicación en tiempo real.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!isTrackingGps ? (
                <button
                  type="button"
                  onClick={handleStartTrip}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:brightness-110 transition-all cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Iniciar Trayecto (GPS)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleArrived}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>¡Llegué a Terreno! (Detener GPS)</span>
                  </button>
                  {lastCoords && (
                    <span className="text-[10px] text-cyan-300 font-mono">
                      📍 {lastCoords.lat.toFixed(4)}, {lastCoords.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fecha y Bloque Horario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Fecha</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Bloque Horario</label>
              <input
                type="text"
                value={scheduledSlot}
                onChange={(e) => setScheduledSlot(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* SECCIÓN 2: Equipo de Terreno & % de Mano de Obra */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                Equipo de Terreno & Pago por Mano de Obra
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Control de comisiones
              </span>
            </div>

            {/* Técnico Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Técnico Principal
                </label>
                <select
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Modalidad Pago
                </label>
                <select
                  value={techPayoutType}
                  onChange={(e) => setTechPayoutType(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="fixed">Monto Fijo ($)</option>
                  <option value="percentage">Porcentaje (%)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  {techPayoutType === 'percentage' ? '% Mano de Obra' : 'Monto ($)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={techPayoutValue}
                    onChange={(e) => setTechPayoutValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    {techPayoutType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ayudante */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center pt-2 border-t border-slate-200/80">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Ayudante (Opcional)
                </label>
                <select
                  value={assistantId}
                  onChange={(e) => setAssistantId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Sin ayudante</option>
                  {technicians.filter(t => t.id !== technicianId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Modalidad Pago
                </label>
                <select
                  disabled={!assistantId}
                  value={assistantPayoutType}
                  onChange={(e) => setAssistantPayoutType(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="fixed">Monto Fijo ($)</option>
                  <option value="percentage">Porcentaje (%)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  {assistantPayoutType === 'percentage' ? '% Mano de Obra' : 'Monto ($)'}
                </label>
                <div className="relative">
                  <input
                    disabled={!assistantId}
                    type="number"
                    value={assistantPayoutValue}
                    onChange={(e) => setAssistantPayoutValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold focus:border-cyan-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    {assistantPayoutType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen Payout */}
            <div className="p-2.5 rounded-lg bg-cyan-50/80 border border-cyan-200 text-xs flex flex-wrap items-center justify-between gap-2 text-cyan-950 font-medium">
              <span>Pago Técnico: <strong>${calculatedTechPayout.toLocaleString('es-CL')}</strong></span>
              {assistantId && (
                <span>Pago Ayudante: <strong>${calculatedAssistantPayout.toLocaleString('es-CL')}</strong></span>
              )}
              <span className="font-bold text-blue-900">
                Total Mano de Obra: ${(calculatedTechPayout + calculatedAssistantPayout).toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {/* Diagnosis & Resolution */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Diagnóstico Técnico</label>
            <textarea
              rows={2}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Estado inicial del equipo al llegar al sitio..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Trabajo Realizado / Resolución</label>
            <textarea
              rows={2}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Detalle de mantención, piezas cambiadas o metros de cañería instalados..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Total */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Total Facturado ({settings?.currency_symbol || '₡'} {settings?.currency_code || 'CRC'})</label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(parseInt(e.target.value) || 0)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Orden</span>
            </button>

            <div className="flex items-center gap-2">
              {onOpenReceipt && (
                <button
                  type="button"
                  onClick={() => onOpenReceipt(order)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold transition-all cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Ver Comprobante</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
