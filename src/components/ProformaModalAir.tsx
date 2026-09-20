import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AirSettings, AirPart, ServiceOrder, Customer } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Building2, 
  User, 
  DollarSign, 
  Package, 
  Wrench,
  Snowflake,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTaxPercentage, formatAirPrice } from '../lib/countries';
import { 
  generateProformaPdfAir, 
  buildProformaHtml, 
  downloadElementAsCleanPng, 
  copyElementAsCleanPng,
  ProformaPdfData
} from '../lib/pdfServiceAir';

export interface ProformaItem {
  id: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'equipo' | 'instalacion' | 'material';
}

interface ProformaModalAirProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedBtu: number;
  recommendedTon?: number;
  areaM2?: number;
  parts: AirPart[];
  settings?: AirSettings | null;
  customers?: Customer[];
  onCreateOrder?: (orderData: Partial<ServiceOrder>) => void;
  includeCondensatePump?: boolean;
  pumpPrice?: number;
  includeInstallation?: boolean;
  installationPrice?: number;
  initialEquipmentPrice?: number;
  initialServiceCategory?: 'instalacion' | 'mantencion_multiequipo' | 'reparacion';
}

export function ProformaModalAir({
  isOpen,
  onClose,
  recommendedBtu,
  recommendedTon = 1.0,
  areaM2 = 20,
  parts,
  settings,
  customers = [],
  onCreateOrder,
  includeCondensatePump,
  pumpPrice,
  includeInstallation,
  installationPrice,
  initialEquipmentPrice,
  initialServiceCategory = 'instalacion',
}: ProformaModalAirProps) {
  const countryCode = settings?.country_code || 'CR';
  const isChile = countryCode === 'CL';
  const currencySymbol = settings?.currency_symbol || (isChile ? '$' : '₡');
  const taxRatePercent = getTaxPercentage(settings?.tax_rate);

  // Selector de cliente registrado
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Datos del Cliente en la proforma
  const [clientName, setClientName] = useState('Cliente Empresa / Particular');
  const [clientIdNumber, setClientIdNumber] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [proformaFolio, setProformaFolio] = useState(() => `PF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [emissionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) return;
    const c = customers.find(item => item.id === id);
    if (c) {
      setClientName(c.name || '');
      setClientIdNumber(c.id_number || (c as any).rut || '');
      setClientEmail(c.email || '');
      setClientPhone(c.phone || '');
    }
  };

  // Selección de equipo
  const availableEquipments = useMemo(() => {
    const equips = parts.filter(p => p.category === 'equipo');
    if (equips.length > 0) return equips;
    // Fallback de catálogo estándar si aún no han registrado en inventario
    if (isChile) {
      return [
        { id: 'eq-9k', name: 'Aire Acondicionado Split 9.000 BTU Inverter Ecológico', sale_price: 389990, btu: 9000, category: 'equipo' },
        { id: 'eq-12k', name: 'Aire Acondicionado Split 12.000 BTU Inverter WiFi', sale_price: 439990, btu: 12000, category: 'equipo' },
        { id: 'eq-18k', name: 'Aire Acondicionado Split Midea Breezeless 18.000 BTU Inverter', sale_price: 529990, btu: 18000, category: 'equipo' },
        { id: 'eq-24k', name: 'Aire Acondicionado Split 24.000 BTU Inverter WiFi', sale_price: 689990, btu: 24000, category: 'equipo' },
        { id: 'eq-36k', name: 'Aire Acondicionado Cassette / Piso-Cielo 36.000 BTU', sale_price: 1150000, btu: 36000, category: 'equipo' },
      ] as AirPart[];
    }
    return [
      { id: 'eq-9k', name: 'A.A ECOLD 9K BTU SEER 21.5 INVERTER CON WIFI (0.75 Ton)', sale_price: 180000, btu: 9000, category: 'equipo' },
      { id: 'eq-12k', name: 'A.A ECOLD 12K BTU SEER 21.5 INVERTER CON WIFI (1.0 Ton)', sale_price: 200000, btu: 12000, category: 'equipo' },
      { id: 'eq-15k', name: 'A.A ECOLD 15K BTU SEER 20 INVERTER (1.25 Ton)', sale_price: 260000, btu: 15000, category: 'equipo' },
      { id: 'eq-18k', name: 'A.A ECOLD 18K BTU SEER 20 INVERTER CON WIFI (1.5 Ton)', sale_price: 295000, btu: 18000, category: 'equipo' },
      { id: 'eq-24k', name: 'A.A ECOLD 24K BTU SEER 20 INVERTER CON WIFI (2.0 Ton)', sale_price: 395000, btu: 24000, category: 'equipo' },
      { id: 'eq-36k', name: 'A.A ECOLD 36K BTU PISO-CIELO / CASSETTE (3.0 Ton)', sale_price: 680000, btu: 36000, category: 'equipo' },
    ] as AirPart[];
  }, [parts, isChile]);

  // Equipo inicial emparejado al BTU recomendado
  const defaultEquip = useMemo(() => {
    return availableEquipments.find(e => e.btu === recommendedBtu) || availableEquipments[0];
  }, [availableEquipments, recommendedBtu]);

  const [selectedEquipId, setSelectedEquipId] = useState<string>(defaultEquip?.id || (isChile ? 'eq-18k' : 'eq-12k'));
  const [equipmentPrice, setEquipmentPrice] = useState<number>(defaultEquip?.sale_price || (isChile ? 529990 : 200000));
  const [equipmentQty, setEquipmentQty] = useState<number>(1);

  // Al cambiar la recomendación inicial
  React.useEffect(() => {
    if (defaultEquip) {
      setSelectedEquipId(defaultEquip.id);
      setEquipmentPrice(defaultEquip.sale_price || (isChile ? 529990 : 200000));
    }
  }, [defaultEquip, isChile]);

  const [serviceCategory, setServiceCategory] = useState<'instalacion' | 'mantencion_multiequipo' | 'reparacion'>(
    initialServiceCategory || 'instalacion'
  );

  // Mano de Obra y Materiales de Instalación calibrados por país (Total base: 155.500)
  const [installationItems, setInstallationItems] = useState<ProformaItem[]>(() => {
    if (isChile) {
      return [
        { id: 'mat-1', concept: 'MANO DE OBRA DE INSTALACION ESTANDAR (HASTA 3M)', quantity: 1, unitPrice: 110000, total: 110000, type: 'instalacion' },
        { id: 'mat-2', concept: 'SOPORTE Y KIT DE ANCLAJE MURO', quantity: 1, unitPrice: 18500, total: 18500, type: 'material' },
        { id: 'mat-3', concept: 'CANALETA Y ACCESORIOS ESTETICOS', quantity: 1, unitPrice: 15000, total: 15000, type: 'material' },
        { id: 'mat-4', concept: 'MATERIALES ELECTRICOS Y TERMICO', quantity: 1, unitPrice: 12000, total: 12000, type: 'material' },
      ];
    }
    return [
      { id: 'mat-1', concept: 'MANO DE OBRA DE INSTALACION', quantity: 1, unitPrice: 80000, total: 80000, type: 'instalacion' },
      { id: 'mat-2', concept: 'BASE DE CONDENSADO', quantity: 1, unitPrice: 15000, total: 15000, type: 'material' },
      { id: 'mat-3', concept: 'PROTECTOR DE VOLTAJE', quantity: 1, unitPrice: 16000, total: 16000, type: 'material' },
      { id: 'mat-4', concept: 'BREAKER', quantity: 1, unitPrice: 15500, total: 15500, type: 'material' },
      { id: 'mat-5', concept: 'TORNILLERIA Y ANCLAJES', quantity: 1, unitPrice: 5000, total: 5000, type: 'material' },
      { id: 'mat-6', concept: 'DURETAN Y SELLOS', quantity: 1, unitPrice: 7000, total: 7000, type: 'material' },
      { id: 'mat-7', concept: 'CABLE 3X12 USO RUDO (Metros)', quantity: 10, unitPrice: 1700, total: 17000, type: 'material' },
    ];
  });

  // Ítems de Mantención Multiequipo Corporativa (NK-035)
  const [maintenanceItems, setMaintenanceItems] = useState<ProformaItem[]>(() => {
    if (isChile) {
      return [
        { id: 'm-1', concept: 'MANTENCIÓN PREVENTIVA SPLIT 9.000 - 12.000 BTU (DESARME E HIDROLAVADO)', quantity: 8, unitPrice: 35000, total: 280000, type: 'instalacion' },
        { id: 'm-2', concept: 'MANTENCIÓN PREVENTIVA SPLIT 18.000 - 24.000 BTU (DESARME Y PRESIÓN)', quantity: 4, unitPrice: 45000, total: 180000, type: 'instalacion' },
        { id: 'm-3', concept: 'MANTENCIÓN CASSETTE / PISO-CIELO 36.000 - 60.000 BTU', quantity: 2, unitPrice: 75000, total: 150000, type: 'instalacion' },
        { id: 'm-4', concept: 'SANITIZACIÓN Y DESINFECCIÓN CON BACTERICIDA CERTIFICADO', quantity: 1, unitPrice: 45000, total: 45000, type: 'material' },
        { id: 'm-5', concept: 'REVISIÓN ELÉCTRICA DE TABLEROS Y CONSUMO AMPERIMÉTRICO', quantity: 1, unitPrice: 50000, total: 50000, type: 'instalacion' },
      ];
    }
    return [
      { id: 'm-1', concept: 'MANTENCIÓN PREVENTIVA SPLIT 9.000 - 12.000 BTU (DESARME E HIDROLAVADO)', quantity: 8, unitPrice: 22000, total: 176000, type: 'instalacion' },
      { id: 'm-2', concept: 'MANTENCIÓN PREVENTIVA SPLIT 18.000 - 24.000 BTU (DESARME Y PRESIÓN)', quantity: 4, unitPrice: 32000, total: 128000, type: 'instalacion' },
      { id: 'm-3', concept: 'MANTENCIÓN CASSETTE / PISO-CIELO 36.000 - 60.000 BTU', quantity: 2, unitPrice: 55000, total: 110000, type: 'instalacion' },
      { id: 'm-4', concept: 'SANITIZACIÓN Y DESINFECCIÓN CON BACTERICIDA CERTIFICADO', quantity: 1, unitPrice: 25000, total: 25000, type: 'material' },
      { id: 'm-5', concept: 'REVISIÓN ELÉCTRICA DE TABLEROS Y CONSUMO AMPERIMÉTRICO', quantity: 1, unitPrice: 30000, total: 30000, type: 'instalacion' },
    ];
  });

  // Ítems de Reparación y Diagnóstico (NK-035)
  const [repairItems, setRepairItems] = useState<ProformaItem[]>(() => {
    if (isChile) {
      return [
        { id: 'r-1', concept: 'VISITA TÉCNICA ESPECIALIZADA Y DIAGNÓSTICO EN TERRENO', quantity: 1, unitPrice: 35000, total: 35000, type: 'instalacion' },
        { id: 'r-2', concept: 'DETECCIÓN DE FUGAS CON NITRÓGENO Y CORRECCIÓN DE UNIONES', quantity: 1, unitPrice: 65000, total: 65000, type: 'instalacion' },
        { id: 'r-3', concept: 'CARGA COMPLETA REFRIGERANTE R410A / R32 CON BALANZA Y VACÍO', quantity: 1, unitPrice: 55000, total: 55000, type: 'material' },
        { id: 'r-4', concept: 'SUSTITUCIÓN DE CAPACITOR DUAL COMPRESOR/VENTILADOR', quantity: 1, unitPrice: 45000, total: 45000, type: 'material' },
      ];
    }
    return [
      { id: 'r-1', concept: 'VISITA TÉCNICA ESPECIALIZADA Y DIAGNÓSTICO EN TERRENO', quantity: 1, unitPrice: 25000, total: 25000, type: 'instalacion' },
      { id: 'r-2', concept: 'DETECCIÓN DE FUGAS CON NITRÓGENO Y CORRECCIÓN DE FLARE', quantity: 1, unitPrice: 45000, total: 45000, type: 'instalacion' },
      { id: 'r-3', concept: 'CARGA COMPLETA REFRIGERANTE R410A / R32 CON BALANZA Y VACÍO', quantity: 1, unitPrice: 38000, total: 38000, type: 'material' },
      { id: 'r-4', concept: 'SUSTITUCIÓN DE CAPACITOR DUAL MARCHA/ARRANQUE', quantity: 1, unitPrice: 28000, total: 28000, type: 'material' },
    ];
  });

  // Sincronización con Cotizador Térmico (NK-033)
  useEffect(() => {
    if (!isOpen) return;

    if (initialServiceCategory) {
      setServiceCategory(initialServiceCategory);
    }

    if (initialEquipmentPrice !== undefined && initialEquipmentPrice > 0) {
      setEquipmentPrice(initialEquipmentPrice);
    }

    setInstallationItems(prev => {
      let updated = [...prev];

      if (installationPrice !== undefined) {
        updated = updated.map(item => {
          if (item.type === 'instalacion' || item.id === 'mat-1') {
            return {
              ...item,
              unitPrice: installationPrice,
              total: (item.quantity || 1) * installationPrice,
            };
          }
          return item;
        });
      }

      if (includeInstallation === false) {
        updated = updated.filter(item => item.id !== 'mat-1');
      }

      const pumpIndex = updated.findIndex(item => item.id === 'mat-pump' || item.concept.includes('BOMBA DE CONDENSADO'));
      if (includeCondensatePump) {
        const effectivePump = pumpPrice !== undefined && pumpPrice > 0 ? pumpPrice : 45000;
        if (pumpIndex >= 0) {
          updated[pumpIndex] = {
            ...updated[pumpIndex],
            unitPrice: effectivePump,
            total: (updated[pumpIndex].quantity || 1) * effectivePump,
          };
        } else {
          updated.push({
            id: 'mat-pump',
            concept: 'BOMBA DE CONDENSADO SILENCIOSA',
            quantity: 1,
            unitPrice: effectivePump,
            total: effectivePump,
            type: 'material',
          });
        }
      } else if (includeCondensatePump === false && pumpIndex >= 0) {
        updated.splice(pumpIndex, 1);
      }

      return updated;
    });
  }, [isOpen, includeCondensatePump, pumpPrice, includeInstallation, installationPrice, initialEquipmentPrice, initialServiceCategory, isChile]);

  const currentEquipment = availableEquipments.find(e => e.id === selectedEquipId) || defaultEquip;

  const handleSelectEquipment = (id: string) => {
    setSelectedEquipId(id);
    const found = availableEquipments.find(e => e.id === id);
    if (found) {
      setEquipmentPrice(found.sale_price || 200000);
    }
  };

  const handleItemChange = (id: string, field: 'quantity' | 'unitPrice' | 'concept', value: any) => {
    setInstallationItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
      }
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setInstallationItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: ProformaItem = {
      id: `mat-${Date.now()}`,
      concept: 'NUEVO MATERIAL O SERVICIO',
      quantity: 1,
      unitPrice: 10000,
      total: 10000,
      type: 'material'
    };
    setInstallationItems(prev => [...prev, newItem]);
  };

  // Handlers para Mantención Multiequipo (NK-035)
  const handleMaintenanceItemChange = (id: string, field: 'quantity' | 'unitPrice' | 'concept', value: any) => {
    setMaintenanceItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
      }
      return updated;
    }));
  };

  const handleRemoveMaintenanceItem = (id: string) => {
    setMaintenanceItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddMaintenanceItem = (presetConcept?: string, defaultPrice?: number) => {
    const newItem: ProformaItem = {
      id: `m-${Date.now()}`,
      concept: presetConcept || 'NUEVA PARTIDA DE MANTENCIÓN PREVENTIVA',
      quantity: 1,
      unitPrice: defaultPrice || (isChile ? 35000 : 22000),
      total: defaultPrice || (isChile ? 35000 : 22000),
      type: 'instalacion'
    };
    setMaintenanceItems(prev => [...prev, newItem]);
  };

  // Handlers para Reparación (NK-035)
  const handleRepairItemChange = (id: string, field: 'quantity' | 'unitPrice' | 'concept', value: any) => {
    setRepairItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
      }
      return updated;
    }));
  };

  const handleRemoveRepairItem = (id: string) => {
    setRepairItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddRepairItem = (presetConcept?: string, defaultPrice?: number) => {
    const newItem: ProformaItem = {
      id: `r-${Date.now()}`,
      concept: presetConcept || 'NUEVA PARTIDA DE REPARACIÓN / DIAGNÓSTICO',
      quantity: 1,
      unitPrice: defaultPrice || (isChile ? 45000 : 28000),
      total: defaultPrice || (isChile ? 45000 : 28000),
      type: 'material'
    };
    setRepairItems(prev => [...prev, newItem]);
  };

  // Totales Dinámicos según Categoría de Servicio (NK-035)
  const isInstallation = serviceCategory === 'instalacion';
  const isMultiMaintenance = serviceCategory === 'mantencion_multiequipo';
  const isRepair = serviceCategory === 'reparacion';

  const subtotalEquipos = isInstallation ? (equipmentPrice * equipmentQty) : 0;
  const subtotalInstalacion = isInstallation
    ? installationItems.reduce((acc, it) => acc + (it.total || 0), 0)
    : isMultiMaintenance
    ? maintenanceItems.reduce((acc, it) => acc + (it.total || 0), 0)
    : repairItems.reduce((acc, it) => acc + (it.total || 0), 0);

  const subTotalDirecto = subtotalEquipos + subtotalInstalacion;
  const montoIva = Math.round(subTotalDirecto * (taxRatePercent / 100));
  const precioVentaTotal = subTotalDirecto + montoIva;

  const getProformaData = (): ProformaPdfData => {
    const activeCustom = isMultiMaintenance ? maintenanceItems : isRepair ? repairItems : [];
    return {
      folio: proformaFolio,
      date: emissionDate,
      clientName,
      clientIdNumber,
      clientPhone,
      clientEmail,
      serviceCategory,
      serviceTitle: isMultiMaintenance
        ? 'PRESUPUESTO MANTENCIÓN MULTIEQUIPO CORPORATIVA'
        : isRepair
        ? 'PRESUPUESTO REPARACIÓN Y DIAGNÓSTICO'
        : 'COTIZACIÓN / PROFORMA OFICIAL',
      areaM2: isInstallation ? areaM2 : undefined,
      recommendedBtu: isInstallation ? recommendedBtu : undefined,
      recommendedTon: isInstallation ? recommendedTon : undefined,
      equipmentName: isInstallation ? (currentEquipment?.name || 'Aire Acondicionado Split Inverter Ecológico') : undefined,
      equipmentQty: isInstallation ? equipmentQty : undefined,
      equipmentPrice: isInstallation ? equipmentPrice : undefined,
      installationItems: isInstallation ? installationItems.map(it => ({
        concept: it.concept,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })) : undefined,
      customItems: (isMultiMaintenance || isRepair) ? activeCustom.map(it => ({
        concept: it.concept,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })) : undefined,
      subtotal: subTotalDirecto,
      taxRate: settings?.tax_rate ?? (isChile ? 0.19 : 0.13),
      taxAmount: montoIva,
      total: precioVentaTotal,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!settings) return;
    try {
      setIsGeneratingImage(true);
      toast.loading('Generando PDF liviano de la proforma...', { id: 'pdf-pf' });
      await generateProformaPdfAir(getProformaData(), settings);
      toast.success('¡Proforma descargada en PDF con éxito!', { id: 'pdf-pf' });
    } catch (err) {
      console.error('Error generando PDF:', err);
      toast.error('Error al generar PDF. Intenta Imprimir / PDF.', { id: 'pdf-pf' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyImageToWhatsApp = async () => {
    if (!settings) return;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '760px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '999999';
    container.style.boxSizing = 'border-box';
    container.innerHTML = buildProformaHtml(getProformaData(), settings);
    document.body.appendChild(container);

    setIsGeneratingImage(true);
    try {
      toast.loading('Generando imagen para WhatsApp...', { id: 'cap-pf' });
      const copied = await copyElementAsCleanPng(container, `proforma-${proformaFolio}.png`);
      if (copied) {
        toast.success('¡Imagen copiada al portapapeles! Presiona Ctrl + V en WhatsApp.', { id: 'cap-pf', duration: 6000 });
      } else {
        toast.success('Imagen descargada para adjuntar en WhatsApp.', { id: 'cap-pf' });
      }
      const activeItems = isMultiMaintenance ? maintenanceItems : isRepair ? repairItems : installationItems;
      const title = isMultiMaintenance 
        ? 'PRESUPUESTO MANTENCIÓN MULTIEQUIPO' 
        : isRepair 
        ? 'PRESUPUESTO REPARACIÓN Y DIAGNÓSTICO' 
        : 'PROFORMA OFICIAL DE CLIMATIZACIÓN';

      let itemsSummary = '';
      if (isInstallation) {
        itemsSummary = `📦 *Equipo Cotizado:* ${currentEquipment?.name || 'Split Inverter'}\n` +
          `• Cantidad: ${equipmentQty} un.\n` +
          `• Precio Equipo: ${formatAirPrice(subtotalEquipos, currencySymbol, countryCode)}\n\n` +
          `🔧 *Instalación y Materiales:* ${formatAirPrice(subtotalInstalacion, currencySymbol, countryCode)}\n`;
      } else {
        itemsSummary = `📋 *Detalle de Partidas Cotizadas:*\n` +
          activeItems.map(it => `• ${it.concept} (${it.quantity} un.): ${formatAirPrice(it.total, currencySymbol, countryCode)}`).join('\n') + '\n\n';
      }

      const phone = clientPhone.replace(/\D/g, '');
      const msg = `*${title}* ❄️\n` +
        `*Folio:* ${proformaFolio}\n` +
        `*Cliente:* ${clientName}\n\n` +
        itemsSummary +
        `──────────────────\n` +
        `*Subtotal:* ${formatAirPrice(subTotalDirecto, currencySymbol, countryCode)}\n` +
        `*IVA (${taxRatePercent}%):* ${formatAirPrice(montoIva, currencySymbol, countryCode)}\n` +
        `*TOTAL FINAL:* ${formatAirPrice(precioVentaTotal, currencySymbol, countryCode)}\n\n` +
        `📋 *Te adjunto la propuesta oficial (Presiona Ctrl + V para pegarla).*`;

      const url = `https://wa.me/${phone ? (phone.length <= 8 && !isChile ? `506${phone}` : (isChile && !phone.startsWith('56') ? `56${phone}` : phone)) : ''}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      toast.error('Error al generar la imagen de la proforma', { id: 'cap-pf' });
    } finally {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!settings) return;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '760px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '999999';
    container.style.boxSizing = 'border-box';
    container.innerHTML = buildProformaHtml(getProformaData(), settings);
    document.body.appendChild(container);

    setIsGeneratingImage(true);
    try {
      toast.loading('Generando imagen PNG...', { id: 'dl-pf' });
      await downloadElementAsCleanPng(container, `proforma-${proformaFolio}.png`);
      toast.success('Proforma descargada como PNG', { id: 'dl-pf' });
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar PNG', { id: 'dl-pf' });
    } finally {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setIsGeneratingImage(false);
    }
  };

  const handleSendWhatsApp = () => {
    const activeItems = isMultiMaintenance ? maintenanceItems : isRepair ? repairItems : installationItems;
    const title = isMultiMaintenance 
      ? 'PRESUPUESTO MANTENCIÓN MULTIEQUIPO' 
      : isRepair 
      ? 'PRESUPUESTO REPARACIÓN Y DIAGNÓSTICO' 
      : 'PROFORMA OFICIAL DE CLIMATIZACIÓN';

    let itemsSummary = '';
    if (isInstallation) {
      itemsSummary = `📦 *Equipo Cotizado:* ${currentEquipment?.name || 'Split Inverter'}\n` +
        `• Cantidad: ${equipmentQty} un.\n` +
        `• Precio Equipo: ${formatAirPrice(subtotalEquipos, currencySymbol, countryCode)}\n\n` +
        `🔧 *Instalación y Materiales:* ${formatAirPrice(subtotalInstalacion, currencySymbol, countryCode)}\n`;
    } else {
      itemsSummary = `📋 *Detalle de Partidas Cotizadas:*\n` +
        activeItems.map(it => `• ${it.concept} (${it.quantity} un.): ${formatAirPrice(it.total, currencySymbol, countryCode)}`).join('\n') + '\n\n';
    }

    const phone = clientPhone.replace(/\D/g, '');
    const msg = `*${title}* ❄️\n` +
      `*Folio:* ${proformaFolio}\n` +
      `*Cliente:* ${clientName}\n\n` +
      itemsSummary +
      `──────────────────\n` +
      `*Subtotal:* ${formatAirPrice(subTotalDirecto, currencySymbol, countryCode)}\n` +
      `*IVA (${taxRatePercent}%):* ${formatAirPrice(montoIva, currencySymbol, countryCode)}\n` +
      `*TOTAL FINAL:* ${formatAirPrice(precioVentaTotal, currencySymbol, countryCode)}\n\n` +
      `_Validez: 30 días. Incluye garantía técnica formal._\n` +
      `${settings?.fantasy_name || settings?.company_name || 'Climatización Profesional'}`;

    const url = `https://wa.me/${phone ? (phone.length <= 8 && !isChile ? `506${phone}` : (isChile && !phone.startsWith('56') ? `56${phone}` : phone)) : ''}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleConvertToOrder = () => {
    if (onCreateOrder) {
      onCreateOrder({
        service_type: isMultiMaintenance ? 'mantencion_preventiva' : isRepair ? 'mantencion_correctiva' : 'instalacion',
        status: 'ingresado',
        customer_name: clientName,
        customer_phone: clientPhone,
        customer_email: clientEmail,
        description: isMultiMaintenance
          ? `Mantención preventiva multiequipo según Proforma ${proformaFolio}`
          : isRepair
          ? `Reparación y diagnóstico especializado según Proforma ${proformaFolio}`
          : `Instalación dimensionada con Proforma ${proformaFolio}: ${currentEquipment?.name || 'Equipo'} para área de ${areaM2} m².`,
        items: isMultiMaintenance
          ? maintenanceItems.map(item => ({
              id: item.id,
              description: item.concept,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.total,
              type: 'servicio' as const,
            }))
          : isRepair
          ? repairItems.map(item => ({
              id: item.id,
              description: item.concept,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.total,
              type: (item.type === 'instalacion' ? 'servicio' : 'insumo') as any,
            }))
          : [
              {
                id: `eq-${Date.now()}`,
                description: currentEquipment?.name || `Equipo Split Inverter ${recommendedBtu} BTU`,
                quantity: equipmentQty,
                unit_price: equipmentPrice,
                total: subtotalEquipos,
                type: 'equipo',
              },
              ...installationItems.map(item => ({
                id: item.id,
                description: item.concept,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.total,
                type: (item.type === 'instalacion' ? 'servicio' : 'insumo') as any,
              }))
            ],
        subtotal: subTotalDirecto,
        tax: montoIva,
        total: precioVentaTotal,
        payment_status: 'pendiente',
      });
      toast.success('¡Proforma convertida exitosamente en Orden de Servicio!');
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-[70] p-2 sm:p-4 overflow-y-auto font-sans cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 cursor-default"
      >
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0 print:hidden flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Proforma / Cotización Oficial de Climatización</h2>
              <p className="text-[11px] text-slate-400">Documento listo para evaluación corporativa o cliente residencial</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Descargar cotización oficial en PDF liviano (Nexus Pallet)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handleCopyImageToWhatsApp}
              disabled={isGeneratingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
              title="Copia la proforma como imagen y abre WhatsApp para pegarla con Ctrl+V"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isGeneratingImage ? 'Generando...' : 'Copiar WhatsApp (Ctrl + V)'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer active:scale-95"
              title="Descargar imagen PNG de la proforma"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PNG</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-colors"
              title="Imprimir o guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              title="Enviar solo texto por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Texto WA</span>
            </button>
            {onCreateOrder && (
              <button
                onClick={handleConvertToOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Crear Orden</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar proforma (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Proforma Sheet Content (Clean, Professional Print Layout matching specimen) */}
        <div id="printable-proforma" className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-white text-slate-800">
          
          {/* Selector de Modo de Servicio (print:hidden) */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 print:hidden">
            <button
              type="button"
              onClick={() => setServiceCategory('instalacion')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                serviceCategory === 'instalacion'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>🛠️ Instalación de Climatización</span>
            </button>
            <button
              type="button"
              onClick={() => setServiceCategory('mantencion_multiequipo')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                serviceCategory === 'mantencion_multiequipo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 Mantención Multiequipo Corporativa</span>
            </button>
            <button
              type="button"
              onClick={() => setServiceCategory('reparacion')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                serviceCategory === 'reparacion'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>🔧 Reparación & Diagnóstico</span>
            </button>
          </div>

          {/* Header Row: Logo/Brand & Document Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-slate-200">
            <div className="flex items-center gap-4">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <Snowflake className="w-9 h-9" />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {settings?.fantasy_name || settings?.company_name || 'CLIMACONTROL CR'}
                </h1>
                <p className="text-xs text-slate-500 font-medium">Sistemas Profesionales de Aire Acondicionado & HVAC</p>
              </div>
            </div>

            {/* Proforma Box */}
            <div className="sm:text-right border border-slate-300 rounded-xl overflow-hidden shrink-0 shadow-xs">
              <div className="bg-slate-800 text-white px-6 py-1.5 font-black text-center text-sm tracking-widest uppercase">
                {isMultiMaintenance ? 'MANTENCIÓN MULTIEQUIPO' : isRepair ? 'REPARACIÓN & DIAGNÓSTICO' : 'PROFORMA'}
              </div>
              <div className="p-2.5 bg-slate-50 text-xs font-mono space-y-1">
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-slate-500 font-sans font-bold">N° Folio:</span>
                  <span className="print:inline hidden font-mono font-black text-cyan-900">{proformaFolio}</span>
                  <input
                    type="text"
                    value={proformaFolio}
                    onChange={e => setProformaFolio(e.target.value)}
                    className="print:hidden font-bold font-mono text-cyan-900 text-right bg-white border border-slate-300 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-sans">Fecha:</span>
                  <span className="font-bold text-slate-800">{emissionDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Company Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DATOS DEL CLIENTE */}
            <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50/20">
              <div className="bg-blue-600 text-white px-3.5 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>DATOS DEL CLIENTE</span>
                </div>
                {customers.length > 0 && (
                  <span className="text-[10px] font-normal opacity-90 print:hidden">Selecciona de la lista o escribe</span>
                )}
              </div>
              <div className="p-3.5 space-y-2 text-xs">
                {customers.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b border-blue-100 print:hidden">
                    <span className="w-20 text-blue-700 font-bold shrink-0">Buscar:</span>
                    <select
                      value={selectedCustomerId}
                      onChange={e => handleSelectCustomer(e.target.value)}
                      className="flex-1 text-xs font-semibold text-slate-800 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Seleccionar cliente registrado --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Nombre:</span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="flex-1 font-bold text-slate-900 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="Nombre o Razón Social..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Cédula/ID:</span>
                  <input
                    type="text"
                    value={clientIdNumber}
                    onChange={e => setClientIdNumber(e.target.value)}
                    className="flex-1 text-slate-800 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="Cédula Física / Jurídica / RUT..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Correo:</span>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="flex-1 text-slate-800 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-500 font-semibold shrink-0">Teléfono:</span>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="flex-1 text-slate-800 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none focus:border-blue-500"
                    placeholder="Número de teléfono..."
                  />
                </div>
              </div>
            </div>

            {/* DATOS DE LA EMPRESA */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-700 text-white px-3.5 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                DATOS DE LA EMPRESA
              </div>
              <div className="p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Nombre:</span>
                  <span className="font-bold text-slate-900">{settings?.fantasy_name || settings?.company_name || 'CLIMACONTROL CR'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Dirección:</span>
                  <span className="text-slate-800 text-right">{settings?.address || 'SAN JOSÉ, COSTA RICA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Correo:</span>
                  <span className="text-slate-800">{settings?.email || 'contacto@climacontrol.cr'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Teléfono:</span>
                  <span className="text-slate-800 font-mono font-bold">{settings?.phone || '6156-3703'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Detalle de Costos y Precios */}
          <div className="space-y-4">
            <div className="bg-blue-600 text-white px-4 py-2 font-black text-sm uppercase tracking-wider rounded-lg flex items-center justify-between">
              <span>Detalle de Costos y Precios</span>
              <span className="text-[11px] font-normal opacity-90">Moneda: {currencySymbol} ({countryCode === 'CL' ? 'Chile' : (settings?.country || 'Costa Rica')})</span>
            </div>

            {/* CASO 1: INSTALACIÓN NUEVA */}
            {isInstallation && (
              <>
                {/* 1. Venta de Equipos de Aire Acondicionado */}
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-blue-100 text-blue-900 font-bold px-4 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                    <span>Venta de Equipos de Aire Acondicionado</span>
                    <span className="text-[11px] text-blue-700 font-medium">Recomendado para {areaM2} m²: {recommendedBtu.toLocaleString()} BTU ({recommendedTon} Ton)</span>
                  </div>

                  {/* Selector de equipo interactivo */}
                  <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 print:hidden">
                    <span className="text-xs font-bold text-slate-700 shrink-0">Cambiar Modelo de Equipo:</span>
                    <select
                      value={selectedEquipId}
                      onChange={e => handleSelectEquipment(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableEquipments.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} — {formatAirPrice(eq.sale_price || 0, currencySymbol, countryCode)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                        <th className="p-3">Concepto</th>
                        <th className="p-3 text-center w-20">Cantidad</th>
                        <th className="p-3 text-right w-36">Precio Unitario</th>
                        <th className="p-3 text-right w-36">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">
                          {currentEquipment?.name || `A.A ECOLD ${recommendedBtu / 1000}K BTU SEER 21.5 INVERTER CON WIFI`}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={equipmentQty}
                            onChange={e => setEquipmentQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 text-center py-0.5 border rounded border-slate-300 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 text-right font-mono">
                          <div className="flex items-center justify-end gap-1">
                            <span>{currencySymbol}</span>
                            <input
                              type="number"
                              min="0"
                              value={equipmentPrice}
                              onChange={e => setEquipmentPrice(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 text-right py-0.5 border rounded border-slate-300 font-mono font-bold focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatAirPrice(subtotalEquipos, currencySymbol, countryCode)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                        <td colSpan={3} className="p-2.5 text-right uppercase text-slate-700">Subtotal Equipos:</td>
                        <td className="p-2.5 text-right font-mono text-slate-900">{formatAirPrice(subtotalEquipos, currencySymbol, countryCode)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Mano de Obra y Materiales de Instalación */}
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-blue-100 text-blue-900 font-bold px-4 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                    <span>(Mano de Obra y Materiales de Instalación)</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded border border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agregar Ítem</span>
                    </button>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                        <th className="p-3">Concepto</th>
                        <th className="p-3 text-center w-20">Cantidad</th>
                        <th className="p-3 text-right w-36">Precio Unitario</th>
                        <th className="p-3 text-right w-36">Total</th>
                        <th className="p-3 text-center w-10 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {installationItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.concept}
                              onChange={e => handleItemChange(item.id, 'concept', e.target.value)}
                              className="w-full font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none uppercase"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-14 text-center py-0.5 border rounded border-slate-200 font-medium focus:outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <div className="flex items-center justify-end gap-1">
                              <span>{currencySymbol}</span>
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={e => handleItemChange(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                                className="w-24 text-right py-0.5 border rounded border-slate-200 font-mono focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                            {formatAirPrice(item.total || 0, currencySymbol, countryCode)}
                          </td>
                          <td className="p-2.5 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                        <td colSpan={3} className="p-2.5 text-right uppercase text-slate-700">Subtotal Instalación:</td>
                        <td className="p-2.5 text-right font-mono text-slate-900">{formatAirPrice(subtotalInstalacion, currencySymbol, countryCode)}</td>
                        <td className="print:hidden"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* CASO 2: MANTENCIÓN MULTIEQUIPO CORPORATIVA (NK-035) */}
            {isMultiMaintenance && (
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-blue-100 text-blue-900 font-bold px-4 py-2.5 text-xs uppercase tracking-wider flex flex-wrap items-center justify-between gap-2">
                  <span>🏢 Partidas de Mantención Multiequipo Corporativa</span>
                  <button
                    type="button"
                    onClick={() => handleAddMaintenanceItem()}
                    className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-300 hover:bg-blue-50 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Partida</span>
                  </button>
                </div>

                {/* Presets Rápidos */}
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 print:hidden">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Rápidos:</span>
                  <button
                    type="button"
                    onClick={() => handleAddMaintenanceItem('MANTENCIÓN PREVENTIVA SPLIT 9.000 - 12.000 BTU (DESARME E HIDROLAVADO)', isChile ? 35000 : 22000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Split 9k-12k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMaintenanceItem('MANTENCIÓN PREVENTIVA SPLIT 18.000 - 24.000 BTU (DESARME Y PRESIÓN)', isChile ? 45000 : 32000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Split 18k-24k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMaintenanceItem('MANTENCIÓN CASSETTE / PISO-CIELO 36.000 - 60.000 BTU', isChile ? 75000 : 55000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Cassette / Piso-Cielo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMaintenanceItem('SANITIZACIÓN Y DESINFECCIÓN CON BACTERICIDA CERTIFICADO', isChile ? 45000 : 25000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Sanitización
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMaintenanceItem('REVISIÓN ELÉCTRICA DE TABLEROS Y CONSUMO AMPERIMÉTRICO', isChile ? 50000 : 30000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Tableros & Amperaje
                  </button>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                      <th className="p-3">Descripción de Partida / Servicio</th>
                      <th className="p-3 text-center w-24">Cantidad</th>
                      <th className="p-3 text-right w-36">Precio Unitario</th>
                      <th className="p-3 text-right w-36">Total</th>
                      <th className="p-3 text-center w-10 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {maintenanceItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.concept}
                            onChange={e => handleMaintenanceItemChange(item.id, 'concept', e.target.value)}
                            className="w-full font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none uppercase"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleMaintenanceItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-16 text-center py-0.5 border rounded border-slate-200 font-bold focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <div className="flex items-center justify-end gap-1">
                            <span>{currencySymbol}</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={e => handleMaintenanceItemChange(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                              className="w-24 text-right py-0.5 border rounded border-slate-200 font-mono focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                          {formatAirPrice(item.total || 0, currencySymbol, countryCode)}
                        </td>
                        <td className="p-2.5 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveMaintenanceItem(item.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                            title="Eliminar partida"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                      <td colSpan={3} className="p-2.5 text-right uppercase text-slate-700">Subtotal Mantención Multiequipo:</td>
                      <td className="p-2.5 text-right font-mono text-slate-900">{formatAirPrice(subtotalInstalacion, currencySymbol, countryCode)}</td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* CASO 3: REPARACIÓN Y DIAGNÓSTICO (NK-035) */}
            {isRepair && (
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-blue-100 text-blue-900 font-bold px-4 py-2.5 text-xs uppercase tracking-wider flex flex-wrap items-center justify-between gap-2">
                  <span>🔧 Detalle de Reparación, Repuestos & Diagnóstico</span>
                  <button
                    type="button"
                    onClick={() => handleAddRepairItem()}
                    className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-300 hover:bg-blue-50 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                {/* Presets Rápidos */}
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 print:hidden">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Rápidos:</span>
                  <button
                    type="button"
                    onClick={() => handleAddRepairItem('VISITA TÉCNICA ESPECIALIZADA Y DIAGNÓSTICO EN TERRENO', isChile ? 35000 : 25000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Diagnóstico Terreno
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddRepairItem('DETECCIÓN DE FUGAS CON NITRÓGENO Y CORRECCIÓN DE UNIONES', isChile ? 65000 : 45000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Fuga & Nitrógeno
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddRepairItem('CARGA COMPLETA REFRIGERANTE R410A / R32 CON BALANZA Y VACÍO', isChile ? 55000 : 38000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Carga Refrigerante
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddRepairItem('SUSTITUCIÓN DE CAPACITOR DUAL MARCHA/ARRANQUE', isChile ? 45000 : 28000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Capacitor Dual
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddRepairItem('REEMPLAZO / REPARACIÓN DE TARJETA ELECTRÓNICA INVERTER', isChile ? 120000 : 85000)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-cyan-500 hover:text-cyan-700 transition-colors cursor-pointer"
                  >
                    + Tarjeta Inverter
                  </button>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                      <th className="p-3">Concepto / Procedimiento</th>
                      <th className="p-3 text-center w-24">Cantidad</th>
                      <th className="p-3 text-right w-36">Precio Unitario</th>
                      <th className="p-3 text-right w-36">Total</th>
                      <th className="p-3 text-center w-10 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {repairItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.concept}
                            onChange={e => handleRepairItemChange(item.id, 'concept', e.target.value)}
                            className="w-full font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none uppercase"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleRepairItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-16 text-center py-0.5 border rounded border-slate-200 font-bold focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <div className="flex items-center justify-end gap-1">
                            <span>{currencySymbol}</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={e => handleRepairItemChange(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                              className="w-24 text-right py-0.5 border rounded border-slate-200 font-mono focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                          {formatAirPrice(item.total || 0, currencySymbol, countryCode)}
                        </td>
                        <td className="p-2.5 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveRepairItem(item.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                            title="Eliminar ítem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                      <td colSpan={3} className="p-2.5 text-right uppercase text-slate-700">Subtotal Reparación:</td>
                      <td className="p-2.5 text-right font-mono text-slate-900">{formatAirPrice(subtotalInstalacion, currencySymbol, countryCode)}</td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Totals Summary Card (Exact match with specimen) */}
            <div className="flex flex-col sm:flex-row justify-end">
              <div className="w-full sm:w-80 border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 uppercase">Sub Total</span>
                  <span className="font-mono font-bold text-slate-900">{formatAirPrice(subTotalDirecto, currencySymbol, countryCode)}</span>
                </div>
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 uppercase">IVA ({taxRatePercent}% sobre Costo Directo)</span>
                  <span className="font-mono font-bold text-slate-900">{formatAirPrice(montoIva, currencySymbol, countryCode)}</span>
                </div>
                <div className="p-4 bg-blue-600 text-white flex justify-between items-center text-sm font-black">
                  <span className="uppercase tracking-wide">Precio de Venta Total</span>
                  <span className="font-mono text-lg">{formatAirPrice(precioVentaTotal, currencySymbol, countryCode)}</span>
                </div>
              </div>
            </div>

            {/* Legal Footnote */}
            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
              <p className="text-[11px] text-slate-600 font-medium italic">
                Esta proforma tiene una validez de 30 días y está sujeta a cambios de precio en los materiales de instalación.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions in Modal (always in reach - hidden when printing) */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden z-20">
          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-medium hidden sm:inline">
              💡 Precios editables en la tabla
            </span>
            <span className="text-slate-900 font-bold">
              Total: <strong className="font-mono text-sm text-blue-700">{formatAirPrice(precioVentaTotal, currencySymbol, countryCode)}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Descargar cotización oficial en PDF liviano"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handleCopyImageToWhatsApp}
              disabled={isGeneratingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Copia la proforma como imagen y abre WhatsApp para pegarla con Ctrl+V"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar WhatsApp (Ctrl + V)</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="Cerrar proforma (Esc)"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
