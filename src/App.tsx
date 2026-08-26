import { useEffect, useRef, useState } from 'react'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'
import { PantallaFicha } from '@/components/PantallaFicha'
import { StepNav } from '@/components/StepNav'
import { Footer } from '@/components/Footer'
import { ExpedienteProvider } from '@/estado/Expediente'
import {
  Paso01Contexto, Paso02Problema, Paso03Hipotesis, Paso05Diagnostico,
  Paso07Costo, Paso08CausaRaiz, Paso09Plan, Paso10Accountability,
} from '@/components/steps'

const PANTALLAS = [
  Paso01Contexto, Paso02Problema, Paso03Hipotesis, Paso05Diagnostico,
  Paso07Costo, Paso08CausaRaiz, Paso09Plan, Paso10Accountability,
]

type Vista = 'diagnostico' | 'expedientes'

export default function App() {
  const [paso, setPaso] = useState(0)
  /**
   * La ficha del cliente no es un paso de la ruta: se abre desde su propio
   * botón y reemplaza la columna central mientras está encendida. Elegir un
   * paso la cierra, que es lo que espera quien viene bajando por la ruta.
   */
  const [ficha, setFicha] = useState(false)
  const [vista, setVista] = useState<Vista>('diagnostico')
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    main.current?.scrollTo({ top: 0 })
  }, [paso, ficha])

  const irAPaso = (i: number) => {
    setFicha(false)
    setPaso(i)
  }

  const Pantalla = PANTALLAS[paso]

  return (
    <ExpedienteProvider>
    <div className="shell">
      <TopBar />
      <div className="body-row">
        <Sidebar
          pasoActual={paso}
          onPaso={irAPaso}
          ficha={ficha}
          onFicha={() => setFicha(true)}
          vista={vista}
          onVista={setVista}
        />
        <main className="main" ref={main}>
          <div className="main-inner">
            {ficha ? <PantallaFicha /> : (
              <>
                <Pantalla />
                <StepNav paso={paso} onPaso={irAPaso} />
              </>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
    </ExpedienteProvider>
  )
}
