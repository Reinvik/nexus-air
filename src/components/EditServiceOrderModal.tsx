import React, { useState, useEffect } from 'react';
import { ServiceOrder, Technician, OrderStatus, ServiceType, AirSettings } from '../types';
import { X, Save, Trash2, Calendar, Clock, Wrench, DollarSign, CheckCircle, Navigation, Radio, MapPin, Users, Percent, Check, FileText } from 'lucide-react';
import { calculateLiveRouteETA, getCustomerCoordinates, RouteETA } from '../lib/routingService';

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
  const [routeEta, setRouteEta] = useState<RouteETA | null>(null);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setTechnicianId(order.assigned_technician_id || '');
      setAssistantId(order.assigned_assistant_id || '');
      setTechPayoutType(order.technician_payout_type || 'fixed');
      setTechPayoutValue(order.technician_payout_value ?? 20000);
      setAssistantPayoutType(order.assistant_payout_type || 'fixed');
      setAssistantPayoutValue(order.assistant_payout_value ?? 10000);
      setScheduledDate(order.scheduled_date);
      setScheduledSlot(order.scheduled_time_slot);
      setDescription(order.description);
      setDiagnosis(order.diagnosis || '');
      setResolution(order.resolution || '');
      setPaymentStatus(order.payment_status);
      setTotal(order.total);
      setIsTrackingGps(order.status === 'en_ruta' && !!order.technician_location?.is_active);
      setLastCoords(order.technician_location ? { lat: order.technician_location.lat, lng: order.technician_location.lng } : null);
    }
  }, [order?.id]);

  // Cálculo Dinámico de Ruta OSRM hacia el Cliente
  useEffect(() => {
    if (!lastCoords) return;
    const dest = getCustomerCoordinates(
      order.customer?.commune,
      order.customer?.city,
      order.customer?.address
    );
    calculateLiveRouteETA(
      lastCoords,
      dest,
      order.customer?.commune || 'Cliente'
    ).then((res) => {
      setRouteEta(res);
    }).catch((err) => {
      console.warn('Error calculando ETA en modal:', err);
    });
  }, [lastCoords?.lat, lastCoords?.lng, order.customer?.commune, order.customer?.address]);

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
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
      setGeoWatchId(watchId);
    }
  };

  const handleArrived = () => {
    setStatus('en_proceso');
    setIsTrackingGps(false);
    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId);
      setGeoWatchId(null);
    }
    if (order.technician_location) {
      onUpdateOrder(order.id, {
        status: 'en_proceso',
        technician_location: {
          ...order.technician_location,
          is_active: false,
          updated_at: new Date().toISOString(),
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taxRate = settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19;
    const subtotal = Math.round(total / (1 + taxRate));
    const tax = total - subtotal;

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
      subtotal,
      tax,
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
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-900 cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-50/95 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Editar Orden Técnica
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                  {order.ticket_number}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {order.customer?.name} • {order.customer?.commune} • {order.customer?.phone}
                {order.equipment && (
                  <span className="ml-2 font-medium text-cyan-700">
                    ({order.equipment.brand} {order.equipment.btu} BTU - {order.equipment.location_in_property})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* COLUMNA IZQUIERDA: Estados, Agendamiento, Cuadrilla y GPS */}
              <div className="lg:col-span-6 space-y-4">
                {/* Status & Payment Status */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Estado de la Orden</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as OrderStatus)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
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
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                      >
                        <option value="pendiente">Pendiente de Pago</option>
                        <option value="abono">Abono Inicial Recibido</option>
                        <option value="pagado">Pagado Total</option>
                      </select>
                    </div>
                  </div>

                  {/* Fecha y Bloque Horario */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        Fecha Programada
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        Bloque Horario
                      </label>
                      <input
                        type="text"
                        value={scheduledSlot}
                        onChange={(e) => setScheduledSlot(e.target.value)}
                        placeholder="Ej: 09:00 - 11:00"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Equipo de Terreno & Pago por Mano de Obra */}
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
                        Modalidad
                      </label>
                      <select
                        value={techPayoutType}
                        onChange={(e) => setTechPayoutType(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="fixed">Monto Fijo ({settings?.currency_symbol || '$'})</option>
                        <option value="percentage">Porcentaje (%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {techPayoutType === 'percentage' ? '% Mano de Obra' : `Monto (${settings?.currency_symbol || '$'})`}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={techPayoutValue}
                          onChange={(e) => setTechPayoutValue(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold focus:border-cyan-500 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                          {techPayoutType === 'percentage' ? '%' : (settings?.currency_symbol || '$')}
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
                        Modalidad
                      </label>
                      <select
                        disabled={!assistantId}
                        value={assistantPayoutType}
                        onChange={(e) => setAssistantPayoutType(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="fixed">Monto Fijo ({settings?.currency_symbol || '$'})</option>
                        <option value="percentage">Porcentaje (%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {assistantPayoutType === 'percentage' ? '% Mano de Obra' : `Monto (${settings?.currency_symbol || '$'})`}
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
                          {assistantPayoutType === 'percentage' ? '%' : (settings?.currency_symbol || '$')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Payout */}
                  <div className="p-2.5 rounded-lg bg-cyan-50/80 border border-cyan-200 text-xs flex flex-wrap items-center justify-between gap-2 text-cyan-950 font-medium">
                    <span>Pago Técnico: <strong>{settings?.currency_symbol || '$'} {calculatedTechPayout.toLocaleString()}</strong></span>
                    {assistantId && (
                      <span>Pago Ayudante: <strong>{settings?.currency_symbol || '$'} {calculatedAssistantPayout.toLocaleString()}</strong></span>
                    )}
                    <span className="font-bold text-blue-900">
                      Total Mano de Obra: {settings?.currency_symbol || '$'} {(calculatedTechPayout + calculatedAssistantPayout).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* GPS & Despacho */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-blue-950 text-white border border-blue-900/40 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isTrackingGps ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                      <span className="font-bold text-xs tracking-wide flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-[#00d2ff]" />
                        Despacho & Trayecto en Vivo (GPS)
                      </span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isTrackingGps 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isTrackingGps ? 'Transmitiendo GPS' : 'GPS Inactivo'}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!isTrackingGps ? (
                        <button
                          type="button"
                          onClick={handleStartTrip}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:brightness-110 transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Iniciar Trayecto (GPS)</span>
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleArrived}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>¡Llegué a Terreno!</span>
                          </button>
                          {lastCoords && (
                            <span className="text-[10px] text-cyan-300 font-mono">
                              📍 {lastCoords.lat.toFixed(4)}, {lastCoords.lng.toFixed(4)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ETA Dinámico en Vivo */}
                    {lastCoords && (
                      <div className="w-full pt-2 border-t border-blue-900/60 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-300">
                          Ruta hacia <strong className="text-white">{order.customer?.commune || order.customer?.address || 'Destino'}</strong>:
                        </span>
                        <div className="flex items-center gap-2">
                          {routeEta ? (
                            <>
                              <span className="text-cyan-300 font-medium">
                                📏 {routeEta.distanceFormatted}
                              </span>
                              <span className="bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40 text-emerald-300 font-bold">
                                ⏱️ {routeEta.durationFormatted}
                              </span>
                            </>
                          ) : (
                            <span className="text-cyan-400 animate-pulse text-[10px]">Calculando ruta real...</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Facturación, Descripción, Diagnóstico y Resolución */}
              <div className="lg:col-span-6 space-y-4">
                {/* Facturación y Total Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Total Facturado de la Orden
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-600 uppercase">
                      {settings?.country || 'Chile'} • {settings?.currency_code || 'CLP'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        {settings?.currency_symbol || '$'}
                      </span>
                      <input
                        type="number"
                        value={total}
                        onChange={(e) => setTotal(parseInt(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-black text-lg focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {onOpenReceipt && (
                      <button
                        type="button"
                        onClick={() => onOpenReceipt(order)}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-all cursor-pointer shrink-0 shadow-xs"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Comprobante</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Descripción General */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Descripción del Trabajo / Solicitud</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del requerimiento inicial del cliente..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Diagnóstico Técnico */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Diagnóstico Técnico en Terreno</label>
                  <textarea
                    rows={3}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Estado inicial del equipo al llegar al sitio, anomalías detectadas, presiones o ruidos..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Trabajo Realizado / Resolución */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Trabajo Realizado / Resolución Técnica</label>
                  <textarea
                    rows={3}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Detalle de mantención, piezas cambiadas, recarga de refrigerante, pruebas térmicas..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Orden</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Cancelar y cerrar modal (Esc)"
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
