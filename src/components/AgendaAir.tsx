import React, { useState, useMemo } from 'react';
import { ServiceOrder, Technician } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Wrench, 
  Plus
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgendaAirProps {
  orders: ServiceOrder[];
  technicians: Technician[];
  onOpenNewOrder: () => void;
  onSelectOrder: (order: ServiceOrder) => void;
}

const SLOTS = [
  '09:00 - 11:00',
  '11:30 - 13:30',
  '14:30 - 16:30',
  '17:00 - 19:00',
];

export const AgendaAir: React.FC<AgendaAirProps> = ({
  orders,
  technicians,
  onOpenNewOrder,
  onSelectOrder,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const ordersForDay = useMemo(() => {
    return orders.filter(o => o.scheduled_date === selectedDateStr);
  }, [orders, selectedDateStr]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation in White */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </h2>
            <p className="text-xs text-slate-500">
              {ordersForDay.length} visita(s) técnica(s) programadas para hoy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            Hoy
          </button>
          <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-0.5">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agendar Visita</span>
          </button>
        </div>
      </div>

      {/* Slots Timeline in White */}
      <div className="space-y-4">
        {SLOTS.map((slot) => {
          const slotOrders = ordersForDay.filter(o => o.scheduled_time_slot.includes(slot.split(' - ')[0]));

          return (
            <div
              key={slot}
              className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs"
            >
              {/* Slot Header */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-800 font-mono text-xs font-bold">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  <span>Bloque {slot}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {slotOrders.length} orden(es) asignada(s)
                </span>
              </div>

              {/* Slot Content */}
              <div className="p-4">
                {slotOrders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Bloque libre para despacho técnico
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slotOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => onSelectOrder(ord)}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-400 transition-all cursor-pointer space-y-2 group shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-cyan-700">
                            {ord.ticket_number}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white border border-slate-200 text-slate-700">
                            {ord.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-sm font-extrabold text-slate-900 group-hover:text-cyan-700 transition-colors">
                          {ord.customer?.name}
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{ord.customer?.address}, {ord.customer?.commune}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Wrench className="w-3 h-3 text-cyan-600" />
                            <span className="text-[11px]">{ord.assigned_technician?.name || 'Sin asignar'}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900 font-mono">
                            ${ord.total.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
