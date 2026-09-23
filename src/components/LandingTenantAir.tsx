import React, { useState } from 'react';
import { AirSettings, LandingPageConfig } from '../types';
import { 
  Wind, 
  ShieldCheck, 
  Calendar, 
  Phone, 
  MapPin, 
  Mail, 
  ArrowRight, 
  Calculator, 
  CheckCircle2, 
  UserCheck, 
  Lock,
  MessageCircle,
  Clock,
  Sparkles,
  Star,
  Award,
  Navigation,
  ExternalLink,
  Instagram,
  Facebook
} from 'lucide-react';
import { calculateThermalLoad } from '../lib/thermalCalculator';
import { resolveAirLandingConfig } from '../lib/landingConfigAir';

interface LandingTenantAirProps {
  settings: AirSettings;
  previewConfig?: LandingPageConfig;
  onOpenBooking: (serviceTitle?: string) => void;
  onOpenPortal: () => void;
  onAdminAccess: () => void;
}

export const LandingTenantAir: React.FC<LandingTenantAirProps> = ({
  settings,
  previewConfig,
  onOpenBooking,
  onOpenPortal,
  onAdminAccess,
}) => {
  const [calcArea, setCalcArea] = useState(22);
  const [calcRoom, setCalcRoom] = useState<'dormitorio' | 'living' | 'oficina'>('living');

  // Resolver configuración efectiva
  const cfg = resolveAirLandingConfig(settings, previewConfig);

  const miniCalcResult = calculateThermalLoad({
    area_m2: calcArea,
    ceiling_height_m: 2.4,
    sun_exposure: 'media',
    room_type: calcRoom,
    people_count: 2,
    electronic_load: 'baja',
  });

  const whatsappClean = (cfg.phone || '').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(cfg.whatsapp_custom_message)}`;

  const primaryColor = cfg.theme_primary_color || '#00d2ff';
  const accentColor = cfg.theme_accent_color || '#0284c7';
  const isDark = cfg.theme_is_dark;

  // Filtrar servicios activos
  const activeServices = (cfg.services || []).filter(s => s.active !== false);

  return (
    <div 
      className={`min-h-screen font-sans selection:bg-cyan-500 selection:text-white transition-colors ${
        isDark ? 'bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      style={{
        backgroundColor: cfg.theme_background_color || (isDark ? '#080d1a' : '#f8fafc'),
      }}
    >
      {/* Top Bar de Información Rápida */}
      <div 
        className="px-6 py-2 text-[11px] font-semibold flex items-center justify-between border-b transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          color: isDark ? '#94a3b8' : '#64748b'
        }}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-cyan-500" />
              <span>{cfg.phone}</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-cyan-500" />
              <span>{cfg.address}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {cfg.business_hours && (
              <span className="hidden md:flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-500" />
                <span>{cfg.business_hours}</span>
              </span>
            )}
            <button
              onClick={onOpenPortal}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-500 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal {settings.tax_id_label || 'RUT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md border-b px-6 py-4 shadow-xs transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(8, 13, 26, 0.9)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226, 232, 240, 0.8)'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cfg.header_logo_url ? (
              <div className="h-10 max-w-[120px] flex items-center justify-center">
                <img
                  src={cfg.header_logo_url}
                  alt={cfg.fantasy_name}
                  className="max-h-10 max-w-[120px] object-contain rounded-lg shadow-xs"
                />
              </div>
            ) : (
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  boxShadow: `0 4px 14px ${primaryColor}40`
                }}
              >
                <Wind className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className={`text-lg font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {cfg.fantasy_name}
              </h1>
              <p 
                className="text-[11px] font-bold uppercase tracking-wider line-clamp-1"
                style={{ color: primaryColor }}
              >
                {cfg.slogan}
              </p>
            </div>
          </div>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <a 
              href="#servicios" 
              className={`transition-colors hover:text-cyan-500 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Servicios
            </a>
            {cfg.show_thermal_calculator !== false && (
              <a 
                href="#calculadora" 
                className={`transition-colors hover:text-cyan-500 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
              >
                Calculadora BTU
              </a>
            )}
            <a 
              href="#cobertura" 
              className={`transition-colors hover:text-cyan-500 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Cobertura
            </a>
            <button
              onClick={onOpenPortal}
              className="font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ color: primaryColor }}
            >
              <UserCheck className="w-4 h-4" />
              <span>Portal Clientes</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenBooking()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer hover:opacity-95 hover:shadow-lg active:scale-95"
              style={{
                backgroundColor: primaryColor,
                color: isDark ? '#000000' : '#ffffff',
                boxShadow: `0 4px 14px ${primaryColor}40`
              }}
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Mantención</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden border-b border-slate-200/60">
        {/* Backdrop Ambient Light */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 blur-3xl -z-10"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${primaryColor} 0%, transparent 60%)`
          }}
        />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs border"
            style={{
              backgroundColor: `${primaryColor}15`,
              borderColor: `${primaryColor}35`,
              color: isDark ? '#ffffff' : accentColor
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>{cfg.hero_badge}</span>
          </div>

          {/* Title */}
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {cfg.hero_title}
          </h2>

          {/* Subtitle */}
          <p className={`text-base max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {cfg.hero_subtitle}
          </p>

          {/* Hero Image Showcase (si existe) */}
          {cfg.hero_image_url && (
            <div className="pt-4 max-w-4xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-16/9 md:aspect-21/9 max-h-[380px]">
                <img
                  src={cfg.hero_image_url}
                  alt={cfg.hero_title}
                  className="w-full h-full object-cover transform hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white text-xs font-semibold">
                  <span className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Protocolo Técnico SEC Garantizado</span>
                  </span>
                  <span className="hidden sm:inline bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    Atención Residencial & Comercial
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenBooking()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition-all cursor-pointer hover:opacity-95 active:scale-95"
              style={{
                backgroundColor: primaryColor,
                color: isDark ? '#000000' : '#ffffff',
                boxShadow: `0 6px 20px ${primaryColor}40`
              }}
            >
              <Calendar className="w-4 h-4" />
              <span>{cfg.hero_cta_text}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm border shadow-xs transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>Consultar por WhatsApp</span>
            </a>

            <button
              onClick={onOpenPortal}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" style={{ color: primaryColor }} />
              <span>Consultar con {settings.tax_id_label || 'RUT'}</span>
            </button>
          </div>

          {/* Social Proof & Trust Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {cfg.hero_stat1_value}
                </span>
                <span className="text-[10px] text-slate-400">{cfg.hero_stat1_label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {cfg.hero_stat2_value}
                </span>
                <span className="text-[10px] text-slate-400">{cfg.hero_stat2_label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>SEC & R32</span>
                <span className="text-[10px] text-slate-400">Técnicos Certificados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Ofrecidos */}
      <section id="servicios" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span 
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: primaryColor }}
          >
            Catálogo Profesional
          </span>
          <h3 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Servicios Especializados de Climatización
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Ejecutamos cada servicio bajo estrictos protocolos técnicos de medición, limpieza y vacío profundo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeServices.map((svc, idx) => (
            <div
              key={svc.id || idx}
              className={`p-6 rounded-3xl border shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                isDark 
                  ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40' 
                  : 'bg-white border-slate-200 hover:border-cyan-500/50 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      border: `1px solid ${primaryColor}30`
                    }}
                  >
                    0{idx + 1}
                  </div>
                  {svc.badge && (
                    <span 
                      className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                        border: `1px solid ${primaryColor}25`
                      }}
                    >
                      {svc.badge}
                    </span>
                  )}
                </div>

                <h4 className={`text-base font-bold line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {svc.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {svc.desc}
                </p>
              </div>

              <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                {cfg.show_prices !== false && svc.price > 0 ? (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Desde</span>
                    <span className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {settings.currency_symbol || '$'} {Number(svc.price).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400">A Convenir</span>
                  </div>
                )}

                <button
                  onClick={() => onOpenBooking(svc.title)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                    borderColor: `${primaryColor}35`
                  }}
                >
                  Solicitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mini Calculadora BTU (Condicional) */}
      {cfg.show_thermal_calculator !== false && (
        <section id="calculadora" className={`py-16 px-6 border-y ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
          <div className={`max-w-4xl mx-auto rounded-3xl border p-8 md:p-10 shadow-sm space-y-8 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span 
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: primaryColor }}
                >
                  Herramienta Térmica Inteligente
                </span>
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ¿Cuántos BTU necesitas para climatizar tu espacio?
                </h3>
                <p className="text-xs text-slate-400">
                  Calcula la capacidad exacta recomendada para mantener tu ambiente a 21°C todo el año.
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: `${primaryColor}30`
                }}
              >
                <Calculator className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Superficie a climatizar:
                  </span>
                  <span className="font-bold font-mono" style={{ color: primaryColor }}>
                    {calcArea} m²
                  </span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="80"
                  value={calcArea}
                  onChange={(e) => setCalcArea(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tipo de Recinto
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'dormitorio', label: 'Dormitorio' },
                    { key: 'living', label: 'Living' },
                    { key: 'oficina', label: 'Oficina' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCalcRoom(key as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        calcRoom === key 
                          ? isDark 
                            ? 'bg-cyan-500/20 border-cyan-400 text-white' 
                            : 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold'
                          : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div 
              className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                backgroundColor: `${primaryColor}0d`,
                borderColor: `${primaryColor}30`
              }}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  Capacidad Óptima Sugerida
                </span>
                <div className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {miniCalcResult.recommended_btu.toLocaleString('es-CL')} BTU / h
                </div>
                <p className="text-xs text-slate-400 mt-1">{miniCalcResult.explanation}</p>
              </div>
              <button
                onClick={() => onOpenBooking(`Instalación Equipo ${miniCalcResult.recommended_btu} BTU`)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs whitespace-nowrap"
                style={{
                  backgroundColor: primaryColor,
                  color: isDark ? '#000000' : '#ffffff'
                }}
              >
                Cotizar con Instalación
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Cobertura Geográfica & Contacto */}
      <section id="cobertura" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span 
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: primaryColor }}
          >
            Presencia & Radio de Atención
          </span>
          <h3 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Zonas de Cobertura y Atención Técnica
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Contamos con móviles equipados para atender visitas de instalación, mantención preventiva y emergencias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Comunas */}
          <div className={`md:col-span-2 p-6 md:p-8 rounded-3xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          } space-y-4`}>
            <div className="flex items-center gap-2.5">
              <Navigation className="w-5 h-5 text-cyan-500" />
              <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Comunas y Sectores Atendidos
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Desplazamiento técnico directo sin demoras para clientes residenciales y comerciales:
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {(cfg.coverage_communes || []).map((commune, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${primaryColor}10`,
                    color: isDark ? '#ffffff' : '#0f172a',
                    borderColor: `${primaryColor}25`
                  }}
                >
                  <MapPin className="w-3 h-3 text-cyan-500" />
                  <span>{commune}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Card Horarios & Contacto */}
          <div className={`p-6 md:p-8 rounded-3xl border flex flex-col justify-between space-y-6 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-cyan-500" />
                <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Horario de Atención
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                {cfg.business_hours}
              </p>

              <div className="pt-2 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-500" />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{cfg.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-500" />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{cfg.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{cfg.address}</span>
                </div>
              </div>
            </div>

            {cfg.google_maps_url && (
              <a
                href={cfg.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Ubicación en Google Maps</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Redes Sociales & Reputación */}
      {(cfg.google_reviews_url || cfg.social_instagram_url || cfg.social_facebook_url || cfg.social_tiktok_url) && (
        <section className={`py-12 px-6 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">Reputación y Comunidad</span>
              <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Conecta con {cfg.fantasy_name}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {cfg.google_reviews_url && (
                <a
                  href={cfg.google_reviews_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>Google Reviews ({cfg.google_reviews_rating} ⭐)</span>
                </a>
              )}

              {cfg.social_instagram_url && (
                <a
                  href={cfg.social_instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-pink-500 text-pink-500 hover:bg-pink-500/10 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}

              {cfg.social_facebook_url && (
                <a
                  href={cfg.social_facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer 
        className={`border-t py-12 px-6 ${
          isDark ? 'bg-[#050811] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="space-y-1 text-center md:text-left">
            <h4 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {cfg.fantasy_name}
            </h4>
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{cfg.address}</span>
            </p>
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{cfg.phone}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-2">
              {cfg.footer_copyright}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPortal}
              className="text-cyan-500 hover:text-cyan-400 font-semibold cursor-pointer"
            >
              Portal Mi Climatización
            </button>
            <span>•</span>
            <button
              onClick={onAdminAccess}
              className="text-slate-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Acceso Técnicos / Admin</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
