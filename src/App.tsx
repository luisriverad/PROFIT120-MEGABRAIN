import { useEffect, useRef, useState } from 'react'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'
import { RightRail } from '@/components/RightRail'
import { StepNav } from '@/components/StepNav'
import { Footer } from '@/components/Footer'
import {
  Paso01Contexto, Paso02Problema, Paso03Hipotesis, Paso04Carga, Paso05Diagnostico,
  Paso06Replanteamiento, Paso07Costo, Paso08CausaRaiz, Paso09Plan, Paso10Accountability,
} from '@/components/steps'

const PANTALLAS = [
  Paso01Contexto, Paso02Problema, Paso03Hipotesis, Paso04Carga, Paso05Diagnostico,
  Paso06Replanteamiento, Paso07Costo, Paso08CausaRaiz, Paso09Plan, Paso10Accountability,
]

type Vista = 'diagnostico' | 'biblioteca' | 'expedientes'

export default function App() {
  const [paso, setPaso] = useState(0)
  const [vista, setVista] = useState<Vista>('diagnostico')
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    main.current?.scrollTo({ top: 0 })
  }, [paso])

  const Pantalla = PANTALLAS[paso]

  return (
    <div className="shell">
      <TopBar />
      <div className="body-row">
        <Sidebar pasoActual={paso} onPaso={setPaso} vista={vista} onVista={setVista} />
        <main className="main" ref={main}>
          <div className="main-inner">
            <Pantalla />
            <StepNav paso={paso} onPaso={setPaso} />
          </div>
        </main>
        <RightRail paso={paso} />
      </div>
      <Footer />
    </div>
  )
}
