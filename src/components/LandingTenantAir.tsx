import React, { useState } from 'react';
import { AirSettings } from '../types';
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
  Sparkles
} from 'lucide-react';
import { calculateThermalLoad } from '../lib/thermalCalculator';

interface LandingTenantAirProps {
  settings: AirSettings;
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onAdminAccess: () => void;
}

export const LandingTenantAir: React.FC<LandingTenantAirProps> = ({
  settings,
  onOpenBooking,
  onOpenPortal,
  onAdminAccess,
}) => {
  const [calcArea, setCalcArea] = useState(20);
  const [calcRoom, setCalcRoom] = useState<'dormitorio' | 'living' | 'oficina'>('living');

  const miniCalcResult = calculateThermalLoad({
    area_m2: calcArea,
    ceiling_height_m: 2.4,
    sun_exposure: 'media',
    room_type: calcRoom,
    people_count: 2,
    electronic_load: 'baja',
  });

  const landingCfg = settings.landing_config || {};
  const companyPhone = landingCfg.phone || settings.phone || '+56 9 3005 7769';
  const companyEmail = landingCfg.email || settings.email || 'contacto@nexusair.cl';
  const companyAddress = landingCfg.address || settings.address || 'Santiago, Chile';
  const services = landingCfg.services || [
    { title: 'Mantención Preventiva Profunda', desc: 'Limpieza química de serpentines, sanitización bactericida y control de gas refrigerante.', price: 45000 },
    { title: 'Instalación Split Inverter', desc: 'Montaje certificado en muro, vacío con bomba, sellado hermético y puesta en marcha.', price: 120000 },
    { title: 'Recarga y Detección de Fugas', desc: 'Presurización con nitrógeno seco y carga de refrigerante ecológico por balanza.', price: 65000 }
  ];

  const whatsappClean = companyPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(`Hola ${settings.company_name}, me gustaría consultar por servicios de climatización y mantención.`)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                {settings.company_name}
              </h1>
              <p className="text-[11px] text-cyan-700 font-bold uppercase tracking-wider">
                Servicios Certificados de Climatización
              </p>
            </div>
          </div>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#servicios" className="hover:text-cyan-700 transition-colors">Servicios</a>
            <a href="#calculadora" className="hover:text-cyan-700 transition-colors">Calculadora BTU</a>
            <a href="#cobertura" className="hover:text-cyan-700 transition-colors">Cobertura</a>
            <button
              onClick={onOpenPortal}
              className="text-cyan-700 hover:text-cyan-900 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Portal Clientes (RUT)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenBooking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Mantención</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden bg-gradient-to-b from-cyan-50/50 via-slate-50 to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-100/80 border border-cyan-300 text-cyan-800 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>{landingCfg.hero_badge || 'Técnicos Certificados SEC • Garantía 6 Meses'}</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            {landingCfg.hero_title || 'Especialistas en Climatización y Confort Térmico'}
          </h2>

          <p className="text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {landingCfg.hero_subtitle || 'Instalación certificada SEC, mantención preventiva profunda y servicio técnico de urgencia.'}
          </p>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenBooking}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Visita a Domicilio</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Consultar por WhatsApp</span>
            </a>

            <button
              onClick={onOpenPortal}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer border border-slate-200"
            >
              <UserCheck className="w-4 h-4 text-cyan-600" />
              <span>Consultar Estado con RUT</span>
            </button>
          </div>
        </div>
      </section>

      {/* Servicios Ofrecidos */}
      <section id="servicios" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">Catálogo Profesional</span>
          <h3 className="text-3xl font-extrabold text-slate-900">Servicios de Climatización</h3>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Trabajamos con protocolos rigurosos de medición termodinámica y sanitización bactericida.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((svc: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200 font-bold">
                  0{idx + 1}
                </div>
                <h4 className="text-lg font-bold text-slate-900">{svc.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{svc.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Desde</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    ${Number(svc.price).toLocaleString('es-CL')}
                  </span>
                </div>
                <button
                  onClick={onOpenBooking}
                  className="px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 transition-colors cursor-pointer"
                >
                  Solicitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mini Calculadora BTU */}
      <section id="calculadora" className="py-16 px-6 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-slate-200 p-8 md:p-10 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Herramienta Térmica</span>
              <h3 className="text-2xl font-black text-slate-900">¿Cuántos BTU necesitas para tu espacio?</h3>
              <p className="text-xs text-slate-500">Calcula la capacidad exacta recomendada para climatizar tu habitación.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Superficie a climatizar:</span>
                <span className="font-bold text-cyan-700 font-mono">{calcArea} m²</span>
              </div>
              <input
                type="range"
                min="9"
                max="80"
                value={calcArea}
                onChange={(e) => setCalcArea(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Tipo de Recinto</label>
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
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-900' 
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
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-cyan-800 font-bold uppercase tracking-wider">Capacidad Óptima Sugerida</span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {miniCalcResult.recommended_btu.toLocaleString('es-CL')} BTU / h
              </div>
              <p className="text-xs text-slate-600 mt-1">{miniCalcResult.explanation}</p>
            </div>
            <button
              onClick={onOpenBooking}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              Cotizar con Instalación
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-extrabold text-slate-900 text-sm">{settings.company_name}</h4>
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{companyAddress}</span>
            </p>
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{companyPhone}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPortal}
              className="text-cyan-700 hover:text-cyan-900 font-semibold"
            >
              Portal Mi Climatización
            </button>
            <span>•</span>
            <button
              onClick={onAdminAccess}
              className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
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
