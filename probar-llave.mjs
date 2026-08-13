/**
 * Comprueba la llave antes de abrir la aplicación.
 *
 * Ejercita las tres cosas de las que depende el motor: que la credencial sirva,
 * que el modelo responda con salida estructurada y que la búsqueda web esté
 * disponible —esa última la usa "Explicar promedio" para auditar los promedios
 * de industria contra fuentes vivas.
 *
 *   node probar-llave.mjs
 */
import { readFileSync } from 'fs'
import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-opus-5'

function llave() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  try {
    const env = readFileSync(new URL('.env.local', import.meta.url), 'utf8')
    // [ \t] y no \s: \s se come los saltos de línea y termina agarrando
    // el comentario de abajo cuando la línea de la llave está vacía.
    const m = env.match(/^[ \t]*VITE_ANTHROPIC_API_KEY[ \t]*=[ \t]*(.*)$/m)
    return m?.[1].trim().replace(/^["']|["']$/g, '') ?? ''
  } catch { return '' }
}

const k = llave()
if (!k) {
  console.error('\n  La línea VITE_ANTHROPIC_API_KEY de .env.local está vacía.')
  console.error('  Pega la llave ahí, guarda el archivo y vuelve a correr esto.\n')
  process.exit(1)
}
if (!k.startsWith('sk-ant-')) {
  console.error(`\n  Eso no parece una llave de Anthropic: empieza con "${k.slice(0, 12)}".`)
  console.error('  Las llaves empiezan con sk-ant-. Revisa que no se haya colado otra línea.\n')
  process.exit(1)
}
console.log(`\n  Llave encontrada: ${k.slice(0, 14)}…${k.slice(-4)}\n`)

const api = new Anthropic({ apiKey: k })
let fallas = 0
const paso = async (nombre, fn) => {
  process.stdout.write(`  ${nombre.padEnd(42, '.')} `)
  try {
    console.log(await fn())
  } catch (e) {
    fallas++
    console.log(`FALLÓ\n     ${e?.message ?? e}`)
  }
}

await paso('La credencial es válida', async () => {
  const r = await api.messages.create({
    model: MODELO, max_tokens: 16,
    messages: [{ role: 'user', content: 'Responde solo: ok' }],
  })
  return `ok · modelo ${r.model}`
})

await paso('Salida estructurada (JSON con esquema)', async () => {
  const r = await api.messages.create({
    model: MODELO, max_tokens: 400,
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object', additionalProperties: false,
          required: ['sector', 'margenTipico'],
          properties: {
            sector: { type: 'string' },
            margenTipico: { type: 'number', description: 'Porcentaje, 8.5 significa 8.5%' },
          },
        },
      },
    },
    messages: [{ role: 'user', content: 'Sector: manufactura y metalmecánica en México. Dame un margen operativo típico.' }],
  })
  const t = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  const d = JSON.parse(t)
  return `ok · devolvió ${d.margenTipico}% para ${d.sector}`
})

await paso('Búsqueda web del lado servidor', async () => {
  const r = await api.messages.create({
    model: MODELO, max_tokens: 1200,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 2 }],
    messages: [{ role: 'user', content: '¿En cuánto está la TIIE a 28 días hoy? Una línea.' }],
  })
  const busco = r.content.some((b) => b.type === 'server_tool_use' || b.type === 'web_search_tool_result')
  const t = r.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim()
  return busco ? `ok · ${t.slice(0, 90)}` : 'respondió sin buscar (revisa que la herramienta esté habilitada)'
})

await paso('Esfuerzo alto (el que usan los análisis)', async () => {
  const r = await api.messages.create({
    model: MODELO, max_tokens: 2000,
    output_config: { effort: 'high' },
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: 'Una empresa creció 18% en venta y su ROIC cayó de 9.4% a 3.5%. En una frase: ¿qué está pasando?' }],
  })
  const t = r.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim()
  return `ok · ${t.slice(0, 90)}…`
})

console.log(fallas === 0
  ? '\n  Todo listo. Abre la aplicación y pulsa cualquier botón de análisis.\n'
  : `\n  ${fallas} prueba(s) fallaron. Revisa el mensaje de arriba antes de usar la aplicación.\n`)
process.exit(fallas ? 1 : 0)
