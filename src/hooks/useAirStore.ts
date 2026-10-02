import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, supabaseAir } from '../lib/supabase';
import { 
  ServiceOrder, 
  Customer, 
  AirEquipment, 
  Technician, 
  AirPart, 
  AirSettings, 
  OrderStatus,
  RecaptacionReminder,
  HVACInspectionChecklist,
  TechnicianPayout,
  FixedCosts,
  Expense,
  FinanceSettings,
  RecurringMaintenanceSchedule,
  SERVICE_TYPE_DEFAULT_COLORS,
  DEFAULT_ROLE_PERMISSIONS
} from '../types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_CUSTOMERS, 
  INITIAL_EQUIPMENTS, 
  INITIAL_TECHNICIANS, 
  INITIAL_PARTS, 
  INITIAL_SERVICE_ORDERS,
  INITIAL_FIXED_COSTS,
  INITIAL_EXPENSES,
  INITIAL_FINANCE_SETTINGS,
  INITIAL_RECURRING_SCHEDULES
} from '../lib/mockAirData';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export const DEFAULT_COMPANY_ID = 'a1111111-2222-3333-4444-555555555555';
export const DEMO_SANDBOX_COMPANY_ID = '00000000-0000-0000-0000-000000000000';

export function useAirStore(companyId: string = DEFAULT_COMPANY_ID) {
  const isMockCompany = (companyId === DEMO_SANDBOX_COMPANY_ID);
  const fetchCounterRef = React.useRef(0);

  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_orders_${companyId}`);
      if (saved) return JSON.parse(saved);
      if (isMockCompany) return INITIAL_SERVICE_ORDERS;
    } catch (e) {
      console.warn('Error reading orders from localStorage:', e);
    }
    return isMockCompany ? INITIAL_SERVICE_ORDERS : [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_customers_${companyId}`);
      if (saved) return JSON.parse(saved);
      if (isMockCompany) return INITIAL_CUSTOMERS;
    } catch (e) {
      console.warn('Error reading customers from localStorage:', e);
    }
    return isMockCompany ? INITIAL_CUSTOMERS : [];
  });

  const [equipments, setEquipments] = useState<AirEquipment[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_equipments_${companyId}`);
      if (saved) return JSON.parse(saved);
      if (isMockCompany) return INITIAL_EQUIPMENTS;
    } catch (e) {
      console.warn('Error reading equipments from localStorage:', e);
    }
    return isMockCompany ? INITIAL_EQUIPMENTS : [];
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_technicians_${companyId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (isMockCompany) return INITIAL_TECHNICIANS;
    } catch (e) {
      console.warn('Error reading technicians from localStorage:', e);
    }
    return isMockCompany ? INITIAL_TECHNICIANS : [];
  });

  const [parts, setParts] = useState<AirPart[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_parts_${companyId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (isMockCompany) return INITIAL_PARTS;
    } catch (e) {
      console.warn('Error reading parts from localStorage:', e);
    }
    return isMockCompany ? INITIAL_PARTS : [];
  });

  const [technicianPayouts, setTechnicianPayouts] = useState<TechnicianPayout[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_technician_payouts_${companyId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading technician payouts from localStorage:', e);
    }
    return [];
  });

  const [settings, setSettings] = useState<AirSettings>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_settings_${companyId}`);
      if (saved) {
        return {
          ...INITIAL_SETTINGS,
          ...JSON.parse(saved),
          company_id: companyId,
        };
      }
    } catch (e) {
      console.warn('Error reading settings from localStorage:', e);
    }
    return {
      ...INITIAL_SETTINGS,
      company_id: companyId,
      company_name: isMockCompany ? 'HVAC Chile SpA' : 'Mi Empresa Climatizadora',
      fantasy_name: isMockCompany ? 'HVAC Chile SpA' : 'Mi Empresa Climatizadora',
      company_slug: isMockCompany ? 'nexus-air' : '',
    };
  });

  // NK-038: Recargar configuración específica de la empresa al alternar de compañía
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_settings_${companyId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({
          ...INITIAL_SETTINGS,
          ...prev,
          ...parsed,
          company_id: companyId
        }));
      }
    } catch (e) {
      console.warn('Error reloading company settings from localStorage:', e);
    }
  }, [companyId]);

  const [fixedCosts, setFixedCosts] = useState<FixedCosts>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_fixed_costs_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading fixed costs from localStorage:', e);
    }
    return INITIAL_FIXED_COSTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_expenses_${companyId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar exp-7 o mock de bomba de vacío de 220.000 para empresas reales
          return !isMockCompany 
            ? parsed.filter((e: any) => e.id !== 'exp-7' && !e.description?.toLowerCase().includes('bomba de vacío') && e.supplier !== 'Refriherramientas Chile')
            : parsed;
        }
      }
      return isMockCompany ? INITIAL_EXPENSES : [];
    } catch (e) {
      console.warn('Error reading expenses from localStorage:', e);
      return [];
    }
  });

  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_finance_settings_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading finance settings from localStorage:', e);
    }
    return INITIAL_FINANCE_SETTINGS;
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [contactedReminderIds, setContactedReminderIds] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_contacted_${companyId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // NK-053: Mantenimientos Periódicos Acordados con el Cliente
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringMaintenanceSchedule[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_recurring_schedules_${companyId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (isMockCompany) return INITIAL_RECURRING_SCHEDULES;
    } catch (e) {
      console.warn('Error reading recurring schedules from localStorage:', e);
    }
    return isMockCompany ? INITIAL_RECURRING_SCHEDULES : [];
  });

  // Persistir mantenimientos periódicos acordados localmente
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_recurring_schedules_${companyId}`, JSON.stringify(recurringSchedules));
    } catch (e) {
      console.warn('Error saving recurring schedules:', e);
    }
  }, [recurringSchedules, companyId]);

  // Guardar recordatorios contactados en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_contacted_${companyId}`, JSON.stringify(contactedReminderIds));
    } catch (e) {
      console.warn('Error saving contacted reminders:', e);
    }
  }, [contactedReminderIds, companyId]);

  // Persistir clientes localmente
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_customers_${companyId}`, JSON.stringify(customers));
      if (isMockCompany) {
        localStorage.setItem('nexus_air_customers', JSON.stringify(customers));
      }
    } catch (e) {
      console.warn('Error saving customers:', e);
    }
  }, [customers, companyId, isMockCompany]);

  // Persistir equipos localmente
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_equipments_${companyId}`, JSON.stringify(equipments));
      if (isMockCompany) {
        localStorage.setItem('nexus_air_equipments', JSON.stringify(equipments));
      }
    } catch (e) {
      console.warn('Error saving equipments:', e);
    }
  }, [equipments, companyId, isMockCompany]);

  // Persistir órdenes localmente
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_orders_${companyId}`, JSON.stringify(orders));
      if (isMockCompany) {
        localStorage.setItem('nexus_air_orders', JSON.stringify(orders));
      }
    } catch (e) {
      console.warn('Error saving orders:', e);
    }
  }, [orders, companyId, isMockCompany]);

  // Persistir técnicos localmente (NK-032)
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_technicians_${companyId}`, JSON.stringify(technicians));
      if (isMockCompany) {
        localStorage.setItem('nexus_air_technicians', JSON.stringify(technicians));
      }
    } catch (e) {
      console.warn('Error saving technicians:', e);
    }
  }, [technicians, companyId, isMockCompany]);

  // Persistir inventario localmente
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_parts_${companyId}`, JSON.stringify(parts));
    } catch (e) {
      console.warn('Error saving parts:', e);
    }
  }, [parts, companyId]);

  // Persistir liquidaciones de técnicos localmente (NK-043)
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_technician_payouts_${companyId}`, JSON.stringify(technicianPayouts));
    } catch (e) {
      console.warn('Error saving technician payouts:', e);
    }
  }, [technicianPayouts, companyId]);

  // Persistir costos fijos
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_fixed_costs_${companyId}`, JSON.stringify(fixedCosts));
    } catch (e) {
      console.warn('Error saving fixed costs:', e);
    }
  }, [fixedCosts, companyId]);

  // Persistir egresos
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_expenses_${companyId}`, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Error saving expenses:', e);
    }
  }, [expenses, companyId]);

  // Persistir configuración de finanzas y equilibrio
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_air_finance_settings_${companyId}`, JSON.stringify(financeSettings));
    } catch (e) {
      console.warn('Error saving finance settings:', e);
    }
  }, [financeSettings, companyId]);

  // Sincronizar estado en memoria inmediatamente al cambiar de empresa (switch o login)
  useEffect(() => {
    if (!companyId) return;
    const isMock = companyId === DEMO_SANDBOX_COMPANY_ID;

    // 1. Sincronizar órdenes
    try {
      const savedOrders = localStorage.getItem(`nexus_air_orders_${companyId}`);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        setOrders(isMock ? INITIAL_SERVICE_ORDERS : []);
      }
    } catch {
      setOrders(isMock ? INITIAL_SERVICE_ORDERS : []);
    }

    // 2. Sincronizar clientes
    try {
      const savedCusts = localStorage.getItem(`nexus_air_customers_${companyId}`);
      if (savedCusts) {
        setCustomers(JSON.parse(savedCusts));
      } else {
        setCustomers(isMock ? INITIAL_CUSTOMERS : []);
      }
    } catch {
      setCustomers(isMock ? INITIAL_CUSTOMERS : []);
    }

    // 3. Sincronizar equipos
    try {
      const savedEqs = localStorage.getItem(`nexus_air_equipments_${companyId}`);
      if (savedEqs) {
        setEquipments(JSON.parse(savedEqs));
      } else {
        setEquipments(isMock ? INITIAL_EQUIPMENTS : []);
      }
    } catch {
      setEquipments(isMock ? INITIAL_EQUIPMENTS : []);
    }

    // 4. Sincronizar técnicos
    try {
      const savedTechs = localStorage.getItem(`nexus_air_technicians_${companyId}`);
      if (savedTechs) {
        setTechnicians(JSON.parse(savedTechs));
      } else {
        setTechnicians(isMock ? INITIAL_TECHNICIANS : []);
      }
    } catch {
      setTechnicians(isMock ? INITIAL_TECHNICIANS : []);
    }

    // 5. Sincronizar repuestos
    try {
      const savedParts = localStorage.getItem(`nexus_air_parts_${companyId}`);
      if (savedParts) {
        setParts(JSON.parse(savedParts));
      } else {
        setParts(isMock ? INITIAL_PARTS : []);
      }
    } catch {
      setParts(isMock ? INITIAL_PARTS : []);
    }

    // 6. Sincronizar settings
    try {
      const savedSettings = localStorage.getItem(`nexus_air_settings_${companyId}`) || localStorage.getItem('nexus_air_active_settings');
      if (savedSettings) {
        setSettings(prev => ({
          ...INITIAL_SETTINGS,
          ...prev,
          ...JSON.parse(savedSettings),
          company_id: companyId,
        }));
      } else {
        setSettings({
          ...INITIAL_SETTINGS,
          company_id: companyId,
          company_name: isMock ? 'HVAC Chile SpA' : 'Mi Empresa Climatizadora',
          fantasy_name: isMock ? 'HVAC Chile SpA' : 'Mi Empresa Climatizadora',
          company_slug: isMock ? 'nexus-air' : '',
        });
      }
    } catch {
      setSettings({
        ...INITIAL_SETTINGS,
        company_id: companyId,
        company_name: isMock ? 'HVAC Chile SpA' : 'Mi Empresa Climatizadora',
        fantasy_name: isMock ? 'HVAC Chile SpA' : 'Mi Empresa Climatizadora',
        company_slug: isMock ? 'nexus-air' : '',
      });
    }

    // 7. Sincronizar recordatorios contactados
    try {
      const savedContacted = localStorage.getItem(`nexus_air_contacted_${companyId}`);
      setContactedReminderIds(savedContacted ? JSON.parse(savedContacted) : {});
    } catch {
      setContactedReminderIds({});
    }

    // 8. Sincronizar liquidaciones de técnicos (NK-043)
    try {
      const savedPayouts = localStorage.getItem(`nexus_air_technician_payouts_${companyId}`);
      if (savedPayouts) {
        setTechnicianPayouts(JSON.parse(savedPayouts));
      } else {
        setTechnicianPayouts([]);
      }
    } catch {
      setTechnicianPayouts([]);
    }

    // 9. Sincronizar costos fijos
    try {
      const savedFC = localStorage.getItem(`nexus_air_fixed_costs_${companyId}`);
      if (savedFC) setFixedCosts(JSON.parse(savedFC));
      else setFixedCosts(INITIAL_FIXED_COSTS);
    } catch {
      setFixedCosts(INITIAL_FIXED_COSTS);
    }

    // 10. Sincronizar egresos
    try {
      const isMockCompany = companyId === DEMO_SANDBOX_COMPANY_ID;
      const savedExp = localStorage.getItem(`nexus_air_expenses_${companyId}`);
      if (savedExp) {
        const parsed = JSON.parse(savedExp);
        if (Array.isArray(parsed)) {
          const clean = !isMockCompany
            ? parsed.filter((e: any) => e.id !== 'exp-7' && !e.description?.toLowerCase().includes('bomba de vacío') && e.supplier !== 'Refriherramientas Chile')
            : parsed;
          setExpenses(clean);
          localStorage.setItem(`nexus_air_expenses_${companyId}`, JSON.stringify(clean));
        } else {
          setExpenses(isMockCompany ? INITIAL_EXPENSES : []);
        }
      } else {
        setExpenses(isMockCompany ? INITIAL_EXPENSES : []);
      }
    } catch {
      setExpenses(companyId === DEMO_SANDBOX_COMPANY_ID ? INITIAL_EXPENSES : []);
    }

    // 11. Sincronizar configuración de finanzas
    try {
      const savedFS = localStorage.getItem(`nexus_air_finance_settings_${companyId}`);
      if (savedFS) setFinanceSettings(JSON.parse(savedFS));
      else setFinanceSettings(INITIAL_FINANCE_SETTINGS);
    } catch {
      setFinanceSettings(INITIAL_FINANCE_SETTINGS);
    }
  }, [companyId]);

  // Cargar datos desde Supabase (Schema 'air')
  const fetchData = useCallback(async () => {
    const fetchId = ++fetchCounterRef.current;
    try {
      const activeId = companyId || DEFAULT_COMPANY_ID;
      const isMock = activeId === DEMO_SANDBOX_COMPANY_ID;

      // 1. Settings
      const { data: dbSettings } = await supabaseAir
        .from('settings')
        .select('*')
        .eq('company_id', activeId)
        .maybeSingle();

      if (dbSettings) {
        // Leer configuración local específica de la empresa
        let localSaved: Partial<AirSettings> | null = null;
        try {
          const raw = localStorage.getItem(`nexus_air_settings_${activeId}`);
          if (raw) localSaved = JSON.parse(raw);
        } catch {}

        setSettings(prev => {
          // Si el usuario configuró localmente un país específico (ej. Costa Rica), mantenerlo
          const preferredCountry = localSaved?.country && localSaved.country !== 'Chile'
            ? localSaved.country
            : (dbSettings.country || localSaved?.country || prev.country || 'Chile');

          const preferredCountryCode = localSaved?.country && localSaved.country !== 'Chile' && localSaved.country_code
            ? localSaved.country_code
            : (dbSettings.country_code || localSaved?.country_code || prev.country_code || 'CL');

          const preferredCurrencySymbol = localSaved?.country && localSaved.country !== 'Chile' && localSaved.currency_symbol
            ? localSaved.currency_symbol
            : (dbSettings.currency_symbol || localSaved?.currency_symbol || prev.currency_symbol || '$');

          const preferredCurrencyCode = localSaved?.country && localSaved.country !== 'Chile' && localSaved.currency_code
            ? localSaved.currency_code
            : (dbSettings.currency_code || localSaved?.currency_code || prev.currency_code || 'CLP');

          const preferredTaxLabel = localSaved?.country && localSaved.country !== 'Chile' && localSaved.tax_id_label
            ? localSaved.tax_id_label
            : (dbSettings.tax_id_label || localSaved?.tax_id_label || prev.tax_id_label || 'RUT');

          const preferredTaxRate = localSaved?.country && localSaved.country !== 'Chile' && localSaved.tax_rate !== undefined
            ? localSaved.tax_rate
            : (dbSettings.tax_rate !== null && dbSettings.tax_rate !== undefined ? Number(dbSettings.tax_rate) : (prev.tax_rate ?? 0.19));

          const preferredTaxName = localSaved?.country && localSaved.country !== 'Chile' && localSaved.tax_name
            ? localSaved.tax_name
            : (dbSettings.tax_name || localSaved?.tax_name || prev.tax_name || 'IVA');

          const preferredDivision = localSaved?.country && localSaved.country !== 'Chile' && localSaved.division_label
            ? localSaved.division_label
            : (dbSettings.division_label || localSaved?.division_label || prev.division_label || 'Comuna');

          const merged: AirSettings = {
            ...prev,
            company_id: dbSettings.company_id || activeId,
            company_name: dbSettings.company_name || prev.company_name,
            fantasy_name: dbSettings.company_name || prev.fantasy_name,
            country: preferredCountry,
            country_code: preferredCountryCode,
            currency_symbol: preferredCurrencySymbol,
            currency_code: preferredCurrencyCode,
            tax_id_label: preferredTaxLabel,
            tax_rate: preferredTaxRate,
            tax_name: preferredTaxName,
            division_label: preferredDivision,
            phone: dbSettings.phone || prev.phone,
            whatsapp_number: (dbSettings.phone || prev.whatsapp_number).replace(/[^0-9]/g, ''),
            email: dbSettings.email || prev.email,
            address: dbSettings.address || prev.address,
            landing_config: dbSettings.landing_config || prev.landing_config,
            logo_url: dbSettings.logo_url || localSaved?.logo_url || prev.logo_url,
            company_slogan: dbSettings.company_slogan || localSaved?.company_slogan || prev.company_slogan,
            city: dbSettings.city || localSaved?.city || prev.city,
            default_apply_tax: dbSettings.default_apply_tax !== undefined 
              ? dbSettings.default_apply_tax 
              : (localSaved?.default_apply_tax !== undefined ? localSaved.default_apply_tax : (prev.default_apply_tax !== false)),
            default_tax_mode: dbSettings.finance_settings?.default_tax_mode || dbSettings.default_tax_mode || localSaved?.default_tax_mode || prev.default_tax_mode || 'included',
            maintenance_interval_months: (dbSettings.maintenance_interval_months !== null && dbSettings.maintenance_interval_months !== undefined)
              ? Number(dbSettings.maintenance_interval_months)
              : (localSaved?.maintenance_interval_months ?? prev.maintenance_interval_months ?? 6),
            quality_control_days: (dbSettings.quality_control_days !== null && dbSettings.quality_control_days !== undefined)
              ? Number(dbSettings.quality_control_days)
              : (localSaved?.quality_control_days ?? prev.quality_control_days ?? 7),
            inactive_recovery_months: (dbSettings.inactive_recovery_months !== null && dbSettings.inactive_recovery_months !== undefined)
              ? Number(dbSettings.inactive_recovery_months)
              : (localSaved?.inactive_recovery_months ?? prev.inactive_recovery_months ?? 9),
            pre_expiration_warning_days: (dbSettings.pre_expiration_warning_days !== null && dbSettings.pre_expiration_warning_days !== undefined)
              ? Number(dbSettings.pre_expiration_warning_days)
              : (localSaved?.pre_expiration_warning_days ?? prev.pre_expiration_warning_days ?? 15),
            standard_maintenance_price: dbSettings.finance_settings?.standard_maintenance_price ?? localSaved?.standard_maintenance_price ?? prev.standard_maintenance_price,
            standard_installation_price: dbSettings.finance_settings?.standard_installation_price ?? localSaved?.standard_installation_price ?? prev.standard_installation_price,
            bank_name: dbSettings.bank_name || localSaved?.bank_name || prev.bank_name || '',
            bank_account_type: dbSettings.bank_account_type || localSaved?.bank_account_type || prev.bank_account_type || '',
            bank_account_number: dbSettings.bank_account_number || localSaved?.bank_account_number || prev.bank_account_number || '',
            bank_account_rut: dbSettings.bank_account_rut || localSaved?.bank_account_rut || prev.bank_account_rut || '',
            bank_account_email: dbSettings.bank_account_email || localSaved?.bank_account_email || prev.bank_account_email || '',
            whatsapp_template_cobro: dbSettings.whatsapp_template_cobro || localSaved?.whatsapp_template_cobro || prev.whatsapp_template_cobro || '',
            admin_pin: dbSettings.finance_settings?.admin_pin || dbSettings.admin_pin || localSaved?.admin_pin || prev.admin_pin || '1234',
            service_type_colors: dbSettings.finance_settings?.service_type_colors || localSaved?.service_type_colors || prev.service_type_colors || SERVICE_TYPE_DEFAULT_COLORS,
            role_permissions: dbSettings.finance_settings?.role_permissions || localSaved?.role_permissions || prev.role_permissions || DEFAULT_ROLE_PERMISSIONS,
            finance_settings: dbSettings.finance_settings || localSaved?.finance_settings || prev.finance_settings || {},
          };

          try {
            localStorage.setItem(`nexus_air_settings_${activeId}`, JSON.stringify(merged));
          } catch {}

          return merged;
        });
      } else if (!isMock) {
        // Fallback y auto-inicialización para empresas sin registro en air.settings: obtener de public.companies
        try {
          const { data: compData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', activeId)
            .maybeSingle();

          if (compData) {
            const isCR = compData.name?.toLowerCase().includes('venefrio') || (compData.phone && compData.phone.startsWith('+506'));
            const initialTenantSettings: any = {
              company_id: compData.id,
              company_name: compData.name,
              company_slug: compData.slug || activeId.substring(0, 8),
              phone: compData.phone || (isCR ? '+506 7202 8833' : ''),
              address: compData.address || (isCR ? 'San José, Costa Rica' : ''),
              country: isCR ? 'Costa Rica' : 'Chile',
              country_code: isCR ? 'CR' : 'CL',
              currency_symbol: isCR ? '₡' : '$',
              currency_code: isCR ? 'CRC' : 'CLP',
              tax_id_label: isCR ? 'Cédula Jurídica' : 'RUT',
              tax_rate: isCR ? 0.13 : 0.19,
              tax_name: 'IVA',
              division_label: isCR ? 'Cantón' : 'Comuna',
              updated_at: new Date().toISOString()
            };

            // Guardar automáticamente en air.settings para que persista
            try {
              await supabaseAir.from('settings').upsert(initialTenantSettings, { onConflict: 'company_id' });
            } catch (err) {
              console.warn('[useAirStore] Auto-inserting air.settings failed:', err);
            }

            setSettings(prev => {
              const freshSettings: AirSettings = {
                ...prev,
                ...initialTenantSettings,
                fantasy_name: compData.name,
              };
              try {
                localStorage.setItem(`nexus_air_settings_${activeId}`, JSON.stringify(freshSettings));
              } catch {}
              return freshSettings;
            });
          }
        } catch (e) {
          console.warn('[useAirStore] Error fetching company data fallback:', e);
        }
      }

      // 2. Clientes
      const { data: dbCustomers } = await supabaseAir
        .from('customers')
        .select('*')
        .eq('company_id', activeId)
        .order('name', { ascending: true });

      // 3. Equipos
      const { data: dbEquipments } = await supabaseAir
        .from('equipments')
        .select('*')
        .eq('company_id', activeId);

      // 4. Técnicos
      const { data: dbTechnicians } = await supabaseAir
        .from('technicians')
        .select('*')
        .eq('company_id', activeId)
        .order('name', { ascending: true });

      // 5. Inventario
      const { data: dbInventory } = await supabaseAir
        .from('inventory')
        .select('*')
        .eq('company_id', activeId)
        .order('name', { ascending: true });

      // 6. Órdenes
      const { data: dbOrders } = await supabaseAir
        .from('orders')
        .select('*')
        .eq('company_id', activeId)
        .order('scheduled_date', { ascending: true });

      // Verificar si hubo otra llamada a fetchData mientras esta petición estaba en curso
      if (fetchCounterRef.current !== fetchId) return;

      const companyIntervalDays = (dbSettings?.maintenance_interval_months ? Number(dbSettings.maintenance_interval_months) : 6) * 30;

      if (dbCustomers && dbCustomers.length > 0) {
        setCustomers(dbCustomers.map((c: any) => ({
          id: c.id,
          name: c.name,
          rut: c.rut,
          phone: c.phone,
          email: c.email || '',
          address: c.address,
          commune: c.commune,
          city: c.city || 'Santiago',
          customer_type: c.customer_type || 'residencial',
          notes: c.notes,
          created_at: c.created_at,
          equipments: (dbEquipments || []).filter((e: any) => e.customer_id === c.id).map((e: any) => ({
            id: e.id,
            customer_id: e.customer_id,
            brand: e.brand,
            model: e.model || e.technology || 'Split Inverter',
            serial_number: e.serial_number,
            serial_number_evaporator: e.serial_number_evaporator,
            serial_number_condenser: e.serial_number_condenser,
            btu: e.btu,
            type: e.type || 'split_muro',
            technology: e.technology || 'inverter',
            refrigerant: e.refrigerant || 'R410A',
            location_in_property: e.location_in_property,
            installation_date: e.installation_date,
            last_maintenance_date: e.last_maintenance_date,
            next_maintenance_date: e.next_maintenance_date || format(addDays(new Date(), companyIntervalDays), 'yyyy-MM-dd'),
            notes: e.notes,
          }))
        })));
      } else if (!isMock) {
        setCustomers([]);
      }

      if (dbEquipments && dbEquipments.length > 0) {
        setEquipments(dbEquipments.map((e: any) => ({
          id: e.id,
          customer_id: e.customer_id,
          brand: e.brand,
          model: e.model || e.technology || 'Split Inverter',
          serial_number: e.serial_number,
          serial_number_evaporator: e.serial_number_evaporator,
          serial_number_condenser: e.serial_number_condenser,
          btu: e.btu,
          type: e.type || 'split_muro',
          technology: e.technology || 'inverter',
          refrigerant: e.refrigerant || 'R410A',
          location_in_property: e.location_in_property,
          installation_date: e.installation_date,
          last_maintenance_date: e.last_maintenance_date,
          next_maintenance_date: e.next_maintenance_date || format(addDays(new Date(), companyIntervalDays), 'yyyy-MM-dd'),
          notes: e.notes,
        })));
      } else if (!isMock) {
        setEquipments([]);
      }

      if (dbTechnicians && dbTechnicians.length > 0) {
        let localTechs: Record<string, any> = {};
        try {
          const raw = localStorage.getItem(`nexus_air_technicians_${activeId}`);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach((lt: any) => { if (lt && lt.id) localTechs[lt.id] = lt; });
            }
          }
        } catch {}

        setTechnicians(dbTechnicians.map((t: any) => {
          const local = localTechs[t.id] || {};
          return {
            id: t.id,
            name: t.name,
            rut: t.rut,
            phone: t.phone,
            email: t.email,
            role: t.role || local.role || 'tecnico',
            custom_role_title: t.custom_role_title || local.custom_role_title,
            salary_mode: t.salary_mode || local.salary_mode || ((t.role === 'ayudante' || t.role === 'administracion') ? 'fixed' : 'commission'),
            base_salary: t.base_salary !== undefined ? Number(t.base_salary) : (local.base_salary !== undefined ? Number(local.base_salary) : (t.role === 'ayudante' ? 600000 : (t.role === 'administracion' ? 750000 : 0))),
            working_days_default: t.working_days_default || local.working_days_default || 30,
            sec_certified: t.sec_certified ?? true,
            status: t.active ? 'disponible' : 'inactivo',
            default_commission_type: t.default_commission_type || 'fixed',
            default_commission_value: t.default_commission_value !== null && t.default_commission_value !== undefined ? Number(t.default_commission_value) : 20000,
            commission_mantencion_type: t.commission_mantencion_type || 'fixed',
            commission_mantencion_value: t.commission_mantencion_value !== null && t.commission_mantencion_value !== undefined ? Number(t.commission_mantencion_value) : 20000,
            commission_instalacion_type: t.commission_instalacion_type || 'fixed',
            commission_instalacion_value: t.commission_instalacion_value !== null && t.commission_instalacion_value !== undefined ? Number(t.commission_instalacion_value) : 35000,
            commission_reparacion_type: t.commission_reparacion_type || 'fixed',
            commission_reparacion_value: t.commission_reparacion_value !== null && t.commission_reparacion_value !== undefined ? Number(t.commission_reparacion_value) : 15000,
            active_orders_count: 1
          };
        }));
      } else if (!isMock) {
        setTechnicians([]);
      }

      if (dbInventory && dbInventory.length > 0) {
        setParts(dbInventory.map((i: any) => ({
          id: i.id,
          sku: i.code || 'SKU-00',
          name: i.name,
          category: i.category,
          stock: i.stock,
          min_stock: i.min_stock,
          cost_price: Number(i.cost) || 0,
          sale_price: Number(i.price) || 0,
          unit: i.unit || 'unidad'
        })));
      } else if (!isMock) {
        setParts([]);
      }

      if (dbOrders && dbOrders.length > 0) {
        const mappedOrders: ServiceOrder[] = dbOrders.map((o: any) => {
          const cust = (dbCustomers || []).find((c: any) => c.id === o.customer_id);
          const eq = (dbEquipments || []).find((e: any) => e.id === o.equipment_id);
          const tech = (dbTechnicians || []).find((t: any) => t.id === o.assigned_technician_id);
          const asst = (dbTechnicians || []).find((t: any) => t.id === o.assigned_assistant_id);

          const orderTotal = Number(o.total) || 0;
          const orderSubtotal = o.subtotal !== null && o.subtotal !== undefined ? Number(o.subtotal) : orderTotal;
          const orderTax = o.tax !== null && o.tax !== undefined ? Number(o.tax) : 0;

          return {
            id: o.id,
            ticket_number: o.ticket_number || `AIR-2026-${o.id.slice(0, 4).toUpperCase()}`,
            customer_id: o.customer_id,
            customer: cust ? {
              id: cust.id,
              name: cust.name,
              rut: cust.rut,
              phone: cust.phone,
              email: cust.email || '',
              address: cust.address,
              commune: cust.commune,
              city: 'Santiago',
              customer_type: 'residencial',
              created_at: cust.created_at
            } : undefined,
            equipment_id: o.equipment_id,
            equipment: eq ? {
              id: eq.id,
              customer_id: eq.customer_id,
              brand: eq.brand,
              model: eq.model || eq.technology || 'Split Inverter',
              serial_number: eq.serial_number,
              serial_number_evaporator: eq.serial_number_evaporator,
              serial_number_condenser: eq.serial_number_condenser,
              btu: eq.btu,
              type: eq.type || 'split_muro',
              technology: eq.technology || 'inverter',
              refrigerant: eq.refrigerant || 'R410A',
              location_in_property: eq.location_in_property,
              installation_date: eq.installation_date,
              last_maintenance_date: eq.last_maintenance_date,
              next_maintenance_date: eq.next_maintenance_date,
              notes: eq.notes
            } : undefined,
            assigned_technician_id: o.assigned_technician_id,
            assigned_technician: tech ? {
              id: tech.id,
              name: tech.name,
              rut: tech.rut,
              phone: tech.phone,
              email: tech.email,
              role: tech.role || 'tecnico',
              sec_certified: tech.sec_certified ?? true,
              status: tech.active ? 'disponible' : 'inactivo'
            } : undefined,
            assigned_assistant_id: o.assigned_assistant_id,
            assigned_assistant: asst ? {
              id: asst.id,
              name: asst.name,
              rut: asst.rut,
              phone: asst.phone,
              email: asst.email,
              role: asst.role || 'ayudante',
              sec_certified: asst.sec_certified ?? false,
              status: asst.active ? 'disponible' : 'inactivo'
            } : undefined,
            technician_payout_type: o.technician_payout_type || 'fixed',
            technician_payout_value: o.technician_payout_value !== null && o.technician_payout_value !== undefined ? Number(o.technician_payout_value) : 0,
            assistant_payout_type: o.assistant_payout_type || 'fixed',
            assistant_payout_value: o.assistant_payout_value !== null && o.assistant_payout_value !== undefined ? Number(o.assistant_payout_value) : 0,
            service_type: o.service_type || 'mantencion_preventiva',
            status: o.status || 'ingresado',
            scheduled_date: o.scheduled_date ? o.scheduled_date.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
            scheduled_time_slot: o.scheduled_time_slot || '09:00 - 11:00',
            description: o.description || '',
            diagnosis: o.diagnosis,
            resolution: o.resolution,
            checklist: (() => {
              const defaultCl = {
                clean_filters: false,
                clean_evaporator_coil: false,
                clean_turbine_fan: false,
                sanitize_bactericide: false,
                clean_condenser_coil: false,
                check_electrical_connections: false,
                check_condensate_drain: false,
                delta_t_celsius: 12.0,
                suction_pressure_psi: 120,
                discharge_pressure_psi: 350,
                amperage_amps: 4.5,
                technician_notes: '',
                photos_before: [],
                photos_after: [],
                videos_before: [],
                videos_after: [],
              };
              if (!o.checklist) return defaultCl;
              if (typeof o.checklist === 'string') {
                try {
                  return { ...defaultCl, ...JSON.parse(o.checklist) };
                } catch {
                  return defaultCl;
                }
              }
              if (typeof o.checklist === 'object') {
                return { ...defaultCl, ...o.checklist };
              }
              return defaultCl;
            })(),
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: orderSubtotal,
            tax: orderTax,
            total: orderTotal,
            payment_status: o.payment_status || 'pendiente',
            payment_method: o.payment_method,
            technician_location: o.technician_location,
            created_at: o.created_at || new Date().toISOString(),
            completed_at: o.completed_at,
            apply_tax: o.apply_tax !== undefined ? o.apply_tax : true,
            payment_reference: o.payment_reference,
            payment_proof_url: o.payment_proof_url,
            paid_amount: o.paid_amount !== null && o.paid_amount !== undefined ? Number(o.paid_amount) : undefined,
            payment_date: o.payment_date,
            payment_notes: o.payment_notes,
            invoice_number: o.invoice_number,
            folio: o.folio,
            calendar_color: o.calendar_color || (o.checklist && typeof o.checklist === 'object' && o.checklist.calendar_color) || undefined,
            equipment_ids: (o.checklist && typeof o.checklist === 'object' && o.checklist.equipment_ids) || (o.equipment_id ? [o.equipment_id] : []),
            equipments_summary: (o.checklist && typeof o.checklist === 'object' && o.checklist.equipments_summary) || undefined,
          };
        });
        setOrders(mappedOrders);
      } else if (!isMock) {
        setOrders([]);
      }

      // 7. Mantenimientos Periódicos Acordados (NK-081)
      try {
        const { data: dbRecurring, error: recErr } = await supabaseAir
          .from('recurring_schedules')
          .select('*')
          .eq('company_id', activeId)
          .order('created_at', { ascending: false });

        if (!recErr && dbRecurring && dbRecurring.length > 0) {
          const mappedRec: RecurringMaintenanceSchedule[] = dbRecurring.map((r: any) => ({
            id: r.id,
            company_id: r.company_id,
            customer_id: r.customer_id,
            customer_name: r.customer_name || '',
            customer_phone: r.customer_phone || '',
            customer_address: r.customer_address || '',
            customer_commune: r.customer_commune || '',
            equipment_ids: Array.isArray(r.equipment_ids) ? r.equipment_ids : [],
            equipments_summary: r.equipments_summary || '',
            frequency_months: Number(r.frequency_months) || 6,
            start_date: r.start_date || '',
            next_suggested_date: r.next_suggested_date || '',
            confirmed_date: r.confirmed_date || undefined,
            preferred_time_slot: r.preferred_time_slot || '',
            preferred_technician_id: r.preferred_technician_id || undefined,
            notes: r.notes || '',
            status: r.status || 'programado',
            last_notified_at: r.last_notified_at || undefined,
            associated_order_id: r.associated_order_id || undefined,
            created_at: r.created_at || new Date().toISOString(),
            updated_at: r.updated_at || undefined,
          }));
          setRecurringSchedules(mappedRec);
          try {
            localStorage.setItem(`nexus_air_recurring_schedules_${activeId}`, JSON.stringify(mappedRec));
          } catch {}
        } else if (!isMock && (!dbRecurring || dbRecurring.length === 0)) {
          try {
            const saved = localStorage.getItem(`nexus_air_recurring_schedules_${activeId}`);
            if (saved) {
              const localList: RecurringMaintenanceSchedule[] = JSON.parse(saved);
              if (Array.isArray(localList) && localList.length > 0) {
                for (const loc of localList) {
                  await supabaseAir.from('recurring_schedules').upsert({
                    id: loc.id,
                    company_id: activeId,
                    customer_id: loc.customer_id,
                    customer_name: loc.customer_name,
                    customer_phone: loc.customer_phone,
                    customer_address: loc.customer_address,
                    customer_commune: loc.customer_commune,
                    equipment_ids: loc.equipment_ids,
                    equipments_summary: loc.equipments_summary,
                    frequency_months: loc.frequency_months,
                    start_date: loc.start_date,
                    next_suggested_date: loc.next_suggested_date,
                    confirmed_date: loc.confirmed_date,
                    preferred_time_slot: loc.preferred_time_slot,
                    preferred_technician_id: loc.preferred_technician_id,
                    notes: loc.notes,
                    status: loc.status,
                    associated_order_id: loc.associated_order_id,
                    created_at: loc.created_at || new Date().toISOString(),
                    updated_at: loc.updated_at || new Date().toISOString()
                  }, { onConflict: 'id' });
                }
                setRecurringSchedules(localList);
              }
            }
          } catch (migrateErr) {
            console.warn('[useAirStore] Error migrating local recurring schedules to cloud:', migrateErr);
          }
        }
      } catch (errRec) {
        console.warn('[useAirStore] Failed to fetch recurring_schedules:', errRec);
      }

      // 8. Liquidaciones de Técnicos (NK-043)
      const { data: dbPayouts } = await supabaseAir
        .from('technician_payouts')
        .select('*')
        .eq('company_id', activeId)
        .order('payment_date', { ascending: false });

      if (dbPayouts && dbPayouts.length > 0) {
        let localPayouts: Record<string, any> = {};
        try {
          const raw = localStorage.getItem(`nexus_air_technician_payouts_${activeId}`);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach((lp: any) => { if (lp && lp.id) localPayouts[lp.id] = lp; });
            }
          }
        } catch {}

        setTechnicianPayouts(dbPayouts.map((p: any) => {
          const local = localPayouts[p.id] || {};
          let parsedMeta: any = {};
          if (p.notes && typeof p.notes === 'string' && p.notes.startsWith('{')) {
            try {
              parsedMeta = JSON.parse(p.notes);
            } catch {}
          }
          return {
            id: p.id,
            company_id: p.company_id,
            payout_number: p.payout_number || local.payout_number,
            technician_id: p.technician_id,
            technician_name: p.technician_name,
            technician_role: p.technician_role,
            salary_mode: p.salary_mode || local.salary_mode || parsedMeta.salary_mode,
            payout_type: p.payout_type || local.payout_type || parsedMeta.payout_type || 'liquidacion',
            payment_proof_url: p.payment_proof_url || local.payment_proof_url || parsedMeta.payment_proof_url || undefined,
            base_salary: p.base_salary !== undefined ? Number(p.base_salary) : (local.base_salary !== undefined ? Number(local.base_salary) : parsedMeta.base_salary),
            commission_amount: p.commission_amount !== undefined ? Number(p.commission_amount) : (local.commission_amount !== undefined ? Number(local.commission_amount) : parsedMeta.commission_amount),
            bonus_amount: p.bonus_amount !== undefined ? Number(p.bonus_amount) : (local.bonus_amount !== undefined ? Number(local.bonus_amount) : parsedMeta.bonus_amount),
            deduction_amount: p.deduction_amount !== undefined ? Number(p.deduction_amount) : (local.deduction_amount !== undefined ? Number(local.deduction_amount) : parsedMeta.deduction_amount),
            working_days: p.working_days !== undefined ? Number(p.working_days) : (local.working_days !== undefined ? Number(local.working_days) : parsedMeta.working_days),
            period_month: p.period_month,
            amount: Number(p.amount) || 0,
            payment_date: p.payment_date,
            payment_method: p.payment_method,
            payment_reference: p.payment_reference,
            notes: parsedMeta.user_notes !== undefined ? parsedMeta.user_notes : p.notes,
            order_ids: Array.isArray(p.order_ids) ? p.order_ids : (local.order_ids || []),
            created_at: p.created_at,
            updated_at: p.updated_at
          };
        }));
      } else if (!isMock) {
        setTechnicianPayouts([]);
      }

      // 8. Egresos y Gastos del Negocio en la Nube (NK-048)
      const { data: dbExpenses } = await supabaseAir
        .from('expenses')
        .select('*')
        .eq('company_id', activeId)
        .order('date', { ascending: false });

      if (dbExpenses && dbExpenses.length > 0) {
        const cleanDbExp = !isMock
          ? dbExpenses.filter((e: any) => e.id !== 'exp-7' && !e.description?.toLowerCase().includes('bomba de vacío') && e.supplier !== 'Refriherramientas Chile')
          : dbExpenses;

        const mappedExp: Expense[] = cleanDbExp.map((exp: any) => ({
          id: exp.id,
          company_id: exp.company_id,
          date: typeof exp.date === 'string' ? exp.date.split('T')[0] : exp.date,
          category: exp.category,
          description: exp.description,
          amount: Number(exp.amount) || 0,
          amount_usd: exp.amount_usd !== null && exp.amount_usd !== undefined ? Number(exp.amount_usd) : undefined,
          currency: exp.currency || 'CRC',
          payment_method: exp.payment_method || 'transferencia',
          status: exp.status || 'pagado',
          supplier: exp.supplier || '',
          invoice_number: exp.invoice_number || '',
          is_fixed: Boolean(exp.is_fixed),
          notes: exp.notes || '',
          created_at: exp.created_at
        }));
        setExpenses(mappedExp);
        try {
          localStorage.setItem(`nexus_air_expenses_${activeId}`, JSON.stringify(mappedExp));
        } catch {}
      } else if (!isMock) {
        setExpenses([]);
        try {
          localStorage.setItem(`nexus_air_expenses_${activeId}`, JSON.stringify([]));
        } catch {}
      }

      // 9. Costos Fijos Estructurales en la Nube (NK-048)
      const { data: dbFixedCosts } = await supabaseAir
        .from('fixed_costs')
        .select('*')
        .eq('company_id', activeId)
        .maybeSingle();

      if (dbFixedCosts) {
        const mappedFC: FixedCosts = {
          rent: Number(dbFixedCosts.rent) || 0,
          salaries: Number(dbFixedCosts.salaries) || 0,
          services: Number(dbFixedCosts.services) || 0,
          software: Number(dbFixedCosts.software) || 0,
          marketing: Number(dbFixedCosts.marketing) || 0,
          transport: Number(dbFixedCosts.transport) || 0,
          other: Number(dbFixedCosts.other) || 0,
        };
        setFixedCosts(mappedFC);
        try {
          localStorage.setItem(`nexus_air_fixed_costs_${activeId}`, JSON.stringify(mappedFC));
        } catch {}
      } else if (!isMock) {
        let localFC: FixedCosts | null = null;
        try {
          const raw = localStorage.getItem(`nexus_air_fixed_costs_${activeId}`);
          if (raw) localFC = JSON.parse(raw);
        } catch {}

        if (localFC) {
          try {
            await supabaseAir.from('fixed_costs').upsert({
              company_id: activeId,
              rent: localFC.rent || 0,
              salaries: localFC.salaries || 0,
              services: localFC.services || 0,
              software: localFC.software || 0,
              marketing: localFC.marketing || 0,
              transport: localFC.transport || 0,
              other: localFC.other || 0,
              updated_at: new Date().toISOString()
            });
            setFixedCosts(localFC);
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useAirStore] Using offline/initial cache:', err);
    } finally {
      if (fetchCounterRef.current === fetchId) {
        setIsLoaded(true);
      }
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();

    // Supabase Realtime channel con soporte completo para todas las tablas de climatización
    const channel = supabase
      .channel(`air-realtime-${companyId || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'air', table: 'orders' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'air', table: 'settings' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'air', table: 'technician_payouts' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'air', table: 'expenses' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'air', table: 'fixed_costs' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'air', table: 'customers' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'air', table: 'technicians' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchData]);

  // Motor de Recaptación Dinámica por Empresa (Intervalo configurable en meses y días de alerta)
  const reminders = useMemo<RecaptacionReminder[]>(() => {
    const today = new Date();
    const result: RecaptacionReminder[] = [];

    const intervalMonths = settings.maintenance_interval_months || 6;
    const intervalDays = intervalMonths * 30;
    const warningDays = settings.pre_expiration_warning_days ?? 15;

    equipments.forEach(eq => {
      const customer = customers.find(c => c.id === eq.customer_id);
      if (!customer) return;

      const baseDateStr = eq.last_maintenance_date || eq.installation_date || format(today, 'yyyy-MM-dd');
      let baseDate = parseISO(baseDateStr);
      if (isNaN(baseDate.getTime())) baseDate = today;

      // Fecha límite: calculada dinámicamente según la empresa (intervalMonths * 30 días)
      const dueDate = addDays(baseDate, intervalDays);
      const daysUntilDue = differenceInDays(dueDate, today);

      let status: RecaptacionReminder['status'] = 'al_dia';
      if (contactedReminderIds[eq.id]) {
        status = 'contactado';
      } else if (daysUntilDue < 0) {
        status = 'vencido';
      } else if (daysUntilDue <= warningDays) {
        status = 'por_vencer';
      }

      result.push({
        id: `rem-${eq.id}`,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        customer_address: customer.address,
        customer_commune: customer.commune,
        equipment_id: eq.id,
        equipment_brand: eq.brand,
        equipment_btu: eq.btu,
        equipment_location: eq.location_in_property,
        last_service_date: baseDateStr,
        last_service_type: eq.last_maintenance_date ? 'mantencion_preventiva' : 'instalacion',
        next_maintenance_due: format(dueDate, 'yyyy-MM-dd'),
        days_until_due: daysUntilDue,
        status,
        contacted_at: contactedReminderIds[eq.id],
        notes: eq.notes,
      });
    });

    return result.sort((a, b) => a.days_until_due - b.days_until_due);
  }, [equipments, customers, contactedReminderIds, settings.maintenance_interval_months, settings.pre_expiration_warning_days]);

  // Órdenes enriquecidas con relaciones
  const enrichedOrders = useMemo<ServiceOrder[]>(() => {
    return orders.map(ord => {
      const customer = customers.find(c => c.id === ord.customer_id);
      const equipment = equipments.find(e => e.id === ord.equipment_id);
      const technician = technicians.find(t => t.id === ord.assigned_technician_id);
      const assistant = technicians.find(t => t.id === ord.assigned_assistant_id);
      return {
        ...ord,
        customer: customer || ord.customer,
        equipment: equipment || ord.equipment,
        assigned_technician: technician || ord.assigned_technician,
        assigned_assistant: assistant || ord.assigned_assistant,
      };
    });
  }, [orders, customers, equipments, technicians]);

  // Acciones de Órdenes
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const completedAtStr = newStatus === 'completado' ? format(new Date(), 'yyyy-MM-dd HH:mm') : undefined;

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const completedAt = newStatus === 'completado' ? (o.completed_at || completedAtStr) : o.completed_at;
      
      // Si se completa, actualizar fecha de mantenimiento en los equipos intervenidos a hoy (+ intervalo configurado) - NK-077
      if (newStatus === 'completado') {
        const targetEqIds: string[] = (o.equipment_ids && o.equipment_ids.length > 0)
          ? o.equipment_ids
          : (o.equipment_id ? [o.equipment_id] : []);

        if (targetEqIds.length > 0) {
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const intervalDays = (settings.maintenance_interval_months || 6) * 30;
          const nextDateStr = format(addDays(new Date(), intervalDays), 'yyyy-MM-dd');

          setEquipments(eqPrev => eqPrev.map(eq => {
            if (targetEqIds.includes(eq.id)) {
              return {
                ...eq,
                last_maintenance_date: todayStr,
                next_maintenance_date: nextDateStr,
              };
            }
            return eq;
          }));

          // Sincronizar en base de datos Supabase
          supabaseAir
            .from('equipments')
            .update({
              last_maintenance_date: todayStr,
              next_maintenance_date: nextDateStr,
              updated_at: new Date().toISOString()
            })
            .in('id', targetEqIds)
            .then(({ error: eqErr }) => {
              if (eqErr) console.warn('[useAirStore] Error updating equipments in cloud:', eqErr);
            })
            .catch(err => console.warn('[useAirStore] Exception updating equipments in cloud:', err));
        }
      }

      return { ...o, status: newStatus, completed_at: completedAt };
    }));

    toast.success(`Estado: ${newStatus.replace('_', ' ').toUpperCase()}`);

    try {
      const dbUpdates: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      if (newStatus === 'completado') {
        dbUpdates.completed_at = new Date().toISOString();
      }

      await supabaseAir
        .from('orders')
        .update(dbUpdates)
        .eq('id', orderId);
    } catch (e) {
      console.warn('[useAirStore] Failed to sync order status to DB:', e);
    }
  }, [settings.maintenance_interval_months]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    toast.success('Orden de servicio actualizada');

    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.customer_id !== undefined) dbUpdates.customer_id = updates.customer_id;
      if (updates.equipment_id !== undefined) dbUpdates.equipment_id = updates.equipment_id || null;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.assigned_technician_id !== undefined) dbUpdates.assigned_technician_id = updates.assigned_technician_id || null;
      if (updates.assigned_assistant_id !== undefined) dbUpdates.assigned_assistant_id = updates.assigned_assistant_id || null;
      if (updates.technician_payout_type !== undefined) dbUpdates.technician_payout_type = updates.technician_payout_type;
      if (updates.technician_payout_value !== undefined) dbUpdates.technician_payout_value = updates.technician_payout_value;
      if (updates.assistant_payout_type !== undefined) dbUpdates.assistant_payout_type = updates.assistant_payout_type;
      if (updates.assistant_payout_value !== undefined) dbUpdates.assistant_payout_value = updates.assistant_payout_value;
      if (updates.technician_location !== undefined) dbUpdates.technician_location = updates.technician_location;
      if (updates.scheduled_date !== undefined) dbUpdates.scheduled_date = updates.scheduled_date;
      if (updates.scheduled_time_slot !== undefined) dbUpdates.scheduled_time_slot = updates.scheduled_time_slot;
      if (updates.service_type !== undefined) dbUpdates.service_type = updates.service_type;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis;
      if (updates.resolution !== undefined) dbUpdates.resolution = updates.resolution;
      if (updates.payment_status !== undefined) dbUpdates.payment_status = updates.payment_status;
      if (updates.payment_method !== undefined) dbUpdates.payment_method = updates.payment_method;
      if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
      if (updates.tax !== undefined) dbUpdates.tax = updates.tax;
      if (updates.total !== undefined) dbUpdates.total = updates.total;
      if (updates.items !== undefined) dbUpdates.items = updates.items;
      if (updates.completed_at !== undefined) dbUpdates.completed_at = updates.completed_at;
      if (updates.checklist !== undefined) dbUpdates.checklist = updates.checklist;
      if (updates.calendar_color !== undefined) {
        const curOrder = orders.find(o => o.id === orderId);
        const baseCl = dbUpdates.checklist || curOrder?.checklist || {};
        dbUpdates.checklist = { ...baseCl, calendar_color: updates.calendar_color };
      }
      if (updates.equipment_ids !== undefined || updates.equipments_summary !== undefined) {
        const curOrder = orders.find(o => o.id === orderId);
        const baseCl = dbUpdates.checklist || curOrder?.checklist || {};
        dbUpdates.checklist = { 
          ...baseCl, 
          equipment_ids: updates.equipment_ids !== undefined ? updates.equipment_ids : curOrder?.equipment_ids,
          equipments_summary: updates.equipments_summary !== undefined ? updates.equipments_summary : curOrder?.equipments_summary
        };
      }
      if (updates.apply_tax !== undefined) dbUpdates.apply_tax = updates.apply_tax;
      if (updates.payment_reference !== undefined) dbUpdates.payment_reference = updates.payment_reference;
      if (updates.payment_proof_url !== undefined) dbUpdates.payment_proof_url = updates.payment_proof_url;
      if (updates.paid_amount !== undefined) dbUpdates.paid_amount = updates.paid_amount;
      if (updates.payment_date !== undefined) dbUpdates.payment_date = updates.payment_date;
      if (updates.payment_notes !== undefined) dbUpdates.payment_notes = updates.payment_notes;

      await supabaseAir
        .from('orders')
        .update(dbUpdates)
        .eq('id', orderId);
    } catch (e) {
      console.warn('[useAirStore] Failed to update order in DB:', e);
    }
  }, []);

  const updateChecklist = useCallback(async (orderId: string, checklist: HVACInspectionChecklist) => {
    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, checklist } : ord));
    toast.success('Inspección HVAC guardada');

    try {
      await supabaseAir
        .from('orders')
        .update({ checklist, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (e) {
      console.warn('[useAirStore] Failed to update checklist in DB:', e);
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    toast.success('Orden eliminada');

    try {
      await supabaseAir
        .from('orders')
        .delete()
        .eq('id', orderId);
    } catch (e) {
      console.warn('[useAirStore] Failed to delete order in DB:', e);
    }
  }, []);

  const addOrder = useCallback(async (orderData: Partial<ServiceOrder>): Promise<ServiceOrder> => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const ticketNumber = `AIR-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;
    const newId = crypto.randomUUID();

    const tech = technicians.find(t => t.id === orderData.assigned_technician_id);
    const asst = technicians.find(t => t.id === orderData.assigned_assistant_id);

    // Dynamic tax calculation using settings.tax_rate
    const taxRate = settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19;
    
    let subtotal = orderData.subtotal;
    let total = orderData.total;
    let tax = orderData.tax;

    if (total !== undefined && subtotal === undefined) {
      subtotal = Math.round(total / (1 + taxRate));
      tax = total - subtotal;
    } else if (subtotal !== undefined && total === undefined) {
      tax = Math.round(subtotal * taxRate);
      total = subtotal + tax;
    } else if (total === undefined && subtotal === undefined) {
      total = 45000;
      subtotal = Math.round(total / (1 + taxRate));
      tax = total - subtotal;
    }

    // Default payout if not specified in orderData
    let techPayoutType = orderData.technician_payout_type;
    let techPayoutVal = orderData.technician_payout_value;
    if (tech && (techPayoutVal === undefined || techPayoutVal === 0)) {
      const sType = orderData.service_type || 'mantencion_preventiva';
      if (sType.startsWith('mantencion') || sType.startsWith('mantenimiento')) {
        techPayoutType = tech.commission_mantencion_type || tech.default_commission_type || 'fixed';
        techPayoutVal = tech.commission_mantencion_value ?? tech.default_commission_value ?? 20000;
      } else if (sType.startsWith('instalacion')) {
        techPayoutType = tech.commission_instalacion_type || tech.default_commission_type || 'fixed';
        techPayoutVal = tech.commission_instalacion_value ?? tech.default_commission_value ?? 35000;
      } else if (sType.startsWith('reparacion')) {
        techPayoutType = tech.commission_reparacion_type || tech.default_commission_type || 'fixed';
        techPayoutVal = tech.commission_reparacion_value ?? tech.default_commission_value ?? 15000;
      } else {
        techPayoutType = tech.default_commission_type || 'fixed';
        techPayoutVal = tech.default_commission_value ?? 20000;
      }
    }

    const newOrder: ServiceOrder = {
      id: newId,
      ticket_number: ticketNumber,
      customer_id: orderData.customer_id || '',
      customer: customers.find(c => c.id === orderData.customer_id),
      equipment_id: orderData.equipment_id,
      equipment: equipments.find(e => e.id === orderData.equipment_id),
      assigned_technician_id: orderData.assigned_technician_id,
      assigned_technician: tech,
      assigned_assistant_id: orderData.assigned_assistant_id,
      assigned_assistant: asst,
      technician_payout_type: techPayoutType || 'fixed',
      technician_payout_value: techPayoutVal || 0,
      assistant_payout_type: orderData.assistant_payout_type || 'fixed',
      assistant_payout_value: orderData.assistant_payout_value || 0,
      service_type: orderData.service_type || 'mantencion_preventiva',
      status: orderData.status || 'ingresado',
      scheduled_date: orderData.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
      scheduled_time_slot: orderData.scheduled_time_slot || '09:00 - 11:00',
      description: orderData.description || 'Servicio HVAC',
      checklist: orderData.checklist || {
        clean_filters: false,
        clean_evaporator_coil: false,
        clean_turbine_fan: false,
        sanitize_bactericide: false,
        clean_condenser_coil: false,
        check_electrical_connections: false,
        check_condensate_drain: false
      },
      items: orderData.items || [],
      subtotal: subtotal ?? 0,
      tax: tax ?? 0,
      total: total ?? 0,
      apply_tax: (orderData as any).apply_tax ?? true,
      tax_mode: (orderData as any).tax_mode || 'included',
      is_recurring_confirmed: orderData.is_recurring_confirmed || false,
      recurring_frequency_months: orderData.recurring_frequency_months,
      recurring_schedule_id: orderData.recurring_schedule_id,
      calendar_color: orderData.calendar_color,
      payment_status: orderData.payment_status || 'pendiente',
      payment_method: orderData.payment_method || 'efectivo',
      technician_location: orderData.technician_location,
      created_at: format(new Date(), 'yyyy-MM-dd HH:mm'),
      completed_at: orderData.status === 'completado' ? format(new Date(), 'yyyy-MM-dd HH:mm') : undefined
    };

    // NK-053: Si el cliente solicitó mantenimiento periódico acordado y no tiene schedule asociado, registrarlo
    if (orderData.is_recurring_confirmed && !orderData.recurring_schedule_id && orderData.customer_id) {
      const cust = customers.find(c => c.id === orderData.customer_id);
      const eq = equipments.find(e => e.id === orderData.equipment_id);
      const freq = orderData.recurring_frequency_months || 6;
      const startDate = orderData.scheduled_date || format(new Date(), 'yyyy-MM-dd');
      let nextDate = startDate;
      try {
        nextDate = format(addDays(parseISO(startDate), freq * 30), 'yyyy-MM-dd');
      } catch {
        nextDate = format(addDays(new Date(), freq * 30), 'yyyy-MM-dd');
      }

      const newRecSchedule: RecurringMaintenanceSchedule = {
        id: crypto.randomUUID(),
        company_id: activeId,
        customer_id: orderData.customer_id,
        customer_name: cust?.name || 'Cliente',
        customer_phone: cust?.phone || '',
        customer_address: cust?.address || '',
        customer_commune: cust?.commune,
        equipment_ids: orderData.equipment_id ? [orderData.equipment_id] : [],
        equipments_summary: eq ? `${eq.brand} ${eq.btu} BTU (${eq.location_in_property})` : 'Equipos de climatización',
        frequency_months: freq,
        start_date: startDate,
        next_suggested_date: nextDate,
        preferred_time_slot: orderData.scheduled_time_slot,
        preferred_technician_id: orderData.assigned_technician_id,
        notes: `Acordado en orden ${ticketNumber}`,
        status: 'programado',
        created_at: new Date().toISOString()
      };
      setRecurringSchedules(prev => [newRecSchedule, ...prev]);
    }

    setOrders(prev => [newOrder, ...prev]);
    toast.success(`Orden ${ticketNumber} creada`);

    try {
      const { error } = await supabaseAir.from('orders').insert([{
        id: newId,
        company_id: activeId,
        ticket_number: ticketNumber,
        customer_id: orderData.customer_id,
        equipment_id: orderData.equipment_id || null,
        assigned_technician_id: orderData.assigned_technician_id || null,
        assigned_assistant_id: orderData.assigned_assistant_id || null,
        technician_payout_type: newOrder.technician_payout_type,
        technician_payout_value: newOrder.technician_payout_value,
        assistant_payout_type: newOrder.assistant_payout_type,
        assistant_payout_value: newOrder.assistant_payout_value,
        service_type: newOrder.service_type,
        status: newOrder.status,
        priority: 'normal',
        scheduled_date: newOrder.scheduled_date,
        scheduled_time_slot: newOrder.scheduled_time_slot,
        description: newOrder.description,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        tax: newOrder.tax,
        total: newOrder.total,
        payment_status: newOrder.payment_status,
        payment_method: newOrder.payment_method,
        checklist: {
          ...(newOrder.checklist || {}),
          calendar_color: orderData.calendar_color || undefined,
          equipment_ids: (orderData as any).equipment_ids || undefined,
          equipments_summary: (orderData as any).equipments_summary || undefined,
        },
        completed_at: newOrder.completed_at ? new Date().toISOString() : null,
        apply_tax: (orderData as any).apply_tax ?? true,
        payment_reference: (orderData as any).payment_reference || null,
        payment_proof_url: (orderData as any).payment_proof_url || null,
        paid_amount: (orderData as any).paid_amount || null,
        payment_date: (orderData as any).payment_date || null,
        payment_notes: (orderData as any).payment_notes || null,
        invoice_number: (orderData as any).invoice_number || null,
        folio: (orderData as any).folio || null
      }]);
      if (error) {
        console.error('[useAirStore] Failed to insert order into DB:', error);
        toast.error(`Error al registrar orden en la nube: ${error.message}`);
      }
    } catch (e: any) {
      console.warn('[useAirStore] Failed to insert order into DB:', e);
      toast.error(`Error de conexión al guardar orden: ${e?.message || e}`);
    }

    return newOrder;
  }, [orders.length, companyId, customers, equipments, technicians, settings]);

  // Acciones de Recaptación
  const markReminderContacted = useCallback((equipmentId: string) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
    setContactedReminderIds(prev => ({
      ...prev,
      [equipmentId]: timestamp
    }));
    toast.success('Cliente marcado como contactado');
  }, []);

  const scheduleReminderService = useCallback((reminder: RecaptacionReminder) => {
    const taxRate = settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19;
    const basePrice = settings.standard_maintenance_price;
    const taxAmount = Math.round(basePrice * taxRate);
    const totalPrice = basePrice + taxAmount;

    const newOrder = addOrder({
      customer_id: reminder.customer_id,
      equipment_id: reminder.equipment_id,
      service_type: 'mantencion_preventiva',
      status: 'ingresado',
      description: `Mantenimiento preventivo periódico recaptado (${settings.maintenance_interval_months || 6} meses). Equipo ${reminder.equipment_brand} ${reminder.equipment_btu} BTU en ${reminder.equipment_location}.`,
      scheduled_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      scheduled_time_slot: '10:00 - 12:00',
      items: [
        {
          id: `it-${Date.now()}`,
          description: `Mantenimiento Preventivo ${reminder.equipment_brand} ${reminder.equipment_btu} BTU`,
          quantity: 1,
          unit_price: basePrice,
          total: basePrice,
          type: 'servicio',
        }
      ],
      subtotal: basePrice,
      tax: taxAmount,
      total: totalPrice,
    });

    markReminderContacted(reminder.equipment_id);
    return newOrder;
  }, [addOrder, markReminderContacted, settings.standard_maintenance_price, settings.tax_rate, settings.maintenance_interval_months]);

  const generateWhatsAppUrl = useCallback((reminder: RecaptacionReminder) => {
    let text = settings.whatsapp_template_recaptacion;
    text = text.replace('{cliente}', reminder.customer_name);
    text = text.replace('{marca}', reminder.equipment_brand);
    text = text.replace('{btu}', String(reminder.equipment_btu));
    text = text.replace('{ubicacion}', reminder.equipment_location);
    text = text.replace('{link}', `${window.location.origin}/?rut=${reminder.customer_id}`);

    const cleanPhone = reminder.customer_phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [settings.whatsapp_template_recaptacion]);

  // NK-053 & NK-081: Métodos de Mantenimientos Periódicos Acordados con el Cliente (Cloud sync)
  const addRecurringSchedule = useCallback(async (data: Omit<RecurringMaintenanceSchedule, 'id' | 'created_at'>): Promise<RecurringMaintenanceSchedule> => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();
    const newSchedule: RecurringMaintenanceSchedule = {
      ...data,
      id: newId,
      company_id: activeId,
      created_at: new Date().toISOString(),
      status: data.status || 'programado'
    };

    setRecurringSchedules(prev => [newSchedule, ...prev]);

    try {
      const { error } = await supabaseAir.from('recurring_schedules').insert([{
        id: newSchedule.id,
        company_id: newSchedule.company_id,
        customer_id: newSchedule.customer_id,
        customer_name: newSchedule.customer_name,
        customer_phone: newSchedule.customer_phone,
        customer_address: newSchedule.customer_address,
        customer_commune: newSchedule.customer_commune,
        equipment_ids: newSchedule.equipment_ids,
        equipments_summary: newSchedule.equipments_summary,
        frequency_months: newSchedule.frequency_months,
        start_date: newSchedule.start_date,
        next_suggested_date: newSchedule.next_suggested_date,
        confirmed_date: newSchedule.confirmed_date,
        preferred_time_slot: newSchedule.preferred_time_slot,
        preferred_technician_id: newSchedule.preferred_technician_id,
        notes: newSchedule.notes,
        status: newSchedule.status,
        associated_order_id: newSchedule.associated_order_id,
        created_at: newSchedule.created_at,
        updated_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[useAirStore] Failed to insert recurring schedule to cloud:', error);
      }
    } catch (e) {
      console.warn('[useAirStore] Exception inserting recurring schedule to cloud:', e);
    }

    toast.success(`Plan periódico registrado para ${data.customer_name}`);
    return newSchedule;
  }, [companyId]);

  const updateRecurringSchedule = useCallback(async (id: string, updates: Partial<RecurringMaintenanceSchedule>) => {
    const updatedAt = new Date().toISOString();
    setRecurringSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: updatedAt } : s));

    try {
      const { error } = await supabaseAir.from('recurring_schedules')
        .update({
          ...updates,
          updated_at: updatedAt
        })
        .eq('id', id);
      if (error) {
        console.error('[useAirStore] Failed to update recurring schedule in cloud:', error);
      }
    } catch (e) {
      console.warn('[useAirStore] Exception updating recurring schedule in cloud:', e);
    }

    toast.success('Acuerdo periódico actualizado');
  }, []);

  const deleteRecurringSchedule = useCallback(async (id: string) => {
    setRecurringSchedules(prev => prev.filter(s => s.id !== id));

    try {
      const { error } = await supabaseAir.from('recurring_schedules')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('[useAirStore] Failed to delete recurring schedule from cloud:', error);
      }
    } catch (e) {
      console.warn('[useAirStore] Exception deleting recurring schedule from cloud:', e);
    }

    toast.success('Acuerdo periódico eliminado');
  }, []);

  const confirmAndScheduleRecurringOrder = useCallback(async (
    scheduleId: string,
    scheduledDate: string,
    scheduledSlot: string,
    technicianId?: string,
    customPrice?: number
  ): Promise<ServiceOrder | null> => {
    const schedule = recurringSchedules.find(s => s.id === scheduleId);
    if (!schedule) {
      toast.error('No se encontró el acuerdo periódico');
      return null;
    }

    const price = customPrice || settings.standard_maintenance_price || 45000;
    const taxRate = settings?.tax_rate !== undefined ? Number(settings.tax_rate) : 0.19;
    const isTaxApplied = settings?.default_apply_tax !== false;
    const taxMode = settings?.default_tax_mode || 'included';

    let subtotal = price;
    let tax = 0;
    let total = price;

    if (isTaxApplied) {
      if (taxMode === 'plus') {
        tax = Math.round(price * taxRate);
        total = price + tax;
      } else {
        total = price;
        subtotal = Math.round(total / (1 + taxRate));
        tax = total - subtotal;
      }
    }

    // Crear la orden de servicio en el calendario
    const newOrder = await addOrder({
      customer_id: schedule.customer_id,
      equipment_id: schedule.equipment_ids[0] || undefined,
      service_type: 'mantencion_preventiva',
      status: 'ingresado',
      scheduled_date: scheduledDate,
      scheduled_time_slot: scheduledSlot,
      assigned_technician_id: technicianId || schedule.preferred_technician_id,
      is_recurring_confirmed: true,
      recurring_frequency_months: schedule.frequency_months,
      recurring_schedule_id: schedule.id,
      description: `Mantenimiento periódico acordado (${schedule.equipments_summary}). Frecuencia cada ${schedule.frequency_months} meses. ${schedule.notes ? 'Nota: ' + schedule.notes : ''}`,
      items: [
        {
          id: `it-${Date.now()}`,
          description: `Mantenimiento periódico preventivo (${schedule.equipments_summary})`,
          quantity: 1,
          unit_price: total,
          total: total,
          type: 'servicio'
        }
      ],
      subtotal,
      tax,
      total,
      apply_tax: isTaxApplied,
      tax_mode: isTaxApplied ? taxMode : 'exempt',
      payment_status: 'pendiente'
    });

    // Actualizar el estado del acuerdo periódico local y en la nube
    const nowIso = new Date().toISOString();
    setRecurringSchedules(prev => prev.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          status: 'confirmado_agendado',
          confirmed_date: scheduledDate,
          associated_order_id: newOrder.id,
          updated_at: nowIso
        };
      }
      return s;
    }));

    try {
      const { error: updErr } = await supabaseAir.from('recurring_schedules')
        .update({
          status: 'confirmado_agendado',
          confirmed_date: scheduledDate,
          associated_order_id: newOrder.id,
          updated_at: nowIso
        })
        .eq('id', scheduleId);
      if (updErr) {
        console.error('[useAirStore] Error updating confirmed recurring schedule in cloud:', updErr);
      }
    } catch (e) {
      console.warn('[useAirStore] Exception updating confirmed recurring schedule:', e);
    }

    toast.success(`Visita confirmada y agendada para el ${scheduledDate}`);
    return newOrder;
  }, [recurringSchedules, settings, addOrder]);

  const generateWhatsAppRecurringUrl = useCallback((schedule: RecurringMaintenanceSchedule) => {
    let template = settings.whatsapp_template_recurring_confirmation || 
      'Hola {cliente}, le saludamos de {empresa}. Le recordamos que según lo acordado tenemos programado el mantenimiento periódico de sus equipos de aire acondicionado ({equipos}) para estas fechas. Nos comunicamos para coordinar con usted el día y bloque horario que le resulte más conveniente para la visita del técnico. ¿Le acomoda agendar esta semana?';

    const companyName = settings.fantasy_name || settings.company_name || 'Nexus Air';
    let text = template
      .replace(/{cliente}/g, schedule.customer_name)
      .replace(/{empresa}/g, companyName)
      .replace(/{equipos}/g, schedule.equipments_summary)
      .replace(/{fecha}/g, schedule.confirmed_date || schedule.next_suggested_date);

    const cleanPhone = schedule.customer_phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [settings.whatsapp_template_recurring_confirmation, settings.fantasy_name, settings.company_name]);

  // Acciones de Clientes
  const addCustomer = useCallback(async (custData: Omit<Customer, 'id' | 'created_at'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();
    const city = custData.city || (settings.country_code === 'CR' ? 'San José' : 'Santiago');
    const rutClean = (custData.rut && custData.rut.trim()) || 'S/RUT';
    const phoneClean = (custData.phone && custData.phone.trim()) || '+506 0000 0000';
    const addressClean = (custData.address && custData.address.trim()) || 'Dirección no especificada';
    const communeClean = (custData.commune && custData.commune.trim()) || (settings.country_code === 'CR' ? 'Central' : 'Santiago');

    const newCust: Customer = {
      ...custData,
      id: newId,
      name: custData.name.trim(),
      rut: rutClean,
      phone: phoneClean,
      email: custData.email ? custData.email.trim() : '',
      address: addressClean,
      commune: communeClean,
      city,
      customer_type: custData.customer_type || 'residencial',
      created_at: format(new Date(), 'yyyy-MM-dd'),
      equipments: []
    };
    setCustomers(prev => [...prev, newCust]);
    toast.success(`Cliente ${newCust.name} registrado`);

    try {
      const { error } = await supabaseAir.from('customers').insert([{
        id: newId,
        company_id: activeId,
        name: custData.name.trim(),
        rut: rutClean,
        phone: phoneClean,
        email: custData.email && custData.email.trim() ? custData.email.trim() : null,
        address: addressClean,
        commune: communeClean,
        notes: custData.notes && custData.notes.trim() ? custData.notes.trim() : null
      }]);
      if (error) {
        console.error('[useAirStore] Error inserting customer into Supabase:', error);
        toast.error(`Error al guardar en base de datos: ${error.message}`);
      }
    } catch (e: any) {
      console.warn('[useAirStore] Error inserting customer:', e);
      toast.error(`Error de red al registrar cliente: ${e?.message || e}`);
    }
    return newCust;
  }, [companyId, settings.country_code]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast.success('Cliente actualizado');

    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.rut !== undefined) dbUpdates.rut = updates.rut.trim() || 'S/RUT';
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone.trim();
      if (updates.email !== undefined) dbUpdates.email = updates.email.trim() || null;
      if (updates.address !== undefined) dbUpdates.address = updates.address.trim();
      if (updates.commune !== undefined) dbUpdates.commune = updates.commune.trim();
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes.trim() || null;

      await supabaseAir
        .from('customers')
        .update(dbUpdates)
        .eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error updating customer:', e);
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setEquipments(prev => prev.filter(e => e.customer_id !== id));
    setOrders(prev => prev.filter(o => o.customer_id !== id));
    toast.success('Cliente eliminado exitosamente');

    try {
      // 1. Eliminar órdenes del cliente para evitar violación de FK ON DELETE RESTRICT
      await supabaseAir.from('orders').delete().eq('customer_id', id);
      // 2. Eliminar equipos asociados al cliente
      await supabaseAir.from('equipments').delete().eq('customer_id', id);
      // 3. Eliminar el registro del cliente
      const { error } = await supabaseAir.from('customers').delete().eq('id', id);
      if (error) {
        console.error('[useAirStore] Error deleting customer from Supabase:', error);
        toast.error(`Error al eliminar en la nube: ${error.message}`);
      }
    } catch (e: any) {
      console.warn('[useAirStore] Error deleting customer:', e);
      toast.error(`Error al eliminar cliente: ${e?.message || e}`);
    }
  }, []);

  // Acciones de Equipos
  const addEquipment = useCallback(async (eqData: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();

    // Cálculo seguro de fecha sin tirar RangeError
    let nextDate = format(addDays(new Date(), (settings.maintenance_interval_months || 6) * 30), 'yyyy-MM-dd');
    try {
      const rawDate = (eqData.last_maintenance_date && eqData.last_maintenance_date.trim()) || 
                      (eqData.installation_date && eqData.installation_date.trim());
      if (rawDate) {
        const parsed = parseISO(rawDate);
        if (!isNaN(parsed.getTime())) {
          const intervalDays = (settings.maintenance_interval_months || 6) * 30;
          nextDate = format(addDays(parsed, intervalDays), 'yyyy-MM-dd');
        }
      }
    } catch {}

    const brandClean = (eqData.brand && eqData.brand.trim()) || 'Anwo';
    const modelClean = (eqData.model && eqData.model.trim()) || 'Split Inverter';
    const locationClean = (eqData.location_in_property && eqData.location_in_property.trim()) || 'Ubicación Principal';
    const btuClean = Number(eqData.btu) || 12000;
    const installDate = (eqData.installation_date && eqData.installation_date.trim()) || null;
    const lastMaintDate = (eqData.last_maintenance_date && eqData.last_maintenance_date.trim()) || null;

    const newEq: AirEquipment = {
      ...eqData,
      id: newId,
      brand: brandClean,
      model: modelClean,
      location_in_property: locationClean,
      btu: btuClean,
      installation_date: installDate || undefined,
      last_maintenance_date: lastMaintDate || undefined,
      next_maintenance_date: nextDate,
    };

    setEquipments(prev => [...prev, newEq]);
    setCustomers(prev => prev.map(c => {
      if (c.id === eqData.customer_id) {
        return {
          ...c,
          equipments: [...(c.equipments || []).filter(e => e.id !== newId), newEq]
        };
      }
      return c;
    }));
    toast.success(`Equipo ${newEq.brand} ${newEq.btu} BTU registrado`);

    try {
      const { error } = await supabaseAir.from('equipments').insert([{
        id: newId,
        company_id: activeId,
        customer_id: eqData.customer_id,
        brand: brandClean,
        model: modelClean,
        type: eqData.type || 'split_muro',
        btu: btuClean,
        technology: eqData.technology || 'inverter',
        refrigerant: eqData.refrigerant || 'R410A',
        serial_number: eqData.serial_number && eqData.serial_number.trim() ? eqData.serial_number.trim() : null,
        serial_number_evaporator: eqData.serial_number_evaporator && eqData.serial_number_evaporator.trim() ? eqData.serial_number_evaporator.trim() : null,
        serial_number_condenser: eqData.serial_number_condenser && eqData.serial_number_condenser.trim() ? eqData.serial_number_condenser.trim() : null,
        location_in_property: locationClean,
        installation_date: installDate,
        last_maintenance_date: lastMaintDate,
        next_maintenance_date: nextDate,
        status: eqData.status || 'operativo',
        notes: eqData.notes && eqData.notes.trim() ? eqData.notes.trim() : null,
      }]);
      if (error) {
        console.error('[useAirStore] Error inserting equipment:', error);
        toast.error(`Error al registrar equipo en la nube: ${error.message}`);
      }
    } catch (e: any) {
      console.warn('[useAirStore] Error inserting equipment:', e);
      toast.error(`Error de conexión al guardar equipo: ${e?.message || e}`);
    }
    return newEq;
  }, [companyId, settings.maintenance_interval_months]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<AirEquipment>) => {
    const intervalDays = (settings.maintenance_interval_months || 6) * 30;
    setEquipments(prev => prev.map(eq => {
      if (eq.id !== id) return eq;
      const updated = { ...eq, ...updates };
      if (updates.last_maintenance_date) {
        updated.next_maintenance_date = format(addDays(parseISO(updates.last_maintenance_date), intervalDays), 'yyyy-MM-dd');
      }
      return updated;
    }));
    setCustomers(prev => prev.map(c => ({
      ...c,
      equipments: (c.equipments || []).map(eq => {
        if (eq.id !== id) return eq;
        const updated = { ...eq, ...updates };
        if (updates.last_maintenance_date) {
          updated.next_maintenance_date = format(addDays(parseISO(updates.last_maintenance_date), intervalDays), 'yyyy-MM-dd');
        }
        return updated;
      })
    })));
    toast.success('Equipo actualizado');

    try {
      const eqDbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.brand !== undefined) eqDbUpdates.brand = updates.brand;
      if (updates.model !== undefined) eqDbUpdates.model = updates.model;
      if (updates.type !== undefined) eqDbUpdates.type = updates.type;
      if (updates.btu !== undefined) eqDbUpdates.btu = updates.btu;
      if (updates.technology !== undefined) eqDbUpdates.technology = updates.technology;
      if (updates.refrigerant !== undefined) eqDbUpdates.refrigerant = updates.refrigerant;
      if (updates.serial_number !== undefined) eqDbUpdates.serial_number = updates.serial_number;
      if (updates.serial_number_evaporator !== undefined) eqDbUpdates.serial_number_evaporator = updates.serial_number_evaporator;
      if (updates.serial_number_condenser !== undefined) eqDbUpdates.serial_number_condenser = updates.serial_number_condenser;
      if (updates.location_in_property !== undefined) eqDbUpdates.location_in_property = updates.location_in_property;
      if (updates.notes !== undefined) eqDbUpdates.notes = updates.notes;
      if (updates.installation_date !== undefined) eqDbUpdates.installation_date = updates.installation_date;
      if (updates.last_maintenance_date !== undefined) {
        eqDbUpdates.last_maintenance_date = updates.last_maintenance_date;
        eqDbUpdates.next_maintenance_date = format(addDays(parseISO(updates.last_maintenance_date), intervalDays), 'yyyy-MM-dd');
      }

      const { error } = await supabaseAir
        .from('equipments')
        .update(eqDbUpdates)
        .eq('id', id);
      if (error) {
        console.error('[useAirStore] Error updating equipment:', error);
        toast.error(`Error al actualizar equipo: ${error.message}`);
      }
    } catch (e: any) {
      console.warn('[useAirStore] Error updating equipment:', e);
      toast.error(`Error de conexión al actualizar equipo: ${e?.message || e}`);
    }
  }, [settings.maintenance_interval_months]);

  const deleteEquipment = useCallback(async (id: string) => {
    setEquipments(prev => prev.filter(eq => eq.id !== id));
    setCustomers(prev => prev.map(c => ({
      ...c,
      equipments: (c.equipments || []).filter(eq => eq.id !== id)
    })));
    toast.success('Equipo eliminado');

    try {
      const { error } = await supabaseAir.from('equipments').delete().eq('id', id);
      if (error) {
        console.error('[useAirStore] Error deleting equipment:', error);
        toast.error(`Error al eliminar equipo: ${error.message}`);
      }
    } catch (e: any) {
      console.warn('[useAirStore] Error deleting equipment:', e);
      toast.error(`Error de conexión al eliminar equipo: ${e?.message || e}`);
    }
  }, []);

  // Acciones de Técnicos
  const addTechnician = useCallback(async (techData: Omit<Technician, 'id'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();
    const newTech: Technician = {
      ...techData,
      id: newId,
      status: techData.status || 'disponible',
      role: techData.role || 'tecnico',
      custom_role_title: techData.custom_role_title,
      salary_mode: techData.salary_mode || ((techData.role === 'ayudante' || techData.role === 'administracion') ? 'fixed' : 'commission'),
      base_salary: techData.base_salary !== undefined ? Number(techData.base_salary) : (techData.role === 'ayudante' ? 600000 : (techData.role === 'administracion' ? 750000 : 0)),
      working_days_default: techData.working_days_default || 30,
      default_commission_type: techData.default_commission_type || 'fixed',
      default_commission_value: techData.default_commission_value !== undefined ? Number(techData.default_commission_value) : 20000,
      commission_mantencion_type: techData.commission_mantencion_type || 'fixed',
      commission_mantencion_value: techData.commission_mantencion_value !== undefined ? Number(techData.commission_mantencion_value) : 20000,
      commission_instalacion_type: techData.commission_instalacion_type || 'fixed',
      commission_instalacion_value: techData.commission_instalacion_value !== undefined ? Number(techData.commission_instalacion_value) : 35000,
      commission_reparacion_type: techData.commission_reparacion_type || 'fixed',
      commission_reparacion_value: techData.commission_reparacion_value !== undefined ? Number(techData.commission_reparacion_value) : 15000,
      active_orders_count: 0,
    };
    setTechnicians(prev => {
      const updated = [...prev, newTech];
      try {
        localStorage.setItem(`nexus_air_technicians_${activeId}`, JSON.stringify(updated));
        localStorage.setItem('nexus_air_technicians', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success(`Colaborador ${newTech.name} registrado`);

    try {
      await supabaseAir.from('technicians').insert([{
        id: newId,
        company_id: activeId,
        name: techData.name,
        email: techData.email,
        phone: techData.phone,
        rut: techData.rut,
        role: newTech.role,
        sec_certified: techData.sec_certified ?? (newTech.role === 'tecnico'),
        active: true,
        default_commission_type: newTech.default_commission_type,
        default_commission_value: newTech.default_commission_value,
        commission_mantencion_type: newTech.commission_mantencion_type,
        commission_mantencion_value: newTech.commission_mantencion_value,
        commission_instalacion_type: newTech.commission_instalacion_type,
        commission_instalacion_value: newTech.commission_instalacion_value,
        commission_reparacion_type: newTech.commission_reparacion_type,
        commission_reparacion_value: newTech.commission_reparacion_value,
      }]);
    } catch (e) {
      console.warn('[useAirStore] Error inserting technician:', e);
    }
    return newTech;
  }, [companyId]);

  const updateTechnician = useCallback(async (id: string, updates: Partial<Technician>) => {
    setTechnicians(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      try {
        localStorage.setItem(`nexus_air_technicians_${companyId}`, JSON.stringify(updated));
        localStorage.setItem('nexus_air_technicians', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success('Colaborador actualizado');

    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.rut !== undefined) dbUpdates.rut = updates.rut;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.sec_certified !== undefined) dbUpdates.sec_certified = updates.sec_certified;
      if (updates.status !== undefined) dbUpdates.active = updates.status === 'disponible';
      if (updates.default_commission_type !== undefined) dbUpdates.default_commission_type = updates.default_commission_type;
      if (updates.default_commission_value !== undefined) dbUpdates.default_commission_value = updates.default_commission_value;
      if (updates.commission_mantencion_type !== undefined) dbUpdates.commission_mantencion_type = updates.commission_mantencion_type;
      if (updates.commission_mantencion_value !== undefined) dbUpdates.commission_mantencion_value = updates.commission_mantencion_value;
      if (updates.commission_instalacion_type !== undefined) dbUpdates.commission_instalacion_type = updates.commission_instalacion_type;
      if (updates.commission_instalacion_value !== undefined) dbUpdates.commission_instalacion_value = updates.commission_instalacion_value;
      if (updates.commission_reparacion_type !== undefined) dbUpdates.commission_reparacion_type = updates.commission_reparacion_type;
      if (updates.commission_reparacion_value !== undefined) dbUpdates.commission_reparacion_value = updates.commission_reparacion_value;

      await supabaseAir
        .from('technicians')
        .update(dbUpdates)
        .eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error updating technician:', e);
    }
  }, [companyId]);

  const deleteTechnician = useCallback(async (id: string) => {
    setTechnicians(prev => {
      const updated = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem(`nexus_air_technicians_${companyId}`, JSON.stringify(updated));
        localStorage.setItem('nexus_air_technicians', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success('Técnico eliminado');

    try {
      await supabaseAir.from('technicians').delete().eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error deleting technician:', e);
    }
  }, [companyId]);

  // Acciones de Inventario
  const addPart = useCallback(async (partData: Omit<AirPart, 'id'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();
    const newPart: AirPart = {
      ...partData,
      id: newId,
    };
    setParts(prev => [...prev, newPart]);
    toast.success(`Producto ${newPart.name} agregado`);

    try {
      await supabaseAir.from('inventory').insert([{
        id: newId,
        company_id: activeId,
        code: partData.sku,
        name: partData.name,
        category: partData.category,
        stock: partData.stock,
        min_stock: partData.min_stock,
        price: partData.sale_price,
        cost: partData.cost_price,
        unit: partData.unit
      }]);
    } catch (e) {
      console.warn('[useAirStore] Error inserting inventory item:', e);
    }
    return newPart;
  }, [companyId]);

  const updatePart = useCallback(async (id: string, updates: Partial<AirPart>) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    toast.success('Producto actualizado');

    try {
      await supabaseAir
        .from('inventory')
        .update({
          name: updates.name,
          category: updates.category,
          stock: updates.stock,
          price: updates.sale_price,
          cost: updates.cost_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error updating inventory item:', e);
    }
  }, []);

  const deletePart = useCallback(async (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
    toast.success('Producto eliminado');

    try {
      await supabaseAir.from('inventory').delete().eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error deleting inventory item:', e);
    }
  }, []);

  // Configuración de la Empresa (NK-038: Persistencia atómica por empresa)
  const updateSettings = useCallback(async (updates: Partial<AirSettings>): Promise<AirSettings> => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    let nextSettings: AirSettings = settings;

    setSettings(prev => {
      const next = { ...prev, ...updates, company_id: activeId };
      nextSettings = next;
      try {
        localStorage.setItem(`nexus_air_settings_${activeId}`, JSON.stringify(next));
      } catch (e) {
        console.warn('Error saving settings to localStorage:', e);
      }
      return next;
    });

    try {
      if (activeId === DEMO_SANDBOX_COMPANY_ID) {
        toast.success('Configuración de Nexus Air actualizada (Modo Demo)');
        return nextSettings;
      }

      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.company_name !== undefined) dbUpdates.company_name = updates.company_name;
      if (updates.company_slug !== undefined) dbUpdates.company_slug = updates.company_slug;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.country_code !== undefined) dbUpdates.country_code = updates.country_code;
      if (updates.currency_symbol !== undefined) dbUpdates.currency_symbol = updates.currency_symbol;
      if (updates.currency_code !== undefined) dbUpdates.currency_code = updates.currency_code;
      if (updates.tax_id_label !== undefined) dbUpdates.tax_id_label = updates.tax_id_label;
      if (updates.tax_rate !== undefined) dbUpdates.tax_rate = Number(updates.tax_rate);
      if (updates.tax_name !== undefined) dbUpdates.tax_name = updates.tax_name;
      if (updates.division_label !== undefined) dbUpdates.division_label = updates.division_label;
      if (updates.landing_config !== undefined) dbUpdates.landing_config = updates.landing_config;
      if (updates.logo_url !== undefined) dbUpdates.logo_url = updates.logo_url;
      if (updates.company_slogan !== undefined) dbUpdates.company_slogan = updates.company_slogan;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.default_apply_tax !== undefined) dbUpdates.default_apply_tax = updates.default_apply_tax;
      if (updates.maintenance_interval_months !== undefined) dbUpdates.maintenance_interval_months = Number(updates.maintenance_interval_months);
      if (updates.quality_control_days !== undefined) dbUpdates.quality_control_days = Number(updates.quality_control_days);
      if (updates.inactive_recovery_months !== undefined) dbUpdates.inactive_recovery_months = Number(updates.inactive_recovery_months);
      if (updates.pre_expiration_warning_days !== undefined) dbUpdates.pre_expiration_warning_days = Number(updates.pre_expiration_warning_days);
      if (updates.bank_name !== undefined) dbUpdates.bank_name = updates.bank_name;
      if (updates.bank_account_type !== undefined) dbUpdates.bank_account_type = updates.bank_account_type;
      if (updates.bank_account_number !== undefined) dbUpdates.bank_account_number = updates.bank_account_number;
      if (updates.bank_account_rut !== undefined) dbUpdates.bank_account_rut = updates.bank_account_rut;
      if (updates.bank_account_email !== undefined) dbUpdates.bank_account_email = updates.bank_account_email;
      if (updates.whatsapp_template_cobro !== undefined) dbUpdates.whatsapp_template_cobro = updates.whatsapp_template_cobro;

      // NK-067: Empaquetar configuraciones extendidas y matriz de permisos por rol en el campo jsonb nativo finance_settings
      const currentFin = settings.finance_settings || {};
      const updatesFin = updates.finance_settings || {};
      dbUpdates.finance_settings = {
        ...currentFin,
        ...updatesFin,
        ...(updates.service_type_colors !== undefined ? { service_type_colors: updates.service_type_colors } : {}),
        ...(updates.role_permissions !== undefined ? { role_permissions: updates.role_permissions } : (currentFin.role_permissions ? { role_permissions: currentFin.role_permissions } : {})),
        ...(updates.admin_pin !== undefined ? { admin_pin: updates.admin_pin } : (currentFin.admin_pin ? { admin_pin: currentFin.admin_pin } : {})),
        ...(updates.default_tax_mode !== undefined ? { default_tax_mode: updates.default_tax_mode } : (currentFin.default_tax_mode ? { default_tax_mode: currentFin.default_tax_mode } : {})),
        ...(updates.standard_maintenance_price !== undefined ? { standard_maintenance_price: Number(updates.standard_maintenance_price) } : (currentFin.standard_maintenance_price !== undefined ? { standard_maintenance_price: currentFin.standard_maintenance_price } : {})),
        ...(updates.standard_installation_price !== undefined ? { standard_installation_price: Number(updates.standard_installation_price) } : (currentFin.standard_installation_price !== undefined ? { standard_installation_price: currentFin.standard_installation_price } : {})),
      };

      // 1. Intentar actualizar directamente la fila existente en air.settings
      const { data: updatedRows, error: updateErr } = await supabaseAir
        .from('settings')
        .update(dbUpdates)
        .eq('company_id', activeId)
        .select();

      // 2. Si no había registro previo para esta empresa, ejecutar upsert seguro
      if (updateErr || !updatedRows || updatedRows.length === 0) {
        let compName = dbUpdates.company_name || settings.company_name || settings.fantasy_name;
        let compSlug = dbUpdates.company_slug || settings.company_slug;

        if (!compName || !compSlug) {
          try {
            const { data: comp } = await supabase.from('companies').select('name, slug').eq('id', activeId).maybeSingle();
            if (comp) {
              if (!compName) compName = comp.name;
              if (!compSlug) compSlug = comp.slug;
            }
          } catch {}
        }

        if (!compName) compName = 'Empresa Climatización';
        if (!compSlug) compSlug = activeId.substring(0, 8);

        const upsertPayload = {
          company_id: activeId,
          company_name: compName,
          company_slug: compSlug,
          ...dbUpdates,
        };

        const { error: upsertErr } = await supabaseAir
          .from('settings')
          .upsert(upsertPayload, { onConflict: 'company_id' });

        if (upsertErr) {
          console.error('[useAirStore] Error in settings upsert:', upsertErr);
          throw upsertErr;
        }
      }

      toast.success('Configuración y plazos guardados en la nube');
      return nextSettings;
    } catch (e: any) {
      console.error('[useAirStore] Error updating settings in Supabase:', e);
      toast.error('Error al sincronizar con la nube: ' + (e?.message || 'Error de conexión'));
      throw e;
    }
  }, [companyId, settings]);

  // Liquidación de Honorarios a Técnicos y Nómina (NK-043 & NK-062)
  const addTechnicianPayout = useCallback(async (payoutData: Omit<TechnicianPayout, 'id' | 'company_id' | 'created_at'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();
    const payoutNumber = payoutData.payout_number || `LIQ-${format(new Date(), 'yyyyMM')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayout: TechnicianPayout = {
      ...payoutData,
      id: newId,
      company_id: activeId,
      payout_number: payoutNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTechnicianPayouts(prev => {
      // Si se está editando uno existente por id se actualiza, si no se agrega acumulativamente sin borrar pagos previos del mes (NK-065)
      const exists = prev.some(p => p.id === newPayout.id);
      const updated = exists 
        ? prev.map(p => p.id === newPayout.id ? newPayout : p)
        : [newPayout, ...prev];
      try {
        localStorage.setItem(`nexus_air_technician_payouts_${activeId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const isAdelanto = newPayout.payout_type === 'adelanto';
    toast.success(isAdelanto ? 'Adelanto / Préstamo registrado exitosamente' : 'Liquidación / Pago registrado exitosamente');

    try {
      // Guardar metadata extendida de nómina y comprobante en notes como JSON para compatibilidad total (NK-065)
      const notesPayload = JSON.stringify({
        user_notes: newPayout.notes || '',
        payout_type: newPayout.payout_type || 'liquidacion',
        payment_proof_url: newPayout.payment_proof_url || null,
        salary_mode: newPayout.salary_mode,
        base_salary: newPayout.base_salary,
        commission_amount: newPayout.commission_amount,
        bonus_amount: newPayout.bonus_amount,
        deduction_amount: newPayout.deduction_amount,
        working_days: newPayout.working_days
      });

      const { error } = await supabaseAir
        .from('technician_payouts')
        .insert({
          id: newId,
          company_id: activeId,
          payout_number: payoutNumber,
          technician_id: newPayout.technician_id,
          technician_name: newPayout.technician_name,
          technician_role: newPayout.technician_role,
          period_month: newPayout.period_month,
          amount: newPayout.amount,
          payment_date: newPayout.payment_date,
          payment_method: newPayout.payment_method,
          payment_reference: newPayout.payment_reference,
          notes: notesPayload,
          order_ids: newPayout.order_ids || []
        });

      if (error) {
        console.warn('[useAirStore] Error saving technician payout to Supabase:', error);
      }
    } catch (err) {
      console.warn('[useAirStore] Exception saving technician payout:', err);
    }

    return newPayout;
  }, [companyId]);

  const deleteTechnicianPayout = useCallback(async (id: string) => {
    setTechnicianPayouts(prev => prev.filter(p => p.id !== id));
    toast.success('Liquidación eliminada');

    try {
      const { error } = await supabaseAir
        .from('technician_payouts')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[useAirStore] Error deleting technician payout from Supabase:', error);
      }
    } catch (err) {
      console.warn('[useAirStore] Exception deleting technician payout:', err);
    }
  }, []);

  // Reset a valores de demostración o estado limpio
  const resetToDefaults = useCallback(() => {
    const isMock = companyId === DEMO_SANDBOX_COMPANY_ID;
    if (isMock) {
      setCustomers(INITIAL_CUSTOMERS);
      setEquipments(INITIAL_EQUIPMENTS);
      setTechnicians(INITIAL_TECHNICIANS);
      setParts(INITIAL_PARTS);
      setOrders(INITIAL_SERVICE_ORDERS);
      setTechnicianPayouts([]);
      setSettings({ ...INITIAL_SETTINGS, company_id: companyId });
      setContactedReminderIds({});
      try {
        localStorage.removeItem(`nexus_air_settings_${companyId}`);
        localStorage.removeItem('nexus_air_active_settings');
        localStorage.removeItem(`nexus_air_customers_${companyId}`);
        localStorage.removeItem('nexus_air_customers');
        localStorage.removeItem(`nexus_air_equipments_${companyId}`);
        localStorage.removeItem('nexus_air_equipments');
        localStorage.removeItem(`nexus_air_orders_${companyId}`);
        localStorage.removeItem('nexus_air_orders');
        localStorage.removeItem(`nexus_air_technicians_${companyId}`);
        localStorage.removeItem('nexus_air_technicians');
        localStorage.removeItem(`nexus_air_parts_${companyId}`);
        localStorage.removeItem(`nexus_air_technician_payouts_${companyId}`);
      } catch {}
      toast.success('Datos de demostración restaurados');
    } else {
      setCustomers([]);
      setEquipments([]);
      setTechnicians([]);
      setParts([]);
      setOrders([]);
      setTechnicianPayouts([]);
      setContactedReminderIds({});
      try {
        localStorage.removeItem(`nexus_air_customers_${companyId}`);
        localStorage.removeItem(`nexus_air_equipments_${companyId}`);
        localStorage.removeItem(`nexus_air_orders_${companyId}`);
        localStorage.removeItem(`nexus_air_technicians_${companyId}`);
        localStorage.removeItem(`nexus_air_parts_${companyId}`);
        localStorage.removeItem(`nexus_air_technician_payouts_${companyId}`);
      } catch {}
      toast.success('Caché local de empresa limpiada');
      fetchData();
    }
  }, [companyId, fetchData]);

  // Métodos de Finanzas & Punto de Equilibrio Sincronizados en Supabase (NK-048)
  const updateFixedCosts = useCallback(async (newCosts: Partial<FixedCosts>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    let nextFC: FixedCosts;
    setFixedCosts(prev => {
      nextFC = { ...prev, ...newCosts };
      try {
        localStorage.setItem(`nexus_air_fixed_costs_${activeId}`, JSON.stringify(nextFC));
      } catch {}
      return nextFC;
    });
    toast.success('Costos fijos actualizados');

    try {
      const { error } = await supabaseAir
        .from('fixed_costs')
        .upsert({
          company_id: activeId,
          rent: nextFC!.rent,
          salaries: nextFC!.salaries,
          services: nextFC!.services,
          software: nextFC!.software,
          marketing: nextFC!.marketing,
          transport: nextFC!.transport,
          other: nextFC!.other,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('[useAirStore] Error saving fixed costs to Supabase:', error);
      }
    } catch (err) {
      console.warn('[useAirStore] Exception saving fixed costs:', err);
    }
  }, [companyId]);

  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'created_at'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = 'exp-' + crypto.randomUUID().slice(0, 8);
    const nowStr = format(new Date(), 'yyyy-MM-dd HH:mm');
    const newExp: Expense = {
      ...data,
      id: newId,
      company_id: activeId,
      created_at: nowStr,
    };
    setExpenses(prev => {
      const updated = [newExp, ...prev];
      try {
        localStorage.setItem(`nexus_air_expenses_${activeId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success('Egreso operativo registrado con éxito');

    try {
      const { error } = await supabaseAir
        .from('expenses')
        .insert({
          id: newId,
          company_id: activeId,
          date: newExp.date,
          category: newExp.category,
          description: newExp.description,
          amount: newExp.amount,
          amount_usd: newExp.amount_usd || 0,
          currency: newExp.currency || 'CRC',
          payment_method: newExp.payment_method || 'transferencia',
          status: newExp.status || 'pagado',
          supplier: newExp.supplier || '',
          invoice_number: newExp.invoice_number || '',
          is_fixed: Boolean(newExp.is_fixed),
          notes: newExp.notes || ''
        });

      if (error) {
        console.warn('[useAirStore] Error saving expense to Supabase:', error);
      }
    } catch (err) {
      console.warn('[useAirStore] Exception saving expense:', err);
    }

    return newExp;
  }, [companyId]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    setExpenses(prev => {
      const updated = prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp);
      try {
        localStorage.setItem(`nexus_air_expenses_${activeId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success('Gasto actualizado');

    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.amount_usd !== undefined) payload.amount_usd = updates.amount_usd;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.payment_method !== undefined) payload.payment_method = updates.payment_method;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.supplier !== undefined) payload.supplier = updates.supplier;
      if (updates.invoice_number !== undefined) payload.invoice_number = updates.invoice_number;
      if (updates.is_fixed !== undefined) payload.is_fixed = updates.is_fixed;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { error } = await supabaseAir
        .from('expenses')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.warn('[useAirStore] Error updating expense in Supabase:', error);
      }
    } catch (err) {
      console.warn('[useAirStore] Exception updating expense:', err);
    }
  }, [companyId]);

  const deleteExpense = useCallback(async (id: string) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    setExpenses(prev => {
      const updated = prev.filter(exp => exp.id !== id);
      try {
        localStorage.setItem(`nexus_air_expenses_${activeId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success('Gasto eliminado');

    try {
      const { error } = await supabaseAir
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[useAirStore] Error deleting expense from Supabase:', error);
      }
    } catch (err) {
      console.warn('[useAirStore] Exception deleting expense:', err);
    }
  }, [companyId]);

  const updateFinanceSettings = useCallback(async (newSettings: Partial<FinanceSettings>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    let nextFS: FinanceSettings;
    setFinanceSettings(prev => {
      nextFS = { ...prev, ...newSettings };
      try {
        localStorage.setItem(`nexus_air_finance_settings_${activeId}`, JSON.stringify(nextFS));
      } catch {}
      return nextFS;
    });

    try {
      const { error } = await supabaseAir
        .from('settings')
        .update({
          finance_settings: nextFS!,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', activeId);

      if (error) {
        console.warn('[useAirStore] Error saving finance_settings to Supabase:', error);
      }
    } catch (err) {
      console.warn('[useAirStore] Exception updating finance settings:', err);
    }
  }, [companyId]);

  // Helper para consultar landing pública de empresa por slug
  const fetchPublicCompanyBySlug = useCallback(async (slug: string) => {
    try {
      const cleanSlug = slug.trim().toLowerCase();
      const { data, error } = await supabaseAir
        .from('settings')
        .select('*')
        .ilike('company_slug', cleanSlug)
        .maybeSingle();

      if (data) return data;

      // Fallback a public.companies si aún no existe en air.settings
      const { data: comp } = await supabase
        .from('companies')
        .select('*')
        .ilike('slug', cleanSlug)
        .maybeSingle();

      if (comp) {
        const isCR = comp.name?.toLowerCase().includes('venefrio') || (comp.phone && comp.phone.startsWith('+506'));
        const defaultRecord: any = {
          company_id: comp.id,
          company_name: comp.name,
          company_slug: comp.slug,
          fantasy_name: comp.name,
          phone: comp.phone || (isCR ? '+506 7202 8833' : ''),
          address: comp.address || (isCR ? 'San José, Costa Rica' : ''),
          country: isCR ? 'Costa Rica' : 'Chile',
          country_code: isCR ? 'CR' : 'CL',
          currency_symbol: isCR ? '₡' : '$',
          currency_code: isCR ? 'CRC' : 'CLP',
          tax_id_label: isCR ? 'Cédula Jurídica' : 'RUT',
          tax_rate: isCR ? 0.13 : 0.19,
          tax_name: 'IVA',
          division_label: isCR ? 'Cantón' : 'Comuna',
          landing_config: {}
        };

        try {
          await supabaseAir.from('settings').upsert(defaultRecord, { onConflict: 'company_id' });
        } catch {}

        const { data: fresh } = await supabaseAir
          .from('settings')
          .select('*')
          .eq('company_id', comp.id)
          .maybeSingle();

        return fresh || defaultRecord;
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  return {
    isLoaded,
    customers,
    equipments,
    technicians,
    parts,
    inventory: parts,
    orders: enrichedOrders,
    rawOrders: orders,
    technicianPayouts,
    reminders,
    recurringSchedules, // NK-053: Mantenimientos Periódicos Acordados
    settings,
    fixedCosts,
    expenses,
    financeSettings,
    updateFixedCosts,
    addExpense,
    updateExpense,
    deleteExpense,
    updateFinanceSettings,
    addOrder,
    updateOrder,
    updateOrderStatus,
    updateChecklist,
    deleteOrder,
    markReminderContacted,
    scheduleReminderService,
    generateWhatsAppUrl,
    addRecurringSchedule, // NK-053
    updateRecurringSchedule, // NK-053
    deleteRecurringSchedule, // NK-053
    confirmAndScheduleRecurringOrder, // NK-053
    generateWhatsAppRecurringUrl, // NK-053
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addTechnicianPayout,
    deleteTechnicianPayout,
    addPart,
    updatePart,
    deletePart,
    updateSettings,
    resetToDefaults,
    refreshData: fetchData,
    fetchPublicCompanyBySlug,
  };
}
