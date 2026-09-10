# ❄️ Nexus Air — Sistema Integral de Climatización (HVAC)

**Nexus Air** es la plataforma del ecosistema Nexus especializada en la venta, agendamiento, instalación y mantención periódica de equipos de aire acondicionado para hogares y empresas en Chile.

Inspirado en la arquitectura robusta de **Nexus Garage**, Nexus Air adapta todos los conceptos al dominio de climatización, destacando su **motor de recaptación automatizada semestral (cada 6 meses)** para garantizar aire limpio, desinfección química de turbinas y óptimo consumo eléctrico.

---

## 🚀 Módulos Principales

1. **Tablero Kanban de Servicios HVAC**:
   - Estados del flujo técnico: `Solicitudes` ➔ `Técnico en Ruta` ➔ `En Terreno / Mantenimiento` ➔ `Medición & Pruebas QA` ➔ `Finalizado / Entregado`.
   - Medición de parámetros termodinámicos en vivo: Salto Térmico (\(\Delta T\) °C), Presiones de Succión (PSI R410A / R32) y Consumo en Amperes.

2. **Recaptación Semestral (Cada 6 Meses)**:
   - Detección automática de equipos con más de 180 días sin mantención.
   - Generador de mensajes personalizados para WhatsApp con 1 clic.
   - Re-agendamiento directo al tablero operativo.
   - Métricas de conversión e ingresos proyectados.

3. **Calculadora Térmica & Cotizador BTU**:
   - Algoritmo que calcula la carga térmica en BTU/h según \(m^2\), exposición solar, número de personas y tipo de recinto.
   - Generación de presupuestos con equipo + kit de instalación estándar SEC + bomba de condensado.

4. **Agenda & Rutas Técnicas**:
   - Bloques horarios para despacho de cuadrillas de instaladores.

5. **Inventario & Stock de Climatización**:
   - Equipos Split Muro (9k, 12k, 18k, 24k BTU Inverter), gases refrigerantes (R410A, R32), cañerías de cobre, aislación Armaflex y bactericidas.

6. **Directorio de Clientes & Parque de Equipos**:
   - Registro de inmuebles y sus equipos instalados con historial de intervenciones.

7. **Técnicos Certificados SEC**:
   - Gestión de cuadrillas con número de acreditación SEC.

8. **Landing Page Pública**:
   - Presentación de servicios, cotizador rápido de BTU interactivo y agendamiento público.

9. **Portal de Cliente**:
   - Acceso para que el cliente consulte sus equipos, fichas técnicas y agende su próxima mantención de 6 meses.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite 6
- **Estilos**: Tailwind CSS (v4) con estética Nexus (Cyan, Ice Blue, Deep Slate)
- **Iconografía**: `lucide-react`
- **Gestión de Fechas**: `date-fns` (es)
- **Persistencia**: LocalStorage reactivo + integración Supabase schema `air`
- **Puerto de desarrollo**: `3028`

---

## 🏃 Cómo ejecutar

```bash
cd nexus-air
npm install
npm run dev
```

Abra su navegador en [http://localhost:3028](http://localhost:3028).
