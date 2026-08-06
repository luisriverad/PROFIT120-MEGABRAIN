import { HALLAZGOS } from '@/data/caso'
import { EncabezadoPaso, TarjetaHallazgo } from '@/components/ui/Primitivos'

export function Paso05Diagnostico() {
  return (
    <>
      <EncabezadoPaso
        paso="Paso 05 · Diagnóstico inicial"
        titulo="Yo creo que…"
        entrada="Lectura del motor sobre las ocho dimensiones profundas, contrastada contra la información cargada. Cada hallazgo trae su evidencia numérica para que sea discutible, no opinable."
      />
      {HALLAZGOS.map((h) => <TarjetaHallazgo key={h.dimension} {...h} />)}
    </>
  )
}
