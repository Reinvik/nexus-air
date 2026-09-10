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
  Check
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
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans selection:bg-[#00d2ff] selection:text-[#050811] overflow-x-hidden">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050811]/85 backdrop-blur-xl border-b border-white/[0.04] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(0,210,255,0.1)] border border-[rgba(0,210,255,0.3)] flex items-center justify-center text-[#00d2ff] shadow-[0_0_15px_rgba(0,210,255,0.25)]">
              <Wind className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="text-[20px] font-black tracking-[-0.04em] text-white leading-none">
                NEXUS<span className="text-[#00d2ff]">AIR</span>
              </div>
              <span className="text-[8.5px] font-extrabold text-[#00d2ff] tracking-[0.16em] uppercase text-shadow-[0_0_8px_rgba(0,210,255,0.4)]">
                BY SMARTLEAN
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#servicios" className="hover:text-[#00d2ff] transition-colors">Servicios</a>
            <a href="#calculadora" className="hover:text-[#00d2ff] transition-colors">Calculadora BTU</a>
            <a href="#recaptacion" className="hover:text-[#00d2ff] transition-colors">Mantención Semestral</a>
            <button
              onClick={onOpenPortal}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#00d2ff]" />
              <span>Portal Cliente</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onAdminAccess}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.06] transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#00d2ff]" />
              <span>Panel Operativo</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="btn-nexus-gradient px-4 py-2 text-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Visita</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#00d2ff]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-[#2563eb]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
          {/* Smartlean Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(6,182,212,0.08)] border border-[rgba(6,182,212,0.25)] text-[#22d3ee] text-xs font-extrabold uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-ping" />
            <span>TECNOLOGÍA HVAC 4.0 & RECAPTACIÓN CADA 6 MESES</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[1.1]">
            El clima ideal para tu espacio con{' '}
            <span className="bg-gradient-to-r from-[#00d2ff] via-[#38bdf8] to-[#2563eb] bg-clip-text text-transparent">
              Nexus Air
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Ingeniería en venta, instalación y desinfección química de aires acondicionados Inverter A++. 
            Aseguramos aire puro sin ácaros ni bacterias y mantenciones programadas cada 180 días.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenBooking}
              className="btn-nexus-gradient px-8 py-4 text-sm font-black w-full sm:w-auto"
            >
              <Calendar className="w-5 h-5 stroke-[2.5]" />
              <span>AGENDAR VISITA O MANTENCIÓN ONLINE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#calculadora"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-sm border border-white/[0.08] transition-all"
            >
              <Calculator className="w-4 h-4 text-[#00d2ff]" />
              <span>Calcular BTU Requeridos</span>
            </a>
          </div>

          {/* Guarantee Badges */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              <span>Técnicos Certificados SEC</span>
            </div>
            <div className="flex items-center gap-2">
              <ThermometerSnowflake className="w-4 h-4 text-[#00d2ff]" />
              <span>Garantía Oficial de 12 Meses</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#f59e0b]" />
              <span>Recaptación Semestral Automatizada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Live Thermal Calculator */}
      <section id="calculadora" className="py-20 px-6 bg-[#080d1c]/60 border-y border-white/[0.04] relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(6,182,212,0.08)] border border-[rgba(6,182,212,0.2)] text-[#00d2ff] text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5" />
              <span>Cálculo de Carga Térmica</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Calcula la capacidad exacta en BTU para tu espacio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Evita sobreconsumo en tu cuenta de luz instalando la potencia exacta para tu recámara o local.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0a1021] border border-white/[0.06] shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-300">Superficie del Recinto:</span>
                    <span className="font-mono font-extrabold text-[#00d2ff] text-base">{calcArea} m²</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={calcArea}
                    onChange={(e) => setCalcArea(parseInt(e.target.value))}
                    className="w-full accent-[#00d2ff] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10 m² (Dormitorio)</span>
                    <span>30 m² (Living)</span>
                    <span>60 m² (Planta abierta)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-300 text-xs block">Tipo de Habitación:</span>
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
                        className={`py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                          calcRoom === r.id
                            ? 'bg-[rgba(6,182,212,0.15)] border-[#00d2ff] text-[#00d2ff]'
                            : 'bg-[#050811] border-white/[0.05] text-slate-400 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculator Output Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1833] via-[#080f24] to-[#050b1a] border border-cyan-500/30 text-center space-y-4 shadow-xl">
                <span className="text-xs font-bold text-[#00d2ff] uppercase tracking-wider">
                  Capacidad Recomendada
                </span>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono">
                  {miniCalcResult.recommended_btu.toLocaleString('es-CL')}{' '}
                  <span className="text-xl text-[#00d2ff] font-sans font-bold">BTU</span>
                </div>
                <div className="flex justify-center gap-4 text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1">
                    <Snowflake className="w-3.5 h-3.5 text-[#00d2ff]" />
                    {miniCalcResult.cooling_kw} kW Frío
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
                    {miniCalcResult.heating_kw} kW Calor
                  </span>
                </div>
                <button
                  onClick={onOpenBooking}
                  className="btn-nexus-gradient w-full py-3 text-xs"
                >
                  Cotizar con Kit e Instalación SEC
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-24 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold text-[#00d2ff] uppercase tracking-[0.16em]">
            SERVICIOS PROFESIONALES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Excelencia en Climatización Integral
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#0a1021] border border-white/[0.05] space-y-4 hover:border-cyan-500/40 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(0,210,255,0.1)] text-[#00d2ff] flex items-center justify-center border border-[rgba(0,210,255,0.25)]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Mantención Semestral (6 Meses)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Desinfección con bactericidas especializados, lavado a presión de turbina y serpentín interior, control de salto térmico (\(\Delta T\)) y presiones de gas refrigerante.
            </p>
            <div className="pt-2 text-[#00d2ff] font-bold text-xs font-mono">
              Desde $45.000 + IVA
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#0a1021] border border-white/[0.05] space-y-4 hover:border-cyan-500/40 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(37,99,235,0.1)] text-[#3b82f6] flex items-center justify-center border border-[rgba(37,99,235,0.25)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Instalación Certificada SEC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instalación profesional de Split Muro y Cassette. Incluye perforación de muros, cañerías de cobre con aislación Armaflex UV, soporte exterior y vacío profundo con manómetro digital.
            </p>
            <div className="pt-2 text-[#3b82f6] font-bold text-xs font-mono">
              Desde $130.000 + IVA
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#0a1021] border border-white/[0.05] space-y-4 hover:border-cyan-500/40 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.1)] text-[#10b981] flex items-center justify-center border border-[rgba(16,185,129,0.25)]">
              <Wind className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Venta de Equipos Inverter A++</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipos de las marcas más confiables del mercado (Anwo, Midea, Gree, Daikin). Silenciosos, con gas ecológico R32 y control WiFi para programar desde tu celular.
            </p>
            <div className="pt-2 text-[#10b981] font-bold text-xs font-mono">
              Equipos de 9.000 a 24.000+ BTU
            </div>
          </div>
        </div>
      </section>

      {/* Recaptación 6 Meses Section */}
      <section id="recaptacion" className="py-24 px-6 bg-[#080d1c]/70 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(6,182,212,0.08)] border border-[rgba(6,182,212,0.2)] text-[#00d2ff] text-xs font-bold uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>CICLO SEMESTRAL RECOMENDADO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
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
              className="btn-nexus-gradient px-6 py-3 text-xs"
            >
              Programar mi Mantención Semestral
            </button>
          </div>

          <div className="p-7 rounded-3xl bg-[#0a1021] border border-white/[0.06] space-y-4 shadow-2xl max-w-sm w-full">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00d2ff]" />
              Protocolo Técnico Incluido:
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              {[
                'Desinfección con bactericida ClimaCare',
                'Hidrolavado a presión controlada de turbina',
                'Medición de salto térmico ΔT en °C',
                'Control de presiones y detección de micro-fugas',
                'Revisión de bandeja y drenaje de agua'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 px-6 bg-[#03060d] text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-black text-white text-base tracking-tight">
              NEXUS<span className="text-[#00d2ff]">AIR</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {settings.address}, {settings.commune} • {settings.phone}
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            © 2026 NEXUS AIR • BY SMARTLEAN • PRODUCTO OFICIAL DEL ECOSISTEMA NEXUS
          </div>
        </div>
      </footer>
    </div>
  );
};
