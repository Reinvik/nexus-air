import React from 'react';
import { ServiceOrder, OrderStatus } from '../types';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  ClipboardCheck, 
  CheckCircle2, 
  ArrowRight, 
  Thermometer, 
  Gauge, 
  MessageSquareQuote,
  Sparkles
} from 'lucide-react';

interface KanbanCardAirProps {
  order: ServiceOrder;
  onEdit: (order: ServiceOrder) => void;
  onOpenInspection: (order: ServiceOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const KanbanCardAir: React.FC<KanbanCardAirProps> = ({
  order,
  onEdit,
  onOpenInspection,
  onUpdateStatus,
}) => {
  const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
    ingresado: 'en_ruta',
    en_ruta: 'en_proceso',
    en_proceso: 'pruebas_qa',
    pruebas_qa: 'completado',
    completado: null,
    cancelado: null,
  };

  const nextStatusLabels: Record<OrderStatus, string> = {
    ingresado: 'Despachar en Ruta',
    en_ruta: 'Iniciar Servicio',
    en_proceso: 'Comenzar Pruebas QA',
    pruebas_qa: 'Finalizar y Entregar',
    completado: '',
    cancelado: '',
  };

  const nextStatus = nextStatusMap[order.status];

  const serviceTypeLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    mantencion_preventiva: { label: 'Mantención Semestral (6M)', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    instalacion: { label: 'Instalación Nueva', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    mantencion_correctiva: { label: 'Reparación / Fuga', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    visita_tecnica: { label: 'Factibilidad / Diagnóstico', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    recarga_gas: { label: 'Carga Gas R410A/R32', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  const sType = serviceTypeLabels[order.service_type] || { label: order.service_type, bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-cyan-500/5 transition-all space-y-3 group">
      {/* Header: Ticket number & Service Type */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs font-bold text-slate-400">{order.ticket_number}</span>
          <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            {order.customer?.name || 'Cliente Particular'}
          </h4>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${sType.bg} ${sType.text} ${sType.border}`}>
          {sType.label}
        </span>
      </div>

      {/* Equipment info */}
      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span className="text-cyan-400 font-bold">
            {order.equipment ? `${order.equipment.brand} ${order.equipment.btu.toLocaleString()} BTU` : 'Equipo por Evaluar'}
          </span>
          {order.equipment?.technology && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {order.equipment.technology}
            </span>
          )}
        </div>
        {order.equipment?.location_in_property && (
          <p className="text-slate-400 text-[11px] truncate">
            📍 {order.equipment.location_in_property}
          </p>
        )}
      </div>

      {/* Location and schedule */}
      <div className="space-y-1 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{order.customer?.address || 'Sin dirección'}, {order.customer?.commune}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-cyan-400" />
            {order.scheduled_date}
          </span>
          <span className="flex items-center gap-1 text-slate-300 font-mono">
            <Clock className="w-3 h-3 text-slate-500" />
            {order.scheduled_time_slot}
          </span>
        </div>
      </div>

      {/* Technician & Inspection mini metrics */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] truncate max-w-[110px]">
            {order.assigned_technician?.name.split(' ')[0] || 'Sin asignar'}
          </span>
        </div>

        {/* HVAC readings badge if present */}
        {order.checklist?.delta_t_celsius ? (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 text-[10px] font-mono">
            <Thermometer className="w-3 h-3 text-cyan-400" />
            ΔT {order.checklist.delta_t_celsius}°C
          </span>
        ) : (
          <span className="text-slate-400 font-bold text-xs">
            ${order.total.toLocaleString('es-CL')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={() => onOpenInspection(order)}
          title="Ficha Técnica & Checklist HVAC"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ficha HVAC</span>
        </button>

        <button
          onClick={() => onEdit(order)}
          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
        >
          Editar
        </button>

        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(order.id, nextStatus)}
            title={nextStatusLabels[order.status]}
            className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
