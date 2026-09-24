import React from 'react';
import { ServiceOrder, OrderStatus } from '../types';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  ClipboardCheck, 
  ArrowRight, 
  Thermometer, 
  Gauge,
  Truck,
  Camera,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface KanbanCardAirProps {
  order: ServiceOrder;
  onEdit: (order: ServiceOrder) => void;
  onOpenInspection: (order: ServiceOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenReceipt?: (order: ServiceOrder) => void;
}

export const KanbanCardAir: React.FC<KanbanCardAirProps> = ({
  order,
  onEdit,
  onOpenInspection,
  onUpdateStatus,
  onOpenReceipt,
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
    mantencion_preventiva: { label: 'Mantención Semestral (6M)', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    instalacion: { label: 'Instalación Nueva', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    mantencion_correctiva: { label: 'Reparación / Fuga', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    visita_tecnica: { label: 'Factibilidad / Diagnóstico', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    recarga_gas: { label: 'Carga Gas R410A/R32', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const sType = serviceTypeLabels[order.service_type] || { label: order.service_type, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <div className="bg-white border border-slate-200/90 hover:border-cyan-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 group">
      {/* Header: Ticket number & Service Type */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs font-bold text-slate-400">{order.ticket_number}</span>
          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-1">
            {order.customer?.name || 'Cliente Particular'}
          </h4>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${sType.bg} ${sType.text} ${sType.border}`}>
          {sType.label}
        </span>
      </div>

      {/* Equipment info */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-800 font-semibold">
          <span className="text-cyan-700 font-bold">
            {order.equipment ? `${order.equipment.brand} ${order.equipment.btu.toLocaleString()} BTU` : 'Equipo por Evaluar'}
          </span>
          {order.equipment?.technology && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
              {order.equipment.technology}
            </span>
          )}
        </div>
        {order.equipment?.location_in_property && (
          <p className="text-slate-500 text-[11px] truncate">
            📍 {order.equipment.location_in_property}
          </p>
        )}
      </div>

      {/* Location and schedule */}
      <div className="space-y-1 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{order.customer?.address || 'Sin dirección'}, {order.customer?.commune}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-cyan-600" />
            {order.scheduled_date}
          </span>
          <span className="flex items-center gap-1 text-slate-700 font-mono font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            {order.scheduled_time_slot}
          </span>
        </div>
      </div>

      {/* Technician & Inspection mini metrics */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] truncate max-w-[110px]">
            {order.assigned_technician?.name.split(' ')[0] || 'Sin asignar'}
          </span>
        </div>

        {/* HVAC readings badge if present */}
        {order.checklist?.delta_t_celsius ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-mono font-bold">
            <Thermometer className="w-3 h-3 text-cyan-600" />
            ΔT {order.checklist.delta_t_celsius}°C
          </span>
        ) : (
          <span className="text-slate-900 font-black text-xs font-mono">
            ${order.total.toLocaleString('es-CL')}
          </span>
        )}
      </div>

      {/* Workflow Quick Advance Buttons (NK-023) */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        {order.status === 'ingresado' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'en_ruta')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>🚐 Iniciar Trayecto</span>
          </button>
        )}

        {order.status === 'en_ruta' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'en_proceso')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>📍 Llegué a Terreno</span>
          </button>
        )}

        {order.status === 'en_proceso' && (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onOpenInspection(order)}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>📸 Subir Evidencia</span>
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'pruebas_qa')}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>🧪 A Pruebas QA</span>
            </button>
          </div>
        )}

        {order.status === 'pruebas_qa' && (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onOpenInspection(order)}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Revisar Ficha</span>
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'completado')}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✅ Finalizado</span>
            </button>
          </div>
        )}

        {order.status === 'completado' && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <div className="flex flex-col text-emerald-800">
              <div className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Servicio Finalizado</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">
                {order.completed_at 
                  ? `Cerrado: ${order.completed_at.replace('T', ' ').slice(0, 16)}` 
                  : `Cerrado: ${order.scheduled_date || 'Hoy'}`}
              </span>
            </div>
            {onOpenReceipt && (
              <button
                onClick={() => onOpenReceipt(order)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              >
                <FileText className="w-3 h-3 text-emerald-600" />
                <span>Recibo</span>
              </button>
            )}
          </div>
        )}

        {/* Secondary Actions: Ficha & Editar */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => onOpenInspection(order)}
            title="Ficha Técnica & Checklist HVAC"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Ficha HVAC</span>
          </button>

          <button
            onClick={() => onEdit(order)}
            className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};
