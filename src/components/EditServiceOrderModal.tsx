import React, { useState, useEffect } from 'react';
import { ServiceOrder, Technician, OrderStatus, ServiceType, AirSettings, Customer, AirEquipment } from '../types';
import { 
  X, 
  Save, 
  Trash2, 
  Calendar, 
  Clock, 
  Wrench, 
  DollarSign, 
  CheckCircle, 
  Navigation, 
  MapPin, 
  Users, 
  Check, 
  FileText, 
  User, 
  UserPlus, 
  Phone, 
  Thermometer, 
  Gauge, 
  Camera, 
  Eye, 
  Layers, 
  ShieldCheck,
  CreditCard,
  Hash,
  Sparkles,
  Info
} from 'lucide-react';
import { calculateLiveRouteETA, getCustomerCoordinates, RouteETA } from '../lib/routingService';
import { QuickCreateCustomerModal } from './QuickCreateCustomerModal';
import { WhatsAppIcon, getWhatsAppUrl } from './KanbanCardAir';
import { toast } from 'react-hot-toast';

interface EditServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  technicians: Technician[];
  customers?: Customer[];
  equipments?: AirEquipment[];
  settings?: AirSettings;
  onUpdateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  onDeleteOrder: (id: string) => void;
  onOpenReceipt?: (order: ServiceOrder) => void;
  onOpenInspection?: (order: ServiceOrder) => void;
  onAddCustomer?: (customer: Omit<Customer, 'id' | 'created_at'>) => Promise<Customer | void> | void;
  onAddEquipment?: (equipment: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => Promise<AirEquipment | void> | void;
}

export const EditServiceOrderModal: React.FC<EditServiceOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  technicians,
  customers,
  equipments,
  settings,
  onUpdateOrder,
  onDeleteOrder,
  onOpenReceipt,
  onOpenInspection,
  onAddCustomer,
  onAddEquipment,
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

  // Tab View Mode
  const [activeTab, setActiveTab] = useState<'general' | 'crew' | 'billing' | 'tech_report' | 'all'>('general');

  // Core Order State
  const [serviceType, setServiceType] = useState<ServiceType>(order?.service_type || 'mantencion_preventiva');
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'ingresado');
  const [customerId, setCustomerId] = useState(order?.customer_id || '');
  const [equipmentId, setEquipmentId] = useState(order?.equipment_id || '');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // Technician & Crew
  const [technicianId, setTechnicianId] = useState(order?.assigned_technician_id || '');
  const [assistantId, setAssistantId] = useState(order?.assigned_assistant_id || '');
  const [techPayoutType, setTechPayoutType] = useState<'fixed' | 'percentage'>(order?.technician_payout_type || 'fixed');
  const [techPayoutValue, setTechPayoutValue] = useState<number>(order?.technician_payout_value ?? 20000);
  const [assistantPayoutType, setAssistantPayoutType] = useState<'fixed' | 'percentage'>(order?.assistant_payout_type || 'fixed');
  const [assistantPayoutValue, setAssistantPayoutValue] = useState<number>(order?.assistant_payout_value ?? 10000);

  // Scheduling
  const [scheduledDate, setScheduledDate] = useState(order?.scheduled_date || '');
  const [scheduledSlot, setScheduledSlot] = useState(order?.scheduled_time_slot || '');

  // Technical Text Notes
  const [description, setDescription] = useState(order?.description || '');
  const [diagnosis, setDiagnosis] = useState(order?.diagnosis || '');
  const [resolution, setResolution] = useState(order?.resolution || '');

  // Billing & Payment
  const [total, setTotal] = useState(order?.total || 0);
  const [applyTax, setApplyTax] = useState<boolean>(order?.apply_tax ?? true);
  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'pagado' | 'abono'>(order?.payment_status || 'pendiente');
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo' | 'tarjeta' | 'webpay'>(order?.payment_method || 'transferencia');
  const [paymentReference, setPaymentReference] = useState(order?.payment_reference || '');
  const [paidAmount, setPaidAmount] = useState<number>(order?.paid_amount ?? (order?.payment_status === 'pagado' ? order?.total || 0 : 0));
  const [paymentNotes, setPaymentNotes] = useState(order?.payment_notes || '');

  // GPS Live Tracking State
  const [isTrackingGps, setIsTrackingGps] = useState(order?.status === 'en_ruta' && !!order?.technician_location?.is_active);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(
    order?.technician_location ? { lat: order.technician_location.lat, lng: order.technician_location.lng } : null
  );
  const [geoWatchId, setGeoWatchId] = useState<number | null>(null);
  const [routeEta, setRouteEta] = useState<RouteETA | null>(null);

  useEffect(() => {
    if (order) {
      setServiceType(order.service_type || 'mantencion_preventiva');
      setCustomerId(order.customer_id || '');
      setEquipmentId(order.equipment_id || '');
      setStatus(order.status);
      setTechnicianId(order.assigned_technician_id || '');
      setAssistantId(order.assigned_assistant_id || '');
      setTechPayoutType(order.technician_payout_type || 'fixed');
      setTechPayoutValue(order.technician_payout_value ?? 20000);
      setAssistantPayoutType(order.assistant_payout_type || 'fixed');
      setAssistantPayoutValue(order.assistant_payout_value ?? 10000);
      setScheduledDate(order.scheduled_date || '');
      setScheduledSlot(order.scheduled_time_slot || '');
      setDescription(order.description || '');
      setDiagnosis(order.diagnosis || '');
      setResolution(order.resolution || '');
      setTotal(order.total || 0);
      setApplyTax(order.apply_tax ?? true);
      setPaymentStatus(order.payment_status || 'pendiente');
      setPaymentMethod(order.payment_method || 'transferencia');
      setPaymentReference(order.payment_reference || '');
      setPaidAmount(order.paid_amount ?? (order.payment_status === 'pagado' ? order.total || 0 : 0));
      setPaymentNotes(order.payment_notes || '');
      setIsTrackingGps(order.status === 'en_ruta' && !!order.technician_location?.is_active);
      setLastCoords(order.technician_location ? { lat: order.technician_location.lat, lng: order.technician_location.lng } : null);
    }
  }, [order?.id]);

  // Dynamic Route calculation
  useEffect(() => {
    if (!lastCoords || !order) return;
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
  }, [lastCoords?.lat, lastCoords?.lng, order?.customer?.commune, order?.customer?.address]);

  if (!isOpen || !order) return null;

  // Selected customer & equipment
  const selectedCustomer = customers?.find(c => c.id === customerId) || order.customer;
  const availableEquipments = equipments?.filter(e => e.customer_id === customerId) || [];
  const selectedEquipment = availableEquipments.find(e => e.id === equipmentId) || (order.equipment_id === equipmentId ? order.equipment : undefined);

  // Financial calculations
  const taxRate = settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19;
  const subtotal = applyTax ? Math.round(total / (1 + taxRate)) : total;
  const tax = applyTax ? (total - subtotal) : 0;

  const calculatedTechPayout = techPayoutType === 'percentage' 
    ? Math.round((total * techPayoutValue) / 100) 
    : techPayoutValue;
  const calculatedAssistantPayout = assistantId 
    ? (assistantPayoutType === 'percentage' 
        ? Math.round((total * assistantPayoutValue) / 100) 
        : assistantPayoutValue)
    : 0;

  // Direct WhatsApp & Phone
  const customerPhone = selectedCustomer?.phone || order.customer?.phone || order.customer_phone;
  const customerName = selectedCustomer?.name || order.customer?.name || order.customer_name || 'Cliente';
  const whatsappUrl = getWhatsAppUrl(customerPhone, customerName, order.ticket_number);

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

    onUpdateOrder(order.id, {
      customer_id: customerId,
      equipment_id: equipmentId || undefined,
      service_type: serviceType,
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
      apply_tax: applyTax,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      paid_amount: paidAmount,
      payment_notes: paymentNotes,
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
        {/* Header Principal con Acciones Rápidas */}
        <div className="px-5 py-3 bg-slate-50/95 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  Editar Orden de Servicio
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                    {order.ticket_number}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {customerName} • {selectedCustomer?.commune || 'Sin comuna'} • {selectedCustomer?.address || 'Sin dirección'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón WhatsApp Directo en Cabecera */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Hablar por WhatsApp con ${customerName} (${customerPhone})`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-transform active:scale-95 shadow-xs cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Botón Llamar Directo */}
            {customerPhone && (
              <a
                href={`tel:${customerPhone.replace(/\s+/g, '')}`}
                title={`Llamar a ${customerPhone}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Llamar</span>
              </a>
            )}

            {/* Recibo Rápido */}
            {onOpenReceipt && (
              <button
                type="button"
                onClick={() => onOpenReceipt(order)}
                title="Ver comprobante oficial"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Recibo</span>
              </button>
            )}

            {/* Cerrar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Cerrar modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Navegación por Pestañas */}
        <div className="px-5 py-2 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-white text-cyan-800 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>1. General & Climatización</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('crew')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'crew'
                  ? 'bg-white text-cyan-800 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Cuadrilla & GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-white text-cyan-800 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Facturación & Cobro</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tech_report')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tech_report'
                  ? 'bg-white text-cyan-800 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>4. Diagnóstico & Ficha HVAC</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'all' ? 'general' : 'all')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{activeTab === 'all' ? 'Ver por Pestañas' : 'Ver Todo'}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* PESTAÑA 1: General & Climatización */}
            {(activeTab === 'general' || activeTab === 'all') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <h4 className="font-bold text-sm text-slate-800">Datos Generales, Cliente & Equipo HVAC</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Tarjeta de Cliente */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-cyan-600" />
                        Cliente Asociado
                      </label>
                      {onAddCustomer && (
                        <button
                          type="button"
                          onClick={() => setIsAddCustomerModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[11px] transition-colors cursor-pointer border border-cyan-200 shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
                          <span>+ Nuevo Cliente</span>
                        </button>
                      )}
                    </div>

                    {customers && customers.length > 0 ? (
                      <select
                        value={customerId}
                        onChange={(e) => {
                          setCustomerId(e.target.value);
                          setEquipmentId('');
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-cyan-500 focus:outline-none transition-colors"
                      >
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.commune || 'Sin comuna'}) - {c.address}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-slate-500 text-xs italic">Cargando lista de clientes...</p>
                    )}

                    {/* Ficha Resumen del Cliente */}
                    {selectedCustomer && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{selectedCustomer.name}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{selectedCustomer.rut || 'Sin RUT'}</span>
                        </div>
                        <div className="text-slate-600">
                          📍 {selectedCustomer.address}, {selectedCustomer.commune}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500">📞 {selectedCustomer.phone || 'Sin fono'}</span>
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <WhatsAppIcon className="w-3 h-3" />
                              <span>Abrir WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tarjeta de Equipo HVAC */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        Equipo de Aire Acondicionado
                      </label>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {availableEquipments.length} equipo(s) del cliente
                      </span>
                    </div>

                    <select
                      value={equipmentId}
                      onChange={(e) => setEquipmentId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                    >
                      <option value="">Sin equipo registrado (Asignación libre)</option>
                      {availableEquipments.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.brand} {eq.btu.toLocaleString()} BTU - {eq.location_in_property} ({eq.technology?.toUpperCase()})
                        </option>
                      ))}
                    </select>

                    {/* Especificaciones Completas del Equipo */}
                    {selectedEquipment ? (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-cyan-900">
                          <span className="text-xs">❄️ {selectedEquipment.brand} {selectedEquipment.btu.toLocaleString()} BTU</span>
                          <span className="uppercase text-[9.5px] px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 font-mono font-bold">
                            {selectedEquipment.technology || 'Inverter'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400">Tipo:</span> <strong className="text-slate-700">{selectedEquipment.type}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Refrigerante:</span> <strong className="text-slate-700">{selectedEquipment.refrigerant || 'R410A'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Ubicación:</span> <strong className="text-slate-700">{selectedEquipment.location_in_property}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Modelo:</span> <strong className="text-slate-700">{selectedEquipment.model || 'N/A'}</strong>
                          </div>
                        </div>
                        {(selectedEquipment.serial_number_evaporator || selectedEquipment.serial_number_condenser) && (
                          <div className="pt-1 border-t border-slate-100 font-mono text-[10px] text-slate-600 space-y-0.5">
                            {selectedEquipment.serial_number_evaporator && (
                              <div>Serial Evaporador (Int): <strong className="text-slate-800">{selectedEquipment.serial_number_evaporator}</strong></div>
                            )}
                            {selectedEquipment.serial_number_condenser && (
                              <div>Serial Condensador (Ext): <strong className="text-slate-800">{selectedEquipment.serial_number_condenser}</strong></div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-white/70 border border-dashed border-slate-200 text-slate-500 text-center text-[11px]">
                        Asignación abierta. Los datos del equipo pueden registrarse en terreno o en la Ficha HVAC.
                      </div>
                    )}
                  </div>
                </div>

                {/* Tipo de Servicio, Estado de la Orden y Agendamiento */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 text-xs">Tipo de Servicio</label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value as ServiceType)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="mantencion_preventiva">Mantención Preventiva (6M)</option>
                        <option value="instalacion">Instalación Nueva</option>
                        <option value="mantencion_correctiva">Reparación / Fuga</option>
                        <option value="reparacion">Reparación General</option>
                        <option value="visita_tecnica">Visita Técnica / Diagnóstico</option>
                        <option value="recarga_gas">Recarga Gas Refrigerante</option>
                        <option value="pruebas_qa">Pruebas QA & Medición</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 text-xs">Estado de la Orden</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as OrderStatus)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="ingresado">Ingresado / Solicitud</option>
                        <option value="en_ruta">En Ruta (Despachado)</option>
                        <option value="en_proceso">En Proceso / Terreno</option>
                        <option value="pruebas_qa">Pruebas QA & Medición</option>
                        <option value="completado">Completado / Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        Fecha Programada
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        Bloque Horario
                      </label>
                      <input
                        type="text"
                        value={scheduledSlot}
                        onChange={(e) => setScheduledSlot(e.target.value)}
                        placeholder="Ej: 09:30 - 11:30"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: Cuadrilla & GPS */}
            {(activeTab === 'crew' || activeTab === 'all') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-800">Cuadrilla de Terreno & Seguimiento GPS</h4>
                </div>

                {/* Equipo de Terreno & Pago por Mano de Obra */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Users className="w-3.5 h-3.5 text-cyan-600" />
                      Asignación de Personal Técnico & Liquidación
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Cálculo de comisiones de servicio
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
                        Ayudante Técnico (Opcional)
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
                          Ruta hacia <strong className="text-white">{selectedCustomer?.commune || selectedCustomer?.address || 'Destino'}</strong>:
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
            )}

            {/* PESTAÑA 3: Cobro, Pagos & Facturación */}
            {(activeTab === 'billing' || activeTab === 'all') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-800">Facturación, Cobro & Pagos</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Total y Desglose de Impuestos */}
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
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-black text-lg focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>

                      {onOpenReceipt && (
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(order)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-all cursor-pointer shrink-0 shadow-xs"
                        >
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span>Comprobante</span>
                        </button>
                      )}
                    </div>

                    {/* Toggle Aplica IVA y Desglose */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={applyTax}
                            onChange={(e) => setApplyTax(e.target.checked)}
                            className="rounded text-cyan-600 focus:ring-cyan-500"
                          />
                          <span>Aplica IVA ({Math.round(taxRate * 100)}%)</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {applyTax ? 'Factura con IVA' : 'Boleta Exenta'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 font-mono text-[11px] text-slate-600">
                        <div>Subtotal Neto: <strong>{settings?.currency_symbol || '$'} {subtotal.toLocaleString()}</strong></div>
                        <div>IVA ({Math.round(taxRate * 100)}%): <strong>{settings?.currency_symbol || '$'} {tax.toLocaleString()}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Estado de Pago, Método y Referencia */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <CreditCard className="w-4 h-4 text-cyan-600" />
                      Detalle del Cobro & Pago
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Estado de Pago</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value as any)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="pendiente">Pendiente de Pago</option>
                          <option value="abono">Abono Inicial</option>
                          <option value="pagado">Pagado Total</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Método de Pago</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="transferencia">Transferencia Bancaria</option>
                          <option value="efectivo">Efectivo en Terreno</option>
                          <option value="tarjeta">Tarjeta Débito / Crédito</option>
                          <option value="webpay">Webpay / Enlace Online</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 text-[11px] flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          N° Comprobante / Referencia
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Ej: Transf. 984128"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Monto Pagado / Abonado</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs font-bold focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-bold">
                            {settings?.currency_symbol || '$'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="font-semibold text-slate-700 text-[11px]">Notas de Cobro / Observaciones de Pago</label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Ej: Pagado 50% al iniciar y saldo al recibir el comprobante..."
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: Diagnóstico & Ficha HVAC */}
            {(activeTab === 'tech_report' || activeTab === 'all') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-sm text-slate-800">Informe Técnico, Diagnóstico & Mediciones HVAC</h4>
                  </div>
                  {onOpenInspection && (
                    <button
                      type="button"
                      onClick={() => onOpenInspection(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>Abrir Ficha de Inspección Completa</span>
                    </button>
                  )}
                </div>

                {/* Resumen de Mediciones Técnicas */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                    Mediciones de Control Térmico y Eléctrico (Checklist QA)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Delta T (°C)</span>
                      <strong className="text-cyan-800 text-xs font-mono">
                        {order.checklist?.delta_t_celsius ? `${order.checklist.delta_t_celsius}°C` : 'S/Medir'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Baja PSI</span>
                      <strong className="text-slate-800 text-xs font-mono">
                        {order.checklist?.suction_pressure_psi || order.checklist?.psi_low_final ? `${order.checklist.suction_pressure_psi || order.checklist.psi_low_final} PSI` : 'S/Medir'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Alta PSI</span>
                      <strong className="text-slate-800 text-xs font-mono">
                        {order.checklist?.discharge_pressure_psi || order.checklist?.psi_high_final ? `${order.checklist.discharge_pressure_psi || order.checklist.psi_high_final} PSI` : 'S/Medir'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Amperaje</span>
                      <strong className="text-slate-800 text-xs font-mono">
                        {order.checklist?.amperage_amps || order.checklist?.amp_final ? `${order.checklist.amperage_amps || order.checklist.amp_final} A` : 'S/Medir'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Voltaje</span>
                      <strong className="text-slate-800 text-xs font-mono">
                        {order.checklist?.voltage_final || order.checklist?.voltage_initial ? `${order.checklist.voltage_final || order.checklist.voltage_initial} V` : 'S/Medir'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Textareas de Descripción, Diagnóstico y Resolución */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-xs">Descripción Inicial / Solicitud del Cliente</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción del requerimiento inicial del cliente..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-xs">Diagnóstico Técnico en Terreno</label>
                    <textarea
                      rows={2}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Estado inicial del equipo al llegar al sitio, anomalías detectadas, ruidos, presiones..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-xs">Trabajo Realizado / Resolución Técnica</label>
                    <textarea
                      rows={2}
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Detalle de mantención ejecutada, piezas cambiadas, recarga de refrigerante, pruebas térmicas..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors cursor-pointer text-xs font-semibold"
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
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-semibold"
                title="Cancelar y cerrar modal (Esc)"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Submodal para Crear Cliente Directo */}
      {isAddCustomerModalOpen && onAddCustomer && (
        <QuickCreateCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          settings={settings}
          onAddCustomer={onAddCustomer}
          onAddEquipment={onAddEquipment}
          onCustomerCreated={(newCust, newEq) => {
            setCustomerId(newCust.id);
            if (newEq) {
              setEquipmentId(newEq.id);
            }
            toast.success(`Cliente ${newCust.name} asignado a la orden`);
          }}
        />
      )}
    </div>
  );
};

