import { AirSettings, LandingPageConfig, LandingServiceItem } from '../types';

export const DEFAULT_HVAC_SERVICES: LandingServiceItem[] = [
  {
    id: 'svc-1',
    title: 'Mantención Preventiva Profunda',
    desc: 'Limpieza química integral de serpentines evaporador/condensador, sanitización bactericida y control de presiones de gas.',
    price: 45000,
    badge: 'Más Solicitado',
    active: true,
  },
  {
    id: 'svc-2',
    title: 'Instalación Split Inverter',
    desc: 'Montaje profesional en muro con soportes reforzados, vacío con bomba de 2 etapas, presurización y puesta en marcha.',
    price: 120000,
    badge: 'Garantía SEC',
    active: true,
  },
  {
    id: 'svc-3',
    title: 'Recarga y Detección de Fugas',
    desc: 'Prueba de estanqueidad con nitrógeno seco a alta presión y recarga pesada en balanza digital con refrigerante ecológico (R410A / R32).',
    price: 65000,
    badge: 'Ecológico',
    active: true,
  },
  {
    id: 'svc-4',
    title: 'Diagnóstico Electrónico & Reparación',
    desc: 'Revisión exhaustiva de tarjetas lógicas inverter, sensores NTC, condensadores de arranque y compresores.',
    price: 35000,
    badge: 'Especialista',
    active: true,
  },
];

export const HVAC_COLOR_PRESETS = [
  {
    id: 'cyan-nexus',
    name: 'Cian Smartlean / Nexus Air',
    primary: '#00d2ff',
    accent: '#0284c7',
    desc: 'Look tecnológico moderno de alta visibilidad',
    bg: '#ffffff',
  },
  {
    id: 'blue-cold',
    name: 'Azul Frío Polar',
    primary: '#2563eb',
    accent: '#1d4ed8',
    desc: 'Clásico corporativo de climatización y frío',
    bg: '#ffffff',
  },
  {
    id: 'emerald-eco',
    name: 'Esmeralda Eco Inverter',
    primary: '#10b981',
    accent: '#059669',
    desc: 'Enfocado en eficiencia energética y sustentabilidad',
    bg: '#ffffff',
  },
  {
    id: 'orange-speed',
    name: 'Naranja Urgencias',
    primary: '#f97316',
    accent: '#ea580c',
    desc: 'Dinamismo, rapidez de atención y emergencia 24/7',
    bg: '#ffffff',
  },
  {
    id: 'indigo-premium',
    name: 'Índigo Confort Premium',
    primary: '#6366f1',
    accent: '#4f46e5',
    desc: 'Elegancia para proyectos residenciales y oficinas',
    bg: '#ffffff',
  },
  {
    id: 'dark-slate',
    name: 'Grafito & Acero Pro',
    primary: '#0f172a',
    accent: '#334155',
    desc: 'Sobriedad industrial para empresas e ingeniería HVAC',
    bg: '#ffffff',
  },
];

export const HVAC_HERO_PRESETS = [
  {
    id: 'split-modern',
    name: 'Split Muro Minimalista',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200',
  },
  {
    id: 'living-comfort',
    name: 'Confort Familiar Climatizado',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200',
  },
  {
    id: 'tech-tools',
    name: 'Técnico Especialista en Manómetros',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200',
  },
  {
    id: 'modern-home',
    name: 'Arquitectura y Climatización Pro',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
  },
];

export const DEFAULT_COVERAGE_COMMUNES = [
  'Las Condes',
  'Providencia',
  'Ñuñoa',
  'Santiago Centro',
  'Vitacura',
  'Lo Barnechea',
  'La Reina',
  'Peñalolén',
  'Macul',
  'La Florida',
  'San Miguel',
  'Maipú',
  'Chicureo / Colina'
];

/**
 * Resuelve la configuración efectiva y fiel de la Landing Page para la empresa HVAC activa,
 * garantizando que lo que se edite en el módulo de personalización sea exactamente lo que
 * visualiza el cliente final en su URL pública (`/?t=slug`).
 */
export function resolveAirLandingConfig(
  settings: AirSettings | null,
  overrides?: LandingPageConfig
): Required<LandingPageConfig> {
  const cfg: LandingPageConfig = {
    ...(settings?.landing_config || {}),
    ...(overrides || {}),
  };

  const companyName = settings?.fantasy_name || settings?.company_name || 'Nexus Air';
  const companyPhone = cfg.phone || settings?.phone || '+56 9 3005 7769';
  const companyAddress = cfg.address || settings?.address || (settings?.city ? `${settings.city}, ${settings.country || 'Chile'}` : 'Santiago, Chile');
  const companyEmail = cfg.email || settings?.email || 'contacto@nexusair.cl';
  const companyLogo = cfg.header_logo_url || settings?.logo_url || '';

  const themePrimary = cfg.theme_primary_color || '#00d2ff';
  const themeAccent = cfg.theme_accent_color || '#0284c7';
  const themeSecondary = cfg.theme_secondary_color || themeAccent;

  const rawDark = cfg.theme_is_dark;
  const isDarkExplicit = (rawDark === true || (rawDark as any) === 'true') ? true : ((rawDark === false || (rawDark as any) === 'false') ? false : undefined);
  const resolvedIsDark = isDarkExplicit !== undefined ? isDarkExplicit : false;

  return {
    show_landing_page: cfg.show_landing_page !== false,

    // Identidad y Marca
    header_logo_url: companyLogo,
    favicon_url: cfg.favicon_url || '',
    fantasy_name: cfg.fantasy_name || companyName,
    slogan: cfg.slogan || settings?.company_slogan || 'Servicios Certificados de Climatización',
    footer_copyright: cfg.footer_copyright || `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`,

    // Tema y Colores
    theme_primary_color: themePrimary,
    theme_accent_color: themeAccent,
    theme_secondary_color: themeSecondary,
    theme_is_dark: resolvedIsDark,
    theme_background_color: cfg.theme_background_color || (resolvedIsDark ? '#080c16' : '#f8fafc'),

    // Hero Section
    hero_badge: cfg.hero_badge || 'Técnicos Certificados SEC • Garantía 6 Meses',
    hero_title: cfg.hero_title || `Especialistas en Climatización y Confort Térmico`,
    hero_subtitle: cfg.hero_subtitle || 'Instalación certificada SEC, mantención preventiva profunda y servicio técnico de urgencia para hogares y empresas.',
    hero_cta_text: cfg.hero_cta_text || 'Agendar Visita a Domicilio',
    hero_phone: companyPhone,
    hero_image_url: cfg.hero_image_url || '',
    hero_stat1_value: cfg.hero_stat1_value || '4.9/5',
    hero_stat1_label: cfg.hero_stat1_label || 'Ranking Clientes',
    hero_stat2_value: cfg.hero_stat2_value || `${settings?.warranty_months || 6} Meses`,
    hero_stat2_label: cfg.hero_stat2_label || 'Garantía Estándar',

    // Servicios
    services: cfg.services && cfg.services.length > 0 ? cfg.services : DEFAULT_HVAC_SERVICES,
    show_prices: cfg.show_prices !== false,
    show_thermal_calculator: cfg.show_thermal_calculator !== false,

    // Cobertura y Contacto
    coverage_communes: cfg.coverage_communes && cfg.coverage_communes.length > 0 ? cfg.coverage_communes : DEFAULT_COVERAGE_COMMUNES,
    phone: companyPhone,
    email: companyEmail,
    address: companyAddress,
    business_hours: cfg.business_hours || 'Lunes a Viernes: 08:30 - 18:30 | Sábados: 09:00 - 14:00',
    google_maps_url: cfg.google_maps_url || (companyAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyAddress)}` : ''),
    whatsapp_custom_message: cfg.whatsapp_custom_message || `Hola ${companyName}, me gustaría consultar por servicios de climatización y cotizar una visita técnica.`,

    // Redes Sociales y Reseñas
    google_reviews_rating: cfg.google_reviews_rating || '4.9',
    google_reviews_count: cfg.google_reviews_count || '120+',
    google_reviews_url: cfg.google_reviews_url || '',
    social_instagram_url: cfg.social_instagram_url || '',
    social_facebook_url: cfg.social_facebook_url || '',
    social_tiktok_url: cfg.social_tiktok_url || '',
  };
}
