-- ==============================================================================
-- NEXUS AIR: ESQUEMA SINGLE-SCHEMA MULTI-TENANT
-- Base de Datos: Supabase (qtzpzgwyjptbnipvyjdu)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS air;

-- Permisos del esquema
GRANT USAGE ON SCHEMA air TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA air GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA air GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 1. Tabla de Ajustes y Configuración de Empresa Climatizadora
CREATE TABLE IF NOT EXISTS air.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    company_slug TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    coverage_communes TEXT[] DEFAULT ARRAY['Las Condes', 'Providencia', 'Vitacura', 'Ñuñoa', 'Lo Barnechea', 'Santiago Centro', 'La Reina', 'Peñalolén'],
    logo_url TEXT,
    favicon_url TEXT,
    theme_color_highlight TEXT DEFAULT '#00d2ff',
    theme_color_primary TEXT DEFAULT '#0284c7',
    warranty_months INTEGER DEFAULT 6,
    maintenance_cycle_days INTEGER DEFAULT 180,
    whatsapp_enabled BOOLEAN DEFAULT true,
    whatsapp_template TEXT DEFAULT 'Hola {cliente}, le recordamos que su equipo {equipo} requiere su mantención preventiva semestral de 180 días con Nexus Air.',
    landing_config JSONB DEFAULT '{
      "hero_title": "Especialistas en Climatización y Confort Térmico",
      "hero_subtitle": "Instalación certificada SEC, mantención preventiva profunda y servicio técnico de urgencia.",
      "hero_badge": "Técnicos Certificados SEC • Garantía 6 Meses",
      "phone": "+56 9 3005 7769",
      "email": "contacto@nexusair.cl",
      "address": "Av. Apoquindo 4501, Las Condes",
      "services": [
        {"title": "Mantención Preventiva Profunda", "desc": "Limpieza química de serpentines, sanitización bactericida y control de gas.", "price": 45000},
        {"title": "Instalación Split Inverter", "desc": "Montaje en muro, presurización con nitrógeno, vacío con bomba y puesta en marcha.", "price": 120000},
        {"title": "Recarga de Refrigerante Ecológico", "desc": "Detección de fugas con nitrógeno y carga por peso con balanza de precisión.", "price": 65000}
      ]
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clientes
CREATE TABLE IF NOT EXISTS air.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rut TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    commune TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Equipos de Climatización
CREATE TABLE IF NOT EXISTS air.equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES air.customers(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    btu INTEGER NOT NULL,
    technology TEXT NOT NULL DEFAULT 'inverter',
    refrigerant TEXT NOT NULL DEFAULT 'R410A',
    location_in_property TEXT NOT NULL,
    installation_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE NOT NULL,
    warranty_until DATE,
    status TEXT NOT NULL DEFAULT 'operativo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Técnicos HVAC Certificados
CREATE TABLE IF NOT EXISTS air.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    rut TEXT NOT NULL,
    sec_certified BOOLEAN DEFAULT true,
    specialty TEXT DEFAULT 'Inverter Residencial y Comercial',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Órdenes de Servicio HVAC (Kanban)
CREATE TABLE IF NOT EXISTS air.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES air.customers(id) ON DELETE RESTRICT,
    equipment_id UUID REFERENCES air.equipments(id) ON DELETE SET NULL,
    assigned_technician_id UUID REFERENCES air.technicians(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ingresado',
    priority TEXT NOT NULL DEFAULT 'normal',
    scheduled_date DATE NOT NULL,
    scheduled_time_slot TEXT NOT NULL,
    description TEXT NOT NULL,
    diagnosis TEXT,
    resolution TEXT,
    checklist JSONB DEFAULT '{}'::jsonb,
    total NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventario & Repuestos
CREATE TABLE IF NOT EXISTS air.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    price NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'unidad',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Cotizaciones de Cálculo Térmico
CREATE TABLE IF NOT EXISTS air.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    commune TEXT,
    area_sqm NUMERIC NOT NULL,
    height_m NUMERIC NOT NULL,
    sunlight TEXT NOT NULL,
    occupants INTEGER NOT NULL,
    appliances_heat TEXT NOT NULL,
    insulation TEXT NOT NULL,
    calculated_btu INTEGER NOT NULL,
    recommended_equipment TEXT NOT NULL,
    estimated_price NUMERIC NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON ALL TABLES IN SCHEMA air TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA air TO anon, authenticated, service_role;

ALTER TABLE air.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE air.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE air.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE air.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE air.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE air.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE air.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "air_settings_all" ON air.settings;
CREATE POLICY "air_settings_all" ON air.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "air_customers_all" ON air.customers;
CREATE POLICY "air_customers_all" ON air.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "air_equipments_all" ON air.equipments;
CREATE POLICY "air_equipments_all" ON air.equipments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "air_technicians_all" ON air.technicians;
CREATE POLICY "air_technicians_all" ON air.technicians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "air_orders_all" ON air.orders;
CREATE POLICY "air_orders_all" ON air.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "air_inventory_all" ON air.inventory;
CREATE POLICY "air_inventory_all" ON air.inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "air_quotes_all" ON air.quotes;
CREATE POLICY "air_quotes_all" ON air.quotes FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
