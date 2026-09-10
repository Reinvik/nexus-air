import React, { useState, useMemo } from 'react';
import { ServiceOrder, OrderStatus, Technician } from '../types';
import { KanbanCardAir } from './KanbanCardAir';
import { 
  Search, 
  Filter, 
  Plus, 
  Inbox, 
  Truck, 
  Wrench, 
  CheckCircle, 
  Gauge
} from 'lucide-react';

interface KanbanBoardAirProps {
  orders: ServiceOrder[];
  technicians: Technician[];
  onOpenNewOrder: () => void;
  onEditOrder: (order: ServiceOrder) => void;
  onOpenInspection: (order: ServiceOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const COLUMNS: { id: OrderStatus; title: string; icon: React.ElementType; color: string; badgeColor: string }[] = [
  { id: 'ingresado', title: 'Solicitudes / Nuevas', icon: Inbox, color: 'border-slate-200 bg-slate-100/70', badgeColor: 'bg-slate-200 text-slate-700' },
  { id: 'en_ruta', title: 'Técnico en Ruta', icon: Truck, color: 'border-blue-200 bg-blue-50/50', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'en_proceso', title: 'En Terreno / Mantención', icon: Wrench, color: 'border-cyan-200 bg-cyan-50/50', badgeColor: 'bg-cyan-100 text-cyan-800' },
  { id: 'pruebas_qa', title: 'Medición & Pruebas QA', icon: Gauge, color: 'border-amber-200 bg-amber-50/50', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'completado', title: 'Finalizado / Entregado', icon: CheckCircle, color: 'border-emerald-200 bg-emerald-50/50', badgeColor: 'bg-emerald-100 text-emerald-800' },
];

export const KanbanBoardAir: React.FC<KanbanBoardAirProps> = ({
  orders,
  technicians,
  onOpenNewOrder,
  onEditOrder,
  onOpenInspection,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTech, setFilterTech] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        ord.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.customer?.commune || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.equipment?.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || ord.service_type === filterType;
      const matchTech = filterTech === 'all' || ord.assigned_technician_id === filterTech;

      return matchSearch && matchType && matchTech;
    });
  }, [orders, searchTerm, filterType, filterTech]);

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Filters & Control Bar in Pure White */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ticket, cliente, comuna o equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Service Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Servicios</option>
              <option value="mantencion_preventiva">Mantención Semestral (6M)</option>
              <option value="instalacion">Instalación Nueva</option>
              <option value="mantencion_correctiva">Reparación / Fuga</option>
              <option value="visita_tecnica">Visita Factibilidad</option>
              <option value="recarga_gas">Carga Gas R410A/R32</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <select
              value={filterTech}
              onChange={(e) => setFilterTech(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Técnicos</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.sec_certified ? '(SEC)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* New Order Button */}
        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva Orden de Servicio</span>
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto min-h-[600px] pb-4">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((ord) => ord.status === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border ${col.color} p-3.5 shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4 text-cyan-700" />
                  <h3 className="text-xs font-bold text-slate-800">{col.title}</h3>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${col.badgeColor}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
                    <span>Sin órdenes activas</span>
                  </div>
                ) : (
                  colOrders.map((ord) => (
                    <KanbanCardAir
                      key={ord.id}
                      order={ord}
                      onEdit={onEditOrder}
                      onOpenInspection={onOpenInspection}
                      onUpdateStatus={onUpdateStatus}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
