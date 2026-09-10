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
  AlertTriangle 
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
  children,
}) => {
  const navItems: { id: ViewTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
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
    { id: 'inventory', label: 'Equipos & Stock', icon: Boxes },
    { id: 'customers', label: 'Clientes & Inmuebles', icon: Users },
    { id: 'technicians', label: 'Técnicos HVAC', icon: Wrench },
    { id: 'sales', label: 'Ventas & Finanzas', icon: TrendingUp },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Lateral Sidebar */}
      <aside className="w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                  NEXUS<span className="text-cyan-400">AIR</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                  HVAC
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[170px]">{settings.fantasy_name}</p>
            </div>
          </div>

          {/* Air Status indicator */}
          <div className="mt-4 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-cyan-400">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-medium text-slate-300">Clima Óptimo</span>
            </div>
            <span className="text-cyan-300 font-mono font-bold">22.5°C</span>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onOpenNewOrder}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            Nueva Orden Técnica
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                      item.badgeColor || (isActive ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* External Views & Footer */}
        <div className="p-4 border-t border-slate-800/60 space-y-2 bg-slate-950/40">
          <button
            onClick={onOpenLanding}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors border border-slate-800 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              Ver Landing Pública
            </span>
            <span className="text-[10px] text-cyan-400/80 font-mono">nexusair.cl</span>
          </button>

          <button
            onClick={onOpenPortal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors border border-slate-800 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              Portal de Cliente
            </span>
            <span className="text-[10px] text-blue-400/80 font-mono">Mis Aires</span>
          </button>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Certificación SEC
            </span>
            <span>v1.0 • Nexus</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white tracking-wide">
              {navItems.find(i => i.id === activeTab)?.label || 'Panel de Climatización'}
            </h1>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              {settings.company_name} — Mantenimiento Preventivo Semestral (Cada 6 Meses)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {overdueRecaptacionCount > 0 && (
              <button
                onClick={() => setActiveTab('recaptacion')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{overdueRecaptacionCount} Equipos por Recaptar (6M)</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Sistema Activo</span>
            </div>
          </div>
        </header>

        {/* Tab Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
