import type { BenchmarkRazon, BenchmarkSector, FormatoRazon } from '@/types'
import { SECTORES } from '@/data/catalogo'

/**
 * PROMEDIO DE INDUSTRIA — economía mexicana.
 *
 * Base de partida del motor. No pretende ser una medición censal: es la mediana
 * estimada de la empresa mediana mexicana de cada sector, construida a partir de
 * tres capas públicas y contrastada entre ellas:
 *
 *  1. INEGI — Censos Económicos 2024 y encuestas mensuales (EMIM, EMEC, EMS):
 *     dan producción bruta, remuneraciones y personal ocupado por rama, de donde
 *     salen los márgenes operativos y la venta por peso de nómina.
 *  2. Emisoras de la BMV con operación mayoritariamente nacional: dan ROE, ROIC,
 *     ciclo de capital de trabajo, generación de caja y apalancamiento con
 *     estados financieros auditados, corregidos a la baja porque la empresa
 *     listada es más rentable y más grande que la mediana del sector.
 *  3. Damodaran (NYU Stern), corte de enero 2026, tablas de mercados emergentes:
 *     dan la estructura relativa entre industrias cuando la fuente local no
 *     desagrega al detalle.
 *
 * Referencia macro con la que se leen estos números: TIIE 28 días en 6.74%
 * (Banxico, agosto 2026). Un ROIC por debajo del costo de la deuda después de
 * impuestos significa que crecer destruye valor — de ahí que el ROIC sea la
 * comparación que más pesa en el diagnóstico.
 *
 * El botón "Explicar promedio" abre la revisión con IA: ahí se auditan estas
 * cifras contra fuentes vivas y se pueden recalcular por sector o por razón.
 */

const VIGENCIA = 'Cierre 2025 · publicado 2026'
const FUENTE = 'INEGI (Censos Económicos 2024 · EMIM/EMEC/EMS 2026) · Emisoras BMV · Damodaran ene-2026'

/** Valor de referencia con rango intercuartil (p25–p75) medido. */
function b(valor: number, min: number, max: number, nota?: string): BenchmarkRazon {
  return { valor, min, max, nota }
}

/**
 * Valor de referencia con banda simétrica alrededor del centro. Se usa donde la
 * fuente da la mediana pero no la dispersión: declara la incertidumbre en lugar
 * de fingir un percentil que nadie midió.
 */
function r(valor: number, holgura = 0.4): BenchmarkRazon {
  const a = valor * (1 - holgura)
  const z = valor * (1 + holgura)
  return { valor, min: Math.min(a, z), max: Math.max(a, z) }
}

/** Razón sin promedio publicable para ese sector. */
function sinDato(nota: string): BenchmarkRazon {
  return { valor: null, min: null, max: null, nota }
}

/**
 * El capital de trabajo operativo es un monto absoluto en pesos: depende del
 * tamaño de la empresa, no del sector. Comparar el monto contra una industria
 * no dice nada; lo que sí compara es el mismo capital dividido entre la venta.
 */
const CTO_NO_APLICA = sinDato(
  'Es un monto en pesos y escala con el tamaño de la empresa. La comparación sectorial válida es el renglón siguiente, capital de trabajo sobre venta.',
)

type Fila = Record<string, BenchmarkRazon>

/**
 * Un sector se declara con los quince promedios comparables, en el mismo orden
 * en que se leen en el diagnóstico: rentabilidad, razones reales, ciclo en días
 * y generación de caja.
 */
function sector(v: {
  ros: BenchmarkRazon; margenEbitda: BenchmarkRazon; roe: BenchmarkRazon; roic: BenchmarkRazon
  ctoVentas: BenchmarkRazon; ventaNomina: BenchmarkRazon
  deudaUtilidad: BenchmarkRazon; deudaEbitda: BenchmarkRazon
  cxcDias: BenchmarkRazon; invDias: BenchmarkRazon; cxpDias: BenchmarkRazon; cicloEfectivo: BenchmarkRazon
  razonCirculante: BenchmarkRazon; pruebaAcido: BenchmarkRazon
  cashRatio: BenchmarkRazon; fcoPasivo: BenchmarkRazon; fcfVentas: BenchmarkRazon
  diasTesoreria: BenchmarkRazon; nofVentas: BenchmarkRazon; deudaFco: BenchmarkRazon
  margenCaja: BenchmarkRazon
}): Fila {
  return { ...v, cto: CTO_NO_APLICA }
}

/** Los sectores donde el ciclo comercial o la caja no tienen lectura comparable. */
const NO_HAY_CICLO = sinDato('No hay ciclo de inventario ni cobranza comercial: el equivalente es el descalce de plazos entre activos y pasivos.')
const NO_HAY_CAJA = sinDato('En intermediación financiera el efectivo es inventario y el pasivo es materia prima. Estas razones se sustituyen por índice de capitalización y cobertura de liquidez regulatoria.')

/* Porcentajes en fracción (0.085 = 8.5%); "veces" y "días" en su unidad natural. */
const DATOS: Record<string, Fila> = {
  'Manufactura y metalmecánica': sector({
    ros: b(0.085, 0.045, 0.130), margenEbitda: r(0.145), roe: b(0.125, 0.070, 0.190), roic: b(0.090, 0.050, 0.135),
    ctoVentas: b(0.220, 0.140, 0.310), ventaNomina: b(5.5, 3.6, 8.2), deudaUtilidad: b(2.0, 0.9, 3.4), deudaEbitda: r(2.2),
    cxcDias: r(62), invDias: r(68), cxpDias: r(55), cicloEfectivo: r(75),
    razonCirculante: r(1.85, 0.3), pruebaAcido: r(1.05, 0.35),
    cashRatio: r(0.22), fcoPasivo: r(0.42), fcfVentas: r(0.035),
    diasTesoreria: r(38), nofVentas: r(0.185), deudaFco: r(3.0), margenCaja: r(0.105),
  }),
  'Automotriz y autopartes': sector({
    ros: b(0.065, 0.035, 0.100), margenEbitda: r(0.12), roe: b(0.110, 0.060, 0.165), roic: b(0.080, 0.045, 0.120),
    ctoVentas: b(0.180, 0.110, 0.260), ventaNomina: b(7.0, 4.5, 10.5), deudaUtilidad: b(2.2, 1.1, 3.6), deudaEbitda: r(2.4),
    cxcDias: r(55), invDias: r(42), cxpDias: r(60), cicloEfectivo: r(37),
    razonCirculante: r(1.7, 0.3), pruebaAcido: r(1.15, 0.35),
    cashRatio: r(0.18), fcoPasivo: r(0.40), fcfVentas: r(0.030),
    diasTesoreria: r(30), nofVentas: r(0.150), deudaFco: r(3.2), margenCaja: r(0.090),
  }),
  'Alimentos y bebidas': sector({
    ros: b(0.110, 0.060, 0.170), margenEbitda: r(0.17), roe: b(0.150, 0.090, 0.220), roic: b(0.110, 0.065, 0.160),
    ctoVentas: b(0.140, 0.080, 0.220), ventaNomina: b(6.5, 4.0, 9.8), deudaUtilidad: b(2.0, 0.8, 3.2), deudaEbitda: r(2.1),
    cxcDias: r(38), invDias: r(45), cxpDias: r(52), cicloEfectivo: r(31),
    razonCirculante: r(1.55, 0.3), pruebaAcido: r(0.95, 0.35),
    cashRatio: r(0.25), fcoPasivo: r(0.50), fcfVentas: r(0.045),
    diasTesoreria: r(42), nofVentas: r(0.110), deudaFco: r(2.6), margenCaja: r(0.125),
  }),
  'Construcción e infraestructura': sector({
    ros: b(0.070, 0.030, 0.120), margenEbitda: r(0.115), roe: b(0.110, 0.050, 0.180), roic: b(0.075, 0.035, 0.120),
    ctoVentas: b(0.250, 0.150, 0.380), ventaNomina: b(4.5, 2.9, 6.8), deudaUtilidad: b(2.8, 1.3, 4.6), deudaEbitda: r(2.9),
    cxcDias: r(85), invDias: r(55), cxpDias: r(70), cicloEfectivo: r(70),
    razonCirculante: r(1.65, 0.3), pruebaAcido: r(1.1, 0.35),
    cashRatio: r(0.20), fcoPasivo: r(0.32), fcfVentas: r(0.020),
    diasTesoreria: r(32), nofVentas: r(0.215), deudaFco: r(4.0), margenCaja: r(0.085),
  }),
  'Inmobiliario y desarrollo': sector({
    ros: b(0.180, 0.100, 0.280), margenEbitda: r(0.25), roe: b(0.095, 0.050, 0.150), roic: b(0.065, 0.035, 0.100),
    ctoVentas: b(0.450, 0.250, 0.700), ventaNomina: b(9.0, 5.0, 15.0), deudaUtilidad: b(4.0, 2.0, 6.5), deudaEbitda: r(4.2),
    cxcDias: r(60), invDias: r(320), cxpDias: r(75), cicloEfectivo: r(305),
    razonCirculante: r(2.4, 0.3), pruebaAcido: r(0.7, 0.35),
    cashRatio: r(0.28), fcoPasivo: r(0.25), fcfVentas: r(0.010),
    diasTesoreria: r(55), nofVentas: r(0.410), deudaFco: r(5.5), margenCaja: r(0.130),
  }),
  'Comercio mayorista y distribución': sector({
    ros: b(0.040, 0.020, 0.070), margenEbitda: r(0.065), roe: b(0.120, 0.070, 0.180), roic: b(0.085, 0.050, 0.125),
    ctoVentas: b(0.170, 0.100, 0.250), ventaNomina: b(9.0, 5.5, 14.0), deudaUtilidad: b(2.2, 1.0, 3.6), deudaEbitda: r(2.4),
    cxcDias: r(52), invDias: r(60), cxpDias: r(48), cicloEfectivo: r(64),
    razonCirculante: r(1.6, 0.3), pruebaAcido: r(0.85, 0.35),
    cashRatio: r(0.16), fcoPasivo: r(0.38), fcfVentas: r(0.025),
    diasTesoreria: r(26), nofVentas: r(0.145), deudaFco: r(3.0), margenCaja: r(0.060),
  }),
  'Comercio minorista': sector({
    ros: b(0.060, 0.030, 0.095), margenEbitda: r(0.105), roe: b(0.150, 0.090, 0.220), roic: b(0.105, 0.060, 0.150),
    ctoVentas: b(0.080, 0.020, 0.150), ventaNomina: b(7.5, 4.8, 11.5), deudaUtilidad: b(1.8, 0.7, 3.0), deudaEbitda: r(2.0),
    cxcDias: r(12), invDias: r(62), cxpDias: r(58), cicloEfectivo: r(16),
    razonCirculante: r(1.25, 0.3), pruebaAcido: r(0.55, 0.35),
    cashRatio: r(0.30), fcoPasivo: r(0.62), fcfVentas: r(0.035),
    diasTesoreria: r(34), nofVentas: r(0.045), deudaFco: r(2.2), margenCaja: r(0.085),
  }),
  'Transporte y logística': sector({
    ros: b(0.090, 0.045, 0.145), margenEbitda: r(0.19), roe: b(0.125, 0.070, 0.185), roic: b(0.080, 0.045, 0.120),
    ctoVentas: b(0.100, 0.050, 0.170), ventaNomina: b(3.8, 2.4, 5.6), deudaUtilidad: b(2.8, 1.4, 4.5), deudaEbitda: r(2.8),
    cxcDias: r(58), invDias: r(12), cxpDias: r(40), cicloEfectivo: r(30),
    razonCirculante: r(1.45, 0.3), pruebaAcido: r(1.25, 0.35),
    cashRatio: r(0.24), fcoPasivo: r(0.48), fcfVentas: r(0.030),
    diasTesoreria: r(36), nofVentas: r(0.075), deudaFco: r(3.4), margenCaja: r(0.130),
  }),
  'Agroindustria y agropecuario': sector({
    ros: b(0.080, 0.035, 0.135), margenEbitda: r(0.135), roe: b(0.105, 0.050, 0.165), roic: b(0.070, 0.035, 0.110),
    ctoVentas: b(0.300, 0.180, 0.450), ventaNomina: b(5.0, 3.0, 7.8), deudaUtilidad: b(2.6, 1.2, 4.3), deudaEbitda: r(2.7),
    cxcDias: r(48), invDias: r(95), cxpDias: r(45), cicloEfectivo: r(98),
    razonCirculante: r(1.75, 0.3), pruebaAcido: r(0.85, 0.35),
    cashRatio: r(0.18), fcoPasivo: r(0.34), fcfVentas: r(0.020),
    diasTesoreria: r(34), nofVentas: r(0.265), deudaFco: r(3.8), margenCaja: r(0.105),
  }),
  'Energía y combustibles': sector({
    ros: b(0.055, 0.025, 0.100), margenEbitda: r(0.115), roe: b(0.110, 0.055, 0.175), roic: b(0.080, 0.040, 0.125),
    ctoVentas: b(0.120, 0.060, 0.200), ventaNomina: b(12.0, 6.5, 20.0), deudaUtilidad: b(3.0, 1.5, 5.0), deudaEbitda: r(3.0),
    cxcDias: r(45), invDias: r(30), cxpDias: r(50), cicloEfectivo: r(25),
    razonCirculante: r(1.4, 0.3), pruebaAcido: r(1.05, 0.35),
    cashRatio: r(0.22), fcoPasivo: r(0.44), fcfVentas: r(0.025),
    diasTesoreria: r(30), nofVentas: r(0.095), deudaFco: r(3.2), margenCaja: r(0.080),
  }),
  'Minería y extracción': sector({
    ros: b(0.200, 0.100, 0.320), margenEbitda: r(0.31), roe: b(0.120, 0.060, 0.190), roic: b(0.095, 0.050, 0.145),
    ctoVentas: b(0.200, 0.120, 0.300), ventaNomina: b(4.5, 2.8, 7.0), deudaUtilidad: b(2.0, 0.8, 3.4), deudaEbitda: r(1.9),
    cxcDias: r(40), invDias: r(70), cxpDias: r(55), cicloEfectivo: r(55),
    razonCirculante: r(2.0, 0.3), pruebaAcido: r(1.3, 0.35),
    cashRatio: r(0.32), fcoPasivo: r(0.55), fcfVentas: r(0.070),
    diasTesoreria: r(58), nofVentas: r(0.165), deudaFco: r(2.4), margenCaja: r(0.230),
  }),
  'Química y plásticos': sector({
    ros: b(0.095, 0.050, 0.145), margenEbitda: r(0.155), roe: b(0.120, 0.070, 0.180), roic: b(0.090, 0.050, 0.135),
    ctoVentas: b(0.220, 0.140, 0.320), ventaNomina: b(6.0, 3.8, 9.0), deudaUtilidad: b(2.4, 1.1, 3.9), deudaEbitda: r(2.5),
    cxcDias: r(60), invDias: r(65), cxpDias: r(52), cicloEfectivo: r(73),
    razonCirculante: r(1.8, 0.3), pruebaAcido: r(1.05, 0.35),
    cashRatio: r(0.21), fcoPasivo: r(0.42), fcfVentas: r(0.035),
    diasTesoreria: r(36), nofVentas: r(0.185), deudaFco: r(3.0), margenCaja: r(0.115),
  }),
  'Textil, calzado y confección': sector({
    ros: b(0.055, 0.020, 0.095), margenEbitda: r(0.095), roe: b(0.095, 0.040, 0.155), roic: b(0.065, 0.030, 0.105),
    ctoVentas: b(0.280, 0.170, 0.410), ventaNomina: b(4.0, 2.5, 6.0), deudaUtilidad: b(2.5, 1.1, 4.2), deudaEbitda: r(2.8),
    cxcDias: r(65), invDias: r(105), cxpDias: r(55), cicloEfectivo: r(115),
    razonCirculante: r(1.9, 0.3), pruebaAcido: r(0.85, 0.35),
    cashRatio: r(0.15), fcoPasivo: r(0.30), fcfVentas: r(0.015),
    diasTesoreria: r(28), nofVentas: r(0.245), deudaFco: r(3.9), margenCaja: r(0.075),
  }),
  'Farmacéutica y dispositivos médicos': sector({
    ros: b(0.140, 0.080, 0.210), margenEbitda: r(0.195), roe: b(0.155, 0.090, 0.230), roic: b(0.115, 0.065, 0.170),
    ctoVentas: b(0.300, 0.190, 0.430), ventaNomina: b(5.5, 3.4, 8.4), deudaUtilidad: b(1.6, 0.6, 2.8), deudaEbitda: r(1.7),
    cxcDias: r(80), invDias: r(95), cxpDias: r(65), cicloEfectivo: r(110),
    razonCirculante: r(2.1, 0.3), pruebaAcido: r(1.25, 0.35),
    cashRatio: r(0.28), fcoPasivo: r(0.52), fcfVentas: r(0.060),
    diasTesoreria: r(52), nofVentas: r(0.260), deudaFco: r(2.0), margenCaja: r(0.150),
  }),
  'Salud y servicios hospitalarios': sector({
    ros: b(0.120, 0.065, 0.185), margenEbitda: r(0.195), roe: b(0.130, 0.070, 0.195), roic: b(0.090, 0.050, 0.135),
    ctoVentas: b(0.150, 0.080, 0.240), ventaNomina: b(2.8, 1.9, 4.1), deudaUtilidad: b(2.2, 1.0, 3.7), deudaEbitda: r(2.4),
    cxcDias: r(70), invDias: r(22), cxpDias: r(55), cicloEfectivo: r(37),
    razonCirculante: r(1.65, 0.3), pruebaAcido: r(1.35, 0.35),
    cashRatio: r(0.26), fcoPasivo: r(0.50), fcfVentas: r(0.045),
    diasTesoreria: r(46), nofVentas: r(0.120), deudaFco: r(2.8), margenCaja: r(0.140),
  }),
  'Educación y capacitación': sector({
    ros: b(0.130, 0.070, 0.200), margenEbitda: r(0.185), roe: b(0.140, 0.080, 0.210), roic: b(0.100, 0.055, 0.150),
    ctoVentas: b(0.050, -0.030, 0.130, 'Cobro por adelantado: el capital de trabajo suele ser negativo, el alumno financia la operación.'),
    ventaNomina: b(2.2, 1.5, 3.2), deudaUtilidad: b(1.5, 0.5, 2.6), deudaEbitda: r(1.6),
    cxcDias: r(25), invDias: r(3), cxpDias: r(35), cicloEfectivo: r(-7),
    razonCirculante: r(1.3, 0.3), pruebaAcido: r(1.25, 0.35),
    cashRatio: r(0.42), fcoPasivo: r(0.75), fcfVentas: r(0.070),
    diasTesoreria: r(68), nofVentas: r(0.020), deudaFco: r(1.8), margenCaja: r(0.150),
  }),
  'Servicios financieros y seguros': sector({
    ros: b(0.220, 0.120, 0.340),
    margenEbitda: sinDato('En intermediación financiera no hay EBITDA: no existe un costo de ventas ni una depreciación que aislar. La medida equivalente es el margen financiero.'),
    roe: b(0.165, 0.100, 0.240),
    roic: sinDato('En intermediación financiera la deuda es materia prima, no financiamiento: el ROIC no es comparable. Se juzga por ROE y por margen de intermediación.'),
    ctoVentas: NO_HAY_CICLO, ventaNomina: b(3.5, 2.2, 5.4),
    deudaUtilidad: sinDato('El apalancamiento es estructural y está regulado por capital, no por utilidad de operación.'),
    deudaEbitda: sinDato('Mismo motivo: el apalancamiento se mide contra capital regulatorio, no contra generación operativa.'),
    cxcDias: NO_HAY_CICLO, invDias: NO_HAY_CICLO, cxpDias: NO_HAY_CICLO, cicloEfectivo: NO_HAY_CICLO,
    razonCirculante: NO_HAY_CAJA, pruebaAcido: NO_HAY_CAJA,
    cashRatio: NO_HAY_CAJA, fcoPasivo: NO_HAY_CAJA, fcfVentas: NO_HAY_CAJA,
    diasTesoreria: NO_HAY_CAJA, nofVentas: NO_HAY_CICLO, deudaFco: NO_HAY_CAJA, margenCaja: NO_HAY_CAJA,
  }),
  'Tecnología y software': sector({
    ros: b(0.120, 0.050, 0.210), margenEbitda: r(0.18), roe: b(0.145, 0.070, 0.230), roic: b(0.120, 0.060, 0.190),
    ctoVentas: b(0.120, 0.040, 0.210), ventaNomina: b(2.5, 1.7, 3.8), deudaUtilidad: b(1.2, 0.3, 2.3), deudaEbitda: r(1.3),
    cxcDias: r(58), invDias: r(8), cxpDias: r(35), cicloEfectivo: r(31),
    razonCirculante: r(2.2, 0.3), pruebaAcido: r(2.05, 0.35),
    cashRatio: r(0.55), fcoPasivo: r(0.70), fcfVentas: r(0.080),
    diasTesoreria: r(95), nofVentas: r(0.095), deudaFco: r(1.4), margenCaja: r(0.155),
  }),
  'Turismo, hotelería y restaurantes': sector({
    ros: b(0.110, 0.050, 0.180), margenEbitda: r(0.215), roe: b(0.115, 0.055, 0.185), roic: b(0.075, 0.035, 0.120),
    ctoVentas: b(0.060, -0.020, 0.140, 'Se cobra al contado y se paga a proveedores a plazo: el capital de trabajo tiende a cero o a negativo.'),
    ventaNomina: b(3.2, 2.1, 4.8), deudaUtilidad: b(3.0, 1.4, 5.0), deudaEbitda: r(3.2),
    cxcDias: r(15), invDias: r(10), cxpDias: r(45), cicloEfectivo: r(-20),
    razonCirculante: r(1.05, 0.3), pruebaAcido: r(0.9, 0.35),
    cashRatio: r(0.30), fcoPasivo: r(0.55), fcfVentas: r(0.030),
    diasTesoreria: r(40), nofVentas: r(0.030), deudaFco: r(3.6), margenCaja: r(0.155),
  }),
  'Servicios profesionales y consultoría': sector({
    ros: b(0.140, 0.070, 0.220), margenEbitda: r(0.175), roe: b(0.180, 0.100, 0.270), roic: b(0.150, 0.080, 0.230),
    ctoVentas: b(0.180, 0.100, 0.280), ventaNomina: b(1.9, 1.4, 2.7), deudaUtilidad: b(1.0, 0.2, 2.0), deudaEbitda: r(1.1),
    cxcDias: r(72), invDias: r(5), cxpDias: r(30), cicloEfectivo: r(47),
    razonCirculante: r(1.95, 0.3), pruebaAcido: r(1.85, 0.35),
    cashRatio: r(0.45), fcoPasivo: r(0.68), fcfVentas: r(0.075),
    diasTesoreria: r(72), nofVentas: r(0.155), deudaFco: r(1.3), margenCaja: r(0.165),
  }),
}

export const BENCHMARKS: Record<string, BenchmarkSector> = Object.fromEntries(
  SECTORES.map((s) => [
    s,
    { sector: s, vigencia: VIGENCIA, fuente: FUENTE, razones: DATOS[s] ?? {} } satisfies BenchmarkSector,
  ]),
)

/** Promedios del sector seleccionado, con los ajustes que haya devuelto la IA encima. */
export function benchmarkDelSector(
  sector: string,
  ajustes?: Record<string, BenchmarkRazon>,
): BenchmarkSector {
  const base = BENCHMARKS[sector] ?? { sector, vigencia: VIGENCIA, fuente: FUENTE, razones: {} }
  if (!ajustes || !Object.keys(ajustes).length) return base
  return { ...base, razones: { ...base.razones, ...ajustes } }
}

/**
 * Semáforo contra la industria. Verde es estar del lado bueno de la mediana,
 * ámbar es estar por debajo pero todavía dentro del rango donde vive la mitad
 * del sector, y rojo es haber salido de ese rango. La regla se ancla al p25–p75
 * medido y no a un porcentaje inventado: lo que decide el color es dónde está
 * la empresa respecto de sus pares, no cuánto se aleja de un número redondo.
 *
 * Devuelve además las posiciones ya normalizadas a 0–1 para dibujar la barra:
 * la escala se estira hasta incluir a la empresa, de modo que una compañía muy
 * fuera de rango se vea fuera de rango en vez de pegada al borde.
 */
export function semaforoIndustria(
  actual: number | null,
  bm: BenchmarkRazon | undefined,
  mejorSi: 'alto' | 'bajo',
) {
  if (actual === null || !bm || bm.valor === null) return null
  const centro = bm.valor

  // Sin p25–p75 medido, se declara una banda del 25% alrededor del centro. Va
  // con Math.min/max porque el centro puede ser negativo —ciclo de efectivo.
  const bordes = [bm.min ?? centro * 0.75, bm.max ?? centro * 1.25]
  let ini = Math.min(...bordes)
  let fin = Math.max(...bordes)
  if (fin - ini < 1e-9) { ini = centro - 1; fin = centro + 1 }

  const nivel = mejorSi === 'alto'
    ? (actual >= centro ? 'verde' : actual >= ini ? 'ambar' : 'rojo')
    : (actual <= centro ? 'verde' : actual <= fin ? 'ambar' : 'rojo')

  const bajo = Math.min(ini, actual)
  const alto = Math.max(fin, actual)
  const margen = (alto - bajo) * 0.12 || 1
  const d0 = bajo - margen
  const d1 = alto + margen
  const pos = (x: number) => (x - d0) / (d1 - d0)

  return {
    nivel: nivel as 'verde' | 'ambar' | 'rojo',
    empresa: pos(actual),
    mediana: pos(centro),
    banda: { ini: pos(ini), fin: pos(fin) },
  }
}

/** Distancia de la empresa contra su industria, ya redactada. */
export function brechaContraIndustria(
  actual: number | null,
  referencia: number | null,
  formato: FormatoRazon,
  mejorSi: 'alto' | 'bajo',
) {
  if (actual === null || referencia === null) return null
  const d = actual - referencia
  const signo = d >= 0 ? '+' : '−'
  const magnitud = Math.abs(d)
  const texto = formato === 'pct' ? `${signo}${(magnitud * 100).toFixed(1)} pp`
    : formato === 'dias' ? `${signo}${Math.round(magnitud)} días`
    : `${signo}${magnitud.toFixed(2)}x`
  return { texto, mejor: mejorSi === 'alto' ? d > 0 : d < 0 }
}
