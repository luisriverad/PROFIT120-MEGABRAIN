import { CLIENTE } from '@/data/caso'

export function TopBar() {
  return (
    <div className="topbar">
      <div className="brand-block">
        <img className="logo" src="/logo-profit120.png" alt="Profit120" />
        <span className="brand-rule" />
        <span className="brand-es">Motor de Diagnóstico Empresarial</span>
      </div>
      <div className="topbar-right">
        <div className="client-chip">
          <span className="cname">{CLIENTE.razonSocial}</span>
          <span className="cmeta">{CLIENTE.resumenBarra}</span>
        </div>
        <button className="btn-ghost">Cambiar cliente</button>
        <button className="btn-ghost">Exportar expediente</button>
      </div>
    </div>
  )
}
