export type EquipmentType = 
  | 'split_muro' 
  | 'multisplit' 
  | 'cassette' 
  | 'ducto' 
  | 'piso_cielo' 
  | 'portatil';

export type RefrigerantType = 'R410A' | 'R32' | 'R22' | 'R134a';

export type ServiceType = 
  | 'instalacion' 
  | 'mantencion_preventiva' 
  | 'mantencion_correctiva' 
  | 'visita_tecnica' 
  | 'recarga_gas';

export type OrderStatus = 
  | 'ingresado' 
  | 'en_ruta' 
  | 'en_proceso' 
  | 'pruebas_qa' 
  | 'completado' 
  | 'cancelado';

export interface AirEquipment {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  serial_number?: string;
  btu: number;
  type: EquipmentType;
  technology: 'inverter' | 'on_off';
  refrigerant: RefrigerantType;
  location_in_property: string; // ej: "Dormitorio Principal", "Living Comedor", "Sala Servidores"
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date: string; // 6 meses después de la última mantención o instalación
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  rut: string;
  phone: string;
  email: string;
  address: string;
  commune: string;
  city: string;
  customer_type: 'residencial' | 'comercial' | 'industrial';
  notes?: string;
  equipments?: AirEquipment[];
  created_at: string;
}

export interface Technician {
  id: string;
  name: string;
  rut: string;
  phone: string;
  email?: string;
  sec_certified: boolean;
  certification_number?: string;
  status: 'disponible' | 'en_servicio' | 'vacaciones' | 'inactivo';
  avatar_url?: string;
  active_orders_count?: number;
}

export interface HVACInspectionChecklist {
  clean_evaporator_coil: boolean;
  clean_turbine_fan: boolean;
  sanitize_bactericide: boolean;
  clean_condenser_coil: boolean;
  check_electrical_connections: boolean;
  check_condensate_drain: boolean;
  clean_filters: boolean;
  delta_t_celsius?: number; // Diferencia temperatura retorno e inyección (°C)
  suction_pressure_psi?: number; // Presión baja PSI
  discharge_pressure_psi?: number; // Presión alta PSI
  amperage_amps?: number; // Consumo eléctrico medido en Amperes
  technician_notes?: string;
  photos_before?: string[];
  photos_after?: string[];
}

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: 'equipo' | 'servicio' | 'insumo' | 'repuesto';
}

export interface ServiceOrder {
  id: string;
  ticket_number: string; // ej: "AIR-2026-001"
  customer_id: string;
  customer?: Customer;
  equipment_id?: string;
  equipment?: AirEquipment;
  service_type: ServiceType;
  status: OrderStatus;
  scheduled_date: string;
  scheduled_time_slot: string; // ej: "09:00 - 11:00"
  assigned_technician_id?: string;
  assigned_technician?: Technician;
  description: string;
  diagnosis?: string;
  resolution?: string;
  checklist: HVACInspectionChecklist;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_status: 'pendiente' | 'pagado' | 'abono';
  payment_method?: 'transferencia' | 'efectivo' | 'tarjeta' | 'webpay';
  created_at: string;
  completed_at?: string;
}

export interface AirPart {
  id: string;
  sku: string;
  name: string;
  category: 'equipo' | 'refrigerante' | 'cobre_aislacion' | 'bomba_soporte' | 'electrico' | 'quimico';
  brand?: string;
  btu?: number;
  stock: number;
  min_stock: number;
  cost_price: number;
  sale_price: number;
  unit: 'unidad' | 'metro' | 'kg' | 'litro' | 'kit';
  description?: string;
  image_url?: string;
}

export interface RecaptacionReminder {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_commune: string;
  equipment_id: string;
  equipment_brand: string;
  equipment_btu: number;
  equipment_location: string;
  last_service_date: string;
  last_service_type: ServiceType;
  next_maintenance_due: string; // Fecha exacta 6 meses (180 días)
  days_until_due: number; // Negativo si ya venció
  status: 'al_dia' | 'por_vencer' | 'vencido' | 'contactado' | 'reagendado';
  contacted_at?: string;
  notes?: string;
}

export interface ThermalCalculationInput {
  area_m2: number;
  ceiling_height_m: number;
  sun_exposure: 'baja' | 'media' | 'alta';
  room_type: 'dormitorio' | 'living' | 'oficina' | 'local_comercial' | 'servidores';
  people_count: number;
  electronic_load: 'baja' | 'media' | 'alta';
}

export interface ThermalCalculationResult {
  exact_btu: number;
  recommended_btu: number; // 9000, 12000, 18000, 24000, 36000
  cooling_kw: number;
  heating_kw: number;
  explanation: string;
  recommended_models: string[];
}

export interface AirSettings {
  company_id?: string;
  company_name: string;
  fantasy_name: string;
  country?: string; // ej: 'Costa Rica', 'Venezuela', 'Perú', 'Chile', etc.
  country_code?: string; // ej: 'CR', 'VE', 'PE', 'CL', etc.
  currency_symbol?: string; // ej: '₡', '$', 'S/', 'Bs.'
  currency_code?: string; // ej: 'CRC', 'USD', 'PEN', 'CLP', 'VES'
  tax_id_label?: string; // ej: 'Cédula Jurídica', 'RIF', 'RUC', 'RUT', 'NIT', 'RFC'
  tax_rate?: number; // ej: 0.13, 0.16, 0.18, 0.19
  tax_name?: string; // ej: 'IVA', 'IGV', 'ITBIS'
  division_label?: string; // ej: 'Cantón / Provincia', 'Municipio / Estado', 'Distrito / Provincia', 'Comuna / Región'
  rut: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  commune: string;
  website: string;
  maintenance_interval_months: number; // 6 meses
  standard_maintenance_price: number;
  standard_installation_price: number;
  whatsapp_template_recaptacion: string;
  whatsapp_template_agendamiento: string;
  whatsapp_template_terminado: string;
  landing_config?: {
    hero_title?: string;
    hero_subtitle?: string;
    hero_badge?: string;
    phone?: string;
    email?: string;
    address?: string;
    country?: string;
    currency_symbol?: string;
    services?: Array<{ title: string; desc: string; price: number }>;
  };
}

export type ViewTab = 
  | 'dashboard' 
  | 'recaptacion' 
  | 'agenda' 
  | 'cotizador' 
  | 'inventory' 
  | 'customers' 
  | 'technicians' 
  | 'sales' 
  | 'settings';
