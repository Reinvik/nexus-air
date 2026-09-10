import React, { useState } from 'react';
import { 
  Wind, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  Loader2,
  Search,
  ArrowLeft
} from 'lucide-react';

interface LoginAirProps {
  onLogin: (email: string, pass: string) => Promise<{ error: any }>;
  onQuickDemoAccess?: () => void;
  onBackToLanding: () => void;
  onOpenCustomerPortal: () => void;
  onOpenBooking: () => void;
}

export const LoginAir: React.FC<LoginAirProps> = ({
  onLogin,
  onQuickDemoAccess,
  onBackToLanding,
  onOpenCustomerPortal,
  onOpenBooking
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await onLogin(email, password);
      if (error) {
        setErrorMsg(error.message || 'Credenciales inválidas. Verifica tu correo y contraseña.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Glow Effects de Fondo */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[140px] opacity-20 bg-cyan-500 pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[140px] opacity-20 bg-blue-600 pointer-events-none" />

      {/* Botón Superior para Regresar */}
      <div className="w-full max-w-5xl mb-4 flex items-center justify-between z-10">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Volver a la Web Principal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCustomerPortal}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
          >
            Portal de Clientes (Consultar RUT)
          </button>
          <span className="text-slate-600">•</span>
          <button
            onClick={onOpenBooking}
            className="text-xs text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Agendar Visita
          </button>
        </div>
      </div>

      {/* Contenedor Split-Screen Oficial Smartlean */}
      <div className="w-full max-w-5xl bg-[#090d1a] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10">
        
        {/* PANEL IZQUIERDO: Hero Tecnológico Smartlean */}
        <div className="p-8 md:p-12 lg:p-14 bg-gradient-to-br from-[#060a16] via-[#080e1e] to-[#040711] flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 relative">
          
          <div className="space-y-8">
            {/* Header del Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
                <Wind className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wider text-white flex items-center gap-1.5" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.2)' }}>
                  NEXUS<span className="text-cyan-400">AIR</span>
                </h1>
                <span className="text-[10px] font-bold tracking-widest text-[#00d2ff] uppercase block" style={{ textShadow: '0 0 10px rgba(0, 210, 255, 0.4)' }}>
                  BY SMARTLEAN • HVAC OS
                </span>
              </div>
            </div>

            {/* Badge Tecnológico */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00d2ff] text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                TECNOLOGÍA HVAC 4.0 ACTIVA
              </span>
            </div>

            {/* Título Principal */}
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                El sistema de climatización{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  que potencia tu empresa técnica
                </span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plataforma unificada para gestión de órdenes Kanban, cálculo térmico de BTU y retención de clientes semestral cada 180 días.
              </p>
            </div>

            {/* 3 Ventajas Corporativas con Iconos Cian */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cálculo Térmico & BTU Instantáneo</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Dimensionamiento en terreno según metros cuadrados, aislación y carga térmica.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Recaptación Semestral 180D Automatizada</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Disparo de recordatorios preventivos para asegurar la mantención periódica de cada equipo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ficha Técnica HVAC & Salto Térmico ΔT</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Control de presiones PSI, consumo en Amperes y checklist bajo norma de seguridad.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de Página Izquierdo */}
          <div className="pt-8 border-t border-slate-800/60 mt-8 flex items-center justify-between text-[11px] text-slate-500">
            <span>© 2026 SMARTLEAN • PRODUCTO OFICIAL</span>
            <span className="text-cyan-400/80 font-mono">v1.2.0-HVAC</span>
          </div>
        </div>

        {/* PANEL DERECHO: Formulario de Login */}
        <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-between bg-[#080c18]">
          <div className="space-y-6 my-auto max-w-sm mx-auto w-full">
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Acceso Empresa</h3>
              <p className="text-xs text-slate-400">
                Inicia sesión con tus credenciales de administrador o técnico autorizado.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa-clima.cl"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#03060f] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Contraseña</label>
                  <span className="text-[11px] text-slate-500">Credencial cifrada</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-[#03060f] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botón Primario Degradado Oficial Smartlean */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs text-slate-950 uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(90deg, #00d2ff 0%, #2563eb 100%)',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Verificando Acceso...</span>
                    </>
                  ) : (
                    <>
                      <span>INGRESAR AL SISTEMA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {onQuickDemoAccess && (
                  <button
                    type="button"
                    onClick={onQuickDemoAccess}
                    className="w-full mt-2.5 py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Ingreso Rápido Demostración</span>
                    <span className="text-[10px] bg-cyan-400/20 text-cyan-200 px-1.5 py-0.5 rounded">Admin</span>
                  </button>
                )}
              </div>
            </form>

            {/* Acceso para Clientes */}
            <div className="pt-6 border-t border-slate-800/80 text-center space-y-3">
              <p className="text-[11px] text-slate-400">
                ¿Eres cliente de una empresa climatizadora?
              </p>
              <button
                type="button"
                onClick={onOpenCustomerPortal}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-400 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Consultar Estado de Mi Equipo con RUT</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
