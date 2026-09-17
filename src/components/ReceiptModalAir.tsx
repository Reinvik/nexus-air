import React, { useState } from 'react';
import { ServiceOrder, AirSettings } from '../types';
import { formatAirPrice, getTaxPercentage } from '../lib/countries';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Wrench, 
  Thermometer, 
  Wind, 
  FileText,
  User,
  MapPin,
  Calendar,
  Phone,
  Building2,
  DollarSign,
  Layers,
  Download,
  Copy,
  Image as ImageIcon
} from 'lucide-react';

interface ReceiptModalAirProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  settings: AirSettings;
}

export const ReceiptModalAir: React.FC<ReceiptModalAirProps> = ({
  isOpen,
  onClose,
  order,
  settings,
}) => {
  const [showInternalCommission, setShowInternalCommission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!isOpen || !order) return null;

  const currencySymbol = settings.currency_symbol || '₡';
  const countryCode = settings.country_code || 'CR';
  const taxPercent = getTaxPercentage(settings.tax_rate);

  // Calculations
  const calculatedTechPayout = order.technician_payout_type === 'percentage'
    ? Math.round((order.total * (order.technician_payout_value || 0)) / 100)
    : (order.technician_payout_value || 0);

  const calculatedAssistantPayout = order.assigned_assistant_id
    ? (order.assistant_payout_type === 'percentage'
        ? Math.round((order.total * (order.assistant_payout_value || 0)) / 100)
        : (order.assistant_payout_value || 0))
    : 0;

  const handlePrint = () => {
    window.print();
  };

  // Capturar y copiar como imagen PNG lista para pegar con Ctrl+V en WhatsApp (NK-026)
  const handleCopyImageToWhatsApp = async () => {
    const el = document.getElementById('printable-receipt');
    if (!el) return;
    try {
      setIsCapturing(true);
      toast.loading('Generando imagen del comprobante...', { id: 'cap-rec' });
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('No se pudo generar la imagen', { id: 'cap-rec' });
          setIsCapturing(false);
          return;
        }
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          toast.success('¡Imagen copiada al portapapeles! Ahora abre WhatsApp y presiona Ctrl + V para pegarla.', {
            id: 'cap-rec',
            duration: 6000,
          });
          const rawPhone = (order.customer?.phone || '').replace(/\D/g, '');
          if (rawPhone) {
            window.open(`https://wa.me/${rawPhone}`, '_blank');
          }
        } catch (clipErr) {
          console.warn('Clipboard write failed, triggering download:', clipErr);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `comprobante-REC-${order.ticket_number}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Imagen descargada. Puedes adjuntarla en WhatsApp.', { id: 'cap-rec' });
        } finally {
          setIsCapturing(false);
        }
      }, 'image/png');
    } catch (e) {
      console.error('html2canvas error:', e);
      toast.error('Error al capturar comprobante', { id: 'cap-rec' });
      setIsCapturing(false);
    }
  };

  const handleDownloadImage = async () => {
    const el = document.getElementById('printable-receipt');
    if (!el) return;
    try {
      setIsCapturing(true);
      toast.loading('Generando imagen PNG...', { id: 'dl-rec' });
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `comprobante-REC-${order.ticket_number}.png`;
      a.click();
      toast.success('Comprobante descargado en formato PNG', { id: 'dl-rec' });
    } catch (e) {
      toast.error('Error al descargar imagen', { id: 'dl-rec' });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSendWhatsApp = () => {
    const rawPhone = (order.customer?.phone || '').replace(/\D/g, '');
    const clientName = order.customer?.name || 'Estimado(a) Cliente';
    const techName = order.assigned_technician?.name || 'Técnico Especialista';
    const equipInfo = order.equipment ? `${order.equipment.brand} (${order.equipment.btu.toLocaleString()} BTU)` : 'Equipo de Climatización';
    const serialInfo = order.equipment?.serial_number ? `\n• N° de Serie / Serial: ${order.equipment.serial_number}` : '';

    const message = 
      `*COMPROBANTE DE ATENCIÓN TÉCNICA* ❄️\n` +
      `*Folio:* REC-${order.ticket_number}\n` +
      `*Fecha:* ${order.scheduled_date}\n\n` +
      `*Cliente:* ${clientName}\n` +
      `*Dirección:* ${order.customer?.address || ''}, ${order.customer?.commune || ''}\n\n` +
      `🔧 *Detalle del Servicio:*\n` +
      `• Tipo: ${order.service_type.replace('_', ' ').toUpperCase()}\n` +
      `• Equipo: ${equipInfo}${serialInfo}\n` +
      `• Técnico Responsable: ${techName}\n\n` +
      (order.resolution ? `*Trabajo Realizado:* ${order.resolution}\n\n` : '') +
      (order.checklist?.delta_t_celsius ? `*Medición Salto Térmico (ΔT):* ${order.checklist.delta_t_celsius}°C (Óptimo)\n` : '') +
      `──────────────────\n` +
      `*TOTAL:* ${formatAirPrice(order.total, currencySymbol, countryCode)}\n` +
      `*Estado de Pago:* ${order.payment_status.toUpperCase()}\n\n` +
      `_¡Gracias por confiar en ${settings.fantasy_name || settings.company_name}! Mantén tus ambientes frescos y saludables._`;

    const url = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-4 text-slate-900 print:border-none print:shadow-none print:rounded-none print:my-0">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Comprobante / Recibo de Servicio</h3>
              <p className="text-[11px] text-slate-500">Orden #{order.ticket_number}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isCapturing}
              onClick={handleCopyImageToWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Copia la imagen al portapapeles y abre WhatsApp para pegar con Ctrl+V"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Imagen WhatsApp (Ctrl + V)</span>
            </button>

            <button
              type="button"
              disabled={isCapturing}
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Descargar imagen PNG en alta definición"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PNG</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Enviar como texto a WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Texto WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="p-6 sm:p-8 space-y-6 text-xs bg-white" id="printable-receipt">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-none">
                    {settings.fantasy_name || settings.company_name}
                  </h2>
                  <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
                    Climatización & Refrigeración Profesional
                  </span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px] pt-1">
                {settings.tax_id_label || 'RUT/ID'}: <strong className="text-slate-800">{settings.rut || settings.tax_id || 'N/A'}</strong>
              </p>
              <p className="text-slate-500 text-[11px]">
                {[settings.address, settings.commune].filter(Boolean).join(', ') || 'Dirección comercial'} • Tel: {settings.phone || settings.whatsapp_number || 'N/A'}
              </p>
              {settings.website && (
                <p className="text-cyan-700 text-[11px] font-mono">{settings.website}</p>
              )}
            </div>

            <div className="text-left sm:text-right p-4 rounded-2xl bg-slate-50 border border-slate-200 shrink-0 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                COMPROBANTE DE SERVICIO
              </span>
              <div className="font-mono text-base font-black text-cyan-800">
                REC-{order.ticket_number}
              </div>
              <div className="text-[11px] text-slate-600">
                Fecha: <strong className="text-slate-900">{order.scheduled_date}</strong>
              </div>
              <div className="pt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  order.payment_status === 'pagado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  order.payment_status === 'abono' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {order.payment_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Equipment Data Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-600" />
                Datos del Cliente
              </span>
              <h4 className="text-sm font-bold text-slate-900">{order.customer?.name || 'Cliente Particular'}</h4>
              <p className="text-slate-600 text-[11px]">
                {settings.tax_id_label || 'RUT/ID'}: {order.customer?.rut || 'Sin registrar'}
              </p>
              <p className="text-slate-600 text-[11px]">
                Dirección: {[order.customer?.address, order.customer?.commune].filter(Boolean).join(', ') || 'En taller / Domicilio cliente'}
              </p>
              {order.customer?.phone && (
                <p className="text-slate-600 text-[11px]">
                  Tel: {order.customer.phone}
                </p>
              )}
            </div>

            {/* Equipment Box */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Wrench className="w-3 h-3 text-cyan-600" />
                Equipo Intervenido
              </span>
              {order.equipment ? (
                <>
                  <h4 className="text-sm font-bold text-slate-900">
                    {order.equipment.brand} ({order.equipment.btu.toLocaleString()} BTU)
                  </h4>
                  <p className="text-slate-600 text-[11px]">
                    📍 Ubicación: <strong>{order.equipment.location_in_property}</strong>
                  </p>
                  {order.equipment.model && (
                    <p className="text-slate-600 text-[11px]">
                      Modelo: {order.equipment.model}
                    </p>
                  )}
                  {order.equipment.serial_number && (
                    <div className="text-[11px] text-cyan-800 font-mono font-bold flex items-center gap-1 pt-0.5">
                      <span>N° de Serial:</span>
                      <span className="bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">{order.equipment.serial_number}</span>
                    </div>
                  )}
                  <p className="text-slate-600 text-[11px]">
                    Gas: {order.equipment.refrigerant} • Tecnología: {order.equipment.technology.toUpperCase()}
                  </p>
                </>
              ) : (
                <p className="text-slate-500 italic">Equipo registrado en terreno sin ficha previa.</p>
              )}
            </div>
          </div>

          {/* Technical Diagnostics & Work Done */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                Informe de Trabajo & Diagnóstico Técnico
              </span>
              <span className="text-[10px] font-bold text-cyan-700 uppercase">
                Servicio: {order.service_type.replace('_', ' ')}
              </span>
            </div>

            {order.diagnosis && (
              <div>
                <span className="font-bold text-slate-700">Diagnóstico Inicial:</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{order.diagnosis}</p>
              </div>
            )}

            {order.resolution && (
              <div>
                <span className="font-bold text-slate-700">Resolución / Labores Ejecutadas:</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{order.resolution}</p>
              </div>
            )}

            {/* QA Technical Measurements */}
            {order.checklist?.delta_t_celsius && (
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1 font-bold text-cyan-800 font-mono">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Salto Térmico ΔT: {order.checklist.delta_t_celsius}°C</span>
                </div>
                {order.checklist.suction_pressure_psi && (
                  <div className="font-mono text-slate-700">
                    Presión Succión: {order.checklist.suction_pressure_psi} PSI
                  </div>
                )}
                {order.checklist.amperage_amps && (
                  <div className="font-mono text-slate-700">
                    Consumo: {order.checklist.amperage_amps} A
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Descripción del Concepto / Insumo</th>
                  <th className="p-3 text-center w-20">Cant.</th>
                  <th className="p-3 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-800">{it.description}</td>
                      <td className="p-3 text-center font-mono">{it.quantity}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatAirPrice(it.total, currencySymbol, countryCode)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 font-medium text-slate-800">
                      Servicio de {order.service_type.replace('_', ' ')} (Mano de obra y materiales)
                    </td>
                    <td className="p-3 text-center font-mono">1</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatAirPrice(order.total, currencySymbol, countryCode)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col items-end space-y-1">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Subtotal Neto:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatAirPrice(Math.round(order.total / (1 + (taxPercent / 100))), currencySymbol, countryCode)}
                </span>
              </div>
              <div className="flex justify-between w-64 text-slate-600">
                <span>{settings.tax_name || 'IVA'} ({taxPercent}%):</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatAirPrice(order.total - Math.round(order.total / (1 + (taxPercent / 100))), currencySymbol, countryCode)}
                </span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-slate-300 text-sm font-black text-slate-900">
                <span className="uppercase">TOTAL COMPROBANTE:</span>
                <span className="font-mono text-base text-cyan-800">
                  {formatAirPrice(order.total, currencySymbol, countryCode)}
                </span>
              </div>
            </div>
          </div>

          {/* Internal Commission Breakdown (Toggle for administrative / technician verification) */}
          <div className="print:hidden space-y-2">
            <button
              type="button"
              onClick={() => setShowInternalCommission(!showInternalCommission)}
              className="text-xs text-cyan-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{showInternalCommission ? 'Ocultar' : 'Ver'} Desglose de Liquidación Interna (Técnico / Ayudante)</span>
            </button>

            {showInternalCommission && (
              <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-2 text-xs">
                <span className="font-bold text-cyan-900 uppercase text-[10px] tracking-wider block">
                  Desglose Interno de Mano de Obra
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">
                    Técnico Responsable ({order.assigned_technician?.name || 'Técnico'}):
                  </span>
                  <span className="font-mono font-bold text-cyan-900">
                    {formatAirPrice(calculatedTechPayout, currencySymbol, countryCode)}
                  </span>
                </div>
                {order.assigned_assistant_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">
                      Ayudante Asignado ({order.assigned_assistant?.name || 'Ayudante'}):
                    </span>
                    <span className="font-mono font-bold text-cyan-900">
                      {formatAirPrice(calculatedAssistantPayout, currencySymbol, countryCode)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-cyan-200 flex items-center justify-between font-bold text-cyan-950">
                  <span>Total Liquidación Mano de Obra:</span>
                  <span className="font-mono">
                    {formatAirPrice(calculatedTechPayout + calculatedAssistantPayout, currencySymbol, countryCode)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Signatures for physical and printed receipts */}
          <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="border-t border-slate-300 pt-2 space-y-0.5">
              <p className="font-bold text-slate-800">{order.customer?.name || 'Firma del Cliente'}</p>
              <p className="text-[10px] text-slate-400">Recibí conforme el trabajo</p>
            </div>
            <div className="border-t border-slate-300 pt-2 space-y-0.5">
              <p className="font-bold text-slate-800">{order.assigned_technician?.name || 'Técnico Especialista'}</p>
              <p className="text-[10px] text-slate-400">
                {order.assigned_technician?.sec_certified ? 'Instalador Certificado SEC' : 'Técnico HVAC Autorizado'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
