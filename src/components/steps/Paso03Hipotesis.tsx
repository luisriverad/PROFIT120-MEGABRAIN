import { CONTEXTO_NUMEROS, CONTEXTO_OPCIONES, HIPOTESIS_CLIENTE } from '@/data/caso'
import {
  Card, EncabezadoPaso, PreguntaConNumero, PreguntaConOpciones, PreguntaConTexto,
} from '@/components/ui/Primitivos'

export function Paso03Hipotesis() {
  return (
    <>
      <EncabezadoPaso
        paso="Paso 03 · Hipótesis del cliente"
        titulo="¿Por qué crees que pasó esto?"
        entrada="Las respuestas del cliente a estas preguntas revelan dónde está mirando y, sobre todo, dónde no. El motor usa las brechas para dirigir el análisis del paso 05."
      />

      <Card titulo="Batería de contexto profundo" subtitulo="Preguntas formuladas para hacerse al cliente en sesión.">
        <div className="qlist">
          <PreguntaConOpciones {...CONTEXTO_OPCIONES[0]} />
          <PreguntaConNumero {...CONTEXTO_NUMEROS[0]} />
          <PreguntaConOpciones {...CONTEXTO_OPCIONES[1]} />
          <PreguntaConNumero {...CONTEXTO_NUMEROS[1]} />
          <PreguntaConOpciones {...CONTEXTO_OPCIONES[2]} />
          <PreguntaConNumero {...CONTEXTO_NUMEROS[2]} />
          <PreguntaConOpciones {...CONTEXTO_OPCIONES[3]} />
          <PreguntaConNumero {...CONTEXTO_NUMEROS[3]} />
          <PreguntaConTexto {...HIPOTESIS_CLIENTE} />
        </div>
      </Card>
    </>
  )
}
