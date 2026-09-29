/**
 * exchangeRateService.ts
 * Servicio para consultar tipos de cambio oficiales en vivo para el ecosistema Nexus Air (NK-049).
 * Utiliza APIs públicas sin costo ni necesidad de tokens (Open Exchange Rate API & mindicador.cl).
 */

export interface LiveExchangeRateResult {
  success: boolean;
  rate: number;
  uf?: number;
  currency: string;
  provider: string;
  timestamp: string;
  error?: string;
}

export async function fetchLiveExchangeRate(
  countryCode: string = 'CR',
  currencyCode: string = 'CRC'
): Promise<LiveExchangeRateResult> {
  const normCountry = (countryCode || '').toUpperCase();
  const normCurrency = (currencyCode || '').toUpperCase();

  try {
    // 1. Caso especial: Chile (CLP y Unidad de Fomento UF de mindicador.cl)
    if (normCountry === 'CL' || normCurrency === 'CLP') {
      try {
        const clRes = await fetch('https://mindicador.cl/api');
        if (clRes.ok) {
          const clData = await clRes.json();
          const dolarValor = clData.dolar?.valor;
          const ufValor = clData.uf?.valor;
          if (dolarValor) {
            return {
              success: true,
              rate: Math.round(dolarValor * 100) / 100,
              uf: ufValor ? Math.round(ufValor * 100) / 100 : undefined,
              currency: 'CLP',
              provider: 'mindicador.cl (Banco Central de Chile)',
              timestamp: new Date().toISOString()
            };
          }
        }
      } catch (clErr) {
        console.warn('mindicador.cl falló, recurriendo a open.er-api.com:', clErr);
      }
    }

    // 2. Consulta general en Open Exchange Rate API (abierta, CORS habilitado)
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al consultar API de tipo de cambio`);
    }

    const data = await res.json();
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Respuesta inválida de la API de tipo de cambio');
    }

    // Mapear divisa según país o código de moneda
    let targetCurrency = normCurrency;
    if (!targetCurrency || targetCurrency === '$') {
      if (normCountry === 'CR') targetCurrency = 'CRC';
      else if (normCountry === 'CL') targetCurrency = 'CLP';
      else if (normCountry === 'VE') targetCurrency = 'VES';
      else if (normCountry === 'PE') targetCurrency = 'PEN';
      else if (normCountry === 'CO') targetCurrency = 'COP';
      else if (normCountry === 'MX') targetCurrency = 'MXN';
      else targetCurrency = 'CRC';
    }

    const foundRate = data.rates[targetCurrency];
    if (typeof foundRate === 'number' && foundRate > 0) {
      // Redondear a 2 decimales para divisas estándar, o 4 si es menor a 10
      const formattedRate = foundRate < 10 
        ? Math.round(foundRate * 10000) / 10000 
        : Math.round(foundRate * 100) / 100;

      return {
        success: true,
        rate: formattedRate,
        currency: targetCurrency,
        provider: 'Open Exchange Rates (Global Forex API)',
        timestamp: data.time_last_update_utc || new Date().toISOString()
      };
    }

    throw new Error(`No se encontró tasa para la divisa ${targetCurrency}`);
  } catch (error: any) {
    console.error('Error al consultar tipo de cambio en vivo:', error);
    return {
      success: false,
      rate: 0,
      currency: normCurrency,
      provider: 'Ninguno',
      timestamp: new Date().toISOString(),
      error: error?.message || 'No se pudo conectar con el servidor de divisas'
    };
  }
}
