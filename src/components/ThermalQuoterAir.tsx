import React, { useState, useMemo } from 'react';
import { calculateThermalLoad } from '../lib/thermalCalculator';
import { ThermalCalculationInput, AirPart, ServiceOrder } from '../types';
import { 
  Calculator, 
  Sun, 
  Users, 
  Home, 
  Share2, 
  Sparkles, 
  Plus,
  Snowflake,
  Flame
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ThermalQuoterAirProps {
  parts: AirPart[];
  onCreateOrderFromQuote: (orderData: Partial<ServiceOrder>) => void;
}

export const ThermalQuoterAir: React.FC<ThermalQuoterAirProps> = ({
  parts,
  onCreateOrderFromQuote,
}) => {
  const [input, setInput] = useState<ThermalCalculationInput>({
    area_m2: 20,
    ceiling_height_m: 2.4,
    sun_exposure: 'media',
    room_type: 'living',
    people_count: 3,
    electronic_load: 'media',
  });

  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [includeCondensatePump, setIncludeCondensatePump] = useState(false);
  const [extraMetersCopper, setExtraMetersCopper] = useState(0);

  const result = useMemo(() => {
    return calculateThermalLoad(input);
  }, [input]);

  const matchedEquipment = useMemo(() => {
    return parts.find(p => p.category === 'equipo' && p.btu === result.recommended_btu) ||
           parts.find(p => p.category === 'equipo') || null;
  }, [parts, result.recommended_btu]);

  const equipmentPrice = matchedEquipment?.sale_price || 349990;
  const installationBasePrice = includeInstallation ? 130000 : 0;
  const pumpPrice = includeCondensatePump ? 89000 : 0;
  const extraCopperPrice = extraMetersCopper * 15000;

  const subtotal = equipmentPrice + installationBasePrice + pumpPrice + extraCopperPrice;
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const handleCreateOrder = () => {
    onCreateOrderFromQuote({
      service_type: 'instalacion',
      status: 'ingresado',
      description: `Instalación dimensionada con Cotizador Térmico: ${result.recommended_btu.toLocaleString()} BTU para ${input.room_type} de ${input.area_m2} m².`,
      items: [
        {
          id: `it-${Date.now()}-1`,
          description: matchedEquipment ? matchedEquipment.name : `Equipo Split Inverter ${result.recommended_btu} BTU`,
          quantity: 1,
          unit_price: equipmentPrice,
          total: equipmentPrice,
          type: 'equipo',
        },
        ...(includeInstallation ? [{
          id: `it-${Date.now()}-2`,
          description: 'Instalación estándar hasta 3m cañería de cobre + vacío',
          quantity: 1,
          unit_price: 130000,
          total: 130000,
          type: 'servicio' as const,
        }] : []),
        ...(includeCondensatePump ? [{
          id: `it-${Date.now()}-3`,
          description: 'Bomba de condensado mini silenciosa',
          quantity: 1,
          unit_price: 89000,
          total: 89000,
          type: 'insumo' as const,
        }] : []),
      ],
      subtotal,
      tax: iva,
      total,
      payment_status: 'pendiente',
    });
  };

  const handleCopyWhatsApp = () => {
    const text = `❄️ *PRESUPUESTO CLIMATIZACIÓN INTELIGENTE - NEXUS AIR* ❄️\n\n` +
      `📐 *Dimensionamiento Térmico:*\n` +
      `• Área: ${input.area_m2} m² (${input.room_type})\n` +
      `• Carga calculada: ${result.exact_btu.toLocaleString('es-CL')} BTU/h\n` +
      `• Equipo recomendado: *${result.recommended_btu.toLocaleString('es-CL')} BTU Inverter A++*\n` +
      `• Potencia: ${result.cooling_kw} kW Frío / ${result.heating_kw} kW Calor\n\n` +
      `💰 *Valores:*\n` +
      `• Equipo: $${equipmentPrice.toLocaleString('es-CL')}\n` +
      (includeInstallation ? `• Instalación estándar certificada SEC: $130.000\n` : '') +
      (includeCondensatePump ? `• Bomba de condensado silenciosa: $89.000\n` : '') +
      `• *TOTAL FINAL CON IVA:* $${total.toLocaleString('es-CL')}\n\n` +
      `Incluye garantía de 12 meses y mantenciones semestrales programadas. ¡Responde este mensaje para coordinar la visita!`;

    navigator.clipboard.writeText(text);
    toast.success('Presupuesto copiado al portapapeles para WhatsApp');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>Algoritmo de Carga Térmica HVAC</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">
            Calculadora de BTU & Cotizador de Instalación
          </h2>
          <p className="text-xs text-slate-500">
            Calcula la capacidad térmica exacta según metros cuadrados, radiación solar y recintos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters in Crisp White */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1. Parámetros del Espacio
          </h3>

          {/* Área m2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-cyan-600" />
                Superficie del Recinto
              </label>
              <span className="text-base font-black text-cyan-600 font-mono">
                {input.area_m2} m²
              </span>
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
              <span>30 m² (Living)</span>
              <span>60 m² (Planta)</span>
              <span>100 m² (Comercial)</span>
            </div>
          </div>

          {/* Tipo de recinto */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Tipo de Espacio</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'dormitorio', label: 'Dormitorio' },
                { id: 'living', label: 'Living' },
                { id: 'oficina', label: 'Oficina' },
                { id: 'local_comercial', label: 'Local' },
                { id: 'servidores', label: 'Servidores' },
              ].map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setInput(prev => ({ ...prev, room_type: r.id as any }))}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                    input.room_type === r.id
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exposición Solar y Personas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                Exposición al Sol
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'baja', label: 'Sombra' },
                  { id: 'media', label: 'Media' },
                  { id: 'alta', label: 'Poniente' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setInput(prev => ({ ...prev, sun_exposure: s.id as any }))}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      input.sun_exposure === s.id
                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Personas Habituales
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 4, 8, 15].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setInput(prev => ({ ...prev, people_count: num }))}
                    className={`flex-1 py-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      input.people_count === num
                        ? 'bg-blue-50 border-blue-400 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Opciones del Kit */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Paquete de Instalación & Accesorios
            </h4>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeInstallation}
                  onChange={(e) => setIncludeInstallation(e.target.checked)}
                  className="w-4 h-4 accent-cyan-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Instalación Estándar Certificada SEC</div>
                  <div className="text-[11px] text-slate-500">Hasta 3m cañería cobre, soporte exterior y vacío</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-700">+$130.000</span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeCondensatePump}
                  onChange={(e) => setIncludeCondensatePump(e.target.checked)}
                  className="w-4 h-4 accent-cyan-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Bomba de Condensado Silenciosa</div>
                  <div className="text-[11px] text-slate-500">Para desagüe sin caída libre natural</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-700">+$89.000</span>
            </label>
          </div>
        </div>

        {/* Right Output: Thermal Recommendation & Quote */}
        <div className="lg:col-span-5 space-y-6">
          {/* Thermal Output Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1833] via-[#080f24] to-[#050b1a] text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00d2ff] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Dimensionamiento Óptimo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00d2ff] text-[10px] font-mono font-bold">
                Clase A++
              </span>
            </div>

            <div>
              <div className="text-4xl font-black text-white tracking-tight font-mono">
                {result.recommended_btu.toLocaleString('es-CL')}{' '}
                <span className="text-xl text-[#00d2ff] font-sans font-bold">BTU/h</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Carga exacta calculada: {result.exact_btu.toLocaleString('es-CL')} BTU/h
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
                  <div className="text-[10px] text-slate-300">Potencia Calor</div>
                  <div className="text-xs font-bold text-white font-mono">{result.heating_kw} kW</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
              {result.explanation}
            </p>
          </div>

          {/* Quotation Summary Card in Crisp White */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Resumen del Presupuesto
            </h4>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1 text-slate-700">
                <span>Equipo {result.recommended_btu.toLocaleString()} BTU</span>
                <span className="font-mono font-semibold">${equipmentPrice.toLocaleString('es-CL')}</span>
              </div>
              {includeInstallation && (
                <div className="flex justify-between py-1 text-slate-700">
                  <span>Instalación Estándar SEC</span>
                  <span className="font-mono font-semibold">${installationBasePrice.toLocaleString('es-CL')}</span>
                </div>
              )}
              {includeCondensatePump && (
                <div className="flex justify-between py-1 text-slate-700">
                  <span>Bomba Condensado</span>
                  <span className="font-mono font-semibold">${pumpPrice.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-400 text-[11px]">
                <span>IVA (19%)</span>
                <span className="font-mono">${iva.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-black text-slate-900">
                <span>TOTAL FINAL:</span>
                <span className="text-cyan-600 font-mono">${total.toLocaleString('es-CL')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCreateOrder}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Crear Orden en Tablero</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copiar para WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
