import { useState } from 'react'
import type {
  BenchmarkSector, CampoFinanciero, Ejercicio, MapaRiesgos, Razon, Semaforo,
} from '@/types'
import { MODELO_IA, analizarProfundidad } from '@/lib/ia'
import { BloqueIA } from '@/components/ui/BloqueIA'

/**
 * Análisis a profundidad.
 *
 * El primer diagnóstico calcula; esto interpreta. Le entrega a Claude toda la
 * radiografía y todas las razones contra su industria, y devuelve el mapa de
 * riesgos en semáforo con el que el consultor se sienta frente al dueño.
 */

const TEXTO_SEMAFORO: Record<Semaforo, string> = {
  rojo: 'Crítico',
  amarillo: 'Vigilar',
  verde: 'Sano',
}

const TEXTO_URGENCIA: Record<Semaforo, string> = {
  rojo: 'Algo puede tronar dentro de doce meses',
  amarillo: 'Deterioro con arreglo todavía barato',
  verde: 'Sin riesgos estructurales a la vista',
}

const FASES = [
  'Leyendo la radiografía financiera',
  'Comparando contra el promedio de la industria',
  'Cruzando razones entre sí',
  'Separando lo contable de lo que sí llegó al banco',
  'Detectando los patrones de fondo',
  'Redactando el mapa de riesgos',
  'Cerrando',
]

const ANGULOS = [
  'Concéntrate en lo que pondría en riesgo la línea de crédito.',
  'Ordena los riesgos por cuánto dinero liberan si se atienden.',
  'Analízalo como si fueras el banco decidiendo si renueva.',
]

export function AnalisisProfundidad({
  cliente, ejercicios, campos, razones, benchmark, mapa, onMapa,
}: {
  cliente: { razonSocial: string; sector: string; aniosOperacion: string; clientes80: string; lineasActivas: string }
  ejercicios: Ejercicio[]
  campos: CampoFinanciero[]
  razones: Razon[]
  benchmark: BenchmarkSector
  /** Vive en el expediente, no aquí: el paso 02 lo necesita. */
  mapa: MapaRiesgos | null
  onMapa: (m: MapaRiesgos) => void
}) {
  const [instruccion, setInstruccion] = useState('')

  const analizar = async () => {
    onMapa(await analizarProfundidad({
      cliente, ejercicios, campos, razones, benchmark, instruccion: instruccion.trim(),
    }))
  }

  const conteo = (s: Semaforo) => mapa?.riesgos.filter((r) => r.semaforo === s).length ?? 0

  return (
    <BloqueIA
      titulo="Análisis a profundidad"
      fases={FASES}
      generar={analizar}
      hayResultado={Boolean(mapa)}
      nota={`${MODELO_IA} · esfuerzo alto sobre el expediente completo`}
      pie={(
        <>
          <div className="modal-atajos">
            {ANGULOS.map((a) => (
              <button key={a} className="atajo" onClick={() => setInstruccion(a)}>
                {a.length > 46 ? `${a.slice(0, 46)}…` : a}
              </button>
            ))}
          </div>
          <textarea
            className="modal-input"
            value={instruccion}
            placeholder="Pide otro ángulo y vuelve a generar: “analízalo como si fueras el banco”…"
            onChange={(e) => setInstruccion(e.target.value)}
          />
        </>
      )}
    >
      {mapa && (
        <>
          {/* La tesis primero: qué le está pasando de verdad a esta empresa. */}
          <div className={`prof-vered s-${mapa.urgencia}`}>
            <div className="prof-vered-h">
              <span className={`sem sem-${mapa.urgencia}`} />
              <span className="prof-vered-l">{TEXTO_URGENCIA[mapa.urgencia]}</span>
              <span className="prof-cuenta">
                {conteo('rojo')} críticos · {conteo('amarillo')} en vigilancia · {conteo('verde')} sanos
              </span>
            </div>
            <p className="prof-vered-t">{mapa.veredicto}</p>
          </div>

          <div className="rad-sub">Mapa de riesgos</div>
          {mapa.riesgos.map((r, i) => (
            <div key={`${r.titulo}-${i}`} className={`riesgo s-${r.semaforo}`}>
              <div className="riesgo-h">
                <span className={`sem sem-${r.semaforo}`} />
                <span className="riesgo-t">{r.titulo}</span>
                <span className="riesgo-frente">{r.frente}</span>
                <span className={`riesgo-sev s-${r.semaforo}`}>{TEXTO_SEMAFORO[r.semaforo]}</span>
              </div>
              <p className="riesgo-lectura">{r.lectura}</p>
              {r.evidencia.length > 0 && (
                <ul className="riesgo-ev">
                  {r.evidencia.map((e, k) => <li key={k}>{e}</li>)}
                </ul>
              )}
              <div className="riesgo-pie">
                <div>
                  <span className="riesgo-lbl">Ventana</span>
                  {r.ventana}
                </div>
                <div>
                  <span className="riesgo-lbl">Primer movimiento</span>
                  {r.primerMovimiento}
                </div>
              </div>
            </div>
          ))}

          {mapa.puntosCiegos.length > 0 && (
            <>
              <div className="rad-sub">Lo que los números no dicen</div>
              <ul className="ia-avisos">
                {mapa.puntosCiegos.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </>
          )}
        </>
      )}
    </BloqueIA>
  )
}
