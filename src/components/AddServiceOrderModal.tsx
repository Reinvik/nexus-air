import React, { useState, useEffect } from 'react';
import { Customer, AirEquipment, Technician, ServiceOrder, ServiceType } from '../types';
import { X, Plus, Calendar, Clock, User, Wrench, UserCheck, Users, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface AddServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  equipments: AirEquipment[];
  technicians: Technician[];
  settings?: AirSettings;
  onAddOrder: (orderData: Partial<ServiceOrder>) => void;
}

export const AddServiceOrderModal: React.FC<AddServiceOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  equipments,
  technicians,
  settings,
  onAddOrder,
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

  if (!isOpen) return null;

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [equipmentId, setEquipmentId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('mantencion_preventiva');
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledSlot, setScheduledSlot] = useState('09:30 - 11:30');
  const [technicianId, setTechnicianId] = useState(technicians[0]?.id || '');
  const [assistantId, setAssistantId] = useState('');
  const [techPayoutType, setTechPayoutType] = useState<'fixed' | 'percentage'>('fixed');
  const [techPayoutValue, setTechPayoutValue] = useState<number>(20000);
  const [assistantPayoutType, setAssistantPayoutType] = useState<'fixed' | 'percentage'>('fixed');
  const [assistantPayoutValue, setAssistantPayoutValue] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState(45000);

  const clientEquipments = equipments.filter(e => e.customer_id === customerId);

  // Auto-cargar comisión pactada según el tipo de servicio y colaborador (NK-012)
  useEffect(() => {
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return;

    if (serviceType === 'instalacion') {
      setTechPayoutType(tech.commission_instalacion_type || 'fixed');
      setTechPayoutValue(tech.commission_instalacion_value ?? 35000);
    } else if (serviceType === 'mantencion_preventiva') {
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
    } else if (serviceType === 'mantencion_preventiva') {
      setAssistantPayoutType(asst.commission_mantencion_type || 'fixed');
      setAssistantPayoutValue(asst.commission_mantencion_value ?? 10000);
    } else {
      setAssistantPayoutType(asst.commission_reparacion_type || asst.default_commission_type || 'fixed');
      setAssistantPayoutValue(asst.commission_reparacion_value ?? asst.default_commission_value ?? 8000);
    }
  }, [assistantId, serviceType, technicians]);

  const calculatedTechPayout = techPayoutType === 'percentage' 
    ? Math.round((totalPrice * techPayoutValue) / 100) 
    : techPayoutValue;
  const calculatedAssistantPayout = assistantId 
    ? (assistantPayoutType === 'percentage' 
        ? Math.round((totalPrice * assistantPayoutValue) / 100) 
        : assistantPayoutValue)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCust = customers.find(c => c.id === customerId);
    if (!selectedCust) return;

    onAddOrder({
      customer_id: customerId,
      equipment_id: equipmentId || (clientEquipments[0]?.id),
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
          unit_price: totalPrice,
          total: totalPrice,
          type: 'servicio',
        }
      ],
      subtotal: Math.round(totalPrice / (1 + (settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19))),
      tax: Math.round(totalPrice - (totalPrice / (1 + (settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19)))),
      total: totalPrice,
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
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-600" />
                      Seleccionar Cliente
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value);
                        setEquipmentId('');
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                      required
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.commune}) - {c.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      Equipo a Intervenir
                    </label>
                    <select
                      value={equipmentId}
                      onChange={(e) => setEquipmentId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                    >
                      <option value="">Seleccionar equipo registrado...</option>
                      {clientEquipments.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.brand} {eq.btu} BTU - {eq.location_in_property} ({eq.type})
                        </option>
                      ))}
                    </select>
                    {clientEquipments.length === 0 && (
                      <p className="text-[11px] text-amber-600 font-medium">
                        El cliente no tiene equipos vinculados aún; se creará la orden con asignación abierta.
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
                        if (val === 'mantencion_preventiva') setTotalPrice(45000);
                        if (val === 'instalacion') setTotalPrice(130000);
                        if (val === 'visita_tecnica') setTotalPrice(30000);
                        if (val === 'recarga_gas') setTotalPrice(65000);
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors font-medium"
                    >
                      <option value="mantencion_preventiva">Mantención Preventiva (6 Meses)</option>
                      <option value="instalacion">Instalación Nueva de Equipo</option>
                      <option value="mantencion_correctiva">Reparación / Falla / Fuga</option>
                      <option value="visita_tecnica">Visita Técnica de Diagnóstico</option>
                      <option value="recarga_gas">Recarga Gas Refrigerante R410A/R32</option>
                    </select>
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

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        Bloque Horario
                      </label>
                      <select
                        value={scheduledSlot}
                        onChange={(e) => setScheduledSlot(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-cyan-500 focus:outline-none transition-colors"
                      >
                        <option value="09:00 - 11:00">09:00 - 11:00 (Mañana 1)</option>
                        <option value="11:30 - 13:30">11:30 - 13:30 (Mañana 2)</option>
                        <option value="14:30 - 16:30">14:30 - 16:30 (Tarde 1)</option>
                        <option value="17:00 - 19:00">17:00 - 19:00 (Tarde 2)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Descripción / Síntomas */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Descripción o Síntomas Informados</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Mantención preventiva semestral, limpieza profunda de turbina, no enfría suficiente..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA: Valor Estimado & Cuadrilla de Terreno */}
              <div className="lg:col-span-6 space-y-4">
                {/* Valor Estimado Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/50 via-slate-50 to-blue-50/40 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Valor Total Estimado ({settings?.currency_symbol || '$'} {settings?.currency_code || 'CLP'})
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {settings?.tax_name || 'IVA'} incluido ({Math.round((settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19) * 100)}%)
                    </span>
                  </div>
                  <input
                    type="number"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg font-mono font-bold focus:border-cyan-500 focus:outline-none shadow-inner"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Neto: {settings?.currency_symbol || '$'}{Math.round(totalPrice / (1 + (settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19))).toLocaleString()}</span>
                    <span>{settings?.tax_name || 'IVA'}: {settings?.currency_symbol || '$'}{Math.round(totalPrice - (totalPrice / (1 + (settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19)))).toLocaleString()}</span>
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
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
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
                        {techPayoutType === 'percentage' ? '% Mano de Obra' : 'Monto a Pagar ($)'}
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
                        {technicians.filter(t => t.id !== technicianId).map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
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
                        <option value="fixed">Monto Fijo ($)</option>
                        <option value="percentage">Porcentaje (%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {assistantPayoutType === 'percentage' ? '% Mano de Obra' : 'Monto a Pagar ($)'}
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

                  {/* Resumen de Liquidación Estimada */}
                  <div className="p-3 rounded-lg bg-cyan-50/80 border border-cyan-200 text-xs flex flex-wrap items-center justify-between gap-2 text-cyan-950 font-medium">
                    <span>Pago Técnico: <strong>${calculatedTechPayout.toLocaleString('es-CL')}</strong></span>
                    {assistantId && (
                      <span>Pago Ayudante: <strong>${calculatedAssistantPayout.toLocaleString('es-CL')}</strong></span>
                    )}
                    <span className="font-bold text-blue-900">
                      Total Mano de Obra: ${(calculatedTechPayout + calculatedAssistantPayout).toLocaleString('es-CL')}
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
    </div>
  );
};
