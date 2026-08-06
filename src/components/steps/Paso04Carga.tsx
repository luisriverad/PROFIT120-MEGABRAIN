import { DOCUMENTOS } from '@/data/caso'
import { Card, EncabezadoPaso, FilaDocumento, NotaConsultor } from '@/components/ui/Primitivos'

export function Paso04Carga() {
  return (
    <>
      <EncabezadoPaso
        paso="Paso 04 · Carga de información"
        titulo="Pásame tu información"
        entrada="Sin estos insumos el diagnóstico se queda en opinión. El motor marca qué falta y qué cálculo se bloquea por cada ausencia."
      />

      <Card>
        <div className="drop">
          <div className="dt">Arrastra los archivos del cliente</div>
          <div className="ds">Excel, PDF, CSV. Se extraen y validan contra el expediente del paso 01.</div>
        </div>
        {DOCUMENTOS.map((d) => <FilaDocumento key={d.nombre} doc={d} />)}
      </Card>

      <NotaConsultor rotulo="Bloqueo activo:">
        sin capacidad instalada por centro de trabajo no se puede calcular la venta potencial no
        capturada. Es el dato que más mueve la cifra final — vale la pena pedirlo antes de la
        siguiente sesión.
      </NotaConsultor>
    </>
  )
}
