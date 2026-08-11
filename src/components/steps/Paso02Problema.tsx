import { useState } from 'react'
import { DIMENSIONES, TEMAS_DIMENSIONES } from '@/data/catalogo'
import { DECLARACION_CLIENTE, DIMENSIONES_ACTIVAS } from '@/data/caso'
import { Card, EncabezadoPaso, NotaConsultor } from '@/components/ui/Primitivos'

export function Paso02Problema() {
  const [activas, setActivas] = useState<string[]>(DIMENSIONES_ACTIVAS)
  /** Dimensión escrita a mano por tema, para lo que el catálogo no cubre. */
  const [otros, setOtros] = useState<Record<string, string>>({})
  const [otrosAbiertos, setOtrosAbiertos] = useState<string[]>([])

  const alternar = (d: string) =>
    setActivas((a) => (a.includes(d) ? a.filter((x) => x !== d) : [...a, d]))

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
      <EncabezadoPaso
        paso="Paso 02 · Problema declarado"
        titulo="¿Qué necesitas?"
        entrada="Aquí se captura lo que el cliente cree que necesita. Se registra tal cual, sin corregirlo. La distancia entre esta declaración y el diagnóstico del paso 05 es parte del valor que se entrega."
      />

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
                    className={`chip ${activas.includes(d) ? 'on' : ''}`}
                    onClick={() => alternar(d)}
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
