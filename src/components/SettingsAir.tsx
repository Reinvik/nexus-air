import React, { useState, useEffect } from 'react';
import { AirSettings } from '../types';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  MessageSquare, 
  DollarSign, 
  Building, 
  Globe2, 
  Check, 
  Receipt,
  Sparkles,
  Percent,
  Upload,
  Trash2,
  Image as ImageIcon,
  CreditCard
} from 'lucide-react';
import { LATIN_AMERICAN_COUNTRIES, findCountry, LatinCountry } from '../lib/countries';
import { toast } from 'react-hot-toast';

interface SettingsAirProps {
  settings: AirSettings;
  onUpdateSettings: (settings: Partial<AirSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsAir: React.FC<SettingsAirProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const [formData, setFormData] = useState<AirSettings>({
    ...settings,
    country: settings.country || 'Chile',
    country_code: settings.country_code || 'CL',
    currency_symbol: settings.currency_symbol || '$',
    currency_code: settings.currency_code || 'CLP',
    tax_id_label: settings.tax_id_label || 'RUT',
    tax_rate: settings.tax_rate !== undefined ? settings.tax_rate : 0.19,
    tax_name: settings.tax_name || 'IVA',
    division_label: settings.division_label || 'Comuna',
    city: settings.city || 'Santiago',
    company_slogan: settings.company_slogan || 'Especialistas en Climatización y Refrigeración',
    default_apply_tax: settings.default_apply_tax !== false,
    quality_control_days: settings.quality_control_days || 7,
    inactive_recovery_months: settings.inactive_recovery_months || 9,
    pre_expiration_warning_days: settings.pre_expiration_warning_days || 15,
    logo_url: settings.logo_url || '',
    bank_name: settings.bank_name || '',
    bank_account_type: settings.bank_account_type || '',
    bank_account_number: settings.bank_account_number || '',
    bank_account_rut: settings.bank_account_rut || '',
    bank_account_email: settings.bank_account_email || '',
    whatsapp_template_cobro: settings.whatsapp_template_cobro || '',
  });

  useEffect(() => {
    setFormData({
      ...settings,
      country: settings.country || 'Chile',
      country_code: settings.country_code || 'CL',
      currency_symbol: settings.currency_symbol || '$',
      currency_code: settings.currency_code || 'CLP',
      tax_id_label: settings.tax_id_label || 'RUT',
      tax_rate: settings.tax_rate !== undefined ? settings.tax_rate : 0.19,
      tax_name: settings.tax_name || 'IVA',
      division_label: settings.division_label || 'Comuna',
      city: settings.city || 'Santiago',
      company_slogan: settings.company_slogan || 'Especialistas en Climatización y Refrigeración',
      default_apply_tax: settings.default_apply_tax !== false,
      quality_control_days: settings.quality_control_days || 7,
      inactive_recovery_months: settings.inactive_recovery_months || 9,
      pre_expiration_warning_days: settings.pre_expiration_warning_days || 15,
      logo_url: settings.logo_url || '',
      bank_name: settings.bank_name || '',
      bank_account_type: settings.bank_account_type || '',
      bank_account_number: settings.bank_account_number || '',
      bank_account_rut: settings.bank_account_rut || '',
      bank_account_email: settings.bank_account_email || '',
      whatsapp_template_cobro: settings.whatsapp_template_cobro || '',
    });
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, logo_url: b64 }));
      toast.success('Logo cargado correctamente. Guarda los cambios para aplicar.');
    };
    reader.readAsDataURL(file);
  };

  const selectedCountry = findCountry(formData.country_code || formData.country);

  // Manejador de cambio de país
  const handleCountryChange = (countryCode: string) => {
    const country = LATIN_AMERICAN_COUNTRIES.find(c => c.code === countryCode);
    if (!country) return;

    const updated = {
      ...formData,
      country: country.name,
      country_code: country.code,
      currency_symbol: country.currency_symbol,
      currency_code: country.currency_code,
      tax_id_label: country.tax_id_label,
      tax_rate: country.tax_rate,
      tax_name: country.tax_name,
      division_label: country.division_label,
      standard_maintenance_price: country.standard_maintenance_price_default,
      standard_installation_price: country.standard_installation_price_default,
      commune: country.sample_cities[0] || formData.commune
    };

    try {
      localStorage.setItem('nexus_air_active_settings', JSON.stringify(updated));
    } catch {}

    setFormData(updated);
    onUpdateSettings(updated);

    toast.success(`País cambiado a ${country.flag} ${country.name}. Se adaptaron la moneda (${country.currency_symbol} ${country.currency_code}) y tasas fiscales.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('nexus_air_active_settings', JSON.stringify(formData));
      if (formData.company_id) {
        localStorage.setItem(`nexus_air_settings_${formData.company_id}`, JSON.stringify(formData));
      }
    } catch {}
    onUpdateSettings(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configuración de Nexus Air</h2>
            <p className="text-xs text-slate-500">
              Personalización regional para Latinoamérica, datos comerciales y automatizaciones
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Restaurar todos los datos iniciales de demostración de Nexus Air?')) {
              onResetDefaults();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Demo</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: PAÍS & LOCALIZACIÓN REGIONAL (LATAM) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-600" />
                País de Operación & Localización (Latinoamérica)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adapta automáticamente la moneda, prefijo telefónico, nomenclatura tributaria e impuestos
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
              <span className="text-base">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </div>
          </div>

          {/* Selector Rápido de Países Más Usados */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Selección Directa de País:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {LATIN_AMERICAN_COUNTRIES.map((c) => {
                const isSelected = (formData.country_code === c.code) || (formData.country === c.name);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountryChange(c.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-500 text-cyan-950 font-bold shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menú Desplegable Completo de Países */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Listado Completo de Países LATAM</label>
              <select
                value={formData.country_code || selectedCountry.code}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                {LATIN_AMERICAN_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency_symbol} {c.currency_code} • {c.tax_name} {Math.round(c.tax_rate * 100)}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Prefijo Telefónico Internacional
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="font-bold">{selectedCountry.phone_prefix}</span>
                <span className="text-slate-400 text-[11px]">({selectedCountry.name})</span>
              </div>
            </div>
          </div>

          {/* Parámetros Regionales Configurables */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Receipt className="w-3.5 h-3.5 text-cyan-600" />
              <span>Ajustes Tributarios & Monetarios Específicos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Símbolo Moneda</label>
                <input
                  type="text"
                  value={formData.currency_symbol || '$'}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency_symbol: e.target.value }))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="$"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Código Moneda</label>
                <input
                  type="text"
                  value={formData.currency_code || 'CLP'}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency_code: e.target.value.toUpperCase() }))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="CLP"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">ID Tributaria</label>
                <input
                  type="text"
                  value={formData.tax_id_label || 'RUT'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_id_label: e.target.value }))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="RUT / RIF / RUC"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Nombre Impuesto</label>
                <input
                  type="text"
                  value={formData.tax_name || 'IVA'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_name: e.target.value }))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="IVA / IGV"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Tasa Impuesto (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={Math.round((formData.tax_rate ?? 0.19) * 100)}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: (parseFloat(e.target.value) || 0) / 100 }))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="19"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">División Territorial</label>
                <input
                  type="text"
                  value={formData.division_label || 'Comuna'}
                  onChange={(e) => setFormData(prev => ({ ...prev, division_label: e.target.value }))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="Comuna / Cantón"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: IDENTIDAD CORPORATIVA */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-600" />
            Identidad Corporativa de la Empresa
          </h3>

          {/* Logo Corporativo (NK-042) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="text-slate-700 font-bold block text-xs">
              Logotipo Oficial de la Empresa (Se refleja en proformas, comprobantes y barra lateral)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {formData.logo_url ? (
                <div className="relative group p-2 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center min-w-[120px] max-h-24">
                  <img
                    src={formData.logo_url}
                    alt="Logo Empresa"
                    className="max-h-20 max-w-[180px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                    className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                    title="Eliminar logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-white">
                  <ImageIcon className="w-8 h-8 stroke-1" />
                  <span className="text-[9px] font-medium mt-1">Sin logo</span>
                </div>
              )}

              <div className="space-y-2 flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/50 text-slate-700 hover:text-cyan-700 font-bold text-xs cursor-pointer transition-all shadow-2xs">
                  <Upload className="w-4 h-4 text-cyan-600" />
                  <span>Subir Imagen de Logotipo (PNG, JPG, SVG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  Recomendado: Imagen con fondo transparente (PNG/SVG) de aprox. 400x120px.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Razón Social</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Nombre de Fantasía</label>
              <input
                type="text"
                value={formData.fantasy_name}
                onChange={(e) => setFormData(prev => ({ ...prev, fantasy_name: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Slogan Corporativo</label>
              <input
                type="text"
                value={formData.company_slogan || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company_slogan: e.target.value }))}
                placeholder="Ej: Especialistas en Climatización y Refrigeración"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                <span>{formData.tax_id_label || 'Identificación Fiscal'} de la Empresa</span>
                <span className="text-[10px] text-cyan-700 font-mono bg-cyan-50 px-1.5 py-0.5 rounded">
                  {selectedCountry.flag} {selectedCountry.tax_id_label}
                </span>
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                placeholder={selectedCountry.code === 'CR' ? '3-101-123456' : selectedCountry.code === 'VE' ? 'J-12345678-9' : selectedCountry.code === 'PE' ? '20123456789' : '76.890.123-5'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                <span>WhatsApp Corporativo</span>
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                  Prefijo {selectedCountry.phone_prefix}
                </span>
              </label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                placeholder={`${selectedCountry.phone_prefix} 9 1234 5678`}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Dirección Comercial</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                <span>{formData.division_label || 'Comuna / Cantón / Municipio'} Principal</span>
                <span className="text-[10px] text-slate-500">Ej: {selectedCountry.sample_cities.slice(0, 2).join(', ')}</span>
              </label>
              <input
                type="text"
                value={formData.commune}
                onChange={(e) => setFormData(prev => ({ ...prev, commune: e.target.value }))}
                placeholder={selectedCountry.sample_cities[0] || 'San José'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Ciudad de Operación</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ej: Santiago, San José, Lima"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Toggle IVA por defecto (NK-039) */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.default_apply_tax !== false}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_apply_tax: e.target.checked }))}
                  className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Aplicar {formData.tax_name} ({Math.round((formData.tax_rate ?? 0.19) * 100)}%) por defecto en cotizaciones y proformas
                  </span>
                  <span className="block text-[11px] text-slate-400 leading-relaxed">
                    Al desmarcar esta opción, todas las cotizaciones y proformas se generarán como exentas (0%) por omisión, permitiendo activarlo manualmente cuando aplique.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: TARIFAS BASE & CICLO SEMESTRAL */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Tarifas Base & Ciclos de Recaptación y Fidelización (NK-038)
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Moneda: {formData.currency_symbol || '$'} {formData.currency_code || 'CLP'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Intervalo Mantención Preventiva</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={formData.maintenance_interval_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenance_interval_months: parseInt(e.target.value) || 6 }))}
                  className="w-full p-2.5 bg-cyan-50 border border-cyan-300 rounded-xl text-cyan-900 font-mono font-bold focus:outline-none"
                />
                <span className="text-slate-500 font-medium">meses</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Fórmula HVAC estándar: 6 meses</span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Control de Calidad Post-Servicio</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.quality_control_days || 7}
                  onChange={(e) => setFormData(prev => ({ ...prev, quality_control_days: parseInt(e.target.value) || 7 }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-slate-500 font-medium">días</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Encuesta de satisfacción (3-14 días)</span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Recuperación de Inactivos</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={6}
                  max={36}
                  value={formData.inactive_recovery_months || 9}
                  onChange={(e) => setFormData(prev => ({ ...prev, inactive_recovery_months: parseInt(e.target.value) || 9 }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-slate-500 font-medium">meses</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Campaña de descuento reactivación</span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Precio Mantención ({formData.currency_symbol || '$'} {formData.currency_code})
              </label>
              <input
                type="number"
                value={formData.standard_maintenance_price}
                onChange={(e) => setFormData(prev => ({ ...prev, standard_maintenance_price: parseInt(e.target.value) || 0 }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                + {formData.tax_name} ({Math.round((formData.tax_rate ?? 0.19) * 100)}%): {formData.currency_symbol} {Math.round(formData.standard_maintenance_price * (1 + (formData.tax_rate ?? 0.19)))}
              </span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Precio Instalación ({formData.currency_symbol || '$'} {formData.currency_code})
              </label>
              <input
                type="number"
                value={formData.standard_installation_price}
                onChange={(e) => setFormData(prev => ({ ...prev, standard_installation_price: parseInt(e.target.value) || 0 }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                + {formData.tax_name} ({Math.round((formData.tax_rate ?? 0.19) * 100)}%): {formData.currency_symbol} {Math.round(formData.standard_installation_price * (1 + (formData.tax_rate ?? 0.19)))}
              </span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Anticipación Alerta "Por Vencer"</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.pre_expiration_warning_days || 15}
                  onChange={(e) => setFormData(prev => ({ ...prev, pre_expiration_warning_days: parseInt(e.target.value) || 15 }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-slate-500 font-medium">días</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Días previos para avisar al cliente</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: PLANTILLAS DE WHATSAPP */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-600" />
            Plantillas Automáticas de WhatsApp
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block">
                Plantilla de Recaptación Periódica ({formData.maintenance_interval_months || 6} Meses)
              </label>
              <p className="text-[11px] text-slate-400 mb-1">
                Variables soportadas: {'{cliente}'}, {'{marca}'}, {'{btu}'}, {'{ubicacion}'}, {'{link}'}
              </p>
              <textarea
                rows={4}
                value={formData.whatsapp_template_recaptacion}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_template_recaptacion: e.target.value }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block">
                Plantilla de Confirmación de Agendamiento
              </label>
              <p className="text-[11px] text-slate-400 mb-1">
                Variables soportadas: {'{cliente}'}, {'{tipo_servicio}'}, {'{fecha}'}, {'{hora}'}, {'{tecnico}'}
              </p>
              <textarea
                rows={2}
                value={formData.whatsapp_template_agendamiento}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_template_agendamiento: e.target.value }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: DATOS BANCARIOS PARA COBROS Y TRANSFERENCIAS (NK-044) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Datos Bancarios Oficiales para Cobros & Transferencias (NK-044)
          </h3>
          <p className="text-[11px] text-slate-400">
            Esta información se cargará por defecto al enviar recordatorios de pago a clientes por WhatsApp en Ventas & Finanzas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Nombre del Banco</label>
              <input
                type="text"
                value={formData.bank_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                placeholder="Ej: Banco Santander / Banco de Chile"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Tipo de Cuenta</label>
              <input
                type="text"
                value={formData.bank_account_type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_type: e.target.value }))}
                placeholder="Ej: Cuenta Corriente / Vista"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Número de Cuenta</label>
              <input
                type="text"
                value={formData.bank_account_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                placeholder="Ej: 1234567890"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">RUT / Identificación Titular</label>
              <input
                type="text"
                value={formData.bank_account_rut || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_rut: e.target.value }))}
                placeholder="Ej: 76.543.210-K"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Email para Notificación de Transferencias</label>
              <input
                type="email"
                value={formData.bank_account_email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_email: e.target.value }))}
                placeholder="Ej: pagos@tuempresa.cl"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-slate-700 font-semibold block mb-1">
                Plantilla Base de Recordatorio de Cobro WhatsApp
              </label>
              <textarea
                rows={3}
                value={formData.whatsapp_template_cobro || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_template_cobro: e.target.value }))}
                placeholder="Hola {cliente}, le saludamos de {empresa}. Recordatorio de saldo pendiente de la orden {ticket}..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Botón de Guardado */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>Configuración activa para <strong>{formData.country || 'Chile'}</strong> ({formData.currency_symbol} {formData.currency_code})</span>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};
