import React, { useState, useMemo, useRef } from 'react';
import { AirSettings, AirPart, ServiceOrder, CustomerAir } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Building2, 
  User, 
  DollarSign, 
  Package, 
  Wrench,
  Snowflake
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface ProformaItem {
  id: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'equipo' | 'instalacion' | 'material';
}

interface ProformaModalAirProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedBtu: number;
  recommendedTon?: number;
  areaM2?: number;
  parts: AirPart[];
  settings?: AirSettings | null;
  customers?: CustomerAir[];
  onCreateOrder?: (orderData: Partial<ServiceOrder>) => void;
}

export function ProformaModalAir({
  isOpen,
  onClose,
  recommendedBtu,
  recommendedTon = 1.0,
  areaM2 = 20,
  parts,
  settings,
  customers = [],
  onCreateOrder,
}: ProformaModalAirProps) {
  const currencySymbol = settings?.currency_symbol || '₡';
  const taxRatePercent = settings?.tax_rate !== undefined ? settings.tax_rate : 13; // 13% en Costa Rica

  // Datos del Cliente en la proforma
  const [clientName, setClientName] = useState('Cliente Empresa / Particular');
  const [clientIdNumber, setClientIdNumber] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [proformaFolio, setProformaFolio] = useState(() => `PF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [emissionDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Selección de equipo
  const availableEquipments = useMemo(() => {
    const equips = parts.filter(p => p.category === 'equipo');
    if (equips.length > 0) return equips;
    // Fallback de catálogo estándar si aún no han registrado en inventario
    return [
      { id: 'eq-9k', name: 'A.A ECOLD 9K BTU SEER 21.5 INVERTER CON WIFI (0.75 Ton)', sale_price: 180000, btu: 9000, category: 'equipo' },
      { id: 'eq-12k', name: 'A.A ECOLD 12K BTU SEER 21.5 INVERTER CON WIFI (1.0 Ton)', sale_price: 200000, btu: 12000, category: 'equipo' },
      { id: 'eq-15k', name: 'A.A ECOLD 15K BTU SEER 20 INVERTER (1.25 Ton)', sale_price: 260000, btu: 15000, category: 'equipo' },
      { id: 'eq-18k', name: 'A.A ECOLD 18K BTU SEER 20 INVERTER CON WIFI (1.5 Ton)', sale_price: 295000, btu: 18000, category: 'equipo' },
      { id: 'eq-24k', name: 'A.A ECOLD 24K BTU SEER 20 INVERTER CON WIFI (2.0 Ton)', sale_price: 395000, btu: 24000, category: 'equipo' },
      { id: 'eq-36k', name: 'A.A ECOLD 36K BTU PISO-CIELO / CASSETTE (3.0 Ton)', sale_price: 680000, btu: 36000, category: 'equipo' },
    ] as AirPart[];
  }, [parts]);

  // Equipo inicial emparejado al BTU recomendado
  const defaultEquip = useMemo(() => {
    return availableEquipments.find(e => e.btu === recommendedBtu) || availableEquipments[0];
  }, [availableEquipments, recommendedBtu]);

  const [selectedEquipId, setSelectedEquipId] = useState<string>(defaultEquip?.id || 'eq-12k');
  const [equipmentPrice, setEquipmentPrice] = useState<number>(defaultEquip?.sale_price || 200000);
  const [equipmentQty, setEquipmentQty] = useState<number>(1);

  // Al cambiar la recomendación inicial
  React.useEffect(() => {
    if (defaultEquip) {
      setSelectedEquipId(defaultEquip.id);
      setEquipmentPrice(defaultEquip.sale_price || 200000);
    }
  }, [defaultEquip]);

  // Mano de Obra y Materiales de Instalación (basado en la proforma real de Costa Rica)
  const [installationItems, setInstallationItems] = useState<ProformaItem[]>([
    { id: 'mat-1', concept: 'MANO DE OBRA DE INSTALACION', quantity: 1, unitPrice: 80000, total: 80000, type: 'instalacion' },
    { id: 'mat-2', concept: 'BASE DE CONDENSADO', quantity: 1, unitPrice: 15000, total: 15000, type: 'material' },
    { id: 'mat-3', concept: 'PROTECTOR DE VOLTAJE', quantity: 1, unitPrice: 16000, total: 16000, type: 'material' },
    { id: 'mat-4', concept: 'BREAKER', quantity: 1, unitPrice: 15500, total: 15500, type: 'material' },
    { id: 'mat-5', concept: 'TORNILLERIA Y ANCLAJES', quantity: 1, unitPrice: 5000, total: 5000, type: 'material' },
    { id: 'mat-6', concept: 'DURETAN Y SELLOS', quantity: 1, unitPrice: 7000, total: 7000, type: 'material' },
    { id: 'mat-7', concept: 'CABLE 3X12 USO RUDO (Metros)', quantity: 10, unitPrice: 1700, total: 17000, type: 'material' },
  ]);

  const currentEquipment = availableEquipments.find(e => e.id === selectedEquipId) || defaultEquip;

  const handleSelectEquipment = (id: string) => {
    setSelectedEquipId(id);
    const found = availableEquipments.find(e => e.id === id);
    if (found) {
      setEquipmentPrice(found.sale_price || 200000);
    }
  };

  const handleItemChange = (id: string, field: 'quantity' | 'unitPrice' | 'concept', value: any) => {
    setInstallationItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
      }
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setInstallationItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: ProformaItem = {
      id: `mat-${Date.now()}`,
      concept: 'NUEVO MATERIAL O SERVICIO',
      quantity: 1,
      unitPrice: 10000,
      total: 10000,
      type: 'material'
    };
    setInstallationItems(prev => [...prev, newItem]);
  };

  // Totales
  const subtotalEquipos = equipmentPrice * equipmentQty;
  const subtotalInstalacion = installationItems.reduce((acc, it) => acc + (it.total || 0), 0);
  const subTotalDirecto = subtotalEquipos + subtotalInstalacion;
  const montoIva = Math.round(subTotalDirecto * (taxRatePercent / 100));
  const precioVentaTotal = subTotalDirecto + montoIva;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phone = clientPhone.replace(/\D/g, '');
    const msg = `*PROFORMA OFICIAL DE CLIMATIZACIÓN* ❄️\n` +
      `*Folio:* ${proformaFolio}\n` +
      `*Cliente:* ${clientName}\n\n` +
      `📦 *Equipo Cotizado:* ${currentEquipment?.name || 'Split Inverter'}\n` +
      `• Cantidad: ${equipmentQty} un.\n` +
      `• Precio Equipo: ${currencySymbol}${subtotalEquipos.toLocaleString('es-CR')}\n\n` +
      `🔧 *Instalación y Materiales:* ${currencySymbol}${subtotalInstalacion.toLocaleString('es-CR')}\n` +
      `──────────────────\n` +
      `*Subtotal:* ${currencySymbol}${subTotalDirecto.toLocaleString('es-CR')}\n` +
      `*IVA (${taxRatePercent}%):* ${currencySymbol}${montoIva.toLocaleString('es-CR')}\n` +
      `*TOTAL FINAL:* ${currencySymbol}${precioVentaTotal.toLocaleString('es-CR')}\n\n` +
      `_Validez: 30 días. Incluye garantía de instalación._\n` +
      `${settings?.fantasy_name || settings?.company_name || 'Climatización Profesional'}`;

    const url = `https://wa.me/${phone ? (phone.length <= 8 ? `506${phone}` : phone) : ''}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleConvertToOrder = () => {
    if (onCreateOrder) {
      onCreateOrder({
        service_type: 'instalacion',
        status: 'ingresado',
        customer_name: clientName,
        customer_phone: clientPhone,
        customer_email: clientEmail,
        description: `Instalación dimensionada con Proforma ${proformaFolio}: ${currentEquipment?.name || 'Equipo'} para área de ${areaM2} m².`,
        items: [
          {
            id: `eq-${Date.now()}`,
            description: currentEquipment?.name || `Equipo Split Inverter ${recommendedBtu} BTU`,
            quantity: equipmentQty,
            unit_price: equipmentPrice,
            total: subtotalEquipos,
            type: 'equipo',
          },
          ...installationItems.map(item => ({
            id: item.id,
            description: item.concept,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.total,
            type: (item.type === 'instalacion' ? 'servicio' : 'insumo') as any,
          }))
        ],
        subtotal: subTotalDirecto,
        tax: montoIva,
        total: precioVentaTotal,
        payment_status: 'pendiente',
      });
      toast.success('¡Proforma convertida exitosamente en Orden de Servicio!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Proforma / Cotización Oficial de Climatización</h2>
              <p className="text-[11px] text-slate-400">Documento listo para evaluación corporativa o cliente residencial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-colors"
              title="Imprimir o guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            {onCreateOrder && (
              <button
                onClick={handleConvertToOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Crear Orden</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Proforma Sheet Content (Clean, Professional Print Layout matching Costa Rica specimen) */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-white text-slate-800">
          
          {/* Header Row: Logo/Brand & Document Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-slate-200">
            <div className="flex items-center gap-4">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <Snowflake className="w-9 h-9" />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {settings?.fantasy_name || settings?.company_name || 'CLIMACONTROL CR'}
                </h1>
                <p className="text-xs text-slate-500 font-medium">Sistemas Profesionales de Aire Acondicionado & HVAC</p>
              </div>
            </div>

            {/* Proforma Box */}
            <div className="sm:text-right border border-slate-300 rounded-xl overflow-hidden shrink-0 shadow-xs">
              <div className="bg-slate-800 text-white px-6 py-1.5 font-black text-center text-sm tracking-widest uppercase">
                PROFORMA
              </div>
              <div className="p-2.5 bg-slate-50 text-xs font-mono space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-sans">N° Folio:</span>
                  <input
                    type="text"
                    value={proformaFolio}
                    onChange={e => setProformaFolio(e.target.value)}
                    className="font-bold text-slate-800 text-right bg-transparent border-b border-dashed border-slate-300 w-24 focus:outline-none"
                  />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-sans">Fecha:</span>
                  <span className="font-bold text-slate-800">{emissionDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Company Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DATOS DEL CLIENTE */}
            <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50/20">
              <div className="bg-blue-600 text-white px-3.5 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                DATOS DEL CLIENTE
              </div>
              <div className="p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Nombre:</span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="flex-1 font-bold text-slate-900 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="Nombre o Razón Social..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Cédula/ID:</span>
                  <input
                    type="text"
                    value={clientIdNumber}
                    onChange={e => setClientIdNumber(e.target.value)}
                    className="flex-1 text-slate-800 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="Cédula Física / Jurídica..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Correo:</span>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="flex-1 text-slate-800 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Teléfono:</span>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="flex-1 text-slate-800 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="Número de teléfono..."
                  />
                </div>
              </div>
            </div>

            {/* DATOS DE LA EMPRESA */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-700 text-white px-3.5 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                DATOS DE LA EMPRESA
              </div>
              <div className="p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Nombre:</span>
                  <span className="font-bold text-slate-900">{settings?.fantasy_name || settings?.company_name || 'CLIMACONTROL CR'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Dirección:</span>
                  <span className="text-slate-800 text-right">{settings?.address || 'SAN JOSÉ, COSTA RICA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Correo:</span>
                  <span className="text-slate-800">{settings?.email || 'contacto@climacontrol.cr'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Teléfono:</span>
                  <span className="text-slate-800 font-mono font-bold">{settings?.phone || '6156-3703'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Detalle de Costos y Precios */}
          <div className="space-y-4">
            <div className="bg-blue-600 text-white px-4 py-2 font-black text-sm uppercase tracking-wider rounded-lg flex items-center justify-between">
              <span>Detalle de Costos y Precios</span>
              <span className="text-[11px] font-normal opacity-90">Moneda: {currencySymbol} ({settings?.country || 'Costa Rica'})</span>
            </div>

            {/* 1. Venta de Equipos de Aire Acondicionado */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-blue-100 text-blue-900 font-bold px-4 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Venta de Equipos de Aire Acondicionado</span>
                <span className="text-[11px] text-blue-700 font-medium">Recomendado para {areaM2} m²: {recommendedBtu.toLocaleString()} BTU ({recommendedTon} Ton)</span>
              </div>

              {/* Selector de equipo interactivo */}
              <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 print:hidden">
                <span className="text-xs font-bold text-slate-700 shrink-0">Cambiar Modelo de Equipo:</span>
                <select
                  value={selectedEquipId}
                  onChange={e => handleSelectEquipment(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableEquipments.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} — {currencySymbol}{(eq.sale_price || 0).toLocaleString('es-CR')}
                    </option>
                  ))}
                </select>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                    <th className="p-3">Concepto</th>
                    <th className="p-3 text-center w-20">Cantidad</th>
                    <th className="p-3 text-right w-36">Precio Unitario</th>
                    <th className="p-3 text-right w-36">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">
                      {currentEquipment?.name || `A.A ECOLD ${recommendedBtu / 1000}K BTU SEER 21.5 INVERTER CON WIFI`}
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={equipmentQty}
                        onChange={e => setEquipmentQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 text-center py-0.5 border rounded border-slate-300 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <span>{currencySymbol}</span>
                        <input
                          type="number"
                          min="0"
                          value={equipmentPrice}
                          onChange={e => setEquipmentPrice(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 text-right py-0.5 border rounded border-slate-300 font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {currencySymbol}{subtotalEquipos.toLocaleString('es-CR')}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                    <td colSpan={3} className="p-2.5 text-right uppercase text-slate-700">Subtotal Equipos:</td>
                    <td className="p-2.5 text-right font-mono text-slate-900">{currencySymbol}{subtotalEquipos.toLocaleString('es-CR')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. Mano de Obra y Materiales de Instalación */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-blue-100 text-blue-900 font-bold px-4 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>(Mano de Obra y Materiales de Instalación)</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded border border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar Ítem</span>
                </button>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                    <th className="p-3">Concepto</th>
                    <th className="p-3 text-center w-20">Cantidad</th>
                    <th className="p-3 text-right w-36">Precio Unitario</th>
                    <th className="p-3 text-right w-36">Total</th>
                    <th className="p-3 text-center w-10 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {installationItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.concept}
                          onChange={e => handleItemChange(item.id, 'concept', e.target.value)}
                          className="w-full font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none uppercase"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-14 text-center py-0.5 border rounded border-slate-200 font-medium focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        <div className="flex items-center justify-end gap-1">
                          <span>{currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                            className="w-24 text-right py-0.5 border rounded border-slate-200 font-mono focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                        {currencySymbol}{(item.total || 0).toLocaleString('es-CR')}
                      </td>
                      <td className="p-2.5 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                    <td colSpan={3} className="p-2.5 text-right uppercase text-slate-700">Subtotal Instalación:</td>
                    <td className="p-2.5 text-right font-mono text-slate-900">{currencySymbol}{subtotalInstalacion.toLocaleString('es-CR')}</td>
                    <td className="print:hidden"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Totals Summary Card (Exact match with specimen) */}
            <div className="flex flex-col sm:flex-row justify-end">
              <div className="w-full sm:w-80 border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 uppercase">Sub Total</span>
                  <span className="font-mono font-bold text-slate-900">{currencySymbol}{subTotalDirecto.toLocaleString('es-CR')}</span>
                </div>
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 uppercase">IVA ({taxRatePercent}% sobre Costo Directo)</span>
                  <span className="font-mono font-bold text-slate-900">{currencySymbol}{montoIva.toLocaleString('es-CR')}</span>
                </div>
                <div className="p-4 bg-blue-600 text-white flex justify-between items-center text-sm font-black">
                  <span className="uppercase tracking-wide">Precio de Venta Total</span>
                  <span className="font-mono text-lg">{currencySymbol}{precioVentaTotal.toLocaleString('es-CR')}</span>
                </div>
              </div>
            </div>

            {/* Legal Footnote */}
            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
              <p className="text-[11px] text-slate-600 font-medium italic">
                Esta proforma tiene una validez de 30 días y está sujeta a cambios de precio en los materiales de instalación.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info in Modal */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>💡 Puedes editar cualquier cantidad o precio directamente en la tabla antes de imprimir o enviar.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
