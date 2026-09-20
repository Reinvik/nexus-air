import React, { useState, useEffect, useMemo } from 'react';
import { supabase, supabaseAir } from '../lib/supabase';
import { findCountry } from '../lib/countries';
import { Company, ProfileUser, UserRole, AirSettings } from '../types';
import { 
  Crown, 
  ShieldAlert, 
  Building2, 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  ShieldCheck, 
  Check, 
  X, 
  Loader2,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NexusOwnerAirProps {
  currentProfile: any;
  currentCompanyId: string;
  activeCompanyOverride: string | null;
  onSwitchActiveCompany: (companyId: string | null) => void;
  onReloadStoreData?: () => void;
}

export const NexusOwnerAir: React.FC<NexusOwnerAirProps> = ({
  currentProfile,
  currentCompanyId,
  activeCompanyOverride,
  onSwitchActiveCompany,
  onReloadStoreData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'companies' | 'switcher'>('users');
  
  // Datos del backend
  const [profiles, setProfiles] = useState<ProfileUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  // Filtros de usuarios
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Modal: Crear Empresa
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState<boolean>(false);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCompanySlug, setNewCompanySlug] = useState<string>('');
  const [newCompanyEmail, setNewCompanyEmail] = useState<string>('');
  const [newCompanyPhone, setNewCompanyPhone] = useState<string>('');
  const [newCompanyAddress, setNewCompanyAddress] = useState<string>('');
  const [newCompanyCountry, setNewCompanyCountry] = useState<string>('Chile');
  const [newCompanyIsLobby, setNewCompanyIsLobby] = useState<boolean>(false);
  const [creatingCompanyLoading, setCreatingCompanyLoading] = useState<boolean>(false);

  // Modal: Crear Usuario
  const [isCreateUserOpen, setIsCreateUserOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserCompanyId, setNewUserCompanyId] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('admin');
  const [creatingUserLoading, setCreatingUserLoading] = useState<boolean>(false);

  // Cargar datos de Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const [profilesRes, companiesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true })
      ]);

      if (profilesRes.error) {
        console.warn('[NexusOwner] Error fetching profiles:', profilesRes.error.message);
      }
      if (companiesRes.error) {
        console.warn('[NexusOwner] Error fetching companies:', companiesRes.error.message);
      }

      const fetchedProfiles: ProfileUser[] = profilesRes.data || [];
      const fetchedCompanies: Company[] = companiesRes.data || [];

      // Calcular conteo de usuarios por empresa
      const enrichedCompanies = fetchedCompanies.map(comp => ({
        ...comp,
        user_count: fetchedProfiles.filter(p => p.company_id === comp.id).length
      }));

      setProfiles(fetchedProfiles);
      setCompanies(enrichedCompanies);

      // Si no hay empresa seleccionada para nuevo usuario, preseleccionar la primera
      if (enrichedCompanies.length > 0 && !newUserCompanyId) {
        setNewUserCompanyId(enrichedCompanies[0].id);
      }
    } catch (err: any) {
      console.error('[NexusOwner] Error en fetchData:', err);
      toast.error('Error al cargar datos de Nexus Owner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Asignar Empresa a un Usuario
  const handleAssignCompany = async (userId: string, newCompanyId: string) => {
    try {
      setSavingUserId(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          company_id: newCompanyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Actualizar estado local
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, company_id: newCompanyId } : p));
      
      const targetCompany = companies.find(c => c.id === newCompanyId);
      toast.success(`Empresa reasignada a: ${targetCompany?.name || 'Empresa seleccionada'}`);
      
      // Refrescar contadores
      fetchData();
    } catch (err: any) {
      console.error('[NexusOwner] Error al asignar empresa:', err);
      toast.error(`No se pudo actualizar la empresa: ${err.message || err}`);
    } finally {
      setSavingUserId(null);
    }
  };

  // 2. Asignar Rol a un Usuario
  const handleAssignRole = async (userId: string, newRole: string) => {
    try {
      setSavingUserId(userId);

      // Actualizar en tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Intentar sincronizar con Edge Function manage-users si está disponible
      try {
        await supabase.functions.invoke('manage-users', {
          body: {
            action: 'update_role',
            userData: { userId, role: newRole }
          }
        });
      } catch (fnErr) {
        console.warn('[NexusOwner] Sincronización Edge Function opcional:', fnErr);
      }

      // Actualizar estado local
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      toast.success(`Rol de usuario actualizado a: ${newRole.toUpperCase()}`);
    } catch (err: any) {
      console.error('[NexusOwner] Error al cambiar rol:', err);
      toast.error(`No se pudo actualizar el rol: ${err.message || err}`);
    } finally {
      setSavingUserId(null);
    }
  };

  // 3. Alternar Estado Activo / Inactivo de Usuario
  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      setSavingUserId(userId);
      const nextActive = !currentActive;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: nextActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_active: nextActive } : p));
      toast.success(nextActive ? 'Usuario activado' : 'Usuario suspendido / bloqueado');
    } catch (err: any) {
      console.error('[NexusOwner] Error al cambiar estado de usuario:', err);
      toast.error('No se pudo actualizar el estado del usuario.');
    } finally {
      setSavingUserId(null);
    }
  };

  // 4. Crear Nueva Empresa (Tenant)
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      toast.error('Ingresa el nombre de la empresa.');
      return;
    }

    const cleanSlug = (newCompanySlug || newCompanyName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      toast.error('El slug identificador no es válido.');
      return;
    }

    setCreatingCompanyLoading(true);
    try {
      // 1. Insertar en public.companies
      const { data: createdCompany, error: compError } = await supabase
        .from('companies')
        .insert([{
          name: newCompanyName.trim(),
          slug: cleanSlug,
          schema_name: 'air',
          allowed_apps: ['air'],
          is_lobby: newCompanyIsLobby,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (compError) throw compError;

      const companyId = createdCompany.id;

      // 2. Inicializar ajustes en air.settings y localStorage para Nexus Air
      try {
        const countryData = findCountry(newCompanyCountry);
        const initialCompanySettings: Partial<AirSettings> = {
          company_id: companyId,
          company_name: newCompanyName.trim(),
          fantasy_name: newCompanyName.trim(),
          company_slug: cleanSlug,
          email: newCompanyEmail.trim() || 'contacto@' + cleanSlug + '.cl',
          phone: newCompanyPhone.trim() || '+56 9 3005 7769',
          address: newCompanyAddress.trim() || 'Santiago, Chile',
          country: countryData.name,
          country_code: countryData.code,
          currency_symbol: countryData.currency_symbol,
          currency_code: countryData.currency_code,
          tax_id_label: countryData.tax_id_label,
          tax_rate: countryData.tax_rate,
          tax_name: countryData.tax_name,
          division_label: countryData.division_label,
          standard_maintenance_price: countryData.standard_maintenance_price_default,
          standard_installation_price: countryData.standard_installation_price_default,
          warranty_months: 6,
          maintenance_interval_months: 6
        };

        // Guardar configuración local para el nuevo tenant
        localStorage.setItem(`nexus_air_settings_${companyId}`, JSON.stringify(initialCompanySettings));

        // Guardar en schema air
        await supabaseAir
          .from('settings')
          .upsert([{
            company_id: companyId,
            company_name: newCompanyName.trim(),
            company_slug: cleanSlug,
            email: newCompanyEmail.trim() || 'contacto@' + cleanSlug + '.cl',
            phone: newCompanyPhone.trim() || '+56 9 3005 7769',
            address: newCompanyAddress.trim() || 'Santiago, Chile',
            country: countryData.name,
            country_code: countryData.code,
            currency_symbol: countryData.currency_symbol,
            currency_code: countryData.currency_code,
            tax_id_label: countryData.tax_id_label,
            tax_rate: countryData.tax_rate,
            tax_name: countryData.tax_name,
            division_label: countryData.division_label,
            standard_maintenance_price: countryData.standard_maintenance_price_default,
            standard_installation_price: countryData.standard_installation_price_default,
          }], { onConflict: 'company_id' });
      } catch (setErr) {
        console.warn('[NexusOwner] Ajustes de schema air inicializados localmente:', setErr);
      }

      toast.success(`¡Empresa "${newCompanyName}" creada exitosamente!`);
      
      // Limpiar formulario y cerrar modal
      setNewCompanyName('');
      setNewCompanySlug('');
      setNewCompanyEmail('');
      setNewCompanyPhone('');
      setNewCompanyAddress('');
      setNewCompanyIsLobby(false);
      setIsCreateCompanyOpen(false);

      // Recargar datos
      await fetchData();
    } catch (err: any) {
      console.error('[NexusOwner] Error al crear empresa:', err);
      toast.error(`Error al crear empresa: ${err.message || err}`);
    } finally {
      setCreatingCompanyLoading(false);
    }
  };

  // 5. Crear Nuevo Usuario (vía Edge Function manage-users o fallback a profiles)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error('Completa todos los campos obligatorios del usuario.');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreatingUserLoading(true);
    try {
      const selectedComp = companies.find(c => c.id === newUserCompanyId) || companies[0];
      const validCompanyId = selectedComp?.id || currentCompanyId;

      // Invocar Edge Function manage-users
      const { data: fnData, error: fnError } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create_user',
          userData: {
            email: newUserEmail.trim(),
            password: newUserPassword,
            full_name: newUserName.trim(),
            company_id: validCompanyId,
            role: newUserRole
          }
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Error en Edge Function');
      }
      if (fnData?.error) {
        throw new Error(fnData.error);
      }

      // Si la Edge Function respondió bien, asegurar que el perfil esté persistido con su empresa asignada
      if (fnData?.user?.id) {
        await supabase
          .from('profiles')
          .upsert({
            id: fnData.user.id,
            email: newUserEmail.trim(),
            full_name: newUserName.trim(),
            role: newUserRole,
            company_id: validCompanyId,
            is_active: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      }

      toast.success(`Usuario ${newUserName} creado exitosamente.`);
      
      // Limpiar y cerrar
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setIsCreateUserOpen(false);

      await fetchData();
    } catch (err: any) {
      console.error('[NexusOwner] Error al crear usuario:', err);
      toast.error(`Error al registrar usuario: ${err.message || err}`);
    } finally {
      setCreatingUserLoading(false);
    }
  };

  // Conteo de métricas
  const totalUsers = profiles.length;
  const totalCompanies = companies.length;
  const totalAdmins = profiles.filter(p => p.role === 'admin' || p.role === 'superuser').length;
  const totalTechs = profiles.filter(p => p.role === 'tecnico' || p.role === 'ayudante').length;
  const totalOwners = profiles.filter(p => ['nexus_owner', 'nexusowner', 'owner'].includes(p.role)).length;

  // Filtrado de usuarios
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      // Búsqueda por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = (p.full_name || '').toLowerCase().includes(term);
        const matchEmail = (p.email || '').toLowerCase().includes(term);
        if (!matchName && !matchEmail) return false;
      }

      // Filtro por empresa
      if (filterCompany !== 'ALL') {
        if (p.company_id !== filterCompany) return false;
      }

      // Filtro por rol
      if (filterRole !== 'ALL') {
        const r = (p.role || '').toLowerCase();
        if (filterRole === 'nexus_owner') {
          if (!['nexus_owner', 'nexusowner', 'owner'].includes(r)) return false;
        } else if (filterRole === 'admin') {
          if (r !== 'admin' && r !== 'superuser') return false;
        } else {
          if (r !== filterRole) return false;
        }
      }

      return true;
    });
  }, [profiles, searchTerm, filterCompany, filterRole]);

  // Nombre de la empresa activa actual
  const currentActiveCompanyName = useMemo(() => {
    const active = companies.find(c => c.id === currentCompanyId);
    return active?.name || 'Empresa Principal Nexus';
  }, [companies, currentCompanyId]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* HERO BANNER SMARTLEAN - NEXUS OWNER                                   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#070b19] via-[#09112a] to-[#040816] border border-amber-500/30 p-6 sm:p-8 shadow-[0_10px_30px_rgba(245,158,11,0.08)]">
        {/* Glow de fondo */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wide uppercase">
              <Crown className="w-3.5 h-3.5" />
              <span>Superadmin Ecosistema Nexus</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Módulo Nexus Owner</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-[#00d2ff] border border-cyan-500/40 font-bold">
                NEXUS AIR
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Panel de control global exclusivo para la directiva. Visualiza usuarios, aprovisiona nuevas empresas climatizadoras, asigna tenants y configura roles con sincronización en tiempo real.
            </p>
          </div>

          {/* Acciones Rápidas de Cabecera */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.1] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Recargar datos desde Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Recargar</span>
            </button>

            <button
              onClick={() => setIsCreateUserOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[#00d2ff] hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>

            <button
              onClick={() => setIsCreateCompanyOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Building2 className="w-4 h-4 stroke-[2.5]" />
              <span>Crear Empresa</span>
            </button>
          </div>
        </div>

        {/* Barra de KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/[0.08]">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
            <div className="text-[10px] uppercase font-black text-slate-400">Total Usuarios</div>
            <div className="text-xl font-black text-white mt-0.5">{totalUsers}</div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
            <div className="text-[10px] uppercase font-black text-slate-400">Empresas (Tenants)</div>
            <div className="text-xl font-black text-[#00d2ff] mt-0.5">{totalCompanies}</div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
            <div className="text-[10px] uppercase font-black text-slate-400">Administradores</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{totalAdmins}</div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
            <div className="text-[10px] uppercase font-black text-slate-400">Técnicos HVAC</div>
            <div className="text-xl font-black text-indigo-400 mt-0.5">{totalTechs}</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
            <div className="text-[10px] uppercase font-black text-amber-400 flex items-center justify-between">
              <span>Empresa Activa</span>
              {activeCompanyOverride && (
                <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-black">OVERRIDE</span>
              )}
            </div>
            <div className="text-xs font-black text-white mt-1 truncate" title={currentActiveCompanyName}>
              {currentActiveCompanyName}
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* NAVEGACIÓN POR SUB-PESTAÑAS DEL MÓDULO                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-[#00d2ff]" />
          <span>Usuarios & Roles ({filteredProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('companies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSubTab === 'companies'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>Empresas & Climatizadoras ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('switcher')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSubTab === 'switcher'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Conmutador de Tenant Activo</span>
          {activeCompanyOverride && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 1: GESTIÓN DE USUARIOS Y ROLES                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar usuario por nombre o correo electrónico..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro por Empresa */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold">Empresa:</span>
                <select
                  value={filterCompany}
                  onChange={e => setFilterCompany(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[160px] truncate"
                >
                  <option value="ALL">Todas las Empresas ({companies.length})</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Rol */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-bold">Rol:</span>
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ALL">Todos los Roles</option>
                  <option value="nexus_owner">👑 Nexus Owner</option>
                  <option value="admin">🛡️ Administrador</option>
                  <option value="tecnico">🔧 Técnico HVAC</option>
                  <option value="ayudante">🤝 Ayudante</option>
                  <option value="user">👤 Usuario</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Empresa Asignada</th>
                    <th className="py-3 px-4">Rol en el Ecosistema</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        {loading ? (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                            <span>Cargando usuarios...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-bold text-slate-700">No se encontraron usuarios</p>
                            <p className="text-[11px]">Prueba ajustando los filtros de búsqueda.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map(p => {
                      const isSaving = savingUserId === p.id;
                      const userComp = companies.find(c => c.id === p.company_id);
                      const isOwnerRole = ['nexus_owner', 'nexusowner', 'owner'].includes(p.role?.toLowerCase());

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Usuario info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isOwnerRole 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {p.full_name ? p.full_name.substring(0, 2).toUpperCase() : 'US'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span>{p.full_name || 'Sin Nombre'}</span>
                                  {isOwnerRole && (
                                    <span title="Nexus Owner" className="inline-flex items-center">
                                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">{p.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Selector de Empresa Asignada */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={p.company_id || ''}
                                onChange={e => handleAssignCompany(p.id, e.target.value)}
                                disabled={isSaving}
                                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border transition-all cursor-pointer max-w-[200px] truncate ${
                                  p.company_id === currentCompanyId
                                    ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                                } disabled:opacity-50`}
                              >
                                {companies.map(comp => (
                                  <option key={comp.id} value={comp.id}>
                                    {comp.name} {comp.id === currentCompanyId ? '(Activa)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Selector de Rol */}
                          <td className="py-3.5 px-4">
                            <select
                              value={p.role || 'user'}
                              onChange={e => handleAssignRole(p.id, e.target.value)}
                              disabled={isSaving}
                              className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border transition-all cursor-pointer ${
                                isOwnerRole
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : p.role === 'admin'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : p.role === 'tecnico'
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              } disabled:opacity-50`}
                            >
                              <option value="nexus_owner">👑 Nexus Owner (Superadmin)</option>
                              <option value="admin">🛡️ Administrador</option>
                              <option value="tecnico">🔧 Técnico HVAC</option>
                              <option value="ayudante">🤝 Ayudante Cuadrilla</option>
                              <option value="user">👤 Usuario Estándar</option>
                            </select>
                          </td>

                          {/* Estado Activo */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleUserActive(p.id, p.is_active !== false)}
                              disabled={isSaving}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
                                p.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              } disabled:opacity-50`}
                              title={p.is_active !== false ? 'Click para suspender acceso' : 'Click para reactivar'}
                            >
                              {p.is_active !== false ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Activo</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Suspendido</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Acciones Rápidas */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 2: EMPRESAS CLIMATIZADORAS (TENANTS)                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-black text-slate-900">Empresas Climatizadoras Registradas</h2>
              <p className="text-xs text-slate-500">
                Cada empresa opera como un tenant independiente con su propio catálogo, clientes y técnicos.
              </p>
            </div>

            <button
              onClick={() => setIsCreateCompanyOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Empresa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(comp => {
              const isCurrent = comp.id === currentCompanyId;
              const landingUrl = `?t=${comp.slug || 'nexus-air'}`;

              return (
                <div
                  key={comp.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                    isCurrent
                      ? 'border-[#00d2ff] ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-sm">
                          <Building2 className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-black text-slate-900 text-sm leading-snug">
                              {comp.name}
                            </h3>
                            {comp.is_lobby && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-black">
                                LOBBY
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            slug: {comp.slug || 'sin-slug'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 text-[10px] font-black">
                            ACTIVA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Usuarios</span>
                        <span className="font-extrabold text-slate-800">{comp.user_count || 0} registrados</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Esquema</span>
                        <span className="font-mono text-slate-600 text-[11px]">{comp.schema_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la Tarjeta */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSwitchActiveCompany(comp.id);
                        toast.success(`Sesión cambiada a: ${comp.name}`);
                        if (onReloadStoreData) onReloadStoreData();
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-500 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Empresa en Pantalla' : 'Activar en mi Sesión'}
                    </button>

                    {comp.slug && (
                      <a
                        href={landingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Abrir Landing Pública del Tenant"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 3: CONMUTADOR DE TENANT ACTIVO                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'switcher' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-600" />
              <span>Conmutador Rápido de Empresa (Impersonate Tenant)</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Como <strong>Nexus Owner</strong>, puedes alternar la empresa activa de tu sesión. Al seleccionar una empresa, toda la aplicación (Órdenes, Agenda, Clientes, Inventario, Reportes y Ajustes) operará con los datos de ese tenant específico.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Empresa visualizada actualmente:</span>
              <span className="text-sm font-black text-amber-900">
                {currentActiveCompanyName}
              </span>
              {activeCompanyOverride && (
                <p className="mt-1 text-[11px] text-amber-800">
                  Estás en modo override. Puedes volver a tu empresa principal en cualquier momento.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Selecciona la empresa a inspeccionar:
            </label>
            <div className="space-y-2">
              {companies.map(comp => {
                const isSelected = comp.id === currentCompanyId;
                return (
                  <div
                    key={comp.id}
                    onClick={() => {
                      onSwitchActiveCompany(comp.id);
                      toast.success(`Cambiando a empresa: ${comp.name}`);
                      if (onReloadStoreData) onReloadStoreData();
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-cyan-50/80 border-[#00d2ff] ring-2 ring-cyan-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-[#00d2ff] text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs text-slate-900">{comp.name}</span>
                          {comp.is_lobby && (
                            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-black">
                              LOBBY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">slug: {comp.slug}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500">
                        {comp.user_count || 0} usuarios
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-xs font-black text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                          <span>Seleccionada</span>
                        </span>
                      ) : (
                        <button className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1 bg-white border border-slate-200 rounded-xl">
                          Conmutar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeCompanyOverride && (
            <button
              onClick={() => {
                onSwitchActiveCompany(null);
                toast.success('Restablecido a empresa principal por defecto.');
                if (onReloadStoreData) onReloadStoreData();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Restablecer a mi empresa por defecto
            </button>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREAR EMPRESA CLIMATIZADORA                                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isCreateCompanyOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Crear Empresa Climatizadora</h3>
                  <p className="text-xs text-slate-400">Aprovisionar nuevo tenant para Nexus Air</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateCompanyOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={e => {
                    setNewCompanyName(e.target.value);
                    if (!newCompanySlug || newCompanySlug === newCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
                      setNewCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="ej: Climatizaciones Austral SpA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Slug Identificador (URL) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">?t=</span>
                  <input
                    type="text"
                    required
                    value={newCompanySlug}
                    onChange={e => setNewCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="austral-clima"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Correo Comercial
                  </label>
                  <input
                    type="email"
                    value={newCompanyEmail}
                    onChange={e => setNewCompanyEmail(e.target.value)}
                    placeholder="contacto@empresa.cl"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={newCompanyPhone}
                    onChange={e => setNewCompanyPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Dirección Base
                </label>
                <input
                  type="text"
                  value={newCompanyAddress}
                  onChange={e => setNewCompanyAddress(e.target.value)}
                  placeholder="ej: Av. Vitacura 2900, Santiago"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  País de Operación
                </label>
                <select
                  value={newCompanyCountry}
                  onChange={e => setNewCompanyCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                >
                  <option value="Chile">🇨🇱 Chile (CLP $ • IVA 19%)</option>
                  <option value="Costa Rica">🇨🇷 Costa Rica (CRC ₡ • IVA 13%)</option>
                  <option value="Perú">🇵🇪 Perú (PEN S/ • IGV 18%)</option>
                  <option value="Colombia">🇨🇴 Colombia (COP $ • IVA 19%)</option>
                  <option value="México">🇲🇽 México (MXN $ • IVA 16%)</option>
                  <option value="Internacional">🌐 Internacional (USD $)</option>
                </select>
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={newCompanyIsLobby}
                  onChange={e => setNewCompanyIsLobby(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Es Organización Lobby (is_lobby)</span>
                  <span className="text-[11px] text-slate-500 block">Establece esta empresa como la organización central o de bienvenida en la red Nexus.</span>
                </div>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateCompanyOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCompanyLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingCompanyLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando Empresa...</span>
                    </>
                  ) : (
                    <span>Registrar Empresa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREAR USUARIO                                                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[#00d2ff]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Nuevo Usuario</h3>
                  <p className="text-xs text-slate-400">Crear credenciales y asignar empresa/rol</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="ej: Carlos Valenzuela"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Correo Electrónico (Login) *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="carlos.v@climatizacion.cl"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Contraseña Inicial *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Empresa Asignada *
                </label>
                <select
                  value={newUserCompanyId}
                  onChange={e => setNewUserCompanyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.id === currentCompanyId ? '(Activa)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Rol Inicial *
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                >
                  <option value="admin">🛡️ Administrador de Empresa</option>
                  <option value="tecnico">🔧 Técnico HVAC Certificado</option>
                  <option value="ayudante">🤝 Ayudante de Cuadrilla</option>
                  <option value="nexus_owner">👑 Nexus Owner (Superadmin)</option>
                  <option value="user">👤 Usuario Estándar</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUserLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#00d2ff] hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingUserLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Crear Usuario</span>
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
