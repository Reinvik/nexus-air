import React from 'react';
import { ServiceOrder, OrderStatus } from '../types';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  ClipboardCheck, 
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

export const getCleanWhatsAppPhone = (phone?: string): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 9 && digits.startsWith('9')) {
    return '56' + digits;
  }
  if (digits.length === 8) {
    return '569' + digits;
  }
  if (digits.length === 11 && digits.startsWith('569')) {
    return digits;
  }
  if (digits.length >= 10) {
    return digits;
  }
  return digits;
};

export const getWhatsAppUrl = (phone?: string, customerName?: string, ticketNumber?: string): string | null => {
  const cleanPhone = getCleanWhatsAppPhone(phone);
  if (!cleanPhone) return null;
  const greeting = customerName ? `Hola ${customerName}` : 'Hola';
  const orderRef = ticketNumber ? ` respecto a tu orden ${ticketNumber}` : '';
  const text = `${greeting}, te contactamos de Clima Control / Nexus Air${orderRef}.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.89-5.451 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.983zm12.336-7.854c-.14-.394-.808-.751-1.125-.793-.317.042-.728.06-2.196-.549-1.874-.777-3.072-2.695-3.166-2.82-.094-.125-.754-1.004-.754-1.916 0-.912.478-1.36.648-1.53.17-.17.37-.213.493-.213.123 0 .247.001.353.006.113.005.263-.043.411.314.155.372.53 1.294.577 1.389.047.095.078.206.015.33-.063.124-.094.201-.188.311-.094.11-.197.247-.282.332-.095.095-.194.198-.083.389.111.191.493.813 1.057 1.316.726.647 1.338.847 1.53.942.192.095.304.079.418-.052.114-.131.488-.568.618-.763.13-.195.261-.163.438-.098.177.065 1.123.53 1.316.626.193.096.321.144.368.225.047.081.047.471-.093.865z" />
  </svg>
);

export const KanbanCardAir: React.FC<KanbanCardAirProps> = ({
  order,
  onEdit,
  onOpenInspection,
  onUpdateStatus,
  onOpenReceipt,
}) => {
  const serviceTypeLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    mantencion_preventiva: { label: 'Mantención (6M)', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    instalacion: { label: 'Instalación', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    mantencion_correctiva: { label: 'Reparación / Fuga', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    reparacion: { label: 'Reparación', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    visita_tecnica: { label: 'Diagnóstico', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    recarga_gas: { label: 'Carga Gas', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    pruebas_qa: { label: 'Pruebas QA', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  };

  const sType = serviceTypeLabels[order.service_type] || { 
    label: order.service_type, 
    bg: 'bg-slate-100', 
    text: 'text-slate-700', 
    border: 'border-slate-200' 
  };

  const customerName = order.customer?.name || order.customer_name || 'Cliente Particular';
  const customerPhone = order.customer?.phone || order.customer_phone;
  const whatsappUrl = getWhatsAppUrl(customerPhone, customerName, order.ticket_number);

  return (
    <div className="bg-white border border-slate-200/90 hover:border-cyan-400 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all space-y-2 group">
      {/* 1. Header: Ticket # & Servicio & Botón WSP */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[11px] font-bold text-slate-500 whitespace-nowrap">
            {order.ticket_number}
          </span>
          <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold border truncate ${sType.bg} ${sType.text} ${sType.border}`}>
            {sType.label}
          </span>
        </div>

        {/* Botón WhatsApp directo */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Hablar por WhatsApp con ${customerName} (${customerPhone})`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] shadow-2xs hover:shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <WhatsAppIcon className="w-2.5 h-2.5" />
            <span>WSP</span>
          </a>
        ) : (
          <span 
            title="Sin teléfono registrado para WhatsApp" 
            className="text-[9px] text-slate-300 font-mono"
          >
            Sin WSP
          </span>
        )}
      </div>

      {/* 2. Cliente y Precio/Delta T */}
      <div className="flex items-center justify-between gap-1">
        <h4 
          onClick={() => onEdit(order)}
          title={`Editar orden de ${customerName}`}
          className="text-xs font-black text-slate-900 group-hover:text-cyan-600 transition-colors truncate cursor-pointer hover:underline"
        >
          {customerName}
        </h4>
        {order.checklist?.delta_t_celsius ? (
          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[9.5px] font-mono font-bold shrink-0">
            <Thermometer className="w-2.5 h-2.5 text-cyan-600" />
            ΔT {order.checklist.delta_t_celsius}°C
          </span>
        ) : (
          <span className="text-slate-900 font-black text-xs font-mono shrink-0">
            ${order.total.toLocaleString('es-CL')}
          </span>
        )}
      </div>

      {/* 3. Equipo HVAC Compacto */}
      <div className="flex items-center justify-between text-[10.5px] bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-0.5">
        <span className="font-semibold text-cyan-900 truncate">
          ❄️ {order.equipment ? `${order.equipment.brand} ${order.equipment.btu.toLocaleString()} BTU` : 'Equipo por Evaluar'}
          {order.equipment?.technology && ` (${order.equipment.technology.toUpperCase()})`}
        </span>
        {order.equipment?.location_in_property && (
          <span className="text-[10px] text-slate-500 font-medium truncate ml-1 shrink-0">
            📍 {order.equipment.location_in_property}
          </span>
        )}
      </div>

      {/* 4. Ubicación, Fecha, Horario y Técnico */}
      <div className="space-y-0.5 text-[10.5px] text-slate-600">
        <div className="flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">
            {order.customer?.address || 'Sin dirección'}{order.customer?.commune ? `, ${order.customer.commune}` : ''}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1 truncate">
            <Calendar className="w-2.5 h-2.5 text-cyan-600 shrink-0" />
            <span>{order.scheduled_date}</span>
            <Clock className="w-2.5 h-2.5 text-slate-400 ml-1 shrink-0" />
            <span className="font-mono text-slate-700">{order.scheduled_time_slot}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-700 font-medium truncate ml-1 shrink-0">
            <User className="w-2.5 h-2.5 text-slate-400" />
            <span className="truncate max-w-[80px]">
              {order.assigned_technician?.name.split(' ')[0] || 'Sin asignar'}
            </span>
          </span>
        </div>
      </div>

      {/* 5. Acciones de Flujo según Estado */}
      <div className="pt-1 border-t border-slate-100 space-y-1.5">
        {order.status === 'ingresado' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'en_ruta')}
            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>🚐 Iniciar Trayecto</span>
          </button>
        )}

        {order.status === 'en_ruta' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'en_proceso')}
            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>📍 Llegué a Terreno</span>
          </button>
        )}

        {order.status === 'en_proceso' && (
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onOpenInspection(order)}
              className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10.5px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Camera className="w-3 h-3 text-amber-600" />
              <span>📸 Evidencia</span>
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'pruebas_qa')}
              className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10.5px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Gauge className="w-3 h-3" />
              <span>🧪 A Pruebas QA</span>
            </button>
          </div>
        )}

        {order.status === 'pruebas_qa' && (
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onOpenInspection(order)}
              className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10.5px] font-bold transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-3 h-3 text-cyan-600" />
              <span>📋 Ficha</span>
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'completado')}
              className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10.5px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>✅ Finalizado</span>
            </button>
          </div>
        )}

        {order.status === 'completado' && (
          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10.5px]">
            <div className="flex items-center gap-1 font-bold text-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Cerrado {order.completed_at ? order.completed_at.replace('T', ' ').slice(11, 16) : ''}</span>
            </div>
            {onOpenReceipt && (
              <button
                onClick={() => onOpenReceipt(order)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
              >
                <FileText className="w-2.5 h-2.5 text-emerald-600" />
                <span>Recibo</span>
              </button>
            )}
          </div>
        )}

        {/* 6. Botones Secundarios: Ficha HVAC y Editar */}
        <div className="flex items-center gap-1 pt-0.5">
          <button
            onClick={() => onOpenInspection(order)}
            title="Ficha Técnica & Checklist HVAC"
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10.5px] font-medium transition-colors cursor-pointer border border-slate-200"
          >
            <ClipboardCheck className="w-3 h-3 text-cyan-600" />
            <span>Ficha HVAC</span>
          </button>

          <button
            onClick={() => onEdit(order)}
            title="Editar Orden Completa"
            className="py-1 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold transition-colors cursor-pointer border border-slate-200"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

