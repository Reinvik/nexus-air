import { useState, useEffect, useCallback, useMemo } from 'react';
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

export function useAirStore(companyId: string = DEFAULT_COMPANY_ID) {
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_SERVICE_ORDERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [equipments, setEquipments] = useState<AirEquipment[]>(INITIAL_EQUIPMENTS);
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [parts, setParts] = useState<AirPart[]>(INITIAL_PARTS);
  const [settings, setSettings] = useState<AirSettings>({
    ...INITIAL_SETTINGS,
    company_id: companyId,
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

  // Cargar datos desde Supabase (Schema 'air')
  const fetchData = useCallback(async () => {
    try {
      const activeId = companyId || DEFAULT_COMPANY_ID;

      // 1. Settings
      const { data: dbSettings } = await supabaseAir
        .from('settings')
        .select('*')
        .eq('company_id', activeId)
        .maybeSingle();

      if (dbSettings) {
        setSettings(prev => ({
          ...prev,
          company_id: dbSettings.company_id,
          company_name: dbSettings.company_name || prev.company_name,
          fantasy_name: dbSettings.company_name || prev.fantasy_name,
          phone: dbSettings.phone || prev.phone,
          whatsapp_number: (dbSettings.phone || prev.whatsapp_number).replace(/[^0-9]/g, ''),
          email: dbSettings.email || prev.email,
          address: dbSettings.address || prev.address,
          landing_config: dbSettings.landing_config || prev.landing_config,
        }));
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
      }

      if (dbTechnicians && dbTechnicians.length > 0) {
        setTechnicians(dbTechnicians.map((t: any) => ({
          id: t.id,
          name: t.name,
          rut: t.rut,
          phone: t.phone,
          email: t.email,
          sec_certified: t.sec_certified ?? true,
          status: t.active ? 'disponible' : 'inactivo',
          active_orders_count: 1
        })));
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
      }

      if (dbOrders && dbOrders.length > 0) {
        const mappedOrders: ServiceOrder[] = dbOrders.map((o: any) => {
          const cust = (dbCustomers || []).find((c: any) => c.id === o.customer_id);
          const eq = (dbEquipments || []).find((e: any) => e.id === o.equipment_id);
          const tech = (dbTechnicians || []).find((t: any) => t.id === o.assigned_technician_id);

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
              sec_certified: tech.sec_certified ?? true,
              status: tech.active ? 'disponible' : 'inactivo'
            } : undefined,
            service_type: o.service_type || 'mantencion_preventiva',
            status: o.status || 'ingresado',
            scheduled_date: o.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
            scheduled_time_slot: o.scheduled_time_slot || '09:00 - 11:00',
            description: o.description || '',
            diagnosis: o.diagnosis,
            resolution: o.resolution,
            checklist: o.checklist || {
              clean_filters: false,
              clean_evaporator_coil: false,
              clean_turbine_fan: false,
              sanitize_bactericide: false,
              clean_condenser_coil: false,
              check_electrical_connections: false,
              check_condensate_drain: false
            },
            items: [],
            subtotal: Number(o.total) || 45000,
            tax: Math.round((Number(o.total) || 45000) * 0.19),
            total: Number(o.total) || 45000,
            payment_status: o.payment_status || 'pendiente',
            created_at: o.created_at || new Date().toISOString()
          };
        });
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.warn('[useAirStore] Using offline/initial cache:', err);
    } finally {
      setIsLoaded(true);
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
      return {
        ...ord,
        customer: customer || ord.customer,
        equipment: equipment || ord.equipment,
        assigned_technician: technician || ord.assigned_technician,
      };
    });
  }, [orders, customers, equipments, technicians]);

  // Acciones de Órdenes
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const completedAt = newStatus === 'completado' ? format(new Date(), 'yyyy-MM-dd HH:mm') : o.completed_at;
      
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
      await supabaseAir
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
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
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.assigned_technician_id !== undefined) dbUpdates.assigned_technician_id = updates.assigned_technician_id || null;
      if (updates.scheduled_date) dbUpdates.scheduled_date = updates.scheduled_date;
      if (updates.scheduled_time_slot) dbUpdates.scheduled_time_slot = updates.scheduled_time_slot;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis;
      if (updates.resolution !== undefined) dbUpdates.resolution = updates.resolution;
      if (updates.payment_status) dbUpdates.payment_status = updates.payment_status;
      if (updates.total !== undefined) dbUpdates.total = updates.total;
      if (updates.checklist) dbUpdates.checklist = updates.checklist;

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

    const newOrder: ServiceOrder = {
      id: newId,
      ticket_number: ticketNumber,
      customer_id: orderData.customer_id || '',
      customer: customers.find(c => c.id === orderData.customer_id),
      equipment_id: orderData.equipment_id,
      equipment: equipments.find(e => e.id === orderData.equipment_id),
      assigned_technician_id: orderData.assigned_technician_id,
      assigned_technician: technicians.find(t => t.id === orderData.assigned_technician_id),
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
      subtotal: orderData.subtotal || orderData.total || 45000,
      tax: orderData.tax || Math.round((orderData.total || 45000) * 0.19),
      total: orderData.total || 45000,
      payment_status: orderData.payment_status || 'pendiente',
      created_at: format(new Date(), 'yyyy-MM-dd HH:mm')
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
        service_type: orderData.service_type || 'mantencion_preventiva',
        status: orderData.status || 'ingresado',
        priority: 'normal',
        scheduled_date: orderData.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
        scheduled_time_slot: orderData.scheduled_time_slot || '09:00 - 11:00',
        description: orderData.description,
        total: orderData.total || 45000,
        payment_status: orderData.payment_status || 'pendiente',
        checklist: newOrder.checklist
      }]);
    } catch (e) {
      console.warn('[useAirStore] Failed to insert order into DB:', e);
    }

    return newOrder;
  }, [orders.length, companyId, customers, equipments, technicians]);

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
          unit_price: settings.standard_maintenance_price,
          total: settings.standard_maintenance_price,
          type: 'servicio',
        }
      ],
      subtotal: settings.standard_maintenance_price,
      tax: Math.round(settings.standard_maintenance_price * 0.19),
      total: Math.round(settings.standard_maintenance_price * 1.19),
    });

    markReminderContacted(reminder.equipment_id);
    return newOrder;
  }, [addOrder, markReminderContacted, settings.standard_maintenance_price]);

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
      await supabaseAir.from('customers').insert([{
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
    } catch (e) {
      console.warn('[useAirStore] Error inserting customer:', e);
    }
    return newCust;
  }, [companyId]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast.success('Cliente actualizado');

    try {
      await supabaseAir
        .from('customers')
        .update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email,
          address: updates.address,
          commune: updates.commune,
          updated_at: new Date().toISOString()
        })
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
      await supabaseAir
        .from('equipments')
        .update({
          brand: updates.brand,
          btu: updates.btu,
          technology: updates.technology,
          refrigerant: updates.refrigerant,
          location_in_property: updates.location_in_property,
          last_maintenance_date: updates.last_maintenance_date,
          updated_at: new Date().toISOString()
        })
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
      active_orders_count: 0,
    };
    setTechnicians(prev => [...prev, newTech]);
    toast.success(`Técnico ${newTech.name} registrado`);

    try {
      await supabaseAir.from('technicians').insert([{
        id: newId,
        company_id: activeId,
        name: techData.name,
        email: techData.email,
        phone: techData.phone,
        rut: techData.rut,
        sec_certified: techData.sec_certified ?? true,
        active: true
      }]);
    } catch (e) {
      console.warn('[useAirStore] Error inserting technician:', e);
    }
    return newTech;
  }, [companyId]);

  const updateTechnician = useCallback(async (id: string, updates: Partial<Technician>) => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    toast.success('Técnico actualizado');

    try {
      await supabaseAir
        .from('technicians')
        .update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email,
          sec_certified: updates.sec_certified,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error updating technician:', e);
    }
  }, []);

  const deleteTechnician = useCallback(async (id: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
    toast.success('Técnico eliminado');

    try {
      await supabaseAir.from('technicians').delete().eq('id', id);
    } catch (e) {
      console.warn('[useAirStore] Error deleting technician:', e);
    }
  }, []);

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
    setSettings(prev => ({ ...prev, ...updates }));
    toast.success('Configuración de Nexus Air actualizada');

    try {
      const activeId = companyId || DEFAULT_COMPANY_ID;
      await supabaseAir
        .from('settings')
        .update({
          company_name: updates.company_name,
          phone: updates.phone,
          email: updates.email,
          address: updates.address,
          landing_config: updates.landing_config,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', activeId);
    } catch (e) {
      console.warn('[useAirStore] Error updating settings:', e);
    }
  }, [companyId]);

  // Reset a valores de demostración
  const resetToDefaults = useCallback(() => {
    setCustomers(INITIAL_CUSTOMERS);
    setEquipments(INITIAL_EQUIPMENTS);
    setTechnicians(INITIAL_TECHNICIANS);
    setParts(INITIAL_PARTS);
    setOrders(INITIAL_SERVICE_ORDERS);
    setSettings({ ...INITIAL_SETTINGS, company_id: companyId });
    setContactedReminderIds({});
    toast.success('Datos de demostración restaurados');
  }, [companyId]);

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
