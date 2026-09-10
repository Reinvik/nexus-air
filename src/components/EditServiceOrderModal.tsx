import React, { useState } from 'react';
import { ServiceOrder, Technician, OrderStatus, ServiceType } from '../types';
import { X, Save, Trash2, Calendar, Clock, Wrench, DollarSign, CheckCircle } from 'lucide-react';

interface EditServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  technicians: Technician[];
  onUpdateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  onDeleteOrder: (id: string) => void;
}

export const EditServiceOrderModal: React.FC<EditServiceOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  technicians,
  onUpdateOrder,
  onDeleteOrder,
}) => {
  if (!isOpen || !order) return null;

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [technicianId, setTechnicianId] = useState(order.assigned_technician_id || '');
  const [scheduledDate, setScheduledDate] = useState(order.scheduled_date);
  const [scheduledSlot, setScheduledSlot] = useState(order.scheduled_time_slot);
  const [description, setDescription] = useState(order.description);
  const [diagnosis, setDiagnosis] = useState(order.diagnosis || '');
  const [resolution, setResolution] = useState(order.resolution || '');
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [total, setTotal] = useState(order.total);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateOrder(order.id, {
      status,
      assigned_technician_id: technicianId,
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

          {/* Fecha, Bloque y Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Técnico</label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
              >
                <option value="">Sin asignar</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
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
            <label className="font-semibold text-slate-700">Total Facturado ($ CLP)</label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(parseInt(e.target.value) || 0)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Orden</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
