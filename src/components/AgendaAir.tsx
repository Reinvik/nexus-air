import React, { useState, useMemo } from 'react';
import { ServiceOrder, Technician } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  Plus, 
  CheckCircle2, 
  Truck,
  Wind
} from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
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
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </h2>
            <p className="text-xs text-slate-400">
              {ordersForDay.length} visita(s) técnica(s) programadas para hoy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
          >
            Hoy
          </button>
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agendar Visita</span>
          </button>
        </div>
      </div>

      {/* Slots and Technicians Timeline */}
      <div className="space-y-4">
        {SLOTS.map((slot) => {
          const slotOrders = ordersForDay.filter(o => o.scheduled_time_slot.includes(slot.split(' - ')[0]));

          return (
            <div
              key={slot}
              className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden"
            >
              {/* Slot Header */}
              <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Bloque {slot}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {slotOrders.length} orden(es) asignada(s)
                </span>
              </div>

              {/* Slot Content */}
              <div className="p-4">
                {slotOrders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800/60 rounded-xl">
                    Bloque disponible para despacho técnico
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slotOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => onSelectOrder(ord)}
                        className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-cyan-400">
                            {ord.ticket_number}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-800 text-slate-300">
                            {ord.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {ord.customer?.name}
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{ord.customer?.address}, {ord.customer?.commune}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-slate-300">
                            <Wrench className="w-3 h-3 text-cyan-400" />
                            <span className="text-[11px]">{ord.assigned_technician?.name || 'Técnico sin asignar'}</span>
                          </div>
                          <span className="text-xs font-bold text-white font-mono">
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
