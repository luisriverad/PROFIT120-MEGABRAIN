import {
  CANALES_VENTA, COBERTURAS, CRECIMIENTOS, ESTACIONALIDADES,
  ESTADOS_CONTABILIDAD, MAX_DOLOROSAS, SECTORES,
} from '@/data/catalogo'
import type { DesempenoArea, FichaCliente } from '@/types'
import { Campo, CampoLista, CampoTexto, Card, EncabezadoPaso } from '@/components/ui/Primitivos'
import { useExpediente } from '@/estado/Expediente'

/** Las claves de la ficha que son texto: las únicas que arma la tabla de abajo. */
type ClaveTexto = {
  [K in keyof FichaCliente]: FichaCliente[K] extends string ? K : never
}[keyof FichaCliente]

type CampoFicha = { clave: ClaveTexto; etiqueta: string; opciones?: readonly string[] }

/**
 * La ficha técnica, en el orden en que se pregunta: primero quién es, luego de
 * qué tamaño, de dónde le viene la venta y, al final, qué tan confiable es el
 * número que va a entregar. Las que traen `opciones` van cerradas: un mismo
 * dato se lee distinto según de dónde salga, y el texto libre no se puede
 * comparar entre expedientes.
 */
const BLOQUES: { titulo: string; campos: CampoFicha[] }[] = [
  {
    titulo: 'Contacto',
    campos: [
      { clave: 'contactoNombre', etiqueta: 'Nombre completo' },
      { clave: 'contactoCargo', etiqueta: 'Cargo o rol' },
    ],
  },
  {
    titulo: 'Identidad',
    campos: [
      { clave: 'razonSocial', etiqueta: 'Razón social' },
      { clave: 'sector', etiqueta: 'Sector o giro', opciones: SECTORES },
      { clave: 'aniosOperacion', etiqueta: 'Años de operación' },
      { clave: 'ubicacion', etiqueta: 'Ubicación' },
    ],
  },
  {
    titulo: 'Tamaño del negocio',
    campos: [
      { clave: 'empleados', etiqueta: 'Empleados' },
      { clave: 'facturacionAnual', etiqueta: 'Facturación anual' },
      { clave: 'ubicaciones', etiqueta: 'Plantas o sucursales' },
    ],
  },
  {
    titulo: 'Resultado del último año',
    campos: [
      { clave: 'ebitda', etiqueta: 'EBITDA %' },
      { clave: 'crecimiento', etiqueta: '¿Creció o decreció en el último año?', opciones: CRECIMIENTOS },
      { clave: 'variacion', etiqueta: 'Variación %' },
    ],
  },
  {
    titulo: 'Mercado y concentración',
    campos: [
      { clave: 'clientes80', etiqueta: 'Clientes que hacen el 80% de la venta' },
      { clave: 'lineasActivas', etiqueta: 'Líneas o unidades de negocio activas' },
      { clave: 'cobertura', etiqueta: 'Cobertura geográfica', opciones: COBERTURAS },
      { clave: 'exportacion', etiqueta: '% de la venta exportada' },
      { clave: 'canalPrincipal', etiqueta: 'Canal de venta principal', opciones: CANALES_VENTA },
      { clave: 'estacionalidad', etiqueta: 'Estacionalidad', opciones: ESTACIONALIDADES },
    ],
  },
  {
    titulo: 'Calidad de la información',
    campos: [
      { clave: 'sistema', etiqueta: 'ERP o sistema de gestión' },
      { clave: 'contabilidad', etiqueta: 'Estado de la contabilidad', opciones: ESTADOS_CONTABILIDAD },
      { clave: 'ultimoCierre', etiqueta: 'Último cierre disponible' },
    ],
  },
]

/**
 * Dónde duele, antes de abrir un solo estado financiero. Las dos formas de
 * doler no se nombran con una etiqueta abstracta —«efectivo», «estrategia» no
 * se entienden en la primera sesión—: cada opción se lee como la frase que el
 * cliente diría en voz alta. El tope de marcas obliga a escoger — quien marca
 * las ocho no priorizó, y de esta tabla sale el orden del plan.
 */
const DOLORES = [
  { campo: 'efectivo', frase: 'Hacemos mal lo que sí toca hacer' },
  { campo: 'estrategia', frase: 'Hacemos bien lo que no toca hacer' },
] as const

function TablaAreas({
  areas, onCambio,
}: { areas: DesempenoArea[]; onCambio: (area: string, cambio: Partial<DesempenoArea>) => void }) {
  const marcadas = areas.reduce((n, a) => n + Number(a.efectivo) + Number(a.estrategia), 0)
  const lleno = marcadas >= MAX_DOLOROSAS

  return (
    <div className="dolor">
      <div className="dolor-fila dolor-cabeza">
        <span />
        <span />
        <span />
        <span>Qué tan bien va</span>
      </div>

      {areas.map((a) => {
        const duele = a.efectivo || a.estrategia
        return (
          <div className={`dolor-fila ${duele ? 'duele' : ''}`} key={a.area}>
            <span className="dolor-area">{a.area}</span>

            {DOLORES.map((d) => {
              const activo = a[d.campo]
              return (
                <button
                  key={d.campo}
                  type="button"
                  className={`dolor-op ${activo ? 'on' : ''}`}
                  disabled={lleno && !activo}
                  onClick={() => onCambio(a.area, { [d.campo]: !activo })}
                >
                  <span className="dolor-marca" aria-hidden>{activo ? '✓' : ''}</span>
                  {d.frase}
                </button>
              )
            })}

            <span className="dolor-pct">
              <input
                value={a.desempeno}
                inputMode="numeric"
                placeholder="—"
                onChange={(e) => onCambio(a.area, { desempeno: e.target.value })}
              />
              <b>%</b>
            </span>
          </div>
        )
      })}

      <div className={`dolor-cuenta ${lleno ? 'lleno' : ''}`}>
        {lleno
          ? `Ya usaste las ${MAX_DOLOROSAS} marcas: quita una para mover otra`
          : `Llevas ${marcadas} de ${MAX_DOLOROSAS} marcas`}
      </div>
    </div>
  )
}

/**
 * La ficha no es un paso: se abre desde su propio botón en la barra lateral y
 * ocupa la columna central completa. Lo que se captura aquí encabeza todas las
 * peticiones del motor, de la radiografía del paso 01 al cierre del 08.
 */
export function PantallaFicha() {
  const { cliente, setCliente } = useExpediente()

  const editar = (clave: ClaveTexto, valor: string) =>
    setCliente((c) => ({ ...c, [clave]: valor }))

  const editarArea = (area: string, cambio: Partial<DesempenoArea>) =>
    setCliente((c) => ({
      ...c,
      areas: c.areas.map((a) => (a.area === area ? { ...a, ...cambio } : a)),
    }))

  return (
    <>
      <EncabezadoPaso paso="Expediente" titulo="Ficha del cliente" />

      {BLOQUES.map((bloque) => (
        <Card titulo={bloque.titulo} key={bloque.titulo}>
          <div className="grid3">
            {bloque.campos.map((c) => (c.opciones ? (
              <CampoLista
                key={c.clave}
                etiqueta={c.etiqueta}
                valor={cliente[c.clave]}
                opciones={c.opciones}
                onChange={(v) => editar(c.clave, v)}
              />
            ) : (
              <Campo
                key={c.clave}
                etiqueta={c.etiqueta}
                valor={cliente[c.clave]}
                onChange={(v) => editar(c.clave, v)}
              />
            )))}
          </div>
        </Card>
      ))}

      <Card titulo="¿Dónde les duele?">
        <TablaAreas areas={cliente.areas} onCambio={editarArea} />
      </Card>

      <Card titulo="Sobre el negocio">
        <CampoTexto
          etiqueta="¿A qué se dedica la empresa?"
          valor={cliente.actividad}
          placeholder="Qué hace, qué productos o servicios ofrece y a quién le vende…"
          onChange={(v) => editar('actividad', v)}
        />
        <CampoTexto
          etiqueta="¿Qué la diferencia de las demás?"
          valor={cliente.diferenciador}
          placeholder="Qué la hace única y por qué sus clientes la eligen sobre la competencia…"
          onChange={(v) => editar('diferenciador', v)}
        />
      </Card>

      <Card titulo="Anotaciones importantes">
        <CampoTexto
          etiqueta="Contexto que no cabe en los campos"
          valor={cliente.anotaciones}
          placeholder="Deuda reciente, cambio de socios, contexto del mercado…"
          onChange={(v) => editar('anotaciones', v)}
        />
      </Card>
    </>
  )
}
