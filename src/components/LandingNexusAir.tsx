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
  Lock
} from 'lucide-react';
import { calculateThermalLoad } from '../lib/thermalCalculator';

interface LandingNexusAirProps {
  settings: AirSettings;
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onAdminAccess: () => void;
}

export const LandingNexusAir: React.FC<LandingNexusAirProps> = ({
  settings,
  onOpenBooking,
  onOpenPortal,
  onAdminAccess,
}) => {
  const [calcArea, setCalcArea] = useState(22);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Wind className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                NEXUS<span className="text-cyan-400">AIR</span>
              </span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold uppercase">
                Climatización
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#servicios" className="hover:text-cyan-400 transition-colors">Servicios</a>
            <a href="#calculadora" className="hover:text-cyan-400 transition-colors">Calculadora BTU</a>
            <a href="#recaptacion" className="hover:text-cyan-400 transition-colors">Mantención 6 Meses</a>
            <button
              onClick={onOpenPortal}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Portal Cliente</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onAdminAccess}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Panel Operativo</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Visita</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Instalación Certificada SEC & Mantención Preventiva Cada 6 Meses</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            El Clima Perfecto para tu Hogar y Empresa con{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Nexus Air
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Especialistas en venta, montaje y desinfección química de aires acondicionados Inverter A++. 
            Aseguramos máxima eficiencia eléctrica, aire puro sin bacterias y mantenciones programadas cada 6 meses.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Calendar className="w-5 h-5 stroke-[2.5]" />
              <span>Agendar Visita o Mantención Online</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#calculadora"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 transition-all"
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Calcular BTU para mi Espacio</span>
            </a>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Técnicos Autorizados SEC</span>
            </div>
            <div className="flex items-center gap-2">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
              <span>Garantía de 12 Meses</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recaptación Semestral 6M</span>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Live Thermal Calculator */}
      <section id="calculadora" className="py-16 px-6 bg-slate-900/50 border-y border-slate-800/80 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dimensionamiento Inmediato</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Cuántos BTU necesitas para climatizar tu habitación?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Usa nuestro algoritmo de dimensionamiento para conocer la capacidad exacta y evitar sobreconsumo eléctrico.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Sliders */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Superficie del Espacio:</span>
                    <span className="font-mono font-bold text-cyan-400 text-base">{calcArea} m²</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={calcArea}
                    onChange={(e) => setCalcArea(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10 m²</span>
                    <span>30 m²</span>
                    <span>60 m²</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-semibold text-slate-300 text-xs block">Tipo de Habitación:</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'dormitorio', label: 'Dormitorio' },
                      { id: 'living', label: 'Living' },
                      { id: 'oficina', label: 'Oficina' },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setCalcRoom(r.id as any)}
                        className={`py-2 rounded-xl border font-medium text-xs transition-all cursor-pointer ${
                          calcRoom === r.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculator Output Badge */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-slate-950 to-slate-950 border border-cyan-500/30 text-center space-y-4 shadow-xl">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Capacidad Recomendada
                </span>
                <div className="text-4xl font-black text-white font-mono">
                  {miniCalcResult.recommended_btu.toLocaleString('es-CL')}{' '}
                  <span className="text-xl text-cyan-400 font-sans">BTU</span>
                </div>
                <div className="flex justify-center gap-4 text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1">
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    {miniCalcResult.cooling_kw} kW Frío
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    {miniCalcResult.heating_kw} kW Calor
                  </span>
                </div>
                <button
                  onClick={onOpenBooking}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Cotizar con Instalación Estándar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            Nuestros Servicios Especializados
          </span>
          <h2 className="text-3xl font-black text-white">Soluciones Completas de Climatización</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Mantención Preventiva (Cada 6 Meses)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Desinfección con bactericidas especializados, lavado a presión de turbinas y serpentines, prueba de temperatura (\(\Delta T\)) y verificación de presiones de gas refrigerante.
            </p>
            <div className="pt-2 text-cyan-400 font-bold text-xs font-mono">
              Desde $45.000 + IVA
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Instalación Certificada SEC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instalación profesional de Split Muro y Cassette. Incluye perforación de muros, cañerías de cobre con aislación Armaflex UV, soporte exterior reforzado y vacío profundo con manómetro digital.
            </p>
            <div className="pt-2 text-blue-400 font-bold text-xs font-mono">
              Desde $130.000 + IVA
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Wind className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Venta de Equipos Inverter A++</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipos de las marcas más confiables del mercado (Anwo, Midea, Gree, Daikin). Silenciosos, con gas ecológico R32 y control WiFi para programar desde tu celular.
            </p>
            <div className="pt-2 text-emerald-400 font-bold text-xs font-mono">
              Equipos desde 9.000 a 24.000+ BTU
            </div>
          </div>
        </div>
      </section>

      {/* Recaptación 6 Meses Feature Section */}
      <section id="recaptacion" className="py-20 px-6 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>El Valor del Ciclo de 6 Meses</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              ¿Por qué es fundamental la mantención cada 6 meses?
            </h2>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>1. Transición Estacional:</strong> En Chile pasamos de meses fríos (donde el equipo calefacciona) a meses calurosos (refrigeración). Cada 6 meses los filtros acumulan ácaros y la humedad en la turbina genera malos olores y hongos si no se sanitiza.
              </p>
              <p>
                <strong>2. Ahorro de Energía:</strong> Un serpentín sucio reduce la transferencia de calor, provocando que el compresor funcione al 100% de potencia y aumentando tu cuenta de luz hasta un 30%.
              </p>
              <p>
                <strong>3. Alerta Automática:</strong> Con Nexus Air no tienes que preocuparte de recordar las fechas: nuestro sistema te notifica de forma preventiva con un link directo a WhatsApp.
              </p>
            </div>
            <button
              onClick={onOpenBooking}
              className="mt-2 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Programar mi Mantención Semestral
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl max-w-sm w-full">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Protocolo Técnico Incluido:
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Desinfección con bactericida ClimaCare</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Hidrolavado a presión controlada de turbina</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Medición de salto térmico ΔT en °C</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Control de presiones y detección de fugas</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Revisión de bandeja y drenaje de agua</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 px-6 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-bold text-white text-sm">{settings.company_name}</div>
            <p className="text-slate-400">{settings.address}, {settings.commune} • {settings.phone}</p>
          </div>
          <div>
            <span>© 2026 Nexus Air. Todos los derechos reservados. Ecosistema Nexus.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
