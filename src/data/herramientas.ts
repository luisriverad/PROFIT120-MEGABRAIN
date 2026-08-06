import type { Herramienta } from '@/types'

/**
 * Herramientas candidatas por paso. En producción esto lo devuelve el
 * indexador con búsqueda híbrida sobre las fichas de los archivos.
 */
export const HERRAMIENTAS_POR_PASO: Record<number, Herramienta[]> = {
  0: [],
  1: [],
  2: [
    { nombre: 'Diagnóstico de Erosión de Margen — 12 meses', modulo: 'Finanzas', porque: 'El síntoma declarado apunta a caída de margen con ventas estables.', match: 94 },
    { nombre: 'Matriz de Rentabilidad por Cliente y Línea', modulo: 'Finanzas', porque: 'Detecta destructores de margen antes de tocar precios.', match: 88 },
  ],
  3: [
    { nombre: 'Diagnóstico de Erosión de Margen — 12 meses', modulo: 'Finanzas', porque: 'Sostiene la lectura de rentabilidad erosionada.', match: 94 },
    { nombre: 'Matriz de Rentabilidad por Cliente y Línea', modulo: 'Finanzas', porque: 'Detecta destructores de margen antes de tocar precios.', match: 88 },
    { nombre: 'Ciclo de Conversión de Efectivo', modulo: 'Finanzas', porque: 'El cliente reporta presión de caja con utilidad contable positiva.', match: 86 },
    { nombre: 'Modelo de Tasa de Crecimiento Sostenible', modulo: 'Estrategia', porque: 'Creció 18% con estructura financiera para 6%.', match: 81 },
  ],
  4: [
    { nombre: 'Matriz de Rentabilidad por Cliente y Línea', modulo: 'Finanzas', porque: 'Confirma que 3 cuentas destruyen margen.', match: 96 },
    { nombre: 'Ciclo de Conversión de Efectivo', modulo: 'Finanzas', porque: 'Ciclo en 118 días contra 74 del sector.', match: 93 },
    { nombre: 'Costeo de Retrabajos y Reprocesos', modulo: 'Operación', porque: 'Desviación operativa detectada en merma y horas extra.', match: 91 },
    { nombre: 'Modelo de Tasa de Crecimiento Sostenible', modulo: 'Estrategia', porque: 'Brecha entre crecimiento real y financiable.', match: 87 },
    { nombre: 'Costo Hora-Hombre por Área', modulo: 'RRHH', porque: 'Base para medir rentabilidad del recurso humano.', match: 84 },
  ],
  5: [
    { nombre: 'Matriz de Rentabilidad por Cliente y Línea', modulo: 'Finanzas', porque: 'Confirmada por el cliente en la sesión de replanteamiento.', match: 96 },
    { nombre: 'Ciclo de Conversión de Efectivo', modulo: 'Finanzas', porque: 'Ciclo en 118 días contra 74 del sector.', match: 93 },
    { nombre: 'Costeo de Retrabajos y Reprocesos', modulo: 'Operación', porque: 'Cuantifica el desperdicio en pesos, no en piezas.', match: 91 },
    { nombre: 'Análisis de Capacidad Instalada vs. Utilizada', modulo: 'Operación', porque: 'El cliente aportó dato de turnos parados.', match: 89 },
    { nombre: 'Costo Hora-Hombre por Área', modulo: 'RRHH', porque: 'Base para medir rentabilidad del recurso humano.', match: 84 },
  ],
  6: [
    { nombre: 'Calculadora de Costo de la Inacción', modulo: 'Finanzas', porque: 'Consolida las cuantificaciones en una sola cifra.', match: 98 },
    { nombre: 'Matriz de Rentabilidad por Cliente y Línea', modulo: 'Finanzas', porque: 'Aporta $14.2M de margen erosionado.', match: 96 },
    { nombre: 'Ciclo de Conversión de Efectivo', modulo: 'Finanzas', porque: 'Aporta $18.4M inmovilizados y $3.8M de costo financiero.', match: 93 },
    { nombre: 'Costeo de Retrabajos y Reprocesos', modulo: 'Operación', porque: 'Aporta $6.1M anuales de desviación operativa.', match: 91 },
  ],
  7: [
    { nombre: 'Árbol de Causa Raíz — 5 Porqués', modulo: 'Operación', porque: 'Estructura la cadena del síntoma a la causa estructural.', match: 97 },
    { nombre: 'Diagrama de Ishikawa Ampliado', modulo: 'Operación', porque: 'Contrasta la cadena contra las seis M.', match: 88 },
    { nombre: 'Mapa de Decisiones Comerciales sin Piso de Margen', modulo: 'Ventas', porque: 'La causa raíz apunta a política de descuentos sin control.', match: 86 },
  ],
  8: [
    { nombre: 'Política de Piso de Margen y Autorización de Descuentos', modulo: 'Ventas', porque: 'Ataca directamente la causa raíz identificada.', match: 97 },
    { nombre: 'Kit de Renegociación de Cuentas Destructoras', modulo: 'Ventas', porque: 'Aplica a las 3 cuentas con margen negativo.', match: 94 },
    { nombre: 'Programa de Reducción de Retrabajos — PDCA', modulo: 'Operación', porque: 'Fase 2 del plan, ataca $6.1M de desviación.', match: 90 },
    { nombre: 'Plan de Liberación de Capital de Trabajo', modulo: 'Finanzas', porque: 'Objetivo: recuperar $9M en 90 días.', match: 89 },
  ],
  9: [
    { nombre: 'Tablero de Control Ejecutivo — Plantilla', modulo: 'Formatos', porque: 'Estructura los 7 indicadores con responsable y frecuencia.', match: 96 },
    { nombre: 'Matriz RACI por Iniciativa', modulo: 'RRHH', porque: 'Fija accountability nominal, no por área.', match: 92 },
    { nombre: 'Formato de Junta de Rendición de Cuentas', modulo: 'Formatos', porque: 'Ritmo semanal de seguimiento con evidencia.', match: 90 },
  ],
}
