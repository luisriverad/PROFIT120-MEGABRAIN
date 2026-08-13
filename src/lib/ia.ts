import type Anthropic from '@anthropic-ai/sdk'
import type {
  AccionPlan, Accountability, BateriaContexto, BenchmarkSector, CadenaCausal, CampoFinanciero,
  CausasRaiz,
  CostoInaccion, DetalleAccion, DiagnosticoTema, Ejercicio, ExplicacionPromedio, MapaRiesgos,
  PlanArranque, PlanTrabajo, PreguntaGenerada, Razon, TurnoIA,
} from '@/types'
import {
  faltantes, formatearCampo, formatearRazon, valoresDelEjercicio,
} from '@/data/finanzas'
import { DIMENSIONES } from '@/data/catalogo'

/**
 * Revisión con IA del promedio de industria.
 *
 * El motor trae una base sectorial precargada (src/data/benchmarks.ts). Este
 * módulo es lo que la audita: sale a buscar las publicaciones vivas, explica de
 * dónde sale cada número y devuelve un recálculo cuando el consultor lo pide —
 * ya sea porque la cifra le huele a alucinación o porque necesita un corte más
 * específico que "el sector completo".
 */

export const MODELO_IA = 'claude-opus-5'

const CLAVE_LOCAL = 'profit120.anthropic.api-key'

/**
 * Dónde vive la credencial. En orden:
 *  1. VITE_IA_PROXY_URL — un backend propio que guarda la llave del lado servidor.
 *     Es la opción correcta para producción: el navegador nunca ve la API key.
 *  2. VITE_ANTHROPIC_API_KEY — llave de build, para desarrollo local.
 *  3. Lo que el consultor pegue en el modal, guardado en este navegador.
 */
export const PROXY = (import.meta.env.VITE_IA_PROXY_URL as string | undefined) ?? ''

export function leerApiKey(): string {
  const deBuild = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
  if (deBuild) return deBuild
  try {
    return localStorage.getItem(CLAVE_LOCAL) ?? ''
  } catch {
    return ''
  }
}

export function guardarApiKey(llave: string) {
  try {
    if (llave) localStorage.setItem(CLAVE_LOCAL, llave)
    else localStorage.removeItem(CLAVE_LOCAL)
  } catch {
    /* navegador sin almacenamiento: la llave vive solo en esta sesión */
  }
}

export function hayCredencial() {
  return Boolean(PROXY) || Boolean(leerApiKey())
}

/* ---------------------------------------------------------------- */

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'metodologia', 'razones', 'advertencias'],
  properties: {
    resumen: {
      type: 'string',
      description: 'Dos o tres frases: qué mide este sector en México y cómo se comporta hoy.',
    },
    metodologia: {
      type: 'string',
      description: 'Cómo se construyó el promedio: qué fuentes, qué universo de empresas, qué ajustes y por qué.',
    },
    razones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['clave', 'valor', 'min', 'max', 'confianza', 'razonamiento', 'fuentes'],
        properties: {
          clave: { type: 'string', description: 'Clave de la razón, tal como se entregó en la petición.' },
          valor: {
            anyOf: [{ type: 'number' }, { type: 'null' }],
            description: 'Promedio en unidad de despliegue: 8.5 significa 8.5% para porcentajes y 8.5x para veces. Null si no hay dato defendible.',
          },
          min: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'Percentil 25 del sector, misma unidad.' },
          max: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'Percentil 75 del sector, misma unidad.' },
          confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
          razonamiento: {
            type: 'string',
            description: 'De dónde sale el número y qué lo mueve. Si corrige la cifra precargada, decir explícitamente en qué se equivocaba.',
          },
          fuentes: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['nombre', 'anio'],
              properties: {
                nombre: { type: 'string' },
                url: { type: 'string' },
                anio: { type: 'string', description: 'Año o periodo del dato, no el año de consulta.' },
              },
            },
          },
        },
      },
    },
    advertencias: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lo que el consultor debe saber antes de usar estos números frente al cliente: huecos de fuente, definiciones que no empatan, sesgos del universo.',
    },
  },
} as const

const SISTEMA = `Eres el analista sectorial de PROFIT120, una consultoría mexicana de rentabilidad empresarial. Tu trabajo es fijar el promedio de industria contra el que se compara un cliente en un diagnóstico financiero.

Reglas de oficio:

- Buscas antes de responder. Los datos macro y sectoriales de México cambian cada trimestre; no contestes de memoria. Prioriza en este orden: INEGI (Censos Económicos, EMIM, EMEC, EMS, ENAPROCE), Banco de México, estados financieros de emisoras de la BMV con operación mayoritariamente nacional, IMSS para masa salarial y empleo, cámaras sectoriales (CONCAMIN, CANACINTRA, ANTAD, AMIA, INA, CMIC, CANIETI, CANIRAC, CNA) y, solo para estructura relativa entre industrias, las tablas de mercados emergentes de Damodaran.
- El universo es la empresa mediana mexicana del sector, no la emisora bursátil. Las listadas son más grandes y más rentables que la mediana: si esa es tu única fuente, ajusta a la baja y dilo.
- Distingues dato de estimación. Si un número lo estás derivando o interpolando, la confianza no puede ser "alta".
- Una cifra sin fuente no se publica. Si no la encuentras, deja el valor en null, explica el hueco y baja la confianza; nunca inventes una fuente ni un porcentaje plausible.
- El rango importa tanto como el promedio. Entrega p25 y p75; la mitad de las empresas del sector debe caber entre ellos.
- Cuando corrijas una cifra precargada, di en qué estaba mal y por qué tu número es mejor. Cuando la confirmes, dilo igual de claro.
- Escribes para un consultor que va a poner esto frente al dueño de la empresa. Español de México, directo, sin relleno. Nada de disclaimers genéricos.`

/* ---------------------------------------------------------------- */

interface Peticion {
  sector: string
  razones: Razon[]
  base: BenchmarkSector
  /** Lo que el consultor escribió en el cuadro de diálogo. Vacío en la primera pasada. */
  instruccion: string
  historial: TurnoIA[]
}

function unidadDe(r: Razon) {
  if (r.formato === 'pct') return 'porcentaje (entrega 8.5 para 8.5%)'
  if (r.formato === 'veces') return 'veces (entrega 2.4 para 2.4x)'
  return 'pesos mexicanos'
}

function aUnidadDespliegue(valor: number | null | undefined, formato: Razon['formato']) {
  if (valor === null || valor === undefined) return null
  return formato === 'pct' ? valor * 100 : valor
}

function armarPregunta({ sector, razones, base, instruccion }: Peticion) {
  const inventario = razones.map((r) => {
    const b = base.razones[r.clave]
    const precargado = b?.valor === null || b?.valor === undefined
      ? 'sin promedio precargado'
      : `precargado ${aUnidadDespliegue(b.valor, r.formato)} (rango ${aUnidadDespliegue(b.min, r.formato)}–${aUnidadDespliegue(b.max, r.formato)})`
    return [
      `- clave: ${r.clave}`,
      `  concepto: ${r.concepto}`,
      `  fórmula: ${r.formula}`,
      `  unidad de respuesta: ${unidadDe(r)}`,
      `  mejor si es: ${r.mejorSi}`,
      `  ${precargado}${b?.nota ? ` — nota del motor: ${b.nota}` : ''}`,
    ].join('\n')
  }).join('\n')

  return [
    `Sector del cliente: ${sector}. Economía mexicana, cierre de ejercicio más reciente con dato publicado.`,
    '',
    'Razones a dictaminar:',
    inventario,
    '',
    `La base precargada del motor dice: ${base.fuente} · ${base.vigencia}.`,
    'Audítala contra lo que encuentres publicado. Confirma lo que aguante y corrige lo que no.',
    instruccion
      ? `\nInstrucción específica del consultor — tiene prioridad sobre todo lo anterior:\n${instruccion}`
      : '\nEsta es la primera revisión: explica de dónde sale cada promedio y recalcula lo que no se sostenga.',
    '\nEntrega una entrada por cada clave listada, incluidas las que queden en null.',
  ].join('\n')
}

/* ---------------------------------------------------------------- */

type Mensaje = Anthropic.MessageParam

/**
 * El SDK se carga bajo demanda: pesa más que el resto de la aplicación junta y
 * solo hace falta cuando alguien abre la revisión del promedio. Además arrastra
 * rutas de credenciales de Node que en el navegador solo son seguras mientras
 * no se ejecuten — por eso la llave se exige antes de construir el cliente.
 */
async function cliente() {
  const llave = leerApiKey()
  if (!llave) throw new Error('Falta la clave de API. Captúrala arriba o configura el proxy.')
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  return new Anthropic({
    apiKey: llave,
    // El consultor pega su propia llave en su propio navegador. En despliegue
    // compartido usa VITE_IA_PROXY_URL y esta rama nunca se ejecuta.
    dangerouslyAllowBrowser: true,
  })
}

/** Herramienta de búsqueda del lado servidor: es lo que trae los datos vivos. */
const BUSQUEDA = {
  type: 'web_search_20260209' as const,
  name: 'web_search' as const,
  max_uses: 12,
  user_location: { type: 'approximate' as const, country: 'MX', timezone: 'America/Mexico_City' },
}

interface Consulta {
  sistema: string
  esquema: unknown
  mensajes: Mensaje[]
  /** Solo la revisión del promedio necesita salir a buscar. */
  buscar?: boolean
  esfuerzo?: 'medium' | 'high' | 'xhigh' | 'max'
}

async function conversar({ sistema, esquema, mensajes, buscar, esfuerzo = 'high' }: Consulta): Promise<string> {
  const api = await cliente()
  const historia = [...mensajes]

  // El buscador corre del lado de Anthropic y puede agotar sus iteraciones
  // internas; cuando eso pasa devuelve pause_turn y se reanuda reenviando.
  for (let intento = 0; intento < 6; intento++) {
    const stream = api.messages.stream({
      model: MODELO_IA,
      max_tokens: 32000,
      system: sistema,
      ...(buscar ? { tools: [BUSQUEDA] } : {}),
      output_config: {
        effort: esfuerzo,
        format: { type: 'json_schema', schema: esquema as Record<string, unknown> },
      },
      messages: historia,
    })
    const respuesta = await stream.finalMessage()

    if (respuesta.stop_reason === 'refusal') {
      throw new Error('El modelo declinó la petición. Reformula la instrucción.')
    }
    if (respuesta.stop_reason === 'max_tokens') {
      throw new Error('La respuesta se cortó por longitud. Pide menos cosas a la vez.')
    }
    if (respuesta.stop_reason === 'pause_turn') {
      historia.push({ role: 'assistant', content: respuesta.content })
      continue
    }

    const texto = respuesta.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
    if (!texto.trim()) throw new Error('El modelo respondió vacío.')
    return texto
  }
  throw new Error('La búsqueda no terminó tras varios reintentos.')
}

/** Ruta de producción: el backend propio guarda la llave y habla con Anthropic. */
async function porProxy({ sistema, esquema, mensajes }: Consulta): Promise<string> {
  const r = await fetch(PROXY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELO_IA, system: sistema, messages: mensajes, schema: esquema }),
  })
  if (!r.ok) throw new Error(`El proxy respondió ${r.status}: ${await r.text()}`)
  const datos = await r.json()
  return typeof datos === 'string' ? datos : datos.texto ?? JSON.stringify(datos)
}

/** Una sola puerta: proxy si está configurado, si no la API directa. */
async function preguntar(c: Consulta): Promise<string> {
  return PROXY ? porProxy(c) : conversar(c)
}

/* ---------------------------------------------------------------- */

/**
 * Pide la explicación del promedio y, si hay instrucción, el recálculo.
 * Devuelve la lectura ya validada contra el esquema.
 */
export async function explicarPromedio(peticion: Peticion): Promise<ExplicacionPromedio> {
  const mensajes: Mensaje[] = []
  for (const turno of peticion.historial) {
    mensajes.push({
      role: turno.rol === 'consultor' ? 'user' : 'assistant',
      content: turno.texto,
    })
  }
  mensajes.push({ role: 'user', content: armarPregunta(peticion) })

  const crudo = await preguntar({ sistema: SISTEMA, esquema: ESQUEMA, mensajes, buscar: true })

  let datos: ExplicacionPromedio
  try {
    datos = JSON.parse(crudo) as ExplicacionPromedio
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    resumen: datos.resumen ?? '',
    metodologia: datos.metodologia ?? '',
    razones: Array.isArray(datos.razones) ? datos.razones : [],
    advertencias: Array.isArray(datos.advertencias) ? datos.advertencias : [],
  }
}

/**
 * Lleva lo que devolvió la IA a la unidad interna del motor (fracción para
 * porcentajes) para que la tabla lo pueda pintar junto al resto.
 */
export function aBenchmark(razon: Razon, lectura: { valor: number | null; min: number | null; max: number | null; razonamiento: string }) {
  const escala = razon.formato === 'pct' ? 0.01 : 1
  const conv = (n: number | null) => (n === null || n === undefined ? null : n * escala)
  return {
    valor: conv(lectura.valor),
    min: conv(lectura.min),
    max: conv(lectura.max),
    nota: lectura.razonamiento,
  }
}

/* ================================================================ */
/*  ANÁLISIS A PROFUNDIDAD — mapa de riesgos                        */
/* ================================================================ */

const ESQUEMA_RIESGOS = {
  type: 'object',
  additionalProperties: false,
  required: ['veredicto', 'urgencia', 'riesgos', 'puntosCiegos', 'dimensionesEvidentes'],
  properties: {
    veredicto: {
      type: 'string',
      description: 'Qué le está pasando de verdad a esta empresa, en tres o cuatro frases. La tesis, no el resumen de los renglones.',
    },
    urgencia: {
      type: 'string',
      enum: ['rojo', 'amarillo', 'verde'],
      description: 'El semáforo de la empresa completa. Rojo si algo puede tronar dentro de doce meses.',
    },
    riesgos: {
      type: 'array',
      description: 'Entre cuatro y ocho riesgos, ordenados del más grave al menos grave. No inventes riesgos para llenar la lista.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titulo', 'semaforo', 'frente', 'lectura', 'evidencia', 'ventana', 'primerMovimiento'],
        properties: {
          titulo: { type: 'string', description: 'El riesgo en una frase corta, en lenguaje de dueño, no de contador.' },
          semaforo: { type: 'string', enum: ['rojo', 'amarillo', 'verde'] },
          frente: {
            type: 'string',
            description: 'Rentabilidad, Liquidez, Capital de trabajo, Deuda, Operación, Comercial, Recurso humano o Estructura.',
          },
          lectura: { type: 'string', description: 'Qué está pasando y por qué importa. Dos o tres frases.' },
          evidencia: {
            type: 'array',
            items: { type: 'string' },
            description: 'Cifras textuales del expediente que lo sostienen, con su periodo y su comparativo. Sin cifra no hay riesgo.',
          },
          ventana: { type: 'string', description: 'En qué plazo pega si nadie lo toca.' },
          primerMovimiento: { type: 'string', description: 'El primer movimiento concreto, no el plan completo.' },
        },
      },
    },
    puntosCiegos: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lo que estos números no alcanzan a decir y el consultor tiene que ir a preguntar en la siguiente sesión.',
    },
    dimensionesEvidentes: {
      type: 'array',
      items: { type: 'string', enum: [...DIMENSIONES] },
      description: 'Las dimensiones del catálogo que estos números ya dejan en evidencia. Solo las que puedas sostener con una cifra; el consultor marcará el resto a mano.',
    },
  },
}

const SISTEMA_RIESGOS = `Eres el analista financiero de PROFIT120, una consultoría mexicana de rentabilidad empresarial. Te entregan la radiografía completa de un cliente y las razones ya calculadas contra el promedio de su industria. Tu trabajo es entregar el mapa de riesgos con el que el consultor se sienta frente al dueño.

Cómo trabajas:

- Buscas la tesis, no el inventario. Cualquiera puede decir que el ROS bajó. Tú dices por qué bajó, qué lo está causando y qué se rompe después. Los renglones malos casi siempre son síntomas del mismo problema estructural: encuéntralo y dilo.
- Cruzas, no enumeras. El valor está en las combinaciones: venta que sube con margen que baja, utilidad declarada con caja que no aparece, inventario que rota bien pero cartera que se alarga, EBITDA sano con deuda creciendo más rápido. Un riesgo que sale de un solo renglón casi nunca es el importante.
- Toda afirmación va con su cifra. Cita el número, su periodo y contra qué lo comparas — el ejercicio anterior, el MTD anualizado o el promedio del sector. Si no puedes citarlo, no lo escribas.
- El MTD viene anualizado para que sea comparable, y ahí es donde se ve hacia dónde va la empresa. Trátalo como la lectura de hoy y compáralo siempre contra el último cierre completo.
- Semáforo con criterio: rojo es lo que puede tronar dentro de doce meses o ya rompió un covenant; amarillo es lo que se está deteriorando y todavía tiene arreglo barato; verde es lo que está sano y conviene defender. No pintes todo de rojo — un mapa donde todo es urgente no sirve para priorizar.
- Nombra lo que está bien. Si algo aguanta —una razón mejor que su industria, una tendencia que se corrigió— dilo en verde. El dueño necesita saber sobre qué construir.
- Distingues contable de real. La utilidad se declara; la caja se cobra. Cuando el estado de resultados y el flujo no cuadran, ese es el hallazgo.
- Marcas las dimensiones que los números ya dejan en evidencia, escogiéndolas del catálogo que viene en la petición y copiando el texto exacto. Solo las que puedas sostener con una cifra: el consultor marcará a mano las que dependan de lo que vea en piso o escuche en entrevista, y una dimensión sugerida de más le cuesta más trabajo que una de menos.
- Escribes en español de México, para el dueño de una empresa mediana. Directo, sin jerga innecesaria, sin adjetivos de relleno y sin suavizar el diagnóstico. Nada de recomendaciones genéricas tipo "mejorar la eficiencia": el primer movimiento tiene que ser algo que alguien pueda hacer el lunes.`

/** Arma el expediente completo en texto: lo capturado y lo calculado. */
function armarExpediente(p: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  ejercicios: Ejercicio[]
  campos: CampoFinanciero[]
  razones: Razon[]
  benchmark: BenchmarkSector
}) {
  const { cliente, ejercicios, campos, razones, benchmark } = p
  const crudos = ejercicios.map((_, i) => valoresDelEjercicio(campos, i))
  const anuales = ejercicios.map((e, i) => valoresDelEjercicio(campos, i, e.meses))
  const cols = ejercicios.map((e) => (e.enCurso ? `${e.etiqueta} (${e.meses} meses)` : e.etiqueta))

  const datos = campos.map((c) => {
    const cifras = ejercicios.map((_, i) => {
      const n = crudos[i][c.clave]
      return `${cols[i]}: ${n === undefined ? 'sin dato' : formatearCampo(n, c.unidad)}`
    })
    return `- ${c.concepto}${c.derivado ? ' [calculado]' : ''} — ${cifras.join(' · ')}`
  }).join('\n')

  const lecturas = razones.map((r) => {
    const cifras = ejercicios.map((_, i) => {
      const falta = faltantes(r, anuales[i], campos)
      const n = falta.length ? null : r.calcular(anuales[i])
      return `${cols[i]}: ${formatearRazon(n, r.formato)}`
    })
    const bm = benchmark.razones[r.clave]
    const ref = bm?.valor === null || bm?.valor === undefined
      ? (bm?.nota ? `sin promedio comparable (${bm.nota})` : 'sin promedio')
      : `${formatearRazon(bm.valor, r.formato)}${bm.min !== null && bm.max !== null ? ` (rango ${formatearRazon(bm.min, r.formato)}–${formatearRazon(bm.max, r.formato)})` : ''}`
    return [
      `- ${r.concepto} — ${r.formula}`,
      `  ${cifras.join(' · ')}`,
      `  Promedio de la industria: ${ref}. Mejor si es ${r.mejorSi}.`,
    ].join('\n')
  }).join('\n')

  const mtd = ejercicios.find((e) => e.enCurso)

  return [
    `EMPRESA: ${cliente.razonSocial}`,
    `Sector: ${cliente.sector} · ${cliente.aniosOperacion} años de operación`,
    `${cliente.clientes80} clientes concentran el 80% de la venta · ${cliente.lineasActivas} líneas o unidades de negocio activas`,
    '',
    'RADIOGRAFÍA FINANCIERA — cifras tal como ocurrieron en cada periodo, sin anualizar:',
    datos,
    '',
    mtd
      ? `Nota: la columna ${mtd.etiqueta} corre ${mtd.meses} meses. En el bloque siguiente sus flujos ya vienen anualizados (× 12/${mtd.meses}); los saldos de balance van a la fecha de corte y no se tocan.`
      : '',
    '',
    'PRIMER DIAGNÓSTICO FINANCIERO — razones calculadas contra el promedio de la industria:',
    lecturas,
    '',
    `Base del promedio de industria: ${benchmark.fuente} · ${benchmark.vigencia}.`,
    '',
    'CATÁLOGO DE DIMENSIONES PROFUNDAS — de aquí sale dimensionesEvidentes, con el texto exacto:',
    DIMENSIONES.map((d) => `- ${d}`).join('\n'),
    '',
    'Entrega el mapa de riesgos.',
  ].filter(Boolean).join('\n')
}

/**
 * Lee todo el expediente y devuelve el mapa de riesgos en semáforo.
 * `instruccion` deja al consultor pedir un ángulo específico.
 */
export async function analizarProfundidad(p: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  ejercicios: Ejercicio[]
  campos: CampoFinanciero[]
  razones: Razon[]
  benchmark: BenchmarkSector
  instruccion?: string
}): Promise<MapaRiesgos> {
  const expediente = armarExpediente(p)
  const mensajes: Mensaje[] = [{
    role: 'user',
    content: p.instruccion
      ? `${expediente}\n\nÁngulo que pide el consultor, tiene prioridad:\n${p.instruccion}`
      : expediente,
  }]

  const crudo = await preguntar({
    sistema: SISTEMA_RIESGOS,
    esquema: ESQUEMA_RIESGOS,
    mensajes,
    // Es el juicio de fondo del expediente: aquí la profundidad vale más que la latencia.
    esfuerzo: 'xhigh',
  })

  let datos: MapaRiesgos
  try {
    datos = JSON.parse(crudo) as MapaRiesgos
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    veredicto: datos.veredicto ?? '',
    urgencia: datos.urgencia ?? 'amarillo',
    riesgos: Array.isArray(datos.riesgos) ? datos.riesgos : [],
    puntosCiegos: Array.isArray(datos.puntosCiegos) ? datos.puntosCiegos : [],
    // El esquema ya restringe al catálogo, pero se filtra de todos modos: una
    // dimensión inventada dejaría un chip amarillo que no existe en pantalla.
    dimensionesEvidentes: Array.isArray(datos.dimensionesEvidentes)
      ? datos.dimensionesEvidentes.filter((d) => DIMENSIONES.includes(d))
      : [],
  }
}

/* ================================================================ */
/*  PLAN DE ARRANQUE — por dónde se empieza                         */
/* ================================================================ */

const ESQUEMA_PLAN = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'frentes', 'esperanTurno'],
  properties: {
    resumen: {
      type: 'string',
      description: 'El plan en tres o cuatro frases: en qué situación está la empresa y qué se va a hacer, nombrando los tres frentes en orden. Es lo primero que lee el consultor y lo único que el dueño va a recordar. Nada de explicar el criterio de priorización ni el método — eso ya va dentro de cada frente.',
    },
    frentes: {
      type: 'array',
      description: 'Exactamente tres, del más crítico al menos crítico. Ni dos ni cuatro.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nombre', 'criticidad', 'porQue', 'dimensiones', 'desbloquea', 'siNoSeAtiende', 'primerasAcciones'],
        properties: {
          nombre: { type: 'string', description: 'El frente en pocas palabras, en lenguaje de dueño.' },
          criticidad: { type: 'string', enum: ['rojo', 'amarillo', 'verde'] },
          porQue: { type: 'string', description: 'Por qué va en esta posición. Con la cifra que lo sostiene.' },
          dimensiones: {
            type: 'array',
            items: { type: 'string', enum: [...DIMENSIONES] },
            description: 'Las dimensiones marcadas que quedan cubiertas al atacar este frente, con el texto exacto del catálogo.',
          },
          desbloquea: { type: 'string', description: 'Qué se vuelve posible después de resolverlo. Es lo que justifica la secuencia.' },
          siNoSeAtiende: { type: 'string', description: 'El costo concreto de no empezar por aquí.' },
          primerasAcciones: {
            type: 'array',
            items: { type: 'string' },
            description: 'De dos a cuatro acciones que alguien pueda arrancar la próxima semana. Nada de "mejorar" ni "optimizar".',
          },
        },
      },
    },
    esperanTurno: {
      type: 'array',
      description: 'Las dimensiones marcadas que no entran en los tres frentes, con el motivo de que esperen. Vale decir que una no aguanta espera.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dimension', 'porQue'],
        properties: {
          dimension: { type: 'string' },
          porQue: { type: 'string' },
        },
      },
    },
  },
}

const SISTEMA_PLAN = `Eres el socio director de PROFIT120, una consultoría mexicana de rentabilidad empresarial. Te entregan el mapa de riesgos de un cliente y las dimensiones que el consultor marcó en el catálogo profundo. Tu trabajo es decidir por dónde se empieza.

El problema que resuelves: siempre hay quince o veinte dimensiones marcadas y todas parecen urgentes. Un plan que las ataca todas no es un plan. Tú entregas tres frentes, en orden, y defiendes el orden.

Cómo decides:

- Ordenas por secuencia, no por dolor. La pregunta no es qué duele más, es qué destraba a qué. Un frente que libera caja va antes que uno que mejora margen, porque sin caja no hay con qué financiar el segundo. Di explícitamente qué se vuelve posible después de cada frente.
- Agrupas. Ocho dimensiones marcadas rara vez son ocho problemas: suelen ser tres causas con síntomas repartidos. Cada frente debe recoger varias dimensiones marcadas, y todas las dimensiones que cites tienen que venir del catálogo con su texto exacto.
- Distingues quién marcó qué. Lo que marcó el consultor viene de ver la operación y de hablar con el dueño; lo que sugirió el motor viene solo de los números. Cuando las dos fuentes coinciden en un frente, esa coincidencia es la señal más fuerte que tienes y conviene decirlo.
- Tres, no más. Si algo importante no cabe, va en esperanTurno con el motivo — y si algo de verdad no aguanta esperar, dilo ahí con esas palabras en lugar de meterlo a la fuerza.
- Las acciones son ejecutables. "Sacar la rentabilidad por cliente con costos indirectos asignados" sirve; "mejorar la rentabilidad comercial" no. Cada acción tiene que poder arrancar la próxima semana con la gente que ya está.
- Cuidas la distancia entre lo que el cliente pidió y por dónde hay que empezar. Si pidió vender más y el arranque es cobrar mejor, dilo sin rodeos: esa conversación es la que justifica los honorarios.
- El resumen de arriba es el plan, no el método. Dice en qué situación está la empresa y qué se va a hacer, nombrando los tres frentes en orden. La defensa del orden va dentro de cada frente, en su campo, no ahí.
- Escribes en español de México, directo, para el dueño de una empresa mediana. Sin relleno y sin suavizar.`

/**
 * Lee las dimensiones marcadas y el mapa de riesgos, y devuelve los tres
 * frentes por donde arranca el trabajo.
 */
export async function priorizarFrentes(p: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  declaracion: string
  dimensiones: { nombre: string; tema: string; origen: 'consultor' | 'motor' }[]
  propias: { tema: string; texto: string }[]
  mapa: MapaRiesgos | null
  instruccion?: string
}): Promise<PlanArranque> {
  const marcadas = p.dimensiones
    .map((d) => `- [${d.tema}] ${d.nombre} — la marcó ${d.origen === 'consultor' ? 'el consultor' : 'el motor, a partir de los números'}`)
    .join('\n')

  const riesgos = p.mapa
    ? [
      `Veredicto del análisis (urgencia ${p.mapa.urgencia}): ${p.mapa.veredicto}`,
      '',
      ...p.mapa.riesgos.map((r) => [
        `- ${r.titulo} [${r.semaforo} · ${r.frente}]`,
        `  ${r.lectura}`,
        `  Evidencia: ${r.evidencia.join(' | ')}`,
        `  Ventana: ${r.ventana}`,
      ].join('\n')),
      '',
      `Puntos ciegos declarados: ${p.mapa.puntosCiegos.join(' | ')}`,
    ].join('\n')
    : 'Todavía no se corrió el análisis a profundidad: prioriza solo con las dimensiones marcadas y dilo en la lectura.'

  const expediente = [
    `EMPRESA: ${p.cliente.razonSocial}`,
    `Sector: ${p.cliente.sector} · ${p.cliente.aniosOperacion} años de operación`,
    `${p.cliente.clientes80} clientes concentran el 80% de la venta · ${p.cliente.lineasActivas} líneas o unidades de negocio activas`,
    '',
    `LO QUE EL CLIENTE PIDIÓ, EN SUS PALABRAS: ${p.declaracion}`,
    '',
    'MAPA DE RIESGOS DEL ANÁLISIS FINANCIERO:',
    riesgos,
    '',
    'DIMENSIONES MARCADAS EN EL CATÁLOGO PROFUNDO:',
    marcadas || '- ninguna',
    p.propias.length
      ? `\nDIMENSIONES ESCRITAS A MANO POR EL CONSULTOR:\n${p.propias.map((o) => `- [${o.tema}] ${o.texto}`).join('\n')}`
      : '',
    '',
    'Entrega los tres frentes por donde se empieza.',
    p.instruccion ? `\nCondición que pone el consultor, tiene prioridad:\n${p.instruccion}` : '',
  ].filter(Boolean).join('\n')

  const crudo = await preguntar({
    sistema: SISTEMA_PLAN,
    esquema: ESQUEMA_PLAN,
    mensajes: [{ role: 'user', content: expediente }],
    // Decidir el orden es la decisión de más consecuencia del diagnóstico.
    esfuerzo: 'xhigh',
  })

  let datos: PlanArranque
  try {
    datos = JSON.parse(crudo) as PlanArranque
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    resumen: datos.resumen ?? '',
    frentes: Array.isArray(datos.frentes) ? datos.frentes.slice(0, 3) : [],
    esperanTurno: Array.isArray(datos.esperanTurno) ? datos.esperanTurno : [],
  }
}

/* ================================================================ */
/*  BATERÍA DE CONTEXTO — las preguntas que abre el plan            */
/* ================================================================ */

/** Lecturas que la radiografía ya resuelve: el motor puede pedirlas por clave. */
const AUTOMATICAS = {
  margenBruto: 'puntos de margen bruto perdidos contra el periodo anterior',
  cicloEfectivo: 'días del ciclo de conversión de efectivo',
  tesoreria: 'días que aguanta operando con la caja actual, y cuánto cayó el saldo',
  nominaVenta: 'crecimiento de nómina contra crecimiento de venta y productividad por peso de nómina',
  apalancamiento: 'veces de deuda sobre EBITDA y cuánto creció la deuda',
} as const

const ESQUEMA_BATERIA = {
  type: 'object',
  additionalProperties: false,
  required: ['preguntas'],
  properties: {
    preguntas: {
      type: 'array',
      description: 'Entre doce y dieciocho preguntas, agrupadas por frente y en el orden en que conviene hacerlas.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['frente', 'pregunta', 'tipo'],
        properties: {
          frente: { type: 'string', description: 'Nombre exacto del frente del plan al que sirve la pregunta.' },
          pregunta: { type: 'string', description: 'La pregunta tal como se le hace al cliente, en segunda persona o hablando de él.' },
          tipo: {
            type: 'string',
            enum: ['opciones', 'abierta', 'cifra'],
            description: "'opciones' cuando las respuestas posibles son pocas y conocidas; 'abierta' cuando lo valioso es cómo lo cuenta; 'cifra' cuando lo que hace falta es un número.",
          },
          opciones: {
            type: 'array',
            items: { type: 'string' },
            description: 'De dos a cinco respuestas excluyentes, solo si el tipo es opciones. Ordénalas de la mejor situación a la peor e incluye siempre la salida de "no lo mide" cuando aplique.',
          },
          derivaDe: {
            type: 'string',
            enum: Object.keys(AUTOMATICAS),
            description: 'Solo en preguntas de tipo cifra que la radiografía ya contesta. Si la pones, no se le pregunta al cliente: el dato se llena solo.',
          },
        },
      },
    },
  },
}

const SISTEMA_BATERIA = `Eres el consultor de PROFIT120 preparando la sesión de contexto profundo con el dueño de una empresa mediana mexicana. Ya tienes el análisis financiero y el plan de tres frentes. Tu trabajo es escribir la batería de preguntas de esa sesión.

Cómo la construyes:

- Cada pregunta existe para confirmar o tumbar algo concreto del plan. Si una pregunta no cambia lo que se va a hacer con la respuesta, no va.
- No preguntas lo que los números ya contestan. Cuando necesites una cifra que la radiografía resuelve, usa el campo derivaDe con su clave y no la conviertas en pregunta de entrevista: el motor la llena solo. Preguntar algo que el consultor ya tiene en pantalla le quita autoridad frente al cliente.
- Vas por el cómo y el quién, que es lo que los estados financieros nunca dicen: quién autoriza un descuento, quién decide el plazo de crédito, cada cuándo se revisa un reporte, qué pasó la última vez que un cliente grande se atrasó. Ahí está la causa de lo que las razones ya midieron.
- Eliges el tipo por lo que necesitas: opciones cuando las respuestas posibles son pocas y lo que quieres es clasificar rápido; abierta cuando lo valioso es cómo lo cuenta y qué omite; cifra cuando lo que falta es un número que el cliente sí tiene.
- Las opciones son excluyentes, van de la mejor situación a la peor, y casi siempre incluyen la salida honesta: "no se mide", "nadie lo revisa", "no lo tiene claro". Esa salida suele ser la respuesta más frecuente y la más informativa.
- Agrupas por frente, respetando el orden del plan, y dentro de cada frente vas de lo fácil de contestar a lo incómodo. Nadie abre la conversación con la pregunta que deja mal parado al dueño.
- Escribes en español de México, en el lenguaje del dueño y no del contador. Preguntas cortas: si necesita dos lecturas para entenderse, está mal hecha.`

/** Escribe la batería del paso 03 a partir del plan y del mapa de riesgos. */
export async function generarBateria(p: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  declaracion: string
  plan: PlanArranque | null
  mapa: MapaRiesgos | null
  instruccion?: string
}): Promise<BateriaContexto> {
  const frentes = p.plan
    ? p.plan.frentes.map((f, i) => [
      `${i + 1}. ${f.nombre} [${f.criticidad}]`,
      `   Por qué: ${f.porQue}`,
      `   Dimensiones que recoge: ${f.dimensiones.join(', ')}`,
      `   Desbloquea: ${f.desbloquea}`,
      `   Primeras acciones: ${f.primerasAcciones.join(' | ')}`,
    ].join('\n')).join('\n')
    : 'Todavía no hay plan: arma la batería solo con el mapa de riesgos.'

  const riesgos = p.mapa
    ? p.mapa.riesgos.map((r) => `- ${r.titulo} [${r.semaforo}]: ${r.lectura} Evidencia: ${r.evidencia.join(' | ')}`).join('\n')
    : 'Sin mapa de riesgos.'

  const ciegos = p.mapa?.puntosCiegos.length
    ? `\nPUNTOS CIEGOS DECLARADOS POR EL ANÁLISIS — la batería debería cerrarlos:\n${p.mapa.puntosCiegos.map((c) => `- ${c}`).join('\n')}`
    : ''

  const expediente = [
    `EMPRESA: ${p.cliente.razonSocial}`,
    `Sector: ${p.cliente.sector} · ${p.cliente.aniosOperacion} años de operación`,
    `${p.cliente.clientes80} clientes concentran el 80% de la venta · ${p.cliente.lineasActivas} líneas o unidades de negocio activas`,
    '',
    `LO QUE EL CLIENTE PIDIÓ, EN SUS PALABRAS: ${p.declaracion}`,
    '',
    p.plan ? `RESUMEN DEL PLAN: ${p.plan.resumen}` : '',
    '',
    'LOS TRES FRENTES, EN ORDEN:',
    frentes,
    '',
    'MAPA DE RIESGOS:',
    riesgos,
    ciegos,
    '',
    'CIFRAS QUE LA RADIOGRAFÍA YA CONTESTA — úsalas con derivaDe en lugar de preguntarlas:',
    Object.entries(AUTOMATICAS).map(([k, v]) => `- ${k}: ${v}`).join('\n'),
    '',
    'Escribe la batería de la sesión.',
    p.instruccion ? `\nCondición que pone el consultor, tiene prioridad:\n${p.instruccion}` : '',
  ].filter(Boolean).join('\n')

  const crudo = await preguntar({
    sistema: SISTEMA_BATERIA,
    esquema: ESQUEMA_BATERIA,
    mensajes: [{ role: 'user', content: expediente }],
    esfuerzo: 'high',
  })

  let datos: BateriaContexto
  try {
    datos = JSON.parse(crudo) as BateriaContexto
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return { preguntas: Array.isArray(datos.preguntas) ? datos.preguntas : [] }
}

/* ================================================================ */
/*  TEMAS ABIERTOS POR EL CLIENTE                                   */
/* ================================================================ */

interface Contexto {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  plan: PlanArranque | null
  mapa: MapaRiesgos | null
  tema: string
  /** Lo preguntado y lo contestado hasta ahora en este tema. */
  previas: { pregunta: string; respuesta: string }[]
}

function marco(c: Contexto) {
  const contestadas = c.previas.filter((p) => p.respuesta.trim())
  return [
    `EMPRESA: ${c.cliente.razonSocial} · ${c.cliente.sector} · ${c.cliente.aniosOperacion} años`,
    c.plan ? `PLAN VIGENTE: ${c.plan.resumen}` : '',
    c.plan ? `Frentes ya cubiertos aparte: ${c.plan.frentes.map((f) => f.nombre).join(' · ')}` : '',
    c.mapa ? `VEREDICTO DEL ANÁLISIS FINANCIERO: ${c.mapa.veredicto}` : '',
    '',
    `TEMA QUE ABRIÓ EL CLIENTE, CON SUS PALABRAS:\n${c.tema}`,
    '',
    c.previas.length
      ? `LO QUE YA SE PREGUNTÓ EN ESTE TEMA:\n${c.previas.map((p) => `- ${p.pregunta}\n  Respuesta: ${p.respuesta.trim() || '(sin contestar todavía)'}`).join('\n')}`
      : 'Todavía no se ha preguntado nada de este tema.',
    contestadas.length && contestadas.length < c.previas.length
      ? `\nOjo: ${c.previas.length - contestadas.length} de esas preguntas siguen sin contestar.`
      : '',
  ].filter(Boolean).join('\n')
}

/**
 * Escribe preguntas del tema. En la primera pasada abre el interrogatorio; en
 * las siguientes profundiza sobre lo ya contestado, que es donde se vuelve útil.
 */
export async function preguntasDelTema(c: Contexto): Promise<PreguntaGenerada[]> {
  const instruccion = c.previas.length
    ? [
      'Escribe entre cuatro y seis preguntas MÁS, que profundicen sobre lo ya contestado.',
      'No repitas ninguna de las anteriores ni las reformules.',
      'Persigue lo que las respuestas dejaron abierto: si algo suena a "no se mide", ve por quién debería medirlo y desde cuándo no se hace; si una respuesta contradice otra, ve por esa contradicción; si una respuesta abre un riesgo cuantificable, pide la cifra.',
    ].join(' ')
    : 'Escribe entre cuatro y seis preguntas para abrir el tema, de lo fácil de contestar a lo incómodo.'

  const crudo = await preguntar({
    sistema: SISTEMA_BATERIA,
    esquema: ESQUEMA_BATERIA,
    mensajes: [{
      role: 'user',
      content: [
        marco(c),
        '',
        instruccion,
        'Usa el mismo texto del tema en el campo frente, igual en todas.',
        '',
        'CIFRAS QUE LA RADIOGRAFÍA YA CONTESTA — úsalas con derivaDe si aplican:',
        Object.entries(AUTOMATICAS).map(([k, v]) => `- ${k}: ${v}`).join('\n'),
      ].join('\n'),
    }],
    esfuerzo: 'high',
  })

  let datos: BateriaContexto
  try {
    datos = JSON.parse(crudo) as BateriaContexto
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }
  return Array.isArray(datos.preguntas) ? datos.preguntas : []
}

const ESQUEMA_DIAG_TEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['semaforo', 'lectura', 'hallazgos', 'loQueFalta', 'primerMovimiento'],
  properties: {
    semaforo: { type: 'string', enum: ['rojo', 'amarillo', 'verde'] },
    lectura: { type: 'string', description: 'Qué está pasando con este tema, en tres o cuatro frases. La conclusión, no el resumen de las respuestas.' },
    hallazgos: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lo que quedó demostrado. Cada uno tiene que poder rastrearse a una respuesta concreta de la sesión o a una cifra de la radiografía.',
    },
    loQueFalta: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lo que las respuestas no alcanzan a resolver. Si el tema no se puede dictaminar todavía, dilo aquí sin rodeos.',
    },
    primerMovimiento: { type: 'string', description: 'El primer movimiento concreto sobre este tema. Algo que se pueda arrancar la próxima semana.' },
  },
}

const SISTEMA_DIAG_TEMA = `Eres el consultor de PROFIT120 dictaminando un tema que el cliente abrió por su cuenta, fuera de los tres frentes del plan.

Cómo lo dictaminas:

- Concluyes de lo que te contestaron, no de lo que supones. Cada hallazgo tiene que rastrearse a una respuesta de la sesión o a una cifra de la radiografía.
- Si las respuestas no alcanzan, lo dices. Un dictamen honesto de "todavía no se puede cerrar, falta esto" vale más que uno inventado, y el consultor va a repetir tus palabras frente al dueño.
- Las preguntas sin contestar cuentan como información: una que el cliente esquivó dice algo.
- Conectas con lo que ya sabes. Si el tema toca la caja, el margen o la estructura, di cómo se relaciona con el plan vigente en lugar de tratarlo como si viviera solo.
- Semáforo con criterio: rojo si puede tronar dentro de doce meses, amarillo si se está deteriorando, verde si está sano y conviene defenderlo.
- Español de México, directo, para el dueño de una empresa mediana. Sin relleno.`

/** Dictamina el tema con las respuestas que haya. */
export async function diagnosticarTema(c: Contexto): Promise<DiagnosticoTema> {
  const crudo = await preguntar({
    sistema: SISTEMA_DIAG_TEMA,
    esquema: ESQUEMA_DIAG_TEMA,
    mensajes: [{ role: 'user', content: `${marco(c)}\n\nDictamina este tema.` }],
    esfuerzo: 'xhigh',
  })

  let datos: DiagnosticoTema
  try {
    datos = JSON.parse(crudo) as DiagnosticoTema
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }
  return {
    semaforo: datos.semaforo ?? 'amarillo',
    lectura: datos.lectura ?? '',
    hallazgos: Array.isArray(datos.hallazgos) ? datos.hallazgos : [],
    loQueFalta: Array.isArray(datos.loQueFalta) ? datos.loQueFalta : [],
    primerMovimiento: datos.primerMovimiento ?? '',
  }
}

/* ================================================================ */
/*  COSTO DE LA INACCIÓN                                            */
/* ================================================================ */

const ESQUEMA_COSTO = {
  type: 'object',
  additionalProperties: false,
  required: ['frentes', 'fueraDeLaSuma', 'lectura'],
  properties: {
    frentes: {
      type: 'array',
      description: 'Exactamente tres, uno por frente del diagnóstico inicial y en el mismo orden.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['frente', 'monto', 'base', 'supuestos', 'recuperable'],
        properties: {
          frente: { type: 'string', description: 'Nombre exacto del frente, tal como viene en el diagnóstico.' },
          monto: { type: 'number', description: 'Pesos al año, número entero sin separadores. No entregues el total: se suma aparte.' },
          base: { type: 'string', description: 'La aritmética en una o dos frases, con las cifras que la sostienen. Que el dueño la pueda seguir de cabeza.' },
          supuestos: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lo que hubo que suponer para llegar al número. Cada supuesto por separado, con el valor que se usó.',
          },
          recuperable: { type: 'string', description: 'Qué parte se recupera si se atiende, y en cuánto tiempo.' },
        },
      },
    },
    fueraDeLaSuma: {
      type: 'array',
      description: 'Entre tres y cinco montos que quedaron fuera de la suma, cada uno con su cifra. Van juntos los que no son flujo anual y los que todavía no se pueden medir.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['etiqueta', 'valor', 'detalle'],
        properties: {
          etiqueta: { type: 'string', description: 'Cómo se llama el concepto, en pocas palabras.' },
          valor: { type: 'string', description: 'La cifra ya formateada: $18,400,000 · 16 días · 11.6 pp.' },
          detalle: { type: 'string', description: 'Qué es y por qué no cuenta en la suma. Dos frases máximo.' },
        },
      },
    },
    lectura: {
      type: 'string',
      description: 'La frase con la que el consultor abre la conversación, conectando lo que el cliente pidió con lo que la cifra demuestra.',
    },
  },
}

const SISTEMA_COSTO = `Eres el socio director de PROFIT120 cuantificando lo que le cuesta al cliente no hacer nada. Ya tienes la radiografía financiera, el mapa de riesgos y los tres frentes del diagnóstico inicial. Tu trabajo es ponerle pesos a cada frente.

Cómo cuantificas:

- Un costo por frente, ni uno más. La cifra tiene que amarrarse a los tres frentes del diagnóstico, con su nombre exacto, para que el cliente vea que lo que se le cobra y lo que se va a arreglar son lo mismo.
- La aritmética se sigue de cabeza. "24 días de cartera de más × $530,000 de venta diaria × 13% de costo de deuda" se puede verificar en una servilleta; "modelo de impacto financiero integral" no. Escribe siempre la primera forma.
- Declaras cada supuesto con su valor. Costo de deuda, días de referencia, porcentaje de merma: todo lo que no salga directo de la radiografía va en supuestos, con el número que usaste. Un costo con supuestos a la vista se defiende; uno sin ellos se derrumba en la primera pregunta.
- Prefieres quedarte corto. Una cifra conservadora que el cliente acepta vale más que una agresiva que lo pone a discutir el método. Si dudas entre dos supuestos, usa el que dé menos.
- No cuentas dos veces. El capital inmovilizado no es lo mismo que su costo financiero anual; la venta no capturada no es utilidad. Todo lo que sea monto parado, alarma de plazo o cifra que todavía no se puede medir va a fueraDeLaSuma, con su valor y el motivo de que no cuente. Ningún concepto aparece a la vez en un frente y ahí: si ya está contado, no se repite.
- Nunca entregues el total: se calcula sumando los tres. Tampoco calcules porcentajes sobre la facturación — eso se hace aparte con la cifra exacta.
- La lectura conecta lo que el cliente pidió con lo que la cifra demuestra. Si pidió vender más y la cifra dice que vender más amplifica la pérdida, esa es la frase con la que se abre la sesión.
- Español de México, directo, para el dueño de una empresa mediana.`

/** Le pone pesos a cada frente del diagnóstico. El total lo suma el motor. */
export async function cuantificarInaccion(p: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  declaracion: string
  plan: PlanArranque | null
  mapa: MapaRiesgos | null
  campos: CampoFinanciero[]
  ejercicios: Ejercicio[]
  razones: Razon[]
  benchmark: BenchmarkSector
  respuestas: Record<string, string>
  instruccion?: string
}): Promise<CostoInaccion> {
  if (!p.plan?.frentes.length) {
    throw new Error('Primero hay que generar el diagnóstico inicial del paso 04.')
  }

  const anuales = p.ejercicios.map((e, i) => valoresDelEjercicio(p.campos, i, e.meses))
  const cols = p.ejercicios.map((e) => (e.enCurso ? `${e.etiqueta} (anualizado)` : e.etiqueta))

  const cifras = p.razones.map((r) => {
    const v = p.ejercicios.map((_, i) => {
      const x = anuales[i]
      const n = faltantes(r, x, p.campos).length ? null : r.calcular(x)
      return `${cols[i]}: ${formatearRazon(n, r.formato)}`
    })
    const bm = p.benchmark.razones[r.clave]
    const ref = bm?.valor === null || bm?.valor === undefined ? 'sin promedio' : formatearRazon(bm.valor, r.formato)
    return `- ${r.concepto}: ${v.join(' · ')} · industria ${ref}`
  }).join('\n')

  const datos = p.campos.map((c) => {
    const v = p.ejercicios.map((_, i) => `${cols[i]}: ${formatearCampo(anuales[i][c.clave] ?? null, c.unidad) || 'sin dato'}`)
    return `- ${c.concepto}: ${v.join(' · ')}`
  }).join('\n')

  const frentes = p.plan.frentes.map((f, i) => [
    `${i + 1}. ${f.nombre} [${f.criticidad}]`,
    `   ${f.porQue}`,
    `   Si no se atiende: ${f.siNoSeAtiende}`,
  ].join('\n')).join('\n')

  const contestadas = Object.entries(p.respuestas).filter(([, v]) => v.trim())

  const expediente = [
    `EMPRESA: ${p.cliente.razonSocial} · ${p.cliente.sector}`,
    `${p.cliente.clientes80} clientes concentran el 80% de la venta · ${p.cliente.lineasActivas} líneas activas`,
    '',
    `LO QUE EL CLIENTE PIDIÓ: ${p.declaracion}`,
    '',
    'LOS TRES FRENTES A CUANTIFICAR:',
    frentes,
    '',
    'RADIOGRAFÍA — todo en base anual:',
    datos,
    '',
    'RAZONES CONTRA SU INDUSTRIA:',
    cifras,
    '',
    p.mapa ? `MAPA DE RIESGOS:\n${p.mapa.riesgos.map((r) => `- ${r.titulo}: ${r.evidencia.join(' | ')}`).join('\n')}` : '',
    '',
    contestadas.length
      ? `LO QUE EL CLIENTE CONTESTÓ EN SESIÓN:\n${contestadas.map(([q, a]) => `- ${q}\n  ${a}`).join('\n')}`
      : '',
    '',
    'Cuantifica el costo anual de no atender cada frente.',
    p.instruccion ? `\nCondición del consultor, tiene prioridad:\n${p.instruccion}` : '',
  ].filter(Boolean).join('\n')

  const crudo = await preguntar({
    sistema: SISTEMA_COSTO,
    esquema: ESQUEMA_COSTO,
    mensajes: [{ role: 'user', content: expediente }],
    // Es la cifra con la que el cliente decide: aquí la aritmética no puede fallar.
    esfuerzo: 'xhigh',
  })

  let datosIA: CostoInaccion
  try {
    datosIA = JSON.parse(crudo) as CostoInaccion
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    frentes: Array.isArray(datosIA.frentes) ? datosIA.frentes.slice(0, 3) : [],
    fueraDeLaSuma: Array.isArray(datosIA.fueraDeLaSuma) ? datosIA.fueraDeLaSuma : [],
    lectura: datosIA.lectura ?? '',
  }
}

/* ================================================================ */
/*  CAUSA RAÍZ                                                      */
/* ================================================================ */

const ESQUEMA_CAUSAS = {
  type: 'object',
  additionalProperties: false,
  required: ['cadenas', 'convergencia'],
  properties: {
    cadenas: {
      type: 'array',
      description: 'Una cadena por cada frente del diagnóstico y por cada tema que el cliente haya abierto, en ese orden.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['origen', 'sintoma', 'porques', 'causaRaiz', 'porQueAhi', 'implicacion'],
        properties: {
          origen: { type: 'string', description: 'Nombre exacto del frente o del tema del que sale la cadena.' },
          sintoma: { type: 'string', description: 'Lo que el cliente ve y nombra, en sus palabras si las tienes.' },
          porques: {
            type: 'array',
            items: { type: 'string' },
            description: 'De cuatro a seis eslabones, cada uno respondiendo al anterior. Cada eslabón empieza con "Porque" y baja un nivel: del número al proceso, del proceso a la decisión, de la decisión a quién la toma y con qué información.',
          },
          causaRaiz: { type: 'string', description: 'El mecanismo que produce todo lo anterior. Una frase, en lenguaje de dueño.' },
          porQueAhi: { type: 'string', description: 'Por qué la cadena se detiene en ese eslabón y no baja otro nivel. Una causa raíz sobre la que el cliente no puede actuar está mal cortada.' },
          implicacion: { type: 'string', description: 'Qué pasa si el plan ataca los síntomas y no esto. Con la cifra si la tienes.' },
        },
      },
    },
    convergencia: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Si dos o más cadenas terminan en el mismo mecanismo, dilo aquí: es el hallazgo más valioso del diagnóstico. Null si de verdad son independientes.',
    },
  },
}

const SISTEMA_CAUSAS = `Eres el socio director de PROFIT120 buscando la causa raíz de cada frente del diagnóstico.

Cómo bajas la cadena:

- Cada eslabón responde al anterior y baja un nivel de abstracción. La secuencia que funciona es: del número al proceso, del proceso a la decisión, de la decisión a quién la toma y con qué información, y de ahí a qué se mide y quién responde por ello. Si dos eslabones seguidos hablan de lo mismo, sobra uno.
- Paras donde el cliente puede actuar. Una causa raíz de "falta cultura de rentabilidad" o "el mercado está difícil" no se puede arreglar el lunes y por lo tanto no sirve. Bajas hasta un mecanismo concreto —quién decide, con qué dato, contra qué medida— y ahí te detienes. Explicas en porQueAhi por qué ese es el corte.
- Las causas raíz casi nunca son financieras. El número es el síntoma. Debajo suele haber una decisión que alguien toma sin la información necesaria, o un resultado del que nadie responde por su nombre.
- Usas lo que ya sabes. Las cifras de la radiografía, la evidencia del mapa de riesgos y sobre todo lo que el cliente contestó en la sesión: si dijo que nadie revisa la antigüedad de cartera o que el vendedor autoriza descuentos sin tope, ahí está el eslabón, no lo inventes.
- Buscas la convergencia. Si dos o tres cadenas terminan en el mismo mecanismo, ese es el hallazgo más valioso del diagnóstico y hay que decirlo: significa que un solo arreglo mueve varios frentes. Pero no la fuerces — si son independientes, dilo.
- Español de México, directo, para el dueño. Cada eslabón en una frase; si necesita dos, es que son dos eslabones.`

/** Baja la cadena de causalidad de cada frente y de cada tema abierto. */
export async function analizarCausaRaiz(p: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  declaracion: string
  plan: PlanArranque | null
  mapa: MapaRiesgos | null
  costo: CostoInaccion | null
  temas: { tema: string; diagnostico: { lectura: string } | null }[]
  respuestas: Record<string, string>
  instruccion?: string
}): Promise<CausasRaiz> {
  const frentes = p.plan?.frentes.map((f, i) => [
    `${i + 1}. ${f.nombre}`,
    `   ${f.porQue}`,
    `   Dimensiones: ${f.dimensiones.join(', ')}`,
    p.costo?.frentes[i] ? `   Cuesta al año: ${p.costo.frentes[i].base}` : '',
  ].filter(Boolean).join('\n')).join('\n') ?? 'Sin diagnóstico inicial todavía.'

  const abiertos = p.temas.length
    ? p.temas.map((t) => `- ${t.tema}${t.diagnostico ? `\n  Dictamen: ${t.diagnostico.lectura}` : ''}`).join('\n')
    : ''

  const contestadas = Object.entries(p.respuestas).filter(([, v]) => v.trim())

  const expediente = [
    `EMPRESA: ${p.cliente.razonSocial} · ${p.cliente.sector}`,
    `LO QUE EL CLIENTE DIJO AL INICIO: ${p.declaracion}`,
    '',
    'FRENTES DEL DIAGNÓSTICO — una cadena por cada uno:',
    frentes,
    '',
    abiertos ? `TEMAS QUE ABRIÓ EL CLIENTE — también llevan cadena:\n${abiertos}\n` : '',
    p.mapa ? `EVIDENCIA DEL ANÁLISIS FINANCIERO:\n${p.mapa.riesgos.map((r) => `- ${r.titulo}: ${r.evidencia.join(' | ')}`).join('\n')}` : '',
    '',
    contestadas.length
      ? `LO QUE EL CLIENTE CONTESTÓ EN SESIÓN — aquí están los eslabones de abajo:\n${contestadas.map(([q, a]) => `- ${q}\n  ${a}`).join('\n')}`
      : 'Todavía no hay respuestas de la sesión: baja las cadenas solo con las cifras y dilo en porQueAhi.',
    '',
    'Baja la cadena de causalidad de cada uno.',
    p.instruccion ? `\nCondición del consultor, tiene prioridad:\n${p.instruccion}` : '',
  ].filter(Boolean).join('\n')

  const crudo = await preguntar({
    sistema: SISTEMA_CAUSAS,
    esquema: ESQUEMA_CAUSAS,
    mensajes: [{ role: 'user', content: expediente }],
    esfuerzo: 'xhigh',
  })

  let datos: { cadenas: Omit<CadenaCausal, 'id'>[]; convergencia: string | null }
  try {
    datos = JSON.parse(crudo)
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    cadenas: (Array.isArray(datos.cadenas) ? datos.cadenas : []).map((c, i) => ({
      ...c,
      id: `ia-${i}-${c.origen.slice(0, 20)}`,
      porques: Array.isArray(c.porques) ? c.porques : [],
    })),
    convergencia: datos.convergencia ?? null,
  }
}

/**
 * Vuelve a bajar una cadena desde el punto que el consultor corrigió.
 *
 * El oficio del consultor gana sobre lo que propuso el motor: los eslabones de
 * arriba se quedan tal como los dejó, y de ahí para abajo se re-deriva todo para
 * que la cadena siga siendo coherente. Sin esto, corregir un eslabón dejaba una
 * causa raíz que ya no se seguía de sus premisas.
 */
export async function recalcularCadena(p: {
  cliente: { razonSocial: string; sector: string }
  plan: PlanArranque | null
  mapa: MapaRiesgos | null
  respuestas: Record<string, string>
  cadena: CadenaCausal
  /** Cuántos porqués se conservan. 0 significa rehacer desde el síntoma. */
  conservar: number
}): Promise<Pick<CadenaCausal, 'porques' | 'causaRaiz' | 'porQueAhi' | 'implicacion'>> {
  const fijos = p.cadena.porques.slice(0, p.conservar)
  const contestadas = Object.entries(p.respuestas).filter(([, v]) => v.trim())

  const esquema = {
    type: 'object',
    additionalProperties: false,
    required: ['porques', 'causaRaiz', 'porQueAhi', 'implicacion'],
    properties: {
      porques: {
        type: 'array',
        items: { type: 'string' },
        description: 'Solo los eslabones que siguen a los que ya están fijos. No repitas los fijos.',
      },
      causaRaiz: { type: 'string' },
      porQueAhi: { type: 'string' },
      implicacion: { type: 'string' },
    },
  }

  const crudo = await preguntar({
    sistema: SISTEMA_CAUSAS,
    esquema,
    mensajes: [{
      role: 'user',
      content: [
        `EMPRESA: ${p.cliente.razonSocial} · ${p.cliente.sector}`,
        p.plan ? `PLAN: ${p.plan.resumen}` : '',
        '',
        `CADENA DEL FRENTE: ${p.cadena.origen}`,
        `Síntoma: ${p.cadena.sintoma}`,
        '',
        fijos.length
          ? `ESLABONES QUE EL CONSULTOR YA FIJÓ — no los toques ni los repitas:\n${fijos.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
          : 'El consultor corrigió el síntoma: vuelve a bajar la cadena completa desde ahí.',
        '',
        p.mapa ? `EVIDENCIA DISPONIBLE:\n${p.mapa.riesgos.map((r) => `- ${r.titulo}: ${r.evidencia.join(' | ')}`).join('\n')}` : '',
        contestadas.length
          ? `\nLO QUE EL CLIENTE CONTESTÓ EN SESIÓN:\n${contestadas.map(([q, a]) => `- ${q}\n  ${a}`).join('\n')}`
          : '',
        '',
        'Continúa la cadena desde donde quedó: entrega los eslabones que faltan, la causa raíz, por qué se detiene ahí y la implicación.',
        'Lo que corrigió el consultor manda — puede saber de la operación cosas que los números no dicen. Si su corrección cambia el destino de la cadena, cámbialo sin pelearte con él.',
      ].filter(Boolean).join('\n'),
    }],
    esfuerzo: 'high',
  })

  let datos: Pick<CadenaCausal, 'porques' | 'causaRaiz' | 'porQueAhi' | 'implicacion'>
  try {
    datos = JSON.parse(crudo)
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    porques: [...fijos, ...(Array.isArray(datos.porques) ? datos.porques : [])],
    causaRaiz: datos.causaRaiz ?? '',
    porQueAhi: datos.porQueAhi ?? '',
    implicacion: datos.implicacion ?? '',
  }
}

/* ================================================================ */
/*  PLAN DE TRABAJO                                                 */
/* ================================================================ */

const ESQUEMA_PLAN_TRABAJO = {
  type: 'object',
  additionalProperties: false,
  required: ['acciones', 'lectura'],
  properties: {
    acciones: {
      type: 'array',
      description: 'Entre doce y dieciocho. Cada frente del diagnóstico debe aparecer en las cuatro ventanas o explicar su ausencia por estar terminado.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['frente', 'ventana', 'accion', 'area', 'entregable'],
        properties: {
          frente: { type: 'string', description: 'Nombre exacto del frente del diagnóstico inicial.' },
          ventana: { type: 'string', enum: ['0-30', '31-60', '61-90', '+90'] },
          accion: { type: 'string', description: 'Qué se hace, en imperativo y en una línea. Que alguien la pueda tomar el lunes sin preguntar qué significa.' },
          area: { type: 'string', description: 'Área o puesto que responde: Dirección General, Finanzas, Comercial, Producción, Materiales, Recursos Humanos, Calidad, Sistemas. Un área, nunca dos.' },
          entregable: { type: 'string', description: 'Qué queda instalado cuando termina. Un documento, un tablero, una junta con calendario, una política firmada.' },
          herramienta: {
            type: 'object',
            additionalProperties: false,
            required: ['nombre', 'modulo'],
            description: 'Solo si de verdad hay una herramienta de consultoría que la sostenga.',
            properties: {
              nombre: { type: 'string' },
              modulo: { type: 'string', enum: ['Estrategia', 'Finanzas', 'Formatos', 'Marketing', 'Operación', 'RRHH', 'Ventas'] },
            },
          },
        },
      },
    },
    lectura: {
      type: 'string',
      description: 'Qué se busca en cada ventana y por qué en ese orden. Tres o cuatro frases.',
    },
  },
}

const SISTEMA_PLAN_TRABAJO = `Eres el socio director de PROFIT120 armando el plan de trabajo. Ya tienes los tres frentes del diagnóstico, lo que cuesta cada uno y la causa raíz de cada cadena. Tu trabajo es repartir el trabajo en cuatro ventanas.

Qué va en cada ventana:

- 0 a 30 días: lo que no requiere información nueva y destraba lo demás. Nombrar responsables, congelar lo que está sangrando, sacar los datos que hoy no existen. Casi siempre son decisiones, no proyectos.
- 31 a 60 días: lo que se puede hacer ya con la información que llegó en la ventana anterior. Aquí suele estar el dinero.
- 61 a 90 días: lo que instala la medición y la política para que lo ganado no se pierda.
- Más de 90 días: lo que convierte el arreglo en operación normal y ya no depende del consultor.

Reglas:

- Cada acción pertenece a un frente del diagnóstico, con su nombre exacto. Lo que no sirva a ninguno de los tres, no va.
- Ataca la causa raíz, no el síntoma. Si la cadena dice que el margen no tiene dueño, en el plan tiene que aparecer quién va a ser el dueño del margen y desde cuándo. Un plan que solo renegocia precios recupera puntos que se vuelven a perder.
- Una acción, un área. Lo que responde toda la empresa no lo responde nadie. Si de verdad son dos áreas, son dos acciones.
- Toda acción deja un entregable verificable: un documento, un tablero, una política firmada, una junta con calendario. "Mejorar la cobranza" no es acción; "corte semanal de cobranza los martes con responsable por cliente" sí.
- Respeta la secuencia del diagnóstico. Lo que libera caja va antes que lo que mejora margen, porque sin caja no hay con qué financiar lo segundo.
- No infles. Entre doce y dieciocho acciones para 90 días es lo que una empresa mediana puede sostener con la gente que ya tiene. Un plan de treinta acciones no se ejecuta, se archiva.
- Español de México, directo, en imperativo.`

/** Reparte el trabajo de los tres frentes en las cuatro ventanas. */
export async function generarPlanTrabajo(p: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  plan: PlanArranque | null
  costo: CostoInaccion | null
  causas: CausasRaiz | null
  respuestas: Record<string, string>
  instruccion?: string
}): Promise<PlanTrabajo> {
  if (!p.plan?.frentes.length) {
    throw new Error('Primero hay que generar el diagnóstico inicial del paso 04.')
  }

  const frentes = p.plan.frentes.map((f, i) => [
    `${i + 1}. ${f.nombre} [${f.criticidad}]`,
    `   ${f.porQue}`,
    `   Primeras acciones ya identificadas: ${f.primerasAcciones.join(' | ')}`,
    p.costo?.frentes[i] ? `   Cuesta al año: ${p.costo.frentes[i].monto.toLocaleString('es-MX')} — ${p.costo.frentes[i].recuperable}` : '',
  ].filter(Boolean).join('\n')).join('\n')

  const raices = p.causas?.cadenas.length
    ? p.causas.cadenas.map((c) => `- ${c.origen}\n  Causa raíz: ${c.causaRaiz}\n  Implicación: ${c.implicacion}`).join('\n')
    : 'Sin cadenas de causalidad todavía.'

  const contestadas = Object.entries(p.respuestas).filter(([, v]) => v.trim())

  const expediente = [
    `EMPRESA: ${p.cliente.razonSocial} · ${p.cliente.sector}`,
    `${p.cliente.clientes80} clientes concentran el 80% de la venta · ${p.cliente.lineasActivas} líneas activas`,
    '',
    'FRENTES DEL DIAGNÓSTICO:',
    frentes,
    '',
    'CAUSAS RAÍZ — el plan tiene que atacarlas, no solo los síntomas:',
    raices,
    p.causas?.convergencia ? `\nCONVERGENCIA: ${p.causas.convergencia}` : '',
    '',
    contestadas.length
      ? `LO QUE EL CLIENTE CONTESTÓ EN SESIÓN — de aquí sale quién responde hoy por qué:\n${contestadas.map(([q, a]) => `- ${q}\n  ${a}`).join('\n')}`
      : '',
    '',
    'Arma el plan en las cuatro ventanas.',
    p.instruccion ? `\nCondición del consultor, tiene prioridad:\n${p.instruccion}` : '',
  ].filter(Boolean).join('\n')

  const crudo = await preguntar({
    sistema: SISTEMA_PLAN_TRABAJO,
    esquema: ESQUEMA_PLAN_TRABAJO,
    mensajes: [{ role: 'user', content: expediente }],
    esfuerzo: 'xhigh',
  })

  let datos: { acciones: Omit<AccionPlan, 'id'>[]; lectura: string }
  try {
    datos = JSON.parse(crudo)
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    acciones: (Array.isArray(datos.acciones) ? datos.acciones : []).map((a, i) => ({ ...a, id: `acc-${i}` })),
    lectura: datos.lectura ?? '',
  }
}

/* ================================================================ */
/*  DETALLE DE UNA ACCIÓN DEL PLAN                                  */
/* ================================================================ */

const ESQUEMA_DETALLE = {
  type: 'object',
  additionalProperties: false,
  required: ['porQue', 'evidencia', 'comoSeHace', 'impacto', 'escenarios', 'riesgos', 'mensajes'],
  properties: {
    porQue: { type: 'string', description: 'Por qué esta acción y no otra, amarrada a la causa raíz del frente. Dos o tres frases.' },
    evidencia: {
      type: 'array',
      items: { type: 'string' },
      description: 'De dos a cuatro cifras del expediente que la justifican, con su periodo y su comparativo.',
    },
    comoSeHace: {
      type: 'array',
      description: 'De tres a seis pasos. Es el instructivo con el que alguien la ejecuta sin volver a preguntar.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['paso', 'quien', 'cuando'],
        properties: {
          paso: { type: 'string', description: 'Qué se hace, en imperativo y concreto.' },
          quien: { type: 'string', description: 'Puesto o área que lo ejecuta.' },
          cuando: { type: 'string', description: 'Día o semana relativa al arranque: "Semana 1", "Día 3".' },
        },
      },
    },
    impacto: {
      type: 'object',
      additionalProperties: false,
      required: ['libera', 'inversion', 'ventana', 'comoSeMide'],
      properties: {
        libera: { type: 'string', description: 'Lo que devuelve, ya formateado: $4,200,000 · 6 días de cartera · 1.8 pp de margen.' },
        inversion: { type: 'string', description: 'Lo que cuesta ejecutarla. Si solo cuesta tiempo, dilo así con las horas.' },
        ventana: { type: 'string', description: 'Cuándo se ve el resultado.' },
        comoSeMide: { type: 'string', description: 'El indicador concreto que prueba que funcionó, con su valor base y su meta.' },
      },
    },
    escenarios: {
      type: 'array',
      description: 'Exactamente tres, en este orden: Conservador, Recomendado, Agresivo.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nombre', 'alcance', 'resultado', 'plazo', 'queRequiere'],
        properties: {
          nombre: { type: 'string', enum: ['Conservador', 'Recomendado', 'Agresivo'] },
          alcance: { type: 'string', description: 'Hasta dónde se lleva la acción en este escenario.' },
          resultado: { type: 'string', description: 'Lo que devuelve, ya formateado.' },
          plazo: { type: 'string' },
          queRequiere: {
            type: 'string',
            description: 'Qué tiene que ser cierto para que funcione. No pongas probabilidades: pon la condición que el consultor puede verificar.',
          },
        },
      },
    },
    riesgos: {
      type: 'array',
      description: 'De dos a tres cosas que pueden salir mal al ejecutar, con cómo se contienen.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['riesgo', 'mitigacion'],
        properties: {
          riesgo: { type: 'string' },
          mitigacion: { type: 'string' },
        },
      },
    },
    mensajes: {
      type: 'object',
      additionalProperties: false,
      required: ['correo', 'whatsapp', 'junta'],
      properties: {
        correo: {
          type: 'object',
          additionalProperties: false,
          required: ['para', 'asunto', 'cuerpo'],
          properties: {
            para: { type: 'string', description: 'Puesto del destinatario, no un correo inventado.' },
            asunto: { type: 'string' },
            cuerpo: { type: 'string', description: 'El correo completo, listo para enviar. Con saludo, el encargo, la fecha de entrega y la despedida. Del consultor al responsable, en usted.' },
          },
        },
        whatsapp: {
          type: 'string',
          description: 'El mismo encargo en tres o cuatro líneas para WhatsApp. Tono directo, sin formalismos, sin emojis decorativos. Es el mensaje que se manda el lunes a las 8.',
        },
        junta: {
          type: 'object',
          additionalProperties: false,
          required: ['titulo', 'cuando', 'asistentes', 'agenda'],
          properties: {
            titulo: { type: 'string', description: 'Título de la convocatoria, como aparecería en el calendario.' },
            cuando: { type: 'string', description: 'Día, hora y duración sugeridos.' },
            asistentes: { type: 'string', description: 'Puestos que deben estar, no nombres.' },
            agenda: { type: 'array', items: { type: 'string' }, description: 'De tres a cinco puntos, cada uno con su minutaje.' },
          },
        },
      },
    },
  },
}

const SISTEMA_DETALLE = `Eres el consultor de PROFIT120 aterrizando una acción del plan de trabajo. El dueño ya aceptó el diagnóstico; ahora alguien tiene que ejecutar esto el lunes. Tu trabajo es que no tenga que volver a preguntar nada.

Cómo lo entregas:

- Amarras la acción a su causa raíz. Si no puedes explicar qué mecanismo destraba, la acción está mal puesta y hay que decirlo.
- El instructivo es ejecutable por alguien que no estuvo en la sesión. Cada paso dice qué se hace, quién lo hace y en qué semana. Nada de "coordinar con las áreas involucradas".
- El impacto va en la unidad que le importa al dueño: pesos, días de cartera, puntos de margen. Y siempre con el indicador que va a probar que funcionó, con su valor base de hoy y su meta.
- Los tres escenarios son tres niveles de ambición, no tres pronósticos. Nunca inventes probabilidades ni porcentajes de éxito: en su lugar di qué tiene que ser cierto para que ese escenario funcione, que es lo que el consultor puede verificar antes de comprometerlo.
- Los riesgos son de ejecución, no de mercado. Qué se atora cuando esto llega a la operación real: quién se va a resistir, qué dato va a faltar, qué junta no se va a sostener. Y cómo se contiene.
- Los mensajes se mandan tal cual. El correo va del consultor al responsable, en usted, con el encargo y la fecha de entrega. El WhatsApp es el mismo encargo en tres líneas, para las ocho de la mañana del lunes, sin formalismos ni emojis decorativos. La convocatoria trae agenda con minutaje. Usa puestos, nunca inventes nombres de personas ni direcciones de correo.
- Español de México. Directo y sin relleno: lo que sobra no se lee.`

/** Aterriza una acción del plan hasta el instructivo y los mensajes. */
export async function detallarAccion(p: {
  cliente: { razonSocial: string; sector: string }
  accion: AccionPlan
  plan: PlanArranque | null
  causas: CausasRaiz | null
  costo: CostoInaccion | null
  mapa: MapaRiesgos | null
  respuestas: Record<string, string>
}): Promise<DetalleAccion> {
  const frente = p.plan?.frentes.find((f) => f.nombre === p.accion.frente)
  const cadena = p.causas?.cadenas.find((c) => c.origen === p.accion.frente)
  const costoFrente = p.costo?.frentes.find((c) => c.frente === p.accion.frente)
  const contestadas = Object.entries(p.respuestas).filter(([, v]) => v.trim())

  const expediente = [
    `EMPRESA: ${p.cliente.razonSocial} · ${p.cliente.sector}`,
    '',
    'ACCIÓN A ATERRIZAR:',
    `- Qué: ${p.accion.accion}`,
    `- Frente: ${p.accion.frente}`,
    `- Ventana: ${p.accion.ventana} días`,
    `- Área responsable: ${p.accion.area || 'sin asignar todavía'}`,
    `- Entregable comprometido: ${p.accion.entregable}`,
    '',
    frente ? `EL FRENTE AL QUE SIRVE:\n${frente.porQue}\nSi no se atiende: ${frente.siNoSeAtiende}` : '',
    '',
    cadena ? `CAUSA RAÍZ DE ESTE FRENTE:\n${cadena.causaRaiz}\nImplicación: ${cadena.implicacion}` : '',
    '',
    costoFrente ? `LO QUE CUESTA EL FRENTE AL AÑO: ${costoFrente.monto.toLocaleString('es-MX')}\nBase: ${costoFrente.base}\nRecuperable: ${costoFrente.recuperable}` : '',
    '',
    p.mapa ? `EVIDENCIA DEL ANÁLISIS FINANCIERO:\n${p.mapa.riesgos.map((r) => `- ${r.titulo}: ${r.evidencia.join(' | ')}`).join('\n')}` : '',
    '',
    contestadas.length
      ? `LO QUE EL CLIENTE CONTESTÓ EN SESIÓN:\n${contestadas.map(([q, a]) => `- ${q}\n  ${a}`).join('\n')}`
      : '',
    '',
    'Aterriza esta acción.',
  ].filter(Boolean).join('\n')

  const crudo = await preguntar({
    sistema: SISTEMA_DETALLE,
    esquema: ESQUEMA_DETALLE,
    mensajes: [{ role: 'user', content: expediente }],
    esfuerzo: 'high',
  })

  try {
    return JSON.parse(crudo) as DetalleAccion
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }
}

/* ================================================================ */
/*  ACCOUNTABILITY — el cierre                                      */
/* ================================================================ */

const ESQUEMA_ACCOUNTABILITY = {
  type: 'object',
  additionalProperties: false,
  required: ['cierre', 'kpis', 'ritmo', 'senalesTempranas', 'riesgoDeNoSostener'],
  properties: {
    cierre: {
      type: 'string',
      description: 'El párrafo con el que se cierra el diagnóstico frente al dueño: qué se encontró, qué se va a hacer y qué se lleva la empresa si lo ejecuta. Cuatro o cinco frases, con las cifras que importan.',
    },
    kpis: {
      type: 'array',
      description: 'De cinco a ocho. Cada frente del diagnóstico debe tener al menos uno. Ni uno más: un tablero de quince indicadores no se revisa.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['indicador', 'frente', 'base', 'meta', 'frecuencia', 'responsable'],
        properties: {
          indicador: { type: 'string', description: 'Qué se mide, en una línea y con su unidad.' },
          frente: { type: 'string', description: 'Nombre exacto del frente del diagnóstico al que responde.' },
          base: { type: 'string', description: 'Dónde está hoy, con la cifra real de la radiografía.' },
          meta: { type: 'string', description: 'Dónde debe estar al día 90. Alcanzable con el plan, no aspiracional.' },
          frecuencia: { type: 'string', enum: ['Semanal', 'Quincenal', 'Mensual'] },
          responsable: { type: 'string', description: 'Un puesto, nunca un área entera ni dos personas.' },
        },
      },
    },
    ritmo: {
      type: 'array',
      description: 'De dos a cuatro juntas. La medición sin ritmo se abandona en seis semanas.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['junta', 'cuando', 'asistentes', 'proposito'],
        properties: {
          junta: { type: 'string' },
          cuando: { type: 'string', description: 'Día, hora y duración. Una junta sin hora fija no existe.' },
          asistentes: { type: 'string', description: 'Puestos, no nombres.' },
          proposito: { type: 'string', description: 'Qué se decide ahí. Si solo se informa, la junta sobra.' },
        },
      },
    },
    senalesTempranas: {
      type: 'array',
      items: { type: 'string' },
      description: 'De tres a cuatro cosas observables en las primeras semanas que dicen si el plan va bien antes de que se mueva ningún número. Conductas y hechos, no indicadores.',
    },
    riesgoDeNoSostener: {
      type: 'string',
      description: 'Qué pasa si el ritmo se abandona a los dos meses, que es lo que suele pasar. Con la cifra en riesgo.',
    },
  },
}

const SISTEMA_ACCOUNTABILITY = `Eres el socio director de PROFIT120 cerrando el diagnóstico. El dueño ya vio el análisis, el costo y el plan. Ahora tienes que dejarle con qué medir si esto está funcionando y con quién responde por cada cosa.

Cómo cierras:

- El párrafo de cierre es lo que el dueño va a repetir cuando le pregunten qué le dijo el consultor. Tiene que traer lo que se encontró, lo que cuesta no hacer nada y qué se lleva si ejecuta. Con cifras, sin adjetivos.
- Pocos indicadores. De cinco a ocho, con al menos uno por frente. Un tablero de quince no se revisa: se imprime, se pega y se ignora.
- Cada indicador con base real y meta alcanzable. La base sale de la radiografía; la meta es lo que el plan puede mover en 90 días, no lo que se ve bonito en una lámina.
- Un responsable por indicador, y es un puesto, nunca un área entera ni dos personas. "Comercial y Finanzas" no responde nadie.
- La frecuencia va con la velocidad del indicador. Cartera se mueve todas las semanas; margen por cliente, cada mes. Medir semanal algo que se mueve trimestral solo genera ruido y desgasta la junta.
- El ritmo es lo que sostiene la medición. Cada junta con día, hora y duración: una junta sin hora fija no existe. Y cada una tiene que decidir algo — si solo se informa, sobra.
- Las señales tempranas son conductas, no números. Que el reporte de cartera llegue sin que nadie lo pida, que un vendedor rechace un pedido bajo el piso de margen, que alguien pregunte por su indicador antes de la junta. Eso se ve en tres semanas y predice el resultado mucho antes que la cifra.
- Español de México, directo, para el dueño.`

/** Arma el cierre con todo lo que se acumuló en el expediente. */
export async function generarAccountability(p: {
  cliente: { razonSocial: string; sector: string }
  declaracion: string
  mapa: MapaRiesgos | null
  plan: PlanArranque | null
  costo: CostoInaccion | null
  causas: CausasRaiz | null
  trabajo: PlanTrabajo | null
  instruccion?: string
}): Promise<Accountability> {
  if (!p.plan?.frentes.length) {
    throw new Error('Primero hay que generar el diagnóstico inicial del paso 04.')
  }

  const expediente = [
    `EMPRESA: ${p.cliente.razonSocial} · ${p.cliente.sector}`,
    `LO QUE PIDIÓ AL INICIO: ${p.declaracion}`,
    '',
    p.mapa ? `VEREDICTO DEL ANÁLISIS FINANCIERO (${p.mapa.urgencia}):\n${p.mapa.veredicto}` : '',
    '',
    'FRENTES DEL DIAGNÓSTICO:',
    p.plan.frentes.map((f, i) => `${i + 1}. ${f.nombre} — ${f.porQue}`).join('\n'),
    '',
    p.costo?.frentes.length
      ? `COSTO ANUAL DE NO ATENDERLOS:\n${p.costo.frentes.map((c) => `- ${c.frente}: ${c.monto.toLocaleString('es-MX')} — ${c.recuperable}`).join('\n')}`
      : '',
    '',
    p.causas?.cadenas.length
      ? `CAUSAS RAÍZ:\n${p.causas.cadenas.map((c) => `- ${c.origen}: ${c.causaRaiz}`).join('\n')}`
      : '',
    p.causas?.convergencia ? `Convergencia: ${p.causas.convergencia}` : '',
    '',
    p.trabajo?.acciones.length
      ? `PLAN DE TRABAJO — ${p.trabajo.acciones.length} acciones:\n${p.trabajo.acciones.map((a) => `- [${a.ventana}] ${a.accion} (${a.area || 'sin responsable'}) → ${a.entregable}`).join('\n')}`
      : '',
    '',
    'Arma el cierre: el párrafo, los indicadores, el ritmo y las señales tempranas.',
    p.instruccion ? `\nCondición del consultor, tiene prioridad:\n${p.instruccion}` : '',
  ].filter(Boolean).join('\n')

  const crudo = await preguntar({
    sistema: SISTEMA_ACCOUNTABILITY,
    esquema: ESQUEMA_ACCOUNTABILITY,
    mensajes: [{ role: 'user', content: expediente }],
    esfuerzo: 'xhigh',
  })

  let datos: Accountability
  try {
    datos = JSON.parse(crudo) as Accountability
  } catch {
    throw new Error('La respuesta no vino en el formato esperado.')
  }

  return {
    cierre: datos.cierre ?? '',
    kpis: Array.isArray(datos.kpis) ? datos.kpis : [],
    ritmo: Array.isArray(datos.ritmo) ? datos.ritmo : [],
    senalesTempranas: Array.isArray(datos.senalesTempranas) ? datos.senalesTempranas : [],
    riesgoDeNoSostener: datos.riesgoDeNoSostener ?? '',
  }
}
