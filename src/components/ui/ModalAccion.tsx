import { useEffect, useState } from 'react'
import type { AccionPlan, DetalleAccion } from '@/types'
import { CLIENTE } from '@/data/caso'
import { detallarAccion, hayCredencial } from '@/lib/ia'
import { LlaveIA } from '@/components/ui/LlaveIA'
import { ProgresoIA } from '@/components/ui/ProgresoIA'
import { useExpediente } from '@/estado/Expediente'
import { DocumentoImpreso, useImpresion } from '@/components/ui/DocumentoImpreso'
import { exportarPPT } from '@/lib/exportar'

/**
 * Detalle de una acción del plan.
 *
 * Del renglón del tablero al instructivo con el que alguien la ejecuta el lunes:
 * por qué existe, cómo se hace paso por paso, qué libera, hasta dónde se puede
 * llevar, qué se puede atorar y los mensajes ya escritos para encargarla.
 *
 * Nada se manda solo. Los textos se copian y los manda una persona — que es lo
 * honesto mientras no haya integración, y de todos modos es lo que un consultor
 * quiere: revisar antes de mandar.
 */

const FASES = [
  'Amarrando la acción a su causa raíz',
  'Recuperando las cifras que la justifican',
  'Escribiendo el instructivo',
  'Calculando lo que libera',
  'Escribiendo los mensajes',
  'Cerrando',
]

const CANALES = [
  { clave: 'correo', texto: 'Correo' },
  { clave: 'whatsapp', texto: 'WhatsApp' },
  { clave: 'junta', texto: 'Convocatoria' },
] as const

type Canal = typeof CANALES[number]['clave']

export function ModalAccion({ accion, onCerrar }: { accion: AccionPlan; onCerrar: () => void }) {
  const { plan, causas, costo, mapa, respuestas, detalles, setDetalles } = useExpediente()
  const detalle = detalles[accion.id] ?? null

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pidiendoLlave, setPidiendoLlave] = useState(false)
  const [canal, setCanal] = useState<Canal>('correo')
  const [copiado, setCopiado] = useState('')
  const [exportando, setExportando] = useState(false)
  const { doc: paraImprimir, imprimir } = useImpresion()

  useEffect(() => {
    const salir = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', salir)
    return () => window.removeEventListener('keydown', salir)
  }, [onCerrar])

  const generar = async () => {
    if (!hayCredencial()) { setPidiendoLlave(true); return }
    setCargando(true)
    setError('')
    try {
      const d = await detallarAccion({
        cliente: CLIENTE, accion, plan, causas, costo, mapa, respuestas,
      })
      setDetalles((x) => ({ ...x, [accion.id]: d }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aterrizar la acción.')
    } finally {
      setCargando(false)
    }
  }

  /** El mismo documento que la tarjeta del tablero, con esta sola acción. */
  const documento = () => ({
    cliente: CLIENTE.razonSocial,
    sector: CLIENTE.sector,
    titulo: accion.accion,
    items: [{ accion, detalle }],
  })

  const aPPT = async () => {
    setExportando(true)
    try {
      await exportarPPT(documento())
    } finally {
      setExportando(false)
    }
  }

  const copiar = async (texto: string, aviso: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(aviso)
      setTimeout(() => setCopiado(''), 2500)
    } catch {
      setCopiado('El navegador no dejó copiar')
    }
  }

  const textoDelCanal = (d: DetalleAccion) => {
    if (canal === 'correo') return `Para: ${d.mensajes.correo.para}\nAsunto: ${d.mensajes.correo.asunto}\n\n${d.mensajes.correo.cuerpo}`
    if (canal === 'whatsapp') return d.mensajes.whatsapp
    const j = d.mensajes.junta
    return `${j.titulo}\n${j.cuando}\nAsistentes: ${j.asistentes}\n\nAgenda:\n${j.agenda.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      {cargando && <ProgresoIA fases={FASES} />}
      {paraImprimir && <DocumentoImpreso doc={paraImprimir} />}

      <div className="modal modal-acc" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-h">
          <div>
            <div className="modal-eyebrow">
              {accion.frente} · {accion.ventana === '+90' ? 'más de 90 días' : `días ${accion.ventana}`}
            </div>
            <div className="modal-t">{accion.accion}</div>
          </div>
          <button className="modal-x" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        <div className="modal-body">
          {pidiendoLlave && <LlaveIA onListo={() => { setPidiendoLlave(false); generar() }} />}
          {error && <div className="modal-error">{error}</div>}

          {!detalle && !cargando && (
            <div className="acc-vacio">
              <div className="acc-vacio-t">Esta acción todavía no está aterrizada</div>
              <p>
                El motor la convierte en instructivo: por qué existe, cómo se ejecuta paso por paso,
                qué libera, hasta dónde se puede llevar y los mensajes ya escritos para encargarla.
              </p>
              <button className="btn-solido" onClick={generar}>Aterrizar la acción</button>
            </div>
          )}

          {detalle && (
            <>
              {/* Por qué existe */}
              <div className="det-sec">
                <div className="det-h">Por qué esta acción</div>
                <p className="modal-p">{detalle.porQue}</p>
                {detalle.evidencia.length > 0 && (
                  <ul className="riesgo-ev">
                    {detalle.evidencia.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>

              {/* Lo que libera */}
              <div className="det-sec">
                <div className="det-h">Impacto</div>
                <div className="det-kpis">
                  <div className="det-kpi verde">
                    <span className="sl">Libera</span>
                    <span className="sv">{detalle.impacto.libera}</span>
                  </div>
                  <div className="det-kpi">
                    <span className="sl">Cuesta</span>
                    <span className="sv">{detalle.impacto.inversion}</span>
                  </div>
                  <div className="det-kpi">
                    <span className="sl">Se ve en</span>
                    <span className="sv">{detalle.impacto.ventana}</span>
                  </div>
                </div>
                <div className="det-mide">
                  <span className="riesgo-lbl">Cómo se mide</span>
                  {detalle.impacto.comoSeMide}
                </div>
              </div>

              {/* El instructivo */}
              <div className="det-sec">
                <div className="det-h">Cómo se hace</div>
                {detalle.comoSeHace.map((p, i) => (
                  <div key={i} className="paso">
                    <span className="paso-n">{i + 1}</span>
                    <div className="paso-c">
                      <div className="paso-t">{p.paso}</div>
                      <div className="paso-m">{p.quien} · {p.cuando}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hasta dónde llevarla */}
              {detalle.escenarios.length > 0 && (
                <div className="det-sec">
                  <div className="det-h">Hasta dónde llevarla</div>
                  {detalle.escenarios.map((e) => (
                    <div key={e.nombre} className={`esc ${e.nombre === 'Recomendado' ? 'on' : ''}`}>
                      <div className="esc-h">
                        <span className="esc-n">{e.nombre}</span>
                        <span className="esc-r">{e.resultado}</span>
                        <span className="esc-p">{e.plazo}</span>
                      </div>
                      <div className="esc-a">{e.alcance}</div>
                      <div className="esc-q">
                        <span className="riesgo-lbl">Qué tiene que ser cierto</span>
                        {e.queRequiere}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Qué se puede atorar */}
              {detalle.riesgos.length > 0 && (
                <div className="det-sec">
                  <div className="det-h">Qué se puede atorar</div>
                  {detalle.riesgos.map((r, i) => (
                    <div key={i} className="rie">
                      <div className="rie-r">{r.riesgo}</div>
                      <div className="rie-m"><span className="riesgo-lbl">Se contiene así</span>{r.mitigacion}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Los mensajes, listos para copiar */}
              <div className="det-sec">
                <div className="det-h">Mensajes listos</div>
                <div className="canales">
                  {CANALES.map((c) => (
                    <button
                      key={c.clave}
                      className={`canal ${canal === c.clave ? `on ${c.clave}` : ''}`}
                      onClick={() => setCanal(c.clave)}
                    >
                      {c.texto}
                    </button>
                  ))}
                  <button className="btn-ghost canal-copiar" onClick={() => copiar(textoDelCanal(detalle), 'Copiado')}>
                    {copiado || 'Copiar'}
                  </button>
                </div>

                {canal === 'correo' && (
                  <div className="msg correo">
                    <div className="msg-cab">
                      <span><b>Para:</b> {detalle.mensajes.correo.para}</span>
                      <span><b>Asunto:</b> {detalle.mensajes.correo.asunto}</span>
                    </div>
                    <div className="msg-cuerpo">{detalle.mensajes.correo.cuerpo}</div>
                  </div>
                )}

                {canal === 'whatsapp' && (
                  <div className="msg wa">
                    <div className="wa-burbuja">{detalle.mensajes.whatsapp}</div>
                    <div className="wa-pie">Se copia y se manda a mano — no hay envío automático.</div>
                  </div>
                )}

                {canal === 'junta' && (
                  <div className="msg correo">
                    <div className="msg-cab">
                      <span><b>{detalle.mensajes.junta.titulo}</b></span>
                      <span>{detalle.mensajes.junta.cuando} · {detalle.mensajes.junta.asistentes}</span>
                    </div>
                    <div className="msg-cuerpo">
                      {detalle.mensajes.junta.agenda.map((a, i) => (
                        <div key={i} className="agenda-p"><span className="paso-n chico">{i + 1}</span>{a}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {detalle && (
          <div className="modal-pie">
            <div className="modal-acciones">
              <span className="modal-modelo">
                Responsable: {accion.area || 'sin asignar'} · Entregable: {accion.entregable}
              </span>
              <div className="modal-btns">
                <button className="btn-ghost" onClick={() => imprimir(documento())}>Exportar a PDF</button>
                <button className="btn-ghost" onClick={aPPT} disabled={exportando}>
                  {exportando ? 'Generando…' : 'Exportar a PPT'}
                </button>
                <button className="btn-ghost" onClick={generar} disabled={cargando}>Rehacer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
