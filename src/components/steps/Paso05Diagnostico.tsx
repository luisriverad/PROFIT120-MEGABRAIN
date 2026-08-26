import { TEMAS_DIMENSIONES } from '@/data/catalogo'
import { DECLARACION_CLIENTE } from '@/data/caso'
import { EncabezadoPaso } from '@/components/ui/Primitivos'
import { PlanArranque } from '@/components/ui/PlanArranque'
import { useExpediente } from '@/estado/Expediente'

/**
 * Diagnóstico inicial.
 *
 * Aquí aterriza el análisis profundo: lee las dimensiones que se marcaron en el
 * paso 02 junto con el mapa de riesgos del paso 01, y las reduce a tres frentes
 * en orden. Es el "yo creo que…" del método, ya sostenido con cifras.
 */
export function Paso05Diagnostico() {
  const { cliente, mapa, plan, setPlan, confirmadas, descartadas, otros } = useExpediente()

  const sugerida = (d: string) =>
    Boolean(mapa?.dimensionesEvidentes.includes(d))
    && !confirmadas.includes(d)
    && !descartadas.includes(d)

  /** Lo marcado en el paso 02, con el tema al que pertenece y quién lo puso. */
  const dimensiones = TEMAS_DIMENSIONES.flatMap((t) =>
    t.dimensiones
      .filter((d) => confirmadas.includes(d) || sugerida(d))
      .map((d) => ({
        nombre: d,
        tema: t.nombre,
        origen: confirmadas.includes(d) ? ('consultor' as const) : ('motor' as const),
      })))

  const propias = TEMAS_DIMENSIONES
    .filter((t) => otros[t.n]?.trim())
    .map((t) => ({ tema: t.nombre, texto: otros[t.n].trim() }))

  return (
    <>
      <EncabezadoPaso paso="Paso 04 · Diagnóstico inicial" titulo="Yo creo que…" />

      <PlanArranque
        cliente={cliente}
        declaracion={DECLARACION_CLIENTE}
        dimensiones={dimensiones}
        propias={propias}
        mapa={mapa}
        plan={plan}
        onPlan={setPlan}
      />
    </>
  )
}
