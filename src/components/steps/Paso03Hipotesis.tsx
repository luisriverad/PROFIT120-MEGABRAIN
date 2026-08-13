import { Fragment, useMemo, useState } from 'react'
import type { PreguntaGenerada } from '@/types'
import { CLIENTE, DECLARACION_CLIENTE, HIPOTESIS_CLIENTE } from '@/data/caso'
import { MODELO_IA, generarBateria, hayCredencial, preguntasDelTema } from '@/lib/ia'
import { Card, EncabezadoPaso, PreguntaConTexto } from '@/components/ui/Primitivos'
import { BateriaPreguntas } from '@/components/ui/BateriaPreguntas'
import { TemaAbiertoBloque } from '@/components/ui/TemaAbierto'
import { LlaveIA } from '@/components/ui/LlaveIA'
import { ProgresoIA } from '@/components/ui/ProgresoIA'
import { useExpediente } from '@/estado/Expediente'

/**
 * Batería de contexto profundo.
 *
 * Dos cosas distintas conviven aquí. Arriba, las preguntas que el motor escribió
 * sobre los tres frentes del plan: es el guion de la sesión. Abajo, los temas que
 * el cliente abre por su cuenta —"eso está bien, pero yo también quiero ver…"—,
 * que corren como diagnósticos chicos e independientes, con sus propias rondas
 * de preguntas y su propio dictamen.
 */

const FASES = [
  'Leyendo los tres frentes del plan',
  'Separando lo que los números ya contestan',
  'Buscando el cómo y el quién detrás de cada cifra',
  'Escribiendo las preguntas',
  'Ordenándolas de lo fácil a lo incómodo',
  'Cerrando',
]

export function Paso03Hipotesis() {
  const {
    mapa, plan, bateria, setBateria, respuestas, setRespuestas, temas, setTemas,
  } = useExpediente()

  const [hipotesis, setHipotesis] = useState(HIPOTESIS_CLIENTE.valor)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pidiendoLlave, setPidiendoLlave] = useState(false)
  const [tema, setTema] = useState('')
  const [abriendoTema, setAbriendoTema] = useState(false)

  const responder = (pregunta: string, valor: string) =>
    setRespuestas((r) => ({ ...r, [pregunta]: valor }))

  const generar = async () => {
    if (!hayCredencial()) { setPidiendoLlave(true); return }
    setCargando(true)
    setError('')
    try {
      setBateria(await generarBateria({
        cliente: CLIENTE, declaracion: DECLARACION_CLIENTE, plan, mapa,
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo escribir la batería.')
    } finally {
      setCargando(false)
    }
  }

  /** Abre un tema nuevo con su primera ronda de preguntas. */
  const abrirTema = async () => {
    const texto = tema.trim()
    if (!texto) return
    if (!hayCredencial()) { setPidiendoLlave(true); return }
    setCargando(true)
    setError('')
    try {
      const preguntas = await preguntasDelTema({
        cliente: CLIENTE, plan, mapa, tema: texto, previas: [],
      })
      setTemas((t) => [
        ...t,
        { id: `${t.length}-${texto.slice(0, 24)}`, tema: texto, preguntas, diagnostico: null },
      ])
      setTema('')
      setAbriendoTema(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el tema.')
    } finally {
      setCargando(false)
    }
  }

  /** Las preguntas del plan, agrupadas por frente y en el orden en que llegaron. */
  const porFrente = useMemo(() => {
    const grupos: { frente: string; preguntas: PreguntaGenerada[] }[] = []
    for (const p of bateria?.preguntas ?? []) {
      const ultimo = grupos[grupos.length - 1]
      if (ultimo?.frente === p.frente) ultimo.preguntas.push(p)
      else grupos.push({ frente: p.frente, preguntas: [p] })
    }
    return grupos
  }, [bateria])

  const total = bateria?.preguntas.length ?? 0

  return (
    <>
      <EncabezadoPaso paso="Paso 03 · Hipótesis del cliente" titulo="¿Por qué crees que pasó esto?" />

      {cargando && <ProgresoIA fases={FASES} />}

      <Card titulo="Batería de contexto profundo">
        <div className="bat-h">
          <span className="bat-origen">
            {plan
              ? <>Escrita sobre los tres frentes del análisis profundo: <b>{plan.frentes.map((f) => f.nombre).join(' · ')}</b></>
              : 'Todavía no hay análisis profundo en el paso 02. La batería se arma con lo que haya.'}
          </span>
          {!bateria && (
            <button className="prof-btn-x" onClick={generar} disabled={cargando}>Generar batería</button>
          )}
        </div>

        {pidiendoLlave && <LlaveIA onListo={() => setPidiendoLlave(false)} />}
        {error && <div className="modal-error">{error}</div>}

        {porFrente.map((g, gi) => (
          <Fragment key={g.frente}>
            <div className="bloque-t">
              <span className="bloque-n">{String(gi + 1).padStart(2, '0')}</span>
              <span className="bloque-nm">{g.frente}</span>
              <span className="bloque-c">{g.preguntas.length} preguntas</span>
            </div>
            <BateriaPreguntas preguntas={g.preguntas} respuestas={respuestas} onRespuesta={responder} />
          </Fragment>
        ))}

        <div className="bloque-t">
          <span className="bloque-n">{String(porFrente.length + 1).padStart(2, '0')}</span>
          <span className="bloque-nm">Cierre</span>
        </div>
        <div className="qlist">
          <PreguntaConTexto {...HIPOTESIS_CLIENTE} valor={hipotesis} onChange={setHipotesis} />
        </div>

        <div className="tema-foot">
          <span><b>{total}</b> preguntas en <b>{porFrente.length}</b> frentes del plan</span>
          <span className="tema-foot-list">{MODELO_IA}</span>
        </div>
      </Card>

      {/* Los temas del cliente viven fuera de la batería: cada uno se diagnostica solo. */}
      {temas.map((t, i) => (
        <Card key={t.id}>
          <TemaAbiertoBloque
            tema={t}
            numero={porFrente.length + 2 + i}
            cliente={CLIENTE}
            plan={plan}
            mapa={mapa}
            respuestas={respuestas}
            onRespuesta={responder}
            onPreguntas={(nuevas) => setTemas((ts) => ts.map((x) => (
              x.id === t.id ? { ...x, preguntas: [...x.preguntas, ...nuevas] } : x
            )))}
            onDiagnostico={(d) => setTemas((ts) => ts.map((x) => (
              x.id === t.id ? { ...x, diagnostico: d } : x
            )))}
            onQuitar={() => setTemas((ts) => ts.filter((x) => x.id !== t.id))}
          />
        </Card>
      ))}

      <div className="tema-nuevo">
        {abriendoTema ? (
          <>
            <label>¿Qué tema quiere abrir el cliente?</label>
            <textarea
              autoFocus
              value={tema}
              placeholder="En sus palabras. Ej.: “eso está bien, pero también quiero tratar el tema del riesgo legal”."
              onChange={(e) => setTema(e.target.value)}
            />
            <div className="tema-nuevo-btns">
              <button className="btn-ghost" onClick={() => { setAbriendoTema(false); setTema('') }}>
                Cancelar
              </button>
              <button className="btn-solido" onClick={abrirTema} disabled={!tema.trim() || cargando}>
                Abrir tema
              </button>
            </div>
          </>
        ) : (
          <button className="tema-nuevo-btn" onClick={() => setAbriendoTema(true)}>
            + Abrir otro tema
          </button>
        )}
      </div>
    </>
  )
}
