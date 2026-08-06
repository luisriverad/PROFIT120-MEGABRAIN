import { MODULOS, PASOS } from '@/data/catalogo'

type Vista = 'diagnostico' | 'biblioteca' | 'expedientes'

export function Sidebar({
  pasoActual, onPaso, vista, onVista,
}: {
  pasoActual: number
  onPaso: (i: number) => void
  vista: Vista
  onVista: (v: Vista) => void
}) {
  return (
    <aside className="sidebar">
      <div className="side-nav">
        <button className={vista === 'diagnostico' ? 'on' : ''} onClick={() => onVista('diagnostico')}>
          Diagnóstico
        </button>
        <button className={vista === 'biblioteca' ? 'on' : ''} onClick={() => onVista('biblioteca')}>
          Biblioteca
        </button>
        <button className={vista === 'expedientes' ? 'on' : ''} onClick={() => onVista('expedientes')}>
          Expedientes
        </button>
      </div>

      <div className="side-sec"><div className="side-label">Ruta de diagnóstico</div></div>
      <nav className="steps">
        {PASOS.map((p, i) => (
          <button
            key={p.n}
            className={`step-item ${i === pasoActual ? 'on' : ''} ${i < pasoActual ? 'done' : ''}`}
            onClick={() => onPaso(i)}
          >
            <span className="step-num">{p.n}</span>
            <span className="step-txt">
              <span className="st">{p.titulo}</span>
              <span className="sq">{p.pregunta}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="side-divider" />
      <div className="side-sec"><div className="side-label">Biblioteca indexada</div></div>
      <div className="mod-list">
        {MODULOS.map((m) => (
          <button key={m.nombre} className="mod-item">
            <span>{m.nombre}</span>
            <span className="ct">{m.archivos}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
