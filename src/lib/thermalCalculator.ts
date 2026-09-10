import { ThermalCalculationInput, ThermalCalculationResult } from '../types';

export const STANDARD_BTU_SIZES = [9000, 12000, 18000, 24000, 36000, 48000, 60000];

export function calculateThermalLoad(input: ThermalCalculationInput): ThermalCalculationResult {
  const {
    area_m2,
    ceiling_height_m = 2.4,
    sun_exposure,
    room_type,
    people_count = 1,
    electronic_load = 'baja',
  } = input;

  // Base factor en Chile: ~600 BTU por m² para altura estándar de 2.4m
  const heightRatio = Math.max(1, ceiling_height_m / 2.4);
  let baseBtu = area_m2 * 600 * heightRatio;

  // Ajuste por exposición solar
  let sunMultiplier = 1.0;
  if (sun_exposure === 'media') sunMultiplier = 1.15;
  if (sun_exposure === 'alta') sunMultiplier = 1.30;

  // Ajuste por tipo de recinto
  let roomMultiplier = 1.0;
  if (room_type === 'dormitorio') roomMultiplier = 1.0;
  if (room_type === 'living') roomMultiplier = 1.1;
  if (room_type === 'oficina') roomMultiplier = 1.2;
  if (room_type === 'local_comercial') roomMultiplier = 1.35;
  if (room_type === 'servidores') roomMultiplier = 1.7;

  // Carga humana: ~400 BTU por persona (disipación metabólica)
  const peopleBtu = Math.max(0, people_count) * 400;

  // Carga por electrónica
  let electronicsBtu = 0;
  if (electronic_load === 'media') electronicsBtu = 1200;
  if (electronic_load === 'alta') electronicsBtu = 3500;

  const totalExactBtu = Math.round((baseBtu * sunMultiplier * roomMultiplier) + peopleBtu + electronicsBtu);

  // Encontrar el tamaño comercial más adecuado (redondeo hacia arriba con margen)
  let recommendedBtu = STANDARD_BTU_SIZES[STANDARD_BTU_SIZES.length - 1];
  for (const size of STANDARD_BTU_SIZES) {
    if (size >= totalExactBtu) {
      recommendedBtu = size;
      break;
    }
  }

  // Conversión a Kilowatts térmicos (1 kW = 3412.142 BTU/h)
  const coolingKw = Number((recommendedBtu / 3412.142).toFixed(2));
  const heatingKw = Number((coolingKw * 1.08).toFixed(2));

  let explanation = `Para un espacio de ${area_m2} m² (${room_type}) con exposición solar ${sun_exposure} y ${people_count} persona(s), la carga térmica calculada es de ${totalExactBtu.toLocaleString('es-CL')} BTU/h. Se recomienda un equipo Inverter de ${recommendedBtu.toLocaleString('es-CL')} BTU (${coolingKw} kW Frío / ${heatingKw} kW Calor) para máxima eficiencia energética A++.`;

  const recommendedModels: string[] = [];
  if (recommendedBtu === 9000) {
    recommendedModels.push('Anwo Eco Inverter 9.000 BTU A++', 'Midea Breezeless Inverter 9k', 'Gree Lomo 9k');
  } else if (recommendedBtu === 12000) {
    recommendedModels.push('Anwo V-Inverter 12.000 BTU A++', 'Midea Mission Pro 12k R32', 'Daikin Sensira 12k');
  } else if (recommendedBtu === 18000) {
    recommendedModels.push('Anwo Expert Inverter 18.000 BTU', 'Samsung WindFree 18k', 'Gree Fairy 18k R32');
  } else if (recommendedBtu === 24000) {
    recommendedModels.push('Anwo Mega Inverter 24.000 BTU', 'Midea Breezeless XL 24k', 'Clark Inverter High-Wall 24k');
  } else {
    recommendedModels.push('Anwo Cassette 4 Vías Inverter', 'Midea Ducto Alta Presión Comercial');
  }

  return {
    exact_btu: totalExactBtu,
    recommended_btu: recommendedBtu,
    cooling_kw: coolingKw,
    heating_kw: heatingKw,
    explanation,
    recommended_models: recommendedModels,
  };
}
