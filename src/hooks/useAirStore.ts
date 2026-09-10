import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Customer, 
  AirEquipment, 
  Technician, 
  ServiceOrder, 
  AirPart, 
  AirSettings, 
  RecaptacionReminder, 
  OrderStatus,
  HVACInspectionChecklist
} from '../types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_EQUIPMENTS, 
  INITIAL_PARTS, 
  INITIAL_SERVICE_ORDERS, 
  INITIAL_SETTINGS, 
  INITIAL_TECHNICIANS 
} from '../lib/mockAirData';
import { addDays, parseISO, differenceInDays, format } from 'date-fns';
import { toast } from 'react-hot-toast';

const STORAGE_KEY = 'nexus_air_store_v1';

export function useAirStore() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [equipments, setEquipments] = useState<AirEquipment[]>(INITIAL_EQUIPMENTS);
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [parts, setParts] = useState<AirPart[]>(INITIAL_PARTS);
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_SERVICE_ORDERS);
  const [settings, setSettings] = useState<AirSettings>(INITIAL_SETTINGS);
  const [contactedReminderIds, setContactedReminderIds] = useState<Record<string, string>>({});

  // Cargar estado desde LocalStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.equipments) setEquipments(parsed.equipments);
        if (parsed.technicians) setTechnicians(parsed.technicians);
        if (parsed.parts) setParts(parsed.parts);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.contacted) setContactedReminderIds(parsed.contacted);
      }
    } catch (e) {
      console.warn('Error loading Nexus Air state from LocalStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar en LocalStorage cada vez que cambie algún dato
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        customers,
        equipments,
        technicians,
        parts,
        orders,
        settings,
        contacted: contactedReminderIds
      }));
    } catch (e) {
      console.warn('Error saving Nexus Air state to LocalStorage:', e);
    }
  }, [customers, equipments, technicians, parts, orders, settings, contactedReminderIds, isLoaded]);

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

    // Ordenar: primero los vencidos (más urgente), luego por vencer, luego al día
    return result.sort((a, b) => a.days_until_due - b.days_until_due);
  }, [equipments, customers, contactedReminderIds]);

  // Asociar relaciones para órdenes
  const enrichedOrders = useMemo<ServiceOrder[]>(() => {
    return orders.map(ord => {
      const customer = customers.find(c => c.id === ord.customer_id);
      const equipment = equipments.find(e => e.id === ord.equipment_id);
      const technician = technicians.find(t => t.id === ord.assigned_technician_id);
      return {
        ...ord,
        customer,
        equipment,
        assigned_technician: technician,
      };
    });
  }, [orders, customers, equipments, technicians]);

  // Acciones sobre Órdenes de Servicio
  const addOrder = useCallback((newOrderData: Partial<ServiceOrder>) => {
    const newId = `ord-${Date.now()}`;
    const nextNum = orders.length + 1;
    const ticketNumber = `AIR-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;

    const newOrder: ServiceOrder = {
      id: newId,
      ticket_number: ticketNumber,
      customer_id: newOrderData.customer_id || '',
      equipment_id: newOrderData.equipment_id,
      service_type: newOrderData.service_type || 'mantencion_preventiva',
      status: newOrderData.status || 'ingresado',
      scheduled_date: newOrderData.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
      scheduled_time_slot: newOrderData.scheduled_time_slot || '09:00 - 11:00',
      assigned_technician_id: newOrderData.assigned_technician_id,
      description: newOrderData.description || '',
      diagnosis: newOrderData.diagnosis || '',
      checklist: newOrderData.checklist || {
        clean_evaporator_coil: false,
        clean_turbine_fan: false,
        sanitize_bactericide: false,
        clean_condenser_coil: false,
        check_electrical_connections: false,
        check_condensate_drain: false,
        clean_filters: false,
      },
      items: newOrderData.items || [],
      subtotal: newOrderData.subtotal || 0,
      tax: newOrderData.tax || 0,
      total: newOrderData.total || 0,
      payment_status: newOrderData.payment_status || 'pendiente',
      payment_method: newOrderData.payment_method,
      created_at: format(new Date(), 'yyyy-MM-dd HH:mm'),
    };

    setOrders(prev => [newOrder, ...prev]);
    toast.success(`Orden ${ticketNumber} creada exitosamente`);
    return newOrder;
  }, [orders]);

  const updateOrder = useCallback((id: string, updates: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(ord => ord.id === id ? { ...ord, ...updates } : ord));
    toast.success('Orden actualizada');
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== id) return ord;
      const completedAt = status === 'completado' ? format(new Date(), 'yyyy-MM-dd HH:mm') : ord.completed_at;
      
      // Si se completó una mantención preventiva o correctiva, actualizar la fecha en el equipo a hoy
      if (status === 'completado' && ord.equipment_id) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setEquipments(eqPrev => eqPrev.map(eq => {
          if (eq.id === ord.equipment_id) {
            return {
              ...eq,
              last_maintenance_date: todayStr,
              next_maintenance_date: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
            };
          }
          return eq;
        }));
      }

      return {
        ...ord,
        status,
        completed_at: completedAt,
      };
    }));
    toast.success(`Estado actualizado a: ${status.replace('_', ' ').toUpperCase()}`);
  }, []);

  const updateChecklist = useCallback((orderId: string, checklist: HVACInspectionChecklist) => {
    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, checklist } : ord));
    toast.success('Checklist e inspección técnica guardados');
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => prev.filter(ord => ord.id !== id));
    toast.success('Orden eliminada');
  }, []);

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
    // Convierte directamente el recordatorio en una orden de mantención
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

  // Generador de enlace de WhatsApp
  const generateWhatsAppUrl = useCallback((reminder: RecaptacionReminder) => {
    let text = settings.whatsapp_template_recaptacion;
    text = text.replace('{cliente}', reminder.customer_name);
    text = text.replace('{marca}', reminder.equipment_brand);
    text = text.replace('{btu}', String(reminder.equipment_btu));
    text = text.replace('{ubicacion}', reminder.equipment_location);
    text = text.replace('{link}', `${window.location.origin}/?agenda=${reminder.id}`);

    const cleanPhone = reminder.customer_phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [settings.whatsapp_template_recaptacion]);

  // Acciones Clientes
  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'created_at'>) => {
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      created_at: format(new Date(), 'yyyy-MM-dd'),
    };
    setCustomers(prev => [newCust, ...prev]);
    toast.success(`Cliente ${newCust.name} registrado`);
    return newCust;
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast.success('Cliente actualizado');
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    toast.success('Cliente eliminado');
  }, []);

  // Acciones Equipos
  const addEquipment = useCallback((eqData: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => {
    const baseDate = eqData.last_maintenance_date || eqData.installation_date || format(new Date(), 'yyyy-MM-dd');
    const nextDate = format(addDays(parseISO(baseDate), 180), 'yyyy-MM-dd');
    const newEq: AirEquipment = {
      ...eqData,
      id: `eq-${Date.now()}`,
      next_maintenance_date: nextDate,
    };
    setEquipments(prev => [...prev, newEq]);
    toast.success(`Equipo ${newEq.brand} ${newEq.btu} BTU registrado`);
    return newEq;
  }, []);

  const updateEquipment = useCallback((id: string, updates: Partial<AirEquipment>) => {
    setEquipments(prev => prev.map(eq => {
      if (eq.id !== id) return eq;
      const updated = { ...eq, ...updates };
      if (updates.last_maintenance_date) {
        updated.next_maintenance_date = format(addDays(parseISO(updates.last_maintenance_date), 180), 'yyyy-MM-dd');
      }
      return updated;
    }));
    toast.success('Equipo actualizado');
  }, []);

  const deleteEquipment = useCallback((id: string) => {
    setEquipments(prev => prev.filter(eq => eq.id !== id));
    toast.success('Equipo eliminado');
  }, []);

  // Acciones Técnicos
  const addTechnician = useCallback((techData: Omit<Technician, 'id'>) => {
    const newTech: Technician = {
      ...techData,
      id: `tech-${Date.now()}`,
      active_orders_count: 0,
    };
    setTechnicians(prev => [...prev, newTech]);
    toast.success(`Técnico ${newTech.name} registrado`);
    return newTech;
  }, []);

  const updateTechnician = useCallback((id: string, updates: Partial<Technician>) => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    toast.success('Técnico actualizado');
  }, []);

  const deleteTechnician = useCallback((id: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
    toast.success('Técnico eliminado');
  }, []);

  // Acciones Inventario
  const addPart = useCallback((partData: Omit<AirPart, 'id'>) => {
    const newPart: AirPart = {
      ...partData,
      id: `part-${Date.now()}`,
    };
    setParts(prev => [...prev, newPart]);
    toast.success(`Producto ${newPart.name} agregado al inventario`);
    return newPart;
  }, []);

  const updatePart = useCallback((id: string, updates: Partial<AirPart>) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    toast.success('Producto actualizado');
  }, []);

  const deletePart = useCallback((id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
    toast.success('Producto eliminado del inventario');
  }, []);

  // Ajustes de la Empresa
  const updateSettings = useCallback((updates: Partial<AirSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    toast.success('Configuración de Nexus Air actualizada');
  }, []);

  // Restablecer Datos Iniciales de Demostración
  const resetToDefaults = useCallback(() => {
    setCustomers(INITIAL_CUSTOMERS);
    setEquipments(INITIAL_EQUIPMENTS);
    setTechnicians(INITIAL_TECHNICIANS);
    setParts(INITIAL_PARTS);
    setOrders(INITIAL_SERVICE_ORDERS);
    setSettings(INITIAL_SETTINGS);
    setContactedReminderIds({});
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Datos de Nexus Air restaurados al estado inicial');
  }, []);

  return {
    isLoaded,
    customers,
    equipments,
    technicians,
    parts,
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
  };
}
