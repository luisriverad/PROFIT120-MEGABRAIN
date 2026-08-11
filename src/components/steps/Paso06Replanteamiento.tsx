import { useState } from 'react'
import { CARGA_ADICIONAL, VALIDACIONES } from '@/data/caso'
import type { ValidacionCliente } from '@/types'
import { Card, EncabezadoPaso, FilaDocumento, NotaConsultor, TarjetaHallazgo } from '@/components/ui/Primitivos'

const ACCIONES: { clave: ValidacionCliente; activo: string; inactivo: string }[] = [
  { clave: 'confirmado', activo: 'Confirmado', inactivo: 'Confirmado' },
  { clave: 'matizado', activo: 'Matizado', inactivo: 'Matizar' },
  { clave: 'descartado', activo: 'Descartado', inactivo: 'Descartar' },
]

export function Paso06Replanteamiento() {
  const [validaciones, setValidaciones] = useState(VALIDACIONES)

  const marcar = (i: number, v: ValidacionCliente) =>
    setValidaciones((vs) => vs.map((x, j) => (j === i ? { ...x, validacion: v } : x)))

  return (
    <>
      <EncabezadoPaso
        paso="Paso 06 · Replanteamiento"
        titulo="¿Tú qué opinas?"
        entrada="El cliente valida, matiza o descarta cada hallazgo. Lo que él aporte aquí ajusta las cifras del paso 07 — el costo se calcula con sus números, no con los del consultor."
      />

      <NotaConsultor rotulo="Nota de método:">
        este paso es lo que separa un diagnóstico de una imposición. Cuando el cliente confirma el
        hallazgo con su propio dato, la cifra del paso 07 deja de ser discutible.
      </NotaConsultor>

      {validaciones.map((v, i) => (
        <TarjetaHallazgo
          key={v.dimension}
          dimension={v.dimension}
          severidad={v.severidad}
          lectura={v.resumen}
        >
          <div className="finding-acts">
            {ACCIONES.map((a) => (
              <button
                key={a.clave}
                className={`act ${v.validacion === a.clave ? 'on' : ''}`}
                onClick={() => marcar(i, a.clave)}
              >
                {v.validacion === a.clave ? a.activo : a.inactivo}
              </button>
            ))}
          </div>
          <div className="finding-ev" style={{ marginTop: 12 }}>{v.aporte}</div>
        </TarjetaHallazgo>
      ))}

      <Card titulo="Carga adicional derivada de la sesión">
        {CARGA_ADICIONAL.map((d) => <FilaDocumento key={d.nombre} doc={d} />)}
      </Card>
    </>
  )
}
