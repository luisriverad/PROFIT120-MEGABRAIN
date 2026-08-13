import { PASOS } from '@/data/catalogo'

const ETIQUETA_AVANCE: Record<number, string> = {
  3: 'Calcular costo de la inacción',
  5: 'Construir plan de trabajo',
}

export function StepNav({ paso, onPaso }: { paso: number; onPaso: (i: number) => void }) {
  const ultimo = paso === PASOS.length - 1
  return (
    <div className="step-nav">
      {paso > 0 ? (
        <button className="btn-prev" onClick={() => onPaso(paso - 1)}>
          ← {PASOS[paso - 1].titulo}
        </button>
      ) : (
        <span />
      )}
      {ultimo ? (
        <button className="btn-next">Generar expediente del cliente</button>
      ) : (
        <button className="btn-next" onClick={() => onPaso(paso + 1)}>
          {ETIQUETA_AVANCE[paso] ?? 'Continuar'} →
        </button>
      )}
    </div>
  )
}
