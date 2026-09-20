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
  HVACInspectionChecklist
} from '../types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_CUSTOMERS, 
  INITIAL_EQUIPMENTS, 
  INITIAL_TECHNICIANS, 
  INITIAL_PARTS, 
  INITIAL_SERVICE_ORDERS 
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

  const [settings, setSettings] = useState<AirSettings>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_settings_${companyId}`);
      if (saved) return JSON.parse(saved);
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

  const [isLoaded, setIsLoaded] = useState(false);
  const [contactedReminderIds, setContactedReminderIds] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`nexus_air_contacted_${companyId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

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
      const savedSettings = localStorage.getItem(`nexus_air_settings_${companyId}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
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
        // Leer configuración local para respetar la selección explícita del usuario
        let localSaved: Partial<AirSettings> | null = null;
        try {
          const raw = 
            localStorage.getItem(`nexus_air_settings_${activeId}`) ||
            localStorage.getItem('nexus_air_active_settings');
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
            company_id: dbSettings.company_id || prev.company_id,
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
          };

          try {
            localStorage.setItem(`nexus_air_settings_${activeId}`, JSON.stringify(merged));
            localStorage.setItem('nexus_air_active_settings', JSON.stringify(merged));
          } catch {}

          return merged;
        });
      } else if (!isMock) {
        // Fallback para empresas nuevas sin registro en air.settings: obtener de public.companies
        try {
          const { data: compData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', activeId)
            .maybeSingle();

          if (compData) {
            setSettings(prev => {
              const freshSettings: AirSettings = {
                ...prev,
                company_id: compData.id,
                company_name: compData.name,
                fantasy_name: compData.name,
                company_slug: compData.slug || '',
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

      if (dbCustomers && dbCustomers.length > 0) {
        setCustomers(dbCustomers.map((c: any) => ({
          id: c.id,
          name: c.name,
          rut: c.rut,
          phone: c.phone,
          email: c.email || '',
          address: c.address,
          commune: c.commune,
          city: 'Santiago',
          customer_type: 'residencial',
          notes: c.notes,
          created_at: c.created_at,
          equipments: (dbEquipments || []).filter((e: any) => e.customer_id === c.id)
        })));
      } else if (!isMock) {
        setCustomers([]);
      }

      if (dbEquipments && dbEquipments.length > 0) {
        setEquipments(dbEquipments.map((e: any) => ({
          id: e.id,
          customer_id: e.customer_id,
          brand: e.brand,
          model: e.technology || 'Split Inverter',
          btu: e.btu,
          type: 'split_muro',
          technology: e.technology || 'inverter',
          refrigerant: e.refrigerant || 'R410A',
          location_in_property: e.location_in_property,
          installation_date: e.installation_date,
          last_maintenance_date: e.last_maintenance_date,
          next_maintenance_date: e.next_maintenance_date || format(addDays(new Date(), 180), 'yyyy-MM-dd')
        })));
      } else if (!isMock) {
        setEquipments([]);
      }

      if (dbTechnicians && dbTechnicians.length > 0) {
        setTechnicians(dbTechnicians.map((t: any) => ({
          id: t.id,
          name: t.name,
          rut: t.rut,
          phone: t.phone,
          email: t.email,
          role: t.role || 'tecnico',
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
        })));
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
              model: eq.technology || 'Split Inverter',
              btu: eq.btu,
              type: 'split_muro',
              technology: eq.technology || 'inverter',
              refrigerant: eq.refrigerant || 'R410A',
              location_in_property: eq.location_in_property,
              installation_date: eq.installation_date,
              last_maintenance_date: eq.last_maintenance_date,
              next_maintenance_date: eq.next_maintenance_date
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
            completed_at: o.completed_at
          };
        });
        setOrders(mappedOrders);
      } else if (!isMock) {
        setOrders([]);
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

    // Supabase Realtime channel
    const channel = supabase
      .channel(`air-realtime-${companyId || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'air', table: 'orders' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'air', table: 'settings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchData]);

  // Motor de Recaptación Semestral (Cada 6 meses = 180 días)
  const reminders = useMemo<RecaptacionReminder[]>(() => {
    const today = new Date();
    const result: RecaptacionReminder[] = [];

    equipments.forEach(eq => {
      const customer = customers.find(c => c.id === eq.customer_id);
      if (!customer) return;

      const baseDateStr = eq.last_maintenance_date || eq.installation_date || format(today, 'yyyy-MM-dd');
      let baseDate = parseISO(baseDateStr);
      if (isNaN(baseDate.getTime())) baseDate = today;

      // Fecha límite: 6 meses (180 días)
      const dueDate = addDays(baseDate, 180);
      const daysUntilDue = differenceInDays(dueDate, today);

      let status: RecaptacionReminder['status'] = 'al_dia';
      if (contactedReminderIds[eq.id]) {
        status = 'contactado';
      } else if (daysUntilDue < 0) {
        status = 'vencido';
      } else if (daysUntilDue <= 30) {
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
  }, [equipments, customers, contactedReminderIds]);

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
      
      // Si se completa, actualizar fecha de mantenimiento en equipo a hoy (+180 días próxima)
      if (newStatus === 'completado' && o.equipment_id) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setEquipments(eqPrev => eqPrev.map(eq => {
          if (eq.id === o.equipment_id) {
            return {
              ...eq,
              last_maintenance_date: todayStr,
              next_maintenance_date: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
            };
          }
          return eq;
        }));
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
  }, []);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    toast.success('Orden de servicio actualizada');

    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
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
      if (sType.startsWith('mantencion')) {
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
      payment_status: orderData.payment_status || 'pendiente',
      payment_method: orderData.payment_method || 'efectivo',
      technician_location: orderData.technician_location,
      created_at: format(new Date(), 'yyyy-MM-dd HH:mm'),
      completed_at: orderData.status === 'completado' ? format(new Date(), 'yyyy-MM-dd HH:mm') : undefined
    };

    setOrders(prev => [newOrder, ...prev]);
    toast.success(`Orden ${ticketNumber} creada`);

    try {
      await supabaseAir.from('orders').insert([{
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
        technician_location: newOrder.technician_location || null,
        checklist: newOrder.checklist,
        completed_at: newOrder.completed_at ? new Date().toISOString() : null
      }]);
    } catch (e) {
      console.warn('[useAirStore] Failed to insert order into DB:', e);
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
      description: `Mantención preventiva semestral recaptada (6 meses). Equipo ${reminder.equipment_brand} ${reminder.equipment_btu} BTU en ${reminder.equipment_location}.`,
      scheduled_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      scheduled_time_slot: '10:00 - 12:00',
      items: [
        {
          id: `it-${Date.now()}`,
          description: `Mantención Preventiva ${reminder.equipment_brand} ${reminder.equipment_btu} BTU`,
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
  }, [addOrder, markReminderContacted, settings.standard_maintenance_price, settings.tax_rate]);

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

  // Acciones de Clientes
  const addCustomer = useCallback(async (custData: Omit<Customer, 'id' | 'created_at'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();
    const newCust: Customer = {
      ...custData,
      id: newId,
      city: 'Santiago',
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
        name: custData.name,
        rut: custData.rut,
        phone: custData.phone,
        email: custData.email,
        address: custData.address,
        commune: custData.commune,
        notes: custData.notes
      }]);
      if (error) {
        console.error('[useAirStore] Error inserting customer into Supabase:', error);
        toast.error(`Error al guardar en base de datos: ${error.message}`);
      }
    } catch (e: any) {
      console.warn('[useAirStore] Error inserting customer:', e);
      toast.error(`Error de red: ${e?.message || e}`);
    }
    return newCust;
  }, [companyId]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast.success('Cliente actualizado');

    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.rut !== undefined) dbUpdates.rut = updates.rut;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.commune !== undefined) dbUpdates.commune = updates.commune;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

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
    toast.success('Cliente eliminado');

    try {
      await supabaseAir.from('customers').delete().eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error deleting customer:', e);
    }
  }, []);

  // Acciones de Equipos
  const addEquipment = useCallback(async (eqData: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    const newId = crypto.randomUUID();
    const baseDate = eqData.last_maintenance_date || eqData.installation_date || format(new Date(), 'yyyy-MM-dd');
    const nextDate = format(addDays(parseISO(baseDate), 180), 'yyyy-MM-dd');

    const newEq: AirEquipment = {
      ...eqData,
      id: newId,
      next_maintenance_date: nextDate,
    };
    setEquipments(prev => [...prev, newEq]);
    toast.success(`Equipo ${newEq.brand} ${newEq.btu} BTU registrado`);

    try {
      await supabaseAir.from('equipments').insert([{
        id: newId,
        company_id: activeId,
        customer_id: eqData.customer_id,
        brand: eqData.brand,
        btu: eqData.btu,
        technology: eqData.technology || 'inverter',
        refrigerant: eqData.refrigerant || 'R410A',
        serial_number: eqData.serial_number,
        serial_number_evaporator: eqData.serial_number_evaporator,
        serial_number_condenser: eqData.serial_number_condenser,
        location_in_property: eqData.location_in_property,
        installation_date: eqData.installation_date,
        last_maintenance_date: eqData.last_maintenance_date,
        next_maintenance_date: nextDate
      }]);
    } catch (e) {
      console.warn('[useAirStore] Error inserting equipment:', e);
    }
    return newEq;
  }, [companyId]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<AirEquipment>) => {
    setEquipments(prev => prev.map(eq => {
      if (eq.id !== id) return eq;
      const updated = { ...eq, ...updates };
      if (updates.last_maintenance_date) {
        updated.next_maintenance_date = format(addDays(parseISO(updates.last_maintenance_date), 180), 'yyyy-MM-dd');
      }
      return updated;
    }));
    toast.success('Equipo actualizado');

    try {
      const eqDbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.brand !== undefined) eqDbUpdates.brand = updates.brand;
      if (updates.btu !== undefined) eqDbUpdates.btu = updates.btu;
      if (updates.technology !== undefined) eqDbUpdates.technology = updates.technology;
      if (updates.refrigerant !== undefined) eqDbUpdates.refrigerant = updates.refrigerant;
      if (updates.serial_number !== undefined) eqDbUpdates.serial_number = updates.serial_number;
      if (updates.serial_number_evaporator !== undefined) eqDbUpdates.serial_number_evaporator = updates.serial_number_evaporator;
      if (updates.serial_number_condenser !== undefined) eqDbUpdates.serial_number_condenser = updates.serial_number_condenser;
      if (updates.location_in_property !== undefined) eqDbUpdates.location_in_property = updates.location_in_property;
      if (updates.last_maintenance_date !== undefined) eqDbUpdates.last_maintenance_date = updates.last_maintenance_date;

      await supabaseAir
        .from('equipments')
        .update(eqDbUpdates)
        .eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error updating equipment:', e);
    }
  }, []);

  const deleteEquipment = useCallback(async (id: string) => {
    setEquipments(prev => prev.filter(eq => eq.id !== id));
    toast.success('Equipo eliminado');

    try {
      await supabaseAir.from('equipments').delete().eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error deleting equipment:', e);
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
    toast.success(`${newTech.role === 'ayudante' ? 'Ayudante' : 'Técnico'} ${newTech.name} registrado`);

    try {
      await supabaseAir.from('technicians').insert([{
        id: newId,
        company_id: activeId,
        name: techData.name,
        email: techData.email,
        phone: techData.phone,
        rut: techData.rut,
        role: newTech.role,
        sec_certified: techData.sec_certified ?? true,
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
    toast.success('Personal técnico actualizado');

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

  // Configuración de la Empresa
  const updateSettings = useCallback(async (updates: Partial<AirSettings>) => {
    const activeId = companyId || DEFAULT_COMPANY_ID;
    setSettings(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(`nexus_air_settings_${activeId}`, JSON.stringify(next));
        localStorage.setItem('nexus_air_active_settings', JSON.stringify(next));
      } catch (e) {
        console.warn('Error saving settings to localStorage:', e);
      }
      return next;
    });
    toast.success('Configuración de Nexus Air actualizada');

    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.company_name !== undefined) dbUpdates.company_name = updates.company_name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.country_code !== undefined) dbUpdates.country_code = updates.country_code;
      if (updates.currency_symbol !== undefined) dbUpdates.currency_symbol = updates.currency_symbol;
      if (updates.currency_code !== undefined) dbUpdates.currency_code = updates.currency_code;
      if (updates.tax_id_label !== undefined) dbUpdates.tax_id_label = updates.tax_id_label;
      if (updates.tax_rate !== undefined) dbUpdates.tax_rate = updates.tax_rate;
      if (updates.tax_name !== undefined) dbUpdates.tax_name = updates.tax_name;
      if (updates.division_label !== undefined) dbUpdates.division_label = updates.division_label;
      if (updates.landing_config !== undefined) dbUpdates.landing_config = updates.landing_config;
      if (updates.logo_url !== undefined) dbUpdates.logo_url = updates.logo_url;
      if (updates.company_slogan !== undefined) dbUpdates.company_slogan = updates.company_slogan;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.default_apply_tax !== undefined) dbUpdates.default_apply_tax = updates.default_apply_tax;
      if (updates.maintenance_interval_months !== undefined) dbUpdates.maintenance_interval_months = updates.maintenance_interval_months;
      if (updates.quality_control_days !== undefined) dbUpdates.quality_control_days = updates.quality_control_days;
      if (updates.inactive_recovery_months !== undefined) dbUpdates.inactive_recovery_months = updates.inactive_recovery_months;
      if (updates.pre_expiration_warning_days !== undefined) dbUpdates.pre_expiration_warning_days = updates.pre_expiration_warning_days;

      // Intentar update primero por company_id
      const { error: updateErr } = await supabaseAir
        .from('settings')
        .update(dbUpdates)
        .eq('company_id', activeId);

      if (updateErr) {
        // Fallback a upsert
        await supabaseAir
          .from('settings')
          .upsert({ company_id: activeId, ...dbUpdates }, { onConflict: 'company_id' });
      }
    } catch (e) {
      console.warn('[useAirStore] Error updating settings in Supabase:', e);
    }
  }, [companyId]);

  // Reset a valores de demostración o estado limpio
  const resetToDefaults = useCallback(() => {
    const isMock = companyId === DEMO_SANDBOX_COMPANY_ID;
    if (isMock) {
      setCustomers(INITIAL_CUSTOMERS);
      setEquipments(INITIAL_EQUIPMENTS);
      setTechnicians(INITIAL_TECHNICIANS);
      setParts(INITIAL_PARTS);
      setOrders(INITIAL_SERVICE_ORDERS);
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
      } catch {}
      toast.success('Datos de demostración restaurados');
    } else {
      setCustomers([]);
      setEquipments([]);
      setTechnicians([]);
      setParts([]);
      setOrders([]);
      setContactedReminderIds({});
      try {
        localStorage.removeItem(`nexus_air_customers_${companyId}`);
        localStorage.removeItem(`nexus_air_equipments_${companyId}`);
        localStorage.removeItem(`nexus_air_orders_${companyId}`);
        localStorage.removeItem(`nexus_air_technicians_${companyId}`);
        localStorage.removeItem(`nexus_air_parts_${companyId}`);
      } catch {}
      toast.success('Caché local de empresa limpiada');
      fetchData();
    }
  }, [companyId, fetchData]);

  // Helper para consultar landing pública de empresa por slug
  const fetchPublicCompanyBySlug = useCallback(async (slug: string) => {
    try {
      const { data, error } = await supabaseAir
        .from('settings')
        .select('*')
        .ilike('company_slug', slug.trim().toLowerCase())
        .maybeSingle();

      if (error || !data) return null;
      return data;
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
    reminders,
    settings,
    addOrder,
    updateOrder,
    updateOrderStatus,
    updateChecklist,
    deleteOrder,
    markReminderContacted,
    scheduleReminderService,
    generateWhatsAppUrl,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addPart,
    updatePart,
    deletePart,
    updateSettings,
    resetToDefaults,
    refreshData: fetchData,
    fetchPublicCompanyBySlug,
  };
}
