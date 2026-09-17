/**
 * Routing and Real-time ETA Calculation Service
 * Nexus Air HVAC Platform
 * 
 * Features:
 * - Direct geocoding for Chilean communes and LATAM capitals.
 * - Real-time road routing via OSRM (Open Source Routing Machine) API.
 * - Dynamic Traffic Congestion multiplier for peak hours.
 * - Safe caching and fallback to urban Haversine model with circuit factor.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteETA {
  distanceKm: number;
  durationMinutes: number;
  durationFormatted: string;
  distanceFormatted: string;
  trafficStatus: 'normal' | 'moderado' | 'alto';
  source: 'osrm' | 'fallback';
  destinationName: string;
}

// 📍 Catálogo Precargado de Coordenadas de Comunas (RM, Regiones de Chile y Capitales LATAM)
const COMMUNE_COORDINATES: Record<string, Coordinates> = {
  // Santiago - Región Metropolitana
  'providencia': { lat: -33.4314, lng: -70.6093 },
  'maipu': { lat: -33.5111, lng: -70.7580 },
  'maipú': { lat: -33.5111, lng: -70.7580 },
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'santiago centro': { lat: -33.4489, lng: -70.6693 },
  'las condes': { lat: -33.4117, lng: -70.5802 },
  'vitacura': { lat: -33.3989, lng: -70.5898 },
  'lo barnechea': { lat: -33.3541, lng: -70.5186 },
  'ñuñoa': { lat: -33.4569, lng: -70.5976 },
  'nunoa': { lat: -33.4569, lng: -70.5976 },
  'la reina': { lat: -33.4475, lng: -70.5478 },
  'peñalolen': { lat: -33.4831, lng: -70.5367 },
  'penalolen': { lat: -33.4831, lng: -70.5367 },
  'macul': { lat: -33.4883, lng: -70.5989 },
  'la florida': { lat: -33.5227, lng: -70.5983 },
  'puente alto': { lat: -33.6117, lng: -70.5758 },
  'san miguel': { lat: -33.4939, lng: -70.6517 },
  'san joaquin': { lat: -33.4950, lng: -70.6272 },
  'san joaquín': { lat: -33.4950, lng: -70.6272 },
  'la cisterna': { lat: -33.5286, lng: -70.6653 },
  'el bosque': { lat: -33.5617, lng: -70.6728 },
  'san bernardo': { lat: -33.5928, lng: -70.7042 },
  'pedro aguirre cerda': { lat: -33.4889, lng: -70.6806 },
  'lo espejo': { lat: -33.5206, lng: -70.6892 },
  'estacion central': { lat: -33.4619, lng: -70.6975 },
  'estación central': { lat: -33.4619, lng: -70.6975 },
  'cerrillos': { lat: -33.4989, lng: -70.7167 },
  'pudahuel': { lat: -33.4417, lng: -70.7639 },
  'cerro navia': { lat: -33.4242, lng: -70.7328 },
  'lo prado': { lat: -33.4439, lng: -70.7258 },
  'quinta normal': { lat: -33.4339, lng: -70.6936 },
  'renca': { lat: -33.4028, lng: -70.7139 },
  'conchali': { lat: -33.3853, lng: -70.6750 },
  'conchalí': { lat: -33.3853, lng: -70.6750 },
  'independencia': { lat: -33.4189, lng: -70.6597 },
  'recoleta': { lat: -33.4069, lng: -70.6403 },
  'huechuraba': { lat: -33.3742, lng: -70.6389 },
  'quilicura': { lat: -33.3639, lng: -70.7333 },
  'colina': { lat: -33.2031, lng: -70.6750 },
  'lampa': { lat: -33.2833, lng: -70.8667 },
  'padre hurtado': { lat: -33.5667, lng: -70.8167 },
  'penaflor': { lat: -33.6167, lng: -70.8833 },
  'peñaflor': { lat: -33.6167, lng: -70.8833 },
  'talagante': { lat: -33.6667, lng: -70.9333 },
  'buin': { lat: -33.7333, lng: -70.7333 },
  'paine': { lat: -33.8167, lng: -70.7500 },
  'melipilla': { lat: -33.6853, lng: -71.2144 },

  // Ciudades Principales de Chile
  'vina del mar': { lat: -33.0245, lng: -71.5518 },
  'viña del mar': { lat: -33.0245, lng: -71.5518 },
  'valparaiso': { lat: -33.0472, lng: -71.6127 },
  'valparaíso': { lat: -33.0472, lng: -71.6127 },
  'concepcion': { lat: -36.8201, lng: -73.0444 },
  'concepción': { lat: -36.8201, lng: -73.0444 },
  'la serena': { lat: -29.9027, lng: -71.2519 },
  'coquimbo': { lat: -29.9533, lng: -71.3436 },
  'antofagasta': { lat: -23.6509, lng: -70.3975 },
  'temuco': { lat: -38.7359, lng: -72.5904 },
  'rancagua': { lat: -34.1708, lng: -70.7444 },
  'puerto montt': { lat: -41.4693, lng: -72.9424 },
  'iquique': { lat: -20.2133, lng: -70.1503 },
  'arica': { lat: -18.4783, lng: -70.3126 },
  'talca': { lat: -35.4264, lng: -71.6554 },
  'chillan': { lat: -36.6066, lng: -72.1034 },
  'chillán': { lat: -36.6066, lng: -72.1034 },

  // Ciudades y Capitales LATAM
  'san jose': { lat: 9.9281, lng: -84.0907 },
  'san josé': { lat: 9.9281, lng: -84.0907 },
  'lima': { lat: -12.0464, lng: -77.0428 },
  'bogota': { lat: 4.7110, lng: -74.0721 },
  'bogotá': { lat: 4.7110, lng: -74.0721 },
  'caracas': { lat: 10.4806, lng: -66.9036 },
  'ciudad de mexico': { lat: 19.4326, lng: -99.1332 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
};

// Limpieza y normalización de textos para búsqueda rápida
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Obtiene las coordenadas del cliente a partir de su comuna, ciudad o dirección.
 */
export function getCustomerCoordinates(
  commune?: string,
  city?: string,
  address?: string
): Coordinates {
  // 1. Probar con la comuna
  if (commune) {
    const norm = normalizeText(commune);
    if (COMMUNE_COORDINATES[norm]) return COMMUNE_COORDINATES[norm];

    // Búsqueda por substring
    for (const [key, coords] of Object.entries(COMMUNE_COORDINATES)) {
      if (norm.includes(normalizeText(key)) || normalizeText(key).includes(norm)) {
        return coords;
      }
    }
  }

  // 2. Probar con la ciudad
  if (city) {
    const normCity = normalizeText(city);
    if (COMMUNE_COORDINATES[normCity]) return COMMUNE_COORDINATES[normCity];
  }

  // 3. Si en la dirección viene la comuna mencionada (ej: "Av. Providencia 1234, Providencia")
  if (address) {
    const normAddr = normalizeText(address);
    for (const [key, coords] of Object.entries(COMMUNE_COORDINATES)) {
      if (normAddr.includes(normalizeText(key))) {
        return coords;
      }
    }
  }

  // Fallback por defecto: Santiago Centro
  return { lat: -33.4489, lng: -70.6693 };
}

/**
 * Cálculo de distancia Haversine en línea recta con factor de curvas urbanas (1.35x)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;

  // Factor de trama vial urbana (las calles nunca son líneas rectas)
  return Math.round(straightLine * 1.35 * 10) / 10;
}

/**
 * Evalúa las condiciones de tráfico según la hora local de la ciudad
 */
function getTrafficConditions(): { multiplier: number; status: 'normal' | 'moderado' | 'alto' } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour + minute / 60;

  // Hora Punta Mañana (07:30 a 09:45)
  if (timeVal >= 7.5 && timeVal <= 9.75) {
    return { multiplier: 1.35, status: 'alto' };
  }
  // Hora Punta Tarde (17:30 a 20:15)
  if (timeVal >= 17.5 && timeVal <= 20.25) {
    return { multiplier: 1.40, status: 'alto' };
  }
  // Horario concurrido diurno (12:00 a 14:30)
  if (timeVal >= 12.0 && timeVal <= 14.5) {
    return { multiplier: 1.20, status: 'moderado' };
  }

  // Horario fluido
  return { multiplier: 1.10, status: 'normal' };
}

// In-Memory Cache para no saturar el servidor público de OSRM
interface CacheEntry {
  timestamp: number;
  origin: Coordinates;
  destination: Coordinates;
  result: RouteETA;
}

let lastRouteCache: CacheEntry | null = null;

/**
 * Calcula la ruta y el tiempo estimado (ETA) real entre el GPS del técnico y el cliente.
 * Utiliza OSRM API (vía red vial real) con fallback a modelo Haversine urbano.
 */
export async function calculateLiveRouteETA(
  origin: Coordinates,
  destination: Coordinates,
  destinationName: string = 'Domicilio del Cliente'
): Promise<RouteETA> {
  const now = Date.now();
  const traffic = getTrafficConditions();

  // 1. Revisar Caché (si se consultó hace menos de 25 segundos y el técnico no se ha movido más de 200m)
  if (lastRouteCache && now - lastRouteCache.timestamp < 25000) {
    const distToPrevOrigin = calculateHaversineDistanceKm(
      origin.lat,
      origin.lng,
      lastRouteCache.origin.lat,
      lastRouteCache.origin.lng
    );
    if (distToPrevOrigin < 0.2) {
      return lastRouteCache.result;
    }
  }

  // 2. Intentar consultar OSRM Routing API (Calles y Autopistas Reales)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2600); // 2.6s timeout

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const rawDistanceKm = route.distance / 1000;
        const rawDurationMinutes = route.duration / 60;

        // Ajuste con el factor de congestión/tráfico urbano actual
        const adjustedDurationMinutes = Math.max(
          3,
          Math.round(rawDurationMinutes * traffic.multiplier)
        );
        const distanceKm = Math.round(rawDistanceKm * 10) / 10;

        const durationFormatted = formatDuration(adjustedDurationMinutes);
        const distanceFormatted = `${distanceKm.toFixed(1)} km`;

        const result: RouteETA = {
          distanceKm,
          durationMinutes: adjustedDurationMinutes,
          durationFormatted,
          distanceFormatted,
          trafficStatus: traffic.status,
          source: 'osrm',
          destinationName,
        };

        lastRouteCache = {
          timestamp: now,
          origin,
          destination,
          result,
        };

        return result;
      }
    }
  } catch (err) {
    // Si OSRM falla o da timeout, continuamos silenciosamente al fallback matemático
    console.info('OSRM router no disponible o timeout, ejecutando modelo de respaldo vial:', err);
  }

  // 3. Fallback: Modelo Matemático Vial de Alta Precisión
  const distanceKm = calculateHaversineDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  // Velocidad promedio urbana en ciudad (considerando semáforos y paradas): ~28 - 35 km/h
  const avgSpeedKmh = traffic.status === 'alto' ? 24 : 32;
  const rawMinutes = (distanceKm / avgSpeedKmh) * 60;
  const adjustedDurationMinutes = Math.max(4, Math.round(rawMinutes));

  const durationFormatted = formatDuration(adjustedDurationMinutes);
  const distanceFormatted = `${distanceKm.toFixed(1)} km`;

  const fallbackResult: RouteETA = {
    distanceKm,
    durationMinutes: adjustedDurationMinutes,
    durationFormatted,
    distanceFormatted,
    trafficStatus: traffic.status,
    source: 'fallback',
    destinationName,
  };

  lastRouteCache = {
    timestamp: now,
    origin,
    destination,
    result: fallbackResult,
  };

  return fallbackResult;
}

function formatDuration(minutes: number): string {
  if (minutes <= 2) {
    return '1 - 2 min (Llegando al domicilio)';
  }
  if (minutes < 10) {
    return `${minutes} min aprox.`;
  }
  if (minutes <= 55) {
    // Margen realista de ± 3 min (ej: 40 - 45 min)
    const minRange = Math.max(5, Math.floor(minutes / 5) * 5);
    const maxRange = minRange + 5;
    return `${minRange} - ${maxRange} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (remMinutes === 0) {
    return `${hours} h aprox.`;
  }
  return `${hours} h ${remMinutes} min`;
}
