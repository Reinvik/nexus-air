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
  areaM2?: number;
  recommendedBtu?: number;
  recommendedTon?: number;
  equipmentName: string;
  equipmentQty: number;
  equipmentPrice: number;
  installationItems?: Array<{ concept: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
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

  // Escala 1.5 con fondo blanco puro y renderizado nítido
  const canvas = await html2canvas(container, {
    scale: 1.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 780,
  });

  // JPEG calidad 0.92 para garantizar peso ultraliviano y fidelidad de texto
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

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

  // Centrado horizontal y vertical
  const posX = minMarginX + (maxPrintWidth - printWidth) / 2;
  const posY = Math.max(minMarginY, (pageHeight - printHeight) / 2);

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
  });

  return new Promise<boolean>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        resolve(true);
      } catch (e) {
        console.warn('Clipboard write failed, triggering fallback download:', e);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filenameFallback;
        a.click();
        URL.revokeObjectURL(url);
        resolve(false);
      }
    }, 'image/png');
  });
}

/**
 * Plantilla HTML limpia y aislada para el Comprobante de Servicio Técnico.
 */
export function buildReceiptHtml(order: ServiceOrder, settings: AirSettings): string {
  const currencySymbol = settings.currency_symbol || '$';
  const countryCode = settings.country_code || 'CL';
  const taxPercent = getTaxPercentage(settings.tax_rate);

  const calculatedTax = order.tax > 0 
    ? order.tax 
    : Math.round(order.total - (order.total / (1 + (taxPercent / 100))));
  const calculatedSubtotal = order.subtotal > 0 
    ? order.subtotal 
    : (order.total - calculatedTax);

  return `
    <div style="width: 760px; padding: 24px 28px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 11px; line-height: 1.35;">
      
      <!-- ENCABEZADO OFICIAL -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border-bottom: 2px solid #0284c7; padding-bottom: 12px;">
        <tr>
          <td style="vertical-align: top; width: 62%;">
            <div style="font-size: 18px; font-weight: 900; color: #0369a1; letter-spacing: -0.5px; text-transform: uppercase;">
              ${settings.fantasy_name || settings.company_name || 'NEXUS AIR CLIMATIZACIÓN'}
            </div>
            <div style="font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px;">
              Servicio Técnico HVAC Especializado & Climatización
            </div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 4px;">
              ${settings.address ? `<span>📍 ${settings.address}</span> • ` : ''}
              ${settings.phone ? `<span>📞 ${settings.phone}</span> • ` : ''}
              ${settings.email ? `<span>✉️ ${settings.email}</span>` : ''}
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 1px;">
              <strong>${settings.tax_id_label || 'RUT/ID'}:</strong> ${settings.rut || '77.892.410-K'} • <strong>País:</strong> ${settings.country || 'Chile'}
            </div>
          </td>
          <td style="vertical-align: top; width: 38%; text-align: right;">
            <div style="display: inline-block; border: 2px solid #0284c7; border-radius: 8px; padding: 8px 14px; background: #f0f9ff; text-align: center; min-width: 180px;">
              <div style="font-size: 8.5px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
                COMPROBANTE DE SERVICIO TÉCNICO
              </div>
              <div style="font-family: monospace; font-size: 16px; font-weight: 900; color: #0c4a6e; margin: 2px 0;">
                REC-${order.ticket_number}
              </div>
              <div style="font-size: 9px; color: #475569;">
                <strong>Fecha:</strong> ${order.scheduled_date || new Date().toISOString().split('T')[0]}
              </div>
              <div style="margin-top: 4px; display: inline-block; padding: 2px 8px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 8.5px; font-weight: 800; text-transform: uppercase;">
                ${order.payment_status === 'pagado' ? 'PAGADO ✓' : (order.payment_status === 'abono' ? 'ABONO PARCIAL' : 'PENDIENTE DE PAGO')}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- DATOS CLIENTE Y EQUIPO -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <tr>
          <!-- Cliente -->
          <td style="width: 50%; vertical-align: top; padding-right: 8px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px;">
              <tr style="background: #f1f5f9;">
                <th colspan="2" style="text-align: left; padding: 5px 8px; font-size: 9.5px; font-weight: 800; color: #1e293b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
                  👤 Información del Cliente
                </th>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; width: 35%; border-bottom: 1px solid #f1f5f9;">Nombre:</td>
                <td style="padding: 4px 8px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${order.customer?.name || 'Cliente Particular'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">${settings.tax_id_label || 'Identificación'}:</td>
                <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${order.customer?.rut || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Teléfono:</td>
                <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${order.customer?.phone || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b;">Dirección:</td>
                <td style="padding: 4px 8px; font-weight: 600; color: #0f172a;">${order.customer?.address || ''} ${order.customer?.commune ? `(${order.customer.commune})` : ''}</td>
              </tr>
            </table>
          </td>

          <!-- Equipo & Técnico -->
          <td style="width: 50%; vertical-align: top; padding-left: 8px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px;">
              <tr style="background: #f1f5f9;">
                <th colspan="2" style="text-align: left; padding: 5px 8px; font-size: 9.5px; font-weight: 800; color: #1e293b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
                  ❄️ Equipo y Técnico Responsable
                </th>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; width: 35%; border-bottom: 1px solid #f1f5f9;">Equipo:</td>
                <td style="padding: 4px 8px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                  ${order.equipment?.brand || 'Equipo Climatizador'} ${order.equipment?.btu ? `${order.equipment.btu.toLocaleString()} BTU` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Ubicación:</td>
                <td style="padding: 4px 8px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${order.equipment?.location_in_property || 'Área Principal'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Técnico HVAC:</td>
                <td style="padding: 4px 8px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #f1f5f9;">
                  ${order.assigned_technician?.name || 'Técnico Autorizado'} ${order.assigned_technician?.sec_certified ? '(SEC ✓)' : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b;">Próx. Mantención:</td>
                <td style="padding: 4px 8px; font-weight: 700; color: #0284c7;">
                  ${order.equipment?.next_maintenance_date || 'En 6 Meses (180 días)'}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- DETALLE DEL SERVICIO Y DIAGNÓSTICO -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #cbd5e1;">
        <tr style="background: #f8fafc;">
          <th style="text-align: left; padding: 6px 10px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1;">
            📋 REPORTE TÉCNICO Y PROCEDIMIENTO REALIZADO
          </th>
        </tr>
        <tr>
          <td style="padding: 8px 10px; background: #ffffff;">
            <div style="margin-bottom: 6px;">
              <strong style="color: #0369a1; text-transform: uppercase; font-size: 9.5px;">Tipo de Servicio:</strong> 
              <span style="font-weight: 700; color: #0f172a;">${order.service_type.replace('_', ' ').toUpperCase()}</span> — 
              <span style="color: #334155;">${order.description || 'Intervención de climatización programada.'}</span>
            </div>
            ${order.diagnosis ? `
              <div style="margin-bottom: 4px; padding: 4px 8px; background: #fffbeb; border-left: 3px solid #f59e0b; font-size: 9.5px;">
                <strong>Diagnóstico Inicial:</strong> ${order.diagnosis}
              </div>
            ` : ''}
            ${order.resolution ? `
              <div style="padding: 4px 8px; background: #f0fdf4; border-left: 3px solid #22c55e; font-size: 9.5px;">
                <strong>Resolución / Puesta en Marcha:</strong> ${order.resolution}
              </div>
            ` : ''}
          </td>
        </tr>
      </table>

      <!-- TABLA DE CONCEPTOS Y VALORES -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase;">Concepto / Ítem</th>
            <th style="padding: 6px 8px; text-align: center; font-size: 9px; text-transform: uppercase; width: 12%;">Tipo</th>
            <th style="padding: 6px 8px; text-align: center; font-size: 9px; text-transform: uppercase; width: 12%;">Cant.</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 9px; text-transform: uppercase; width: 18%;">P. Unitario</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 9px; text-transform: uppercase; width: 20%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items && order.items.length > 0 ? order.items.map((item, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 8px; font-weight: 600; color: #1e293b;">${item.description}</td>
              <td style="padding: 6px 8px; text-align: center; color: #64748b; text-transform: capitalize;">${item.type}</td>
              <td style="padding: 6px 8px; text-align: center; font-weight: 700;">${item.quantity}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${formatAirPrice(item.unit_price, currencySymbol, countryCode)}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatAirPrice(item.total, currencySymbol, countryCode)}</td>
            </tr>
          `).join('') : `
            <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 8px; font-weight: 600; color: #1e293b;">Servicio Técnico HVAC: ${order.service_type.replace('_', ' ').toUpperCase()}</td>
              <td style="padding: 6px 8px; text-align: center; color: #64748b;">Servicio</td>
              <td style="padding: 6px 8px; text-align: center; font-weight: 700;">1</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${formatAirPrice(calculatedSubtotal, currencySymbol, countryCode)}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatAirPrice(calculatedSubtotal, currencySymbol, countryCode)}</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- TOTALES Y CONDICIONES -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
        <tr>
          <!-- Condiciones de Garantía -->
          <td style="width: 58%; vertical-align: top; padding-right: 12px;">
            <div style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
              <div style="font-weight: 800; font-size: 9.5px; color: #0284c7; margin-bottom: 4px; text-transform: uppercase;">
                🛡️ Términos de Garantía & Mantención
              </div>
              <ul style="margin: 0; padding-left: 14px; font-size: 9px; color: #475569; line-height: 1.4;">
                <li>Garantía de mano de obra y repuestos: <strong>${settings.warranty_months || 6} meses</strong> bajo uso normal.</li>
                <li>Ciclo de mantención preventiva recomendado: <strong>${settings.maintenance_interval_months || 6} meses (180 días)</strong> para preservar vida útil del compresor.</li>
                <li>Atención técnica certificada según estándares de climatización.</li>
              </ul>
            </div>
          </td>

          <!-- Resumen Numérico -->
          <td style="width: 42%; vertical-align: top;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
              <tr>
                <td style="padding: 5px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Subtotal Neto:</td>
                <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 600; border-bottom: 1px solid #f1f5f9;">
                  ${formatAirPrice(calculatedSubtotal, currencySymbol, countryCode)}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; color: #64748b; border-bottom: 1px solid #cbd5e1;">${settings.tax_name || 'IVA'} (${taxPercent}%):</td>
                <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 600; border-bottom: 1px solid #cbd5e1;">
                  ${formatAirPrice(calculatedTax, currencySymbol, countryCode)}
                </td>
              </tr>
              <tr style="background: #f0fdf4;">
                <td style="padding: 6px 8px; font-size: 11px; font-weight: 900; color: #166534;">TOTAL FINAL:</td>
                <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-size: 13px; font-weight: 900; color: #166534;">
                  ${formatAirPrice(order.total, currencySymbol, countryCode)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- FIRMAS DE CONFORMIDAD -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 8px;">
        <tr>
          <td style="width: 48%; text-align: center; vertical-align: bottom; padding: 0 10px;">
            <div style="border-bottom: 1.5px dashed #64748b; height: 36px; margin-bottom: 6px;"></div>
            <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${order.assigned_technician?.name || 'Técnico Especialista HVAC'}</div>
            <div style="font-size: 8px; color: #64748b;">Firma Técnico Responsable</div>
          </td>
          <td style="width: 4%;"></td>
          <td style="width: 48%; text-align: center; vertical-align: bottom; padding: 0 10px;">
            <div style="border-bottom: 1.5px dashed #64748b; height: 36px; margin-bottom: 6px;"></div>
            <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${order.customer?.name || 'Cliente Conforme'}</div>
            <div style="font-size: 8px; color: #64748b;">Firma Recepción Conforme</div>
          </td>
        </tr>
      </table>

      <!-- PIE DE PÁGINA -->
      <div style="text-align: center; font-size: 8px; color: #94a3b8; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
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

  return `
    <div style="width: 760px; padding: 24px 28px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 11px; line-height: 1.35;">
      
      <!-- ENCABEZADO -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border-bottom: 2px solid #0891b2; padding-bottom: 12px;">
        <tr>
          <td style="vertical-align: top; width: 62%;">
            <div style="font-size: 18px; font-weight: 900; color: #0e7490; letter-spacing: -0.5px; text-transform: uppercase;">
              ${settings.fantasy_name || settings.company_name || 'NEXUS AIR CLIMATIZACIÓN'}
            </div>
            <div style="font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px;">
              Soluciones Integrales de Climatización & Cálculo Térmico
            </div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 4px;">
              ${settings.address ? `<span>📍 ${settings.address}</span> • ` : ''}
              ${settings.phone ? `<span>📞 ${settings.phone}</span> • ` : ''}
              ${settings.email ? `<span>✉️ ${settings.email}</span>` : ''}
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 1px;">
              <strong>${settings.tax_id_label || 'RUT/ID'}:</strong> ${settings.rut || '77.892.410-K'} • <strong>País:</strong> ${settings.country || 'Costa Rica'}
            </div>
          </td>
          <td style="vertical-align: top; width: 38%; text-align: right;">
            <div style="display: inline-block; border: 2px solid #0891b2; border-radius: 8px; padding: 8px 14px; background: #ecfeff; text-align: center; min-width: 180px;">
              <div style="font-size: 8.5px; font-weight: 800; color: #0e7490; text-transform: uppercase; letter-spacing: 0.5px;">
                COTIZACIÓN / PROFORMA
              </div>
              <div style="font-family: monospace; font-size: 16px; font-weight: 900; color: #155e75; margin: 2px 0;">
                ${data.folio}
              </div>
              <div style="font-size: 9px; color: #475569;">
                <strong>Fecha:</strong> ${data.date}
              </div>
              <div style="font-size: 8px; color: #0891b2; font-weight: 700; margin-top: 2px;">
                Vigencia: 30 Días
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- DATOS CLIENTE & DIMENSIONAMIENTO -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <tr>
          <!-- Cliente -->
          <td style="width: 50%; vertical-align: top; padding-right: 8px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px;">
              <tr style="background: #f1f5f9;">
                <th colspan="2" style="text-align: left; padding: 5px 8px; font-size: 9.5px; font-weight: 800; color: #1e293b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
                  👤 Datos del Cliente
                </th>
              </tr>
              <tr>
                <td style="padding: 4px 8px; color: #64748b; width: 35%; border-bottom: 1px solid #f1f5f9;">Nombre:</td>
                <td style="padding: 4px 8px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${data.clientName}</td>
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

          <!-- Dimensionamiento Técnico -->
          <td style="width: 50%; vertical-align: top; padding-left: 8px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px;">
              <tr style="background: #f1f5f9;">
                <th colspan="2" style="text-align: left; padding: 5px 8px; font-size: 9.5px; font-weight: 800; color: #1e293b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
                  📐 Estudio Térmico Estimado
                </th>
              </tr>
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
            </table>
          </td>
        </tr>
      </table>

      <!-- DETALLE DE LA PROPUESTA ECONÓMICA -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase;">Descripción del Ítem</th>
            <th style="padding: 6px 8px; text-align: center; font-size: 9px; text-transform: uppercase; width: 12%;">Cant.</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 9px; text-transform: uppercase; width: 20%;">Precio Unit.</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 9px; text-transform: uppercase; width: 22%;">Total</th>
          </tr>
        </thead>
        <tbody>
          <!-- Equipo Principal -->
          <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 8px;">
              <div style="font-weight: 700; color: #0f172a;">${data.equipmentName}</div>
              <div style="font-size: 8.5px; color: #64748b;">Unidad interior (evaporadora) + exterior (condensadora) + control remoto</div>
            </td>
            <td style="padding: 6px 8px; text-align: center; font-weight: 700;">${data.equipmentQty}</td>
            <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${formatAirPrice(data.equipmentPrice, currencySymbol, countryCode)}</td>
            <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatAirPrice(data.equipmentPrice * data.equipmentQty, currencySymbol, countryCode)}</td>
          </tr>

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
          `).join('') : `
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 8px;">
                <div style="font-weight: 600; color: #1e293b;">Servicio de Instalación Certificada HVAC & Kit Básico</div>
                <div style="font-size: 8.5px; color: #64748b;">Montaje en muro, hasta 3m cañería de cobre, vacío con bomba y puesta en marcha</div>
              </td>
              <td style="padding: 6px 8px; text-align: center; font-weight: 700;">1</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${formatAirPrice(data.subtotal - (data.equipmentPrice * data.equipmentQty), currencySymbol, countryCode)}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatAirPrice(data.subtotal - (data.equipmentPrice * data.equipmentQty), currencySymbol, countryCode)}</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- TOTALES Y CONDICIONES -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
        <tr>
          <!-- Condiciones Comerciales -->
          <td style="width: 58%; vertical-align: top; padding-right: 12px;">
            <div style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
              <div style="font-weight: 800; font-size: 9.5px; color: #0891b2; margin-bottom: 4px; text-transform: uppercase;">
                💼 Condiciones del Presupuesto
              </div>
              <ul style="margin: 0; padding-left: 14px; font-size: 9px; color: #475569; line-height: 1.4;">
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
                <td style="padding: 5px 8px; color: #64748b; border-bottom: 1px solid #cbd5e1;">${settings.tax_name || 'IVA'} (${taxPercent}%):</td>
                <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 600; border-bottom: 1px solid #cbd5e1;">
                  ${formatAirPrice(data.taxAmount, currencySymbol, countryCode)}
                </td>
              </tr>
              <tr style="background: #ecfeff;">
                <td style="padding: 6px 8px; font-size: 11px; font-weight: 900; color: #0e7490;">TOTAL PROPUESTA:</td>
                <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-size: 13px; font-weight: 900; color: #0e7490;">
                  ${formatAirPrice(data.total, currencySymbol, countryCode)}
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
            <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${settings.fantasy_name || settings.company_name || 'Departamento Técnico HVAC'}</div>
            <div style="font-size: 8px; color: #64748b;">Firma Ejecutivo / Técnico Autorizado</div>
          </td>
          <td style="width: 4%;"></td>
          <td style="width: 48%; text-align: center; vertical-align: bottom; padding: 0 10px;">
            <div style="border-bottom: 1.5px dashed #64748b; height: 36px; margin-bottom: 6px;"></div>
            <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${data.clientName}</div>
            <div style="font-size: 8px; color: #64748b;">Aceptación de Cotización</div>
          </td>
        </tr>
      </table>

      <!-- PIE DE PÁGINA -->
      <div style="text-align: center; font-size: 8px; color: #94a3b8; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
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
