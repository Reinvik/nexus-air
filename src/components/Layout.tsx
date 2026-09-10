import React from 'react';
import { ViewTab, AirSettings } from '../types';
import { 
  Kanban, 
  Clock, 
  Calendar, 
  Calculator, 
  Boxes, 
  Users, 
  Wrench, 
  TrendingUp, 
  Settings, 
  Plus, 
  Wind, 
  ThermometerSnowflake, 
  ExternalLink, 
  UserCheck, 
  ShieldCheck, 
  AlertTriangle,
  Camera,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenNewOrder: () => void;
  onOpenLanding: () => void;
  onOpenPortal: () => void;
  overdueRecaptacionCount: number;
  activeOrdersCount: number;
  settings: AirSettings;
  currentUserProfile?: any;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
  onOpenLanding,
  onOpenPortal,
  overdueRecaptacionCount,
  activeOrdersCount,
  settings,
  currentUserProfile,
  onLogout,
  children,
}) => {
  const mainNav: { id: ViewTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Tablero Órdenes', icon: Kanban, badge: activeOrdersCount },
    { 
      id: 'recaptacion', 
      label: 'Recaptación 6M', 
      icon: Clock, 
      badge: overdueRecaptacionCount, 
      badgeColor: overdueRecaptacionCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : undefined 
    },
    { id: 'agenda', label: 'Agenda & Visitas', icon: Calendar },
    { id: 'cotizador', label: 'Cotizador BTU', icon: Calculator },
  ];

  const manageNav: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: 'inventory', label: 'Equipos & Stock', icon: Boxes },
    { id: 'customers', label: 'Clientes & Inmuebles', icon: Users },
    { id: 'technicians', label: 'Técnicos HVAC', icon: Wrench },
    { id: 'sales', label: 'Ventas & Finanzas', icon: TrendingUp },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Smartlean / Nexus Dark Sidebar */}
      <aside className="w-[270px] bg-[#050811] border-r border-white/[0.04] flex flex-col justify-between shrink-0 shadow-2xl z-30">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(0,210,255,0.1)] border border-[rgba(0,210,255,0.3)] flex items-center justify-center text-[#00d2ff] shadow-[0_0_15px_rgba(0,210,255,0.25)] transition-transform hover:scale-105">
                <Wind className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="text-[20px] font-black tracking-[-0.04em] text-white flex items-center leading-none">
                  NEXUS<span className="text-[#00d2ff]">AIR</span>
                </div>
                <span className="text-[9px] font-extrabold text-[#00d2ff] tracking-[0.16em] uppercase mt-1">
                  BY SMARTLEAN
                </span>
              </div>
            </div>

            {/* Quick Action Button - Smartlean Gradient */}
            <button
              onClick={onOpenNewOrder}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>NUEVA ORDEN TÉCNICA</span>
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-3 py-2 space-y-4">
            {/* Category: MENU PRINCIPAL */}
            <div>
              <div className="text-[10px] font-extrabold text-[#475569] tracking-[0.15em] px-3 py-1.5 uppercase">
                MENÚ PRINCIPAL
              </div>
              <div className="space-y-1 mt-1">
                {mainNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold nexus-sidebar-item cursor-pointer ${
                        isActive
                          ? 'active text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#00d2ff]' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            item.badgeColor || (isActive ? 'bg-cyan-500/20 text-[#00d2ff] border-cyan-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category: GESTIÓN & EQUIPOS */}
            <div>
              <div className="text-[10px] font-extrabold text-[#475569] tracking-[0.15em] px-3 py-1.5 uppercase">
                GESTIÓN & EQUIPOS
              </div>
              <div className="space-y-1 mt-1">
                {manageNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold nexus-sidebar-item cursor-pointer ${
                        isActive
                          ? 'active text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#00d2ff]' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Smartlean Profile Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-[#03060d] space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative group/avatar cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#00d2ff] shrink-0 font-bold">
                {currentUserProfile?.full_name ? currentUserProfile.full_name.substring(0, 2).toUpperCase() : 'NA'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#090f1e] border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover/avatar:scale-110 group-hover/avatar:bg-[#00d2ff] group-hover/avatar:text-slate-950 transition-all">
                <Camera className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentUserProfile?.full_name || 'Admin Climatización'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {currentUserProfile?.email || settings.email || 'contacto@nexusair.cl'}
              </div>
              <div className="text-[10px] font-bold text-[#00d2ff]">
                {currentUserProfile?.role === 'admin' ? 'Administrador HVAC' : 'Técnico Certificado SEC'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className="w-full py-2 px-2 bg-[rgba(6,182,212,0.03)] hover:bg-[rgba(6,182,212,0.12)] border border-[rgba(6,182,212,0.2)] hover:border-[rgba(6,182,212,0.45)] text-[#00d2ff] hover:text-white rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-2 whitespace-nowrap tracking-[0.03em] transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AJUSTES & PERFIL DE EMPRESA</span>
          </button>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group/re cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 group-hover/re:rotate-180 transition-transform duration-500" />
              <span>REINICIAR</span>
            </button>

            <button
              onClick={() => {
                if (onLogout) onLogout();
                else onOpenLanding();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-[#f87171] hover:bg-rose-500/15 hover:border-rose-500/40 border border-transparent transition-all cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>SALIR</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - CRISP LIGHT CONTRAST (Estilo Nexus Lean) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {[...mainNav, ...manageNav].find(i => i.id === activeTab)?.label || 'Panel de Climatización'}
              </h1>
              <p className="text-[11px] text-slate-500">
                {settings.company_name} • Mantenimiento Preventivo Semestral
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {overdueRecaptacionCount > 0 && (
              <button
                onClick={() => setActiveTab('recaptacion')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{overdueRecaptacionCount} Equipos por Recaptar (6M)</span>
              </button>
            )}

            <button
              onClick={onOpenPortal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
            >
              <UserCheck className="w-4 h-4 text-cyan-600" />
              <span className="hidden sm:inline">Portal Cliente</span>
            </button>

            <button
              onClick={onOpenLanding}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-4 h-4 text-cyan-600" />
              <span className="hidden sm:inline">Landing Pública</span>
            </button>
          </div>
        </header>

        {/* Tab Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
