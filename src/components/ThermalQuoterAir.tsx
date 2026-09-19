import React, { useState, useMemo } from 'react';
import { calculateThermalLoad, getCostaRicaTableBtu } from '../lib/thermalCalculator';
import { ThermalCalculationInput, AirPart, ServiceOrder, AirSettings, CustomerAir } from '../types';
import { 
  Calculator, 
  Sun, 
  Users, 
  Home, 
  Share2, 
  Sparkles, 
  Plus,
  Snowflake,
  Flame,
  FileText,
  MapPin,
  Building,
  Tv,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProformaModalAir } from './ProformaModalAir';

interface ThermalQuoterAirProps {
  parts: AirPart[];
  settings?: AirSettings | null;
  customers?: CustomerAir[];
  onCreateOrderFromQuote: (orderData: Partial<ServiceOrder>) => void;
}

export const ThermalQuoterAir: React.FC<ThermalQuoterAirProps> = ({
  parts,
  settings,
  customers = [],
  onCreateOrderFromQuote,
}) => {
  const currencySymbol = settings?.currency_symbol || '₡';

  const [input, setInput] = useState<ThermalCalculationInput>({
    area_m2: 20,
    ceiling_height_m: 2.5,
    sun_exposure: 'media',
    room_type: 'living',
    people_count: 2,
    electronic_load: 'media',
    climate_zone: 'costera_calida', // Costa Rica: 600 BTU/m² Templada vs 700 BTU/m² Cálida/Costera
    use_type: 'residencial',
    electronics_count: 1,
    large_windows_sun: false,
  });

  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [includeCondensatePump, setIncludeCondensatePump] = useState(false);
  const [extraMetersCopper, setExtraMetersCopper] = useState(0);
  const [isProformaOpen, setIsProformaOpen] = useState(false);
  const [showRefTable, setShowRefTable] = useState(false);

  const result = useMemo(() => {
    return calculateThermalLoad(input);
  }, [input]);

  const matchedEquipment = useMemo(() => {
    return parts.find(p => p.category === 'equipo' && p.btu === result.recommended_btu) ||
           parts.find(p => p.category === 'equipo') || null;
  }, [parts, result.recommended_btu]);

  const [customInstallationPrice, setCustomInstallationPrice] = useState<number | null>(null);
  const [customPumpPrice, setCustomPumpPrice] = useState<number | null>(null);

  // Precios base en Costa Rica / moneda local
  const equipmentPrice = matchedEquipment?.sale_price || (
    result.recommended_btu <= 9000 ? 180000 :
    result.recommended_btu <= 12000 ? 200000 :
    result.recommended_btu <= 15000 ? 260000 :
    result.recommended_btu <= 18000 ? 295000 :
    result.recommended_btu <= 24000 ? 395000 : 680000
  );

  const defaultInstallationBasePrice = (
    result.recommended_btu <= 12000 ? 80000 :
    result.recommended_btu <= 18000 ? 95000 : 120000
  );

  const installationBasePrice = includeInstallation
    ? (customInstallationPrice !== null ? customInstallationPrice : defaultInstallationBasePrice)
    : 0;

  const defaultPumpPrice = 45000;
  const pumpPrice = includeCondensatePump
    ? (customPumpPrice !== null ? customPumpPrice : defaultPumpPrice)
    : 0;
  const extraCopperPrice = extraMetersCopper * 12000;

  const subtotal = equipmentPrice + installationBasePrice + pumpPrice + extraCopperPrice;
  const taxRate = (settings?.tax_rate !== undefined ? settings.tax_rate : 13) / 100;
  const iva = Math.round(subtotal * taxRate);
  const total = subtotal + iva;

  const handleCreateOrder = () => {
    onCreateOrderFromQuote({
      service_type: 'instalacion',
      status: 'ingresado',
      description: `Instalación dimensionada con Cotizador Térmico (${input.climate_zone === 'costera_calida' ? 'Zona Cálida' : 'Zona Templada'}): ${result.recommended_btu.toLocaleString()} BTU (${result.recommended_ton} Ton) para ${input.room_type} de ${input.area_m2} m².`,
      items: [
        {
          id: `it-${Date.now()}-1`,
          description: matchedEquipment ? matchedEquipment.name : `Equipo Split Inverter ${result.recommended_btu} BTU (${result.recommended_ton} Ton)`,
          quantity: 1,
          unit_price: equipmentPrice,
          total: equipmentPrice,
          type: 'equipo',
        },
        ...(includeInstallation ? [{
          id: `it-${Date.now()}-2`,
          description: 'Mano de obra y materiales estándar de instalación con vacío',
          quantity: 1,
          unit_price: installationBasePrice,
          total: installationBasePrice,
          type: 'servicio' as const,
        }] : []),
        ...(includeCondensatePump ? [{
          id: `it-${Date.now()}-3`,
          description: 'Bomba de condensado mini silenciosa',
          quantity: 1,
          unit_price: pumpPrice,
          total: pumpPrice,
          type: 'insumo' as const,
        }] : []),
      ],
      subtotal,
      tax: iva,
      total,
      payment_status: 'pendiente',
    });
    toast.success('¡Orden de instalación agregada al tablero!');
  };

  const handleCopyWhatsApp = () => {
    const zoneName = input.climate_zone === 'costera_calida' ? 'Zona Cálida / Costera (700 BTU/m²)' : 'Zona Templada (600 BTU/m²)';
    const text = `❄️ *PRESUPUESTO CLIMATIZACIÓN - ${settings?.fantasy_name || settings?.company_name || 'NEXUS AIR'}* ❄️\n\n` +
      `📐 *Dimensionamiento Térmico:*\n` +
      `• Área: ${input.area_m2} m² (${input.room_type}, ${input.use_type === 'comercial' ? 'Comercial' : 'Residencial'})\n` +
      `• Factor de Zona: ${zoneName}\n` +
      `• Carga Calculada: ${result.exact_btu.toLocaleString()} BTU/h\n` +
      `• Equipo Recomendado: *${result.recommended_btu.toLocaleString()} BTU (${result.recommended_ton} Ton)*\n` +
      `• Potencia: ${result.cooling_kw} kW Frío\n\n` +
      `💰 *Valores Estimados:*\n` +
      `• Equipo: ${currencySymbol}${equipmentPrice.toLocaleString()}\n` +
      (includeInstallation ? `• Instalación y Materiales: ${currencySymbol}${installationBasePrice.toLocaleString()}\n` : '') +
      (includeCondensatePump ? `• Bomba de Condensado: ${currencySymbol}${pumpPrice.toLocaleString()}\n` : '') +
      `• Subtotal: ${currencySymbol}${subtotal.toLocaleString()}\n` +
      `• IVA (${Math.round(taxRate * 100)}%): ${currencySymbol}${iva.toLocaleString()}\n` +
      `• *TOTAL FINAL:* ${currencySymbol}${total.toLocaleString()}\n\n` +
      `Incluye garantía formal de instalación. ¡Responde a este mensaje para coordinar la visita técnica!`;

    navigator.clipboard.writeText(text);
    toast.success('Presupuesto copiado al portapapeles para WhatsApp');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculadora de Carga Térmica HVAC • Costa Rica & Latinoamérica</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Calculadora de BTU & Proforma de Climatización
          </h2>
          <p className="text-xs text-slate-500">
            Dimensionamiento exacto en BTU y Toneladas según clima, radiación solar, ocupación y recintos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRefTable(prev => !prev)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-cyan-600" />
            <span>{showRefTable ? 'Ocultar Tabla' : 'Ver Tabla de Referencia CR'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProformaOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Generar Proforma Oficial</span>
          </button>
        </div>
      </div>

      {/* Tabla Desplegable de Referencia Costa Rica */}
      {showRefTable && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-cyan-400">
              📊 Tabla de BTU por Metro Cuadrado para Costa Rica (600 - 700 BTU/m²)
            </h3>
            <span className="text-[10px] text-slate-400">Fuente: Estándar HVAC Costa Rica</span>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-2 px-3">Área en Metros Cuadrados (m²)</th>
                  <th className="py-2 px-3">Uso Residencial</th>
                  <th className="py-2 px-3">Uso Comercial</th>
                  <th className="py-2 px-3">Equivalencia en Toneladas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr><td className="py-2 px-3 font-sans">Hasta 15 m² (habitación / oficina)</td><td className="py-2 px-3 text-cyan-300">9,000 BTU</td><td className="py-2 px-3 text-amber-300">12,000 BTU</td><td className="py-2 px-3">0.75 - 1.0 Ton</td></tr>
                <tr><td className="py-2 px-3 font-sans">15 a 20 m² (habitación estándar / sala)</td><td className="py-2 px-3 text-cyan-300">12,000 BTU</td><td className="py-2 px-3 text-amber-300">15,000 BTU</td><td className="py-2 px-3">1.0 - 1.25 Ton</td></tr>
                <tr><td className="py-2 px-3 font-sans">20 a 25 m² (sala mediana / oficina)</td><td className="py-2 px-3 text-cyan-300">15,000 BTU</td><td className="py-2 px-3 text-amber-300">18,000 BTU</td><td className="py-2 px-3">1.25 - 1.5 Ton</td></tr>
                <tr><td className="py-2 px-3 font-sans">25 a 35 m² (sala-comedor / local)</td><td className="py-2 px-3 text-cyan-300">18,000 BTU</td><td className="py-2 px-3 text-amber-300">24,000 BTU</td><td className="py-2 px-3">1.5 - 2.0 Ton</td></tr>
                <tr><td className="py-2 px-3 font-sans">35 a 50 m² (espacio grande / negocio)</td><td className="py-2 px-3 text-cyan-300">24,000 BTU</td><td className="py-2 px-3 text-amber-300">30,000 BTU</td><td className="py-2 px-3">2.0 - 2.5 Ton</td></tr>
                <tr><td className="py-2 px-3 font-sans">50 a 75 m² (salón amplio / restaurante)</td><td className="py-2 px-3 text-cyan-300">36,000 BTU</td><td className="py-2 px-3 text-amber-300">48,000 BTU</td><td className="py-2 px-3">3.0 - 4.0 Ton</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
          
          {/* Zona Climática & Tipo de Uso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                Zona Climática
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInput(prev => ({ ...prev, climate_zone: 'costera_calida' }))}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    input.climate_zone === 'costera_calida'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>🔥 Cálida / Costa</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">700 BTU/m² (Guanacaste, Limón)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInput(prev => ({ ...prev, climate_zone: 'templada' }))}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    input.climate_zone === 'templada'
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>⛅ Templada / Alta</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">600 BTU/m² (San José, Cartago)</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Tipo de Uso
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInput(prev => ({ ...prev, use_type: 'residencial' }))}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    input.use_type === 'residencial'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>🏡 Residencial</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">Hogar / Departamento</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInput(prev => ({ ...prev, use_type: 'comercial' }))}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    input.use_type === 'comercial'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>🏢 Comercial</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">Oficina / Local / Rest.</div>
                </button>
              </div>
            </div>
          </div>

          {/* Área m2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Home className="w-4 h-4 text-cyan-600" />
                Área en Metros Cuadrados
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="150"
                  value={input.area_m2}
                  onChange={e => setInput(prev => ({ ...prev, area_m2: Math.max(5, parseInt(e.target.value) || 10) }))}
                  className="w-16 px-2 py-1 text-right font-black text-cyan-700 bg-cyan-50 border border-cyan-300 rounded-lg text-sm font-mono"
                />
                <span className="text-xs font-bold text-slate-500 font-mono">m²</span>
              </div>
            </div>
            <input
              type="range"
              min="8"
              max="100"
              step="1"
              value={input.area_m2}
              onChange={(e) => setInput(prev => ({ ...prev, area_m2: parseInt(e.target.value) || 10 }))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>8 m² (Pieza)</span>
              <span>20 m² (Estándar)</span>
              <span>35 m² (Sala-Comedor)</span>
              <span>75 m² (Local)</span>
            </div>
          </div>

          {/* Altura de Techo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Altura de Techo ({input.ceiling_height_m} m)</div>
              <div className="text-[11px] text-slate-500">
                {input.ceiling_height_m > 3.0 ? '⚠️ Techo alto (>3m): Se suma 10% a la capacidad requerida' : 'Altura estándar (2.5m - 2.8m)'}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[2.4, 2.7, 3.2, 3.8].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setInput(prev => ({ ...prev, ceiling_height_m: h }))}
                  className={`px-2 py-1 rounded-lg text-xs font-bold font-mono border ${
                    input.ceiling_height_m === h ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {h}m
                </button>
              ))}
            </div>
          </div>

          {/* Exposición Solar y Ventanales */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              Exposición Solar & Ventanales
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'baja', label: 'Baja / Sombra' },
                { id: 'media', label: 'Moderada' },
                { id: 'alta', label: 'Alta / Sol Tarde' },
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setInput(prev => ({ ...prev, sun_exposure: s.id as any }))}
                  className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all ${
                    input.sun_exposure === s.id
                      ? 'bg-amber-50 border-amber-400 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-1 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={input.large_windows_sun || false}
                onChange={e => setInput(prev => ({ ...prev, large_windows_sun: e.target.checked }))}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              <span>Ventanas grandes expuestas directamente al sol de la tarde (+15% BTU)</span>
            </label>
          </div>

          {/* Personas y Carga Electrónica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Personas Ocupantes
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 4, 6, 10, 15].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setInput(prev => ({ ...prev, people_count: num }))}
                    className={`flex-1 py-1.5 rounded-lg border text-center text-xs font-bold font-mono ${
                      input.people_count === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Base 2 personas. Extras: +600 BTU/p</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Tv className="w-4 h-4 text-indigo-600" />
                Equipos Electrónicos
              </label>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 4, 8].map(eq => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => setInput(prev => ({ ...prev, electronics_count: eq }))}
                    className={`flex-1 py-1.5 rounded-lg border text-center text-xs font-bold font-mono ${
                      input.electronics_count === eq
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">+800 BTU por equipo importante</span>
            </div>
          </div>

          {/* Opciones de Instalación */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Instalación & Materiales
            </h4>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeInstallation}
                  onChange={(e) => setIncludeInstallation(e.target.checked)}
                  className="w-4 h-4 accent-cyan-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Mano de Obra de Instalación y Vacío</div>
                  <div className="text-[11px] text-slate-500">Incluye soporte de condensado, anclajes y presurización</div>
                </div>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono font-bold text-cyan-700">+{currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  disabled={!includeInstallation}
                  value={customInstallationPrice !== null ? customInstallationPrice : defaultInstallationBasePrice}
                  onChange={(e) => setCustomInstallationPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-right px-2 py-0.5 border rounded border-slate-300 font-mono font-bold text-xs text-cyan-800 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="80000"
                  title="Precio editable de mano de obra"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCondensatePump}
                  onChange={(e) => setIncludeCondensatePump(e.target.checked)}
                  className="w-4 h-4 accent-cyan-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Bomba de Condensado Silenciosa</div>
                  <div className="text-[11px] text-slate-500">Para desagües sin gravedad o tiradas complejas</div>
                </div>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono font-bold text-cyan-700">+{currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  disabled={!includeCondensatePump}
                  value={customPumpPrice !== null ? customPumpPrice : defaultPumpPrice}
                  onChange={(e) => setCustomPumpPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-right px-2 py-0.5 border rounded border-slate-300 font-mono font-bold text-xs text-cyan-800 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="45000"
                  title="Precio editable de bomba de condensado"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output: Thermal Recommendation & Proforma Trigger */}
        <div className="lg:col-span-5 space-y-6">
          {/* Thermal Output Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1833] via-[#080f24] to-[#050b1a] text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00d2ff] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Dimensionamiento Óptimo
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00d2ff] text-xs font-mono font-bold">
                {result.recommended_ton} Toneladas
              </span>
            </div>

            <div>
              <div className="text-4xl font-black text-white tracking-tight font-mono">
                {result.recommended_btu.toLocaleString()}{' '}
                <span className="text-xl text-[#00d2ff] font-sans font-bold">BTU/h</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Carga exacta calculada: <span className="font-mono font-bold text-cyan-300">{result.exact_btu.toLocaleString()} BTU/h</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-[#00d2ff]" />
                <div>
                  <div className="text-[10px] text-slate-300">Potencia Frío</div>
                  <div className="text-xs font-bold text-white font-mono">{result.cooling_kw} kW</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-slate-300">Capacidad Ton</div>
                  <div className="text-xs font-bold text-white font-mono">{result.recommended_ton} Ton</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
              {result.explanation}
            </p>
          </div>

          {/* Quotation Summary Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Resumen de Cotización
              </h4>
              <span className="text-[11px] font-mono text-cyan-600 font-bold">
                {currencySymbol} ({settings?.country || 'Costa Rica'})
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1 text-slate-700">
                <span>Equipo {result.recommended_btu.toLocaleString()} BTU ({result.recommended_ton} Ton)</span>
                <span className="font-mono font-semibold">{currencySymbol}{equipmentPrice.toLocaleString()}</span>
              </div>
              {includeInstallation && (
                <div className="flex justify-between py-1 text-slate-700">
                  <span>Mano de obra y materiales estándar</span>
                  <span className="font-mono font-semibold">{currencySymbol}{installationBasePrice.toLocaleString()}</span>
                </div>
              )}
              {includeCondensatePump && (
                <div className="flex justify-between py-1 text-slate-700">
                  <span>Bomba Condensado</span>
                  <span className="font-mono font-semibold">{currencySymbol}{pumpPrice.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-400 text-[11px]">
                <span>IVA ({Math.round(taxRate * 100)}%)</span>
                <span className="font-mono">{currencySymbol}{iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-black text-slate-900">
                <span>TOTAL ESTIMADO:</span>
                <span className="text-cyan-600 font-mono">{currencySymbol}{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setIsProformaOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Generar Proforma Oficial (PDF / WhatsApp)</span>
              </button>

              <button
                type="button"
                onClick={handleCreateOrder}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Orden en Kanban</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copiar Presupuesto a WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Proforma Oficial (NK-018 / NK-033 / NK-035) */}
      <ProformaModalAir
        isOpen={isProformaOpen}
        onClose={() => setIsProformaOpen(false)}
        recommendedBtu={result.recommended_btu}
        recommendedTon={result.recommended_ton}
        areaM2={input.area_m2}
        parts={parts}
        settings={settings}
        customers={customers}
        onCreateOrder={onCreateOrderFromQuote}
        includeCondensatePump={includeCondensatePump}
        pumpPrice={pumpPrice}
        includeInstallation={includeInstallation}
        installationPrice={installationBasePrice}
        initialEquipmentPrice={equipmentPrice}
      />
    </div>
  );
};
