import React, { useState } from 'react';
import { Customer, AirEquipment, Technician, ServiceOrder, ServiceType } from '../types';
import { X, Plus, Calendar, Clock, User, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface AddServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  equipments: AirEquipment[];
  technicians: Technician[];
  onAddOrder: (orderData: Partial<ServiceOrder>) => void;
}

export const AddServiceOrderModal: React.FC<AddServiceOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  equipments,
  technicians,
  onAddOrder,
}) => {
  if (!isOpen) return null;

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [equipmentId, setEquipmentId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('mantencion_preventiva');
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledSlot, setScheduledSlot] = useState('09:30 - 11:30');
  const [technicianId, setTechnicianId] = useState(technicians[0]?.id || '');
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState(45000);

  const clientEquipments = equipments.filter(e => e.customer_id === customerId);

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
      subtotal: Math.round(totalPrice / 1.19),
      tax: Math.round(totalPrice - (totalPrice / 1.19)),
      total: totalPrice,
      payment_status: 'pendiente',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
              <Wrench className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Nueva Orden de Servicio HVAC</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
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
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              required
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.commune}) - {c.address}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="mantencion_preventiva">Mantención Preventiva (6 Meses)</option>
                <option value="instalacion">Instalación Nueva de Equipo</option>
                <option value="mantencion_correctiva">Reparación / Falla / Fuga</option>
                <option value="visita_tecnica">Visita Técnica de Diagnóstico</option>
                <option value="recarga_gas">Recarga Gas Refrigerante R410A/R32</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Valor Estimado ($ CLP)</label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Equipo a Intervenir</label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Seleccionar equipo registrado...</option>
              {clientEquipments.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.brand} {eq.btu} BTU - {eq.location_in_property} ({eq.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                Fecha Programada
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
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
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="09:00 - 11:00">09:00 - 11:00 (Mañana 1)</option>
                <option value="11:30 - 13:30">11:30 - 13:30 (Mañana 2)</option>
                <option value="14:30 - 16:30">14:30 - 16:30 (Tarde 1)</option>
                <option value="17:00 - 19:00">17:00 - 19:00 (Tarde 2)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              Técnico HVAC Asignado
            </label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            >
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.sec_certified ? '(Certificación SEC)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Descripción o Síntomas</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Mantención preventiva semestral, limpieza profunda de turbina..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Crear Orden de Servicio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
