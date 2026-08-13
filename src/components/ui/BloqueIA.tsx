import { useEffect, useRef, useState, type ReactNode } from 'react'
import { hayCredencial } from '@/lib/ia'
import { LlaveIA } from '@/components/ui/LlaveIA'
import { ProgresoIA } from '@/components/ui/ProgresoIA'

/**
 * Envoltorio de los bloques que corren contra la IA.
 *
 * Resuelve lo que los dos comparten: el encabezado con el botón de generar, el
 * plegado del resultado, la credencial, el error y la ventana de avance. Cada
 * bloque solo pone su cuerpo.
 */

export function BloqueIA({
  titulo, fases, generar, hayResultado, deshabilitado, textoDeshabilitado,
  etiquetaGenerar = 'Generar análisis', siempreAbierto, nota, pie, children,
}: {
  titulo: string
  fases: string[]
  /** Lanza si algo falla: el bloque se encarga de mostrarlo. */
  generar: () => Promise<void>
  hayResultado: boolean
  deshabilitado?: boolean
  textoDeshabilitado?: string
  etiquetaGenerar?: string
  /**
   * Para cuando el bloque es el contenido de la pantalla y no un apéndice al
   * final de una: ahí plegarlo solo deja un botón flotando en blanco.
   */
  siempreAbierto?: boolean
  /** Línea de pie: qué modelo corrió y sobre qué. */
  nota?: ReactNode
  pie?: ReactNode
  children?: ReactNode
}) {
  // Arranca cerrado cuando cuelga de una pantalla más grande: el reporte se abre
  // cuando el consultor lo pide, no cuando la pantalla carga.
  const [plegado, setPlegado] = useState(true)
  const abierto = siempreAbierto || !plegado
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pidiendoLlave, setPidiendoLlave] = useState(false)
  /** Se dispara solo una vez tras guardar la llave, para no reintentar en bucle. */
  const trasLlave = useRef(false)

  const correr = async () => {
    if (!hayCredencial()) { setPidiendoLlave(true); setPlegado(false); return }
    setCargando(true)
    setError('')
    setPlegado(false)
    try {
      await generar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar el análisis.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (pidiendoLlave || !trasLlave.current) return
    trasLlave.current = false
    correr()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pidiendoLlave])

  return (
    <div className={`prof ${abierto ? 'on' : ''}`}>
      <div className="prof-h">
        <button
          className="prof-tog"
          onClick={() => hayResultado && !siempreAbierto && setPlegado((p) => !p)}
          aria-expanded={abierto}
          disabled={!hayResultado || siempreAbierto}
        >
          <span className="prof-btn-t">{titulo}</span>
        </button>
        {/*
          Mientras no hay reporte el botón lo genera. En cuanto existe, el botón
          solo lo abre: regenerar pasa a ser una opción del pie, no lo primero
          que se encuentra la mano.
        */}
        {hayResultado ? (
          !siempreAbierto && (
            <button className="prof-btn-x" onClick={() => setPlegado((p) => !p)} aria-expanded={abierto}>
              {abierto ? 'Cerrar' : 'Abrir'}
            </button>
          )
        ) : (
          <button className="prof-btn-x" onClick={correr} disabled={cargando || deshabilitado}>
            {deshabilitado && textoDeshabilitado ? textoDeshabilitado : etiquetaGenerar}
          </button>
        )}
      </div>

      {cargando && <ProgresoIA fases={fases} />}

      {abierto && pidiendoLlave && (
        <div className="prof-body">
          <LlaveIA onListo={() => { trasLlave.current = true; setPidiendoLlave(false) }} />
        </div>
      )}

      {abierto && error && <div className="prof-body"><div className="modal-error">{error}</div></div>}

      {abierto && hayResultado && <div className="prof-body">{children}</div>}

      {abierto && hayResultado && !cargando && (
        <div className="prof-pie">
          {pie}
          <div className="modal-acciones">
            {nota && <span className="modal-modelo">{nota}</span>}
            <div className="modal-btns">
              <button className="btn-ghost" onClick={correr} disabled={deshabilitado}>
                Regenerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
