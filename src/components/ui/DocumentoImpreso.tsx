import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DocumentoExport } from '@/lib/exportar'
import { textoVentana } from '@/lib/exportar'

/**
 * Documento para imprimir.
 *
 * Vive oculto en la página y solo existe para el navegador cuando se manda a
 * imprimir. Se apoya en el motor de impresión en lugar de rasterizar la pantalla:
 * el texto queda vectorial, los saltos de página caen donde deben y el archivo
 * pesa lo que debe pesar. Guardar como PDF desde ese diálogo da un entregable de
 * calidad de consultoría, no una captura de pantalla en tamaño carta.
 *
 * Va por portal al body a propósito: la hoja de impresión esconde la aplicación
 * entera y el modal, así que un documento montado dentro de cualquiera de los dos
 * heredaría el display:none y saldría en blanco.
 */
export function DocumentoImpreso({ doc }: { doc: DocumentoExport }) {
  return createPortal(
    <div className="imprimible" aria-hidden="true">
      <div className="imp-portada">
        <div className="imp-marca">PROFIT120 · Motor de Diagnóstico Empresarial</div>
        <h1 className="imp-titulo">{doc.titulo}</h1>
        <div className="imp-cliente">{doc.cliente} · {doc.sector}</div>
        {doc.lectura && <p className="imp-lectura">{doc.lectura}</p>}
      </div>

      {doc.items.map(({ accion, detalle }) => (
        <section key={accion.id} className="imp-accion">
          <div className="imp-eyebrow">{accion.frente} · {textoVentana(accion.ventana)}</div>
          <h2 className="imp-h2">{accion.accion}</h2>

          <table className="imp-ficha">
            <tbody>
              <tr><th>Responsable</th><td>{accion.area || 'Sin asignar'}</td></tr>
              <tr><th>Entregable</th><td>{accion.entregable}</td></tr>
              {accion.herramienta && (
                <tr><th>Herramienta</th><td>{accion.herramienta.nombre} · {accion.herramienta.modulo}</td></tr>
              )}
            </tbody>
          </table>

          {!detalle && (
            <p className="imp-p imp-pendiente">
              Esta acción todavía no está aterrizada. Se exporta con su ficha; el instructivo aparece
              en cuanto se genere el detalle.
            </p>
          )}

          {detalle && (
            <>
              <h3 className="imp-h3">Por qué esta acción</h3>
              <p className="imp-p">{detalle.porQue}</p>
              {detalle.evidencia.length > 0 && (
                <ul className="imp-ul">
                  {detalle.evidencia.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}

              <h3 className="imp-h3">Impacto</h3>
              <table className="imp-kpis">
                <tbody>
                  <tr>
                    <th>Libera</th><th>Cuesta</th><th>Se ve en</th>
                  </tr>
                  <tr>
                    <td>{detalle.impacto.libera}</td>
                    <td>{detalle.impacto.inversion}</td>
                    <td>{detalle.impacto.ventana}</td>
                  </tr>
                </tbody>
              </table>
              <p className="imp-p"><b>Cómo se mide.</b> {detalle.impacto.comoSeMide}</p>

              <h3 className="imp-h3">Cómo se hace</h3>
              <ol className="imp-ol">
                {detalle.comoSeHace.map((s, i) => (
                  <li key={i}>
                    {s.paso}
                    <span className="imp-meta">{s.quien} · {s.cuando}</span>
                  </li>
                ))}
              </ol>

              {detalle.escenarios.length > 0 && (
                <>
                  <h3 className="imp-h3">Hasta dónde llevarla</h3>
                  <table className="imp-tabla">
                    <thead>
                      <tr><th>Escenario</th><th>Alcance</th><th>Resultado</th><th>Plazo</th><th>Qué tiene que ser cierto</th></tr>
                    </thead>
                    <tbody>
                      {detalle.escenarios.map((e) => (
                        <tr key={e.nombre} className={e.nombre === 'Recomendado' ? 'destacado' : ''}>
                          <td>{e.nombre}</td>
                          <td>{e.alcance}</td>
                          <td>{e.resultado}</td>
                          <td>{e.plazo}</td>
                          <td>{e.queRequiere}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {detalle.riesgos.length > 0 && (
                <>
                  <h3 className="imp-h3">Qué se puede atorar</h3>
                  {detalle.riesgos.map((r, i) => (
                    <p key={i} className="imp-p">
                      <b>{r.riesgo}</b><br />
                      {r.mitigacion}
                    </p>
                  ))}
                </>
              )}
            </>
          )}
        </section>
      ))}

      <div className="imp-pie">
        PROFIT120 · {doc.cliente} · Documento de trabajo. Los mensajes de encargo no forman parte de
        este entregable.
      </div>
    </div>,
    document.body,
  )
}

/**
 * Prepara el documento, espera a que el navegador lo pinte y manda a imprimir.
 * El doble frame es lo que evita que el diálogo salga con la hoja a medio armar.
 */
export function useImpresion() {
  const [doc, setDoc] = useState<DocumentoExport | null>(null)

  useEffect(() => {
    if (!doc) return
    const t = requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print()
      setDoc(null)
    }))
    return () => cancelAnimationFrame(t)
  }, [doc])

  return { doc, imprimir: setDoc }
}
