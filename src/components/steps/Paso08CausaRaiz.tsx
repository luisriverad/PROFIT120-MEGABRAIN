import { CADENA_CAUSAL, CAUSA_RAIZ } from '@/data/caso'
import { Card, EncabezadoPaso, NotaConsultor } from '@/components/ui/Primitivos'

export function Paso08CausaRaiz() {
  return (
    <>
      <EncabezadoPaso
        paso="Paso 08 · Causa raíz"
        titulo="La causa raíz es"
        entrada="Los cuatro costos convergen en un solo punto estructural. Atacar los síntomas por separado reproduce el problema en doce meses."
      />

      <Card titulo="Cadena de causalidad" subtitulo="Del síntoma declarado a la causa estructural.">
        <div className="why-chain">
          {CADENA_CAUSAL.map((e, i) => (
            <div key={i}>
              <div className="why">
                <div className="why-lbl">{e.nivel}</div>
                <div className="why-txt">{e.texto}</div>
              </div>
              {i < CADENA_CAUSAL.length - 1 && <div className="why-conn" />}
            </div>
          ))}
        </div>

        <div className="root">
          <div className="rl">Causa raíz</div>
          <div className="rt">{CAUSA_RAIZ}</div>
        </div>
      </Card>

      <NotaConsultor rotulo="Implicación:">
        cualquier plan que empiece por renegociar precios sin instalar primero la medición de
        rentabilidad por cliente y el dueño nominal del margen va a recuperar puntos que se volverán a
        perder en el siguiente ciclo comercial.
      </NotaConsultor>
    </>
  )
}
