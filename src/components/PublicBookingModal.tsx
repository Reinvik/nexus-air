import React, { useState } from 'react';
import { ServiceType, AirSettings, ServiceOrder, Customer } from '../types';
import { X, Calendar, Clock, MapPin, Phone, User, CheckCircle2, Wind, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface PublicBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AirSettings;
  onConfirmBooking: (bookingData: {
    name: string;
    phone: string;
    address: string;
    commune: string;
    service_type: ServiceType;
    scheduled_date: string;
    scheduled_time_slot: string;
    notes: string;
  }) => ServiceOrder;
}

export const PublicBookingModal: React.FC<PublicBookingModalProps> = ({
  isOpen,
  onClose,
  settings,
  onConfirmBooking,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [address, setAddress] = useState('');
  const [commune, setCommune] = useState('Las Condes');
  const [serviceType, setServiceType] = useState<ServiceType>('mantencion_preventiva');
  const [scheduledDate, setScheduledDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [scheduledSlot, setScheduledSlot] = useState('09:00 - 11:00');
  const [notes, setNotes] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<ServiceOrder | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = onConfirmBooking({
      name,
      phone,
      address,
      commune,
      service_type: serviceType,
      scheduled_date: scheduledDate,
      scheduled_time_slot: scheduledSlot,
      notes,
    });
    setConfirmedOrder(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 shadow-xs">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Agendar Servicio de Climatización</h3>
              <p className="text-xs text-slate-500">Técnicos certificados directos a tu domicilio o empresa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          /* Confirmation State */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-extrabold text-slate-900">¡Visita Agendada con Éxito!</h4>
              <p className="text-xs text-slate-500">
                Tu solicitud ha sido registrada en nuestro tablero de asignación técnica.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Folio de Atención:</span>
                <span className="text-cyan-700 font-mono font-bold">{confirmedOrder.ticket_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Servicio:</span>
                <span className="text-slate-900 font-medium capitalize">{confirmedOrder.service_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha y Horario:</span>
                <span className="text-slate-900 font-medium">{confirmedOrder.scheduled_date} ({confirmedOrder.scheduled_time_slot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dirección:</span>
                <span className="text-slate-900 font-medium">{confirmedOrder.customer?.address}, {confirmedOrder.customer?.commune}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Un técnico de nuestro equipo se comunicará contigo vía WhatsApp para confirmar los detalles previos a la llegada.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 cursor-pointer transition-all"
            >
              Cerrar y Finalizar
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-600" />
                Tu Nombre Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Marcelo Morales"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-600" />
                  Teléfono (WhatsApp)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tipo de Servicio</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                >
                  <option value="mantencion_preventiva">Mantención Preventiva (Semestral)</option>
                  <option value="instalacion">Instalación de Equipo Nuevo</option>
                  <option value="mantencion_correctiva">Reparación / Falla / Fuga</option>
                  <option value="visita_tecnica">Visita Técnica y Diagnóstico</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Dirección & Depto
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle y número / depto"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Comuna</label>
                <input
                  type="text"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Comuna (ej: Providencia)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                  Día Preferido
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  Bloque Horario
                </label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                >
                  <option value="09:00 - 11:00">09:00 - 11:00 (Mañana)</option>
                  <option value="11:30 - 13:30">11:30 - 13:30 (Mediodía)</option>
                  <option value="14:30 - 16:30">14:30 - 16:30 (Tarde)</option>
                  <option value="17:00 - 19:00">17:00 - 19:00 (Tarde/Noche)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notas sobre el equipo o acceso</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Tengo un split Anwo en el living que no enfría como antes..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-xl shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Confirmar Solicitud de Visita
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
