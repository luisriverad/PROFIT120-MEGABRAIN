import { createContext, useContext, useState, type ReactNode } from 'react'
import type {
  Accountability, ArchivoAdjunto, BateriaContexto, CampoFinanciero, CausasRaiz, CostoInaccion,
  DetalleAccion, Ejercicio, FichaCliente, MapaRiesgos, PlanArranque, PlanTrabajo, TemaAbierto,
} from '@/types'
import {
  BATERIA_DEMO, CAMPOS_FINANCIEROS, CAUSAS_DEMO, CLIENTE, COSTO_DEMO, DIMENSIONES_ACTIVAS, EJERCICIOS,
  ACCOUNTABILITY_DEMO, DETALLES_DEMO, MAPA_DEMO, PLAN_DEMO, PLAN_TRABAJO_DEMO,
} from '@/data/caso'

/**
 * Lo que un paso descubre y el siguiente necesita.
 *
 * Hasta ahora cada pantalla vivía sola. El análisis a profundidad del paso 01
 * rompe eso: su mapa de riesgos es lo que preselecciona las dimensiones del
 * paso 02 y, más adelante, lo que alimenta el diagnóstico del 05. Guardarlo aquí
 * también significa que navegar entre pasos no lo pierde.
 */
interface Expediente {
  /**
   * La ficha técnica del cliente. Se captura en la barra lateral, fuera de la
   * ruta, porque no es de ningún paso: es el encabezado de todos. El sector
   * además elige el benchmark contra el que se compara la radiografía.
   */
  cliente: FichaCliente
  setCliente: (f: (c: FichaCliente) => FichaCliente) => void
  /** La radiografía: se captura en el paso 01 y la leen todos los demás. */
  campos: CampoFinanciero[]
  setCampos: (f: (c: CampoFinanciero[]) => CampoFinanciero[]) => void
  ejercicios: Ejercicio[]
  setEjercicios: (f: (e: Ejercicio[]) => Ejercicio[]) => void
  mapa: MapaRiesgos | null
  setMapa: (m: MapaRiesgos | null) => void
  /** Los tres frentes que ordenan el trabajo de los pasos siguientes. */
  plan: PlanArranque | null
  setPlan: (p: PlanArranque | null) => void
  /** Las preguntas del paso 03, escritas a partir de esos frentes. */
  bateria: BateriaContexto | null
  setBateria: (b: BateriaContexto | null) => void
  /** Expediente digital: los estados financieros que respaldan la captura. */
  archivos: Record<string, ArchivoAdjunto[]>
  setArchivos: (f: (a: Record<string, ArchivoAdjunto[]>) => Record<string, ArchivoAdjunto[]>) => void
  /** Dimensiones del catálogo profundo: confirmadas por el consultor y descartadas de las sugeridas. */
  confirmadas: string[]
  setConfirmadas: (f: (c: string[]) => string[]) => void
  descartadas: string[]
  setDescartadas: (f: (d: string[]) => string[]) => void
  /** Dimensión escrita a mano por tema. */
  otros: Record<string, string>
  setOtros: (f: (o: Record<string, string>) => Record<string, string>) => void
  /** Lo que el cliente contestó en sesión, indexado por la pregunta. */
  respuestas: Record<string, string>
  setRespuestas: (f: (r: Record<string, string>) => Record<string, string>) => void
  /** Lo que cuesta al año no atender cada frente. */
  costo: CostoInaccion | null
  setCosto: (c: CostoInaccion | null) => void
  /** Las cadenas de causalidad, propuestas por el motor y editadas por el consultor. */
  causas: CausasRaiz | null
  setCausas: (f: (c: CausasRaiz | null) => CausasRaiz | null) => void
  /** El trabajo repartido en las cuatro ventanas. */
  trabajo: PlanTrabajo | null
  setTrabajo: (f: (t: PlanTrabajo | null) => PlanTrabajo | null) => void
  /** El instructivo de cada acción del plan, indexado por su id. */
  detalles: Record<string, DetalleAccion>
  setDetalles: (f: (d: Record<string, DetalleAccion>) => Record<string, DetalleAccion>) => void
  /** El cierre: qué queda medido y con quién, cuando el consultor se va. */
  cierre: Accountability | null
  setCierre: (f: (c: Accountability | null) => Accountability | null) => void
  /** Temas que el cliente abrió fuera del plan. Cada uno se diagnostica solo. */
  temas: TemaAbierto[]
  setTemas: (f: (t: TemaAbierto[]) => TemaAbierto[]) => void
}

const Ctx = createContext<Expediente | null>(null)

export function ExpedienteProvider({ children }: { children: ReactNode }) {
  // Arranca con el mapa del caso demostrativo, igual que el resto de la
  // aplicación. La primera corrida real lo reemplaza.
  const [cliente, setCliente] = useState<FichaCliente>(CLIENTE)
  const [campos, setCampos] = useState(CAMPOS_FINANCIEROS)
  const [ejercicios, setEjercicios] = useState(EJERCICIOS)
  const [mapa, setMapa] = useState<MapaRiesgos | null>(MAPA_DEMO)
  const [plan, setPlan] = useState<PlanArranque | null>(PLAN_DEMO)
  const [bateria, setBateria] = useState<BateriaContexto | null>(BATERIA_DEMO)
  const [archivos, setArchivos] = useState<Record<string, ArchivoAdjunto[]>>({})
  const [confirmadas, setConfirmadas] = useState<string[]>(DIMENSIONES_ACTIVAS)
  const [descartadas, setDescartadas] = useState<string[]>([])
  const [otros, setOtros] = useState<Record<string, string>>({})
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [costo, setCosto] = useState<CostoInaccion | null>(COSTO_DEMO)
  const [causas, setCausas] = useState<CausasRaiz | null>(CAUSAS_DEMO)
  const [trabajo, setTrabajo] = useState<PlanTrabajo | null>(PLAN_TRABAJO_DEMO)
  const [detalles, setDetalles] = useState<Record<string, DetalleAccion>>(DETALLES_DEMO)
  const [cierre, setCierre] = useState<Accountability | null>(ACCOUNTABILITY_DEMO)
  const [temas, setTemas] = useState<TemaAbierto[]>([])
  return (
    <Ctx.Provider value={{ cliente, setCliente, campos, setCampos, ejercicios, setEjercicios, mapa, setMapa, plan, setPlan, bateria, setBateria, archivos, setArchivos, confirmadas, setConfirmadas, descartadas, setDescartadas, otros, setOtros,
      respuestas, setRespuestas, costo, setCosto, causas, setCausas, trabajo, setTrabajo, detalles, setDetalles, cierre, setCierre, temas, setTemas }}>
      {children}
    </Ctx.Provider>
  )
}

export function useExpediente() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useExpediente requiere ExpedienteProvider')
  return ctx
}
