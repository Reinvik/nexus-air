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
  | 'mantenimiento_preventivo'
  | 'mantenimiento_correctivo'
  | 'visita_tecnica' 
  | 'recarga_gas'
  | 'reparacion'
  | 'recaptacion'
  | 'pruebas_qa';

export function formatServiceType(type?: string): string {
  if (!type) return 'Mantenimiento';
  switch (type) {
    case 'mantencion_preventiva':
    case 'mantenimiento_preventivo':
      return 'Mantenimiento Preventivo (6M)';
    case 'mantencion_correctiva':
    case 'mantenimiento_correctivo':
      return 'Mantenimiento Correctivo / Fuga';
    case 'instalacion':
      return 'Instalación de Equipo';
    case 'visita_tecnica':
      return 'Visita Técnica de Diagnóstico';
    case 'recarga_gas':
      return 'Recarga de Gas Refrigerante';
    case 'reparacion':
      return 'Reparación General';
    case 'recaptacion':
      return 'Recaptación de Mantenimiento';
    case 'pruebas_qa':
      return 'Pruebas de Calidad / QA';
    default:
      return type
        .replace(/mantencion/gi, 'mantenimiento')
        .replace(/mantenciones/gi, 'mantenimientos')
        .replace(/_/g, ' ');
  }
}

// NK-061: Clasificación cromática en agendamiento
export const SERVICE_TYPE_DEFAULT_COLORS: Record<string, string> = {
  mantencion_preventiva: '#0284c7', // Azul cielo
  mantenimiento_preventivo: '#0284c7',
  mantencion_correctiva: '#ea580c', // Naranja
  mantenimiento_correctivo: '#ea580c',
  instalacion: '#dc2626', // Rojo
  visita_tecnica: '#d97706', // Ámbar / Dorado
  recarga_gas: '#0891b2', // Cian
  reparacion: '#7c3aed', // Púrpura / Violeta
  recaptacion: '#16a34a', // Verde
  pruebas_qa: '#9333ea', // Magenta
};

export const CALENDAR_COLOR_OPTIONS = [
  { name: 'Azul (Mantenimiento)', value: '#0284c7' },
  { name: 'Rojo (Instalación)', value: '#dc2626' },
  { name: 'Naranja (Correctivo)', value: '#ea580c' },
  { name: 'Ámbar (Visita Técnica)', value: '#d97706' },
  { name: 'Cian (Recarga Gas)', value: '#0891b2' },
  { name: 'Violeta (Reparación)', value: '#7c3aed' },
  { name: 'Verde (Recaptación)', value: '#16a34a' },
  { name: 'Esmeralda', value: '#059669' },
  { name: 'Rosa Fucsia', value: '#db2777' },
  { name: 'Gris Pizarra', value: '#4b5563' },
];

export function getOrderCalendarColor(
  order: { calendar_color?: string; service_type?: string; checklist?: any },
  serviceTypeColors?: Record<string, string>
): string {
  if (order.calendar_color) return order.calendar_color;
  if (order.checklist && typeof order.checklist === 'object' && (order.checklist as any).calendar_color) {
    return (order.checklist as any).calendar_color;
  }
  const sType = order.service_type || 'mantencion_preventiva';
  if (serviceTypeColors && serviceTypeColors[sType]) {
    return serviceTypeColors[sType];
  }
  return SERVICE_TYPE_DEFAULT_COLORS[sType] || '#0284c7';
}

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
  serial_number_evaporator?: string; // NK-040: Serial Evap. / Unidad Interior
  serial_number_condenser?: string;  // NK-040: Serial Cond. / Unidad Exterior
  btu: number;
  type: EquipmentType;
  technology: 'inverter' | 'on_off';
  refrigerant: RefrigerantType;
  location_in_property: string; // ej: "Dormitorio Principal", "Living Comedor", "Sala Servidores"
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date: string; // 6 meses después del último mantenimiento o instalación
  status?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  rut: string;
  id_number?: string; // alias internacional
  phone: string;
  email: string;
  address: string;
  commune: string;
  city: string;
  customer_type: 'residencial' | 'comercial' | 'industrial' | 'empresarial';
  notes?: string;
  equipments?: AirEquipment[];
  created_at: string;
}

export type CustomerAir = Customer;

export type StaffRole = 
  | 'tecnico' 
  | 'ayudante' 
  | 'administracion' 
  | 'recepcion' 
  | 'limpieza' 
  | 'chofer_logistica' 
  | 'otro';

export type SalaryMode = 'fixed' | 'commission' | 'fixed_and_commission';

export function isTechnicalStaff(role?: string): boolean {
  if (!role) return true;
  return role === 'tecnico' || role === 'ayudante';
}

export function formatStaffRole(role?: string): string {
  switch (role) {
    case 'tecnico': return 'Técnico Líder';
    case 'ayudante': return 'Ayudante Técnico';
    case 'administracion': return 'Administración';
    case 'recepcion': return 'Recepción / Ventas';
    case 'limpieza': return 'Aseo & Mantención';
    case 'chofer_logistica': return 'Chofer / Logística';
    default: return role || 'Colaborador';
  }
}

export function formatSalaryMode(mode?: SalaryMode): string {
  switch (mode) {
    case 'fixed': return 'Solo Sueldo Fijo';
    case 'commission': return 'Solo Comisiones';
    case 'fixed_and_commission': return 'Fijo + Comisiones';
    default: return 'Comisiones';
  }
}

export interface Technician {
  id: string;
  name: string;
  rut: string;
  phone: string;
  email?: string;
  role?: StaffRole | string;
  custom_role_title?: string; // NK-062: Cargo personalizado si aplica
  salary_mode?: SalaryMode;   // NK-062: Modalidad individual de pago
  base_salary?: number;       // NK-062: Sueldo fijo mensual
  working_days_default?: number; // NK-062: Días trabajados por defecto
  sec_certified: boolean;
  certification_number?: string;
  default_commission_type?: 'fixed' | 'percentage';
  default_commission_value?: number;
  commission_mantencion_type?: 'fixed' | 'percentage';
  commission_mantencion_value?: number;
  commission_instalacion_type?: 'fixed' | 'percentage';
  commission_instalacion_value?: number;
  commission_reparacion_type?: 'fixed' | 'percentage';
  commission_reparacion_value?: number;
  status: 'disponible' | 'en_servicio' | 'vacaciones' | 'inactivo';
  avatar_url?: string;
  active_orders_count?: number;
}

export interface TechnicianPayout {
  id: string;
  company_id?: string;
  payout_number?: string; // ej: "LIQ-2026-001"
  technician_id: string;
  technician_name: string;
  technician_role: StaffRole | string;
  salary_mode?: SalaryMode; // NK-062: Modalidad bajo la cual se liquidó
  payout_type?: 'liquidacion' | 'adelanto' | 'abono' | 'parcial'; // NK-065: Tipo de transacción
  payment_proof_url?: string; // NK-065: Voucher o comprobante de transferencia bancaria adjunto
  base_salary?: number;     // NK-062: Sueldo base en el período
  commission_amount?: number; // NK-062: Comisiones sumadas en el período
  bonus_amount?: number;    // NK-062: Bonos o haberes adicionales
  deduction_amount?: number;// NK-062: Anticipos o descuentos aplicados
  working_days?: number;    // NK-062: Días trabajados en el período
  period_month: string; // ej: "2026-09"
  amount: number;       // Líquido pagado en esta transacción
  payment_date: string; // YYYY-MM-DD
  payment_method: 'transferencia' | 'efectivo' | 'cheque' | 'otro';
  payment_reference?: string;
  notes?: string;
  order_ids: string[];
  created_at: string;
  updated_at?: string;
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
  // NK-040: Parámetros y mediciones técnicas forma Venefrio
  serial_evaporator?: string;
  serial_condenser?: string;
  work_start_time?: string;
  work_end_time?: string;
  amp_initial?: number;
  amp_final?: number;
  voltage_initial?: number;
  voltage_final?: number;
  psi_low_initial?: number;
  psi_low_final?: number;
  psi_high_initial?: number;
  psi_high_final?: number;
  capacitance_mfd?: number;
  technician_signature_name?: string;
  customer_signature_name?: string;
  customer_id_document?: string;
  technician_notes?: string;
  photos_before?: string[];
  photos_after?: string[];
  videos_before?: string[];
  videos_after?: string[];
}

export interface TechnicianLocation {
  order_id: string;
  technician_name?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
  updated_at: string;
  is_active: boolean;
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
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  equipment_id?: string;
  equipment?: AirEquipment;
  equipment_ids?: string[]; // NK-077: Múltiples equipos intervenidos en la orden
  equipments_summary?: string; // NK-077: Resumen descriptivo de los equipos
  service_type: ServiceType;
  status: OrderStatus;
  scheduled_date: string;
  scheduled_time_slot: string; // ej: "09:00 - 11:00"
  assigned_technician_id?: string;
  assigned_technician?: Technician;
  assigned_assistant_id?: string;
  assigned_assistant?: Technician;
  technician_payout_type?: 'fixed' | 'percentage';
  technician_payout_value?: number;
  assistant_payout_type?: 'fixed' | 'percentage';
  assistant_payout_value?: number;
  technician_location?: TechnicianLocation;
  description: string;
  diagnosis?: string;
  resolution?: string;
  checklist: HVACInspectionChecklist;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  apply_tax?: boolean; // NK-039: IVA Seleccionable
  tax_mode?: 'included' | 'plus' | 'exempt'; // NK-050: Modalidad de IVA (incluido, adicional o exento)
  is_recurring_confirmed?: boolean; // NK-053: Mantenimiento Periódico Acordado con el Cliente
  recurring_frequency_months?: number; // NK-053: Periodicidad pactada (3, 6, 12 meses)
  recurring_schedule_id?: string; // NK-053: Vínculo al acuerdo periódico
  payment_status: 'pendiente' | 'pagado' | 'abono';
  payment_method?: 'transferencia' | 'efectivo' | 'tarjeta' | 'webpay';
  payment_reference?: string; // NK-041: N° de Referencia de pago
  payment_proof_url?: string; // NK-041: Captura o comprobante de pago
  paid_amount?: number;       // NK-041: Monto pagado
  payment_date?: string;      // NK-041: Fecha de pago
  payment_notes?: string;     // NK-041: Notas de cobro
  invoice_number?: string;
  folio?: string;
  calendar_color?: string; // NK-061: Color distintivo en agenda/calendario
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

// NK-053: Mantenimiento Periódico Acordado con el Cliente (Lógica separada de recaptación fría)
export interface RecurringMaintenanceSchedule {
  id: string;
  company_id?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_commune?: string;
  equipment_ids: string[];
  equipments_summary: string;
  frequency_months: number; // 3, 6, 12 meses (por defecto 6)
  start_date: string; // YYYY-MM-DD
  next_suggested_date: string; // YYYY-MM-DD (fecha tentativa estimada)
  confirmed_date?: string; // YYYY-MM-DD (fecha fijada con el cliente)
  preferred_time_slot?: string;
  preferred_technician_id?: string;
  notes?: string;
  status: 'programado' | 'por_confirmar' | 'confirmado_agendado' | 'pausado';
  last_notified_at?: string;
  associated_order_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ThermalCalculationInput {
  area_m2: number;
  ceiling_height_m: number;
  sun_exposure: 'baja' | 'media' | 'alta';
  room_type: 'dormitorio' | 'living' | 'oficina' | 'local_comercial' | 'servidores';
  people_count: number;
  electronic_load: 'baja' | 'media' | 'alta';
  climate_zone?: 'templada' | 'costera_calida'; // Costa Rica: 600 BTU/m² (Templada) vs 700 BTU/m² (Cálida/Costera)
  use_type?: 'residencial' | 'comercial';
  electronics_count?: number;
  large_windows_sun?: boolean;
}

export interface ThermalCalculationResult {
  exact_btu: number;
  recommended_btu: number; // 9000, 12000, 15000, 18000, 24000, 30000, 36000, 48000, 60000
  recommended_ton: number; // 0.75, 1.0, 1.25, 1.5, 2.0, 3.0 Ton
  cooling_kw: number;
  heating_kw: number;
  explanation: string;
  recommended_models: string[];
}

export interface AirSettings {
  company_id?: string;
  company_slug?: string;
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
  city?: string;
  company_slogan?: string;
  maintenance_interval_months: number; // 6 meses por defecto
  quality_control_days?: number; // NK-038: Días para control de calidad (ej: 7 días)
  inactive_recovery_months?: number; // NK-038: Meses para recuperación de inactivos (ej: 9 meses)
  pre_expiration_warning_days?: number; // NK-038: Días de aviso de vencimiento (ej: 30 días)
  default_apply_tax?: boolean; // NK-039: IVA Seleccionable por defecto
  default_tax_mode?: 'included' | 'plus' | 'exempt'; // NK-050: Modalidad de IVA por defecto
  hide_technician_amounts?: boolean; // NK-047: Ocultar montos y tarifas a técnicos en tablero
  standard_maintenance_price: number;
  standard_installation_price: number;
  whatsapp_template_recaptacion: string;
  whatsapp_template_agendamiento: string;
  whatsapp_template_terminado: string;
  whatsapp_template_cobro?: string; // NK-044: Plantilla recordatorio de cobro / pago
  whatsapp_template_recurring_confirmation?: string; // NK-053: Confirmación de mantenimiento acordado
  bank_name?: string;               // NK-044: Banco receptor
  bank_account_type?: string;       // NK-044: Tipo de cuenta (Corriente, Vista, Ahorro, etc.)
  bank_account_number?: string;     // NK-044: N° de cuenta
  bank_account_rut?: string;        // NK-044: RUT o Identificación de cuenta
  bank_account_email?: string;      // NK-044: Email para comprobante de transferencia
  warranty_months?: number;
  logo_url?: string;
  tax_id?: string;
  phone_prefix?: string;
  sample_cities?: string[];
  coverage_communes?: string[];
  admin_pin?: string; // NK-052: Clave o PIN de administrador para anular/eliminar movimientos
  service_type_colors?: Record<string, string>; // NK-061: Colores configurables por tipo de servicio
  enable_staff_payroll?: boolean; // NK-062: Módulo activable de gestión de sueldos y pagos del personal
  staff_payroll_title?: string;   // NK-062: Nombre configurable de la sección
  role_permissions?: Record<string, ViewTab[]>; // NK-067: Permisos de acceso a módulos por rol
  finance_settings?: any;
  landing_config?: LandingPageConfig;
}

export interface LandingServiceItem {
  id?: string;
  title: string;
  desc: string;
  price: number;
  icon?: string;
  badge?: string;
  active?: boolean;
}

export interface LandingPageConfig {
  show_landing_page?: boolean;
  // Identidad y Encabezado
  header_logo_url?: string;
  favicon_url?: string;
  fantasy_name?: string;
  slogan?: string;
  footer_copyright?: string;

  // Tema y Colores
  theme_primary_color?: string;
  theme_accent_color?: string;
  theme_secondary_color?: string;
  theme_is_dark?: boolean;
  theme_background_color?: string;

  // Hero Section
  hero_badge?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text?: string;
  hero_phone?: string;
  hero_image_url?: string;
  hero_stat1_value?: string;
  hero_stat1_label?: string;
  hero_stat2_value?: string;
  hero_stat2_label?: string;

  // Servicios
  services?: LandingServiceItem[];
  show_prices?: boolean;
  show_thermal_calculator?: boolean;

  // Cobertura y Contacto
  coverage_communes?: string[];
  phone?: string;
  email?: string;
  address?: string;
  business_hours?: string;
  google_maps_url?: string;
  whatsapp_custom_message?: string;

  // Redes y Reputación
  google_reviews_rating?: string;
  google_reviews_count?: string;
  google_reviews_url?: string;
  social_instagram_url?: string;
  social_facebook_url?: string;
  social_tiktok_url?: string;
}

export interface FixedCosts {
  rent: number;          // Arriendo taller / bodegas / oficina
  salaries: number;      // Nómina y sueldos fijos administrativos y base
  services: number;      // Servicios luz, agua, internet, telefonía
  software: number;      // Software, ERP, hosting, CRM
  marketing: number;     // Publicidad Google Ads, Meta Ads
  transport: number;     // Combustible, seguro y mantención vehicular
  other: number;         // Otros gastos fijos estructurales
}

export type ExpenseCategory = 
  | 'combustible' 
  | 'repuestos_insumos' 
  | 'herramientas' 
  | 'arriendo' 
  | 'nomina_viaticos' 
  | 'servicios_basicos' 
  | 'marketing' 
  | 'impuestos_tasas' 
  | 'proveedores'
  | 'otro'
  | (string & {});

export interface Expense {
  id: string;
  company_id?: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  amount_usd?: number;
  currency?: string;
  payment_method: string;
  status: 'pagado' | 'pendiente';
  supplier?: string;
  invoice_number?: string;
  is_fixed?: boolean;
  notes?: string;
  created_at: string;
}

export interface FinanceSettings {
  target_monthly_profit: number;
  manual_margin_pct?: number | null;
  exchange_rate: number;
  use_dual_currency: boolean;
  uf_value?: number;
  is_currency_swapped?: boolean;
  auto_sync_exchange_rate?: boolean; // NK-049: Actualización automática vía API
  exchange_rate_last_updated?: string; // NK-049: Fecha de última actualización de tasa
}

export type ViewTab = 
  | 'dashboard' 
  | 'recaptacion' 
  | 'agenda' 
  | 'cotizador' 
  | 'inventory' 
  | 'customers' 
  | 'technicians' 
  | 'payroll' // NK-062: Sueldos y pagos del personal
  | 'sales' 
  | 'finances'
  | 'settings'
  | 'landingpage'
  | 'nexus_owner';

export type UserRole = 'nexus_owner' | 'admin' | 'tecnico' | 'ayudante' | 'user';

export interface Company {
  id: string;
  name: string;
  slug?: string;
  schema_name: string;
  allowed_apps?: string[];
  allowed_modules?: string[];
  is_lobby?: boolean;
  created_at?: string;
  updated_at?: string;
  user_count?: number;
}

export interface ProfileUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  company_id?: string;
  is_active?: boolean;
  is_authorized?: boolean;
  created_at?: string;
  last_login?: string;
  avatar_url?: string;
}

// NK-067: Sistema de Permisos y Roles de Acceso a Módulos
export type ConfigurableRole = 'tecnico' | 'ayudante' | 'user';

export interface AppModuleInfo {
  id: ViewTab;
  label: string;
  category: 'operativo' | 'gestion' | 'configuracion';
  description: string;
}

export const APP_MODULES: AppModuleInfo[] = [
  { id: 'dashboard', label: 'Tablero Órdenes', category: 'operativo', description: 'Flujo kanban de órdenes de servicio y avances en vivo' },
  { id: 'agenda', label: 'Agenda & Visitas', category: 'operativo', description: 'Calendario de visitas técnicas y acuerdos periódicos' },
  { id: 'cotizador', label: 'Cotizador BTU', category: 'operativo', description: 'Cálculo de carga térmica y cotización rápida de equipos' },
  { id: 'recaptacion', label: 'Recaptación 6M', category: 'operativo', description: 'Alertas de mantenimientos vencidos y fidelización' },
  { id: 'inventory', label: 'Equipos & Stock', category: 'gestion', description: 'Inventario de equipos, repuestos, gases y accesorios' },
  { id: 'customers', label: 'Clientes', category: 'gestion', description: 'Directorio de clientes residenciales y comerciales' },
  { id: 'technicians', label: 'Técnicos HVAC', category: 'gestion', description: 'Gestión de colaboradores técnicos y comisiones' },
  { id: 'payroll', label: 'Sueldos & Nómina', category: 'gestion', description: 'Liquidaciones de sueldos, pagos y préstamos' },
  { id: 'sales', label: 'Ventas & Cobros', category: 'gestion', description: 'Historial comercial, facturación y estados de cobro' },
  { id: 'finances', label: 'Finanzas & Equilibrio', category: 'gestion', description: 'Punto de equilibrio, costos fijos y egresos' },
  { id: 'landingpage', label: 'Mi Landing Page', category: 'configuracion', description: 'Configuración de web pública y catálogo' },
  { id: 'settings', label: 'Configuración', category: 'configuracion', description: 'Ajustes de la empresa, moneda, IVA y permisos' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, ViewTab[]> = {
  admin: [
    'dashboard', 'recaptacion', 'agenda', 'cotizador', 
    'inventory', 'customers', 'technicians', 'payroll', 
    'sales', 'finances', 'landingpage', 'settings'
  ],
  tecnico: [
    'dashboard', 'agenda', 'cotizador', 'inventory'
  ],
  ayudante: [
    'dashboard', 'agenda'
  ],
  user: [
    'dashboard', 'agenda', 'cotizador', 'inventory', 'customers'
  ]
};

export function canUserAccessTab(
  tab: ViewTab,
  userRole?: string,
  isNexusOwner?: boolean,
  rolePermissions?: Record<string, ViewTab[]>
): boolean {
  if (isNexusOwner) return true;
  const role = (userRole || 'admin').toLowerCase();
  if (role === 'admin' || role === 'nexus_owner' || role === 'owner' || role === 'superadmin') {
    return true;
  }
  const allowed = rolePermissions?.[role] || DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.user || ['dashboard'];
  return allowed.includes(tab);
}


