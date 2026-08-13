import { useState } from 'react'
import type { Herramienta } from '@/types'
import { REQUISITOS, REQUISITOS_POR_PASO } from '@/data/catalogo'
import { HERRAMIENTAS_POR_PASO } from '@/data/herramientas'

/**
 * Panel derecho: los requisitos de cierre y las herramientas que el motor
 * propone para el paso en curso.
 *
 * Cada herramienta es un botón: abre la plantilla en la biblioteca. Mientras el
 * indexador no devuelva la ruta, el clic responde diciendo que el vínculo aún no
 * existe, que es mejor que un botón que se hunde y no pasa nada.
 */
function Tarjeta({ h }: { h: Herramienta }) {
  const [aviso, setAviso] = useState(false)

  const abrir = () => {
    if (h.url) {
      window.open(h.url, '_blank', 'noopener')
      return
    }
    setAviso(true)
    setTimeout(() => setAviso(false), 2600)
  }

  return (
    <button className={`tool-card ${aviso ? 'avisando' : ''}`} onClick={abrir}>
      <span className="tc-top">
        <span className="tc-name">{h.nombre}</span>
        <span className="tc-match">{h.match}%</span>
      </span>
      <span className="tc-mod">{h.modulo}</span>
      <span className="tc-why">{h.porque}</span>
      <span className="tc-abrir">
        {aviso ? 'La biblioteca todavía no está conectada' : 'Abrir plantilla →'}
      </span>
    </button>
  )
}

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
        herramientas.map((h) => <Tarjeta key={h.nombre} h={h} />)
      )}
    </aside>
  )
}
