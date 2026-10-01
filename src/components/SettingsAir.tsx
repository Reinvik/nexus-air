import React, { useState, useEffect } from 'react';
import { 
  AirSettings,
  SERVICE_TYPE_DEFAULT_COLORS,
  CALENDAR_COLOR_OPTIONS,
  formatServiceType,
  APP_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  ConfigurableRole,
  ViewTab
} from '../types';
import { supabase } from '../lib/supabase';
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
  CreditCard,
  Lock,
  Loader2,
  Palette,
  Banknote,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserPlus,
  CheckSquare,
  Square,
  UserCheck,
  RefreshCw,
  Sliders,
  X,
  Key
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
  const [isSaving, setIsSaving] = useState(false);
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
    default_tax_mode: settings.default_tax_mode || 'included',
    hide_technician_amounts: settings.hide_technician_amounts !== false,
    maintenance_interval_months: settings.maintenance_interval_months || 6,
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
    admin_pin: settings.admin_pin || '1234',
    service_type_colors: settings.service_type_colors || SERVICE_TYPE_DEFAULT_COLORS,
    role_permissions: settings.role_permissions || DEFAULT_ROLE_PERMISSIONS,
  });

  // NK-067: Estado y gestión de roles, permisos y colaboradores del taller
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<ConfigurableRole>('tecnico');
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'tecnico' | 'ayudante' | 'user'>('tecnico');
  const [creatingUser, setCreatingUser] = useState(false);

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
      default_tax_mode: settings.default_tax_mode || 'included',
      hide_technician_amounts: settings.hide_technician_amounts !== false,
      maintenance_interval_months: settings.maintenance_interval_months || 6,
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
      admin_pin: settings.admin_pin || '1234',
      service_type_colors: settings.service_type_colors || SERVICE_TYPE_DEFAULT_COLORS,
      role_permissions: settings.role_permissions || DEFAULT_ROLE_PERMISSIONS,
    });
  }, [settings]);

  // Cargar usuarios vinculados a la empresa
  const fetchCompanyUsers = async () => {
    const compId = formData.company_id || settings.company_id;
    if (!compId) return;
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', compId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setCompanyUsers(data);
      }
    } catch (e) {
      console.warn('Error fetching company users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchCompanyUsers();
  }, [formData.company_id, settings.company_id]);

  // Modificar permisos de un rol
  const handleToggleModulePermission = (role: ConfigurableRole, moduleId: ViewTab) => {
    const currentPerms = { ...(formData.role_permissions || DEFAULT_ROLE_PERMISSIONS) };
    const currentRoleModules = currentPerms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
    const roleModulesSet = new Set<ViewTab>(currentRoleModules);

    if (roleModulesSet.has(moduleId)) {
      roleModulesSet.delete(moduleId);
    } else {
      roleModulesSet.add(moduleId);
    }

    const updatedRolePerms = {
      ...currentPerms,
      [role]: Array.from(roleModulesSet)
    };

    setFormData(prev => ({
      ...prev,
      role_permissions: updatedRolePerms
    }));
  };

  const handleResetRolePermissions = (role: ConfigurableRole) => {
    const currentPerms = { ...(formData.role_permissions || DEFAULT_ROLE_PERMISSIONS) };
    const updated = {
      ...currentPerms,
      [role]: [...(DEFAULT_ROLE_PERMISSIONS[role] || [])]
    };
    setFormData(prev => ({
      ...prev,
      role_permissions: updated
    }));
    toast.success(`Permisos recomendados restaurados para el rol ${role.toUpperCase()}`);
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setCompanyUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Rol del colaborador actualizado');
    } catch (err: any) {
      toast.error('Error al actualizar rol: ' + (err.message || err));
    }
  };

  const handleCreateCompanyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const compId = formData.company_id || settings.company_id;
    if (!compId) {
      toast.error('No se ha detectado el ID de la empresa');
      return;
    }
    setCreatingUser(true);
    try {
      // Verificar si ya existe un perfil registrado con ese email
      let createdUserId = crypto.randomUUID();
      try {
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', newUserEmail.trim())
          .maybeSingle();

        if (existingProf?.id) {
          createdUserId = existingProf.id;
        }
      } catch (checkErr) {
        console.warn('Error verificando usuario existente:', checkErr);
      }

      // Intentar Edge Function manage-users
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'create_user',
            userData: {
              email: newUserEmail.trim(),
              password: newUserPassword,
              full_name: newUserName.trim(),
              company_id: compId,
              role: newUserRole
            }
          }
        });
        if (!fnErr && fnData?.user?.id) {
          createdUserId = fnData.user.id;
        }
      } catch (e) {
        console.warn('Edge function no disponible, guardando en profiles:', e);
      }

      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: createdUserId,
        email: newUserEmail.trim(),
        full_name: newUserName.trim(),
        role: newUserRole,
        company_id: compId,
        contrasena: newUserPassword,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (profileErr) throw profileErr;

      toast.success(`Colaborador ${newUserName} creado con rol ${newUserRole.toUpperCase()}`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setIsCreateUserModalOpen(false);
      await fetchCompanyUsers();
    } catch (err: any) {
      toast.error('Error al registrar usuario: ' + (err.message || err));
    } finally {
      setCreatingUser(false);
    }
  };

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

    const compId = formData.company_id || settings.company_id;
    if (compId) {
      try {
        localStorage.setItem(`nexus_air_settings_${compId}`, JSON.stringify(updated));
      } catch {}
    }

    setFormData(updated);
    onUpdateSettings(updated);

    toast.success(`País cambiado a ${country.flag} ${country.name}. Se adaptaron la moneda (${country.currency_symbol} ${country.currency_code}) y tasas fiscales.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const compId = formData.company_id || settings.company_id;
      if (compId) {
        localStorage.setItem(`nexus_air_settings_${compId}`, JSON.stringify(formData));
      }
      await onUpdateSettings(formData);
    } finally {
      setIsSaving(false);
    }
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

            {/* Modalidad de cálculo de IVA por defecto (NK-050) */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Modalidad de cálculo de {formData.tax_name} por omisión (NK-050)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Define si las nuevas órdenes de servicio calculan el monto como IVA Incluido o como Valor Neto (+ IVA adicional).
                </span>
              </div>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, default_tax_mode: 'included' }))}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    (formData.default_tax_mode || 'included') === 'included'
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  IVA Incluido
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, default_tax_mode: 'plus' }))}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    formData.default_tax_mode === 'plus'
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + IVA Adicional
                </button>
              </div>
            </div>

            {/* Toggle Ocultar montos a técnicos (NK-047) */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.hide_technician_amounts !== false}
                  onChange={(e) => setFormData(prev => ({ ...prev, hide_technician_amounts: e.target.checked }))}
                  className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    🔒 Ocultar montos a cobrar a los técnicos en el tablero (NK-047)
                  </span>
                  <span className="block text-[11px] text-slate-400 leading-relaxed">
                    Protege la privacidad de las tarifas cobradas al cliente, impidiendo que el personal técnico o ayudantes visualicen los precios de las órdenes en el tablero y modales.
                  </span>
                </div>
              </label>
            </div>

            {/* Clave de Administrador (PIN) (NK-052) */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  Clave o PIN de Administrador (NK-052)
                </span>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  Autoriza la eliminación definitiva de órdenes, anulación de pagos de prueba o liquidaciones en Ventas y Finanzas.
                </span>
              </div>
              <div className="w-full sm:w-48">
                <input
                  type="text"
                  value={formData.admin_pin || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_pin: e.target.value }))}
                  placeholder="Por omisión: 1234"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-xs focus:bg-white focus:border-rose-500 focus:outline-none text-center"
                />
              </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Intervalo Mantenimiento Preventivo</label>
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
              <label className="text-slate-700 font-semibold block mb-1">Anticipación Alerta "Por Vencer"</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.pre_expiration_warning_days || 15}
                  onChange={(e) => setFormData(prev => ({ ...prev, pre_expiration_warning_days: parseInt(e.target.value) || 15 }))}
                  className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 font-mono font-bold focus:outline-none"
                />
                <span className="text-slate-500 font-medium">días</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Días previos para avisar al cliente</span>
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
                  className="w-full p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-mono font-bold focus:bg-white focus:border-rose-400 focus:outline-none"
                />
                <span className="text-slate-500 font-medium">meses</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Campaña de descuento reactivación</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3">Precios de Referencia</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Precio Mantenimiento ({formData.currency_symbol || '$'} {formData.currency_code})
                </label>
                <input
                  type="number"
                  value={formData.standard_maintenance_price === 0 ? '' : formData.standard_maintenance_price}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
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
                  value={formData.standard_installation_price === 0 ? '' : formData.standard_installation_price}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormData(prev => ({ ...prev, standard_installation_price: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  + {formData.tax_name} ({Math.round((formData.tax_rate ?? 0.19) * 100)}%): {formData.currency_symbol} {Math.round(formData.standard_installation_price * (1 + (formData.tax_rate ?? 0.19)))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN: CLASIFICACIÓN CROMÁTICA EN AGENDAMIENTO (NK-061) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-600" />
                Clasificación Cromática en Agenda y Calendario (NK-061)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Define el color distintivo de cada tipo de trabajo para identificarlo al instante en las vistas de Día, Semana y Mes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  service_type_colors: { ...SERVICE_TYPE_DEFAULT_COLORS }
                }));
                toast.success('Colores restablecidos a los valores predeterminados');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restablecer Predeterminados</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'mantencion_preventiva', label: 'Mantenimiento Preventivo (6M)', desc: 'Revisión semestral periódica' },
              { key: 'instalacion', label: 'Instalación de Equipo', desc: 'Montaje de unidades y cañerías' },
              { key: 'mantencion_correctiva', label: 'Mantenimiento Correctivo / Fuga', desc: 'Atención de fallas o fugas críticas' },
              { key: 'visita_tecnica', label: 'Visita Técnica de Diagnóstico', desc: 'Evaluación y presupuesto en terreno' },
              { key: 'recarga_gas', label: 'Recarga de Gas Refrigerante', desc: 'Carga de R410A / R32 / R22' },
              { key: 'reparacion', label: 'Reparación General', desc: 'Cambio de piezas o compresores' },
              { key: 'recaptacion', label: 'Recaptación de Mantenimiento', desc: 'Contacto proactivo a clientes' },
              { key: 'pruebas_qa', label: 'Pruebas de Calidad / QA', desc: 'Medición de salto térmico y presiones' },
            ].map(item => {
              const currentColor = formData.service_type_colors?.[item.key] || SERVICE_TYPE_DEFAULT_COLORS[item.key] || '#0284c7';
              return (
                <div 
                  key={item.key}
                  className="p-3.5 rounded-xl border transition-all space-y-2.5"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: currentColor,
                    backgroundColor: `${currentColor}08`,
                    borderColor: `${currentColor}30`
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentColor }} />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                    <span 
                      className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border shadow-2xs"
                      style={{ 
                        backgroundColor: `${currentColor}15`, 
                        color: currentColor,
                        borderColor: `${currentColor}40`
                      }}
                    >
                      {currentColor}
                    </span>
                  </div>

                  {/* Selector interactivo de colores */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {CALENDAR_COLOR_OPTIONS.slice(0, 8).map(opt => {
                      const isSelected = currentColor.toLowerCase() === opt.value.toLowerCase();
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              service_type_colors: {
                                ...(prev.service_type_colors || SERVICE_TYPE_DEFAULT_COLORS),
                                [item.key]: opt.value,
                                ...(item.key === 'mantencion_preventiva' ? { mantenimiento_preventivo: opt.value } : {}),
                                ...(item.key === 'mantencion_correctiva' ? { mantenimiento_correctivo: opt.value } : {})
                              }
                            }));
                          }}
                          title={opt.name}
                          className={`w-6 h-6 rounded-md transition-all flex items-center justify-center cursor-pointer relative shadow-2xs ${
                            isSelected ? 'ring-2 ring-offset-1 ring-slate-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: opt.value }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>
                      );
                    })}

                    <label 
                      className="relative h-6 px-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-1 text-[10px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                      title="Elegir tono personalizado"
                    >
                      <span>Custom</span>
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => {
                          const newCol = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            service_type_colors: {
                              ...(prev.service_type_colors || SERVICE_TYPE_DEFAULT_COLORS),
                              [item.key]: newCol,
                              ...(item.key === 'mantencion_preventiva' ? { mantenimiento_preventivo: newCol } : {}),
                              ...(item.key === 'mantencion_correctiva' ? { mantenimiento_correctivo: newCol } : {})
                            }
                          }));
                        }}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN: MÓDULO DE NÓMINA & SUELDOS DEL PERSONAL (NK-062) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                Módulo de Nómina & Sueldos del Personal (NK-062)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Control de sueldos fijos, comisiones operativas, anticipos y emisión de comprobantes de liquidación mensual.
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enable_staff_payroll !== false}
                onChange={(e) => setFormData(prev => ({ ...prev, enable_staff_payroll: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {formData.enable_staff_payroll !== false ? 'Activo' : 'Desactivado'}
              </span>
            </label>
          </div>

          {formData.enable_staff_payroll !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Nombre de la Pestaña / Módulo
                </label>
                <input
                  type="text"
                  value={formData.staff_payroll_title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, staff_payroll_title: e.target.value }))}
                  placeholder="Sueldos & Nómina"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                <span className="font-bold text-emerald-950 text-xs block">
                  ✓ Regla de Operaciones Blindada
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Los colaboradores administrativos (recepción, oficina, limpieza) conviven dentro de la nómina mensual pero tienen bloqueada su asignación en órdenes de trabajo técnicas.
                </p>
              </div>
            </div>
          )}
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

        {/* SECCIÓN 5: ROLES, PERMISOS DE ACCESO A MÓDULOS & USUARIOS DEL TALLER (NK-067) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600" />
                Control de Roles & Permisos de Acceso a Módulos (NK-067)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura a qué módulos específicos tiene acceso cada rol en la barra lateral y navegación de tu empresa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Crear Colaborador / Usuario</span>
              </button>
            </div>
          </div>

          {/* Selector de Rol a Configurar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700">
                Selecciona el rol para personalizar sus accesos:
              </label>
              <button
                type="button"
                onClick={() => handleResetRolePermissions(selectedRoleForPerms)}
                className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3 h-3" />
                Restaurar permisos recomendados para {selectedRoleForPerms.toUpperCase()}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { 
                  id: 'tecnico' as ConfigurableRole, 
                  label: '🔧 Técnico HVAC Líder', 
                  desc: 'Personal técnico de terreno con ejecución de órdenes y cotizador'
                },
                { 
                  id: 'ayudante' as ConfigurableRole, 
                  label: '🤝 Ayudante de Cuadrilla', 
                  desc: 'Asistente de terreno para apoyo en agendamiento y checklist operativo'
                },
                { 
                  id: 'user' as ConfigurableRole, 
                  label: '👤 Usuario Estándar', 
                  desc: 'Recepción, atención comercial básica o gestión de clientes sin acceso financiero'
                }
              ].map(r => {
                const isSelected = selectedRoleForPerms === r.id;
                const perms = formData.role_permissions?.[r.id] || DEFAULT_ROLE_PERMISSIONS[r.id] || [];
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleForPerms(r.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black ${isSelected ? 'text-cyan-950' : 'text-slate-800'}`}>
                        {r.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {perms.length} módulos
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {r.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matriz de Módulos para el Rol Seleccionado */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                Módulos Habilitados para el Rol: <strong className="text-cyan-700 uppercase font-mono">{selectedRoleForPerms}</strong>
              </span>
              <span className="text-[11px] text-slate-500">
                Los módulos marcados serán visibles en su menú.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {APP_MODULES.map((mod) => {
                const currentPerms = formData.role_permissions?.[selectedRoleForPerms] || DEFAULT_ROLE_PERMISSIONS[selectedRoleForPerms] || [];
                const isEnabled = currentPerms.includes(mod.id);

                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModulePermission(selectedRoleForPerms, mod.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isEnabled
                        ? 'bg-white border-cyan-400 shadow-xs'
                        : 'bg-slate-100/60 border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isEnabled ? (
                        <CheckSquare className="w-4 h-4 text-cyan-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isEnabled ? 'text-slate-900' : 'text-slate-600'}`}>
                          {mod.label}
                        </span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                          mod.category === 'operativo' 
                            ? 'bg-blue-50 text-blue-700' 
                            : mod.category === 'gestion' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-purple-50 text-purple-700'
                        }`}>
                          {mod.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5" title={mod.description}>
                        {mod.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listado de Colaboradores / Usuarios del Taller */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-600" />
                  Usuarios Registrados de la Empresa
                </h4>
                <p className="text-[11px] text-slate-400">
                  Asigna el rol correspondiente a cada usuario para aplicarle las restricciones de módulos.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCompanyUsers}
                className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refrescar usuarios"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center p-6 text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                Cargando colaboradores de la empresa...
              </div>
            ) : companyUsers.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Aún no hay usuarios adicionales registrados en esta empresa. Haz clic en <strong>+ Crear Colaborador / Usuario</strong> para agregar técnicos o ayudantes.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 text-xs">
                {companyUsers.map((u) => (
                  <div key={u.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                        {(u.full_name || u.email || 'U')[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{u.full_name || 'Sin Nombre'}</span>
                          {u.role === 'admin' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 font-extrabold uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] text-slate-400">Rol:</span>
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                        className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="admin">🛡️ Administrador</option>
                        <option value="tecnico">🔧 Técnico HVAC</option>
                        <option value="ayudante">🤝 Ayudante de Cuadrilla</option>
                        <option value="user">👤 Usuario Estándar</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 6: DATOS BANCARIOS PARA COBROS Y TRANSFERENCIAS (NK-044) */}
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
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal: Crear Nuevo Colaborador para el Taller */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Crear Nuevo Colaborador</h4>
                  <p className="text-[11px] text-slate-500">Asigna credenciales y rol con permisos específicos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompanyUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Marcelo Rojas"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico (Login) *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Ej: marcelo.rojas@clima.cl"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rol en el Taller *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <option value="tecnico">🔧 Técnico HVAC (Solo módulos técnicos)</option>
                  <option value="ayudante">🤝 Ayudante de Cuadrilla (Solo agenda y órdenes)</option>
                  <option value="user">👤 Usuario Estándar / Recepción</option>
                  <option value="admin">🛡️ Administrador (Acceso total)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El rol asignado determinará automáticamente a qué módulos tendrá acceso según la matriz de permisos.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <span>Registrar Colaborador</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
