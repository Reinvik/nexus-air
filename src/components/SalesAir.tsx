import React, { useMemo } from 'react';
import { ServiceOrder } from '../types';
import { TrendingUp, DollarSign, Calendar, CheckCircle2, ShieldCheck, Layers, CreditCard } from 'lucide-react';

interface SalesAirProps {
  orders: ServiceOrder[];
}

export const SalesAir: React.FC<SalesAirProps> = ({ orders }) => {
  const stats = useMemo(() => {
    let totalIngresos = 0;
    let mantencionesTotal = 0;
    let instalacionesTotal = 0;
    let completadas = 0;

    orders.forEach(o => {
      totalIngresos += o.total;
      if (o.service_type === 'mantencion_preventiva') {
        mantencionesTotal += o.total;
      }
      if (o.service_type === 'instalacion') {
        instalacionesTotal += o.total;
      }
      if (o.status === 'completado') {
        completadas++;
      }
    });

    const ticketPromedio = orders.length > 0 ? Math.round(totalIngresos / orders.length) : 0;

    return { totalIngresos, mantencionesTotal, instalacionesTotal, completadas, ticketPromedio };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ventas & Métricas Financieras HVAC</h2>
            <p className="text-xs text-slate-400">
              Rendimiento por venta de equipos e ingresos recurrentes de mantención semestral
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Facturación Total</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ${stats.totalIngresos.toLocaleString('es-CL')}
          </p>
          <p className="text-[11px] text-slate-500">Monto total con IVA</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-cyan-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mantenciones (6 Meses)</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400 font-mono">
            ${stats.mantencionesTotal.toLocaleString('es-CL')}
          </p>
          <p className="text-[11px] text-cyan-400/80">Ingreso recurrente periódico</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-blue-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Venta & Instalación</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 font-mono">
            ${stats.instalacionesTotal.toLocaleString('es-CL')}
          </p>
          <p className="text-[11px] text-blue-400/80">Equipos nuevos instalados</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-emerald-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ticket Promedio</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            ${stats.ticketPromedio.toLocaleString('es-CL')}
          </p>
          <p className="text-[11px] text-emerald-400/80">Por servicio técnico</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Historial de Órdenes & Facturación</h3>
          <span className="text-xs text-slate-400">{orders.length} órdenes registradas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Tipo de Trabajo</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Estado Pago</th>
                <th className="py-3 px-4 text-right">Total Facturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{o.ticket_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{o.customer?.name}</div>
                    <div className="text-[10px] text-slate-500">{o.customer?.commune}</div>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-300">
                    {o.service_type.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{o.scheduled_date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      o.payment_status === 'pagado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      o.payment_status === 'abono' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                    ${o.total.toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
