import React, { useState } from 'react';
import { AirSettings } from '../types';
import { 
  Wind, 
  ThermometerSnowflake, 
  ShieldCheck, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  Star, 
  ArrowRight, 
  Calculator, 
  Clock, 
  Sparkles, 
  Zap, 
  Flame, 
  Snowflake, 
  UserCheck, 
  Lock,
  Layers,
  Check,
  Building2,
  Gauge,
  QrCode,
  FileText
} from 'lucide-react';
import { calculateThermalLoad } from '../lib/thermalCalculator';

interface LandingSolagoAirProps {
  settings: AirSettings;
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onAdminAccess: () => void;
}

export const LandingSolagoAir: React.FC<LandingSolagoAirProps> = ({
  settings,
  onOpenBooking,
  onOpenPortal,
  onAdminAccess,
}) => {
  const [calcArea, setCalcArea] = useState(24);
  const [calcRoom, setCalcRoom] = useState<'dormitorio' | 'living' | 'oficina'>('living');

  const miniCalcResult = calculateThermalLoad({
    area_m2: calcArea,
    ceiling_height_m: 2.4,
    sun_exposure: 'media',
    room_type: calcRoom,
    people_count: 2,
    electronic_load: 'baja',
  });

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 font-sans selection:bg-[#ffa100] selection:text-[#060a12] overflow-x-hidden relative">
      {/* Glow Orbs de Fondo estilo SoLago */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-15 bg-[#00d2ff] pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 bg-[#ffa100] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[550px] h-[550px] rounded-full blur-[180px] opacity-15 bg-[#2563eb] pointer-events-none" />

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060a12]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo SoLago Air */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#050811] border border-cyan-500/30 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(0,210,255,0.2)] shrink-0">
              <img 
                src="/brands/solago/solago-emblem.png" 
                alt="SoLago" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <img 
                src="/brands/solago/solago-wordmark.png" 
                alt="SoLago" 
                className="h-6 sm:h-7 object-contain hidden sm:block"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col sm:hidden">
                <span className="text-lg font-black tracking-tight leading-none text-white">
                  <span className="text-[#ffa100]">So</span><span className="text-[#2563eb]">Lago</span>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-black text-[9.5px] tracking-wider uppercase shadow-[0_0_10px_rgba(0,210,255,0.3)]">
                AIR
              </span>
            </div>
          </div>

          {/* Links de Navegación */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#que-es" className="hover:text-[#00d2ff] transition-colors">¿Qué es?</a>
            <a href="#servicios" className="hover:text-[#00d2ff] transition-colors">Servicios HVAC</a>
            <a href="#calculadora" className="hover:text-[#00d2ff] transition-colors">Calculadora BTU</a>
            <a href="#garantia" className="hover:text-[#00d2ff] transition-colors">Garantía 6M</a>
            <button
              onClick={onOpenPortal}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#00d2ff]" />
              <span>Portal Clientes</span>
            </button>
          </div>

          {/* Acciones de la Cabecera */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onAdminAccess}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold border border-cyan-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Acceso al Terminal de Gestión HVAC"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Acceso Terminal</span>
              <span className="sm:hidden">Acceso</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffa100] via-[#00d2ff] to-[#2563eb] hover:opacity-95 text-white text-xs font-extrabold shadow-[0_4px_20px_rgba(255,161,0,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendar Visita</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="que-es" className="pt-32 pb-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Pill Badge SoLago */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-cyan-500/30 text-cyan-300 text-[11px] font-bold tracking-wide uppercase mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            SISTEMA DE CLIMATIZACIÓN EN LA NUBE • SINCRONIZACIÓN SMARTLEAN
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl">
            Servicios técnicos de climatización, mantenimiento exacto y{' '}
            <span className="bg-gradient-to-r from-[#00d2ff] via-[#38bdf8] to-[#3b82f6] bg-clip-text text-transparent">
              cero enredos operativos
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            <strong className="text-white font-semibold">SoLago Air</strong> es la plataforma integral para gestión de órdenes de aire acondicionado, cálculo térmico de BTU en terreno y control de garantías semestrales cada 180 días.
          </p>

          {/* Botones de Acción */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <button
              onClick={onOpenBooking}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#ffa100] via-[#00d2ff] to-[#2563eb] text-white font-black text-sm shadow-[0_8px_25px_rgba(255,161,0,0.35)] hover:shadow-[0_10px_30px_rgba(0,210,255,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>Agendar Servicio Técnico</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onAdminAccess}
              className="px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-200 text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Ingresar al Terminal</span>
            </button>

            <button
              onClick={onOpenPortal}
              className="px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#ffa100]" />
              <span>Consultar mi Equipo</span>
            </button>
          </div>

          {/* Live Monitor Bar (Estilo SoLago Live Rates Bar) */}
          <div className="mt-12 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xl flex flex-wrap items-center justify-between gap-4 text-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Estándar de Rendimiento</span>
                <span className="text-sm font-extrabold text-slate-900">Salto Térmico ΔT ≥ 12°C Verificado</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <ThermometerSnowflake className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Refrigerantes Ecológicos</span>
                <span className="text-sm font-extrabold text-slate-900">Cargas R410A & R32 en Balanza</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Cobertura de Garantía</span>
                <span className="text-sm font-extrabold text-slate-900">Mantención Periódica 180 Días (6M)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pilares de Servicio (Proof Cards de SoLago) */}
      <section id="servicios" className="py-16 px-4 sm:px-6 border-t border-white/[0.05] bg-[#050811]/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#ffa100] text-xs font-black uppercase tracking-widest">
              INGENIERÍA CLIMÁTICA DE PRECISIÓN
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-2 tracking-tight">
              Diseñado para máxima eficiencia y duración de tus equipos
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Protocolos estandarizados de atención técnica para hogares, comercios, oficinas y locales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-cyan-500/40 transition-all space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wind className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Mantención Preventiva (6M)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Desarme y lavado químico con bactericida de serpentines evaporador y condensador, limpieza de bandeja y prueba de drenaje.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/40 transition-all space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Snowflake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Instalación Certificada</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vacío profundo con bomba de 2 etapas menor a 500 micrones, cañerías de cobre aisladas y prueba de estanqueidad con nitrógeno seco.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/40 transition-all space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Gauge className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Carga & Fugas de Gas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detección electrónica de microfugas, prueba de sobrecalentamiento y subenfriamiento con manómetros digitales de precisión.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/40 transition-all space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Ficha Técnica & Comprobante</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comprobante oficial en PDF con checklist de parámetros PSI, temperatura y QR de seguimiento directo para el cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Calculadora Térmica Interactiva */}
      <section id="calculadora" className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#0c1626] to-[#060a12] border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
                <Calculator className="w-3.5 h-3.5" />
                <span>Simulador Térmico Instantáneo</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                ¿Qué capacidad de equipo necesita tu espacio?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Ajusta los metros cuadrados y el tipo de recinto para dimensionar la potencia frigorífica exacta.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacidad Calculada</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {miniCalcResult.recommended_btu.toLocaleString()} <span className="text-xs text-white">BTU/h</span>
              </span>
              <span className="text-[11px] text-slate-400 block font-semibold">
                ({miniCalcResult.recommended_ton} Toneladas)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Área a climatizar:</span>
                  <span className="text-cyan-400 font-mono text-sm">{calcArea} m²</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={80}
                  value={calcArea}
                  onChange={(e) => setCalcArea(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>8 m²</span>
                  <span>40 m²</span>
                  <span>80 m²</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Tipo de Recinto:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dormitorio', 'living', 'oficina'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCalcRoom(r)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        calcRoom === r
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#050811]/80 rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#ffa100]" />
                  <span>Recomendación SoLago Air:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para {calcArea} m² en {calcRoom}, se recomienda un equipo Split Inverter de{' '}
                  <strong className="text-cyan-400 font-bold">{miniCalcResult.recommended_btu.toLocaleString()} BTU</strong> para mantener 21°C estables con el menor consumo eléctrico.
                </p>
              </div>

              <button
                onClick={onOpenBooking}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffa100] via-[#00d2ff] to-[#2563eb] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Cotizar Instalación para este equipo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dolor de Mercado & Solución SoLago */}
      <section id="garantia" className="py-16 px-4 sm:px-6 bg-[#04070e] border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0a1322] to-[#040812] border border-cyan-500/30 space-y-6">
            <span className="text-[#ffa100] text-xs font-black uppercase tracking-wider">
              VALORACIÓN DE CONGESTIÓN & CONTROL DE TIEMPO
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
              Se acabó olvidar las mantenciones periódicas y arriesgar la vida útil del compresor
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              La acumulación de polvo y sarro eleva el consumo eléctrico hasta en un 35% y reduce la vida útil del condensador. Con el sistema de retención de <strong className="text-white">SoLago Air</strong>, cada orden registra la fecha exacta para enviar el recordatorio preventivo a los 180 días automáticamente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-2xl font-black text-cyan-400 block font-mono">180 Días</span>
                <span className="text-xs text-slate-400 font-medium">Ciclo semestral automático de revisión</span>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-2xl font-black text-[#ffa100] block font-mono">100% Digital</span>
                <span className="text-xs text-slate-400 font-medium">Ficha técnica y comprobante en línea</span>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-2xl font-black text-emerald-400 block font-mono">0 Papeles</span>
                <span className="text-xs text-slate-400 font-medium">Consulta histórica por RUT o Código</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-white/[0.06] bg-[#03050a] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/brands/solago/solago-emblem.png" 
              alt="SoLago" 
              className="w-7 h-7 object-contain opacity-80"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-slate-400 font-bold">
              <span className="text-[#ffa100]">So</span><span className="text-[#2563eb]">Lago</span> AIR
            </span>
            <span>•</span>
            <span>Software Online para Locales & Climatización Inteligente</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <button onClick={onOpenPortal} className="hover:text-white transition-colors cursor-pointer">
              Portal Clientes
            </button>
            <span>•</span>
            <button onClick={onAdminAccess} className="hover:text-white transition-colors cursor-pointer">
              Acceso Terminal
            </button>
            <span>•</span>
            <span className="text-slate-600">© {new Date().getFullYear()} SMARTLEAN</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
