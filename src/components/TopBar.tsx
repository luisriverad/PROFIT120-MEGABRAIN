import { useExpediente } from '@/estado/Expediente'

export function TopBar() {
  const { cliente } = useExpediente()

  /* El resumen de la barra ya no se escribe a mano: sale de la ficha, así que
     cambiar el sector o los empleados en la barra lateral se ve aquí arriba. */
  const resumen = [cliente.sector, cliente.facturacionAnual, `${cliente.empleados} empleados`]
    .filter(Boolean).join(' · ')

  return (
    <div className="topbar">
      <div className="brand-block">
        <img className="logo" src="/logo-profit120.png" alt="Profit120" />
        <span className="brand-rule" />
        <span className="brand-es">Motor de Diagnóstico Empresarial</span>
      </div>
      <div className="topbar-right">
        <div className="client-chip">
          <span className="cname">{cliente.razonSocial}</span>
          <span className="cmeta">{resumen}</span>
        </div>
      </div>
    </div>
  )
}
