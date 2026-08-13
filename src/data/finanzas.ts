import type { CampoFinanciero, Ejercicio, FormatoRazon, Razon } from '@/types'

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
    clave: 'margenEbitda',
    concepto: 'Margen EBITDA',
    formula: 'EBITDA / Facturación',
    grupo: 'rentabilidad',
    formato: 'pct',
    mejorSi: 'alto',
    usa: ['ebitda', 'ventas'],
    calcular: (v) => v.ventas ? v.ebitda / v.ventas : null,
    lectura: 'Lo que deja la operación antes de depreciar, financiar y pagar impuestos. Es la vara con la que el banco y cualquier comprador miden el negocio, porque no depende de cómo esté contabilizado el activo.',
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
    usa: ['caja', 'cxc', 'inventarioFinal', 'cxp'],
    calcular: (v) => v.caja + v.cxc + v.inventarioFinal - v.cxp,
    lectura: 'El dinero que la operación tiene secuestrado para poder funcionar. No aparece como gasto en ningún lado y por eso nadie lo defiende.',
  },
  {
    clave: 'ctoVentas',
    concepto: 'Capital de trabajo sobre venta',
    formula: 'Capital de trabajo operativo / Facturación',
    grupo: 'real',
    formato: 'pct',
    mejorSi: 'bajo',
    usa: ['caja', 'cxc', 'inventarioFinal', 'cxp', 'ventas'],
    calcular: (v) => v.ventas ? (v.caja + v.cxc + v.inventarioFinal - v.cxp) / v.ventas : null,
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

  {
    clave: 'deudaEbitda',
    concepto: 'Deuda con costo sobre EBITDA',
    formula: 'Deuda con costo / EBITDA',
    grupo: 'real',
    formato: 'veces',
    mejorSi: 'bajo',
    usa: ['deuda', 'ebitda'],
    calcular: (v) => v.ebitda > 0 ? v.deuda / v.ebitda : null,
    lectura: 'El covenant que trae escrito casi todo crédito bancario en México. Arriba de 3.5 veces la mayoría de los contratos ya está en incumplimiento técnico, aunque nadie lo haya llamado todavía.',
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
    usa: ['inventarioFinal', 'costoVentas'],
    calcular: (v) => v.costoVentas ? v.inventarioFinal / (v.costoVentas / DIAS) : null,
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
    usa: ['cxc', 'ventas', 'inventarioFinal', 'costoVentas', 'cxp', 'compras'],
    calcular: (v) => {
      if (!v.ventas || !v.costoVentas || !v.compras) return null
      return v.cxc / (v.ventas / DIAS) + v.inventarioFinal / (v.costoVentas / DIAS) - v.cxp / (v.compras / DIAS)
    },
    lectura: 'El cierre de los tres anteriores: cuántos días pasan entre que la empresa paga y que cobra. Es el hueco que alguien tiene que financiar, y ese alguien es el banco o el dueño.',
  },

  /* ---------- Liquidez y flujo ---------- */
  // Las tres primeras son la misma pregunta con el filtro cada vez más estricto:
  // primero todo el activo circulante, luego sin el inventario, al final solo el
  // efectivo. Dónde se rompe la escalera dice de qué está hecha la liquidez.
  {
    clave: 'razonCirculante',
    concepto: 'Razón circulante',
    formula: 'Activo circulante / Pasivo circulante',
    grupo: 'caja',
    formato: 'veces',
    mejorSi: 'alto',
    usa: ['activoCirculante', 'pasivoCirculante'],
    calcular: (v) => v.pasivoCirculante ? v.activoCirculante / v.pasivoCirculante : null,
    lectura: 'Cuántos pesos de activo de corto plazo respaldan cada peso que vence este año. Por debajo de 1 vez la empresa ya está financiando el largo plazo con dinero de corto.',
  },
  {
    clave: 'pruebaAcido',
    concepto: 'Prueba del ácido',
    formula: '(Activo circulante − Inventario) / Pasivo circulante',
    grupo: 'caja',
    formato: 'veces',
    mejorSi: 'alto',
    usa: ['activoCirculante', 'inventarioFinal', 'pasivoCirculante'],
    calcular: (v) => v.pasivoCirculante ? (v.activoCirculante - v.inventarioFinal) / v.pasivoCirculante : null,
    lectura: 'La misma cuenta sin contar la bodega, porque vender el inventario contra reloj significa rematarlo. Si la razón circulante se ve bien y esta no, la liquidez está hecha de mercancía.',
  },
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
    usa: ['cxc', 'inventarioFinal', 'cxp', 'ventas'],
    calcular: (v) => v.ventas ? (v.cxc + v.inventarioFinal - v.cxp) / v.ventas : null,
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

/**
 * Valores de un ejercicio indexados por clave, listos para calcular.
 *
 * El orden importa. Primero los capturados tal como se teclearon, luego los
 * derivados sobre ellos, y hasta el final la anualización de los flujos. Al
 * revés saldría mal: las compras se derivan de un costo del periodo y de un
 * movimiento de inventario del mismo periodo, así que anualizar antes mezclaría
 * un costo de doce meses con un inventario de siete.
 *
 * `meses` es la duración del periodo. Con 12 no se anualiza nada; con menos, los
 * campos marcados `acumula` se llevan a base anual para poder compararse contra
 * un cierre completo y contra el promedio de la industria. Los saldos de balance
 * nunca se tocan: ya vienen a una fecha.
 */
export function valoresDelEjercicio(campos: CampoFinanciero[], i: number, meses = 12) {
  const crudo: Record<string, number> = {}
  for (const c of campos) {
    if (c.derivado) continue
    const n = c.valores[i]
    if (n !== null && n !== undefined) crudo[c.clave] = n
  }
  for (const c of campos) {
    if (!c.derivado) continue
    const n = c.derivado(crudo)
    if (n !== null) crudo[c.clave] = n
  }

  if (meses >= 12) return crudo

  const factor = 12 / meses
  const v: Record<string, number> = {}
  for (const c of campos) {
    const n = crudo[c.clave]
    if (n !== undefined) v[c.clave] = c.acumula ? n * factor : n
  }
  return v
}

/** Claves que la razón necesita y todavía no se han capturado. */
export function faltantes(razon: Razon, valores: Record<string, number>, campos: CampoFinanciero[]) {
  return razon.usa
    .filter((k) => valores[k] === undefined)
    .map((k) => campos.find((c) => c.clave === k)?.concepto ?? k)
}

/* ---------- Lo que la radiografía ya contesta ---------- */

/**
 * Preguntas del paso 03 que no hay que hacerle al cliente porque los números de
 * la radiografía ya las responden. Cada una devuelve la variación redactada, o
 * null si falta algún dato.
 *
 * El MTD entra anualizado, igual que en el diagnóstico: comparar siete meses de
 * venta contra un año completo daría una caída inventada.
 */
export const LECTURAS_AUTOMATICAS: Record<
  string,
  (campos: CampoFinanciero[], ejercicios: Ejercicio[]) => string | null
> = {
  margenBruto: (campos, ejercicios) => {
    const v = ejercicios.map((e, i) => valoresDelEjercicio(campos, i, e.meses))
    const mb = (x: Record<string, number>) =>
      x.ventas && x.costoVentas !== undefined ? (x.ventas - x.costoVentas) / x.ventas : null
    const [a, b, c] = v.map(mb)
    if (a === null || b === null) return null
    const caida = (b - a) * 100
    const base = `${signoPP(caida)} contra ${ejercicios[1].etiqueta}: de ${pct(b)} a ${pct(a)}.`
    if (c === null) return base
    return `${base} Acumulado desde ${ejercicios[2].etiqueta}, ${signoPP((c - a) * 100)}: venía de ${pct(c)}.`
  },

  cicloEfectivo: (campos, ejercicios) => {
    const razon = RAZONES.find((r) => r.clave === 'cicloEfectivo')!
    const d = ejercicios.map((e, i) => {
      const x = valoresDelEjercicio(campos, i, e.meses)
      return faltantes(razon, x, campos).length ? null : razon.calcular(x)
    })
    if (d[0] === null || d[1] === null) return null
    const dif = d[0] - d[1]
    const base = `${Math.round(d[0])} días al corte, ${signoDias(dif)} contra los ${Math.round(d[1])} de ${ejercicios[1].etiqueta}.`
    return d[2] === null ? base : `${base} En ${ejercicios[2].etiqueta} eran ${Math.round(d[2])}.`
  },

  tesoreria: (campos, ejercicios) => {
    const razon = RAZONES.find((r) => r.clave === 'diasTesoreria')!
    const v = ejercicios.map((e, i) => valoresDelEjercicio(campos, i, e.meses))
    const d = v.map((x) => (faltantes(razon, x, campos).length ? null : razon.calcular(x)))
    if (d[0] === null || v[0].caja === undefined || v[1]?.caja === undefined) return null
    const caida = ((v[0].caja - v[1].caja) / v[1].caja) * 100
    return `${Math.round(d[0])} días de operación con la caja actual. El saldo pasó de ${MXN2(v[1].caja)} a ${MXN2(v[0].caja)}, ${signoPct(caida)}.`
  },

  nominaVenta: (campos, ejercicios) => {
    const v = ejercicios.map((e, i) => valoresDelEjercicio(campos, i, e.meses))
    if (!v[0].ventas || !v[1]?.ventas || !v[0].nomina || !v[1]?.nomina) return null
    const cv = ((v[0].ventas - v[1].ventas) / v[1].ventas) * 100
    const cn = ((v[0].nomina - v[1].nomina) / v[1].nomina) * 100
    const razon = RAZONES.find((r) => r.clave === 'ventaNomina')!
    const p0 = razon.calcular(v[0])
    const p1 = razon.calcular(v[1])
    const productividad = p0 !== null && p1 !== null
      ? ` La venta por peso de nómina pasó de ${p1.toFixed(2)}x a ${p0.toFixed(2)}x.`
      : ''
    return `Venta ${signoPct(cv)}, nómina ${signoPct(cn)} contra ${ejercicios[1].etiqueta}.${productividad}`
  },

  apalancamiento: (campos, ejercicios) => {
    const razon = RAZONES.find((r) => r.clave === 'deudaEbitda')!
    const v = ejercicios.map((e, i) => valoresDelEjercicio(campos, i, e.meses))
    const d = v.map((x) => (faltantes(razon, x, campos).length ? null : razon.calcular(x)))
    if (d[0] === null || d[1] === null || v[0].deuda === undefined || v[1].deuda === undefined) return null
    const crec = ((v[0].deuda - v[1].deuda) / v[1].deuda) * 100
    return `${d[0].toFixed(2)}x al corte, contra ${d[1].toFixed(2)}x en ${ejercicios[1].etiqueta}. La deuda con costo creció ${signoPct(crec)}, hasta ${MXN2(v[0].deuda)}.`
  },
}

const signo = (n: number) => (n >= 0 ? '+' : '−')
const pct = (n: number) => `${(n * 100).toFixed(1)}%`
const signoPP = (n: number) => `${signo(-n)}${Math.abs(n).toFixed(1)} pp`
const signoPct = (n: number) => `${signo(n)}${Math.abs(n).toFixed(0)}%`
const signoDias = (n: number) => `${signo(n)}${Math.abs(Math.round(n))} días`
const MXN2 = (n: number) => `$${MXN.format(Math.round(n))}`
