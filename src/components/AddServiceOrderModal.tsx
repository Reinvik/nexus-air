import React, { useState, useEffect, useMemo } from 'react';
import { 
  Customer, 
  AirEquipment, 
  Technician, 
  ServiceOrder, 
  ServiceType, 
  AirSettings,
  CALENDAR_COLOR_OPTIONS,
  SERVICE_TYPE_DEFAULT_COLORS,
  formatServiceType
} from '../types';
import { X, Plus, Calendar, Clock, User, Wrench, UserCheck, Users, Percent, DollarSign, AlertTriangle, UserPlus, Palette, Check, CheckSquare, Square, Snowflake } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { QuickCreateCustomerModal } from './QuickCreateCustomerModal';
import { TimeSlotPicker } from './TimeSlotPicker';

interface AddServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  equipments: AirEquipment[];
  technicians: Technician[];
  settings?: AirSettings;
  onAddOrder: (orderData: Partial<ServiceOrder>) => void;
  onAddCustomer?: (customer: Omit<Customer, 'id' | 'created_at'>) => Promise<Customer | void> | void;
  onAddEquipment?: (equipment: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => Promise<AirEquipment | void> | void;
}

export const AddServiceOrderModal: React.FC<AddServiceOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  equipments,
  technicians,
  settings,
  onAddOrder,
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

  // NK-046 & NK-062: Solo técnicos líderes pueden ser asignados como técnico principal
  const availableTechnicians = useMemo(() => 
    technicians.filter(t => t.role === 'tecnico' || (!t.role && t.role !== 'ayudante')), 
    [technicians]
  );

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [equipmentId, setEquipmentId] = useState('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>('mantencion_preventiva');
  const [calendarColor, setCalendarColor] = useState<string>(() => 
    settings?.service_type_colors?.['mantencion_preventiva'] || SERVICE_TYPE_DEFAULT_COLORS['mantencion_preventiva'] || '#0284c7'
  );
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledSlot, setScheduledSlot] = useState('09:30 - 11:30');
  const [technicianId, setTechnicianId] = useState(
    technicians.find(t => t.role === 'tecnico' || (!t.role && t.role !== 'ayudante'))?.id || ''
  );
  const [assistantId, setAssistantId] = useState('');

  const availableAssistants = useMemo(() => 
    technicians.filter(t => t.role === 'ayudante' && t.id !== technicianId), 
    [technicians, technicianId]
  );
  const [techPayoutType, setTechPayoutType] = useState<'fixed' | 'percentage'>('fixed');
  const [techPayoutValue, setTechPayoutValue] = useState<number>(20000);
  const [assistantPayoutType, setAssistantPayoutType] = useState<'fixed' | 'percentage'>('fixed');
  const [assistantPayoutValue, setAssistantPayoutValue] = useState<number>(10000);
  const [description, setDescription] = useState('');
  // NK-050: Configuración de IVA seleccionable y modalidad (incluido vs + IVA vs exento)
  const [applyTax, setApplyTax] = useState<boolean>(() => settings?.default_apply_tax !== false);
  const [taxMode, setTaxMode] = useState<'included' | 'plus'>(() => 
    settings?.default_tax_mode === 'plus' ? 'plus' : 'included'
  );
  const [basePrice, setBasePrice] = useState<number>(45000);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  // NK-053: Mantenimiento Periódico Acordado con el Cliente
  const [isRecurringConfirmed, setIsRecurringConfirmed] = useState(false);
  const [recurringFrequencyMonths, setRecurringFrequencyMonths] = useState<number>(6);

  const taxRate = settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.13;
  const taxRatePercent = Math.round(taxRate * 100);

  const calculatedFinancials = useMemo(() => {
    const amt = basePrice || 0;
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
  }, [basePrice, applyTax, taxMode, taxRate]);

  const handleCustomerCreated = (newCust: Customer, newEq?: AirEquipment) => {
    setCustomerId(newCust.id);
    if (newEq) {
      setEquipmentId(newEq.id);
      setSelectedEquipmentIds([newEq.id]);
    }
    if (!description) {
      setDescription(`Servicio de ${serviceType.replace('_', ' ')} para ${newCust.name}`);
    }
  };

  const clientEquipments = equipments.filter(e => e.customer_id === customerId);

  // NK-077: Mantener selección múltiple sincronizada al cambiar de cliente
  useEffect(() => {
    if (clientEquipments.length > 0) {
      setSelectedEquipmentIds(prev => {
        const stillValid = prev.filter(id => clientEquipments.some(e => e.id === id));
        if (stillValid.length > 0) return stillValid;
        // Por defecto, preseleccionar todos los equipos del cliente
        return clientEquipments.map(e => e.id);
      });
    } else {
      setSelectedEquipmentIds([]);
    }
  }, [customerId, clientEquipments.length]);

  const toggleEquipmentSelection = (id: string) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllEquipments = () => {
    setSelectedEquipmentIds(clientEquipments.map(e => e.id));
  };

  const deselectAllEquipments = () => {
    setSelectedEquipmentIds([]);
  };

  // Auto-cargar comisión pactada según el tipo de servicio y colaborador (NK-012)
  useEffect(() => {
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return;

    if (serviceType === 'instalacion') {
      setTechPayoutType(tech.commission_instalacion_type || 'fixed');
      setTechPayoutValue(tech.commission_instalacion_value ?? 35000);
    } else if (serviceType === 'mantencion_preventiva' || (serviceType as any) === 'mantenimiento_preventivo') {
      setTechPayoutType(tech.commission_mantencion_type || 'fixed');
      setTechPayoutValue(tech.commission_mantencion_value ?? 20000);
    } else {
      setTechPayoutType(tech.commission_reparacion_type || tech.default_commission_type || 'fixed');
      setTechPayoutValue(tech.commission_reparacion_value ?? tech.default_commission_value ?? 15000);
    }
  }, [technicianId, serviceType, technicians]);

  useEffect(() => {
    if (!assistantId) {
      setAssistantPayoutValue(0);
      return;
    }
    const asst = technicians.find(t => t.id === assistantId);
    if (!asst) return;

    if (serviceType === 'instalacion') {
      setAssistantPayoutType(asst.commission_instalacion_type || 'fixed');
      setAssistantPayoutValue(asst.commission_instalacion_value ?? 25000);
    } else if (serviceType === 'mantencion_preventiva' || (serviceType as any) === 'mantenimiento_preventivo') {
      setAssistantPayoutType(asst.commission_mantencion_type || 'fixed');
      setAssistantPayoutValue(asst.commission_mantencion_value ?? 10000);
    } else {
      setAssistantPayoutType(asst.commission_reparacion_type || asst.default_commission_type || 'fixed');
      setAssistantPayoutValue(asst.commission_reparacion_value ?? asst.default_commission_value ?? 8000);
    }
  }, [assistantId, serviceType, technicians]);

  const calculatedTechPayout = techPayoutType === 'percentage' 
    ? Math.round((calculatedFinancials.total * techPayoutValue) / 100) 
    : techPayoutValue;
  const calculatedAssistantPayout = assistantId 
    ? (assistantPayoutType === 'percentage' 
        ? Math.round((calculatedFinancials.total * assistantPayoutValue) / 100) 
        : assistantPayoutValue)
    : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customers.length === 0) {
      toast.error('Debes registrar al menos un cliente antes de crear una orden de trabajo.');
      return;
    }
    const selectedCust = customers.find(c => c.id === customerId) || customers[0];
    if (!selectedCust) {
      toast.error('Selecciona un cliente válido.');
      return;
    }

    const chosenEquipments = clientEquipments.filter(e => selectedEquipmentIds.includes(e.id));
    const summary = chosenEquipments.length > 0
      ? `${chosenEquipments.length} equipo(s): ${chosenEquipments.map(e => `${e.brand} ${e.btu ? `${e.btu} BTU` : ''} (${e.location_in_property || 'Ubicación n/d'})`.trim()).join(', ')}`
      : undefined;

    onAddOrder({
      customer_id: selectedCust.id,
      equipment_id: selectedEquipmentIds[0] || (clientEquipments[0]?.id),
      equipment_ids: selectedEquipmentIds.length > 0 ? selectedEquipmentIds : (clientEquipments[0]?.id ? [clientEquipments[0].id] : []),
      equipments_summary: summary,
      service_type: serviceType,
      status: 'ingresado',
      scheduled_date: scheduledDate,
      scheduled_time_slot: scheduledSlot,
      assigned_technician_id: technicianId,
      assigned_assistant_id: assistantId || undefined,
      technician_payout_type: techPayoutType,
      technician_payout_value: techPayoutValue,
      assistant_payout_type: assistantPayoutType,
      assistant_payout_value: assistantPayoutValue,
      description: description || `Servicio de ${serviceType.replace('_', ' ')} para ${selectedCust.name}`,
      items: [
        {
          id: `it-${Date.now()}`,
          description: `Servicio de ${serviceType.replace('_', ' ')}`,
          quantity: 1,
          unit_price: calculatedFinancials.total,
          total: calculatedFinancials.total,
          type: 'servicio',
        }
      ],
      subtotal: calculatedFinancials.subtotal,
      tax: calculatedFinancials.tax,
      total: calculatedFinancials.total,
      apply_tax: applyTax,
      tax_mode: applyTax ? taxMode : 'exempt',
      is_recurring_confirmed: isRecurringConfirmed,
      recurring_frequency_months: isRecurringConfirmed ? recurringFrequencyMonths : undefined,
      calendar_color: calendarColor,
      payment_status: 'pendiente',
    });

    onClose();
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
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200 shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Nueva Orden de Servicio HVAC</h3>
              <p className="text-xs text-slate-500">Agendamiento técnico, equipo y asignación de cuadrilla de terreno</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* COLUMNA IZQUIERDA: Cliente, Equipo, Tipo de Servicio y Agendamiento */}
              <div className="lg:col-span-6 space-y-4">
                {/* Cliente & Equipo */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-cyan-600" />
                        Seleccionar Cliente
                      </label>
                      {onAddCustomer && (
                        <button
                          type="button"
                          onClick={() => setIsAddCustomerModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 hover:text-cyan-800 font-bold text-[11px] transition-colors cursor-pointer border border-cyan-300/40 shadow-2xs"
                          title="Crear un nuevo cliente sin salir de este ticket"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Nuevo Cliente</span>
                        </button>
                      )}
                    </div>
                    <select
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value);
                        setEquipmentId('');
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                      required
                    >
                      {customers.length === 0 ? (
                        <option value="" disabled>
                          ⚠️ Sin clientes registrados (Presiona "+ Nuevo Cliente" arriba)
                        </option>
                      ) : (
                        customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.commune || 'Sin comuna'}) - {c.address}
                          </option>
                        ))
                      )}
                    </select>
                    {customers.length === 0 && onAddCustomer && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddCustomerModalOpen(true)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Crear Primer Cliente Ahora</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>Equipos a Intervenir</span>
                        {clientEquipments.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                            {selectedEquipmentIds.length} de {clientEquipments.length}
                          </span>
                        )}
                      </label>
                      {clientEquipments.length > 1 && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={selectAllEquipments}
                            className="text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer"
                          >
                            Todos
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={deselectAllEquipments}
                            className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                          >
                            Ninguno
                          </button>
                        </div>
                      )}
                    </div>

                    {clientEquipments.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {clientEquipments.map(eq => {
                          const isSelected = selectedEquipmentIds.includes(eq.id);
                          return (
                            <div
                              key={eq.id}
                              onClick={() => toggleEquipmentSelection(eq.id)}
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
                      <p className="text-[11px] text-amber-600 font-medium p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                        El cliente no tiene equipos vinculados aún; se creará la orden con asignación abierta.
                      </p>
                    )}

                    {clientEquipments.length > 0 && (
                      <p className="text-[10px] text-slate-400 leading-tight">
                        💡 Cada equipo no seleccionado continuará apareciendo como pendiente de mantenimiento en Recaptación con su ciclo independiente.
                      </p>
                    )}
                  </div>
                </div>

                {/* Tipo de Servicio & Programación */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Tipo de Servicio</label>
                    <select
                      value={serviceType}
                      onChange={(e) => {
                        const val = e.target.value as ServiceType;
                        setServiceType(val);
                        if (val === 'mantencion_preventiva') setBasePrice(45000);
                        if (val === 'instalacion') setBasePrice(130000);
                        if (val === 'visita_tecnica') setBasePrice(30000);
                        if (val === 'recarga_gas') setBasePrice(65000);
                        const suggestedCol = settings?.service_type_colors?.[val] || SERVICE_TYPE_DEFAULT_COLORS[val] || '#0284c7';
                        setCalendarColor(suggestedCol);
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors font-medium"
                    >
                      <option value="mantencion_preventiva">Mantenimiento Preventivo (6 Meses)</option>
                      <option value="instalacion">Instalación Nueva de Equipo</option>
                      <option value="mantencion_correctiva">Reparación / Falla / Fuga</option>
                      <option value="visita_tecnica">Visita Técnica de Diagnóstico</option>
                      <option value="recarga_gas">Recarga Gas Refrigerante R410A/R32</option>
                    </select>
                  </div>

                  {/* NK-061: Clasificación cromática en agendamiento */}
                  <div className="pt-2 border-t border-slate-200/70 space-y-2">
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

                      {/* Selector de color personalizado nativo */}
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

                    {/* Previsualización en vivo de la tarjeta en el calendario */}
                    <div 
                      className="mt-2 p-2.5 rounded-xl border transition-all text-xs"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: calendarColor,
                        backgroundColor: `${calendarColor}12`,
                        borderColor: `${calendarColor}35`
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span className="font-mono font-bold" style={{ color: calendarColor }}>
                          AIR-2026-NUEVA
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${calendarColor}25`, color: calendarColor }}>
                          {formatServiceType(serviceType)}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs mt-1">
                        {customers.find(c => c.id === customerId)?.name || 'Nombre del Cliente'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{scheduledSlot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        Fecha Programada
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    {/* Selector de Horario Flexible con Intervalos de 15 Minutos (NK-066) */}
                    <div>
                      <TimeSlotPicker
                        value={scheduledSlot}
                        onChange={setScheduledSlot}
                        label="Horario del Servicio"
                      />
                    </div>
                  </div>
                </div>

                {/* NK-053: Acuerdo de Mantenimiento Periódico con el Cliente */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  isRecurringConfirmed 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-300 shadow-xs' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isRecurringConfirmed ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        ⭐
                      </div>
                      <div>
                        <label htmlFor="recurring-checkbox" className="font-bold text-xs text-slate-900 cursor-pointer block">
                          Plan Periódico Acordado con el Cliente
                        </label>
                        <span className="text-[11px] text-slate-500 block">
                          El cliente solicitó agendar y recordar este servicio periódicamente.
                        </span>
                      </div>
                    </div>
                    <input
                      id="recurring-checkbox"
                      type="checkbox"
                      checked={isRecurringConfirmed}
                      onChange={(e) => setIsRecurringConfirmed(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600 shrink-0"
                    />
                  </div>

                  {isRecurringConfirmed && (
                    <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2.5 animate-fade-in text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Frecuencia Pactada
                        </label>
                        <select
                          value={recurringFrequencyMonths}
                          onChange={(e) => setRecurringFrequencyMonths(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-amber-300 rounded-lg text-slate-900 text-xs font-bold focus:border-amber-500 focus:outline-none"
                        >
                          <option value={3}>Cada 3 meses (Comercial / Servidores)</option>
                          <option value={4}>Cada 4 meses (Cuatrimestral)</option>
                          <option value={6}>Cada 6 meses (Semestral - Habitual)</option>
                          <option value={12}>Cada 12 meses (Anual)</option>
                        </select>
                      </div>
                      <div className="p-2 bg-amber-100/70 rounded-lg border border-amber-200 text-amber-950 font-medium text-[11px] flex items-center justify-between">
                        <span>Próximo contacto acordado:</span>
                        <span className="font-bold font-mono text-xs">+ {recurringFrequencyMonths} meses</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Descripción / Síntomas */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Descripción o Síntomas Informados</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Mantenimiento preventivo semestral, limpieza profunda de turbina, no enfría suficiente..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA: Valor Estimado & Cuadrilla de Terreno */}
              <div className="lg:col-span-6 space-y-4">
                {/* Valor Estimado Card (NK-050 & NK-051) */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/50 via-slate-50 to-blue-50/40 border border-slate-200 space-y-3">
                  {/* Ticker / Selector de IVA idéntico a Proforma */}
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

                  {/* Input de Monto con sobreescritura automática de 0 (NK-051) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        {applyTax 
                          ? (taxMode === 'included' 
                              ? `Monto a Cobrar (IVA Incluido)` 
                              : `Monto Neto (Antes de IVA)`)
                          : `Monto a Cobrar (Exento de IVA)`}
                      </label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-500 font-medium">
                        {settings?.currency_symbol || '$'} {settings?.currency_code || 'CLP'}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        {settings?.currency_symbol || '$'}
                      </span>
                      <input
                        type="number"
                        value={basePrice === 0 ? '' : basePrice}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBasePrice(val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0));
                        }}
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-lg font-mono font-bold focus:border-cyan-500 focus:outline-none shadow-inner transition-colors"
                      />
                    </div>
                  </div>

                  {/* Desglose Financiero en Vivo */}
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/90 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Subtotal Neto:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {settings?.currency_symbol || '$'} {calculatedFinancials.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>{settings?.tax_name || 'IVA'} ({applyTax ? `${taxRatePercent}%` : '0% Exento'}):</span>
                      <span className={`font-mono font-bold ${applyTax ? 'text-cyan-700' : 'text-emerald-600'}`}>
                        {applyTax 
                          ? `${settings?.currency_symbol || '$'} ${calculatedFinancials.tax.toLocaleString()}`
                          : 'Exento (0%)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold text-xs">
                      <span>Total Facturado:</span>
                      <span className="font-mono text-emerald-700 text-sm font-black">
                        {settings?.currency_symbol || '$'} {calculatedFinancials.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Asignación de Equipo en Terreno y % de Mano de Obra */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Users className="w-4 h-4 text-cyan-600" />
                      Equipo de Terreno & Pago por Mano de Obra
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-200/70">
                      Control de comisiones
                    </span>
                  </div>

                  {/* 1. Técnico Principal */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Técnico Principal
                      </label>
                      <select
                        value={technicianId}
                        onChange={(e) => setTechnicianId(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-cyan-500 focus:outline-none"
                        required
                      >
                        {availableTechnicians.length === 0 ? (
                          <option value="" disabled>
                            ⚠️ Sin técnicos registrados (rol: Técnico)
                          </option>
                        ) : (
                          availableTechnicians.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} (Técnico)
                            </option>
                          ))
                        )}
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

                  {/* 2. Ayudante / Asistente */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center pt-2.5 border-t border-slate-200/80">
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
                        {availableAssistants.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Ayudante)
                          </option>
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

                  {/* Resumen de Liquidación Estimada */}
                  <div className="p-3 rounded-lg bg-cyan-50/80 border border-cyan-200 text-xs flex flex-wrap items-center justify-between gap-2 text-cyan-950 font-medium">
                    <span>Pago Técnico: <strong>{settings?.currency_symbol || '$'} {calculatedTechPayout.toLocaleString()}</strong></span>
                    {assistantId && (
                      <span>Pago Ayudante: <strong>{settings?.currency_symbol || '$'} {calculatedAssistantPayout.toLocaleString()}</strong></span>
                    )}
                    <span className="font-bold text-blue-900">
                      Total Mano de Obra: {settings?.currency_symbol || '$'} {(calculatedTechPayout + calculatedAssistantPayout).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-500">
              La orden se generará en estado <span className="font-semibold text-cyan-700">Ingresado</span> y se notificará al técnico asignado.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
                title="Cancelar (Esc)"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Crear Orden de Servicio</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Submodal para Crear Cliente Directo desde el Ticket */}
      {isAddCustomerModalOpen && onAddCustomer && (
        <QuickCreateCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          settings={settings}
          onAddCustomer={onAddCustomer}
          onAddEquipment={onAddEquipment}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </div>
  );
};
