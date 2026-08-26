import { PASOS } from '@/data/catalogo'

type Vista = 'diagnostico' | 'expedientes'

/**
 * La ruta no es una lista plana de diez pasos: son etapas del método, y
 * cada etapa agrupa los pasos que la componen. Cada bloque de aquí abajo
 * es una caja en la barra lateral, rotulada con la etapa a la que sirve.
 */
const ETAPAS: { label: string; pasos: number[] }[] = [
  { label: 'Detección del problema', pasos: [0, 1, 2, 3] },
  { label: 'Cuantificación', pasos: [4] },
  { label: 'Diagnóstico', pasos: [5] },
  { label: 'Solución', pasos: [6, 7] },
]

export function Sidebar({
  pasoActual, onPaso, ficha, onFicha, vista, onVista,
}: {
  pasoActual: number
  onPaso: (i: number) => void
  ficha: boolean
  onFicha: () => void
  vista: Vista
  onVista: (v: Vista) => void
}) {
  const item = (i: number) => {
    const p = PASOS[i]
    return (
      <button
        key={p.n}
        className={`step-item ${!ficha && i === pasoActual ? 'on' : ''} ${i < pasoActual ? 'done' : ''}`}
        onClick={() => onPaso(i)}
      >
        <span className="step-num">{p.n}</span>
        <span className="step-txt">
          <span className="st">{p.titulo}</span>
        </span>
      </button>
    )
  }

  return (
    <aside className="sidebar">
      <div className="side-nav">
        <button className={vista === 'diagnostico' ? 'on' : ''} onClick={() => onVista('diagnostico')}>
          Diagnóstico
        </button>
        <button className={vista === 'expedientes' ? 'on' : ''} onClick={() => onVista('expedientes')}>
          Expedientes
        </button>
      </div>

      <div className="side-sec"><div className="side-label">Ruta de diagnóstico</div></div>
      <div className="ficha">
        <button className={`step-item ${ficha ? 'on' : ''}`} onClick={onFicha}>
          <span className="step-num">00</span>
          <span className="step-txt">
            <span className="st">Ficha del cliente</span>
          </span>
        </button>
      </div>

      <nav className="steps">
        {ETAPAS.map(etapa => (
          <div className="step-group" key={etapa.label}>
            <div className="step-group-label">{etapa.label}</div>
            {etapa.pasos.map(i => item(i))}
          </div>
        ))}
      </nav>

    </aside>
  )
}
