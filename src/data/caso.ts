import type {
  CampoFinanciero, Documento, Eslabon, FaseDelPlan, FilaTendencia, Hallazgo, HallazgoValidado,
  Indicador, Kpi, LineaCosto, PreguntaNumero, PreguntaOpciones, PreguntaTexto,
} from '@/types'

/**
 * CASO DEMOSTRATIVO. Todo lo de este archivo es contenido de ejemplo
 * para ver el motor lleno. Se reemplaza por el expediente real del cliente.
 */

export const CLIENTE = {
  razonSocial: 'Manufacturas del Norte, S.A. de C.V.',
  sector: 'Manufactura y metalmecánica',
  aniosOperacion: '23',
  clientes80: '6',
  lineasActivas: '11',
  resumenBarra: 'Metalmecánica · $180M · 140 empleados',
}

/**
 * Las cifras duras se capturan por cierre de ejercicio: son las auditadas
 * o declaradas y sostienen todas las cuantificaciones. Las lecturas de
 * tendencia y la evidencia documental corren a 12 meses.
 *
 * Son doce datos, no más. Todo lo demás de la radiografía se deriva de
 * aquí (ver RAZONES en data/finanzas.ts): entre menos se pregunta, más
 * probable es salir de la primera entrevista con el expediente completo.
 */
export const EJERCICIOS = ['Cierre 2025', 'Cierre 2024']

export const CAMPOS_FINANCIEROS: CampoFinanciero[] = [
  {
    clave: 'ventas', concepto: 'Facturación', unidad: 'mxn', fuente: 'sesion',
    ayuda: 'Venta neta del ejercicio, sin IVA.',
    valores: [180_400_000, 152_900_000],
  },
  {
    clave: 'utilidadNeta', concepto: 'Utilidad neta declarada', unidad: 'mxn', fuente: 'sesion',
    ayuda: 'La que el cliente declara. Se toma como dicha, se valida después.',
    valores: [5_590_000, 6_730_000],
  },
  {
    clave: 'nomina', concepto: 'Nómina anual total', unidad: 'mxn', fuente: 'sesion',
    ayuda: 'Sueldos, cargas sociales y prestaciones. Costo, no percepción.',
    valores: [33_400_000, 22_500_000],
  },
  {
    clave: 'empleados', concepto: 'Empleados totales', unidad: 'conteo', fuente: 'sesion',
    ayuda: 'Plantilla al cierre, nómina propia más outsourcing fijo.',
    valores: [140, 118],
  },
  {
    clave: 'caja', concepto: 'Caja y bancos', unidad: 'mxn', fuente: 'sesion',
    ayuda: 'Saldo disponible al cierre, sin inversiones restringidas.',
    valores: [2_100_000, 4_800_000],
  },
  {
    clave: 'inventario', concepto: 'Inventario', unidad: 'mxn', fuente: 'sesion',
    ayuda: 'Materia prima, en proceso y producto terminado, a costo.',
    valores: [22_500_000, 15_960_000],
  },
  {
    clave: 'deuda', concepto: 'Deuda con costo', unidad: 'mxn', fuente: 'sesion',
    ayuda: 'Bancos y arrendamiento. No incluye proveedores.',
    valores: [38_000_000, 24_500_000],
  },
  {
    clave: 'costoVentas', concepto: 'Costo de ventas', unidad: 'mxn', fuente: 'caratula',
    ayuda: 'Material, mano de obra directa y gastos indirectos de fabricación.',
    valores: [141_250_000, 109_935_000],
  },
  {
    clave: 'utilidadOperativa', concepto: 'Utilidad de operación', unidad: 'mxn', fuente: 'caratula',
    ayuda: 'Antes de intereses e impuestos. Es la que mide el negocio, no la estructura financiera.',
    valores: [7_400_000, 11_010_000],
  },
  {
    clave: 'cxc', concepto: 'Cuentas por cobrar', unidad: 'mxn', fuente: 'caratula',
    ayuda: 'Cartera de clientes al cierre, bruta.',
    valores: [35_100_000, 21_800_000],
  },
  {
    clave: 'cxp', concepto: 'Cuentas por pagar', unidad: 'mxn', fuente: 'caratula',
    ayuda: 'Proveedores de operación. No incluye deuda bancaria.',
    valores: [20_100_000, 13_550_000],
  },
  {
    clave: 'capital', concepto: 'Capital contable', unidad: 'mxn', fuente: 'caratula',
    ayuda: 'Patrimonio de los socios al cierre. Sin él no hay ROE.',
    valores: [62_400_000, 57_300_000],
  },
]

/* ---------- PASO 01 ---------- */

export const TENDENCIAS: FilaTendencia[] = [
  { concepto: 'Las ventas del cliente', valor: 'up' },
  { concepto: 'La utilidad del cliente', valor: 'down' },
  { concepto: 'El costo de la nómina', valor: 'up' },
  { concepto: 'El número de personas en plantilla', valor: 'up' },
  { concepto: 'El precio promedio de venta', valor: 'flat' },
  { concepto: 'El costo de la materia prima', valor: 'up' },
  { concepto: 'El inventario', valor: 'up' },
  { concepto: 'Las cuentas por cobrar', valor: 'up' },
  { concepto: 'Los días que tarda en cobrar', valor: 'up' },
  { concepto: 'La deuda con bancos y proveedores', valor: 'up' },
  { concepto: 'Los gastos fijos de administración', valor: 'up' },
  { concepto: 'Las horas extra pagadas', valor: 'up' },
  { concepto: 'Las devoluciones y reclamaciones de clientes', valor: 'up' },
  { concepto: 'La rotación de personal', valor: 'up' },
  { concepto: 'La capacidad de planta utilizada', valor: 'na' },
]

export const ESTRUCTURA_DECISION: PreguntaOpciones[] = [
  {
    etiqueta: 'Gobierno',
    pregunta: '¿La empresa es de control familiar y quién tiene la última palabra sobre precio y crédito?',
    opciones: ['Fundador', '2ª generación', 'Consejo', 'Director general externo'],
    seleccion: 0,
  },
  {
    etiqueta: 'Madurez de gestión',
    pregunta: '¿El cliente opera hoy con un tablero de indicadores formal y juntas de seguimiento con evidencia?',
    opciones: ['Sí, formal y con ritmo', 'Reportes aislados', 'Nada estructurado'],
    seleccion: 1,
  },
]

export const ANTECEDENTE: PreguntaTexto = {
  etiqueta: 'Antecedente',
  pregunta: '¿Ha trabajado antes con consultoría externa y qué pasó con esa implementación?',
  valor:
    'Intento de certificación en 2022. Se documentaron procesos, nadie los sostuvo. El fundador quedó escéptico de consultoría "de papel".',
  placeholder: 'Ej. Proyecto de ISO en 2022, se documentó pero no se sostuvo la operación.',
}

/* ---------- PASO 02 ---------- */

export const DECLARACION_CLIENTE =
  '"Necesito vender más. Estamos facturando como nunca pero el dinero no aparece por ningún lado y el banco ya me apretó la línea."'

export const DIMENSIONES_ACTIVAS = [
  'Rentabilidad erosionada',
  'Liquidez en riesgo',
  'Capital de trabajo detenido',
  'Retorno sobre capital insuficiente',
  'Desperdicios y retrabajos',
  'Baja productividad por colaborador',
  'Clientes destructores de margen',
  'Productos / servicios destructores de margen',
]

/* ---------- PASO 03 ---------- */

export const CONTEXTO_OPCIONES: PreguntaOpciones[] = [
  {
    etiqueta: 'Rentabilidad erosionada',
    pregunta: '¿El cliente ha incrementado sus ventas en los últimos 12 meses y su utilidad creció en la misma proporción?',
    opciones: ['Vendió más, ganó menos', 'Ambas crecieron', 'Ambas cayeron', 'No lo tiene medido'],
    seleccion: 0,
  },
  {
    etiqueta: 'Liquidez en riesgo',
    pregunta: '¿El cliente ha tenido que retrasar pagos a proveedores o usar línea de crédito para cubrir nómina en los últimos 12 meses?',
    opciones: ['Sí, de forma recurrente', 'Aislado', 'Nunca'],
    seleccion: 0,
  },
  {
    etiqueta: 'Destructores de margen',
    pregunta: '¿El cliente sabe cuánto le deja cada cliente y cada línea después de costos indirectos, o solo conoce el margen bruto global?',
    opciones: ['Rentabilidad por cliente y línea', 'Solo margen global', 'Ni eso'],
    seleccion: 1,
  },
  {
    etiqueta: 'Rentabilidad del RH',
    pregunta: '¿El cliente puede decir cuánto factura por cada peso de nómina, por área?',
    opciones: ['Sí, por área', 'Solo global', 'No lo mide'],
    seleccion: 2,
  },
]

export const CONTEXTO_NUMEROS: PreguntaNumero[] = [
  {
    etiqueta: 'Rentabilidad erosionada',
    pregunta: '¿Cuántos puntos de margen bruto perdió respecto a hace 12 meses?',
    valor: '6.4 puntos (de 28.1% a 21.7%)',
  },
  {
    etiqueta: 'Capital de trabajo detenido',
    pregunta: '¿Cuántos días tarda el cliente en convertir un peso invertido en inventario en un peso cobrado?',
    valor: '118 días',
  },
  {
    etiqueta: 'Desviaciones operativas',
    pregunta: '¿Qué porcentaje de la producción requiere retrabajo, reproceso o se convierte en merma?',
    valor: '7.8% estimado, sin medición formal',
  },
  {
    etiqueta: 'Gestión de indicadores',
    pregunta: '¿Cuántos indicadores revisa la dirección cada semana y cuántos de ellos traen decisión asociada?',
    valor: '4 reportes, 0 decisiones',
  },
]

export const HIPOTESIS_CLIENTE: PreguntaTexto = {
  etiqueta: 'Hipótesis propia',
  pregunta: 'En palabras del cliente: ¿a qué atribuye él lo que está pasando?',
  valor:
    '"La competencia china bajó precios y el acero subió. No hay de otra más que aguantar el margen para no perder al cliente grande."',
}

/* ---------- PASO 04 ---------- */

export const DOCUMENTOS: Documento[] = [
  { nombre: 'Estado de resultados — 12 meses', detalle: 'Habilita: erosión de margen, tasa de crecimiento sostenible', estado: 'cargado', etiqueta: 'Cargado' },
  { nombre: 'Balance general — 12 meses', detalle: 'Habilita: capital de trabajo, ciclo de conversión de efectivo', estado: 'cargado', etiqueta: 'Cargado' },
  { nombre: 'Ventas por cliente — 12 meses', detalle: 'Habilita: clientes destructores de margen', estado: 'cargado', etiqueta: 'Cargado' },
  { nombre: 'Ventas y costo por línea de producto', detalle: 'Habilita: productos destructores de margen', estado: 'cargado', etiqueta: 'Cargado' },
  { nombre: 'Antigüedad de cuentas por cobrar', detalle: 'Habilita: costo de la falta de liquidez', estado: 'cargado', etiqueta: 'Cargado' },
  { nombre: 'Nómina por área y centro de costo', detalle: 'Habilita: rentabilidad del recurso humano, costo hora-hombre', estado: 'parcial', etiqueta: 'En proceso' },
  { nombre: 'Registro de merma, retrabajos y horas extra', detalle: 'Habilita: costo de desviaciones operativas', estado: 'parcial', etiqueta: 'Parcial — 4 de 12 meses' },
  { nombre: 'Capacidad instalada por centro de trabajo', detalle: 'Bloquea: capacidad instalada vs. utilizada', estado: 'falta', etiqueta: 'Falta' },
]

/* ---------- PASO 05 ---------- */

export const HALLAZGOS: Hallazgo[] = [
  {
    dimension: 'Rentabilidad erosionada',
    severidad: 'critico',
    lectura: 'La venta creció 18% en 12 meses y la utilidad operativa cayó 22%. No es un problema de mercado: el precio promedio se sostuvo, lo que se movió fue la mezcla. Se está creciendo en las líneas que menos dejan.',
    evidencia: 'Margen bruto 28.1% → 21.7% · Utilidad operativa 7.2% → 4.1% · Precio promedio −1.1%',
  },
  {
    dimension: 'Clientes y productos destructores de margen',
    severidad: 'critico',
    lectura: 'Tres cuentas concentran el 31% de la venta y aportan margen de contribución negativo después de costos de servicio, fletes especiales y penalizaciones. Dos líneas de producto operan por debajo del costo variable completo.',
    evidencia: 'Cuenta A: −4.2% · Cuenta D: −1.8% · Cuenta G: −6.9% · Líneas 04 y 09 bajo costo variable',
  },
  {
    dimension: 'Liquidez en riesgo',
    severidad: 'critico',
    lectura: 'Hay utilidad contable y no hay efectivo. El ciclo de conversión se estiró 34 días en 12 meses, financiado con línea revolvente y retraso a proveedores. La empresa está pagando por operar antes de cobrar por operar.',
    evidencia: 'Ciclo 118 días vs. 74 del sector · Línea revolvente al 87% de uso · Días de cobro: 71',
  },
  {
    dimension: 'Capital de trabajo detenido',
    severidad: 'critico',
    lectura: 'Inventario de materia prima y producto terminado creció 41% mientras la venta creció 18%. Hay capital inmovilizado sostenido por una política de compra por volumen que se justifica con descuentos que no compensan el costo financiero.',
    evidencia: 'Inventario $22.5M · Rotación 3.1x vs. 5.8x del sector · 62% del inventario sin movimiento en 90 días',
  },
  {
    dimension: 'Desperdicios y desviaciones operativas',
    severidad: 'alerta',
    lectura: 'Retrabajo estimado en 7.8% sin sistema de medición. Las horas extra crecieron 54% sin incremento proporcional de volumen: se está pagando tiempo adicional para corregir, no para producir.',
    evidencia: 'Horas extra +54% · Volumen +18% · Merma sin registro formal 8 de 12 meses',
  },
  {
    dimension: 'Rentabilidad del recurso humano',
    severidad: 'alerta',
    lectura: 'La facturación por peso de nómina cayó de 6.8 a 5.4 en 12 meses. Se contrató para sostener el crecimiento pero la productividad por persona bajó. Análisis parcial: falta el desglose por centro de costo.',
    evidencia: 'Venta / nómina 6.8 → 5.4 · Plantilla +19% · Venta por empleado −0.6%',
  },
  {
    dimension: 'Gestión de indicadores',
    severidad: 'critico',
    lectura: 'La dirección revisa cuatro reportes semanales y ninguno tiene decisión asociada. No existe indicador de margen por cliente, ni de ciclo de efectivo, ni de retrabajo. Se está midiendo lo que es fácil de medir, no lo que está costando dinero.',
    evidencia: '4 reportes · 0 decisiones documentadas · 0 de los 3 indicadores críticos existen',
  },
  {
    dimension: 'Accountability',
    severidad: 'alerta',
    lectura: 'Las decisiones de descuento las toma comercial sin piso de margen, y el resultado lo absorbe finanzas. Nadie es dueño nominal del margen. El antecedente de 2022 confirma el patrón: se documenta, nadie sostiene.',
    evidencia: 'Sin política de autorización de descuento · Sin dueño nominal por indicador',
  },
]

/* ---------- PASO 06 ---------- */

export const VALIDACIONES: HallazgoValidado[] = [
  {
    dimension: 'Clientes destructores de margen',
    severidad: 'critico',
    resumen: 'Tres cuentas con margen de contribución negativo.',
    validacion: 'confirmado',
    aporte: 'Aporte del cliente: "La cuenta G la sostenemos por volumen para no perder la certificación del corporativo. Nunca calculamos qué nos cuesta eso."',
  },
  {
    dimension: 'Capital de trabajo detenido',
    severidad: 'critico',
    resumen: 'Inventario creció 41% contra venta 18%.',
    validacion: 'matizado',
    aporte: 'Aporte del cliente: "$4.1M del inventario es material apartado por contrato para un proyecto de 2027. Eso no lo puedo tocar." — Cifra ajustada de $22.5M a $18.4M liberable.',
  },
  {
    dimension: 'Desviaciones operativas',
    severidad: 'alerta',
    resumen: 'Retrabajo estimado 7.8% sin medición.',
    validacion: 'confirmado',
    aporte: 'Aporte del cliente: "Producción lleva una libreta con los retrabajos. Nunca se la pedí a nadie." — Carga adicional recibida: 11 meses de registro manual.',
  },
]

export const CARGA_ADICIONAL: Documento[] = [
  { nombre: 'Libreta de retrabajos — producción, 11 meses', detalle: 'Desbloquea: costo real de reprocesos', estado: 'cargado', etiqueta: 'Cargado' },
  { nombre: 'Contrato de material apartado 2027', detalle: 'Ajusta: capital de trabajo liberable', estado: 'cargado', etiqueta: 'Cargado' },
  { nombre: 'Capacidad instalada por centro de trabajo', detalle: 'Habilita: venta potencial no capturada', estado: 'cargado', etiqueta: 'Cargado' },
]

/* ---------- PASO 07 ---------- */

export const COSTO_TOTAL = {
  monto: '$29,000,000',
  contexto: '16.1% de la facturación anual · 5.2 veces la utilidad neta declarada',
  encabezado: 'Manufacturas del Norte, S.A. · Ejercicio anualizado · Cifras en MXN',
}

export const LINEAS_COSTO: LineaCosto[] = [
  { concepto: 'Costo de la rentabilidad erosionada', base: '6.4 puntos de margen bruto perdidos sobre venta anual, netos de efecto precio', monto: '$14,200,000' },
  { concepto: 'Costo de la falta de liquidez', base: 'Costo financiero de línea revolvente al 87% + descuentos por pronto pago no tomados', monto: '$3,800,000' },
  { concepto: 'Costo de retrabajos y reprocesos', base: 'Material, hora-máquina y horas extra sobre 11 meses de registro real', monto: '$6,100,000' },
  { concepto: 'Costo de la ineficiencia del recurso humano', base: 'Caída de 6.8 a 5.4 en facturación por peso de nómina, sobre plantilla actual', monto: '$4,900,000' },
]

export const INDICADORES_STOCK: Indicador[] = [
  { etiqueta: 'Capital de trabajo detenido', valor: '$18,400,000', detalle: 'Inventario liberable tras descontar material apartado por contrato. Equivale a 5.9 semanas de nómina.' },
  { etiqueta: 'Capacidad no utilizada', valor: '32%', detalle: 'Capacidad instalada 68% utilizada. Venta potencial no capturada: $31.0M sin inversión adicional en activo.' },
  { etiqueta: 'Tasa de crecimiento sostenible', valor: '6.4%', detalle: 'La empresa creció 18% con estructura financiera para 6.4%. La brecha se financió con proveedores y banco.' },
]

/* ---------- PASO 08 ---------- */

export const CADENA_CAUSAL: Eslabon[] = [
  { nivel: 'Síntoma', texto: '"Vendemos más y no hay dinero."' },
  { nivel: '¿Por qué?', texto: 'Porque el margen de contribución cayó 6.4 puntos mientras el volumen crecía.' },
  { nivel: '¿Por qué?', texto: 'Porque el crecimiento se concentró en tres cuentas y dos líneas que operan bajo costo.' },
  { nivel: '¿Por qué?', texto: 'Porque comercial autoriza precio y condición de crédito sin piso de margen definido.' },
  { nivel: '¿Por qué?', texto: 'Porque no existe rentabilidad calculada por cliente y por línea: se decide contra margen bruto global.' },
  { nivel: '¿Por qué?', texto: 'Porque el sistema de indicadores mide volumen y no mide margen, y nadie es dueño nominal del margen.' },
]

export const CAUSA_RAIZ =
  'La empresa toma decisiones comerciales sobre información que no existe, y nadie responde por el resultado de esas decisiones. El margen no tiene dueño.'

/* ---------- PASO 09 ---------- */

export const PLAN: FaseDelPlan[] = [
  {
    nombre: 'Fase 1 — Instalar la medición que no existe',
    ventana: 'Días 1 a 21',
    acciones: [
      'Construir rentabilidad real por cliente y por línea, con costos indirectos asignados por driver, no por prorrateo.',
      'Definir el piso de margen por familia de producto y la matriz de autorización de descuentos.',
      'Instalar registro formal de retrabajo y merma en piso, con captura diaria por centro de trabajo.',
    ],
    herramientas: [
      { nombre: 'Matriz de Rentabilidad por Cliente y Línea', modulo: 'Finanzas' },
      { nombre: 'Política de Piso de Margen y Autorización de Descuentos', modulo: 'Ventas' },
      { nombre: 'Formato de Registro de Retrabajo por Centro', modulo: 'Operación' },
    ],
  },
  {
    nombre: 'Fase 2 — Recuperar margen y liberar efectivo',
    ventana: 'Días 22 a 60',
    acciones: [
      'Renegociar las tres cuentas destructoras con escenario cuantificado: precio, condición de pago o salida ordenada.',
      'Descontinuar o rediseñar las líneas 04 y 09, que operan bajo costo variable completo.',
      'Ejecutar liberación de inventario sin movimiento: meta $9.0M en 60 días de los $18.4M liberables.',
      'Reducir los días de cobro de 71 a 55 con política de crédito ligada al piso de margen.',
    ],
    herramientas: [
      { nombre: 'Kit de Renegociación de Cuentas Destructoras', modulo: 'Ventas' },
      { nombre: 'Plan de Liberación de Capital de Trabajo', modulo: 'Finanzas' },
      { nombre: 'Programa de Reducción de Retrabajos — PDCA', modulo: 'Operación' },
    ],
  },
  {
    nombre: 'Fase 3 — Sostener con accountability',
    ventana: 'Días 61 a 90',
    acciones: [
      'Instalar el tablero de siete indicadores críticos con dueño nominal y frecuencia definida.',
      'Establecer junta semanal de rendición de cuentas con evidencia, no con reporte.',
      'Ligar la capacidad ociosa del 32% a un plan comercial dirigido a las líneas con margen sano.',
    ],
    herramientas: [
      { nombre: 'Tablero de Control Ejecutivo — Plantilla', modulo: 'Formatos' },
      { nombre: 'Matriz RACI por Iniciativa', modulo: 'RRHH' },
      { nombre: 'Formato de Junta de Rendición de Cuentas', modulo: 'Formatos' },
    ],
  },
]

/* ---------- PASO 10 ---------- */

export const KPIS: Kpi[] = [
  { indicador: 'Margen de contribución por cliente', base: '21.7%', meta: '26.5%', frecuencia: 'Mensual', responsable: 'Dir. Comercial' },
  { indicador: 'Cuentas con margen negativo', base: '3', meta: '0', frecuencia: 'Mensual', responsable: 'Dir. Comercial' },
  { indicador: 'Ciclo de conversión de efectivo', base: '118 días', meta: '92 días', frecuencia: 'Semanal', responsable: 'Dir. Finanzas' },
  { indicador: 'Inventario sin movimiento >90 días', base: '$11.4M', meta: '$4.0M', frecuencia: 'Semanal', responsable: 'Gte. Materiales' },
  { indicador: 'Costo de retrabajo sobre venta', base: '3.4%', meta: '1.5%', frecuencia: 'Semanal', responsable: 'Gte. Producción' },
  { indicador: 'Facturación por peso de nómina', base: '5.4', meta: '6.2', frecuencia: 'Mensual', responsable: 'Dir. General' },
  { indicador: 'Utilización de capacidad instalada', base: '68%', meta: '82%', frecuencia: 'Mensual', responsable: 'Gte. Producción' },
]

export const RITMO: Documento[] = [
  { nombre: 'Junta semanal de indicadores operativos', detalle: 'Martes 8:00 · 45 min · Producción, Materiales, Finanzas · Con evidencia', estado: 'definido', etiqueta: 'Definida' },
  { nombre: 'Junta mensual de rentabilidad', detalle: 'Primer jueves · 90 min · Dirección General y Comercial · Decisión documentada', estado: 'definido', etiqueta: 'Definida' },
  { nombre: 'Revisión de avance del plan con consultor', detalle: 'Quincenal · Contra las tres fases y las metas de 90 días', estado: 'definido', etiqueta: 'Definida' },
]
