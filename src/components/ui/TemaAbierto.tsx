import { useState } from 'react'
import type { FichaCliente, MapaRiesgos, PlanArranque, PreguntaGenerada, TemaAbierto as Tema } from '@/types'
import { diagnosticarTema, hayCredencial, preguntasDelTema } from '@/lib/ia'
import { LlaveIA } from '@/components/ui/LlaveIA'
import { ProgresoIA } from '@/components/ui/ProgresoIA'
import { BateriaPreguntas } from '@/components/ui/BateriaPreguntas'

/**
 * Tema abierto por el cliente.
 *
 * Funciona como un diagnóstico chico e independiente: el motor abre con unas
 * preguntas, el consultor las contesta en sesión, pide más cuando la
 * conversación lo pide, y cierra con el dictamen del tema.
 */

const FASES_PREGUNTAS = [
  'Leyendo lo que ya se contestó',
  'Buscando lo que quedó abierto',
  'Escribiendo las preguntas que faltan',
  'Cerrando',
]

const FASES_DIAG = [
  'Releyendo las respuestas de la sesión',
  'Cruzándolas con el análisis financiero',
  'Separando lo demostrado de lo que falta',
  'Redactando el dictamen',
  'Cerrando',
]

const TEXTO_SEMAFORO = { rojo: 'Crítico', amarillo: 'Vigilar', verde: 'Sano' } as const

export function TemaAbiertoBloque({
  tema, numero, cliente, plan, mapa, respuestas, onRespuesta, onPreguntas, onDiagnostico, onQuitar,
}: {
  tema: Tema
  numero: number
  cliente: FichaCliente
  plan: PlanArranque | null
  mapa: MapaRiesgos | null
  respuestas: Record<string, string>
  onRespuesta: (pregunta: string, valor: string) => void
  onPreguntas: (nuevas: PreguntaGenerada[]) => void
  onDiagnostico: (d: Tema['diagnostico']) => void
  onQuitar: () => void
}) {
  const [trabajo, setTrabajo] = useState<'' | 'preguntas' | 'diagnostico'>('')
  const [error, setError] = useState('')
  const [pidiendoLlave, setPidiendoLlave] = useState(false)

  const previas = tema.preguntas.map((p) => ({
    pregunta: p.pregunta,
    respuesta: respuestas[p.pregunta] ?? '',
  }))
  const contestadas = previas.filter((p) => p.respuesta.trim()).length

  const contexto = { cliente, plan, mapa, tema: tema.tema, previas }

  const correr = async (que: 'preguntas' | 'diagnostico') => {
    if (!hayCredencial()) { setPidiendoLlave(true); return }
    setTrabajo(que)
    setError('')
    try {
      if (que === 'preguntas') onPreguntas(await preguntasDelTema(contexto))
      else onDiagnostico(await diagnosticarTema(contexto))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar.')
    } finally {
      setTrabajo('')
    }
  }

  const d = tema.diagnostico

  return (
    <div className="tema-ab">
      {trabajo === 'preguntas' && <ProgresoIA fases={FASES_PREGUNTAS} />}
      {trabajo === 'diagnostico' && <ProgresoIA fases={FASES_DIAG} />}

      <div className="bloque-t extra">
        <span className="bloque-n">{String(numero).padStart(2, '0')}</span>
        <span className="bloque-nm">{tema.tema}</span>
        <span className="bloque-c">
          {contestadas} de {tema.preguntas.length} contestadas
        </span>
        <button className="bloque-x" onClick={onQuitar} aria-label="Quitar tema">×</button>
      </div>

      {pidiendoLlave && <LlaveIA onListo={() => setPidiendoLlave(false)} />}
      {error && <div className="modal-error">{error}</div>}

      <BateriaPreguntas
        preguntas={tema.preguntas}
        respuestas={respuestas}
        onRespuesta={onRespuesta}
      />

      <div className="tema-ab-btns">
        <button className="btn-ghost" onClick={() => correr('preguntas')} disabled={Boolean(trabajo)}>
          Más preguntas
        </button>
        <button className="btn-solido" onClick={() => correr('diagnostico')} disabled={Boolean(trabajo)}>
          {d ? 'Rehacer diagnóstico' : 'Generar diagnóstico'}
        </button>
      </div>

      {d && (
        <div className={`dtema s-${d.semaforo}`}>
          <div className="dtema-h">
            <span className={`sem sem-${d.semaforo}`} />
            <span className="dtema-t">Diagnóstico del tema</span>
            <span className={`riesgo-sev s-${d.semaforo}`}>{TEXTO_SEMAFORO[d.semaforo]}</span>
          </div>
          <p className="dtema-l">{d.lectura}</p>

          {d.hallazgos.length > 0 && (
            <div className="dtema-sec">
              <span className="riesgo-lbl">Lo que quedó demostrado</span>
              <ul className="riesgo-ev">
                {d.hallazgos.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          {d.loQueFalta.length > 0 && (
            <div className="dtema-sec">
              <span className="riesgo-lbl">Lo que sigue abierto</span>
              <ul className="ia-avisos">
                {d.loQueFalta.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          <div className="dtema-sec">
            <span className="riesgo-lbl">Primer movimiento</span>
            {d.primerMovimiento}
          </div>
        </div>
      )}
    </div>
  )
}
