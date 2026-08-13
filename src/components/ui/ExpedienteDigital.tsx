import { useRef, useState } from 'react'
import type { ArchivoAdjunto } from '@/types'
import { useExpediente } from '@/estado/Expediente'

/**
 * Expediente digital.
 *
 * Solo dos documentos. Las cifras duras ya se capturaron arriba y de ahí salen
 * todas las razones; esto es el respaldo con el que se sostiene cualquier número
 * frente al dueño o frente al banco. Pedir más de lo que el cliente realmente
 * tiene a la mano solo retrasa la siguiente sesión.
 */

const SOPORTES = [
  {
    clave: 'estadoResultados',
    nombre: 'Estado de resultados',
    detalle: 'Respalda facturación, costo de ventas, utilidad de operación, depreciación y nómina.',
  },
  {
    clave: 'balanceGeneral',
    nombre: 'Balance general',
    detalle: 'Respalda caja, cartera, inventarios, proveedores, circulante, deuda con costo y capital contable.',
  },
]

function peso(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function Soporte({
  nombre, detalle, archivos, onAgregar, onQuitar,
}: {
  nombre: string
  detalle: string
  archivos: ArchivoAdjunto[]
  onAgregar: (lista: FileList | null) => void
  onQuitar: (nombre: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [encima, setEncima] = useState(false)

  return (
    <div className={`sop ${archivos.length ? 'on' : ''}`}>
      <div className="sop-h">
        <span className="sop-n">{nombre}</span>
        <span className="sop-e">{archivos.length ? `${archivos.length} archivo${archivos.length > 1 ? 's' : ''}` : 'Sin cargar'}</span>
      </div>
      <div className="sop-d">{detalle}</div>

      <div
        className={`sop-drop ${encima ? 'sobre' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setEncima(true) }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => { e.preventDefault(); setEncima(false); onAgregar(e.dataTransfer.files) }}
      >
        Arrastra el archivo o haz clic para elegirlo · PDF, Excel o CSV
        <input
          ref={input}
          type="file"
          multiple
          accept=".pdf,.xls,.xlsx,.csv"
          onChange={(e) => { onAgregar(e.target.files); e.target.value = '' }}
        />
      </div>

      {archivos.map((a) => (
        <div key={a.nombre} className="sop-file">
          <span className="sop-file-n">{a.nombre}</span>
          <span className="sop-file-m">{peso(a.bytes)}</span>
          <button className="bloque-x" onClick={() => onQuitar(a.nombre)} aria-label="Quitar archivo">×</button>
        </div>
      ))}
    </div>
  )
}

export function ExpedienteDigital() {
  const { archivos, setArchivos } = useExpediente()

  const agregar = (clave: string, lista: FileList | null) => {
    if (!lista?.length) return
    const nuevos: ArchivoAdjunto[] = Array.from(lista).map((f) => ({
      nombre: f.name,
      bytes: f.size,
      fecha: new Date().toISOString(),
    }))
    setArchivos((a) => {
      const previos = a[clave] ?? []
      const sinRepetir = nuevos.filter((n) => !previos.some((p) => p.nombre === n.nombre))
      return { ...a, [clave]: [...previos, ...sinRepetir] }
    })
  }

  const quitar = (clave: string, nombre: string) =>
    setArchivos((a) => ({ ...a, [clave]: (a[clave] ?? []).filter((f) => f.nombre !== nombre) }))

  const cargados = SOPORTES.filter((s) => (archivos[s.clave] ?? []).length).length

  return (
    <>
      {SOPORTES.map((s) => (
        <Soporte
          key={s.clave}
          nombre={s.nombre}
          detalle={s.detalle}
          archivos={archivos[s.clave] ?? []}
          onAgregar={(l) => agregar(s.clave, l)}
          onQuitar={(n) => quitar(s.clave, n)}
        />
      ))}

      <div className="tema-foot">
        <span><b>{cargados}</b> de {SOPORTES.length} soportes en el expediente</span>
        <span className="tema-foot-list">
          No alimentan el cálculo: respaldan lo capturado arriba.
        </span>
      </div>
    </>
  )
}
