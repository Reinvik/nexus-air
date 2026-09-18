import React, { useMemo } from 'react';
import { ServiceOrder, AirSettings } from '../types';
import { formatAirPrice } from '../lib/countries';
import { TrendingUp, DollarSign, Calendar, CheckCircle2, ShieldCheck, Layers, CreditCard } from 'lucide-react';

interface SalesAirProps {
  orders: ServiceOrder[];
  settings?: AirSettings;
}

export const SalesAir: React.FC<SalesAirProps> = ({ orders, settings }) => {
  const currencySymbol = settings?.currency_symbol || '₡';
  const countryCode = settings?.country_code || 'CR';

  const stats = useMemo(() => {
    let totalIngresos = 0;
    let totalCobrado = 0;
    let totalPendiente = 0;
    let totalAbonado = 0;
    let totalSubtotal = 0;
    let totalTax = 0;

    let mantencionesTotal = 0;
    let instalacionesTotal = 0;
    let reparacionesTotal = 0;
    let completadas = 0;
    let activas = 0;

    orders.forEach(o => {
      // Excluir órdenes canceladas de los ingresos
      if (o.status === 'cancelado') return;

      activas++;
      const orderTotal = Number(o.total) || 0;
      const orderSubtotal = o.subtotal !== undefined ? Number(o.subtotal) : orderTotal;
      const orderTax = o.tax !== undefined ? Number(o.tax) : 0;

      totalIngresos += orderTotal;
      totalSubtotal += orderSubtotal;
      totalTax += orderTax;

      if (o.payment_status === 'pagado') {
        totalCobrado += orderTotal;
      } else if (o.payment_status === 'abono') {
        totalAbonado += orderTotal;
      } else {
        totalPendiente += orderTotal;
      }

      const sType = o.service_type || '';
      if (sType.includes('mantencion') || sType === 'recaptacion') {
        mantencionesTotal += orderTotal;
      } else if (sType.includes('instalacion')) {
        instalacionesTotal += orderTotal;
      } else {
        reparacionesTotal += orderTotal;
      }

      if (o.status === 'completado') {
        completadas++;
      }
    });

    const ticketPromedio = activas > 0 ? Math.round(totalIngresos / activas) : 0;

    return { 
      totalIngresos, 
      totalCobrado,
      totalPendiente,
      totalAbonado,
      totalSubtotal,
      totalTax,
      mantencionesTotal, 
      instalacionesTotal, 
      reparacionesTotal,
      completadas, 
      activas,
      ticketPromedio 
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ventas & Métricas Financieras HVAC</h2>
            <p className="text-xs text-slate-500">
              Rendimiento por venta de equipos e ingresos recurrentes de mantención semestral
            </p>
          </div>
        </div>

        {/* Resumen de cobros */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cobrado: <strong>{formatAirPrice(stats.totalCobrado, currencySymbol, countryCode)}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1.5 font-medium">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Por Cobrar: <strong>{formatAirPrice(stats.totalPendiente, currencySymbol, countryCode)}</strong></span>
          </div>
        </div>
      </div>

      {/* Vibrant Colored KPI Cards (Estilo Nexus Lean) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facturación Total - Vibrant Purple Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Facturación Total Activa</span>
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            {formatAirPrice(stats.totalIngresos, currencySymbol, countryCode)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
            <span>{stats.activas} órdenes activas</span>
            <span>Cobrado: {Math.round(stats.totalIngresos > 0 ? (stats.totalCobrado / stats.totalIngresos) * 100 : 0)}%</span>
          </div>
        </div>

        {/* Mantenciones 6M - Vibrant Cyan/Blue Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Mantenciones (6 Meses)</span>
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            {formatAirPrice(stats.mantencionesTotal, currencySymbol, countryCode)}
          </p>
          <p className="text-[11px] text-white/80">Ingreso recurrente semestral</p>
        </div>

        {/* Venta & Instalación - Vibrant Emerald Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Venta & Instalación</span>
            <Layers className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            {formatAirPrice(stats.instalacionesTotal, currencySymbol, countryCode)}
          </p>
          <p className="text-[11px] text-white/80">Equipos nuevos montados</p>
        </div>

        {/* Ticket Promedio - Vibrant Amber Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
            <span>Ticket Promedio</span>
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black font-mono tracking-tight">
            {formatAirPrice(stats.ticketPromedio, currencySymbol, countryCode)}
          </p>
          <p className="text-[11px] text-white/80">Calculado sobre órdenes válidas</p>
        </div>
      </div>

      {/* Orders Table in Crisp White */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-sm text-slate-800">Historial de Órdenes & Facturación</h3>
          <span className="text-xs text-slate-500">{orders.length} órdenes registradas ({stats.activas} activas)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Tipo de Trabajo</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Estado Orden</th>
                <th className="py-3 px-4">Estado Pago</th>
                <th className="py-3 px-4 text-right">Total Facturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const isCanceled = o.status === 'cancelado';
                return (
                  <tr key={o.id} className={`hover:bg-slate-50/80 transition-colors ${isCanceled ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">{o.ticket_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{o.customer?.name}</div>
                      <div className="text-[10px] text-slate-400">{o.customer?.commune}</div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-700 font-medium">
                      {o.service_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{o.scheduled_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                        o.status === 'completado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        o.status === 'en_proceso' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        o.status === 'cancelado' ? 'bg-rose-50 text-rose-700 border border-rose-200 line-through' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        o.payment_status === 'pagado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        o.payment_status === 'abono' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-black text-sm ${isCanceled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {formatAirPrice(o.total, currencySymbol, countryCode)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
