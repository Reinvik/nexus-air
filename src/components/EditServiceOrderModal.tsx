import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ServiceOrder, 
  Technician, 
  TechnicianPayout,
  OrderStatus, 
  ServiceType, 
  AirSettings, 
  Customer, 
  AirEquipment,
  CALENDAR_COLOR_OPTIONS,
  SERVICE_TYPE_DEFAULT_COLORS,
  getOrderCalendarColor,
  formatServiceType
} from '../types';
import { format } from 'date-fns';
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
  Info,
  Palette,
  CheckSquare,
  Square
} from 'lucide-react';
import { calculateLiveRouteETA, getCustomerCoordinates, RouteETA } from '../lib/routingService';
import { QuickCreateCustomerModal } from './QuickCreateCustomerModal';
import { WhatsAppIcon, getWhatsAppUrl } from './KanbanCardAir';
import { toast } from 'react-hot-toast';
import { TimeSlotPicker } from './TimeSlotPicker';

interface EditServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  technicians: Technician[];
  customers?: Customer[];
  equipments?: AirEquipment[];
  settings?: AirSettings;
  currentUserProfile?: any;
  technicianPayouts?: TechnicianPayout[];
  onAddTechnicianPayout?: (data: Omit<TechnicianPayout, 'id' | 'company_id' | 'created_at'>) => Promise<void> | void;
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
  currentUserProfile,
  technicianPayouts = [],
  onAddTechnicianPayout,
  onUpdateOrder,
  onDeleteOrder,
  onOpenReceipt,
  onOpenInspection,
  onAddCustomer,
  onAddEquipment,
}) => {
  // NK-047: Ocultar montos a cobrar a los técnicos
  const isTechnician = currentUserProfile?.role === 'tecnico' || currentUserProfile?.role === 'ayudante' || currentUserProfile?.role === 'technician';
  const hideFinancialDetails = isTechnician && (settings?.hide_technician_amounts !== false);
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
  const [calendarColor, setCalendarColor] = useState<string>(() => 
    order ? getOrderCalendarColor(order, settings?.service_type_colors) : '#0284c7'
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'ingresado');
  const [customerId, setCustomerId] = useState(order?.customer_id || '');
  const [equipmentId, setEquipmentId] = useState(order?.equipment_id || '');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(() => {
    if (order?.equipment_ids && order.equipment_ids.length > 0) return order.equipment_ids;
    if (order?.equipment_id) return [order.equipment_id];
    return [];
  });
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // NK-046 & NK-062: Solo técnicos líderes pueden ser asignados como técnico principal
  const availableTechnicians = useMemo(() => 
    technicians.filter(t => t.role === 'tecnico' || (!t.role && t.role !== 'ayudante') || t.id === order?.assigned_technician_id), 
    [technicians, order?.assigned_technician_id]
  );

  // Technician & Crew
  const [technicianId, setTechnicianId] = useState(order?.assigned_technician_id || '');
  const [assistantId, setAssistantId] = useState(order?.assigned_assistant_id || '');

  const availableAssistants = useMemo(() => 
    technicians.filter(t => (t.role === 'ayudante' || t.id === order?.assigned_assistant_id) && t.id !== technicianId), 
    [technicians, order?.assigned_assistant_id, technicianId]
  );

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

  // Billing & Payment (NK-050 & NK-051)
  // NK-077: Precio unitario y cálculo automático por equipo
  const getServiceBaseUnitPrice = useCallback((type: ServiceType) => {
    if (type === 'mantencion_preventiva' || (type as any) === 'mantenimiento_preventivo') {
      return settings?.standard_maintenance_price || 45000;
    }
    if (type === 'instalacion') return 130000;
    if (type === 'visita_tecnica') return 30000;
    if (type === 'recarga_gas') return 65000;
    return 45000;
  }, [settings?.standard_maintenance_price]);

  const [unitPrice, setUnitPrice] = useState<number>(() => {
    const eqCount = Math.max(1, (order?.equipment_ids && order.equipment_ids.length > 0) ? order.equipment_ids.length : 1);
    const totalAmt = order?.tax_mode === 'plus' ? (order?.subtotal || 0) : (order?.total || 0);
    return totalAmt > 0 ? Math.round(totalAmt / eqCount) : getServiceBaseUnitPrice(order?.service_type || 'mantencion_preventiva');
  });

  const [applyTax, setApplyTax] = useState<boolean>(order?.apply_tax ?? true);
  const [taxMode, setTaxMode] = useState<'included' | 'plus'>(() => 
    order?.tax_mode === 'plus' ? 'plus' : 'included'
  );
  const [baseAmount, setBaseAmount] = useState<number>(() => {
    if (!order) return 0;
    if (order.tax_mode === 'plus') return order.subtotal || 0;
    return order.total || 0;
  });
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
      setCalendarColor(getOrderCalendarColor(order, settings?.service_type_colors));
      setCustomerId(order.customer_id || '');
      setEquipmentId(order.equipment_id || '');
      const initEqIds = (order.equipment_ids && order.equipment_ids.length > 0) 
        ? order.equipment_ids 
        : (order.equipment_id ? [order.equipment_id] : []);
      setSelectedEquipmentIds(initEqIds);
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
      setApplyTax(order.apply_tax ?? true);
      setTaxMode(order.tax_mode === 'plus' ? 'plus' : 'included');
      const totalAmt = order.tax_mode === 'plus' ? (order.subtotal || 0) : (order.total || 0);
      setBaseAmount(totalAmt);
      const eqCount = Math.max(1, initEqIds.length);
      setUnitPrice(totalAmt > 0 ? Math.round(totalAmt / eqCount) : getServiceBaseUnitPrice(order.service_type || 'mantencion_preventiva'));
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

  // Financial calculations (NK-050)
  const taxRate = settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.13;
  const taxRatePercent = Math.round(taxRate * 100);

  const calculatedFinancials = useMemo(() => {
    const amt = baseAmount || 0;
    if (!applyTax) {
      return {
        subtotal: amt,
        tax: 0,
        total: amt
      };
    }
    if (taxMode === 'plus') {
      const subtotal = amt;
      const tax = Math.round(amt * taxRate);
      const total = subtotal + tax;
      return { subtotal, tax, total };
    } else {
      // taxMode === 'included'
      const total = amt;
      const subtotal = Math.round(total / (1 + taxRate));
      const tax = total - subtotal;
      return { subtotal, tax, total };
    }
  }, [baseAmount, applyTax, taxMode, taxRate]);

  const subtotal = calculatedFinancials.subtotal;
  const tax = calculatedFinancials.tax;
  const total = calculatedFinancials.total;

  const calculatedTechPayout = techPayoutType === 'percentage' 
    ? Math.round((total * techPayoutValue) / 100) 
    : techPayoutValue;
  const calculatedAssistantPayout = assistantId 
    ? (assistantPayoutType === 'percentage' 
        ? Math.round((total * assistantPayoutValue) / 100) 
        : assistantPayoutValue)
    : 0;

  const isOrderTechPaid = Boolean(order?.id && (technicianPayouts || []).some(p => (p.order_ids || []).includes(order.id)));

  const handleQuickPayTechnician = async () => {
    if (!order || !technicianId || !onAddTechnicianPayout) return;
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return;

    if (calculatedTechPayout <= 0) {
      toast.error('El monto de honorario para este técnico es 0');
      return;
    }

    try {
      await onAddTechnicianPayout({
        technician_id: tech.id,
        technician_name: tech.name,
        technician_role: tech.role || 'tecnico',
        salary_mode: tech.salary_mode || 'commission',
        payout_type: 'parcial',
        base_salary: 0,
        commission_amount: calculatedTechPayout,
        bonus_amount: 0,
        deduction_amount: 0,
        working_days: 30,
        period_month: format(new Date(), 'yyyy-MM'),
        amount: calculatedTechPayout,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'transferencia',
        payment_reference: `Orden ${order.ticket_number}`,
        notes: `Liquidación directa de honorario desde orden ${order.ticket_number}.`,
        order_ids: [order.id]
      });
      toast.success(`Honorario de ${settings?.currency_symbol || '$'} ${calculatedTechPayout.toLocaleString()} liquidado a ${tech.name}`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar el pago al técnico');
    }
  };

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

    const chosenEquipments = availableEquipments.filter(e => selectedEquipmentIds.includes(e.id));
    const summary = chosenEquipments.length > 0
      ? `${chosenEquipments.length} equipo(s): ${chosenEquipments.map(e => `${e.brand} ${e.btu ? `${e.btu} BTU` : ''} (${e.location_in_property || 'Ubicación n/d'})`.trim()).join(', ')}`
      : undefined;

    const eqCount = Math.max(1, selectedEquipmentIds.length);
    const itemUnitPrice = total > 0 ? Math.round(total / eqCount) : unitPrice;

    onUpdateOrder(order.id, {
      customer_id: customerId,
      equipment_id: selectedEquipmentIds[0] || undefined,
      equipment_ids: selectedEquipmentIds,
      equipments_summary: summary,
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
      tax_mode: applyTax ? taxMode : 'exempt',
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      paid_amount: paidAmount,
      payment_notes: paymentNotes,
      calendar_color: calendarColor,
      items: [
        {
          id: order.items?.[0]?.id || `it-${Date.now()}`,
          description: `Servicio de ${serviceType.replace('_', ' ')} (${eqCount} ${eqCount === 1 ? 'aire / equipo' : 'aires / equipos'})`,
          quantity: eqCount,
          unit_price: itemUnitPrice,
          total: total,
          type: 'servicio',
        }
      ],
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

            {/* Recibo Rápido (Oculto para personal técnico) */}
            {onOpenReceipt && !isTechnician && (
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

                  {/* Tarjeta de Equipos HVAC (NK-077: Selección múltiple) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>Equipos a Intervenir</span>
                        {availableEquipments.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                            {selectedEquipmentIds.length} de {availableEquipments.length}
                          </span>
                        )}
                      </label>
                      {availableEquipments.length > 1 && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSelectedEquipmentIds(availableEquipments.map(e => e.id))}
                            className="text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer"
                          >
                            Todos
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setSelectedEquipmentIds([])}
                            className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                          >
                            Ninguno
                          </button>
                        </div>
                      )}
                    </div>

                    {availableEquipments.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {availableEquipments.map(eq => {
                          const isSelected = selectedEquipmentIds.includes(eq.id);
                          return (
                            <div
                              key={eq.id}
                              onClick={() => {
                                setSelectedEquipmentIds(prev => 
                                  prev.includes(eq.id) ? prev.filter(x => x !== eq.id) : [...prev, eq.id]
                                );
                              }}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-cyan-50/80 border-cyan-300 shadow-xs' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 opacity-70'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? 'text-cyan-600' : 'text-slate-400'}`}>
                                  {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-800 truncate">
                                      {eq.brand} {eq.btu ? `${eq.btu} BTU` : ''}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                      {eq.type || 'split'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                    <span>📍 {eq.location_in_property || 'Ubicación no especificada'}</span>
                                    {eq.next_maintenance_date && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] text-slate-400">Próx: {eq.next_maintenance_date}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                isSelected 
                                  ? 'bg-cyan-600 text-white' 
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {isSelected ? 'Intervenir' : 'Omitir'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-white/70 border border-dashed border-slate-200 text-slate-500 text-center text-[11px]">
                        Asignación abierta. El cliente no tiene equipos vinculados.
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
                        <option value="mantencion_preventiva">Mantenimiento Preventivo (6M)</option>
                        <option value="instalacion">Instalación Nueva</option>
                        <option value="bomba_condensado">Bomba de Condensado</option>
                        <option value="mantencion_correctiva">Reparación / Fuga</option>
                        <option value="reparacion">Reparación General</option>
                        <option value="visita_tecnica">Visita Técnica / Diagnóstico</option>
                        <option value="recarga_gas">Recarga Gas Refrigerante</option>
                        <option value="otro_trabajo">Trabajo Especial / Adicional</option>
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

                    {/* Selector de Horario Flexible con Intervalos de 15 Minutos (NK-066) */}
                    <div className="col-span-1 sm:col-span-2">
                      <TimeSlotPicker
                        value={scheduledSlot}
                        onChange={setScheduledSlot}
                        label="Horario del Servicio"
                      />
                    </div>

                    {/* NK-061: Clasificación cromática en agendamiento */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-4 pt-3 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                          <Palette className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Color en Agenda / Calendario</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs" 
                            style={{ backgroundColor: calendarColor }}
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-600">
                            {calendarColor}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {CALENDAR_COLOR_OPTIONS.map(c => {
                          const isSelected = calendarColor.toLowerCase() === c.value.toLowerCase();
                          return (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setCalendarColor(c.value)}
                              title={c.name}
                              className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs relative ${
                                isSelected 
                                  ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' 
                                  : 'hover:scale-105 opacity-85 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.value }}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-xs" />}
                            </button>
                          );
                        })}

                        <label 
                          className="relative h-7 px-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer shadow-2xs transition-colors"
                          title="Elegir otro color personalizado"
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-400" style={{ backgroundColor: calendarColor }} />
                          <span>Personalizado</span>
                          <input
                            type="color"
                            value={calendarColor}
                            onChange={(e) => setCalendarColor(e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          />
                        </label>
                      </div>
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
                        {availableTechnicians.map(t => (
                          <option key={t.id} value={t.id}>{t.name} {t.role === 'ayudante' ? '(Ayudante)' : '(Técnico)'}</option>
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
                          value={techPayoutValue === 0 ? '' : techPayoutValue}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTechPayoutValue(val === '' ? 0 : parseFloat(val) || 0);
                          }}
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
                        {availableAssistants.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Ayudante)</option>
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
                          value={assistantPayoutValue === 0 ? '' : assistantPayoutValue}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAssistantPayoutValue(val === '' ? 0 : parseFloat(val) || 0);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold focus:border-cyan-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                          {assistantPayoutType === 'percentage' ? '%' : (settings?.currency_symbol || '$')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Payout */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-cyan-950 font-medium">
                      <span>Pago Técnico: <strong>{settings?.currency_symbol || '$'} {calculatedTechPayout.toLocaleString()}</strong></span>
                      {assistantId && (
                        <span>Pago Ayudante: <strong>{settings?.currency_symbol || '$'} {calculatedAssistantPayout.toLocaleString()}</strong></span>
                      )}
                      <span className="font-bold text-blue-900">
                        Total Mano de Obra: {settings?.currency_symbol || '$'} {(calculatedTechPayout + calculatedAssistantPayout).toLocaleString()}
                      </span>
                    </div>

                    {technicianId && calculatedTechPayout > 0 && (
                      <div className="pt-2 border-t border-cyan-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isOrderTechPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Honorario Técnico Liquidado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              Honorario Pendiente de Pago
                            </span>
                          )}
                        </div>

                        {!isOrderTechPaid && onAddTechnicianPayout && (
                          <button
                            type="button"
                            onClick={handleQuickPayTechnician}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Pagar Técnico Ahora ({settings?.currency_symbol || '$'} {calculatedTechPayout.toLocaleString()})
                          </button>
                        )}
                      </div>
                    )}
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
                  {hideFinancialDetails ? (
                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 shadow-xs space-y-2 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                        <ShieldCheck className="w-5 h-5 text-cyan-600 shrink-0" />
                        <span>Montos y Tarifas Protegidos</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        El monto total a cobrar al cliente y el desglose de IVA están restringidos para el perfil técnico por políticas de privacidad del negocio.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 shadow-xs space-y-3">
                      {/* Ticker / Selector de IVA idéntico a Proforma (NK-050) */}
                      <div className="p-2.5 bg-white/95 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 select-none">
                          <input
                            type="checkbox"
                            checked={applyTax}
                            onChange={(e) => setApplyTax(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          />
                          <span>Aplicar {settings?.tax_name || 'IVA'} ({taxRatePercent}%)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {applyTax && (
                            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={() => setTaxMode('included')}
                                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                                  taxMode === 'included'
                                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                IVA Incluido
                              </button>
                              <button
                                type="button"
                                onClick={() => setTaxMode('plus')}
                                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                                  taxMode === 'plus'
                                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                + IVA
                              </button>
                            </div>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            applyTax 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {applyTax ? `Con ${settings?.tax_name || 'IVA'}` : 'Exento (0%)'}
                          </span>
                        </div>
                      </div>

                      {/* NK-077: Desglose y multiplicador de precio por equipo */}
                      <div className="p-3 bg-cyan-50/80 border border-cyan-200/90 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-cyan-950 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-cyan-700" />
                            Precio Unitario por Equipo
                          </span>
                          <span className="text-[11px] font-mono text-cyan-800 font-bold bg-white px-2 py-0.5 rounded border border-cyan-200">
                            {selectedEquipmentIds.length || 1} {(selectedEquipmentIds.length === 1 || selectedEquipmentIds.length === 0) ? 'equipo seleccionado' : 'equipos seleccionados'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              {settings?.currency_symbol || '$'}
                            </span>
                            <input
                              type="number"
                              value={unitPrice === 0 ? '' : unitPrice}
                              placeholder="45000"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                                setUnitPrice(val);
                                const count = Math.max(1, selectedEquipmentIds.length);
                                setBaseAmount(val * count);
                              }}
                              className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-cyan-300 rounded-lg text-slate-900 text-sm font-mono font-bold focus:border-cyan-600 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-cyan-900 bg-white/70 px-2.5 py-1.5 rounded-lg border border-cyan-200">
                            <span>{settings?.currency_symbol || '$'}{unitPrice.toLocaleString()}</span>
                            <span>×</span>
                            <span>{Math.max(1, selectedEquipmentIds.length)}</span>
                            <span>=</span>
                            <span className="text-cyan-800 text-sm font-extrabold underline decoration-cyan-400">
                              {settings?.currency_symbol || '$'}{(unitPrice * Math.max(1, selectedEquipmentIds.length)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Header Monto y Comprobante */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          {applyTax 
                            ? (taxMode === 'included' 
                                ? 'Total Facturado (IVA Incluido)' 
                                : 'Monto Neto (Antes de IVA)')
                            : 'Monto Total Facturado (Exento)'}
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
                            value={baseAmount === 0 ? '' : baseAmount}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                              setBaseAmount(val);
                              const count = Math.max(1, selectedEquipmentIds.length);
                              setUnitPrice(Math.round(val / count));
                            }}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-black text-lg focus:border-cyan-500 focus:outline-none transition-colors"
                          />
                        </div>

                        {onOpenReceipt && !isTechnician && (
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

                      {/* Desglose Financiero en Vivo */}
                      <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/90 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>Subtotal Neto:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {settings?.currency_symbol || '$'} {subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>{settings?.tax_name || 'IVA'} ({applyTax ? `${taxRatePercent}%` : '0% Exento'}):</span>
                          <span className={`font-mono font-bold ${applyTax ? 'text-cyan-700' : 'text-emerald-600'}`}>
                            {applyTax 
                              ? `${settings?.currency_symbol || '$'} ${tax.toLocaleString()}`
                              : 'Exento (0%)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold text-xs">
                          <span>Total Facturado a Cobrar:</span>
                          <span className="font-mono text-emerald-700 text-sm font-black">
                            {settings?.currency_symbol || '$'} {total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                            value={paidAmount === 0 ? '' : paidAmount}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaidAmount(val === '' ? 0 : parseFloat(val) || 0);
                            }}
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

                    {/* Honorario del Técnico Asignado */}
                    {technicianId && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Honorario del Técnico</div>
                          <div className="text-xs font-semibold text-slate-800">
                            {technicians.find(t => t.id === technicianId)?.name || 'Técnico Asignado'}:{' '}
                            <span className="font-bold text-cyan-700 font-mono">
                              {settings?.currency_symbol || '$'} {calculatedTechPayout.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOrderTechPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Honorario Liquidado
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                Honorario Pendiente
                              </span>
                              {onAddTechnicianPayout && calculatedTechPayout > 0 && (
                                <button
                                  type="button"
                                  onClick={handleQuickPayTechnician}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Pagar Técnico Ahora
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
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
                      placeholder="Detalle de mantenimiento ejecutado, piezas cambiadas, recarga de refrigerante, pruebas térmicas..."
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

