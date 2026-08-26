import { useState } from 'react'
import { DECLARACION_CLIENTE } from '@/data/caso'
import { RAZONES, formatearCampo, valoresDelEjercicio } from '@/data/finanzas'
import { benchmarkDelSector } from '@/data/benchmarks'
import { cuantificarInaccion } from '@/lib/ia'
import { EncabezadoPaso, NotaConsultor } from '@/components/ui/Primitivos'
import { BloqueIA } from '@/components/ui/BloqueIA'
import { useExpediente } from '@/estado/Expediente'

/**
 * Costo de la inacción.
 *
 * Un renglón por cada frente del diagnóstico inicial, para que lo que se va a
 * arreglar y lo que se está perdiendo sean la misma lista. El total no se le
 * pide a la IA: se suma aquí, igual que el porcentaje sobre la facturación y el
 * múltiplo de la utilidad. La aritmética no se delega.
 */

const FASES = [
  'Leyendo los tres frentes del diagnóstico',
  'Recuperando las cifras de la radiografía',
  'Aislando lo controlable de lo que no lo es',
  'Poniéndole pesos a cada frente',
  'Declarando los supuestos',
  'Cerrando',
]

const CONDICIONES = [
  'Sé más conservador: usa los supuestos que den la cifra más baja.',
  'Cuantifica también lo que se recupera el primer trimestre.',
  'El dueño no cree en el costo financiero: cuantifícalo solo con caja.',
]

export function Paso07Costo() {
  const { cliente, campos, ejercicios, mapa, plan, costo, setCosto, respuestas } = useExpediente()
  const [instruccion, setInstruccion] = useState('')

  const generar = async () => {
    setCosto(await cuantificarInaccion({
      cliente: cliente,
      declaracion: DECLARACION_CLIENTE,
      plan,
      mapa,
      campos,
      ejercicios,
      razones: RAZONES,
      benchmark: benchmarkDelSector(cliente.sector),
      respuestas,
      instruccion: instruccion.trim(),
    }))
  }

  // El total y sus referencias se calculan aquí: son sumas y divisiones, y
  // delegarlas abre la puerta a que la cifra con la que decide el cliente no
  // cuadre con sus propios renglones.
  const total = costo?.frentes.reduce((s, f) => s + (f.monto ?? 0), 0) ?? 0
  const anual = valoresDelEjercicio(campos, 0, ejercicios[0]?.meses ?? 12)
  const sobreVenta = anual.ventas ? (total / anual.ventas) * 100 : null
  const vecesUtilidad = anual.utilidadNeta > 0 ? total / anual.utilidadNeta : null

  return (
    <>
      <EncabezadoPaso paso="Paso 05 · Costo de la inacción" titulo="Lo que te está costando" />

      <BloqueIA
        titulo="Costo de la inacción"
        fases={FASES}
        generar={generar}
        hayResultado={Boolean(costo)}
        siempreAbierto
        deshabilitado={!plan?.frentes.length}
        textoDeshabilitado="Falta el diagnóstico inicial"
        etiquetaGenerar="Cuantificar"
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
              placeholder="Pon una condición y vuelve a cuantificar: “el costo de deuda real es 15.5%, no 13%”…"
              onChange={(e) => setInstruccion(e.target.value)}
            />
          </>
        )}
      >
        {costo && (
          <>
            <div className="cost-total">
              <div className="lbl">Costo anual de sostener la situación actual</div>
              <div className="val">{formatearCampo(total, 'mxn')}</div>
              <div className="unit">
                {sobreVenta !== null && <>{sobreVenta.toFixed(1)}% de la facturación anualizada</>}
                {sobreVenta !== null && vecesUtilidad !== null && ' · '}
                {vecesUtilidad !== null && <>{vecesUtilidad.toFixed(1)} veces la utilidad neta declarada</>}
              </div>
            </div>

            {costo.frentes.map((f, i) => (
              <div key={f.frente} className="cfrente">
                <div className="cfrente-h">
                  <span className="frente-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="cfrente-t">{f.frente}</span>
                  <span className="cfrente-v">{formatearCampo(f.monto, 'mxn')}</span>
                </div>
                <p className="cfrente-b">{f.base}</p>

                {f.supuestos.length > 0 && (
                  <div className="cfrente-sec">
                    <span className="riesgo-lbl">Supuestos</span>
                    <ul className="riesgo-ev">
                      {f.supuestos.map((sup, k) => <li key={k}>{sup}</li>)}
                    </ul>
                  </div>
                )}

                <div className="cfrente-sec">
                  <span className="riesgo-lbl">Qué se recupera</span>
                  {f.recuperable}
                </div>
              </div>
            ))}

            {costo.fueraDeLaSuma.length > 0 && (
              <>
                <div className="rad-sub">Lo que no entra a la suma</div>
                <div className="stock-row">
                  {costo.fueraDeLaSuma.map((m) => (
                    <div className="stock" key={m.etiqueta}>
                      <div className="sl">{m.etiqueta}</div>
                      <div className="sv">{m.valor}</div>
                      <div className="sd">{m.detalle}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </BloqueIA>

      {costo?.lectura && (
        <NotaConsultor rotulo="Lectura para la sesión:">{costo.lectura}</NotaConsultor>
      )}
    </>
  )
}
