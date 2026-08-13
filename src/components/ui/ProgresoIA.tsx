import { useEffect, useState } from 'react'

/**
 * Avance de la ventana de espera.
 *
 * La llamada no reporta progreso real —llega completa o no llega—, así que la
 * barra avanza sola y se frena en 95%: nunca dice "terminé" antes de tiempo.
 * Las fases sí son reales: describen lo que el modelo está haciendo en orden.
 */
export function ProgresoIA({ fases }: { fases: string[] }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      // Se acerca al tope cada vez más lento, como cualquier espera larga.
      setPct((p) => Math.min(95, p + Math.max(0.35, (95 - p) * 0.03)))
    }, 200)
    return () => clearInterval(t)
  }, [])

  const fase = fases[Math.min(fases.length - 1, Math.floor((pct / 96) * fases.length))]

  return (
    <div className="modal-fondo">
      <div className="espera-box" role="status" aria-live="polite">
        <div className="espera-t">Espera. Se está realizando un diagnóstico a profundidad</div>
        <div className="espera-barra"><span style={{ width: `${pct}%` }} /></div>
        <div className="espera-pie">
          <span className="espera-fase">{fase}</span>
          <span className="espera-pct">{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  )
}
