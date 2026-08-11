import type Anthropic from '@anthropic-ai/sdk'
import type { ExplicacionPromedio, Razon, TurnoIA } from '@/types'
import type { BenchmarkSector } from '@/types'

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

async function conversar(mensajes: Mensaje[]): Promise<string> {
  const api = await cliente()
  const historia = [...mensajes]

  // El buscador corre del lado de Anthropic y puede agotar sus iteraciones
  // internas; cuando eso pasa devuelve pause_turn y se reanuda reenviando.
  for (let intento = 0; intento < 6; intento++) {
    const stream = api.messages.stream({
      model: MODELO_IA,
      max_tokens: 32000,
      system: SISTEMA,
      tools: [BUSQUEDA],
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: ESQUEMA as unknown as Record<string, unknown> },
      },
      messages: historia,
    })
    const respuesta = await stream.finalMessage()

    if (respuesta.stop_reason === 'refusal') {
      throw new Error('El modelo declinó la petición. Reformula la instrucción del recálculo.')
    }
    if (respuesta.stop_reason === 'max_tokens') {
      throw new Error('La respuesta se cortó por longitud. Pide el recálculo de menos razones a la vez.')
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
async function porProxy(mensajes: Mensaje[]): Promise<string> {
  const r = await fetch(PROXY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELO_IA, system: SISTEMA, messages: mensajes, schema: ESQUEMA }),
  })
  if (!r.ok) throw new Error(`El proxy respondió ${r.status}: ${await r.text()}`)
  const datos = await r.json()
  return typeof datos === 'string' ? datos : datos.texto ?? JSON.stringify(datos)
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

  const crudo = PROXY ? await porProxy(mensajes) : await conversar(mensajes)

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
