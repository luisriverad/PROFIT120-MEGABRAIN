import { Fragment, type ReactNode } from 'react'
import type { BenchmarkSector, CampoFinanciero, Documento, Razon, Severidad } from '@/types'
import {
  faltantes, formatearCampo, formatearRazon, valoresDelEjercicio, variacionRazon,
} from '@/data/finanzas'
import { brechaContraIndustria } from '@/data/benchmarks'

/* ---------- Encabezado de paso ---------- */

export function EncabezadoPaso({
  paso, titulo, entrada,
}: { paso: string; titulo: string; entrada: string }) {
  return (
    <>
      <div className="eyebrow">{paso}</div>
      <h1 className="h-es">{titulo}</h1>
      <p className="lead">{entrada}</p>
    </>
  )
}

/* ---------- Tarjeta ---------- */

/** El título se sostiene solo: la tarjeta no lleva texto explicativo debajo. */
export function Card({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <div className="card">
      {titulo && <div className="card-title">{titulo}</div>}
      {children}
    </div>
  )
}

/* ---------- Nota del consultor ---------- */

export function NotaConsultor({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="consultant-note">
      <b>{rotulo}</b> {children}
    </div>
  )
}

/* ---------- Campos ---------- */

export function Campo({
  etiqueta, valor, onChange,
}: { etiqueta: string; valor: string; onChange?: (v: string) => void }) {
  return (
    <div className="field">
      <label>{etiqueta}</label>
      <input value={valor} onChange={(e) => onChange?.(e.target.value)} readOnly={!onChange} />
    </div>
  )
}

export function CampoLista({
  etiqueta, valor, opciones, onChange,
}: { etiqueta: string; valor: string; opciones: readonly string[]; onChange?: (v: string) => void }) {
  return (
    <div className="field">
      <label>{etiqueta}</label>
      <select value={valor} onChange={(e) => onChange?.(e.target.value)}>
        {opciones.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

/**
 * Bloque de captura: un renglón por dato, una columna por ejercicio.
 * Se dibuja una línea cada vez que cambia la naturaleza del dato, para que la
 * captura siga el orden de los documentos que trae el contador.
 */
export function CapturaFinanciera({
  ejercicios, campos, onChange,
}: {
  ejercicios: string[]
  campos: CampoFinanciero[]
  onChange?: (clave: string, ejercicio: number, v: string) => void
}) {
  return (
    <div className="years" style={{ gridTemplateColumns: `minmax(230px,1.2fr) repeat(${ejercicios.length},1fr)` }}>
      <span />
      {ejercicios.map((e, i) => (
        <span key={e} className={`yh ${i > 0 ? 'prev' : ''}`}>{e}</span>
      ))}
      {campos.map((c, i) => {
        const abreNaturaleza = i > 0 && campos[i - 1].naturaleza !== c.naturaleza
        return (
          <Fragment key={c.clave}>
            {/* Ocupa el renglón completo de la retícula y corta el bloque. */}
            {abreNaturaleza && <span className="yc-corte" />}
            <label className="yc">
              {c.concepto}
              {c.ayuda && <span className="yc-help">{c.ayuda}</span>}
            </label>
            {ejercicios.map((_, j) => (
              <input
                key={j}
                className={j > 0 ? 'prev' : ''}
                value={formatearCampo(c.valores[j] ?? null, c.unidad)}
                placeholder="Sin dato"
                onChange={(e) => onChange?.(c.clave, j, e.target.value)}
                readOnly={!onChange}
              />
            ))}
          </Fragment>
        )
      })}
    </div>
  )
}

/**
 * Razones derivadas. No se capturan: se calculan y se leen.
 * La última columna es el promedio de la industria del sector capturado en el
 * expediente — sin esa referencia, un ROS de 4.1% no dice si está bien o mal.
 */
export function TablaRazones({
  ejercicios, campos, razones, benchmark, onExplicar,
}: {
  ejercicios: string[]
  campos: CampoFinanciero[]
  razones: Razon[]
  benchmark: BenchmarkSector
  onExplicar: () => void
}) {
  const porEjercicio = ejercicios.map((_, i) => valoresDelEjercicio(campos, i))

  return (
    <>
      <div
        className="ratios"
        style={{ gridTemplateColumns: `minmax(240px,1.4fr) repeat(${ejercicios.length},1fr) minmax(120px,.85fr) minmax(150px,1fr)` }}
      >
        <span />
        {ejercicios.map((e, i) => (
          <span key={e} className={`yh ${i > 0 ? 'prev' : ''}`}>{e}</span>
        ))}
        <span className="yh">Variación</span>
        <span className="yh bm">Promedio industria</span>

        {razones.map((r) => {
          const valores = porEjercicio.map((v) => (
            faltantes(r, v, campos).length ? null : r.calcular(v)
          ))
          const falta = faltantes(r, porEjercicio[0], campos)
          const v = variacionRazon(valores[0], valores[1] ?? null, r.formato)
          const mejora = v ? (r.mejorSi === 'alto' ? v.delta > 0 : v.delta < 0) : false

          const bm = benchmark.razones[r.clave]
          const brecha = brechaContraIndustria(valores[0], bm?.valor ?? null, r.formato, r.mejorSi)

          return (
            <Fragment key={r.clave}>
              <div className="rz-name">
                {r.concepto}
                <span className="rz-formula">{r.formula}</span>
                <span className="rz-read">{r.lectura}</span>
              </div>
              {valores.map((n, j) => (
                <div key={j} className={`rz-val ${j > 0 ? 'prev' : ''}`}>
                  {formatearRazon(n ?? null, r.formato)}
                </div>
              ))}
              <div className={`rz-delta ${v ? (mejora ? 'up' : 'down') : ''}`}>
                {v ? v.texto : (falta.length ? `Falta: ${falta.join(', ')}` : '—')}
              </div>
              <div className="rz-bm">
                {bm?.valor !== null && bm?.valor !== undefined ? (
                  <>
                    <span className="rz-bm-v">{formatearRazon(bm.valor, r.formato)}</span>
                    {bm.min !== null && bm.max !== null && (
                      <span className="rz-bm-r">
                        {formatearRazon(bm.min, r.formato)} – {formatearRazon(bm.max, r.formato)}
                      </span>
                    )}
                    {brecha && (
                      <span className={`rz-bm-d ${brecha.mejor ? 'up' : 'down'}`}>
                        {brecha.texto} vs industria
                      </span>
                    )}
                  </>
                ) : (
                  <span className="rz-bm-na">{bm?.nota ? 'No comparable' : '—'}</span>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>

      <div className="bm-foot">
        <span className="bm-foot-src">
          <b>{benchmark.sector}</b> · {benchmark.fuente} · {benchmark.vigencia}
        </span>
        <button className="btn-explicar" onClick={onExplicar}>Explicar promedio</button>
      </div>
    </>
  )
}

/* ---------- Preguntas ---------- */

export function PreguntaConOpciones({
  etiqueta, pregunta, opciones, seleccion, onSelect,
}: {
  etiqueta: string
  pregunta: string
  opciones: string[]
  seleccion: number
  onSelect?: (i: number) => void
}) {
  return (
    <div className="qrow">
      <span className="qtag">{etiqueta}</span>
      <div className="qtext">{pregunta}</div>
      <div className="opts">
        {opciones.map((o, i) => (
          <button key={o} className={`opt ${i === seleccion ? 'on' : ''}`} onClick={() => onSelect?.(i)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PreguntaConNumero({
  etiqueta, pregunta, valor, onChange,
}: { etiqueta: string; pregunta: string; valor: string; onChange?: (v: string) => void }) {
  return (
    <div className="qrow">
      <span className="qtag">{etiqueta}</span>
      <div className="qtext">{pregunta}</div>
      <input className="qnum" value={valor} onChange={(e) => onChange?.(e.target.value)} readOnly={!onChange} />
    </div>
  )
}

export function PreguntaConTexto({
  etiqueta, pregunta, valor, placeholder, onChange,
}: {
  etiqueta: string
  pregunta: string
  valor: string
  placeholder?: string
  onChange?: (v: string) => void
}) {
  return (
    <div className="qrow">
      <span className="qtag">{etiqueta}</span>
      <div className="qtext">{pregunta}</div>
      <textarea
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
      />
    </div>
  )
}

/* ---------- Hallazgo ---------- */

const CLASE_SEVERIDAD: Record<Severidad, string> = {
  critico: 'sev-crit',
  alerta: 'sev-alt',
  observacion: 'sev-obs',
}
const TEXTO_SEVERIDAD: Record<Severidad, string> = {
  critico: 'Crítico',
  alerta: 'Alerta',
  observacion: 'Observación',
}

export function TarjetaHallazgo({
  dimension, severidad, lectura, evidencia, children,
}: {
  dimension: string
  severidad: Severidad
  lectura: string
  evidencia?: string
  children?: ReactNode
}) {
  return (
    <div className="finding">
      <div className="finding-head">
        <div className="finding-name">{dimension}</div>
        <div className={`sev ${CLASE_SEVERIDAD[severidad]}`}>{TEXTO_SEVERIDAD[severidad]}</div>
      </div>
      <div className="finding-read">{lectura}</div>
      {evidencia && <div className="finding-ev">{evidencia}</div>}
      {children}
    </div>
  )
}

/* ---------- Documento ---------- */

const CLASE_ESTADO: Record<Documento['estado'], string> = {
  cargado: 's-ok',
  definido: 's-ok',
  parcial: 's-wait',
  falta: 's-miss',
}

export function FilaDocumento({ doc }: { doc: Documento }) {
  return (
    <div className="doc-row">
      <div>
        <div className="doc-name">{doc.nombre}</div>
        <div className="doc-why">{doc.detalle}</div>
      </div>
      <div className={`state ${CLASE_ESTADO[doc.estado]}`}>{doc.etiqueta}</div>
    </div>
  )
}
