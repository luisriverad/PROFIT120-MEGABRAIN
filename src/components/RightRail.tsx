import { REQUISITOS, REQUISITOS_POR_PASO } from '@/data/catalogo'
import { HERRAMIENTAS_POR_PASO } from '@/data/herramientas'

export function RightRail({ paso }: { paso: number }) {
  const estado = REQUISITOS_POR_PASO[paso]
  const faltantes = estado.filter((x) => !x).length
  const herramientas = HERRAMIENTAS_POR_PASO[paso] ?? []

  return (
    <aside className="rail">
      <div className="gate">
        <div className="rail-h">Cierre del diagnóstico</div>
        {REQUISITOS.map((r, i) => (
          <div key={r} className={`gate-item ${estado[i] ? 'on' : ''}`}>
            <span className={`gate-mark ${estado[i] ? 'on' : ''}`} />
            <span className="gate-txt">{r}</span>
          </div>
        ))}
        <div className="gate-note">
          {faltantes === 0
            ? 'Requisitos completos. El plan y la cuantificación están habilitados.'
            : `Faltan ${faltantes} requisito${faltantes > 1 ? 's' : ''} para habilitar la cuantificación de costo.`}
        </div>
      </div>

      <div className="rail-h">Herramientas candidatas</div>
      {herramientas.length === 0 ? (
        <div className="rail-empty">
          Aún no hay contexto suficiente. Las herramientas aparecen conforme se define el síntoma y se
          carga información.
        </div>
      ) : (
        herramientas.map((h) => (
          <div key={h.nombre} className="tool-card">
            <div className="tc-top">
              <span className="tc-name">{h.nombre}</span>
              <span className="tc-match">{h.match}%</span>
            </div>
            <div className="tc-mod">{h.modulo}</div>
            <div className="tc-why">{h.porque}</div>
          </div>
        ))
      )}
    </aside>
  )
}
