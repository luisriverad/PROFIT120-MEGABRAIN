import type { AccionPlan, DetalleAccion } from '@/types'

/**
 * Exportación del plan de trabajo.
 *
 * Dos rutas y ninguna inventa nada: el PDF sale del motor de impresión del
 * navegador —texto vectorial, saltos de página reales, la calidad que espera un
 * cliente que pagó— y el PPT sale de pptxgenjs como archivo editable de verdad,
 * no como imágenes pegadas en diapositivas.
 *
 * Los MENSAJES LISTOS nunca se exportan. Son una herramienta de trabajo del
 * consultor —se copian y se mandan—, no parte del entregable; impresos pierden
 * su función y de paso le enseñan al cliente los correos que hablan de él.
 */

export interface ItemExport {
  accion: AccionPlan
  detalle: DetalleAccion | null
}

export interface DocumentoExport {
  cliente: string
  sector: string
  titulo: string
  /** La lectura del plan completo. Solo va cuando se exporta todo. */
  lectura?: string
  items: ItemExport[]
}

const VENTANA_TEXTO: Record<string, string> = {
  '0-30': 'Días 0 a 30 · Destrabar',
  '31-60': 'Días 31 a 60 · Recuperar',
  '61-90': 'Días 61 a 90 · Instalar',
  '+90': 'Más de 90 días · Sostener',
}

export function textoVentana(v: string) {
  return VENTANA_TEXTO[v] ?? v
}

export function nombreArchivo(doc: DocumentoExport, ext: string) {
  const base = `${doc.cliente} — ${doc.titulo}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}.${ext}`.toLowerCase()
}

/* ---------------------------------------------------------------- */

const VERDE = '6DBE45'
const TINTA = '1F2225'
const GRIS = '7A8085'

/**
 * Genera el .pptx. La librería pesa cerca de un megabyte, así que se carga
 * cuando alguien exporta y no cuando abre la aplicación.
 */
export async function exportarPPT(doc: DocumentoExport) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const p = new PptxGenJS()
  p.layout = 'LAYOUT_16x9'
  p.author = 'PROFIT120'
  p.company = 'PROFIT120'
  p.title = `${doc.cliente} — ${doc.titulo}`

  /** Barra superior con el rótulo de sección, igual en todas las láminas. */
  const encabezado = (s: ReturnType<typeof p.addSlide>, rotulo: string) => {
    s.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: VERDE } })
    s.addText(rotulo.toUpperCase(), {
      x: 0.5, y: 0.28, w: 9, h: 0.3,
      fontSize: 9, bold: true, color: GRIS, charSpacing: 1.6,
    })
  }

  /* ---- Portada ---- */
  const portada = p.addSlide()
  portada.background = { color: 'FFFFFF' }
  portada.addShape('rect', { x: 0, y: 0, w: 0.12, h: '100%', fill: { color: VERDE } })
  portada.addText('PROFIT120 · Motor de Diagnóstico Empresarial', {
    x: 0.7, y: 1.5, w: 8.6, h: 0.3, fontSize: 11, bold: true, color: VERDE, charSpacing: 1.4,
  })
  portada.addText(doc.titulo, {
    x: 0.7, y: 2.0, w: 8.6, h: 1.0, fontSize: 34, bold: true, color: TINTA,
  })
  portada.addText(`${doc.cliente} · ${doc.sector}`, {
    x: 0.7, y: 3.1, w: 8.6, h: 0.4, fontSize: 14, color: GRIS,
  })
  if (doc.lectura) {
    portada.addText(doc.lectura, {
      x: 0.7, y: 3.7, w: 8.6, h: 1.4, fontSize: 11, color: '3C4045', lineSpacing: 18,
    })
  }

  /* ---- Una tanda de láminas por acción ---- */
  for (const { accion, detalle } of doc.items) {
    const resumen = p.addSlide()
    encabezado(resumen, `${accion.frente} · ${textoVentana(accion.ventana)}`)
    resumen.addText(accion.accion, {
      x: 0.5, y: 0.75, w: 9, h: 0.9, fontSize: 22, bold: true, color: TINTA,
    })
    resumen.addText(
      [
        { text: 'Responsable: ', options: { bold: true } },
        { text: accion.area || 'sin asignar' },
        { text: '\nEntregable: ', options: { bold: true } },
        { text: accion.entregable },
      ],
      { x: 0.5, y: 1.75, w: 9, h: 0.8, fontSize: 12, color: '3C4045', lineSpacing: 20 },
    )

    if (detalle) {
      const kpis = [
        ['Libera', detalle.impacto.libera],
        ['Cuesta', detalle.impacto.inversion],
        ['Se ve en', detalle.impacto.ventana],
      ]
      kpis.forEach(([etiqueta, valor], i) => {
        const x = 0.5 + i * 3.05
        resumen.addShape('rect', {
          x, y: 2.75, w: 2.85, h: 1.15,
          fill: { color: i === 0 ? 'F0F8EA' : 'F6F7F6' },
          line: { color: i === 0 ? 'CDE7BA' : 'E3E5E4', width: 1 },
        })
        resumen.addText(etiqueta.toUpperCase(), {
          x: x + 0.15, y: 2.88, w: 2.55, h: 0.22,
          fontSize: 8, bold: true, color: i === 0 ? '3F7A25' : GRIS, charSpacing: 1.2,
        })
        resumen.addText(valor, {
          x: x + 0.15, y: 3.12, w: 2.55, h: 0.7, fontSize: 12, bold: true, color: TINTA,
        })
      })
      resumen.addText(`Cómo se mide: ${detalle.impacto.comoSeMide}`, {
        x: 0.5, y: 4.05, w: 9, h: 0.5, fontSize: 10, color: GRIS,
      })

      /* Por qué + instructivo */
      const comoSe = p.addSlide()
      encabezado(comoSe, `${accion.frente} · cómo se hace`)
      comoSe.addText('Por qué esta acción', {
        x: 0.5, y: 0.75, w: 9, h: 0.3, fontSize: 12, bold: true, color: VERDE, charSpacing: 1,
      })
      comoSe.addText(detalle.porQue, {
        x: 0.5, y: 1.1, w: 9, h: 0.9, fontSize: 11, color: '3C4045', lineSpacing: 17,
      })
      comoSe.addText('Cómo se hace', {
        x: 0.5, y: 2.05, w: 9, h: 0.3, fontSize: 12, bold: true, color: VERDE, charSpacing: 1,
      })
      comoSe.addText(
        detalle.comoSeHace.map((s, i) => ({
          text: `${i + 1}. ${s.paso}  (${s.quien} · ${s.cuando})`,
          options: { breakLine: true },
        })),
        { x: 0.5, y: 2.4, w: 9, h: 2.5, fontSize: 11, color: TINTA, lineSpacing: 19 },
      )

      /* Escenarios y riesgos */
      if (detalle.escenarios.length || detalle.riesgos.length) {
        const cierre = p.addSlide()
        encabezado(cierre, `${accion.frente} · alcance y riesgos`)
        let y = 0.8
        if (detalle.escenarios.length) {
          cierre.addText('Hasta dónde llevarla', {
            x: 0.5, y, w: 9, h: 0.3, fontSize: 12, bold: true, color: VERDE, charSpacing: 1,
          })
          y += 0.4
          cierre.addTable(
            [
              [
                { text: 'Escenario', options: { bold: true, fill: { color: 'F6F7F6' } } },
                { text: 'Alcance', options: { bold: true, fill: { color: 'F6F7F6' } } },
                { text: 'Resultado', options: { bold: true, fill: { color: 'F6F7F6' } } },
                { text: 'Plazo', options: { bold: true, fill: { color: 'F6F7F6' } } },
              ],
              ...detalle.escenarios.map((e) => [
                { text: e.nombre, options: { bold: e.nombre === 'Recomendado' } },
                { text: e.alcance },
                { text: e.resultado },
                { text: e.plazo },
              ]),
            ],
            {
              x: 0.5, y, w: 9, fontSize: 9.5, color: TINTA, valign: 'top',
              border: { pt: 0.5, color: 'E3E5E4' },
              colW: [1.5, 3.9, 2.3, 1.3],
            },
          )
          y += 0.5 + detalle.escenarios.length * 0.62
        }
        if (detalle.riesgos.length) {
          cierre.addText('Qué se puede atorar', {
            x: 0.5, y, w: 9, h: 0.3, fontSize: 12, bold: true, color: VERDE, charSpacing: 1,
          })
          cierre.addText(
            detalle.riesgos.map((r) => ({
              text: `${r.riesgo}\n→ ${r.mitigacion}`,
              options: { breakLine: true },
            })),
            { x: 0.5, y: y + 0.35, w: 9, h: 1.6, fontSize: 10, color: '3C4045', lineSpacing: 15 },
          )
        }
      }
    }
  }

  await p.writeFile({ fileName: nombreArchivo(doc, 'pptx') })
}
