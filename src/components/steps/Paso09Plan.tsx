import { useState } from 'react'
import type { AccionPlan, VentanaPlan } from '@/types'
import { MODELO_IA, generarPlanTrabajo } from '@/lib/ia'
import { EncabezadoPaso } from '@/components/ui/Primitivos'
import { BloqueIA } from '@/components/ui/BloqueIA'
import { ModalAccion } from '@/components/ui/ModalAccion'
import { DocumentoImpreso, useImpresion } from '@/components/ui/DocumentoImpreso'
import { exportarPPT, type DocumentoExport } from '@/lib/exportar'
import { useExpediente } from '@/estado/Expediente'

/**
 * Plan de trabajo.
 *
 * Se lee como mapa, no como lista: un renglón por frente del diagnóstico y una
 * columna por ventana. Así se ve de un vistazo qué frente arranca pronto, cuál
 * carga el trabajo pesado en medio y cuál se vuelve operación al final — que es
 * lo que un cliente quiere entender antes de firmar.
 */

const VENTANAS: { clave: VentanaPlan; titulo: string; sub: string }[] = [
  { clave: '0-30', titulo: '0 a 30 días', sub: 'Destrabar' },
  { clave: '31-60', titulo: '31 a 60 días', sub: 'Recuperar' },
  { clave: '61-90', titulo: '61 a 90 días', sub: 'Instalar' },
  { clave: '+90', titulo: 'Más de 90 días', sub: 'Sostener' },
]

/** Sugerencias del organigrama típico. El campo acepta cualquier cosa. */
const AREAS = [
  'Dirección General', 'Finanzas', 'Comercial', 'Producción', 'Materiales',
  'Recursos Humanos', 'Calidad', 'Sistemas', 'Contabilidad',
]

const FASES = [
  'Leyendo los tres frentes y sus causas raíz',
  'Separando lo que destraba de lo que recupera',
  'Repartiendo en las cuatro ventanas',
  'Asignando responsable a cada acción',
  'Amarrando entregables verificables',
  'Cerrando',
]

const CONDICIONES = [
  'El dueño quiere resultados visibles antes de 45 días: reordénalo.',
  'No hay presupuesto para consultoría después del día 90.',
  'Producción no tiene capacidad de tomar acciones nuevas este trimestre.',
]

function Accion({
  accion, onArea, onAbrir, onPDF, onPPT,
}: {
  accion: AccionPlan
  onArea: (v: string) => void
  onAbrir: () => void
  onPDF: () => void
  onPPT: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(accion.area)

  return (
    <div className="acc">
      {/* La tarjeta entera abre el instructivo; el chip de área se edita aparte. */}
      <button className="acc-t" onClick={onAbrir}>
        {accion.accion}
        <span className="acc-ver">Ver plan</span>
      </button>

      <div className="acc-area">
        {editando ? (
          <>
            <input
              className="acc-input"
              autoFocus
              list="areas-plan"
              value={borrador}
              placeholder="¿Quién responde?"
              onChange={(e) => setBorrador(e.target.value)}
              onBlur={() => { onArea(borrador.trim()); setEditando(false) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') { setBorrador(accion.area); setEditando(false) }
              }}
            />
          </>
        ) : (
          <>
            <span className={`acc-chip ${accion.area ? '' : 'sin'}`}>
              {accion.area || 'Sin responsable'}
            </span>
            <button className="acc-ed" onClick={() => { setBorrador(accion.area); setEditando(true) }}>
              Editar
            </button>
          </>
        )}
      </div>

      <div className="acc-ent">{accion.entregable}</div>
      {accion.herramienta && (
        <div className="acc-her">
          {accion.herramienta.nombre}
          <span className="acc-mod">{accion.herramienta.modulo}</span>
        </div>
      )}

      <div className="acc-exp">
        <button onClick={onPDF}>PDF</button>
        <button onClick={onPPT}>PPT</button>
      </div>
    </div>
  )
}

export function Paso09Plan() {
  const { cliente, plan, costo, causas, respuestas, trabajo, setTrabajo, detalles } = useExpediente()
  const [instruccion, setInstruccion] = useState('')
  const [abierta, setAbierta] = useState<AccionPlan | null>(null)
  const { doc, imprimir } = useImpresion()
  const [exportando, setExportando] = useState(false)

  const generar = async () => {
    const r = await generarPlanTrabajo({
      cliente: cliente, plan, costo, causas, respuestas, instruccion: instruccion.trim(),
    })
    setTrabajo(() => r)
  }

  const cambiarArea = (id: string, area: string) =>
    setTrabajo((t) => (t ? {
      ...t,
      acciones: t.acciones.map((a) => (a.id === id ? { ...a, area } : a)),
    } : t))

  const acciones = trabajo?.acciones ?? []

  /**
   * Arma el documento. Se exporta la ficha aunque la acción no esté aterrizada:
   * el consultor decide si vale la pena mandarla así o generarla antes.
   */
  const armar = (lista: AccionPlan[], titulo: string, conLectura: boolean): DocumentoExport => ({
    cliente: cliente.razonSocial,
    sector: cliente.sector,
    titulo,
    lectura: conLectura ? trabajo?.lectura : undefined,
    items: lista.map((a) => ({ accion: a, detalle: detalles[a.id] ?? null })),
  })

  const aPPT = async (d: DocumentoExport) => {
    setExportando(true)
    try {
      await exportarPPT(d)
    } finally {
      setExportando(false)
    }
  }
  /** Los frentes en el orden del diagnóstico; si el plan trae otros, van después. */
  const frentes = [
    ...(plan?.frentes.map((f) => f.nombre) ?? []),
    ...acciones.map((a) => a.frente).filter((f) => !plan?.frentes.some((x) => x.nombre === f)),
  ].filter((f, i, xs) => xs.indexOf(f) === i)

  const sinResponsable = acciones.filter((a) => !a.area.trim()).length

  return (
    <>
      <EncabezadoPaso paso="Paso 07 · Plan de trabajo" titulo="El plan de trabajo es" />

      {doc && <DocumentoImpreso doc={doc} />}

      <datalist id="areas-plan">
        {AREAS.map((a) => <option key={a} value={a} />)}
      </datalist>

      <BloqueIA
        titulo="Plan de trabajo"
        fases={FASES}
        generar={generar}
        hayResultado={acciones.length > 0}
        siempreAbierto
        deshabilitado={!plan?.frentes.length}
        textoDeshabilitado="Falta el diagnóstico inicial"
        etiquetaGenerar="Armar el plan"
        nota={`${MODELO_IA} · esfuerzo alto · ${acciones.length} acciones en ${frentes.length} frentes`}
        pie={(
          <>
            <div className="modal-atajos">
              {CONDICIONES.map((c) => (
                <button key={c} className="atajo" onClick={() => setInstruccion(c)}>
                  {c.length > 46 ? `${c.slice(0, 46)}…` : c}
                </button>
              ))}
            </div>
            <textarea
              className="modal-input"
              value={instruccion}
              placeholder="Pon una condición y vuelve a generar. Ojo: regenerar reemplaza los responsables que hayas ajustado."
              onChange={(e) => setInstruccion(e.target.value)}
            />
          </>
        )}
      >
        {trabajo?.lectura && <div className="plan-lectura">{trabajo.lectura}</div>}

        {acciones.length > 0 && (
          <div className="exp-barra">
            <span className="exp-nota">
              El plan completo, {acciones.length} acciones. Los mensajes de encargo no se exportan.
            </span>
            <div className="exp-btns">
              <button
                className="btn-ghost"
                onClick={() => imprimir(armar(acciones, 'Plan de trabajo — 90 días', true))}
              >
                Exportar a PDF
              </button>
              <button
                className="btn-ghost"
                disabled={exportando}
                onClick={() => aPPT(armar(acciones, 'Plan de trabajo — 90 días', true))}
              >
                {exportando ? 'Generando…' : 'Exportar a PPT'}
              </button>
            </div>
          </div>
        )}

        <div className="ruta">
          <div className="ruta-cab">
            <span />
            {VENTANAS.map((v) => (
              <div key={v.clave} className={`ruta-v v-${v.clave}`}>
                <span className="ruta-v-t">{v.titulo}</span>
                <span className="ruta-v-s">{v.sub}</span>
              </div>
            ))}
          </div>

          {frentes.map((f, i) => (
            <div key={f} className="ruta-fila">
              <div className="ruta-f">
                <span className="frente-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="ruta-f-n">{f}</span>
              </div>
              {VENTANAS.map((v) => {
                const celda = acciones.filter((a) => a.frente === f && a.ventana === v.clave)
                return (
                  <div key={v.clave} className={`ruta-c v-${v.clave} ${celda.length ? '' : 'vacia'}`}>
                    {celda.map((a) => (
                      <Accion
                        key={a.id}
                        accion={a}
                        onArea={(area) => cambiarArea(a.id, area)}
                        onAbrir={() => setAbierta(a)}
                        onPDF={() => imprimir(armar([a], a.accion, false))}
                        onPPT={() => aPPT(armar([a], a.accion, false))}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {acciones.length > 0 && (
          <div className="tema-foot">
            <span>
              <b>{acciones.length}</b> acciones en 90 días
              {sinResponsable > 0 && <> {' · '} <b>{sinResponsable}</b> sin responsable asignado</>}
            </span>
          </div>
        )}
      </BloqueIA>

      {abierta && <ModalAccion accion={abierta} onCerrar={() => setAbierta(null)} />}
    </>
  )
}
