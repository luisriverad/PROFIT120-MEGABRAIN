import { Fragment, useState } from 'react'
import { SECTORES } from '@/data/catalogo'
import {
  ANTECEDENTE, CAMPOS_FINANCIEROS, CLIENTE, EJERCICIOS, ESTRUCTURA_DECISION, TENDENCIAS,
} from '@/data/caso'
import { RAZONES, parsearCampo } from '@/data/finanzas'
import { benchmarkDelSector } from '@/data/benchmarks'
import type { BenchmarkRazon, Razon, Tendencia } from '@/types'
import {
  Campo, CampoLista, CapturaFinanciera, Card, EncabezadoPaso, NotaConsultor,
  PreguntaConOpciones, PreguntaConTexto, TablaRazones,
} from '@/components/ui/Primitivos'
import { ModalPromedio } from '@/components/ui/ModalPromedio'

const OPCIONES_TENDENCIA: { texto: string; clave: Tendencia }[] = [
  { texto: 'Creció', clave: 'up' },
  { texto: 'Igual', clave: 'flat' },
  { texto: 'Bajó', clave: 'down' },
  { texto: 'No lo mide', clave: 'na' },
]

export function Paso01Contexto() {
  const [tendencias, setTendencias] = useState(TENDENCIAS)
  const [sector, setSector] = useState(CLIENTE.sector)
  const [campos, setCampos] = useState(CAMPOS_FINANCIEROS)
  /** Recálculos que la IA aplicó encima de la base precargada del sector. */
  const [ajustes, setAjustes] = useState<Record<string, BenchmarkRazon>>({})
  /** Grupo de razones abierto en la ventana de explicación, si hay alguno. */
  const [revision, setRevision] = useState<{ titulo: string; razones: Razon[] } | null>(null)
  /** El diagnóstico arranca cerrado: no interrumpe la captura hasta que se pide. */
  const [diagnostico, setDiagnostico] = useState(false)

  const cambiarSector = (nuevo: string) => {
    setSector(nuevo)
    // Los ajustes eran del sector anterior: mantenerlos mezclaría industrias.
    setAjustes({})
  }

  const marcar = (i: number, valor: Tendencia) =>
    setTendencias((t) => t.map((f, j) => (j === i ? { ...f, valor } : f)))

  const editarCampo = (clave: string, ejercicio: number, texto: string) =>
    setCampos((cs) => cs.map((c) => (
      c.clave === clave
        ? { ...c, valores: c.valores.map((v, j) => (j === ejercicio ? parsearCampo(texto) : v)) }
        : c
    )))

  const benchmark = benchmarkDelSector(sector, ajustes)

  /** Los cuatro bloques del diagnóstico, en el orden en que se leen. */
  const BLOQUES = [
    { titulo: 'Rentabilidad', razones: RAZONES.filter((r) => r.grupo === 'rentabilidad') },
    { titulo: 'Razones reales — dónde está el dinero', razones: RAZONES.filter((r) => r.grupo === 'real') },
    { titulo: 'Capital de trabajo en días', razones: RAZONES.filter((r) => r.grupo === 'dias') },
    { titulo: 'Caja y flujo — lo que sí llegó al banco', razones: RAZONES.filter((r) => r.grupo === 'caja') },
  ]

  return (
    <>
      <EncabezadoPaso
        paso="Paso 01 · Contexto"
        titulo="Cuéntame"
        entrada="Antes de escuchar el problema, se fija el marco. Todo lo que viene después se calcula contra estos números, así que ninguna cifra aquí es opcional."
      />

      <Card titulo="Expediente del cliente">
        <div className="grid3">
          <Campo etiqueta="Razón social" valor={CLIENTE.razonSocial} />
          <CampoLista etiqueta="Sector" valor={sector} opciones={SECTORES} onChange={cambiarSector} />
          <Campo etiqueta="Años de operación" valor={CLIENTE.aniosOperacion} />
        </div>
        <div className="grid2">
          <Campo etiqueta="Clientes que hacen el 80% de la venta" valor={CLIENTE.clientes80} />
          <Campo etiqueta="Líneas de producto activas" valor={CLIENTE.lineasActivas} />
        </div>
      </Card>

      <Card titulo="Radiografía financiera">
        {/*
          Una sola captura corrida. Los campos ya vienen ordenados por
          factibilidad —primero los siete que el cliente da de memoria, luego los
          cinco de carátula—, así que el orden de renglones no cambia.
        */}
        <CapturaFinanciera ejercicios={EJERCICIOS} campos={campos} onChange={editarCampo} />
      </Card>

      <Card titulo="Lectura rápida de tendencia">
        <table className="trend">
          <tbody>
            {tendencias.map((fila, i) => (
              <tr key={fila.concepto}>
                <td className="q">{fila.concepto}</td>
                <td className="o">
                  {OPCIONES_TENDENCIA.map((o) => (
                    <button
                      key={o.clave}
                      className={`topt ${fila.valor === o.clave ? `on ${o.clave}` : ''}`}
                      onClick={() => marcar(i, o.clave)}
                    >
                      {o.texto}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card titulo="Estructura de decisión">
        <div className="qlist">
          {ESTRUCTURA_DECISION.map((p) => (
            <PreguntaConOpciones key={p.pregunta} {...p} />
          ))}
          <PreguntaConTexto {...ANTECEDENTE} />
        </div>
      </Card>

      {/*
        Primero se recaba, al final se interpreta. Las razones calculadas cierran
        el paso en lugar de partir la captura a la mitad: el consultor termina de
        preguntar y hasta entonces abre la lectura.
      */}
      <div className={`diag ${diagnostico ? 'on' : ''}`}>
        <button className="diag-btn" onClick={() => setDiagnostico((d) => !d)} aria-expanded={diagnostico}>
          <span className="diag-btn-t">Primer diagnóstico financiero</span>
          <span className="diag-btn-x" aria-hidden="true">{diagnostico ? 'Cerrar' : 'Abrir'}</span>
        </button>

        {diagnostico && (
          <div className="diag-body">
            {BLOQUES.map((bloque) => (
              <Fragment key={bloque.titulo}>
                <div className="rad-sub">{bloque.titulo}</div>
                <TablaRazones
                  ejercicios={EJERCICIOS}
                  campos={campos}
                  razones={bloque.razones}
                  benchmark={benchmark}
                  onExplicar={() => setRevision(bloque)}
                />
              </Fragment>
            ))}

            <NotaConsultor rotulo="Nota de método:">
              el estado de resultados dice si el negocio gana; el capital de trabajo operativo dice si el
              dinero existe. Una empresa con ROS positivo y capital de trabajo creciendo más rápido que la
              venta está financiando su propio crecimiento con deuda, y esa es la conversación que el
              cliente no vino a tener. Si el ROIC queda por debajo de la tasa a la que le presta el banco,
              cada peso vendido de más destruye valor: ahí se cae el "necesito vender más" del paso 02.
            </NotaConsultor>
          </div>
        )}
      </div>

      {revision && (
        <ModalPromedio
          titulo={revision.titulo}
          sector={sector}
          razones={revision.razones}
          base={benchmark}
          onCerrar={() => setRevision(null)}
          onAplicar={(nuevos) => setAjustes((a) => ({ ...a, ...nuevos }))}
        />
      )}
    </>
  )
}
