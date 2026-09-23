import React, { useState, useEffect } from 'react';
import { AirSettings, LandingPageConfig, LandingServiceItem } from '../types';
import { 
  Save, 
  Upload, 
  Eye, 
  MapPin, 
  Loader2, 
  CheckCircle2, 
  Phone, 
  Clock, 
  Star, 
  X, 
  RefreshCw, 
  Palette, 
  Monitor, 
  Smartphone, 
  ExternalLink, 
  Copy, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calculator, 
  ShieldCheck, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Globe,
  Share2,
  DollarSign,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  HVAC_COLOR_PRESETS, 
  HVAC_HERO_PRESETS, 
  DEFAULT_HVAC_SERVICES, 
  DEFAULT_COVERAGE_COMMUNES,
  resolveAirLandingConfig 
} from '../lib/landingConfigAir';
import { LandingTenantAir } from './LandingTenantAir';
import { toast } from 'react-hot-toast';

interface LandingEditorAirProps {
  settings: AirSettings;
  onUpdateSettings: (updates: Partial<AirSettings>) => Promise<void> | void;
  onBackToDashboard?: () => void;
}

type EditorTab = 'colores' | 'hero' | 'servicios' | 'cobertura' | 'social' | 'slug';
type ViewMode = 'split' | 'editor' | 'preview';
type DeviceMode = 'desktop' | 'mobile';

export const LandingEditorAir: React.FC<LandingEditorAirProps> = ({
  settings,
  onUpdateSettings,
  onBackToDashboard,
}) => {
  // Configuración de borrador en vivo
  const [draftConfig, setDraftConfig] = useState<LandingPageConfig>(() => {
    return resolveAirLandingConfig(settings);
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('colores');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [newCommune, setNewCommune] = useState('');

  // Sincronizar si cambian los settings externos
  useEffect(() => {
    if (settings) {
      setDraftConfig(prev => ({
        ...resolveAirLandingConfig(settings),
        ...prev,
      }));
    }
  }, [settings]);

  // Manejador para actualizar atributos individuales del draft
  const updateField = <K extends keyof LandingPageConfig>(key: K, value: LandingPageConfig[K]) => {
    setDraftConfig(prev => ({ ...prev, [key]: value }));
  };

  // Guardar en Supabase y LocalStorage
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings({
        landing_config: draftConfig,
        logo_url: draftConfig.header_logo_url || settings.logo_url,
        fantasy_name: draftConfig.fantasy_name || settings.fantasy_name,
        company_slogan: draftConfig.slogan || settings.company_slogan,
      });
      toast.success('Landing page guardada y publicada exitosamente', {
        icon: '🚀',
        duration: 3500
      });
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar cambios de la landing page');
    } finally {
      setIsSaving(false);
    }
  };

  // Carga de logo en base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      updateField('header_logo_url', b64);
      toast.success('Logo cargado a la vista previa');
    };
    reader.readAsDataURL(file);
  };

  // Carga de banner hero en base64
  const handleHeroBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      updateField('hero_image_url', b64);
      toast.success('Imagen de portada actualizada');
    };
    reader.readAsDataURL(file);
  };

  // Gestión de Servicios
  const handleServiceChange = (index: number, field: keyof LandingServiceItem, value: any) => {
    const current = [...(draftConfig.services || DEFAULT_HVAC_SERVICES)];
    current[index] = { ...current[index], [field]: value };
    updateField('services', current);
  };

  const handleAddService = () => {
    const current = [...(draftConfig.services || DEFAULT_HVAC_SERVICES)];
    current.push({
      id: `svc-${Date.now()}`,
      title: 'Nuevo Servicio HVAC',
      desc: 'Descripción del procedimiento técnico y alcance del trabajo.',
      price: 50000,
      badge: '',
      active: true,
    });
    updateField('services', current);
    toast.success('Servicio agregado');
  };

  const handleDeleteService = (index: number) => {
    const current = [...(draftConfig.services || DEFAULT_HVAC_SERVICES)];
    current.splice(index, 1);
    updateField('services', current);
  };

  const handleResetServices = () => {
    updateField('services', DEFAULT_HVAC_SERVICES);
    toast.success('Catálogo de servicios restaurado a los valores estándar');
  };

  // Gestión de Comunas
  const handleAddCommune = () => {
    if (!newCommune.trim()) return;
    const current = [...(draftConfig.coverage_communes || DEFAULT_COVERAGE_COMMUNES)];
    if (!current.includes(newCommune.trim())) {
      current.push(newCommune.trim());
      updateField('coverage_communes', current);
      setNewCommune('');
      toast.success(`Comuna "${newCommune.trim()}" agregada`);
    } else {
      toast.error('La comuna ya está en la lista');
    }
  };

  const handleRemoveCommune = (communeToRemove: string) => {
    const current = (draftConfig.coverage_communes || DEFAULT_COVERAGE_COMMUNES).filter(c => c !== communeToRemove);
    updateField('coverage_communes', current);
  };

  // URL pública de la empresa
  const companySlug = settings.company_slug || 'nexus-air';
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?t=${companySlug}`
    : `https://air.nexusnetwork.cl/?t=${companySlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Enlace de tu landing page copiado al portapapeles', { icon: '📋' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 bg-slate-100 overflow-hidden font-sans">
      {/* Top Header & Toolbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 leading-none">
                Mi Landing Page
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pública en Vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personaliza el portal web oficial de {settings.fantasy_name || settings.company_name}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Selector */}
          <div className="hidden lg:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Editor + Previa
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'editor' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Solo Editor
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Solo Previa
            </button>
          </div>

          {/* Device Toggle (Only in Preview or Split) */}
          {viewMode !== 'editor' && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'desktop' ? 'bg-white text-cyan-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista Computador"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'mobile' ? 'bg-white text-cyan-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista Smartphone"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Copy Public Link */}
          <button
            onClick={handleCopyLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            title="Copiar URL para compartir con clientes"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-600" />
            <span>Copiar Enlace</span>
          </button>

          {/* Open In New Tab */}
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Abrir página pública en pestaña nueva"
          >
            <ExternalLink className="w-4 h-4 text-cyan-600" />
          </a>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar y Publicar</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Sidebar Panel */}
        {viewMode !== 'preview' && (
          <div className={`${
            viewMode === 'editor' ? 'w-full max-w-4xl mx-auto' : 'w-full lg:w-[480px] xl:w-[520px]'
          } bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-10 overflow-hidden`}>
            {/* Tab Navigation */}
            <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 shrink-0 no-scrollbar">
              {[
                { id: 'colores', label: 'Diseño & Colores', icon: Palette },
                { id: 'hero', label: 'Hero & Portada', icon: Sparkles },
                { id: 'servicios', label: 'Servicios & Tarifas', icon: DollarSign },
                { id: 'cobertura', label: 'Cobertura & Contacto', icon: MapPin },
                { id: 'social', label: 'Redes & Reputación', icon: Star },
                { id: 'slug', label: 'Enlace & Slug', icon: Globe },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as EditorTab)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-cyan-700 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: COLORES & DISEÑO */}
              {activeTab === 'colores' && (
                <div className="space-y-6">
                  {/* Identidad de Marca */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Identidad de Marca
                    </h3>

                    {/* Nombre Fantasía */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nombre de Fantasía (Cabecera)</label>
                      <input
                        type="text"
                        value={draftConfig.fantasy_name || ''}
                        onChange={(e) => updateField('fantasy_name', e.target.value)}
                        placeholder="Ej: Shaddai Air Climatización"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Slogan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Eslogan o Frase Clave</label>
                      <input
                        type="text"
                        value={draftConfig.slogan || ''}
                        onChange={(e) => updateField('slogan', e.target.value)}
                        placeholder="Ej: Climatización de Precisión y Confort Térmico"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Logotipo */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">Logotipo de la Empresa</label>
                      <div className="flex items-center gap-3">
                        {draftConfig.header_logo_url ? (
                          <div className="w-14 h-14 rounded-xl border border-slate-200 p-1 flex items-center justify-center bg-slate-50 shrink-0">
                            <img
                              src={draftConfig.header_logo_url}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Upload className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5">
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer border border-slate-200">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Archivo Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                          {draftConfig.header_logo_url && (
                            <button
                              onClick={() => updateField('header_logo_url', '')}
                              className="ml-2 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                            >
                              Eliminar logo
                            </button>
                          )}
                          <p className="text-[11px] text-slate-400">PNG o JPG con fondo transparente recomendado</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Paleta de Colores Recomendada */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Paletas Oficiales de Climatización
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {HVAC_COLOR_PRESETS.map((preset) => {
                        const isSelected = draftConfig.theme_primary_color?.toLowerCase() === preset.primary.toLowerCase();
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              updateField('theme_primary_color', preset.primary);
                              updateField('theme_accent_color', preset.accent);
                            }}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-cyan-50/50 border-cyan-400 ring-2 ring-cyan-400/20'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                  style={{ backgroundColor: preset.primary }}
                                />
                                <span
                                  className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                  style={{ backgroundColor: preset.accent }}
                                />
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 leading-tight">
                              {preset.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector Manual de Colores */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Ajuste Manual de Colores Hexadecimales</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Color Primario</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={draftConfig.theme_primary_color || '#00d2ff'}
                            onChange={(e) => updateField('theme_primary_color', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                          />
                          <input
                            type="text"
                            value={draftConfig.theme_primary_color || '#00d2ff'}
                            onChange={(e) => updateField('theme_primary_color', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Color de Acento</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={draftConfig.theme_accent_color || '#0284c7'}
                            onChange={(e) => updateField('theme_accent_color', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                          />
                          <input
                            type="text"
                            value={draftConfig.theme_accent_color || '#0284c7'}
                            onChange={(e) => updateField('theme_accent_color', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Modo Oscuro de Alto Contraste</span>
                      <input
                        type="checkbox"
                        checked={Boolean(draftConfig.theme_is_dark)}
                        onChange={(e) => updateField('theme_is_dark', e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HERO & PORTADA */}
              {activeTab === 'hero' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Badge de Confianza (Píldora Superior)</label>
                    <input
                      type="text"
                      value={draftConfig.hero_badge || ''}
                      onChange={(e) => updateField('hero_badge', e.target.value)}
                      placeholder="Ej: Técnicos Certificados SEC • Garantía 6 Meses"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Título Principal del Banner</label>
                    <textarea
                      rows={2}
                      value={draftConfig.hero_title || ''}
                      onChange={(e) => updateField('hero_title', e.target.value)}
                      placeholder="Ej: Especialistas en Climatización y Confort Térmico"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Subtítulo Explicativo</label>
                    <textarea
                      rows={3}
                      value={draftConfig.hero_subtitle || ''}
                      onChange={(e) => updateField('hero_subtitle', e.target.value)}
                      placeholder="Ej: Instalación certificada SEC, mantención preventiva profunda y servicio técnico de urgencia."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Texto del Botón de Acción Principal</label>
                    <input
                      type="text"
                      value={draftConfig.hero_cta_text || ''}
                      onChange={(e) => updateField('hero_cta_text', e.target.value)}
                      placeholder="Ej: Agendar Visita a Domicilio"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <hr className="border-slate-100" />

                  {/* Imagen de Portada Hero */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Imagen de Portada (Hero Banner)</label>
                      {draftConfig.hero_image_url && (
                        <button
                          onClick={() => updateField('hero_image_url', '')}
                          className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                        >
                          Quitar imagen
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {HVAC_HERO_PRESETS.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => updateField('hero_image_url', preset.url)}
                          className={`relative rounded-xl overflow-hidden border cursor-pointer group transition-all aspect-video ${
                            draftConfig.hero_image_url === preset.url
                              ? 'border-cyan-500 ring-2 ring-cyan-400'
                              : 'border-slate-200 hover:border-cyan-300'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                            <span className="text-[10px] font-bold text-white leading-tight">
                              {preset.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer border border-slate-200">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen Propia</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroBannerUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={draftConfig.hero_image_url || ''}
                        onChange={(e) => updateField('hero_image_url', e.target.value)}
                        placeholder="O pegar URL de imagen..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Estadísticas de Confianza */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Indicadores de Confianza (Stats)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 font-semibold">Stat 1 (Valor)</label>
                        <input
                          type="text"
                          value={draftConfig.hero_stat1_value || ''}
                          onChange={(e) => updateField('hero_stat1_value', e.target.value)}
                          placeholder="4.9/5"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                        />
                        <input
                          type="text"
                          value={draftConfig.hero_stat1_label || ''}
                          onChange={(e) => updateField('hero_stat1_label', e.target.value)}
                          placeholder="Ranking Clientes"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 font-semibold">Stat 2 (Garantía)</label>
                        <input
                          type="text"
                          value={draftConfig.hero_stat2_value || ''}
                          onChange={(e) => updateField('hero_stat2_value', e.target.value)}
                          placeholder="6 Meses"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                        />
                        <input
                          type="text"
                          value={draftConfig.hero_stat2_label || ''}
                          onChange={(e) => updateField('hero_stat2_label', e.target.value)}
                          placeholder="Garantía Estándar"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SERVICIOS & TARIFAS */}
              {activeTab === 'servicios' && (
                <div className="space-y-6">
                  {/* Interruptores Globales */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Mostrar Precios en la Web</span>
                        <span className="text-[11px] text-slate-400">Si lo desactivas, aparecerá "Tarifas a convenir"</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftConfig.show_prices !== false}
                        onChange={(e) => updateField('show_prices', e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Mostrar Calculadora Térmica BTU</span>
                        <span className="text-[11px] text-slate-400">Permite a los visitantes calcular la potencia recomendada</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftConfig.show_thermal_calculator !== false}
                        onChange={(e) => updateField('show_thermal_calculator', e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Lista de Servicios */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Catálogo de Servicios Ofrecidos
                      </h3>
                      <button
                        onClick={handleResetServices}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        title="Restaurar a los 4 servicios HVAC sugeridos"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restaurar Estándar</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(draftConfig.services || DEFAULT_HVAC_SERVICES).map((svc, index) => (
                        <div
                          key={svc.id || index}
                          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">
                              Servicio 0{index + 1}
                            </span>
                            <button
                              onClick={() => handleDeleteService(index)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar este servicio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Título</label>
                            <input
                              type="text"
                              value={svc.title}
                              onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                              placeholder="Ej: Mantención Preventiva Profunda"
                              className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Descripción detallada</label>
                            <textarea
                              rows={2}
                              value={svc.desc}
                              onChange={(e) => handleServiceChange(index, 'desc', e.target.value)}
                              placeholder="Detalla lo que incluye el servicio..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-600">
                                Precio Referencial ({settings.currency_symbol || '$'})
                              </label>
                              <input
                                type="number"
                                value={svc.price}
                                onChange={(e) => handleServiceChange(index, 'price', Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-600">Badge / Etiqueta</label>
                              <input
                                type="text"
                                value={svc.badge || ''}
                                onChange={(e) => handleServiceChange(index, 'badge', e.target.value)}
                                placeholder="Ej: Más Solicitado"
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleAddService}
                      className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-cyan-400 text-slate-600 hover:text-cyan-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-slate-50/50 hover:bg-cyan-50/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Otro Servicio</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: COBERTURA & CONTACTO */}
              {activeTab === 'cobertura' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Dirección Física de la Empresa</label>
                    <input
                      type="text"
                      value={draftConfig.address || ''}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Ej: Av. Apoquindo 4500, Las Condes"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Teléfono Directo</label>
                      <input
                        type="text"
                        value={draftConfig.phone || ''}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+56 9 3005 7769"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Correo Electrónico</label>
                      <input
                        type="email"
                        value={draftConfig.email || ''}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="contacto@miempresa.cl"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Horario de Atención</label>
                    <input
                      type="text"
                      value={draftConfig.business_hours || ''}
                      onChange={(e) => updateField('business_hours', e.target.value)}
                      placeholder="Lunes a Viernes: 08:30 - 18:30 | Sábados: 09:00 - 14:00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Mensaje Automático de WhatsApp</label>
                    <textarea
                      rows={2}
                      value={draftConfig.whatsapp_custom_message || ''}
                      onChange={(e) => updateField('whatsapp_custom_message', e.target.value)}
                      placeholder="Texto con el que el cliente iniciará la conversación al dar clic en WhatsApp"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <hr className="border-slate-100" />

                  {/* Comunas de Cobertura */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700">
                      Comunas o Ciudades de Cobertura
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCommune}
                        onChange={(e) => setNewCommune(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCommune()}
                        placeholder="Añadir comuna (ej: Vitacura)"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200"
                      />
                      <button
                        onClick={handleAddCommune}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Añadir
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto">
                      {(draftConfig.coverage_communes || DEFAULT_COVERAGE_COMMUNES).map((commune, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                        >
                          <span>{commune}</span>
                          <button
                            onClick={() => handleRemoveCommune(commune)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: REDES & REPUTACIÓN */}
              {activeTab === 'social' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <h4 className="text-xs font-black uppercase">Google Business & Reseñas</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Calificación (Estrellas)</label>
                        <input
                          type="text"
                          value={draftConfig.google_reviews_rating || ''}
                          onChange={(e) => updateField('google_reviews_rating', e.target.value)}
                          placeholder="4.9"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-bold bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Cantidad de Reseñas</label>
                        <input
                          type="text"
                          value={draftConfig.google_reviews_count || ''}
                          onChange={(e) => updateField('google_reviews_count', e.target.value)}
                          placeholder="120+"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Enlace a Google Reviews / Ficha Maps</label>
                      <input
                        type="url"
                        value={draftConfig.google_reviews_url || ''}
                        onChange={(e) => updateField('google_reviews_url', e.target.value)}
                        placeholder="https://g.page/r/..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Redes Sociales */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Perfiles de Redes Sociales
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-500" />
                        <span>Instagram (URL completa)</span>
                      </label>
                      <input
                        type="url"
                        value={draftConfig.social_instagram_url || ''}
                        onChange={(e) => updateField('social_instagram_url', e.target.value)}
                        placeholder="https://instagram.com/tuempresa"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-blue-600" />
                        <span>Facebook (URL completa)</span>
                      </label>
                      <input
                        type="url"
                        value={draftConfig.social_facebook_url || ''}
                        onChange={(e) => updateField('social_facebook_url', e.target.value)}
                        placeholder="https://facebook.com/tuempresa"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SLUG & ENLACE PÚBLICO */}
              {activeTab === 'slug' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-sm font-black">Tu Identificador Web Público</h4>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400">Slug de la empresa en la plataforma:</span>
                      <div className="text-lg font-black text-cyan-400 font-mono">
                        {companySlug}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 space-y-2">
                      <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
                        URL pública para tus clientes:
                      </span>
                      <div className="text-xs font-mono text-cyan-200 break-all select-all">
                        {publicUrl}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Enlace</span>
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Visitar Web</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>¿Cómo promocionar tu landing page?</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                      <li>Coloca este enlace en la bio de tu cuenta de <strong>Instagram</strong> y <strong>TikTok</strong>.</li>
                      <li>Configúralo como sitio web en el perfil de <strong>WhatsApp Business</strong> de tu empresa.</li>
                      <li>Imprime el enlace o su código QR en tarjetas de visita y cotizaciones oficiales.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Preview Viewport */}
        {viewMode !== 'editor' && (
          <div className="flex-1 bg-slate-200/80 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto">
            {/* Device Frame Simulator */}
            <div className={`transition-all duration-300 w-full ${
              deviceMode === 'mobile'
                ? 'max-w-[390px] border-[10px] border-slate-900 rounded-[44px] shadow-2xl overflow-hidden bg-slate-900 my-auto'
                : 'max-w-6xl rounded-2xl shadow-xl overflow-hidden border border-slate-300'
            }`}>
              {/* Smartphone Notch Bar */}
              {deviceMode === 'mobile' && (
                <div className="h-6 bg-slate-900 flex items-center justify-center">
                  <div className="w-24 h-4 bg-black rounded-b-xl" />
                </div>
              )}

              {/* Rendered Live Component */}
              <div className="bg-white overflow-y-auto max-h-[calc(100vh-10rem)]">
                <LandingTenantAir
                  settings={settings}
                  previewConfig={draftConfig}
                  onOpenBooking={(svcTitle) => {
                    toast.success(`Vista Previa: Agendamiento para "${svcTitle || 'Mantención'}"`);
                  }}
                  onOpenPortal={() => {
                    toast('Vista Previa: Apertura del Portal de Clientes', { icon: '🔍' });
                  }}
                  onAdminAccess={() => {
                    toast('Vista Previa: Botón de Acceso Admin', { icon: '🔐' });
                  }}
                />
              </div>

              {/* Smartphone Home Bar */}
              {deviceMode === 'mobile' && (
                <div className="h-5 bg-slate-900 flex items-center justify-center">
                  <div className="w-32 h-1 bg-slate-600 rounded-full" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
