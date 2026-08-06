import { COSTO_TOTAL, INDICADORES_STOCK, LINEAS_COSTO } from '@/data/caso'
import { EncabezadoPaso, NotaConsultor } from '@/components/ui/Primitivos'

export function Paso07Costo() {
  return (
    <>
      <EncabezadoPaso
        paso="Paso 07 · Costo de la inacción"
        titulo="Lo que te está costando"
        entrada="Cada hallazgo confirmado se traduce a pesos, tiempo y recurso humano. Esta es la cifra con la que el cliente toma la decisión."
      />

      <div className="cost-board">
        <div className="cost-q">¿Cuánto te está costando esto y cómo lo vas a solucionar?</div>
        <div className="cost-qs">{COSTO_TOTAL.encabezado}</div>

        <div className="cost-total">
          <div className="lbl">Costo anual de sostener la situación actual</div>
          <div className="val">{COSTO_TOTAL.monto}</div>
          <div className="unit">{COSTO_TOTAL.contexto}</div>
        </div>

        <div className="cost-lines">
          {LINEAS_COSTO.map((l) => (
            <div className="cost-line" key={l.concepto}>
              <div>
                <div className="cl-name">{l.concepto}</div>
                <div className="cl-basis">{l.base}</div>
              </div>
              <div className="cl-val">{l.monto}</div>
            </div>
          ))}
        </div>

        <div className="cost-foot">
          La cifra no incluye capital inmovilizado ni venta potencial no capturada, que se reportan por
          separado para no duplicar el efecto financiero ya contado en liquidez.
        </div>
      </div>

      <div className="stock-row">
        {INDICADORES_STOCK.map((s) => (
          <div className="stock" key={s.etiqueta}>
            <div className="sl">{s.etiqueta}</div>
            <div className="sv">{s.valor}</div>
            <div className="sd">{s.detalle}</div>
          </div>
        ))}
      </div>

      <NotaConsultor rotulo="Lectura para la sesión:">
        el cliente pidió "vender más". Vender más al ritmo actual amplifica una pérdida de $29M anuales
        y consume una capacidad de crecimiento financiable de 6.4%. El crecimiento no es la solución —
        es el mecanismo que está acelerando el problema.
      </NotaConsultor>
    </>
  )
}
