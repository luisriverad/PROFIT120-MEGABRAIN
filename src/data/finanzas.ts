import type { CampoFinanciero, FormatoRazon, Razon } from '@/types'

/** Tasa de ISR usada para llevar la utilidad de operación a NOPAT. */
const ISR = 0.30

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
