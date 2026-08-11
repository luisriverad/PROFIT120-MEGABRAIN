import { KPIS, RITMO } from '@/data/caso'
import { Card, EncabezadoPaso, FilaDocumento, NotaConsultor } from '@/components/ui/Primitivos'

export function Paso10Accountability() {
  return (
    <>
      <EncabezadoPaso
        paso="Paso 10 · Accountability"
        titulo="Los KPIs y sus responsables"
        entrada="Siete indicadores. Cada uno con un nombre propio, no un área. Si un indicador no tiene dueño nominal, no se instala."
      />

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th>Indicador crítico</th>
              <th>Línea base</th>
              <th>Meta 90 días</th>
              <th>Frec.</th>
              <th>Responsable nominal</th>
            </tr>
          </thead>
          <tbody>
            {KPIS.map((k) => (
              <tr key={k.indicador}>
                <td className="k">{k.indicador}</td>
                <td className="n">{k.base}</td>
                <td className="n">{k.meta}</td>
                <td className="n">{k.frecuencia}</td>
                <td className="r">{k.responsable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card titulo="Ritmo de sostenimiento">
        {RITMO.map((d) => <FilaDocumento key={d.nombre} doc={d} />)}
      </Card>

      <NotaConsultor rotulo="Cierre para el cliente:">
        sostener la situación actual cuesta $29.0M al año. El plan recupera $18.9M en los primeros 90
        días y libera $9.0M de capital de trabajo. La pregunta ya no es si conviene hacerlo, sino quién
        firma cada indicador.
      </NotaConsultor>
    </>
  )
}
