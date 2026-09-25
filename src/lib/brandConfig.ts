import React, { useState, useEffect } from 'react';
import { AirSettings } from '../types';

export type BrandId = 'nexus' | 'solago';

export interface BrandTheme {
  id: BrandId;
  name: string;
  shortName: string;
  subName: string;
  domain: string;
  slogan: string;
  tagline: string;
  poweredBy: string;
  emblemUrl: string;
  wordmarkUrl: string;
  logoUrl: string;
  faviconUrl: string;
  pageTitle: string;
  metaDescription: string;
  colors: {
    primary: string; // e.g. '#00d2ff' vs '#ffa100'
    secondary: string; // '#2563eb'
    accent: string;
    gradientClass: string;
    glowClass: string;
    borderHighlight: string;
    textHighlight: string;
  };
  defaultCompany: {
    name: string;
    fantasyName: string;
    slogan: string;
    country: string;
    countryCode: string;
    currencySymbol: string;
    currencyCode: string;
    taxName: string;
    taxRate: number;
    taxIdLabel: string;
    email: string;
  };
}

export const BRANDS: Record<BrandId, BrandTheme> = {
  nexus: {
    id: 'nexus',
    name: 'Nexus Air',
    shortName: 'Nexus',
    subName: 'AIR',
    domain: 'air.nexusnetwork.cl',
    slogan: 'Especialistas en Climatización y Refrigeración',
    tagline: 'HVAC OS • CLIMATIZACIÓN INTELIGENTE',
    poweredBy: 'BY SMARTLEAN',
    emblemUrl: '/favicon.svg',
    wordmarkUrl: '',
    logoUrl: '/favicon.svg',
    faviconUrl: '/favicon.svg',
    pageTitle: 'Nexus Air • Sistema de Climatización & HVAC OS',
    metaDescription: 'Plataforma oficial para gestión de órdenes técnicas, cálculo térmico de BTU y mantención preventiva semestral.',
    colors: {
      primary: '#00d2ff',
      secondary: '#2563eb',
      accent: '#0284c7',
      gradientClass: 'from-[#00d2ff] to-[#2563eb]',
      glowClass: 'shadow-[0_0_15px_rgba(0,210,255,0.25)]',
      borderHighlight: 'border-cyan-500/30',
      textHighlight: 'text-[#00d2ff]',
    },
    defaultCompany: {
      name: 'Nexus Air Climatización SpA',
      fantasyName: 'Nexus Air',
      slogan: 'Especialistas en Climatización y Refrigeración',
      country: 'Chile',
      countryCode: 'CL',
      currencySymbol: '$',
      currencyCode: 'CLP',
      taxName: 'IVA',
      taxRate: 0.19,
      taxIdLabel: 'RUT',
      email: 'contacto@nexusair.cl',
    },
  },

  solago: {
    id: 'solago',
    name: 'SoLago Air',
    shortName: 'SoLago',
    subName: 'AIR',
    domain: 'air.solago.com.net',
    slogan: 'Software Online para Locales y Climatización Inteligente',
    tagline: 'SISTEMA COMERCIAL & CLIMATIZACIÓN EN LA NUBE',
    poweredBy: 'BY SMARTLEAN',
    emblemUrl: '/brands/solago/solago-emblem.png',
    wordmarkUrl: '/brands/solago/solago-wordmark.png',
    logoUrl: '/brands/solago/logo.png',
    faviconUrl: '/brands/solago/favicon.png',
    pageTitle: 'SoLago Air • Climatización & Gestión Comercial en la Nube',
    metaDescription: 'Software oficial SoLago Air para climatización técnica, cálculo de carga térmica, órdenes Kanban y retención de clientes.',
    colors: {
      primary: '#ffa100',
      secondary: '#2563eb',
      accent: '#00d2ff',
      gradientClass: 'from-[#ffa100] via-[#00d2ff] to-[#2563eb]',
      glowClass: 'shadow-[0_0_18px_rgba(255,161,0,0.3)]',
      borderHighlight: 'border-amber-500/40',
      textHighlight: 'text-[#ffa100]',
    },
    defaultCompany: {
      name: 'SoLago Air Servicios C.A.',
      fantasyName: 'SoLago Air',
      slogan: 'Software Online para Locales y Climatización Inteligente',
      country: 'Venezuela',
      countryCode: 'VE',
      currencySymbol: '$',
      currencyCode: 'USD',
      taxName: 'IVA',
      taxRate: 0.16,
      taxIdLabel: 'RIF',
      email: 'soporte@solago.com.ve',
    },
  },
};

/**
 * Detecta la marca activa según:
 * 1. Parámetro explícito de URL ?brand=solago o ?brand=nexus
 * 2. Hostname de acceso (air.solago.com.net, solago.com.ve, *.solago.*)
 * 3. Almacenamiento local 'air_brand_preference' si fue seleccionado manualmente
 * 4. Por defecto: 'nexus'
 */
export function detectBrand(): BrandId {
  if (typeof window === 'undefined') return 'nexus';

  try {
    const params = new URLSearchParams(window.location.search);
    const paramBrand = params.get('brand')?.toLowerCase();
    if (paramBrand === 'solago' || paramBrand === 'solago-air') {
      localStorage.setItem('air_brand_preference', 'solago');
      return 'solago';
    }
    if (paramBrand === 'nexus' || paramBrand === 'nexus-air') {
      localStorage.setItem('air_brand_preference', 'nexus');
      return 'nexus';
    }

    const host = window.location.hostname.toLowerCase();
    if (host.includes('solago')) {
      return 'solago';
    }
    if (host.includes('nexus')) {
      return 'nexus';
    }

    // Verificar si hay preferencia guardada en localStorage
    const saved = localStorage.getItem('air_brand_preference');
    if (saved === 'solago' || saved === 'nexus') {
      return saved as BrandId;
    }
  } catch (e) {
    console.warn('Error detecting brand:', e);
  }

  return 'nexus';
}

/**
 * Modifica el document.title y el favicon del navegador dinámicamente según la marca activa.
 */
export function applyBrandToDocument(brand: BrandTheme) {
  if (typeof document === 'undefined') return;

  try {
    document.title = brand.pageTitle;

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = brand.faviconUrl;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', brand.metaDescription);
    }
  } catch (e) {
    console.warn('Error applying brand to document:', e);
  }
}

/**
 * Hook de React para acceder a la marca activa y poder cambiarla al instante.
 */
export function useBrand() {
  const [brandId, setBrandId] = useState<BrandId>(() => detectBrand());

  useEffect(() => {
    const b = detectBrand();
    setBrandId(b);
  }, []);

  const brand = BRANDS[brandId] || BRANDS.nexus;

  useEffect(() => {
    applyBrandToDocument(brand);
  }, [brand]);

  const switchBrand = (newBrand: BrandId) => {
    localStorage.setItem('air_brand_preference', newBrand);
    setBrandId(newBrand);
  };

  return {
    brandId,
    brand,
    isSolago: brandId === 'solago',
    isNexus: brandId === 'nexus',
    switchBrand,
  };
}
