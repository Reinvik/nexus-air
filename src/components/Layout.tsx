import React, { useState } from 'react';
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
  LogOut,
  Menu,
  X,
  Crown,
  ShieldAlert,
  Globe,
  Search
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
  isNexusOwner?: boolean;
  onLogout?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
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
  isNexusOwner,
  onLogout,
  searchTerm,
  onSearchChange,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mainNav: { id: ViewTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Tablero Órdenes', icon: Kanban, badge: activeOrdersCount },
    { 
      id: 'recaptacion', 
      label: `Recaptación ${settings?.maintenance_interval_months || 6}M`, 
      icon: Clock, 
      badge: overdueRecaptacionCount, 
      badgeColor: overdueRecaptacionCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : undefined 
    },
    { id: 'agenda', label: 'Agenda & Visitas', icon: Calendar },
    { id: 'cotizador', label: 'Cotizador BTU', icon: Calculator },
  ];

  const manageNav: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: 'inventory', label: 'Equipos & Stock', icon: Boxes },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'technicians', label: 'Técnicos HVAC', icon: Wrench },
    { id: 'sales', label: 'Ventas & Finanzas', icon: TrendingUp },
    { id: 'landingpage', label: 'Mi Landing Page', icon: Globe },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in cursor-pointer"
        />
      )}

      {/* Smartlean / Nexus Dark Sidebar */}
      <aside className={`w-[270px] bg-[#050811] border-r border-white/[0.04] flex flex-col justify-between shrink-0 shadow-2xl z-50 fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {settings?.logo_url ? (
                  <div className="h-9 max-w-[70px] flex items-center justify-center shrink-0">
                    <img
                      src={settings.logo_url}
                      alt={settings.fantasy_name || 'Logo'}
                      className="max-h-9 max-w-[70px] object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[rgba(0,210,255,0.1)] border border-[rgba(0,210,255,0.3)] flex items-center justify-center text-[#00d2ff] shadow-[0_0_15px_rgba(0,210,255,0.25)] transition-transform hover:scale-105 shrink-0">
                    <Wind className="w-5 h-5" />
                  </div>
                )}
                <div className="flex flex-col truncate min-w-0">
                  <div className="text-[17px] font-black tracking-[-0.04em] text-white leading-none truncate">
                    {settings?.fantasy_name || <>NEXUS<span className="text-[#00d2ff]">AIR</span></>}
                  </div>
                  <span className="text-[8.5px] font-extrabold text-[#00d2ff] tracking-[0.12em] uppercase mt-1 truncate">
                    {settings?.company_slogan || 'BY SMARTLEAN'}
                  </span>
                </div>
              </div>

              {/* Close Button on Mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] md:hidden transition-colors cursor-pointer"
                title="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Button - Smartlean Gradient */}
            <button
              onClick={() => {
                onOpenNewOrder();
                setIsMobileMenuOpen(false);
              }}
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
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
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
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
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

            {/* Category: SUPERADMIN (EXCLUSIVO NEXUS OWNER) */}
            {isNexusOwner && (
              <div className="pt-2 border-t border-white/[0.05]">
                <div className="text-[10px] font-extrabold text-amber-400 tracking-[0.15em] px-3 py-1.5 uppercase flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>SUPERADMIN GLOBAL</span>
                </div>
                <div className="space-y-1 mt-1">
                  <button
                    onClick={() => {
                      setActiveTab('nexus_owner');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold nexus-sidebar-item cursor-pointer transition-all ${
                      activeTab === 'nexus_owner'
                        ? 'active text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert className={`w-4 h-4 transition-colors ${activeTab === 'nexus_owner' ? 'text-amber-400' : 'text-amber-500/80'}`} />
                      <span>Nexus Owner</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      OWNER
                    </span>
                  </button>
                </div>
              </div>
            )}
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
                {isNexusOwner
                  ? '👑 Nexus Owner HVAC'
                  : currentUserProfile?.role === 'admin'
                  ? 'Administrador HVAC'
                  : 'Técnico Certificado SEC'}
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
        {/* Top Navbar - Compactado y Optimizado en el Eje X */}
        <header className="h-14 sm:h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors cursor-pointer"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                {[...mainNav, ...manageNav].find(i => i.id === activeTab)?.label || 'Panel de Climatización'}
              </h1>
              <p className="text-[10px] text-slate-500 truncate max-w-[130px] sm:max-w-none">
                {settings.company_name} • Mantenimiento ({settings.maintenance_interval_months || 6}M)
              </p>
            </div>
          </div>

          {/* Buscador Global en el Centro de la Cabecera (Optimiza el Eje X) */}
          {activeTab === 'dashboard' && onSearchChange && (
            <div className="flex-1 max-w-md mx-2 hidden sm:block">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar ticket, cliente, comuna o equipo..."
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-2xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Acciones Rápidas en la Cabecera: Nueva Orden, Portal y Landing */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {overdueRecaptacionCount > 0 && (
              <button
                onClick={() => setActiveTab('recaptacion')}
                className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden lg:inline">{overdueRecaptacionCount} Equipos por Recaptar</span>
                <span className="lg:hidden">{overdueRecaptacionCount}</span>
              </button>
            )}

            {/* Botón "+ Nueva Orden" en la Cabecera */}
            <button
              onClick={onOpenNewOrder}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-sm shadow-blue-500/25 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Crear nueva orden técnica"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Nueva Orden</span>
            </button>

            <button
              onClick={onOpenPortal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs shrink-0"
              title="Portal Cliente"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden md:inline">Portal Cliente</span>
            </button>

            <button
              onClick={onOpenLanding}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs shrink-0"
              title="Landing Pública"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden md:inline">Landing Pública</span>
            </button>
          </div>
        </header>

        {/* Tab Viewport - Reducción de padding en dashboard para aprovechar el eje X y eje Y */}
        <main className={`flex-1 overflow-y-auto bg-slate-50 ${activeTab === 'dashboard' ? 'p-2.5 sm:p-3.5 lg:p-4' : 'p-4 sm:p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
