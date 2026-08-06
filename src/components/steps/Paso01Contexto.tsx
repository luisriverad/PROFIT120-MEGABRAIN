import { useState } from 'react'
import { SECTORES } from '@/data/catalogo'
import {
  ANTECEDENTE, CAMPOS_FINANCIEROS, CLIENTE, EJERCICIOS, ESTRUCTURA_DECISION, TENDENCIAS,
} from '@/data/caso'
import { RAZONES, parsearCampo } from '@/data/finanzas'
import type { Tendencia } from '@/types'
import {
  Campo, CampoLista, CapturaFinanciera, Card, EncabezadoPaso, NotaConsultor,
  PreguntaConOpciones, PreguntaConTexto, TablaRazones,
} from '@/components/ui/Primitivos'

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

  const marcar = (i: number, valor: Tendencia) =>
    setTendencias((t) => t.map((f, j) => (j === i ? { ...f, valor } : f)))

  const editarCampo = (clave: string, ejercicio: number, texto: string) =>
    setCampos((cs) => cs.map((c) => (
      c.clave === clave
        ? { ...c, valores: c.valores.map((v, j) => (j === ejercicio ? parsearCampo(texto) : v)) }
        : c
    )))

  const enSesion = campos.filter((c) => c.fuente === 'sesion')
  const deCaratula = campos.filter((c) => c.fuente === 'caratula')
  const rentabilidad = RAZONES.filter((r) => r.grupo === 'rentabilidad')
  const reales = RAZONES.filter((r) => r.grupo === 'real')

  return (
    <>
      <EncabezadoPaso
        paso="Paso 01 · Contexto"
        titulo="Cuéntame"
        entrada="Antes de escuchar el problema, se fija el marco. Todo lo que viene después se calcula contra estos números, así que ninguna cifra aquí es opcional."
      />

      <Card titulo="Expediente del cliente" subtitulo="Base de cálculo para todas las cuantificaciones posteriores.">
        <div className="grid3">
          <Campo etiqueta="Razón social" valor={CLIENTE.razonSocial} />
          <CampoLista etiqueta="Sector" valor={sector} opciones={SECTORES} onChange={setSector} />
          <Campo etiqueta="Años de operación" valor={CLIENTE.aniosOperacion} />
        </div>
        <div className="grid2">
          <Campo etiqueta="Clientes que hacen el 80% de la venta" valor={CLIENTE.clientes80} />
          <Campo etiqueta="Líneas de producto activas" valor={CLIENTE.lineasActivas} />
        </div>
      </Card>

      <Card
        titulo="Radiografía financiera"
        subtitulo="Doce datos por cierre de ejercicio. Es el mínimo que sostiene todo lo demás: de aquí salen las razones de rentabilidad y el capital de trabajo sin volver a preguntar nada."
      >
        <div className="rad-grupo">
          <div className="rad-h">
            <span className="rad-tag ok">Se contesta en sesión</span>
            <span className="rad-note">Siete datos que el cliente da de memoria. Si la entrevista solo alcanza para esto, ya hay radiografía parcial.</span>
          </div>
          <CapturaFinanciera ejercicios={EJERCICIOS} campos={enSesion} onChange={editarCampo} />
        </div>

        <div className="rad-grupo">
          <div className="rad-h">
            <span className="rad-tag wait">Requiere carátula del estado financiero</span>
            <span className="rad-note">Cinco datos que casi nadie trae de memoria. Se piden al contador en la misma llamada; sin ellos quedan en blanco ROS, ROIC y el ciclo de capital de trabajo.</span>
          </div>
          <CapturaFinanciera ejercicios={EJERCICIOS} campos={deCaratula} onChange={editarCampo} />
        </div>

        <div className="rad-grupo">
          <div className="rad-h">
            <span className="rad-tag calc">Se calcula solo</span>
            <span className="rad-note">Ninguna de estas se pregunta. Si un renglón sale en blanco es porque falta un dato de arriba, y ahí dice cuál.</span>
          </div>
          <div className="rad-sub">Rentabilidad</div>
          <TablaRazones ejercicios={EJERCICIOS} campos={campos} razones={rentabilidad} />
          <div className="rad-sub">Razones reales — dónde está el dinero</div>
          <TablaRazones ejercicios={EJERCICIOS} campos={campos} razones={reales} />
        </div>
      </Card>

      <NotaConsultor rotulo="Nota de método:">
        el estado de resultados dice si el negocio gana; el capital de trabajo operativo dice si el
        dinero existe. Una empresa con ROS positivo y capital de trabajo creciendo más rápido que la
        venta está financiando su propio crecimiento con deuda, y esa es la conversación que el
        cliente no vino a tener. Si el ROIC queda por debajo de la tasa a la que le presta el banco,
        cada peso vendido de más destruye valor: ahí se cae el "necesito vender más" del paso 02.
      </NotaConsultor>

      <Card
        titulo="Lectura rápida de tendencia"
        subtitulo="Últimos 12 meses. Primera capa: no busca precisión, busca dirección. Se responde en sesión, sin abrir un solo archivo."
      >
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

      <NotaConsultor rotulo="Nota de método:">
        el valor de esta tabla no está en cada renglón, está en los cruces. Ventas arriba con utilidad
        abajo es rentabilidad erosionada. Inventario y cuentas por cobrar arriba con deuda arriba es
        capital de trabajo detenido. Nómina arriba con ventas planas es rentabilidad del recurso
        humano. Tres cruces marcados aquí definen por dónde entra el diagnóstico del paso 05.
      </NotaConsultor>

      <Card titulo="Estructura de decisión" subtitulo="Quién decide determina qué tan rápido se ejecuta el plan.">
        <div className="qlist">
          {ESTRUCTURA_DECISION.map((p) => (
            <PreguntaConOpciones key={p.pregunta} {...p} />
          ))}
          <PreguntaConTexto {...ANTECEDENTE} />
        </div>
      </Card>
    </>
  )
}
