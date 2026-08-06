import { PLAN } from '@/data/caso'
import { EncabezadoPaso } from '@/components/ui/Primitivos'

export function Paso09Plan() {
  return (
    <>
      <EncabezadoPaso
        paso="Paso 09 · Plan de trabajo"
        titulo="El plan de trabajo es"
        entrada="Tres fases en 90 días. El orden no es negociable: sin medición no hay decisión, y sin decisión no hay recuperación sostenida."
      />

      {PLAN.map((fase) => (
        <div className="phase" key={fase.nombre}>
          <div className="phase-head">
            <div className="phase-name">{fase.nombre}</div>
            <div className="phase-when">{fase.ventana}</div>
          </div>
          <div className="phase-body">
            {fase.acciones.map((a) => (
              <div className="action" key={a}>
                <span className="bul">—</span>
                <span>{a}</span>
              </div>
            ))}
            <div className="tool-refs">
              <div className="trl">Herramientas de la biblioteca</div>
              {fase.herramientas.map((h) => (
                <div className="tool-ref" key={h.nombre}>
                  <span className="tn">{h.nombre}</span>
                  <span className="tm">{h.modulo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
