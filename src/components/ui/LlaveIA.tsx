import { useState } from 'react'
import { guardarApiKey, leerApiKey } from '@/lib/ia'

/**
 * Captura de la credencial de Anthropic.
 *
 * Aparece solo cuando no hay ninguna configurada. En despliegue compartido no se
 * usa: ahí se define VITE_IA_PROXY_URL y la llave se queda del lado del servidor.
 */
export function LlaveIA({ onListo }: { onListo: () => void }) {
  const [llave, setLlave] = useState(leerApiKey())

  return (
    <div className="modal-llave">
      <label>Clave de API de Anthropic</label>
      <p>
        Se guarda solo en este navegador y viaja directo a la API. Para un despliegue
        compartido, define <code>VITE_IA_PROXY_URL</code> y la clave se queda en tu servidor.
      </p>
      <div className="modal-llave-row">
        <input
          type="password"
          value={llave}
          placeholder="sk-ant-..."
          onChange={(e) => setLlave(e.target.value)}
        />
        <button
          className="btn-solido"
          disabled={!llave.trim()}
          onClick={() => { guardarApiKey(llave.trim()); onListo() }}
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
