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

/** Dato financiero capturado, con un valor por ejercicio. */
export interface CampoFinanciero {
  clave: string
  concepto: string
  unidad: 'mxn' | 'conteo'
  fuente: FuenteDato
  ayuda?: string
  valores: (number | null)[]
}

export type FormatoRazon = 'pct' | 'veces' | 'mxn'

/** Razón derivada. No se pregunta: se calcula con los campos capturados. */
export interface Razon {
  clave: string
  concepto: string
  formula: string
  grupo: 'rentabilidad' | 'real'
  formato: FormatoRazon
  /** Sentido de mejora, para leer la variación entre ejercicios. */
  mejorSi: 'alto' | 'bajo'
  /** Claves de CampoFinanciero que necesita para poder calcularse. */
  usa: string[]
  calcular: (v: Record<string, number>) => number | null
  lectura: string
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
