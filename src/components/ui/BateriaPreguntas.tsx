import type { PreguntaGenerada } from '@/types'
import { LECTURAS_AUTOMATICAS } from '@/data/finanzas'
import { PreguntaConNumero, PreguntaConOpciones, PreguntaConTexto } from '@/components/ui/Primitivos'
import { useExpediente } from '@/estado/Expediente'

/**
 * Lista de preguntas generadas, con el control que le toca a cada tipo.
 * Las cifras que la radiografía ya contesta se llenan solas; escribir encima
 * gana, porque el consultor puede tener mejor dato que los estados financieros.
 */
export function BateriaPreguntas({
  preguntas, respuestas, onRespuesta,
}: {
  preguntas: PreguntaGenerada[]
  respuestas: Record<string, string>
  onRespuesta: (pregunta: string, valor: string) => void
}) {
  const { campos, ejercicios } = useExpediente()

  const lectura = (clave?: string) =>
    (clave ? LECTURAS_AUTOMATICAS[clave]?.(campos, ejercicios) : null) ?? null

  return (
    <div className="qlist">
      {preguntas.map((p) => {
        const contestada = respuestas[p.pregunta]

        if (p.tipo === 'opciones' && p.opciones?.length) {
          return (
            <PreguntaConOpciones
              key={p.pregunta}
              etiqueta=""
              pregunta={p.pregunta}
              opciones={p.opciones}
              seleccion={p.opciones.indexOf(contestada ?? '')}
              onSelect={(i) => onRespuesta(p.pregunta, p.opciones![i])}
            />
          )
        }

        if (p.tipo === 'cifra') {
          const auto = lectura(p.derivaDe)
          return (
            <PreguntaConNumero
              key={p.pregunta}
              etiqueta=""
              pregunta={p.pregunta}
              valor={contestada ?? auto ?? ''}
              marca={auto && contestada === undefined ? 'De la radiografía' : undefined}
              placeholder={p.derivaDe && !auto ? 'Falta un dato en la radiografía del paso 01' : undefined}
              onChange={(v) => onRespuesta(p.pregunta, v)}
            />
          )
        }

        return (
          <PreguntaConTexto
            key={p.pregunta}
            etiqueta=""
            pregunta={p.pregunta}
            valor={contestada ?? ''}
            placeholder="En palabras del cliente."
            onChange={(v) => onRespuesta(p.pregunta, v)}
          />
        )
      })}
    </div>
  )
}
