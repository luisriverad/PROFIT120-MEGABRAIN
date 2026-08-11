import { useEffect, useRef, useState } from 'react'
import type {
  BenchmarkRazon, BenchmarkSector, ExplicacionPromedio, Razon, RazonExplicada, TurnoIA,
} from '@/types'
import { formatearRazon } from '@/data/finanzas'
import {
  MODELO_IA, PROXY, aBenchmark, explicarPromedio, guardarApiKey, hayCredencial, leerApiKey,
} from '@/lib/ia'

/**
 * Ventana de "Explicar promedio".
 *
 * Sirve dos momentos distintos con la misma superficie: primero muestra de qué
 * está hecho el promedio precargado, y luego deja pedirle al motor que lo
 * recalcule — porque el número no cuadra, porque la fuente quedó vieja, o
 * porque el cliente no es "el sector" sino un corte más fino dentro de él.
 */

function unidadDespliegue(valor: number | null, formato: Razon['formato']) {
  if (valor === null) return '—'
  return formatearRazon(formato === 'pct' ? valor : valor, formato)
}

const ATAJOS = [
  'Recalcula todas las razones y cita la fuente exacta de cada una.',
  'El ROIC no me cuadra con lo que veo en campo: verifícalo contra estados financieros de emisoras nacionales.',
  'Acota el promedio a empresas de 50 a 250 empleados, no al sector completo.',
  'Dame el corte regional del Bajío en lugar del nacional.',
]

export function ModalPromedio({
  titulo, sector, razones, base, onCerrar, onAplicar,
}: {
  titulo: string
  sector: string
  razones: Razon[]
  base: BenchmarkSector
  onCerrar: () => void
  onAplicar: (ajustes: Record<string, BenchmarkRazon>) => void
}) {
  const [explicacion, setExplicacion] = useState<ExplicacionPromedio | null>(null)
  const [historial, setHistorial] = useState<TurnoIA[]>([])
  const [instruccion, setInstruccion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [llave, setLlave] = useState(leerApiKey())
  const [pidiendoLlave, setPidiendoLlave] = useState(!hayCredencial())
  const cuerpo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const salir = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', salir)
    return () => window.removeEventListener('keydown', salir)
  }, [onCerrar])

  const consultar = async (texto: string) => {
    setCargando(true)
    setError('')
    try {
      const r = await explicarPromedio({ sector, razones, base, instruccion: texto, historial })
      setExplicacion(r)
      setHistorial((h) => [
        ...h,
        ...(texto ? [{ rol: 'consultor' as const, texto }] : []),
        { rol: 'motor' as const, texto: `${r.resumen}\n${r.metodologia}` },
      ])
      setInstruccion('')
      cuerpo.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar el motor.')
    } finally {
      setCargando(false)
    }
  }

  const aplicar = (lecturas: RazonExplicada[]) => {
    const ajustes: Record<string, BenchmarkRazon> = {}
    for (const l of lecturas) {
      const razon = razones.find((r) => r.clave === l.clave)
      if (razon) ajustes[l.clave] = aBenchmark(razon, l)
    }
    onAplicar(ajustes)
    onCerrar()
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-h">
          <div>
            <div className="modal-eyebrow">Promedio de industria · {sector}</div>
            <div className="modal-t">{titulo}</div>
          </div>
          <button className="modal-x" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        <div className="modal-body" ref={cuerpo}>
          {pidiendoLlave && (
            <div className="modal-llave">
              <label>Clave de API de Anthropic</label>
              <p>
                Se guarda solo en este navegador y viaja directo a la API. Para un despliegue
                compartido, define <code>VITE_IA_PROXY_URL</code> y la clave se queda en tu servidor.
              </p>
              <div className="modal-llave-row">
                <input
                  type="password"
                  value={llave}
                  placeholder="sk-ant-..."
                  onChange={(e) => setLlave(e.target.value)}
                />
                <button
                  className="btn-solido"
                  disabled={!llave.trim()}
                  onClick={() => { guardarApiKey(llave.trim()); setPidiendoLlave(false) }}
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Lo que el motor está usando hoy */}
          <div className="modal-sec">
            <div className="modal-sec-t">Base precargada del motor</div>
            <div className="modal-sec-s">{base.fuente} · {base.vigencia}</div>
            <div className="bm-lista">
              {razones.map((r) => {
                const b = base.razones[r.clave]
                return (
                  <div key={r.clave} className="bm-fila">
                    <div className="bm-fila-n">{r.concepto}</div>
                    <div className="bm-fila-v">{unidadDespliegue(b?.valor ?? null, r.formato)}</div>
                    <div className="bm-fila-r">
                      {b?.valor !== null && b?.valor !== undefined && b.min !== null && b.max !== null
                        ? `${formatearRazon(b.min, r.formato)} – ${formatearRazon(b.max, r.formato)}`
                        : '—'}
                    </div>
                    {b?.nota && <div className="bm-fila-nota">{b.nota}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dictamen de la IA */}
          {explicacion && (
            <>
              <div className="modal-sec">
                <div className="modal-sec-t">Cómo se llegó a este promedio</div>
                <p className="modal-p">{explicacion.resumen}</p>
                <p className="modal-p">{explicacion.metodologia}</p>
              </div>

              <div className="modal-sec">
                <div className="modal-sec-t">Dictamen por razón</div>
                {explicacion.razones.map((l) => {
                  const razon = razones.find((r) => r.clave === l.clave)
                  if (!razon) return null
                  const escala = razon.formato === 'pct' ? 0.01 : 1
                  return (
                    <div key={l.clave} className="ia-fila">
                      <div className="ia-fila-h">
                        <span className="ia-fila-n">{razon.concepto}</span>
                        <span className={`ia-conf c-${l.confianza}`}>Confianza {l.confianza}</span>
                      </div>
                      <div className="ia-fila-v">
                        {l.valor === null ? 'Sin dato defendible' : formatearRazon(l.valor * escala, razon.formato)}
                        {l.min !== null && l.max !== null && (
                          <span className="ia-fila-r">
                            {' '}· rango {formatearRazon(l.min * escala, razon.formato)} – {formatearRazon(l.max * escala, razon.formato)}
                          </span>
                        )}
                      </div>
                      <div className="ia-fila-p">{l.razonamiento}</div>
                      {l.fuentes?.length > 0 && (
                        <div className="ia-fuentes">
                          {l.fuentes.map((f, i) => (
                            <span key={i} className="ia-fuente">
                              {f.url
                                ? <a href={f.url} target="_blank" rel="noreferrer">{f.nombre}</a>
                                : f.nombre}
                              {' '}<em>{f.anio}</em>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {explicacion.advertencias.length > 0 && (
                <div className="modal-sec">
                  <div className="modal-sec-t">Antes de ponerlo frente al cliente</div>
                  <ul className="ia-avisos">
                    {explicacion.advertencias.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}

          {error && <div className="modal-error">{error}</div>}
        </div>

        {/* Cuadro de diálogo: se pide el recálculo o la precisión */}
        <div className="modal-pie">
          <div className="modal-atajos">
            {ATAJOS.map((a) => (
              <button key={a} className="atajo" disabled={cargando} onClick={() => setInstruccion(a)}>
                {a.length > 46 ? `${a.slice(0, 46)}…` : a}
              </button>
            ))}
          </div>
          <textarea
            className="modal-input"
            value={instruccion}
            disabled={cargando || pidiendoLlave}
            placeholder={
              explicacion
                ? 'Corrige, acota o pide el recálculo: "el ROS del sector está inflado, verifícalo contra INEGI"…'
                : 'Opcional: una instrucción específica antes de la primera revisión.'
            }
            onChange={(e) => setInstruccion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !cargando) consultar(instruccion.trim())
            }}
          />
          <div className="modal-acciones">
            <span className="modal-modelo">
              {PROXY ? 'Vía proxy propio' : MODELO_IA} · búsqueda en fuentes públicas activa
            </span>
            <div className="modal-btns">
              {explicacion && (
                <button
                  className="btn-ghost"
                  disabled={cargando}
                  onClick={() => aplicar(explicacion.razones)}
                >
                  Aplicar a la tabla
                </button>
              )}
              <button
                className="btn-solido"
                disabled={cargando || pidiendoLlave}
                onClick={() => consultar(instruccion.trim())}
              >
                {cargando
                  ? 'Consultando fuentes…'
                  : explicacion ? 'Recalcular' : 'Explicar promedio'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
