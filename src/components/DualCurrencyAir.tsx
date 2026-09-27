import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { formatAirPrice } from '../lib/countries';

interface DualCurrencyAirProps {
  amount: number;
  countryCode?: string;
  fontSize?: string;
  primaryColor?: string;
  showSwap?: boolean;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
  exchangeRate?: number; // Ej: Bs. por USD en VE, o CLP por USD en CL, o CRC por USD en CR
  ufValue?: number;      // Para Chile: Valor UF (ej: 38200)
  isSwapped?: boolean;   // Invertir monedas
  onToggleSwap?: () => void;
}

export const DualCurrencyAir: React.FC<DualCurrencyAirProps> = ({
  amount,
  countryCode = 'CL',
  fontSize = '22px',
  primaryColor = '#06b6d4',
  showSwap = true,
  align = 'left',
  style = {},
  exchangeRate = 940,
  ufValue = 38200,
  isSwapped = false,
  onToggleSwap,
}) => {
  const [animating, setAnimating] = useState(false);
  const [localSwapped, setLocalSwapped] = useState(false);

  const effectiveSwapped = onToggleSwap ? isSwapped : localSwapped;

  const handleSwap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    if (onToggleSwap) {
      onToggleSwap();
    } else {
      setLocalSwapped(prev => !prev);
    }
    setTimeout(() => setAnimating(false), 250);
  };

  const num = Number(amount) || 0;
  const isVE = countryCode === 'VE';
  const isCL = countryCode === 'CL';
  const isCR = countryCode === 'CR';

  // Formateo según la realidad del país
  let primaryText = '';
  let secondaryText = '';

  if (isVE) {
    // Venezuela: Base en USD, secundaria en Bolívares (VES/Bs.)
    const rate = exchangeRate > 0 ? exchangeRate : 36.5;
    const usdVal = num;
    const bsVal = num * rate;

    const formattedUSD = `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    const formattedBs = `Bs. ${bsVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    primaryText = effectiveSwapped ? formattedBs : formattedUSD;
    secondaryText = effectiveSwapped ? formattedUSD : formattedBs;
  } else if (isCL) {
    // Chile: Base en CLP (pesos chilenos sin decimales), secundaria en UF o USD
    const clpFormatted = `$${Math.round(num).toLocaleString('es-CL')}`;
    const ufVal = ufValue > 0 ? (num / ufValue) : 0;
    const ufFormatted = ufVal > 0 ? `${ufVal.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF` : '';
    const usdVal = exchangeRate > 0 ? (num / exchangeRate) : 0;
    const usdFormatted = usdVal > 0 ? `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} USD` : '';

    const secondary = ufFormatted || usdFormatted;
    primaryText = effectiveSwapped && secondary ? secondary : clpFormatted;
    secondaryText = effectiveSwapped && secondary ? clpFormatted : secondary;
  } else if (isCR) {
    // Costa Rica: Base en CRC (colones ₡), secundaria en USD ($)
    const crcFormatted = `₡${Math.round(num).toLocaleString('es-CR')}`;
    const rate = exchangeRate > 0 ? exchangeRate : 520;
    const usdVal = num / rate;
    const usdFormatted = `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

    primaryText = effectiveSwapped ? usdFormatted : crcFormatted;
    secondaryText = effectiveSwapped ? crcFormatted : usdFormatted;
  } else {
    // Otros países latinoamericanos
    const localFormatted = formatAirPrice(num, '$', countryCode);
    const usdVal = exchangeRate > 0 ? (num / exchangeRate) : num;
    const usdFormatted = `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

    primaryText = effectiveSwapped ? usdFormatted : localFormatted;
    secondaryText = effectiveSwapped ? localFormatted : usdFormatted;
  }

  const hasSecondary = Boolean(secondaryText);

  return (
    <div 
      className="inline-flex items-center gap-1.5"
      style={{ 
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        ...style 
      }}
    >
      <div 
        className="flex flex-col transition-all duration-200"
        style={{
          alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
          opacity: animating ? 0.35 : 1,
          transform: animating ? 'scale(0.96)' : 'scale(1)'
        }}
      >
        {/* Moneda Principal (Grande) */}
        <span 
          style={{
            fontSize: fontSize,
            fontWeight: 800,
            color: primaryColor,
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
          }}
          className="font-mono tracking-tight"
        >
          {primaryText}
        </span>

        {/* Moneda Secundaria (Pequeña abajo con contexto) */}
        {hasSecondary && (
          <span 
            style={{
              fontSize: `calc(${fontSize} * 0.45 + 3px)`,
              fontWeight: 600,
              color: '#94a3b8',
              lineHeight: '1.1',
              letterSpacing: '0.01em'
            }}
            className="font-mono mt-0.5"
          >
            {secondaryText}
          </span>
        )}
      </div>

      {/* Botón interactivo para alternar monedas cuando aplique */}
      {showSwap && hasSecondary && (
        <button
          type="button"
          onClick={handleSwap}
          title="Alternar moneda principal / secundaria"
          className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
