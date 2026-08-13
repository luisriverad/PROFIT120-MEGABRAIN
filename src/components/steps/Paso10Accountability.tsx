import { Fragment, useState } from 'react'
import type { KpiSeguimiento } from '@/types'
import { CLIENTE, DECLARACION_CLIENTE } from '@/data/caso'
import { formatearCampo } from '@/data/finanzas'
import { MODELO_IA, generarAccountability } from '@/lib/ia'
import { EncabezadoPaso } from '@/components/ui/Primitivos'
import { BloqueIA } from '@/components/ui/BloqueIA'
import { useExpediente } from '@/estado/Expediente'
import { DocumentoImpreso, useImpresion } from '@/components/ui/DocumentoImpreso'
import { exportarPPT, type DocumentoExport } from '@/lib/exportar'

/**
 * Accountability.
 *
 * La última pantalla no agrega diagnóstico: cierra. Recoge lo que se acumuló en
 * todo el expediente —el veredicto, lo que cuesta, las causas raíz, el plan— y
 * lo convierte en lo único que sobrevive cuando el consultor se va: qué se mide,
 * quién responde y con qué ritmo se revisa.
 */

const FASES = [
  'Recogiendo el veredicto y lo que cuesta',
  'Releyendo las causas raíz',
  'Eligiendo qué se mide de todo el plan',
  'Asignando responsable a cada indicador',
  'Fijando el ritmo de las juntas',
  'Cerrando',
]

const CONDICIONES = [
  'Máximo cinco indicadores: el dueño no va a revisar más.',
  'Todo el seguimiento tiene que caber en una junta semanal.',
  'El dueño no quiere juntas nuevas: usa las que ya existen.',
]

function Kpi({ kpi, onResponsable }: { kpi: KpiSeguimiento; onResponsable: (v: string) => void }) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(kpi.responsable)

  return (
    <div className="kpi">
      <div className="kpi-n">{kpi.indicador}</div>
      <div className="kpi-mov">
        <span className="kpi-base">{kpi.base}</span>
        <span className="kpi-flecha">→</span>
        <span className="kpi-meta">{kpi.meta}</span>
      </div>
      <div className="kpi-frec">{kpi.frecuencia}</div>
      <div className="kpi-resp">
        {editando ? (
          <input
            className="acc-input"
            autoFocus
            value={borrador}
            placeholder="¿Quién responde?"
            onChange={(e) => setBorrador(e.target.value)}
            onBlur={() => { onResponsable(borrador.trim()); setEditando(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') { setBorrador(kpi.responsable); setEditando(false) }
            }}
          />
        ) : (
          <>
            <span className={`acc-chip ${kpi.responsable ? '' : 'sin'}`}>
              {kpi.responsable || 'Sin dueño'}
            </span>
            <button className="acc-ed" onClick={() => { setBorrador(kpi.responsable); setEditando(true) }}>
              Editar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function Paso10Accountability() {
  const { mapa, plan, costo, causas, trabajo, cierre, setCierre } = useExpediente()
  const [instruccion, setInstruccion] = useState('')
  const [exportando, setExportando] = useState(false)
  const { doc, imprimir } = useImpresion()

  const generar = async () => {
    const r = await generarAccountability({
      cliente: CLIENTE, declaracion: DECLARACION_CLIENTE, mapa, plan, costo, causas, trabajo,
      instruccion: instruccion.trim(),
    })
    setCierre(() => r)
  }

  const cambiarResponsable = (indicador: string, responsable: string) =>
    setCierre((c) => (c ? {
      ...c,
      kpis: c.kpis.map((k) => (k.indicador === indicador ? { ...k, responsable } : k)),
    } : c))

  // Las cifras del encabezado se suman aquí: son el resumen de todo lo anterior
  // y no pueden discrepar de las pantallas de las que salen.
  const costoTotal = costo?.frentes.reduce((s, f) => s + (f.monto ?? 0), 0) ?? 0
  const kpis = cierre?.kpis ?? []
  const acciones = trabajo?.acciones ?? []
  const sinDueno = kpis.filter((k) => !k.responsable.trim()).length
  const frentes = plan?.frentes ?? []

  /** El cierre completo, listo para mandar. */
  const documento = (): DocumentoExport => ({
    cliente: CLIENTE.razonSocial,
    sector: CLIENTE.sector,
    titulo: 'Cierre del diagnóstico — KPIs y responsables',
    cierre: {
      costoTotal: formatearCampo(costoTotal, 'mxn'),
      frentes: frentes.length,
      acciones: acciones.length,
      parrafo: cierre?.cierre ?? '',
      kpis,
      ritmo: cierre?.ritmo ?? [],
      senalesTempranas: cierre?.senalesTempranas ?? [],
      riesgoDeNoSostener: cierre?.riesgoDeNoSostener ?? '',
    },
  })

  const aPPT = async () => {
    setExportando(true)
    try {
      await exportarPPT(documento())
    } finally {
      setExportando(false)
    }
  }

  /** Los indicadores agrupados por frente, en el orden del diagnóstico. */
  const porFrente = [
    ...frentes.map((f) => ({ frente: f.nombre, criticidad: f.criticidad, lista: kpis.filter((k) => k.frente === f.nombre) })),
    { frente: 'Otros', criticidad: 'verde' as const, lista: kpis.filter((k) => !frentes.some((f) => f.nombre === k.frente)) },
  ].filter((g) => g.lista.length)

  return (
    <>
      <EncabezadoPaso paso="Paso 08 · Accountability" titulo="Los KPIs y sus responsables" />

      {doc && <DocumentoImpreso doc={doc} />}

      {kpis.length > 0 && (
        <div className="exp-barra cierre-exp">
          <span className="exp-nota">
            El cierre completo: las cifras del diagnóstico, los indicadores con su dueño, el ritmo y
            las señales tempranas.
          </span>
          <div className="exp-btns">
            <button className="btn-ghost" onClick={() => imprimir(documento())}>Exportar a PDF</button>
            <button className="btn-ghost" disabled={exportando} onClick={aPPT}>
              {exportando ? 'Generando…' : 'Exportar a PPT'}
            </button>
          </div>
        </div>
      )}

      {/* El resumen de todo lo anterior, en cuatro cifras */}
      <div className="cierre-hero">
        <div className="hero-marca">{CLIENTE.razonSocial} · {CLIENTE.sector}</div>
        <div className="hero-cifras">
          <div className="hero-c grande">
            <span className="hero-l">Costo anual de no hacer nada</span>
            <span className="hero-v">{formatearCampo(costoTotal, 'mxn')}</span>
          </div>
          <div className="hero-c">
            <span className="hero-l">Frentes</span>
            <span className="hero-v">{frentes.length}</span>
          </div>
          <div className="hero-c">
            <span className="hero-l">Acciones en 90 días</span>
            <span className="hero-v">{acciones.length}</span>
          </div>
          <div className="hero-c">
            <span className="hero-l">Indicadores con dueño</span>
            <span className="hero-v">{kpis.length - sinDueno} de {kpis.length}</span>
          </div>
        </div>
        {cierre?.cierre && <p className="hero-cierre">{cierre.cierre}</p>}
      </div>

      <BloqueIA
        titulo="Lo que queda medido"
        fases={FASES}
        generar={generar}
        hayResultado={kpis.length > 0}
        siempreAbierto
        deshabilitado={!frentes.length}
        textoDeshabilitado="Falta el diagnóstico inicial"
        etiquetaGenerar="Armar el cierre"
        nota={`${MODELO_IA} · esfuerzo alto sobre el expediente completo`}
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
        {porFrente.map((g, i) => (
          <Fragment key={g.frente}>
            <div className={`kpi-grupo s-${g.criticidad}`}>
              <span className="frente-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="kpi-grupo-n">{g.frente}</span>
              <span className="kpi-grupo-c">{g.lista.length} {g.lista.length === 1 ? 'indicador' : 'indicadores'}</span>
            </div>
            <div className="kpi-cab">
              <span>Indicador crítico</span>
              <span>Hoy · Meta 90 días</span>
              <span>Frecuencia</span>
              <span>Responsable nominal</span>
            </div>
            {g.lista.map((k) => (
              <Kpi key={k.indicador} kpi={k} onResponsable={(v) => cambiarResponsable(k.indicador, v)} />
            ))}
          </Fragment>
        ))}

        {cierre?.ritmo.length ? (
          <>
            <div className="rad-sub">El ritmo que lo sostiene</div>
            <div className="ritmo">
              {cierre.ritmo.map((j) => (
                <div key={j.junta} className="junta">
                  <div className="junta-h">
                    <span className="junta-n">{j.junta}</span>
                    <span className="junta-c">{j.cuando}</span>
                  </div>
                  <div className="junta-a">{j.asistentes}</div>
                  <div className="junta-p">{j.proposito}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {cierre?.senalesTempranas.length ? (
          <>
            <div className="rad-sub">Señales tempranas</div>
            <div className="senales">
              {cierre.senalesTempranas.map((s, i) => (
                <div key={i} className="senal">
                  <span className="senal-n">{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {cierre?.riesgoDeNoSostener && (
          <div className="no-sostener">
            <span className="riesgo-lbl">Si el ritmo se abandona</span>
            {cierre.riesgoDeNoSostener}
          </div>
        )}

        {kpis.length > 0 && (
          <div className="tema-foot">
            <span>
              <b>{kpis.length}</b> indicadores · <b>{cierre?.ritmo.length ?? 0}</b> juntas en el ritmo
              {sinDueno > 0 && <> {' · '} <b>{sinDueno}</b> sin dueño</>}
            </span>
          </div>
        )}
      </BloqueIA>
    </>
  )
}
