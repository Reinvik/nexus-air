import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ServiceOrder, AirSettings } from '../types';
import { formatAirPrice, getTaxPercentage } from './countries';

export interface ProformaPdfData {
  folio: string;
  date: string;
  clientName: string;
  clientIdNumber?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  serviceCategory?: 'instalacion' | 'mantencion_multiequipo' | 'reparacion';
  serviceTitle?: string;
  areaM2?: number;
  recommendedBtu?: number;
  recommendedTon?: number;
  equipmentName?: string;
  equipmentQty?: number;
  equipmentPrice?: number;
  installationItems?: Array<{ concept: string; quantity: number; unitPrice: number; total: number; notes?: string }>;
  customItems?: Array<{ concept: string; quantity: number; unitPrice: number; total: number; notes?: string }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  applyTax?: boolean; // NK-039: IVA Seleccionable
  notes?: string;
}

/**
 * Espera a que todas las imágenes dentro de un contenedor se hayan cargado completamente.
 */
async function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

/**
 * Renderiza un contenedor temporal a jsPDF Letter optimizado y liviano (~150-250 KB).
 */
async function renderElementToPdf(container: HTMLElement, filename: string): Promise<void> {
  await waitForImages(container);

  // Escala 2 con fondo blanco puro y renderizado nítido sin desfases de scroll ni cortes superiores
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 780,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    onclone: (_clonedDoc, clonedEl) => {
      clonedEl.style.position = 'static';
      clonedEl.style.top = '0px';
      clonedEl.style.left = '0px';
      clonedEl.style.margin = '0 auto';
      clonedEl.style.paddingTop = '0px';
    }
  });

  // JPEG calidad 0.95 para garantizar nitidez impecable de tipografía y vectoriales
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  // Dimensiones de hoja Letter (215.9 x 279.4 mm)
  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const minMarginX = 8;
  const minMarginY = 8;
  const maxPrintWidth = pageWidth - (minMarginX * 2);
  const maxPrintHeight = pageHeight - (minMarginY * 2);

  let printWidth = maxPrintWidth;
  let printHeight = (canvas.height * printWidth) / canvas.width;

  if (printHeight > maxPrintHeight) {
    printHeight = maxPrintHeight;
    printWidth = (canvas.width * printHeight) / canvas.height;
  }

  // Centrado horizontal y alineado en la parte superior (8 mm de margen superior, SIN espacio blanco excesivo)
  const posX = minMarginX + (maxPrintWidth - printWidth) / 2;
  const posY = minMarginY;

  pdf.addImage(imgData, 'JPEG', posX, posY, printWidth, printHeight);

  // Guardar archivo
  pdf.save(filename);
}

/**
 * Renderiza y descarga como PNG optimizado usando el contenedor limpio aislado.
 */
export async function downloadElementAsCleanPng(container: HTMLElement, filename: string): Promise<void> {
  await waitForImages(container);
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 780,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    onclone: (_clonedDoc, clonedEl) => {
      clonedEl.style.position = 'static';
      clonedEl.style.top = '0px';
      clonedEl.style.left = '0px';
      clonedEl.style.margin = '0 auto';
      clonedEl.style.paddingTop = '0px';
    }
  });
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Renderiza y copia la imagen PNG al portapapeles usando el contenedor limpio aislado.
 */
export async function copyElementAsCleanPng(container: HTMLElement, filenameFallback: string): Promise<boolean> {
  await waitForImages(container);
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 780,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    onclone: (_clonedDoc, clonedEl) => {
      clonedEl.style.position = 'static';
      clonedEl.style.top = '0px';
      clonedEl.style.left = '0px';
      clonedEl.style.margin = '0 auto';
      clonedEl.style.paddingTop = '0px';
    }
  });

  return new Promise<boolean>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } else {
          // Fallback a descarga automática si el portapapeles no soporta PNG directo
          const dataUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = filenameFallback;
          a.click();
          resolve(false);
        }
      } catch (err) {
        console.warn('Fallback clipboard descarga:', err);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filenameFallback;
        a.click();
        resolve(false);
      }
    }, 'image/png');
  });
}

/**
 * Helper para formatear fecha y hora garantizadas del servicio técnico (NK-026).
 */
export function getReceiptDateTimeFormatted(order: ServiceOrder): { dateFormatted: string; timeFormatted: string } {
  let dateFormatted = '';
  let timeFormatted = '';

  if (order.scheduled_date && order.scheduled_date.trim() !== '') {
    const trimmed = order.scheduled_date.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      dateFormatted = `${d}/${m}/${y}`;
    } else {
      dateFormatted = trimmed;
    }
  }

  if (order.scheduled_time_slot && order.scheduled_time_slot.trim() !== '') {
    timeFormatted = order.scheduled_time_slot.includes('hrs') 
      ? order.scheduled_time_slot 
      : `${order.scheduled_time_slot} hrs`;
  }

  if (order.completed_at) {
    try {
      const d = new Date(order.completed_at);
      if (!isNaN(d.getTime())) {
        if (!dateFormatted) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          dateFormatted = `${dd}/${mm}/${yyyy}`;
        }
        if (!timeFormatted) {
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          timeFormatted = `${hh}:${min} hrs`;
        }
      }
    } catch {}
  }

  if (order.created_at) {
    try {
      const d = new Date(order.created_at);
      if (!isNaN(d.getTime())) {
        if (!dateFormatted) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          dateFormatted = `${dd}/${mm}/${yyyy}`;
        }
        if (!timeFormatted) {
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          timeFormatted = `${hh}:${min} hrs`;
        }
      }
    } catch {}
  }

  if (!dateFormatted) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    dateFormatted = `${dd}/${mm}/${yyyy}`;
  }

  if (!timeFormatted) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    timeFormatted = `${hh}:${min} hrs`;
  }

  return { dateFormatted, timeFormatted };
}

/**
 * Plantilla HTML limpia y aislada para el Comprobante de Servicio Técnico.
 */
export function buildReceiptHtml(order: ServiceOrder, settings: AirSettings): string {
  const currencySymbol = settings.currency_symbol || '$';
  const countryCode = settings.country_code || 'CL';
  const taxPercent = getTaxPercentage(settings.tax_rate);
  const { dateFormatted, timeFormatted } = getReceiptDateTimeFormatted(order);

  const rawTicketNum = order.ticket_number ? String(order.ticket_number).trim() : '';
  const displayFolio = rawTicketNum 
    ? (rawTicketNum.toUpperCase().startsWith('REC-') ? rawTicketNum : `REC-${rawTicketNum}`)
    : `REC-${order.id ? order.id.slice(0, 8).toUpperCase() : '001'}`;
  const invoiceDoc = order.invoice_number || order.folio || '';

  const applyTax = order.apply_tax !== false;
  const calculatedTax = applyTax 
    ? (order.tax > 0 ? order.tax : Math.round(order.total - (order.total / (1 + (taxPercent / 100)))))
    : 0;
  const calculatedSubtotal = order.subtotal > 0 
    ? order.subtotal 
    : (applyTax ? (order.total - calculatedTax) : order.total);
  const calculatedTotal = applyTax ? order.total : calculatedSubtotal;
  const customerName = order.customer?.name || (order as any).customer_name || 'Cliente Particular';
  const customerRut = order.customer?.rut || (order as any).customer_rut || 'Sin registrar';
  const customerPhone = order.customer?.phone || (order as any).customer_phone || '';
  const customerAddress = [order.customer?.address, order.customer?.commune || (order.customer as any)?.city].filter(Boolean).join(', ') || (order as any).customer_address || 'En terreno / Domicilio';

  const serialEvap = order.checklist?.serial_evaporator || order.equipment?.serial_number_evaporator || order.equipment?.serial_number || '—';
  const serialCond = order.checklist?.serial_condenser || order.equipment?.serial_number_condenser || '—';

  const ampInitial = order.checklist?.amp_initial ? `${order.checklist.amp_initial}A` : (order.checklist?.amperage_amps ? `${order.checklist.amperage_amps}A` : '—');
  const ampFinal = order.checklist?.amp_final ? `${order.checklist.amp_final}A` : (order.checklist?.amperage_amps ? `${order.checklist.amperage_amps}A` : '—');
  const voltage = order.checklist?.voltage_final ? `${order.checklist.voltage_final}V` : (order.checklist?.voltage_initial ? `${order.checklist.voltage_initial}V` : '220V');
  const psiLowInitial = order.checklist?.psi_low_initial ? `${order.checklist.psi_low_initial} PSI` : (order.checklist?.suction_pressure_psi ? `${order.checklist.suction_pressure_psi} PSI` : '—');
  const psiLowFinal = order.checklist?.psi_low_final ? `${order.checklist.psi_low_final} PSI` : (order.checklist?.suction_pressure_psi ? `${order.checklist.suction_pressure_psi} PSI` : '—');
  const deltaT = order.checklist?.delta_t_celsius ? `${order.checklist.delta_t_celsius}°C` : (order.checklist?.capacitance_mfd ? `${order.checklist.capacitance_mfd} µF` : 'Conforme');

  const statusBadgeLabel = order.payment_status === 'pagado' ? 'PAGADO ✓' : (order.payment_status === 'abono' ? 'ABONO PARCIAL' : 'PENDIENTE');
  const statusBadgeStyle = order.payment_status === 'pagado' 
    ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'
    : (order.payment_status === 'abono'
        ? 'background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;'
        : 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;');

  return `
    <div style="width: 760px; padding: 22px 26px 18px 26px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 11px; line-height: 1.35; border: 1px solid #e2e8f0; border-radius: 16px;">
      
      <!-- ENCABEZADO OFICIAL (ESTILO IMAGEN 2) -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <!-- Marca y Datos Empresa -->
          <td style="vertical-align: top; width: 62%; padding-right: 12px;">
            <table style="border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle; padding-right: 12px;">
                  ${settings.logo_url ? `
                    <img src="${settings.logo_url}" alt="Logo" style="max-height: 44px; max-width: 120px; object-fit: contain; border-radius: 8px;" />
                  ` : `
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: #0284c7; display: flex; align-items: center; justify-content: center; color: #ffffff;">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
                        <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
                        <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
                      </svg>
                    </div>
                  `}
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 19px; font-weight: 900; color: #0f172a; line-height: 1.1; letter-spacing: -0.4px;">
                    ${settings.fantasy_name || settings.company_name || 'NEXUS AIR'}
                  </div>
                  <div style="font-size: 9.5px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-top: 3px;">
                    ${settings.company_slogan || 'ESPECIALISTAS EN CLIMATIZACIÓN Y REFRIGERACIÓN'}
                  </div>
                </td>
              </tr>
            </table>

            <div style="margin-top: 8px; font-size: 10.5px; color: #64748b; line-height: 1.45;">
              <div>
                ${settings.tax_id_label || 'Cédula Jurídica / DIMEX'}: <strong style="color: #0f172a;">${settings.rut || settings.tax_id || 'Sin registrar'}</strong>${settings.city ? ` • Ciudad: <span style="color: #334155;">${settings.city}</span>` : ''}
              </div>
              <div>
                ${[settings.address, settings.commune].filter(Boolean).join(', ') || 'Dirección comercial'}${settings.phone ? ` • Tel: <span style="color: #0f172a; font-weight: 600;">${settings.phone}</span>` : ''}
              </div>
              ${settings.website ? `
                <div style="color: #0284c7; font-family: monospace; font-size: 10px; margin-top: 2px;">
                  ${settings.website}
                </div>
              ` : ''}
            </div>
          </td>

          <!-- Rectángulo Comprobante (Estilo Moderno Imagen 2) -->
          <td style="vertical-align: top; width: 38%; text-align: right;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 14px; width: 220px; margin-left: auto; box-sizing: border-box; text-align: right;">
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">
                COMPROBANTE DE SERVICIO
              </div>
              <div style="font-family: monospace; font-size: 16px; font-weight: 900; color: #0369a1; margin-bottom: 4px;">
                ${displayFolio}
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 2px;">
                <tr>
                  <td style="font-size: 10px; color: #0284c7; font-weight: 700; text-align: right; padding: 1.5px 4px 1.5px 0;">
                    N° Folio:
                  </td>
                  <td style="font-size: 10px; font-family: monospace; color: #0f172a; font-weight: 800; text-align: right; padding: 1.5px 0; width: 1%; white-space: nowrap;">
                    ${displayFolio}
                  </td>
                </tr>
                ${invoiceDoc ? `
                  <tr>
                    <td style="font-size: 10px; color: #475569; font-weight: 600; text-align: right; padding: 1.5px 4px 1.5px 0;">
                      Doc / Factura:
                    </td>
                    <td style="font-size: 10px; font-family: monospace; color: #0f172a; font-weight: 700; text-align: right; padding: 1.5px 0; width: 1%; white-space: nowrap;">
                      ${invoiceDoc}
                    </td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="font-size: 10px; color: #475569; font-weight: 500; text-align: right; padding: 1.5px 4px 1.5px 0;">
                    Fecha:
                  </td>
                  <td style="font-size: 10px; font-weight: 700; color: #0f172a; text-align: right; padding: 1.5px 0; width: 1%; white-space: nowrap;">
                    ${dateFormatted}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 10px; color: #475569; font-weight: 500; text-align: right; padding: 1.5px 4px 1.5px 0;">
                    Hora:
                  </td>
                  <td style="font-size: 10px; font-weight: 700; color: #0f172a; text-align: right; padding: 1.5px 0; width: 1%; white-space: nowrap;">
                    ${timeFormatted}
                  </td>
                </tr>
              </table>
              <div style="margin-top: 6px; text-align: right;">
                <span style="display: inline-block; padding: 2.5px 12px; border-radius: 9999px; font-size: 9px; font-weight: 800; text-transform: uppercase; ${statusBadgeStyle}">
                  ${statusBadgeLabel}
                </span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Línea Divisoria Sutil -->
      <div style="height: 1px; background: #e2e8f0; margin-bottom: 12px;"></div>

      <!-- DATOS CLIENTE Y EQUIPO (2 TARJETAS REDONDEADAS IMAGEN 2) -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <!-- Cliente -->
          <td style="width: 50%; vertical-align: top; padding-right: 6px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 14px; box-sizing: border-box; min-height: 110px;">
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span style="vertical-align: middle;">DATOS DEL CLIENTE</span>
              </div>
              <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1.2;">
                ${customerName}
              </div>
              <div style="font-size: 10.5px; color: #475569; margin-top: 3px;">
                ${settings.tax_id_label || 'Cédula Jurídica / DIMEX'}: <span style="color: #0f172a; font-weight: 600;">${customerRut}</span>
              </div>
              <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
                Dirección: <span style="color: #0f172a;">${customerAddress}</span>
              </div>
              ${customerPhone && customerPhone !== '—' ? `
                <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
                  Tel: <span style="color: #0f172a; font-weight: 600;">${customerPhone}</span>
                </div>
              ` : ''}
            </div>
          </td>

          <!-- Equipo & Técnico -->
          <td style="width: 50%; vertical-align: top; padding-left: 6px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 14px; box-sizing: border-box; min-height: 110px;">
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <span style="vertical-align: middle;">EQUIPO INTERVENIDO</span>
              </div>
              <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1.2;">
                ${order.equipment?.brand || 'Equipo Climatizador'} ${order.equipment?.btu ? `(${order.equipment.btu.toLocaleString()} BTU)` : ''}
              </div>
              <div style="font-size: 10.5px; color: #475569; margin-top: 3px;">
                📍 Ubicación: <strong style="color: #0f172a;">${order.equipment?.location_in_property || 'Área Principal'}</strong>
              </div>
              ${(serialEvap !== '—' || serialCond !== '—') ? `
                <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: #0369a1; margin-top: 2px;">
                  ${serialEvap !== '—' ? `<span style="background: #e0f2fe; padding: 1px 5px; border-radius: 4px; border: 1px solid #bae6fd;">Evap: ${serialEvap}</span> ` : ''}
                  ${serialCond !== '—' ? `<span style="background: #e0f2fe; padding: 1px 5px; border-radius: 4px; border: 1px solid #bae6fd;">Cond: ${serialCond}</span>` : ''}
                </div>
              ` : ''}
              <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
                ${order.equipment?.refrigerant ? `Gas: <span style="font-weight: 600; color: #0f172a;">${order.equipment.refrigerant}</span> • ` : ''}Tecnología: <span style="font-weight: 600; color: #0f172a;">${(order.equipment?.technology || 'INVERTER').toUpperCase()}</span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- INFORME DE TRABAJO & MEDICIONES HVAC (IMAGEN 2) -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 14px; margin-bottom: 12px; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
          <tr>
            <td style="font-size: 10.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
              INFORME DE TRABAJO & DIAGNÓSTICO TÉCNICO
            </td>
            <td style="text-align: right; font-size: 9.5px; font-weight: 800; color: #0284c7; text-transform: uppercase;">
              SERVICIO: ${order.service_type.replace('_', ' ').toUpperCase()}
            </td>
          </tr>
        </table>

        ${order.diagnosis ? `
          <div style="font-size: 10.5px; margin-bottom: 4px;">
            <strong style="color: #334155;">Diagnóstico Inicial:</strong> <span style="color: #475569;">${order.diagnosis}</span>
          </div>
        ` : ''}
        ${order.resolution ? `
          <div style="font-size: 10.5px; margin-bottom: 6px;">
            <strong style="color: #334155;">Resolución / Labores:</strong> <span style="color: #475569;">${order.resolution}</span>
          </div>
        ` : ''}

        <!-- Protocol Measurements (4 Píldoras en 1 fila) -->
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
              <td style="font-size: 10px; font-weight: 800; color: #334155; text-transform: uppercase;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
                <span style="vertical-align: middle; margin-left: 3px;">MEDICIONES ELÉCTRICAS Y PRESIÓN (PROTOCOLO CALIDAD HVAC)</span>
              </td>
              ${order.checklist?.work_start_time || order.checklist?.work_end_time ? `
                <td style="text-align: right; font-size: 9px; font-family: monospace; color: #64748b;">
                  Horario: ${order.checklist.work_start_time || '—'} a ${order.checklist.work_end_time || '—'}
                </td>
              ` : ''}
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 25%; padding-right: 4px;">
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 7px 9px;">
                  <div style="font-size: 9px; color: #64748b; font-weight: 600;">Consumo (Amp)</div>
                  <div style="font-family: monospace; font-size: 10px; font-weight: 800; color: #0369a1; margin-top: 2px;">
                    Ini: ${ampInitial} | Fin: ${ampFinal}
                  </div>
                </div>
              </td>
              <td style="width: 25%; padding-right: 4px; padding-left: 4px;">
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 7px 9px;">
                  <div style="font-size: 9px; color: #64748b; font-weight: 600;">Voltaje (V)</div>
                  <div style="font-family: monospace; font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                    ${voltage}
                  </div>
                </div>
              </td>
              <td style="width: 25%; padding-right: 4px; padding-left: 4px;">
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 7px 9px;">
                  <div style="font-size: 9px; color: #64748b; font-weight: 600;">Presión Baja (PSI)</div>
                  <div style="font-family: monospace; font-size: 10px; font-weight: 800; color: #0369a1; margin-top: 2px;">
                    Ini: ${psiLowInitial} | Fin: ${psiLowFinal}
                  </div>
                </div>
              </td>
              <td style="width: 25%; padding-left: 4px;">
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 7px 9px;">
                  <div style="font-size: 9px; color: #64748b; font-weight: 600;">Salto Térmico (ΔT)</div>
                  <div style="font-family: monospace; font-size: 10px; font-weight: 800; color: #166534; margin-top: 2px;">
                    ${deltaT}
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- TABLA DE CONCEPTOS Y VALORES (CARD ELEGANTE IMAGEN 2) -->
      <div style="border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 12px; background: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10.5px;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; font-size: 9.5px; font-weight: 800; text-transform: uppercase;">
              <th style="padding: 7px 12px;">Descripción del Concepto / Insumo</th>
              <th style="padding: 7px 10px; text-align: center; width: 60px;">Cant.</th>
              <th style="padding: 7px 12px; text-align: right; width: 110px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items && order.items.length > 0 ? order.items.map((item, idx) => `
              <tr style="border-top: 1px solid #f1f5f9; background: ${idx % 2 === 0 ? '#ffffff' : '#fafafa'};">
                <td style="padding: 7px 12px; font-weight: 600; color: #1e293b;">${item.description}</td>
                <td style="padding: 7px 10px; text-align: center; font-family: monospace;">${item.quantity}</td>
                <td style="padding: 7px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatAirPrice(item.total, currencySymbol, countryCode)}</td>
              </tr>
            `).join('') : `
              <tr style="border-top: 1px solid #f1f5f9; background: #ffffff;">
                <td style="padding: 7px 12px; font-weight: 600; color: #1e293b;">Servicio de ${order.service_type.replace('_', ' ')} (Mano de obra y materiales)</td>
                <td style="padding: 7px 10px; text-align: center; font-family: monospace;">1</td>
                <td style="padding: 7px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatAirPrice(calculatedTotal, currencySymbol, countryCode)}</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Totals Footer Box -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px 16px; text-align: right;">
          <table style="border-collapse: separate; border-spacing: 0; margin-left: auto; width: 260px; font-size: 11px;">
            <tr>
              <td style="padding: 2.5px 0; color: #64748b; text-align: left;">Subtotal Neto:</td>
              <td style="padding: 2.5px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
                ${formatAirPrice(calculatedSubtotal, currencySymbol, countryCode)}
              </td>
            </tr>
            <tr>
              <td style="padding: 2.5px 0; color: #64748b; text-align: left;">${settings.tax_name || 'IVA'} (${applyTax ? `${taxPercent}%` : '0%'}):</td>
              <td style="padding: 2.5px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
                ${applyTax ? formatAirPrice(calculatedTax, currencySymbol, countryCode) : 'Exento (0%)'}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 6px 0;">
                <div style="height: 1px; background: #cbd5e1; width: 100%; font-size: 1px; line-height: 1px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 2px 0 0 0; font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; text-align: left;">
                TOTAL COMPROBANTE:
              </td>
              <td style="padding: 2px 0 0 0; text-align: right; font-family: monospace; font-size: 14px; font-weight: 900; color: #0369a1;">
                ${formatAirPrice(calculatedTotal, currencySymbol, countryCode)}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- TÉRMINOS Y TÉCNICO RESPONSABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td style="width: 58%; vertical-align: top; padding-right: 8px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 10px; font-size: 9px; color: #64748b; line-height: 1.4;">
              <div style="font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                🛡️ Términos de Garantía & Mantención
              </div>
              <div>• Garantía de servicio: <strong>${settings.warranty_months || 6} meses</strong> bajo uso normal.</div>
              <div>• Ciclo recomendado: <strong>${settings.maintenance_interval_months || 6} meses (180 días)</strong> para preservar compresor.</div>
            </div>
          </td>
          <td style="width: 42%; vertical-align: middle;">
            <div style="text-align: right; font-size: 9.5px; color: #64748b; line-height: 1.35;">
              <div>Técnico HVAC: <strong style="color: #0f172a;">${order.assigned_technician?.name || 'Técnico Especialista'}</strong></div>
              ${order.assigned_technician?.sec_certified ? '<div style="color: #0284c7; font-weight: 700;">Instalador Certificado SEC ✓</div>' : ''}
            </div>
          </td>
        </tr>
      </table>

      <!-- FIRMAS DE CONFORMIDAD -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 6px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: bottom;">
            <div style="border-bottom: 1.5px dashed #94a3b8; height: 26px; margin-bottom: 4px;"></div>
            <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${order.checklist?.technician_signature_name || order.assigned_technician?.name || 'Firma Técnico Especialista'}</div>
            <div style="font-size: 8.5px; color: #64748b;">Técnico Responsable HVAC</div>
          </td>
          <td style="width: 10%;"></td>
          <td style="width: 45%; text-align: center; vertical-align: bottom;">
            <div style="border-bottom: 1.5px dashed #94a3b8; height: 26px; margin-bottom: 4px;"></div>
            <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${order.checklist?.customer_signature_name || customerName}</div>
            <div style="font-size: 8.5px; color: #64748b;">Firma Recepción Conforme</div>
          </td>
        </tr>
      </table>

      <!-- PIE DE PÁGINA -->
      <div style="text-align: center; font-size: 8.5px; color: #94a3b8; margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 6px; text-transform: uppercase;">
        ${settings.fantasy_name || settings.company_name || 'NEXUS AIR'} • SISTEMA DE GESTIÓN CLIMATIZACIÓN MULTI-TENANT • CONTROL OFICIAL HVAC
      </div>

    </div>
  `;
}

/**
 * Plantilla HTML limpia y aislada para la Cotización / Proforma Oficial.
 */
export function buildProformaHtml(data: ProformaPdfData, settings: AirSettings): string {
  const currencySymbol = settings.currency_symbol || '$';
  const countryCode = settings.country_code || 'CL';
  const taxPercent = getTaxPercentage(data.taxRate || settings.tax_rate);
  const category = data.serviceCategory || 'instalacion';

  const isMultiMaintenance = category === 'mantencion_multiequipo';
  const isRepair = category === 'reparacion';

  const categoryTitle = data.serviceTitle || (
    isMultiMaintenance 
      ? 'PRESUPUESTO MANTENCIÓN MULTIEQUIPO' 
      : isRepair 
        ? 'PRESUPUESTO REPARACIÓN Y DIAGNÓSTICO' 
        : 'COTIZACIÓN / PROFORMA'
  );

  const displayFolio = data.folio && data.folio.trim() !== '' ? data.folio.trim() : 'PRO-001';

  const displayDate = (() => {
    if (data.date && data.date.trim() !== '') {
      const trimmed = data.date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [y, m, d] = trimmed.split('-');
        return `${d}/${m}/${y}`;
      }
      return trimmed;
    }
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  })();

  const applyTax = data.applyTax !== false;
  const effectiveTaxAmount = applyTax ? data.taxAmount : 0;
  const effectiveTotal = applyTax ? data.total : data.subtotal;

  return `
    <div style="width: 760px; padding: 32px 28px 24px 28px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 11px; line-height: 1.35;">
      
      <!-- ENCABEZADO -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border-bottom: 2px solid #0891b2; padding-bottom: 12px;">
        <tr>
          <td style="vertical-align: top; width: 56%;">
            ${settings.logo_url ? `
              <div style="margin-bottom: 8px;">
                <img src="${settings.logo_url}" alt="Logo" style="max-height: 48px; max-width: 160px; object-fit: contain;" />
              </div>
            ` : ''}
            <div style="font-size: 18px; font-weight: 900; color: #0e7490; letter-spacing: -0.5px; text-transform: uppercase;">
              ${settings.fantasy_name || settings.company_name || 'NEXUS AIR CLIMATIZACIÓN'}
            </div>
            <div style="font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px;">
              ${settings.company_slogan || (isMultiMaintenance ? 'Mantenimiento Preventivo Multiequipo & Planes Corporativos HVAC' : isRepair ? 'Servicio Técnico de Reparación Especializada & Diagnóstico' : 'Soluciones Integrales de Climatización & Cálculo Térmico')}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
              ${settings.address ? `<span>📍 ${settings.address}</span> • ` : ''}
              ${settings.phone ? `<span>📞 ${settings.phone}</span> • ` : ''}
              ${settings.email ? `<span>✉️ ${settings.email}</span>` : ''}
            </div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
              <strong>${settings.tax_id_label || 'RUT/ID'}:</strong> ${settings.rut || '77.892.410-K'} • <strong>País:</strong> ${settings.country || 'Chile'}${settings.city ? ` • <strong>Ciudad:</strong> ${settings.city}` : ''}
            </div>
          </td>
          <td style="vertical-align: top; width: 44%; text-align: right;">
            <div style="display: inline-block; border: 2px solid #0891b2; border-radius: 8px; padding: 12px 18px; background: #ecfeff; text-align: center; min-width: 215px;">
              <div style="font-size: 10px; font-weight: 800; color: #0e7490; text-transform: uppercase;">
                ${categoryTitle}
              </div>
              <div style="font-family: monospace; font-size: 17px; font-weight: 900; color: #155e75; margin: 4px 0;">
                ${displayFolio}
              </div>
              <div style="font-size: 10px; color: #0e7490; font-weight: 800; margin-bottom: 4px;">
                N° Folio: <strong style="font-family: monospace; color: #155e75;">${displayFolio}</strong>
              </div>
              <div style="font-size: 10px; color: #475569; font-weight: 700;">
                <span>Fecha:</span> <strong style="color: #0f172a;">${displayDate}</strong>
              </div>
              <div style="font-size: 9.5px; color: #0891b2; font-weight: 700; margin-top: 4px;">
                Vigencia: 30 Días
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- DATOS CLIENTE & ALCANCE TÉCNICO -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <tr>
          <!-- Cliente -->
          <td style="width: 50%; vertical-align: top; padding-right: 8px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px;">
              <tr style="background: #f1f5f9;">
                <th colspan="2" style="text-align: left; padding: 5px 8px; font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
                  👤 Datos del Cliente
                </th>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; width: 35%; border-bottom: 1px solid #f1f5f9;">Nombre:</td>
                <td style="padding: 4px 8px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${data.clientName || 'Cliente Particular'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">${settings.tax_id_label || 'ID / Cédula'}:</td>
                <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${data.clientIdNumber || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Teléfono:</td>
                <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${data.clientPhone || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b;">Correo:</td>
                <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">${data.clientEmail || '—'}</td>
              </tr>
            </table>
          </td>

          <!-- Alcance del Servicio o Dimensionamiento -->
          <td style="width: 50%; vertical-align: top; padding-left: 8px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px;">
              <tr style="background: #f1f5f9;">
                <th colspan="2" style="text-align: left; padding: 5px 8px; font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
                  ${isMultiMaintenance ? '🏢 Alcance Mantención Multiequipo' : isRepair ? '🔧 Diagnóstico y Alcance Técnico' : '📐 Estudio Térmico Estimado'}
                </th>
              </tr>
              ${isMultiMaintenance ? `
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; width: 45%; border-bottom: 1px solid #f1f5f9;">Tipo de Servicio:</td>
                  <td style="padding: 4px 8px; font-weight: 700; color: #0891b2; border-bottom: 1px solid #f1f5f9;">Mantención Preventiva Corporativa</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Protocolo:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Desarme, Hidrolavado, Sanitización y Presiones</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Garantía Técnica:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">6 Meses de Cobertura</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b;">Normativa:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">Estándar HVAC y Eficiencia Eléctrica</td>
                </tr>
              ` : isRepair ? `
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; width: 45%; border-bottom: 1px solid #f1f5f9;">Servicio:</td>
                  <td style="padding: 4px 8px; font-weight: 700; color: #0891b2; border-bottom: 1px solid #f1f5f9;">Reparación y Corrección de Fallas</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Pruebas:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Detección de fugas, vacío y presurización</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Refrigerante:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Ecológico R410A / R32 Puro</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b;">Garantía:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">6 Meses en componentes y mano de obra</td>
                </tr>
              ` : `
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; width: 45%; border-bottom: 1px solid #f1f5f9;">Área a Climatizar:</td>
                  <td style="padding: 4px 8px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${data.areaM2 || 20} m²</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Capacidad Sugerida:</td>
                  <td style="padding: 4px 8px; font-weight: 700; color: #0891b2; border-bottom: 1px solid #f1f5f9;">
                    ${data.recommendedBtu ? `${data.recommendedBtu.toLocaleString()} BTU` : '12.000 BTU'} ${data.recommendedTon ? `(${data.recommendedTon} Ton)` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Tecnología:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Inverter Alta Eficiencia</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #64748b;">Refrigerante:</td>
                  <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">R410A / R32 Ecológico</td>
                </tr>
              `}
            </table>
          </td>
        </tr>
      </table>

      <!-- DETALLE DE LA PROPUESTA ECONÓMICA -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="padding: 6px 8px; text-align: left; font-size: 9.5px; text-transform: uppercase;">Descripción del Ítem / Servicio</th>
            <th style="padding: 6px 8px; text-align: center; font-size: 9.5px; text-transform: uppercase; width: 12%;">Cant.</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 9.5px; text-transform: uppercase; width: 20%;">Precio Unit.</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 9.5px; text-transform: uppercase; width: 22%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(isMultiMaintenance || isRepair) && data.customItems && data.customItems.length > 0 ? (
            data.customItems.map((item, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 8px;">
                  <div style="font-weight: 700; color: #0f172a;">${item.concept}</div>
                  ${item.notes ? `<div style="font-size: 9px; color: #64748b;">${item.notes}</div>` : ''}
                </td>
                <td style="padding: 6px 8px; text-align: center; font-weight: 700;">${item.quantity}</td>
                <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${formatAirPrice(item.unitPrice, currencySymbol, countryCode)}</td>
                <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatAirPrice(item.total, currencySymbol, countryCode)}</td>
              </tr>
            `).join('')
          ) : (
            `
              <!-- Equipo Principal -->
              ${data.equipmentName ? `
                <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 8px;">
                    <div style="font-weight: 700; color: #0f172a;">${data.equipmentName}</div>
                    <div style="font-size: 9px; color: #64748b;">Unidad interior (evaporadora) + exterior (condensadora) + control remoto</div>
                  </td>
                  <td style="padding: 6px 8px; text-align: center; font-weight: 700;">${data.equipmentQty || 1}</td>
                  <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${formatAirPrice(data.equipmentPrice || 0, currencySymbol, countryCode)}</td>
                  <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatAirPrice((data.equipmentPrice || 0) * (data.equipmentQty || 1), currencySymbol, countryCode)}</td>
                </tr>
              ` : ''}

              <!-- Instalación y Materiales -->
              ${data.installationItems && data.installationItems.length > 0 ? data.installationItems.map((item, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 8px;">
                    <div style="font-weight: 600; color: #1e293b;">${item.concept}</div>
                  </td>
                  <td style="padding: 6px 8px; text-align: center; font-weight: 700;">${item.quantity}</td>
                  <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${formatAirPrice(item.unitPrice, currencySymbol, countryCode)}</td>
                  <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatAirPrice(item.total, currencySymbol, countryCode)}</td>
                </tr>
              `).join('') : ''}
            `
          )}
        </tbody>
      </table>

      <!-- TOTALES Y CONDICIONES -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
        <tr>
          <!-- Condiciones Comerciales -->
          <td style="width: 58%; vertical-align: top; padding-right: 12px;">
            <div style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
              <div style="font-weight: 800; font-size: 10px; color: #0891b2; margin-bottom: 4px; text-transform: uppercase;">
                💼 Condiciones del Presupuesto
              </div>
              <ul style="margin: 0; padding-left: 14px; font-size: 9.5px; color: #475569; line-height: 1.4;">
                <li><strong>Validez:</strong> 30 días corridos a partir de la fecha de emisión.</li>
                <li><strong>Garantía:</strong> 1 año en equipos y 6 meses en mano de obra de instalación.</li>
                <li><strong>Forma de pago:</strong> 50% anticipo al confirmar y 50% contra entrega conforme.</li>
                <li>Incluye presurización con nitrógeno y vacío inferior a 500 micrones.</li>
              </ul>
            </div>
          </td>

          <!-- Resumen Numérico -->
          <td style="width: 42%; vertical-align: top;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
              <tr>
                <td style="padding: 5px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Subtotal Neto:</td>
                <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 600; border-bottom: 1px solid #f1f5f9;">
                  ${formatAirPrice(data.subtotal, currencySymbol, countryCode)}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; color: #64748b; border-bottom: 1px solid #cbd5e1;">${settings.tax_name || 'IVA'} (${applyTax ? `${taxPercent}%` : '0%'}):</td>
                <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 600; border-bottom: 1px solid #cbd5e1;">
                  ${applyTax ? formatAirPrice(effectiveTaxAmount, currencySymbol, countryCode) : 'Exento (0%)'}
                </td>
              </tr>
              <tr style="background: #ecfeff;">
                <td style="padding: 6px 8px; font-size: 11px; font-weight: 900; color: #0e7490;">TOTAL PROPUESTA:</td>
                <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-size: 13px; font-weight: 900; color: #0e7490;">
                  ${formatAirPrice(effectiveTotal, currencySymbol, countryCode)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- FIRMAS -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 8px;">
        <tr>
          <td style="width: 48%; text-align: center; vertical-align: bottom; padding: 0 10px;">
            <div style="border-bottom: 1.5px dashed #64748b; height: 36px; margin-bottom: 6px;"></div>
            <div style="font-size: 10px; font-weight: 700; color: #0f172a;">${settings.fantasy_name || settings.company_name || 'Departamento Técnico HVAC'}</div>
            <div style="font-size: 9px; color: #64748b;">Firma Ejecutivo / Técnico Autorizado</div>
          </td>
          <td style="width: 4%;"></td>
          <td style="width: 48%; text-align: center; vertical-align: bottom; padding: 0 10px;">
            <div style="border-bottom: 1.5px dashed #64748b; height: 36px; margin-bottom: 6px;"></div>
            <div style="font-size: 10px; font-weight: 700; color: #0f172a;">${data.clientName || 'Cliente'}</div>
            <div style="font-size: 9px; color: #64748b;">Aceptación de Cotización</div>
          </td>
        </tr>
      </table>

      <!-- PIE DE PÁGINA -->
      <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${settings.fantasy_name || settings.company_name || 'NEXUS AIR'} • PROPUESTA TÉCNICA Y COMERCIAL DE CLIMATIZACIÓN
      </div>

    </div>
  `;
}

/**
 * Genera y descarga el Comprobante / Recibo de Servicio Oficial en PDF liviano (Nexus Pallet style).
 */
export async function generateReceiptPdfAir(
  order: ServiceOrder,
  settings: AirSettings
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '760px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '999999';
  container.style.boxSizing = 'border-box';
  container.innerHTML = buildReceiptHtml(order, settings);
  document.body.appendChild(container);

  try {
    const filename = `Comprobante_REC-${order.ticket_number}_${order.scheduled_date || 'Servicio'}.pdf`;
    await renderElementToPdf(container, filename);
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Genera y descarga la Cotización / Proforma Oficial en PDF liviano (Nexus Pallet style).
 */
export async function generateProformaPdfAir(
  data: ProformaPdfData,
  settings: AirSettings
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '760px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '999999';
  container.style.boxSizing = 'border-box';
  container.innerHTML = buildProformaHtml(data, settings);
  document.body.appendChild(container);

  try {
    const filename = `Proforma_${data.folio}_${data.clientName.replace(/\s+/g, '_')}.pdf`;
    await renderElementToPdf(container, filename);
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
