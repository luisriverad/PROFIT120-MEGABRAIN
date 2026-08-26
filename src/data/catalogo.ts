import type { Step, TemaDimension } from '@/types'

/** Los 10 pasos de la ruta de diagnóstico. El orden es el método. */
export const PASOS: Step[] = [
  { n: '01', titulo: 'Contexto y análisis financiero', pregunta: 'Cuéntame' },
  { n: '02', titulo: 'Declaración de problema', pregunta: '¿Qué necesitas?' },
  { n: '03', titulo: 'Hipótesis del cliente', pregunta: '¿Por qué crees que pasó?' },
  { n: '04', titulo: 'Diagnóstico inicial', pregunta: 'Yo creo que…' },
  { n: '05', titulo: 'Costo de la inacción', pregunta: 'Lo que te está costando…' },
  { n: '06', titulo: 'Causa raíz', pregunta: 'La causa raíz es…' },
  { n: '07', titulo: 'Plan de trabajo', pregunta: 'El plan es…' },
  { n: '08', titulo: 'Accountability', pregunta: 'KPIs y responsables' },
]


/** Requisitos de cierre. Sin los cuatro no se habilita la cuantificación. */
export const REQUISITOS = [
  'Síntoma delimitado',
  'Magnitud cuantificada',
  'Área responsable identificada',
  'Restricción real declarada',
] as const

/** Estado de los requisitos por paso (índice 0–7). */
export const REQUISITOS_POR_PASO: boolean[][] = [
  [false, false, false, false],
  [true, false, false, false],
  [true, true, false, false],
  [true, true, true, false],
  [true, true, true, true],
  [true, true, true, true],
  [true, true, true, true],
  [true, true, true, true],
]

/**
 * Las dimensiones profundas que explora el motor, agrupadas por tema.
 * El tema es la disciplina; la dimensión es la forma concreta en que
 * esa disciplina se rompe. Se marca por tema para que el consultor vea
 * qué frentes deja sin explorar, no solo cuáles marcó.
 */
export const TEMAS_DIMENSIONES: TemaDimension[] = [
  {
    n: '01',
    nombre: 'Modelo de negocio',
    dimensiones: [
      'Propuesta de valor debilitada',
      'Unit economics deteriorados',
      'Dependencia de clientes / productos clave',
      'Escalabilidad limitada',
      'Complejidad que destruye valor',
    ],
  },
  {
    n: '02',
    nombre: 'Contabilidad y finanzas',
    dimensiones: [
      'Rentabilidad erosionada',
      'Liquidez en riesgo',
      'Capital de trabajo detenido',
      'Estructura de costos sobredimensionada',
      'Retorno sobre capital insuficiente',
    ],
  },
  {
    n: '03',
    nombre: 'Operación sin desperdicios',
    dimensiones: [
      'Cuellos de botella',
      'Baja productividad / capacidad desaprovechada',
      'Desperdicios y retrabajos',
      'Tiempos de ciclo excesivos',
      'Variabilidad y falta de estandarización',
    ],
  },
  {
    n: '04',
    nombre: 'Rentabilidad de los recursos humanos',
    dimensiones: [
      'Baja productividad por colaborador',
      'Estructura organizacional sobredimensionada',
      'Costo de rotación',
      'Capas y tramos de control ineficientes',
      'Talento crítico en riesgo',
    ],
  },
  {
    n: '05',
    nombre: 'Rentabilidad comercial',
    dimensiones: [
      'Clientes destructores de margen',
      'Productos / servicios destructores de margen',
      'Fugas de precio y descuentos',
      'Cost-to-serve excesivo',
      'Mix comercial poco rentable',
    ],
  },
  {
    n: '06',
    nombre: 'Sistema de calidad',
    dimensiones: [
      'Costo de mala calidad',
      'Retrabajos y desperdicio',
      'Devoluciones / garantías / reclamaciones',
      'Variabilidad de procesos',
      'Fallas recurrentes sin causa raíz resuelta',
    ],
  },
  {
    n: '07',
    nombre: 'Gestión de riesgos',
    dimensiones: [
      'Riesgo fiscal',
      'Riesgo legal / contractual',
      'Riesgo regulatorio / normativo',
      'Riesgo laboral',
      'Riesgo de continuidad / ciberseguridad',
    ],
  },
]

/** Lista plana, para validar selecciones contra el catálogo. */
export const DIMENSIONES = TEMAS_DIMENSIONES.flatMap((t) => t.dimensiones)

/** Sectores de la economía empresarial. */
export const SECTORES = [
  'Manufactura y metalmecánica',
  'Automotriz y autopartes',
  'Alimentos y bebidas',
  'Construcción e infraestructura',
  'Inmobiliario y desarrollo',
  'Comercio mayorista y distribución',
  'Comercio minorista',
  'Transporte y logística',
  'Agroindustria y agropecuario',
  'Energía y combustibles',
  'Minería y extracción',
  'Química y plásticos',
  'Textil, calzado y confección',
  'Farmacéutica y dispositivos médicos',
  'Salud y servicios hospitalarios',
  'Educación y capacitación',
  'Servicios financieros y seguros',
  'Tecnología y software',
  'Turismo, hotelería y restaurantes',
  'Servicios profesionales y consultoría',
] as const

/* -------------------------------------------------------------------------
   Opciones cerradas de la ficha técnica del cliente.
   Van cerradas y no como texto libre porque cada una cambia cómo se lee un
   mismo número: una venta concentrada en distribuidores no se corrige igual
   que una concentrada en venta directa, y una contabilidad sin auditar no
   sostiene la misma conversación que una dictaminada.
   ------------------------------------------------------------------------- */

export const COBERTURAS = [
  'Local',
  'Regional',
  'Nacional',
  'Nacional y exportación',
  'Principalmente exportación',
] as const

export const CANALES_VENTA = [
  'Venta directa',
  'Distribuidores',
  'Mayoreo',
  'Retail y punto de venta',
  'Licitación y gobierno',
  'E-commerce',
  'Mixto',
] as const

export const ESTACIONALIDADES = [
  'Sin estacionalidad marcada',
  'Moderada',
  'Fuerte',
] as const

export const ESTADOS_CONTABILIDAD = [
  'Auditada',
  'Dictaminada fiscalmente',
  'Interna sin auditar',
  'Sin contabilidad formal',
] as const

/** Las cuatro áreas que se califican en la ficha del cliente. */
export const AREAS_DESEMPENO = ['Finanzas', 'Operaciones', 'Comercial', 'RH'] as const

/**
 * Cuántas celdas puede marcar el cliente como dolorosas. Tres, y no más:
 * quien marca todo no priorizó nada, y el plan del paso 07 sale de aquí.
 */
export const MAX_DOLOROSAS = 3

export const CRECIMIENTOS = [
  'Creció',
  'Se mantuvo igual',
  'Decreció',
] as const
