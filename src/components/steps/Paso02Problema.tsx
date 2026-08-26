import { useState } from 'react'
import { DIMENSIONES, TEMAS_DIMENSIONES } from '@/data/catalogo'
import { DECLARACION_CLIENTE } from '@/data/caso'
import { Card, EncabezadoPaso, NotaConsultor } from '@/components/ui/Primitivos'
import { useExpediente } from '@/estado/Expediente'

/**
 * Cada dimensión vive en uno de tres estados:
 *
 *  - confirmada (verde): la marcó el consultor.
 *  - sugerida (amarillo): el análisis a profundidad del paso 01 la dejó en
 *    evidencia con cifras. Cuenta como marcada, pero se distingue porque no la
 *    puso una persona.
 *  - inactiva (gris): ni una cosa ni la otra.
 *
 * Un clic sobre la sugerida la descarta —el consultor no está de acuerdo— y ya
 * no vuelve a proponerse aunque el motor insista.
 */
export function Paso02Problema() {
  const { mapa, confirmadas, setConfirmadas, descartadas, setDescartadas, otros, setOtros } = useExpediente()
  const [otrosAbiertos, setOtrosAbiertos] = useState<string[]>([])

  const sugerida = (d: string) =>
    Boolean(mapa?.dimensionesEvidentes.includes(d))
    && !confirmadas.includes(d)
    && !descartadas.includes(d)

  const estado = (d: string) =>
    confirmadas.includes(d) ? 'on' : sugerida(d) ? 'sug' : ''

  const alternar = (d: string) => {
    if (confirmadas.includes(d)) setConfirmadas((a) => a.filter((x) => x !== d))
    else if (sugerida(d)) setDescartadas((a) => [...a, d])
    else setConfirmadas((a) => [...a, d])
  }

  const activas = DIMENSIONES.filter((d) => confirmadas.includes(d) || sugerida(d))
  const sugeridas = DIMENSIONES.filter(sugerida).length

  /** Al cerrar el box se conserva lo escrito: reabrirlo no pierde el texto. */
  const alternarOtro = (n: string) =>
    setOtrosAbiertos((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]))

  const tienePropia = (n: string) => otrosAbiertos.includes(n) && !!otros[n]?.trim()
  const propias = TEMAS_DIMENSIONES.filter((t) => tienePropia(t.n)).length

  const temasSinExplorar = TEMAS_DIMENSIONES
    .filter((t) => !t.dimensiones.some((d) => activas.includes(d)) && !tienePropia(t.n))
    .map((t) => t.nombre)

  return (
    <>
      <EncabezadoPaso paso="Paso 02 · Declaración de problema" titulo="¿Qué necesitas?" />

      <NotaConsultor rotulo="Nota de método:">
        el problema declarado casi nunca es el problema. Se documenta para poder mostrarle al cliente,
        al final, la diferencia entre lo que pidió y lo que realmente lo estaba costando.
      </NotaConsultor>

      <Card titulo="Declaración textual del cliente">
        <div className="field">
          <textarea defaultValue={DECLARACION_CLIENTE} />
        </div>
      </Card>

      <Card titulo="Traducción a capa profunda">
        {TEMAS_DIMENSIONES.map((t) => {
          const marcadas = t.dimensiones.filter((d) => activas.includes(d)).length
          const abierto = otrosAbiertos.includes(t.n)
          const propia = abierto && otros[t.n]?.trim() ? 1 : 0
          return (
            <div key={t.n} className={`tema ${marcadas + propia ? 'on' : ''}`}>
              <div className="tema-h">
                <span className="tema-n">{t.n}</span>
                <span className="tema-t">{t.nombre}</span>
                <span className={`tema-c ${marcadas + propia ? 'on' : ''}`}>
                  {marcadas + propia
                    ? `${marcadas} de ${t.dimensiones.length}${propia ? ' · +1 propia' : ''}`
                    : 'Sin explorar'}
                </span>
              </div>
              <div className="chips">
                {t.dimensiones.map((d) => (
                  <button
                    key={d}
                    className={`chip ${estado(d)}`}
                    onClick={() => alternar(d)}
                    title={sugerida(d) ? 'La dejó en evidencia el análisis del paso 01. Un clic la descarta.' : undefined}
                  >
                    {d}
                  </button>
                ))}
                <button
                  className={`chip chip-otro ${abierto ? 'on' : ''}`}
                  onClick={() => alternarOtro(t.n)}
                >
                  {abierto ? '− Otro' : '+ Otro'}
                </button>
              </div>
              {abierto && (
                <div className="otro">
                  <label>Dimensión propia — {t.nombre.toLowerCase()}</label>
                  <textarea
                    autoFocus
                    value={otros[t.n] ?? ''}
                    placeholder="Escribe la dimensión que el catálogo no cubre, en los términos del caso."
                    onChange={(e) => setOtros((o) => ({ ...o, [t.n]: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )
        })}

        <div className="tema-foot">
          <span>
            <b>{activas.length}</b> de {DIMENSIONES.length} dimensiones marcadas
            {sugeridas > 0 && <> {' · '} <b>{sugeridas}</b> sugeridas por el análisis</>}
            {propias > 0 && <> {' · '} <b>{propias}</b> {propias === 1 ? 'propia' : 'propias'}</>}
            {' · '}
            <b>{temasSinExplorar.length}</b> {temasSinExplorar.length === 1 ? 'tema' : 'temas'} sin explorar
          </span>
          {temasSinExplorar.length > 0 && (
            <span className="tema-foot-list">{temasSinExplorar.join(' · ')}</span>
          )}
        </div>
      </Card>

    </>
  )
}
