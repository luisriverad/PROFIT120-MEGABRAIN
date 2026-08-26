import { useEffect, useState } from 'react'
import type { CadenaCausal } from '@/types'
import { DECLARACION_CLIENTE } from '@/data/caso'
import { MODELO_IA, analizarCausaRaiz, hayCredencial, recalcularCadena } from '@/lib/ia'
import { ProgresoIA } from '@/components/ui/ProgresoIA'
import { EncabezadoPaso, NotaConsultor } from '@/components/ui/Primitivos'
import { BloqueIA } from '@/components/ui/BloqueIA'
import { useExpediente } from '@/estado/Expediente'

/**
 * Causa raíz.
 *
 * Una cadena por cada frente del diagnóstico y por cada tema que el cliente haya
 * abierto. El motor las baja; el consultor corrige cualquier eslabón, agrega los
 * que falten y puede escribir una cadena entera de su cosecha. Lo que sale de
 * aquí es mitad máquina y mitad oficio, y así debe verse.
 */

const FASES = [
  'Leyendo los frentes y los temas abiertos',
  'Recuperando lo que el cliente contestó en sesión',
  'Bajando del número al proceso',
  'Del proceso a quién decide y con qué información',
  'Buscando dónde convergen las cadenas',
  'Cerrando',
]

const FASES_RECALCULO = [
  'Fijando lo que corrigió el consultor',
  'Volviendo a bajar desde ahí',
  'Rederivando la causa raíz',
  'Cerrando',
]

const CONDICIONES = [
  'Baja un nivel más: quiero llegar a quién responde por el resultado.',
  'No uses lo que contestó el cliente, solo las cifras.',
  'Fuerza la convergencia: dime si hay una sola causa detrás de todo.',
]

/** Qué parte de la cadena está abierta a edición. */
type Campo = 'sintoma' | 'causaRaiz' | 'porQueAhi' | 'implicacion' | number

/**
 * Un renglón de la cadena. Se lee como texto y trae su propio botón de editar;
 * al cerrar la edición, si el texto cambió, la cadena se vuelve a derivar de ahí
 * para abajo sin preguntar — corregir un eslabón y dejar intactas sus
 * consecuencias es peor que no corregirlo.
 */
function Nivel({
  etiqueta, valor, abierto, onAbrir, onGuardar, onQuitar, placeholder, clase = '',
}: {
  etiqueta: string
  valor: string
  abierto: boolean
  onAbrir: () => void
  /** Recibe el texto final; el llamador decide si recalcula. */
  onGuardar: (v: string) => void
  onQuitar?: () => void
  placeholder?: string
  clase?: string
}) {
  const [borrador, setBorrador] = useState(valor)

  useEffect(() => { if (abierto) setBorrador(valor) }, [abierto, valor])

  return (
    <div className={`why ${abierto ? 'on' : ''}`}>
      <span className="why-lbl">{etiqueta}</span>
      {abierto ? (
        <textarea
          className={`edit ${clase}`}
          autoFocus
          value={borrador}
          placeholder={placeholder}
          rows={1}
          onChange={(e) => setBorrador(e.target.value)}
          onBlur={() => onGuardar(borrador)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setBorrador(valor); (e.target as HTMLTextAreaElement).blur() }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).blur()
          }}
        />
      ) : (
        <span className={`why-txt ${clase}`}>{valor || <em className="why-vacio">{placeholder}</em>}</span>
      )}
      {!abierto && (
        <div className="why-acc">
          <button className="why-ed" onClick={onAbrir}>Editar</button>
          {onQuitar && <button className="bloque-x" onClick={onQuitar} aria-label="Quitar eslabón">×</button>}
        </div>
      )}
    </div>
  )
}

function Cadena({
  cadena, numero, abierto, onAbrir, onCerrar, onCambio, onQuitar, onRecalcular,
}: {
  cadena: CadenaCausal
  numero: number
  /** Campo en edición dentro de esta cadena, si hay alguno. */
  abierto: Campo | null
  onAbrir: (campo: Campo) => void
  onCerrar: () => void
  onCambio: (campo: keyof CadenaCausal, valor: string | string[]) => void
  onQuitar: () => void
  /** conservar = cuántos porqués se dejan intactos antes de re-derivar. */
  onRecalcular: (conservar: number) => void
}) {
  const porques = cadena.porques

  /** Guarda y, si el texto cambió, vuelve a bajar la cadena desde ese punto. */
  const guardar = (campo: keyof CadenaCausal, valor: string, conservar?: number) => {
    onCerrar()
    const previo = campo === 'porques' ? '' : (cadena[campo] as string)
    if (valor === previo) return
    onCambio(campo, valor)
    if (conservar !== undefined) onRecalcular(conservar)
  }

  const guardarPorque = (i: number, valor: string) => {
    onCerrar()
    if (valor === porques[i]) return
    const nuevos = porques.map((x, j) => (j === i ? valor : x))
    onCambio('porques', nuevos)
    onRecalcular(i + 1)
  }

  return (
    <div className="cadena">
      <div className="cadena-h">
        <span className="frente-n">{String(numero).padStart(2, '0')}</span>
        <span className="cadena-o">{cadena.origen}</span>
        {cadena.propia && <span className="cadena-p">Del consultor</span>}
        <button className="bloque-x" onClick={onQuitar} aria-label="Quitar cadena">×</button>
      </div>

      <Nivel
        etiqueta="Síntoma"
        valor={cadena.sintoma}
        abierto={abierto === 'sintoma'}
        onAbrir={() => onAbrir('sintoma')}
        onGuardar={(v) => guardar('sintoma', v, 0)}
        placeholder="Lo que el cliente ve y nombra, en sus palabras."
      />

      {porques.map((p, i) => (
        <Nivel
          key={i}
          etiqueta="¿Por qué?"
          valor={p}
          abierto={abierto === i}
          onAbrir={() => onAbrir(i)}
          onGuardar={(v) => guardarPorque(i, v)}
          onQuitar={() => onCambio('porques', porques.filter((_, j) => j !== i))}
          placeholder="Porque…"
        />
      ))}

      <button className="cadena-mas" onClick={() => { onCambio('porques', [...porques, '']); onAbrir(porques.length) }}>
        + Bajar un eslabón
      </button>

      <div className="root">
        <div className="rl">Causa raíz</div>
        <Nivel
          etiqueta=""
          valor={cadena.causaRaiz}
          abierto={abierto === 'causaRaiz'}
          onAbrir={() => onAbrir('causaRaiz')}
          onGuardar={(v) => guardar('causaRaiz', v)}
          clase="rt"
          placeholder="El mecanismo que produce todo lo anterior."
        />
        <div className="root-sec">
          <Nivel
            etiqueta="Por qué se detiene aquí"
            valor={cadena.porQueAhi}
            abierto={abierto === 'porQueAhi'}
            onAbrir={() => onAbrir('porQueAhi')}
            onGuardar={(v) => guardar('porQueAhi', v)}
            placeholder="Qué hace que este eslabón sea accionable y el siguiente no."
          />
        </div>
      </div>

      <div className="cadena-imp">
        <Nivel
          etiqueta="Implicación para el plan"
          valor={cadena.implicacion}
          abierto={abierto === 'implicacion'}
          onAbrir={() => onAbrir('implicacion')}
          onGuardar={(v) => guardar('implicacion', v)}
          placeholder="Qué pasa si el plan ataca el síntoma en lugar de esto."
        />
      </div>
    </div>
  )
}

export function Paso08CausaRaiz() {
  const { cliente, plan, mapa, costo, temas, respuestas, causas, setCausas } = useExpediente()
  const [instruccion, setInstruccion] = useState('')
  /** Qué renglón, de qué cadena, está abierto a edición. */
  const [editando, setEditando] = useState<{ id: string; campo: Campo } | null>(null)
  const [recalculando, setRecalculando] = useState(false)
  const [errorRe, setErrorRe] = useState('')

  const generar = async () => {
    setCausas(() => null)
    const r = await analizarCausaRaiz({
      cliente: cliente,
      declaracion: DECLARACION_CLIENTE,
      plan,
      mapa,
      costo,
      temas: temas.map((t) => ({ tema: t.tema, diagnostico: t.diagnostico })),
      respuestas,
      instruccion: instruccion.trim(),
    })
    setCausas(() => r)
  }

  const editar = (id: string, campo: keyof CadenaCausal, valor: string | string[]) =>
    setCausas((c) => (c ? {
      ...c,
      cadenas: c.cadenas.map((x) => (x.id === id ? { ...x, [campo]: valor } : x)),
    } : c))

  const quitar = (id: string) =>
    setCausas((c) => (c ? { ...c, cadenas: c.cadenas.filter((x) => x.id !== id) } : c))

  /** Una cadena en blanco, para lo que el consultor ve y el motor no. */
  const agregar = () =>
    setCausas((c) => {
      const nueva: CadenaCausal = {
        id: `propia-${(c?.cadenas.length ?? 0) + 1}`,
        origen: 'Cadena del consultor',
        sintoma: '',
        porques: [''],
        causaRaiz: '',
        porQueAhi: '',
        implicacion: '',
        propia: true,
      }
      return c ? { ...c, cadenas: [...c.cadenas, nueva] } : { cadenas: [nueva], convergencia: null }
    })

  /**
   * El consultor corrigió un eslabón: se conserva lo que él escribió y el motor
   * vuelve a derivar de ahí hacia abajo, para que la causa raíz siga siguiéndose
   * de sus propias premisas.
   */
  const recalcular = async (cadena: CadenaCausal, conservar: number) => {
    if (!hayCredencial()) {
      setErrorRe('Falta la clave de API para recalcular.')
      return
    }
    setRecalculando(true)
    setErrorRe('')
    try {
      const r = await recalcularCadena({
        cliente: cliente, plan, mapa, respuestas, cadena, conservar,
      })
      setCausas((c) => (c ? {
        ...c,
        cadenas: c.cadenas.map((x) => (x.id === cadena.id ? { ...x, ...r } : x)),
      } : c))
    } catch (e) {
      setErrorRe(e instanceof Error ? e.message : 'No se pudo recalcular.')
    } finally {
      setRecalculando(false)
    }
  }

  const cadenas = causas?.cadenas ?? []

  return (
    <>
      <EncabezadoPaso paso="Paso 06 · Causa raíz" titulo="La causa raíz es" />

      <BloqueIA
        titulo="Cadenas de causalidad"
        fases={FASES}
        generar={generar}
        hayResultado={cadenas.length > 0}
        siempreAbierto
        deshabilitado={!plan?.frentes.length}
        textoDeshabilitado="Falta el diagnóstico inicial"
        etiquetaGenerar="Bajar las cadenas"
        nota={`${MODELO_IA} · esfuerzo alto · todo lo de abajo es editable`}
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
              placeholder="Pon una condición y vuelve a generar. Ojo: regenerar reemplaza lo que hayas editado a mano."
              onChange={(e) => setInstruccion(e.target.value)}
            />
          </>
        )}
      >
        {recalculando && <ProgresoIA fases={FASES_RECALCULO} />}
        {errorRe && <div className="modal-error">{errorRe}</div>}

        {cadenas.map((c, i) => (
          <Cadena
            key={c.id}
            cadena={c}
            numero={i + 1}
            abierto={editando?.id === c.id ? editando.campo : null}
            onAbrir={(campo) => setEditando({ id: c.id, campo })}
            onCerrar={() => setEditando(null)}
            onCambio={(campo, valor) => editar(c.id, campo, valor)}
            onQuitar={() => quitar(c.id)}
            onRecalcular={(conservar) => recalcular(c, conservar)}
          />
        ))}

        <button className="tema-nuevo-btn" onClick={agregar}>+ Agregar una cadena propia</button>

        {causas?.convergencia && (
          <>
            <div className="rad-sub">Dónde convergen</div>
            <div className="plan-lectura">{causas.convergencia}</div>
          </>
        )}
      </BloqueIA>

      <NotaConsultor rotulo="Nota de método:">
        una causa raíz sobre la que el cliente no puede actuar el lunes está mal cortada. Si la cadena
        termina en "falta cultura" o "el mercado está difícil", hay que bajar otro eslabón hasta dar con
        quién decide, con qué información y contra qué medida — ahí sí se puede intervenir.
      </NotaConsultor>
    </>
  )
}
