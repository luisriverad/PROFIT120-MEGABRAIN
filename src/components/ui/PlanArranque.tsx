import { useState } from 'react'
import type { FichaCliente, MapaRiesgos, PlanArranque as Plan, Semaforo } from '@/types'
import { priorizarFrentes } from '@/lib/ia'
import { BloqueIA } from '@/components/ui/BloqueIA'

/**
 * Plan de arranque.
 *
 * Marcar quince dimensiones no es un plan: es una lista. Esto lee las
 * selecciones junto con el mapa de riesgos del paso 01 y las reduce a tres
 * frentes en orden, defendiendo el orden. De aquí sale hacia dónde apuntan los
 * pasos siguientes.
 */

const TEXTO_CRITICIDAD: Record<Semaforo, string> = {
  rojo: 'Crítico',
  amarillo: 'Importante',
  verde: 'Sostener',
}

const FASES = [
  'Leyendo las dimensiones marcadas',
  'Cruzándolas contra el mapa de riesgos',
  'Agrupando síntomas en causas',
  'Ordenando por lo que destraba a lo demás',
  'Redactando los tres frentes',
  'Cerrando',
]

const CONDICIONES = [
  'El dueño solo tiene presupuesto para un frente: dime cuál.',
  'Prioriza lo que se pueda mover sin inversión de capital.',
  'Ordénalos por velocidad de resultado en lugar de por criticidad.',
]

export function PlanArranque({
  cliente, declaracion, dimensiones, propias, mapa, plan, onPlan,
}: {
  cliente: FichaCliente
  declaracion: string
  dimensiones: { nombre: string; tema: string; origen: 'consultor' | 'motor' }[]
  propias: { tema: string; texto: string }[]
  mapa: MapaRiesgos | null
  plan: Plan | null
  onPlan: (p: Plan) => void
}) {
  const [instruccion, setInstruccion] = useState('')

  const priorizar = async () => {
    onPlan(await priorizarFrentes({
      cliente, declaracion, dimensiones, propias, mapa, instruccion: instruccion.trim(),
    }))
  }

  return (
    <BloqueIA
      titulo="Diagnóstico inicial"
      fases={FASES}
      siempreAbierto
      generar={priorizar}
      hayResultado={Boolean(plan)}
      deshabilitado={!dimensiones.length}
      textoDeshabilitado="Sin dimensiones marcadas"
      pie={(
        <>
          <div className="modal-atajos">
            {CONDICIONES.map((c) => (
              <button key={c} className="atajo" onClick={() => setInstruccion(c)}>
                {c.length > 46 ? `${c.slice(0, 46)}…` : c}
              </button>
            ))}
          </div>
          <textarea
            className="modal-input"
            value={instruccion}
            placeholder="Pon una condición y vuelve a generar: “el dueño no va a tocar la plantilla este año”…"
            onChange={(e) => setInstruccion(e.target.value)}
          />
        </>
      )}
    >
      {plan && (
        <>
          <div className="plan-lectura">{plan.resumen}</div>

          {plan.frentes.map((f, i) => (
            <div key={f.nombre} className={`frente s-${f.criticidad}`}>
              <div className="frente-h">
                <span className="frente-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="frente-t">{f.nombre}</span>
                <span className={`riesgo-sev s-${f.criticidad}`}>{TEXTO_CRITICIDAD[f.criticidad]}</span>
              </div>

              <p className="frente-por">{f.porQue}</p>

              {f.dimensiones.length > 0 && (
                <div className="frente-dims">
                  {f.dimensiones.map((d) => <span key={d} className="frente-dim">{d}</span>)}
                </div>
              )}

              <div className="frente-cols">
                <div>
                  <span className="riesgo-lbl">Desbloquea</span>
                  {f.desbloquea}
                </div>
                <div>
                  <span className="riesgo-lbl">Si no se atiende</span>
                  {f.siNoSeAtiende}
                </div>
              </div>

              {f.primerasAcciones.length > 0 && (
                <div className="frente-acc">
                  <span className="riesgo-lbl">Primeras acciones</span>
                  {f.primerasAcciones.map((a, k) => (
                    <div key={k} className="action"><span className="bul">›</span>{a}</div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {plan.esperanTurno.length > 0 && (
            <>
              <div className="rad-sub">Lo que espera turno</div>
              <div className="espera">
                {plan.esperanTurno.map((e) => (
                  <div key={e.dimension} className="espera-fila">
                    <span className="espera-d">{e.dimension}</span>
                    <span className="espera-p">{e.porQue}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </BloqueIA>
  )
}
