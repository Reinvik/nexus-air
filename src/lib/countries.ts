export interface LatinCountry {
  code: string;
  name: string;
  flag: string;
  currency_symbol: string;
  currency_code: string;
  phone_prefix: string;
  tax_id_label: string;
  tax_rate: number;
  tax_name: string;
  division_label: string;
  standard_maintenance_price_default: number;
  standard_installation_price_default: number;
  sample_cities: string[];
}

export const LATIN_AMERICAN_COUNTRIES: LatinCountry[] = [
  {
    code: 'CR',
    name: 'Costa Rica',
    flag: '🇨🇷',
    currency_symbol: '₡',
    currency_code: 'CRC',
    phone_prefix: '+506',
    tax_id_label: 'Cédula Jurídica / DIMEX',
    tax_rate: 0.13,
    tax_name: 'IVA',
    division_label: 'Cantón / Provincia',
    standard_maintenance_price_default: 35000,
    standard_installation_price_default: 95000,
    sample_cities: ['San José', 'Escazú', 'Santa Ana', 'Alajuela', 'Heredia', 'Cartago', 'Puntarenas', 'Liberia']
  },
  {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    currency_symbol: '$',
    currency_code: 'USD',
    phone_prefix: '+58',
    tax_id_label: 'RIF',
    tax_rate: 0.16,
    tax_name: 'IVA',
    division_label: 'Municipio / Estado',
    standard_maintenance_price_default: 45,
    standard_installation_price_default: 120,
    sample_cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Lechería', 'Margarita']
  },
  {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    currency_symbol: 'S/',
    currency_code: 'PEN',
    phone_prefix: '+51',
    tax_id_label: 'RUC',
    tax_rate: 0.18,
    tax_name: 'IGV',
    division_label: 'Distrito / Provincia',
    standard_maintenance_price_default: 150,
    standard_installation_price_default: 420,
    sample_cities: ['Lima', 'Miraflores', 'San Isidro', 'Surco', 'Arequipa', 'Trujillo', 'Piura', 'Chiclayo']
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    currency_symbol: '$',
    currency_code: 'CLP',
    phone_prefix: '+56',
    tax_id_label: 'RUT',
    tax_rate: 0.19,
    tax_name: 'IVA',
    division_label: 'Comuna / Región',
    standard_maintenance_price_default: 45000,
    standard_installation_price_default: 120000,
    sample_cities: ['Las Condes', 'Providencia', 'Vitacura', 'Ñuñoa', 'Santiago Centro', 'Lo Barnechea', 'Viña del Mar', 'Concepción']
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currency_symbol: '$',
    currency_code: 'COP',
    phone_prefix: '+57',
    tax_id_label: 'NIT',
    tax_rate: 0.19,
    tax_name: 'IVA',
    division_label: 'Municipio / Departamento',
    standard_maintenance_price_default: 180000,
    standard_installation_price_default: 450000,
    sample_cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Santa Marta']
  },
  {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    currency_symbol: '$',
    currency_code: 'MXN',
    phone_prefix: '+52',
    tax_id_label: 'RFC',
    tax_rate: 0.16,
    tax_name: 'IVA',
    division_label: 'Municipio / Alcaldía',
    standard_maintenance_price_default: 850,
    standard_installation_price_default: 2400,
    sample_cities: ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Mérida', 'Querétaro']
  },
  {
    code: 'PA',
    name: 'Panamá',
    flag: '🇵🇦',
    currency_symbol: '$',
    currency_code: 'USD',
    phone_prefix: '+507',
    tax_id_label: 'RUC',
    tax_rate: 0.07,
    tax_name: 'ITBMS',
    division_label: 'Distrito / Corregimiento',
    standard_maintenance_price_default: 50,
    standard_installation_price_default: 140,
    sample_cities: ['Ciudad de Panamá', 'San Miguelito', 'Costa del Este', 'David', 'Colón', 'La Chorrera']
  },
  {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    currency_symbol: '$',
    currency_code: 'USD',
    phone_prefix: '+593',
    tax_id_label: 'RUC',
    tax_rate: 0.15,
    tax_name: 'IVA',
    division_label: 'Cantón / Provincia',
    standard_maintenance_price_default: 45,
    standard_installation_price_default: 130,
    sample_cities: ['Quito', 'Guayaquil', 'Cuenca', 'Manta', 'Ambato', 'Machala', 'Samborondón']
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    currency_symbol: '$',
    currency_code: 'ARS',
    phone_prefix: '+54',
    tax_id_label: 'CUIT',
    tax_rate: 0.21,
    tax_name: 'IVA',
    division_label: 'Partido / Localidad',
    standard_maintenance_price_default: 55000,
    standard_installation_price_default: 150000,
    sample_cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata']
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    flag: '🇩🇴',
    currency_symbol: 'RD$',
    currency_code: 'DOP',
    phone_prefix: '+1',
    tax_id_label: 'RNC',
    tax_rate: 0.18,
    tax_name: 'ITBIS',
    division_label: 'Municipio / Provincia',
    standard_maintenance_price_default: 2500,
    standard_installation_price_default: 7000,
    sample_cities: ['Santo Domingo', 'Santiago de los Caballeros', 'Punta Cana', 'La Romana', 'Puerto Plata']
  },
  {
    code: 'UY',
    name: 'Uruguay',
    flag: '🇺🇾',
    currency_symbol: '$',
    currency_code: 'UYU',
    phone_prefix: '+598',
    tax_id_label: 'RUT',
    tax_rate: 0.22,
    tax_name: 'IVA',
    division_label: 'Departamento / Municipio',
    standard_maintenance_price_default: 2200,
    standard_installation_price_default: 5800,
    sample_cities: ['Montevideo', 'Punta del Este', 'Canelones', 'Maldonado', 'Salto']
  },
  {
    code: 'BO',
    name: 'Bolivia',
    flag: '🇧🇴',
    currency_symbol: 'Bs.',
    currency_code: 'BOB',
    phone_prefix: '+591',
    tax_id_label: 'NIT',
    tax_rate: 0.13,
    tax_name: 'IVA',
    division_label: 'Municipio / Departamento',
    standard_maintenance_price_default: 300,
    standard_installation_price_default: 850,
    sample_cities: ['Santa Cruz de la Sierra', 'La Paz', 'Cochabamba', 'Sucre', 'Tarija']
  },
  {
    code: 'PY',
    name: 'Paraguay',
    flag: '🇵🇾',
    currency_symbol: '₲',
    currency_code: 'PYG',
    phone_prefix: '+595',
    tax_id_label: 'RUC',
    tax_rate: 0.10,
    tax_name: 'IVA',
    division_label: 'Distrito / Departamento',
    standard_maintenance_price_default: 250000,
    standard_installation_price_default: 700000,
    sample_cities: ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Encarnación']
  },
  {
    code: 'GT',
    name: 'Guatemala',
    flag: '🇬🇹',
    currency_symbol: 'Q',
    currency_code: 'GTQ',
    phone_prefix: '+502',
    tax_id_label: 'NIT',
    tax_rate: 0.12,
    tax_name: 'IVA',
    division_label: 'Municipio / Departamento',
    standard_maintenance_price_default: 350,
    standard_installation_price_default: 950,
    sample_cities: ['Ciudad de Guatemala', 'Mixco', 'Villa Nueva', 'Quetzaltenango', 'Antigua Guatemala']
  },
  {
    code: 'SV',
    name: 'El Salvador',
    flag: '🇸🇻',
    currency_symbol: '$',
    currency_code: 'USD',
    phone_prefix: '+503',
    tax_id_label: 'NIT / NRC',
    tax_rate: 0.13,
    tax_name: 'IVA',
    division_label: 'Municipio / Departamento',
    standard_maintenance_price_default: 40,
    standard_installation_price_default: 110,
    sample_cities: ['San Salvador', 'Santa Ana', 'San Miguel', 'Soyapango', 'Santa Tecla']
  },
  {
    code: 'HN',
    name: 'Honduras',
    flag: '🇭🇳',
    currency_symbol: 'L',
    currency_code: 'HNL',
    phone_prefix: '+504',
    tax_id_label: 'RTN',
    tax_rate: 0.15,
    tax_name: 'ISV',
    division_label: 'Municipio / Departamento',
    standard_maintenance_price_default: 900,
    standard_installation_price_default: 2500,
    sample_cities: ['Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'Roatán']
  }
];

export function findCountry(codeOrName?: string): LatinCountry {
  if (!codeOrName) return LATIN_AMERICAN_COUNTRIES.find(c => c.code === 'CL')!;
  const term = codeOrName.trim().toLowerCase();
  return (
    LATIN_AMERICAN_COUNTRIES.find(c => c.code.toLowerCase() === term) ||
    LATIN_AMERICAN_COUNTRIES.find(c => c.name.toLowerCase() === term) ||
    LATIN_AMERICAN_COUNTRIES.find(c => c.code === 'CL')!
  );
}

export function formatAirPrice(amount: number, currencySymbol: string = '$'): string {
  const formatted = new Intl.NumberFormat('es-CL').format(amount);
  return `${currencySymbol} ${formatted}`;
}
