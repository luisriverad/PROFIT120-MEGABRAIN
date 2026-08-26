import { Fragment, type ReactNode } from 'react'
import type { BenchmarkSector, CampoFinanciero, Documento, Ejercicio, Razon } from '@/types'
import {
  faltantes, formatearCampo, formatearRazon, valoresDelEjercicio, variacionRazon,
} from '@/data/finanzas'
import { brechaContraIndustria, semaforoIndustria } from '@/data/benchmarks'

/* ---------- Encabezado de paso ---------- */

/** Rótulo del paso y la pregunta que lo abre. Sin texto de entrada debajo. */
export function EncabezadoPaso({ paso, titulo }: { paso: string; titulo: string }) {
  return (
    <>
      <div className="eyebrow">{paso}</div>
      <h1 className="h-es">{titulo}</h1>
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

/** Campo de texto largo. Mismo envoltorio que Campo, con caja alta. */
export function CampoTexto({
  etiqueta, valor, placeholder, onChange,
}: { etiqueta: string; valor: string; placeholder?: string; onChange?: (v: string) => void }) {
  return (
    <div className="field">
      <label>{etiqueta}</label>
      <textarea
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
      />
    </div>
  )
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * Encabezado de una columna. El periodo en curso trae el selector del mes de
 * corte: nadie sabe de antemano hasta dónde llega la contabilidad del cliente,
 * y ese mes es el que decide cómo se anualiza todo lo de abajo.
 */
function CabezaEjercicio({
  ejercicio, indice, onMes,
}: {
  ejercicio: Ejercicio
  indice: number
  onMes?: (indice: number, meses: number) => void
}) {
  if (!ejercicio.enCurso) {
    return <span className={`yh ${indice > 0 ? 'prev' : ''}`}>{ejercicio.etiqueta}</span>
  }
  return (
    <span className="yh mtd">
      {ejercicio.etiqueta}
      <select
        className="yh-mes"
        value={ejercicio.meses}
        disabled={!onMes}
        onChange={(e) => onMes?.(indice, Number(e.target.value))}
      >
        {MESES.map((m, k) => <option key={m} value={k + 1}>a {m}</option>)}
      </select>
    </span>
  )
}

/**
 * Bloque de captura: un renglón por dato, una columna por ejercicio.
 * Se dibuja una línea cada vez que cambia la naturaleza del dato, para que la
 * captura siga el orden de los documentos que trae el contador.
 */
export function CapturaFinanciera({
  ejercicios, campos, onChange, onMes,
}: {
  ejercicios: Ejercicio[]
  campos: CampoFinanciero[]
  onChange?: (clave: string, ejercicio: number, v: string) => void
  onMes?: (indice: number, meses: number) => void
}) {
  // Aquí se pinta lo que de verdad pasó en el periodo: los derivados se
  // resuelven sin anualizar. La anualización solo aplica a las razones.
  const porEjercicio = ejercicios.map((_, i) => valoresDelEjercicio(campos, i))

  return (
    <div className="years" style={{ gridTemplateColumns: `minmax(230px,1.2fr) repeat(${ejercicios.length},1fr)` }}>
      <span />
      {ejercicios.map((e, i) => (
        <CabezaEjercicio key={e.etiqueta} ejercicio={e} indice={i} onMes={onMes} />
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
            {ejercicios.map((_, j) => {
              if (c.derivado) {
                const n = porEjercicio[j][c.clave]
                return (
                  <div key={j} className={`ycalc ${j > 0 ? 'prev' : ''}`}>
                    {n === undefined ? 'Falta un dato' : formatearCampo(n, c.unidad)}
                  </div>
                )
              }
              return (
                <input
                  key={j}
                  className={j > 0 ? 'prev' : ''}
                  value={formatearCampo(c.valores[j] ?? null, c.unidad)}
                  placeholder="Sin dato"
                  onChange={(e) => onChange?.(c.clave, j, e.target.value)}
                  readOnly={!onChange}
                />
              )
            })}
          </Fragment>
        )
      })}
    </div>
  )
}

/** Posición 0–1 del semáforo, ya en porcentaje de ancho de la barra. */
const pct = (n: number) => `${Math.max(0, Math.min(1, n)) * 100}%`

/**
 * Razones derivadas. No se capturan: se calculan y se leen.
 * La última columna es el promedio de la industria del sector capturado en el
 * expediente — sin esa referencia, un ROS de 4.1% no dice si está bien o mal.
 */
export function TablaRazones({
  ejercicios, campos, razones, benchmark, onExplicar,
}: {
  ejercicios: Ejercicio[]
  campos: CampoFinanciero[]
  razones: Razon[]
  benchmark: BenchmarkSector
  onExplicar: () => void
}) {
  // Las razones sí se leen en base anual: un ROS calculado con siete meses de
  // venta contra un capital de doce no significa nada.
  const porEjercicio = ejercicios.map((e, i) => valoresDelEjercicio(campos, i, e.meses))

  return (
    <>
      <div
        className="ratios"
        style={{ gridTemplateColumns: `minmax(240px,1.4fr) repeat(${ejercicios.length},1fr) minmax(120px,.85fr) minmax(150px,1fr)` }}
      >
        <span />
        {ejercicios.map((e, i) => (
          <CabezaEjercicio key={e.etiqueta} ejercicio={e} indice={i} />
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
          const sem = semaforoIndustria(valores[0], bm, r.mejorSi)

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
                    {sem && (
                      <span
                        className={`rz-bar ${sem.nivel}`}
                        title={`Empresa ${formatearRazon(valores[0], r.formato)} · industria ${formatearRazon(bm.valor, r.formato)}${bm.min !== null && bm.max !== null ? ` (${formatearRazon(bm.min, r.formato)} – ${formatearRazon(bm.max, r.formato)})` : ''}`}
                      >
                        <i
                          className="rz-bar-banda"
                          style={{ left: pct(sem.banda.ini), width: pct(sem.banda.fin - sem.banda.ini) }}
                        />
                        <i
                          className="rz-bar-brecha"
                          style={{
                            left: pct(Math.min(sem.mediana, sem.empresa)),
                            width: pct(Math.abs(sem.empresa - sem.mediana)),
                          }}
                        />
                        <i className="rz-bar-mediana" style={{ left: pct(sem.mediana) }} />
                        <i className="rz-bar-emp" style={{ left: pct(sem.empresa) }} />
                      </span>
                    )}
                    {brecha && (
                      <span className={`rz-bm-d ${sem ? sem.nivel : (brecha.mejor ? 'up' : 'down')}`}>
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

/**
 * Texto editable en sitio. Se ve como texto corrido hasta que se toca, para que
 * un reporte que el motor propuso siga leyéndose como reporte y no como
 * formulario — pero cualquier línea se pueda corregir sin salir de la pantalla.
 */
export function TextoEditable({
  valor, onChange, placeholder, clase = '',
}: {
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  clase?: string
}) {
  return (
    <textarea
      className={`edit ${clase}`}
      value={valor}
      placeholder={placeholder}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
    />
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
      {etiqueta && <span className="qtag">{etiqueta}</span>}
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

/**
 * Pregunta que pide una cifra. Cuando la respuesta la calculó la radiografía en
 * lugar de darla el cliente, viene con `marca` y el campo se distingue: sigue
 * siendo editable, pero se ve que nadie tuvo que preguntarla.
 */
export function PreguntaConNumero({
  etiqueta, pregunta, valor, marca, placeholder, onChange,
}: {
  etiqueta: string
  pregunta: string
  valor: string
  marca?: string
  placeholder?: string
  onChange?: (v: string) => void
}) {
  return (
    <div className="qrow">
      {(etiqueta || marca) && (
        <span className="qtag">
          {etiqueta}
          {marca && <span className="qcalc">{marca}</span>}
        </span>
      )}
      <div className="qtext">{pregunta}</div>
      <input
        className={`qnum ${marca ? 'calc' : ''}`}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
      />
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
      {etiqueta && <span className="qtag">{etiqueta}</span>}
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
