import { ThermalCalculationInput, ThermalCalculationResult } from '../types';

export const STANDARD_BTU_SIZES = [9000, 12000, 15000, 18000, 24000, 30000, 36000, 48000, 60000];

export const BTU_TO_TON_MAP: Record<number, number> = {
  9000: 0.75,
  12000: 1.0,
  15000: 1.25,
  18000: 1.5,
  24000: 2.0,
  30000: 2.5,
  36000: 3.0,
  48000: 4.0,
  60000: 5.0,
};

/**
 * Tabla Oficial de Rangos Costa Rica:
 * Hasta 15 m²: 9.000 BTU Residencial / 12.000 BTU Comercial (0.75 Ton)
 * 15 a 20 m²: 12.000 BTU Residencial / 15.000 BTU Comercial (1.0 Ton)
 * 20 a 25 m²: 15.000 BTU Residencial / 18.000 BTU Comercial (1.25 Ton)
 * 25 a 35 m²: 18.000 BTU Residencial / 24.000 BTU Comercial (1.5 Ton)
 * 35 a 50 m²: 24.000 BTU Residencial / 30.000 BTU Comercial (2.0 Ton)
 * 50 a 75 m²: 36.000 BTU Residencial / 48.000 BTU Comercial (3.0 Ton)
 */
export function getCostaRicaTableBtu(area_m2: number, isCommercial: boolean): { btu: number; ton: number } {
  if (area_m2 <= 15) {
    return isCommercial ? { btu: 12000, ton: 1.0 } : { btu: 9000, ton: 0.75 };
  } else if (area_m2 <= 20) {
    return isCommercial ? { btu: 15000, ton: 1.25 } : { btu: 12000, ton: 1.0 };
  } else if (area_m2 <= 25) {
    return isCommercial ? { btu: 18000, ton: 1.5 } : { btu: 15000, ton: 1.25 };
  } else if (area_m2 <= 35) {
    return isCommercial ? { btu: 24000, ton: 2.0 } : { btu: 18000, ton: 1.5 };
  } else if (area_m2 <= 50) {
    return isCommercial ? { btu: 30000, ton: 2.5 } : { btu: 24000, ton: 2.0 };
  } else if (area_m2 <= 75) {
    return isCommercial ? { btu: 48000, ton: 4.0 } : { btu: 36000, ton: 3.0 };
  } else {
    return isCommercial ? { btu: 60000, ton: 5.0 } : { btu: 48000, ton: 4.0 };
  }
}

export function calculateThermalLoad(input: ThermalCalculationInput): ThermalCalculationResult {
  const {
    area_m2,
    ceiling_height_m = 2.5,
    sun_exposure,
    room_type,
    people_count = 2,
    electronic_load = 'baja',
    climate_zone = 'costera_calida', // 'templada' (600 BTU/m²) o 'costera_calida' (700 BTU/m²)
    use_type = 'residencial',
    electronics_count = 0,
    large_windows_sun = false,
  } = input;

  const isCommercial = use_type === 'comercial' || room_type === 'local_comercial' || room_type === 'servidores' || room_type === 'oficina';

  // Factor base en Costa Rica: 600 BTU/m² (zonas templadas Cartago/San José) o 700 BTU/m² (zonas costeras cálidas Guanacaste, Puntarenas, Limón)
  const baseFactor = climate_zone === 'templada' ? 600 : 700;
  let calculatedBtu = area_m2 * baseFactor;

  // Factor de uso comercial
  if (isCommercial && use_type !== 'comercial') {
    calculatedBtu *= 1.15;
  } else if (use_type === 'comercial') {
    calculatedBtu *= 1.20;
  }

  // Factor 1: Exposición solar (ventanas grandes al sol de la tarde o exposición alta: +15%)
  if (large_windows_sun || sun_exposure === 'alta') {
    calculatedBtu *= 1.15;
  } else if (sun_exposure === 'media') {
    calculatedBtu *= 1.07;
  }

  // Factor 2: Altura del techo (estándar 2.5m; si supera 3.0m se añade +10%)
  if (ceiling_height_m > 3.0) {
    calculatedBtu *= 1.10;
  } else if (ceiling_height_m > 2.6) {
    calculatedBtu *= (1 + ((ceiling_height_m - 2.5) * 0.05));
  }

  // Factor 3: Número de personas (base de 2 personas, cada persona adicional suma 600 BTU)
  const extraPeople = Math.max(0, people_count - 2);
  const peopleBtu = extraPeople * 600;
  calculatedBtu += peopleBtu;

  // Factor 4: Equipos electrónicos (+800 BTU por equipo importante constante)
  let electronicsBtu = (electronics_count || 0) * 800;
  if (electronicsBtu === 0) {
    if (electronic_load === 'media') electronicsBtu = 1200;
    if (electronic_load === 'alta') electronicsBtu = 3200;
  }
  calculatedBtu += electronicsBtu;

  const totalExactBtu = Math.round(calculatedBtu);

  // Obtener referencia por tabla oficial para contrastar
  const tableRef = getCostaRicaTableBtu(area_m2, isCommercial);

  // Escoger tamaño estándar de equipo que cubra la carga exacta o la sugerida por tabla
  let recommendedBtu = STANDARD_BTU_SIZES[STANDARD_BTU_SIZES.length - 1];
  const targetBtu = Math.max(totalExactBtu, tableRef.btu);
  for (const size of STANDARD_BTU_SIZES) {
    if (size >= targetBtu) {
      recommendedBtu = size;
      break;
    }
  }

  // Equivalencia en Toneladas de refrigeración
  const recommendedTon = BTU_TO_TON_MAP[recommendedBtu] || Number((recommendedBtu / 12000).toFixed(2));

  // Conversión a Kilowatts térmicos (1 kW = 3412.142 BTU/h)
  const coolingKw = Number((recommendedBtu / 3412.142).toFixed(2));
  const heatingKw = Number((coolingKw * 1.08).toFixed(2));

  const zoneText = climate_zone === 'costera_calida' ? 'Zona Cálida/Costera (700 BTU/m²)' : 'Zona Templada/Meseta (600 BTU/m²)';
  const explanation = `Para un espacio de ${area_m2} m² (${isCommercial ? 'Comercial' : 'Residencial'}) en ${zoneText}, con ${people_count} personas y exposición ${sun_exposure}, la carga calculada es de ${totalExactBtu.toLocaleString()} BTU/h. Se recomienda equipo Inverter de ${recommendedBtu.toLocaleString()} BTU (${recommendedTon} Toneladas / ${coolingKw} kW) para climatización continua y eficiente.`;

  const recommendedModels: string[] = [];
  if (recommendedBtu === 9000) {
    recommendedModels.push('Ecold Inverter 9k BTU SEER 21.5 Wifi', 'Midea Breezeless Inverter 9.000', 'Carrier X-Power Inverter 9k');
  } else if (recommendedBtu === 12000) {
    recommendedModels.push('Ecold Inverter 12k BTU SEER 21.5 Wifi (1 Ton)', 'Midea Mission Pro 12k R32', 'Daikin Sensira 12k Inverter');
  } else if (recommendedBtu === 15000) {
    recommendedModels.push('Ecold Inverter 15k BTU (1.25 Ton)', 'Gree Lomo 15k Inverter', 'Anwo V-Inverter 15k');
  } else if (recommendedBtu === 18000) {
    recommendedModels.push('Ecold Inverter 18k BTU SEER 20 Wifi (1.5 Ton)', 'Midea Breezeless 18k', 'Carrier Optima 18k');
  } else if (recommendedBtu === 24000) {
    recommendedModels.push('Ecold Inverter 24k BTU SEER 20 (2.0 Ton)', 'Samsung WindFree 24k Inverter', 'Daikin SkyAir 24k');
  } else if (recommendedBtu === 30000 || recommendedBtu === 36000) {
    recommendedModels.push('Ecold Piso-Cielo / Cassette 36k (3.0 Ton)', 'Carrier Comfort Inverter 36k', 'Midea Commercial Ducto 36k');
  } else {
    recommendedModels.push('Carrier Comercial Inverter 48k/60k (4.0 - 5.0 Ton)', 'Daikin VRV / Alta Presión');
  }

  return {
    exact_btu: totalExactBtu,
    recommended_btu: recommendedBtu,
    recommended_ton: recommendedTon,
    cooling_kw: coolingKw,
    heating_kw: heatingKw,
    explanation,
    recommended_models: recommendedModels,
  };
}
