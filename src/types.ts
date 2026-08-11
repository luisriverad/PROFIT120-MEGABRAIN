/** Contratos de datos del motor de diagnóstico. */

export interface Step {
  n: string
  titulo: string
  pregunta: string
}

export interface Modulo {
  nombre: string
  archivos: number
}

/** Bloque temático del catálogo de dimensiones profundas. */
export interface TemaDimension {
  n: string
  nombre: string
  dimensiones: string[]
}

/** Herramienta de la biblioteca propuesta por el motor. */
export interface Herramienta {
  nombre: string
  modulo: string
  porque: string
  match: number
}

export type Severidad = 'critico' | 'alerta' | 'observacion'

export interface Hallazgo {
  dimension: string
  severidad: Severidad
  lectura: string
  evidencia: string
}

export type ValidacionCliente = 'confirmado' | 'matizado' | 'descartado'

export interface HallazgoValidado {
  dimension: string
  severidad: Severidad
  resumen: string
  validacion: ValidacionCliente
  aporte: string
}

/**
 * Factibilidad de captura. El expediente se llena en la primera entrevista,
 * así que cada dato se marca por lo que cuesta obtenerlo:
 *  - 'sesion':   el cliente lo contesta de memoria, sin abrir nada.
 *  - 'caratula': exige el estado de resultados o el balance a la mano.
 */
export type FuenteDato = 'sesion' | 'caratula'

/**
 * Naturaleza contable del dato. Ordena la captura por el documento del que sale,
 * y dibuja las divisiones de la radiografía.
 */
export type NaturalezaDato =
  | 'resultados'
  | 'personal'
  | 'capitalTrabajo'
  | 'estructura'
  | 'flujo'

/** Dato financiero capturado, con un valor por ejercicio. */
export interface CampoFinanciero {
  clave: string
  concepto: string
  unidad: 'mxn' | 'conteo'
  fuente: FuenteDato
  naturaleza: NaturalezaDato
  ayuda?: string
  valores: (number | null)[]
}

export type FormatoRazon = 'pct' | 'veces' | 'mxn' | 'dias'

/** Razón derivada. No se pregunta: se calcula con los campos capturados. */
export interface Razon {
  clave: string
  concepto: string
  formula: string
  grupo: 'rentabilidad' | 'real' | 'dias' | 'caja'
  formato: FormatoRazon
  /** Sentido de mejora, para leer la variación entre ejercicios. */
  mejorSi: 'alto' | 'bajo'
  /** Claves de CampoFinanciero que necesita para poder calcularse. */
  usa: string[]
  calcular: (v: Record<string, number>) => number | null
  lectura: string
}

/**
 * Promedio de industria para una razón. `valor` viene en la misma unidad que
 * devuelve Razon.calcular — fracción para 'pct', veces para 'veces'. Es null
 * cuando la razón no tiene lectura comparable en ese sector, y entonces `nota`
 * explica por qué.
 */
export interface BenchmarkRazon {
  valor: number | null
  /** Rango intercuartil del sector: entre p25 y p75 está la mitad de las empresas. */
  min: number | null
  max: number | null
  nota?: string
}

export interface BenchmarkSector {
  sector: string
  vigencia: string
  fuente: string
  razones: Record<string, BenchmarkRazon>
}

/** Fuente citada por la IA al justificar o recalcular un promedio. */
export interface FuenteIA {
  nombre: string
  url?: string
  anio: string
}

/** Lectura de la IA sobre una razón: de dónde sale el promedio y qué tan firme es. */
export interface RazonExplicada {
  clave: string
  /** En unidad de despliegue: 8.5 significa 8.5% o 8.5x. Null si no hay dato defendible. */
  valor: number | null
  min: number | null
  max: number | null
  confianza: 'alta' | 'media' | 'baja'
  razonamiento: string
  fuentes: FuenteIA[]
}

export interface ExplicacionPromedio {
  resumen: string
  metodologia: string
  razones: RazonExplicada[]
  advertencias: string[]
}

/** Turno de la conversación del cuadro de diálogo de recálculo. */
export interface TurnoIA {
  rol: 'consultor' | 'motor'
  texto: string
}

export type EstadoDocumento = 'cargado' | 'parcial' | 'falta' | 'definido'

export interface Documento {
  nombre: string
  detalle: string
  estado: EstadoDocumento
  etiqueta: string
}

export interface LineaCosto {
  concepto: string
  base: string
  monto: string
}

export interface Indicador {
  etiqueta: string
  valor: string
  detalle: string
}

export interface Eslabon {
  nivel: string
  texto: string
}

export interface FaseDelPlan {
  nombre: string
  ventana: string
  acciones: string[]
  herramientas: { nombre: string; modulo: string }[]
}

export interface Kpi {
  indicador: string
  base: string
  meta: string
  frecuencia: string
  responsable: string
}

export type Tendencia = 'up' | 'flat' | 'down' | 'na'

export interface FilaTendencia {
  concepto: string
  valor: Tendencia
}

export interface PreguntaOpciones {
  etiqueta: string
  pregunta: string
  opciones: string[]
  seleccion: number
}

export interface PreguntaTexto {
  etiqueta: string
  pregunta: string
  valor: string
  placeholder?: string
}

export interface PreguntaNumero {
  etiqueta: string
  pregunta: string
  valor: string
}
