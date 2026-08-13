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

/**
 * Dato financiero de la radiografía, con un valor por ejercicio.
 *
 * Casi todos se capturan. Los que traen `derivado` no: se resuelven con los
 * demás campos del mismo ejercicio y se pintan en solo lectura. Es para los
 * datos que existen en la contabilidad pero que nadie trae de memoria, como las
 * compras del año.
 */
export interface CampoFinanciero {
  clave: string
  concepto: string
  unidad: 'mxn' | 'conteo'
  fuente: FuenteDato
  naturaleza: NaturalezaDato
  ayuda?: string
  valores: (number | null)[]
  /** Devuelve null mientras falte alguno de los campos que necesita. */
  derivado?: (v: Record<string, number>) => number | null
  /**
   * true para los flujos que se acumulan a lo largo del periodo (facturación,
   * costo, nómina, flujo de caja). Son los únicos que hay que anualizar para
   * que la columna MTD se pueda comparar contra un cierre completo; los saldos
   * de balance ya vienen a una fecha y se leen tal cual.
   */
  acumula?: boolean
}

/**
 * Columna de la radiografía. Un cierre corre doce meses; el MTD corre los que
 * lleve el año en curso, y por eso necesita decir cuántos.
 */
export interface Ejercicio {
  etiqueta: string
  meses: number
  /** El periodo abierto. Su mes de corte se elige en el encabezado. */
  enCurso?: boolean
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

/* ---------- Análisis a profundidad ---------- */

export type Semaforo = 'rojo' | 'amarillo' | 'verde'

/** Un riesgo del mapa: qué está pasando, con qué cifras y en qué plazo pega. */
export interface RiesgoDetectado {
  titulo: string
  semaforo: Semaforo
  /** Frente del negocio donde vive: rentabilidad, liquidez, capital de trabajo, deuda, operación, comercial. */
  frente: string
  lectura: string
  /** Cifras concretas del expediente que lo sostienen. Sin esto es opinión. */
  evidencia: string[]
  /** En qué plazo se vuelve un problema si nadie lo toca. */
  ventana: string
  /** El primer movimiento, no el plan completo. */
  primerMovimiento: string
}

export interface MapaRiesgos {
  /** La lectura de fondo: qué le está pasando de verdad a esta empresa. */
  veredicto: string
  urgencia: Semaforo
  riesgos: RiesgoDetectado[]
  /** Lo que los números no alcanzan a decir y hay que ir a preguntar. */
  puntosCiegos: string[]
  /**
   * Dimensiones del catálogo que estos números ya dejan en evidencia. El paso 02
   * las presenta premarcadas para que el consultor las confirme o las descarte.
   */
  dimensionesEvidentes: string[]
}

/* ---------- Plan de arranque ---------- */

/** Un frente de trabajo priorizado: por dónde se empieza y qué destraba. */
export interface FrentePrioritario {
  nombre: string
  criticidad: Semaforo
  /** Por qué este frente va en esta posición y no en otra. */
  porQue: string
  /** Dimensiones marcadas que quedan cubiertas al atacarlo. */
  dimensiones: string[]
  /** Qué se vuelve posible después de resolverlo. Es lo que fija la secuencia. */
  desbloquea: string
  /** El costo de no empezar por aquí. */
  siNoSeAtiende: string
  primerasAcciones: string[]
}

export interface PlanArranque {
  /** El plan en pocas frases: dónde está la empresa y qué se va a hacer. */
  resumen: string
  /** Exactamente tres, del más crítico al menos crítico. */
  frentes: FrentePrioritario[]
  /** Lo marcado que no entra todavía, con el motivo de que espere. */
  esperanTurno: { dimension: string; porQue: string }[]
}

/* ---------- Batería de contexto generada ---------- */

/**
 * Pregunta de la batería del paso 03. La escribe el motor a partir de los tres
 * frentes del análisis profundo: cada una existe para confirmar o tumbar algo
 * concreto de ese plan.
 */
export interface PreguntaGenerada {
  /** A qué frente del plan sirve. Agrupa la batería en pantalla. */
  frente: string
  pregunta: string
  tipo: 'opciones' | 'abierta' | 'cifra'
  /** Entre dos y cinco, solo cuando el tipo es 'opciones'. */
  opciones?: string[]
  /**
   * Clave de LECTURAS_AUTOMATICAS. Cuando viene, la cifra sale de la
   * radiografía del paso 01 y no hay que preguntarla.
   */
  derivaDe?: string
}

export interface BateriaContexto {
  preguntas: PreguntaGenerada[]
}

/** Lo que el motor concluye de un tema abierto por el cliente. */
export interface DiagnosticoTema {
  semaforo: Semaforo
  /** Qué está pasando con este tema, leído de las respuestas. */
  lectura: string
  /** Lo que quedó demostrado, cada uno con la respuesta que lo sostiene. */
  hallazgos: string[]
  /** Lo que las respuestas no alcanzan a resolver y sigue abierto. */
  loQueFalta: string[]
  primerMovimiento: string
}

/**
 * Tema que el cliente abrió en sesión, fuera de los tres frentes del plan.
 * Vive aparte: tiene sus propias preguntas, se puede profundizar todas las veces
 * que haga falta y se diagnostica solo.
 */
export interface TemaAbierto {
  id: string
  /** Lo que el cliente dijo, con sus palabras. */
  tema: string
  preguntas: PreguntaGenerada[]
  diagnostico: DiagnosticoTema | null
}

/* ---------- Carga de información ---------- */

/**
 * Archivo del expediente digital. Los doce datos duros ya se capturaron en el
 * paso 01: esto es el respaldo, no la fuente.
 */
export interface ArchivoAdjunto {
  nombre: string
  bytes: number
  /** ISO de cuando se adjuntó. */
  fecha: string
}

/* ---------- Costo de la inacción ---------- */

/** Lo que cuesta al año no atender uno de los tres frentes del diagnóstico. */
export interface CostoFrente {
  /** Nombre exacto del frente, para poder amarrarlo al diagnóstico inicial. */
  frente: string
  /** Pesos al año. El total nunca se pide: se suma aquí. */
  monto: number
  /** Cómo se llegó a la cifra, con los números que la sostienen. */
  base: string
  /** Lo que hubo que suponer. Sin esto la cifra no es defendible. */
  supuestos: string[]
  /** Qué parte se recupera y en cuánto tiempo. */
  recuperable: string
}

/**
 * Monto que queda fuera de la suma. Van juntos los que no son flujo anual y los
 * que todavía no se pueden medir: en los dos casos lo importante es la cifra y
 * el motivo de que no cuente.
 */
export interface MontoFuera {
  etiqueta: string
  /** Ya formateado: $18,400,000 · 16 días · 11.6 pp. */
  valor: string
  /** Qué es y por qué no entra a la suma. */
  detalle: string
}

export interface CostoInaccion {
  /** Exactamente tres, en el mismo orden que el diagnóstico inicial. */
  frentes: CostoFrente[]
  /** Lo que queda fuera para no contar dos veces el mismo efecto. */
  fueraDeLaSuma: MontoFuera[]
  /** La frase con la que el consultor abre la conversación. */
  lectura: string
}

/* ---------- Causa raíz ---------- */

/** Una cadena de causalidad: del síntoma que se ve al mecanismo que lo produce. */
export interface CadenaCausal {
  id: string
  /** Frente del diagnóstico o tema abierto del que sale. */
  origen: string
  /** Lo que el cliente ve y nombra. */
  sintoma: string
  /** Los porqués encadenados, del síntoma hacia el fondo. */
  porques: string[]
  causaRaiz: string
  /** Por qué la cadena se detiene ahí y no un nivel más abajo. */
  porQueAhi: string
  /** Qué pasa si el plan ataca los síntomas en lugar de esto. */
  implicacion: string
  /** true cuando la escribió el consultor y no el motor. */
  propia?: boolean
}

export interface CausasRaiz {
  cadenas: CadenaCausal[]
  /** Lo que las cadenas tienen en común, si convergen. Null si son independientes. */
  convergencia: string | null
}

/* ---------- Plan de trabajo ---------- */

/** Las cuatro ventanas del plan. Después de 90 días ya es operación, no proyecto. */
export type VentanaPlan = '0-30' | '31-60' | '61-90' | '+90'

export interface AccionPlan {
  id: string
  /** Frente del diagnóstico al que pertenece. */
  frente: string
  ventana: VentanaPlan
  accion: string
  /** Quién responde. Editable: el organigrama real casi nunca es el que uno supone. */
  area: string
  /** Qué queda instalado cuando termina. Si no deja rastro, no es acción. */
  entregable: string
  /** Herramienta de la biblioteca que la sostiene, si hay una. */
  herramienta?: { nombre: string; modulo: string }
}

export interface PlanTrabajo {
  acciones: AccionPlan[]
  /** Cómo se lee el plan completo: qué se busca en cada ventana. */
  lectura: string
}

/* ---------- Detalle de una acción del plan ---------- */

/** Un paso de ejecución: qué se hace, quién lo hace y cuándo. */
export interface PasoEjecucion {
  paso: string
  quien: string
  cuando: string
}

/**
 * Un nivel de ambición. No lleva probabilidad inventada: lleva lo que tiene que
 * ser cierto para que funcione, que es lo que el consultor puede verificar.
 */
export interface EscenarioAccion {
  nombre: 'Conservador' | 'Recomendado' | 'Agresivo'
  alcance: string
  /** Lo que devuelve, ya formateado. */
  resultado: string
  plazo: string
  queRequiere: string
}

/** Los textos listos para mandar. No se envían solos: se copian y se mandan. */
export interface MensajesAccion {
  correo: { para: string; asunto: string; cuerpo: string }
  whatsapp: string
  junta: { titulo: string; cuando: string; asistentes: string; agenda: string[] }
}

export interface DetalleAccion {
  /** Por qué esta acción, atada a la causa raíz del frente. */
  porQue: string
  /** Las cifras del expediente que la justifican. */
  evidencia: string[]
  comoSeHace: PasoEjecucion[]
  impacto: {
    /** Lo que devuelve: caja, días, puntos de margen. */
    libera: string
    /** Lo que cuesta hacerla. Muchas veces es solo tiempo. */
    inversion: string
    ventana: string
    /** El indicador que prueba que funcionó. */
    comoSeMide: string
  }
  escenarios: EscenarioAccion[]
  riesgos: { riesgo: string; mitigacion: string }[]
  mensajes: MensajesAccion
}

/* ---------- Accountability ---------- */

/** Indicador crítico: lo que se mide para saber si el plan está funcionando. */
export interface KpiSeguimiento {
  indicador: string
  /** Frente del diagnóstico al que responde. */
  frente: string
  base: string
  meta: string
  frecuencia: string
  /** Puesto que responde. Editable: es la decisión más discutida de todo el cierre. */
  responsable: string
}

/** Una junta del ritmo de seguimiento. */
export interface JuntaRitmo {
  junta: string
  cuando: string
  asistentes: string
  proposito: string
}

export interface Accountability {
  /** El párrafo de cierre: qué se encontró y qué se lleva la empresa. */
  cierre: string
  kpis: KpiSeguimiento[]
  ritmo: JuntaRitmo[]
  /** Qué mirar en las primeras semanas para saber si va bien antes de que se note en el número. */
  senalesTempranas: string[]
  /** Qué pasa si el ritmo se abandona a los dos meses, que es lo que suele pasar. */
  riesgoDeNoSostener: string
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
  /**
   * Clave de LECTURAS_AUTOMATICAS. Si viene, la respuesta sale de la radiografía
   * del paso 01 y no se le pregunta al cliente — aunque el consultor puede
   * sobrescribirla si tiene mejor dato.
   */
  derivaDe?: string
}
