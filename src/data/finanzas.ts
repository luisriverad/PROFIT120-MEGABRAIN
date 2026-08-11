import type { CampoFinanciero, FormatoRazon, Razon } from '@/types'

/** Tasa de ISR usada para llevar la utilidad de operación a NOPAT. */
const ISR = 0.30

/** Año comercial. Todas las razones en días se calculan sobre 360, no 365. */
const DIAS = 360

/**
 * RAZONES. Ninguna de estas se le pregunta al cliente: todas salen de los
 * doce campos capturados. El grupo 'rentabilidad' responde "¿cuánto deja el
 * negocio?"; el grupo 'real' responde "¿dónde está el dinero?" — son las que
 * no se ven en el estado de resultados y donde suele estar el problema.
 */
export const RAZONES: Razon[] = [
  /* ---------- Rentabilidad ---------- */
  {
    clave: 'ros',
    concepto: 'ROS · Rentabilidad sobre venta',
    formula: 'Utilidad de operación / Facturación',
    grupo: 'rentabilidad',
    formato: 'pct',
    mejorSi: 'alto',
    usa: ['utilidadOperativa', 'ventas'],
    calcular: (v) => v.ventas ? v.utilidadOperativa / v.ventas : null,
    lectura: 'Cuánto deja cada peso vendido antes de intereses e impuestos. Si cae mientras la venta sube, el crecimiento está comprando pérdida.',
  },
  {
    clave: 'roe',
    concepto: 'ROE · Retorno sobre capital contable',
    formula: 'Utilidad neta / Capital contable',
    grupo: 'rentabilidad',
    formato: 'pct',
    mejorSi: 'alto',
    usa: ['utilidadNeta', 'capital'],
    calcular: (v) => v.capital ? v.utilidadNeta / v.capital : null,
    lectura: 'Lo que gana el socio por su patrimonio. Se compara contra lo que ese mismo dinero rendiría sin operar la empresa.',
  },
  {
    clave: 'roic',
    concepto: 'ROIC · Retorno sobre capital invertido',
    formula: 'Utilidad de operación × (1 − ISR) / (Capital contable + Deuda con costo)',
    grupo: 'rentabilidad',
    formato: 'pct',
    mejorSi: 'alto',
    usa: ['utilidadOperativa', 'capital', 'deuda'],
    calcular: (v) => {
      const invertido = v.capital + v.deuda
      return invertido ? (v.utilidadOperativa * (1 - ISR)) / invertido : null
    },
    lectura: 'El juicio de fondo: el retorno de todo el dinero metido al negocio, propio y prestado. Si queda por debajo del costo de la deuda, crecer destruye valor.',
  },

  /* ---------- Razones reales ---------- */
  {
    clave: 'cto',
    concepto: 'Capital de trabajo operativo',
    formula: 'Caja + Cuentas por cobrar + Inventario − Cuentas por pagar',
    grupo: 'real',
    formato: 'mxn',
    mejorSi: 'bajo',
    usa: ['caja', 'cxc', 'inventario', 'cxp'],
    calcular: (v) => v.caja + v.cxc + v.inventario - v.cxp,
    lectura: 'El dinero que la operación tiene secuestrado para poder funcionar. No aparece como gasto en ningún lado y por eso nadie lo defiende.',
  },
  {
    clave: 'ctoVentas',
    concepto: 'Capital de trabajo sobre venta',
    formula: 'Capital de trabajo operativo / Facturación',
    grupo: 'real',
    formato: 'pct',
    mejorSi: 'bajo',
    usa: ['caja', 'cxc', 'inventario', 'cxp', 'ventas'],
    calcular: (v) => v.ventas ? (v.caja + v.cxc + v.inventario - v.cxp) / v.ventas : null,
    lectura: 'Cuántos centavos hay que inmovilizar por cada peso que se vende. Si sube, cada venta nueva exige más dinero del que trae.',
  },
  {
    clave: 'ventaNomina',
    concepto: 'Venta por peso de nómina',
    formula: 'Facturación / Nómina anual total',
    grupo: 'real',
    formato: 'veces',
    mejorSi: 'alto',
    usa: ['ventas', 'nomina'],
    calcular: (v) => v.nomina ? v.ventas / v.nomina : null,
    lectura: 'Productividad real del recurso humano. Contratar sin mover este número es crecer el costo fijo, no la capacidad.',
  },
  {
    clave: 'deudaUtilidad',
    concepto: 'Deuda con costo sobre utilidad de operación',
    formula: 'Deuda con costo / Utilidad de operación',
    grupo: 'real',
    formato: 'veces',
    mejorSi: 'bajo',
    usa: ['deuda', 'utilidadOperativa'],
    calcular: (v) => v.utilidadOperativa > 0 ? v.deuda / v.utilidadOperativa : null,
    lectura: 'Cuántos años de operación completa cuesta la deuda. Arriba de 3 veces, el banco ya manda más que el dueño.',
  },

  /* ---------- Capital de trabajo en días ---------- */
  {
    clave: 'cxcDias',
    concepto: 'Cartera · Cuentas por cobrar en días',
    formula: 'Cuentas por cobrar / (Facturación / 360)',
    grupo: 'dias',
    formato: 'dias',
    mejorSi: 'bajo',
    usa: ['cxc', 'ventas'],
    calcular: (v) => v.ventas ? v.cxc / (v.ventas / DIAS) : null,
    lectura: 'Cuántos días tarda el cliente en pagar lo que ya se le entregó. Cada día de más es dinero prestado al cliente sin cobrarle interés.',
  },
  {
    clave: 'invDias',
    concepto: 'Inventarios en días',
    formula: 'Inventario / (Costo de ventas / 360)',
    grupo: 'dias',
    formato: 'dias',
    mejorSi: 'bajo',
    usa: ['inventario', 'costoVentas'],
    calcular: (v) => v.costoVentas ? v.inventario / (v.costoVentas / DIAS) : null,
    lectura: 'Cuántos días de venta están parados en la bodega. Es capital detenido que además se obsoleta, se merma y ocupa espacio.',
  },
  {
    clave: 'cxpDias',
    concepto: 'Cuentas por pagar en días',
    formula: 'Cuentas por pagar / (Compras del ejercicio / 360)',
    grupo: 'dias',
    formato: 'dias',
    mejorSi: 'alto',
    usa: ['cxp', 'compras'],
    calcular: (v) => v.compras ? v.cxp / (v.compras / DIAS) : null,
    lectura: 'Cuántos días tarda la empresa en pagarle al proveedor. Es la única fuente de financiamiento gratis del ciclo, y casi nadie la negocia a propósito.',
  },
  {
    clave: 'cicloEfectivo',
    concepto: 'Ciclo de conversión de efectivo',
    formula: 'Días de cobro + Días de inventario − Días de pago',
    grupo: 'dias',
    formato: 'dias',
    mejorSi: 'bajo',
    usa: ['cxc', 'ventas', 'inventario', 'costoVentas', 'cxp', 'compras'],
    calcular: (v) => {
      if (!v.ventas || !v.costoVentas || !v.compras) return null
      return v.cxc / (v.ventas / DIAS) + v.inventario / (v.costoVentas / DIAS) - v.cxp / (v.compras / DIAS)
    },
    lectura: 'El cierre de los tres anteriores: cuántos días pasan entre que la empresa paga y que cobra. Es el hueco que alguien tiene que financiar, y ese alguien es el banco o el dueño.',
  },

  /* ---------- Caja y flujo ---------- */
  {
    clave: 'cashRatio',
    concepto: 'Ratio de caja',
    formula: 'Caja y bancos / Pasivo circulante',
    grupo: 'caja',
    formato: 'veces',
    mejorSi: 'alto',
    usa: ['caja', 'pasivoCirculante'],
    calcular: (v) => v.pasivoCirculante ? v.caja / v.pasivoCirculante : null,
    lectura: 'Qué parte de lo que vence este año se puede pagar hoy con el efectivo que ya está en el banco, sin cobrarle a nadie ni vender nada.',
  },
  {
    clave: 'fcoPasivo',
    concepto: 'Ratio de flujo de caja operativo',
    formula: 'Flujo de caja de operación / Pasivo circulante',
    grupo: 'caja',
    formato: 'veces',
    mejorSi: 'alto',
    usa: ['fco', 'pasivoCirculante'],
    calcular: (v) => v.pasivoCirculante ? v.fco / v.pasivoCirculante : null,
    lectura: 'Si la operación por sí sola alcanza para cubrir lo que vence en el año. Por debajo de 0.4 veces, la empresa depende de refinanciar para seguir viva.',
  },
  {
    clave: 'fcfVentas',
    concepto: 'Flujo de caja libre sobre ventas',
    formula: '(Flujo de caja de operación − Inversión en activo fijo) / Facturación',
    grupo: 'caja',
    formato: 'pct',
    mejorSi: 'alto',
    usa: ['fco', 'capex', 'ventas'],
    calcular: (v) => v.ventas ? (v.fco - v.capex) / v.ventas : null,
    lectura: 'Qué porcentaje de la venta sobrevive después de operar y de reponer los activos. Aquí se destapan las empresas que venden mucho y no generan caja.',
  },
  {
    clave: 'diasTesoreria',
    concepto: 'Días de tesorería',
    formula: 'Caja y bancos / (Gastos de operación / 360)',
    grupo: 'caja',
    formato: 'dias',
    mejorSi: 'alto',
    usa: ['caja', 'ventas', 'costoVentas', 'utilidadOperativa'],
    calcular: (v) => {
      // El gasto de operación no se pregunta: es lo que queda de la venta
      // después del costo y de la utilidad de operación.
      const gastos = v.ventas - v.costoVentas - v.utilidadOperativa
      return gastos > 0 ? v.caja / (gastos / DIAS) : null
    },
    lectura: 'Cuántos días aguanta la empresa operando con la caja de hoy si mañana deja de entrar un peso. Es la pregunta que nadie hace hasta que ya es tarde.',
  },
  {
    clave: 'nofVentas',
    concepto: 'NOF sobre ventas',
    formula: '(Cuentas por cobrar + Inventario − Cuentas por pagar) / Facturación',
    grupo: 'caja',
    formato: 'pct',
    mejorSi: 'bajo',
    usa: ['cxc', 'inventario', 'cxp', 'ventas'],
    calcular: (v) => v.ventas ? (v.cxc + v.inventario - v.cxp) / v.ventas : null,
    lectura: 'Cuánta caja se traga el ciclo comercial por cada peso vendido. Si sube al mismo tiempo que la venta, el crecimiento se está financiando solo con deuda.',
  },
  {
    clave: 'deudaFco',
    concepto: 'Deuda sobre flujo de caja operativo',
    formula: 'Deuda con costo / Flujo de caja de operación',
    grupo: 'caja',
    formato: 'veces',
    mejorSi: 'bajo',
    usa: ['deuda', 'fco'],
    calcular: (v) => v.fco > 0 ? v.deuda / v.fco : null,
    lectura: 'Cuántos años de caja operativa completa cuesta liquidar la deuda. Es la versión honesta del apalancamiento: la utilidad se contabiliza, la caja se cobra.',
  },
  {
    clave: 'margenCaja',
    concepto: 'Margen de caja',
    formula: 'Flujo de caja de operación / Facturación',
    grupo: 'caja',
    formato: 'pct',
    mejorSi: 'alto',
    usa: ['fco', 'ventas'],
    calcular: (v) => v.ventas ? v.fco / v.ventas : null,
    lectura: 'De cada peso facturado, cuánto llegó de verdad al banco. Comparado contra el ROS dice si la utilidad del estado de resultados existe o solo está declarada.',
  },
]

/* ---------- Formato y captura ---------- */

const MXN = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })

export function formatearCampo(valor: number | null, unidad: CampoFinanciero['unidad']) {
  if (valor === null || Number.isNaN(valor)) return ''
  return unidad === 'mxn' ? `$${MXN.format(valor)}` : MXN.format(valor)
}

/** Lee lo que el consultor teclea y se queda solo con el número. */
export function parsearCampo(texto: string): number | null {
  const limpio = texto.replace(/[^\d.-]/g, '')
  if (!limpio) return null
  const n = Number(limpio)
  return Number.isFinite(n) ? n : null
}

export function formatearRazon(valor: number | null, formato: FormatoRazon) {
  if (valor === null) return '—'
  if (formato === 'pct') return `${(valor * 100).toFixed(1)}%`
  if (formato === 'veces') return `${valor.toFixed(2)}x`
  if (formato === 'dias') return `${Math.round(valor)} días`
  return `$${MXN.format(Math.round(valor))}`
}

/** Variación entre el ejercicio actual y el anterior, ya redactada. */
export function variacionRazon(actual: number | null, previo: number | null, formato: FormatoRazon) {
  if (actual === null || previo === null) return null
  const signo = (n: number) => (n >= 0 ? '+' : '−')
  if (formato === 'pct') {
    const pp = (actual - previo) * 100
    return { texto: `${signo(pp)}${Math.abs(pp).toFixed(1)} pp`, delta: pp }
  }
  if (formato === 'veces') {
    const d = actual - previo
    return { texto: `${signo(d)}${Math.abs(d).toFixed(2)}x`, delta: d }
  }
  if (formato === 'dias') {
    const d = actual - previo
    return { texto: `${signo(d)}${Math.abs(Math.round(d))} días`, delta: d }
  }
  const d = actual - previo
  const pct = previo ? (d / Math.abs(previo)) * 100 : 0
  return { texto: `${signo(d)}$${MXN.format(Math.abs(Math.round(d)))} · ${signo(pct)}${Math.abs(pct).toFixed(0)}%`, delta: d }
}

/** Valores de un ejercicio indexados por clave, listos para calcular. */
export function valoresDelEjercicio(campos: CampoFinanciero[], i: number) {
  const v: Record<string, number> = {}
  for (const c of campos) {
    const n = c.valores[i]
    if (n !== null && n !== undefined) v[c.clave] = n
  }
  return v
}

/** Claves que la razón necesita y todavía no se han capturado. */
export function faltantes(razon: Razon, valores: Record<string, number>, campos: CampoFinanciero[]) {
  return razon.usa
    .filter((k) => valores[k] === undefined)
    .map((k) => campos.find((c) => c.clave === k)?.concepto ?? k)
}
