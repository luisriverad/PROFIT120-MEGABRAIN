import type {
  CampoFinanciero, FilaTendencia,
  Accountability, BateriaContexto, CausasRaiz, CostoInaccion, DetalleAccion, Ejercicio, MapaRiesgos,
  PlanArranque, PlanTrabajo, PreguntaNumero,
  PreguntaOpciones, PreguntaTexto,
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
 * Van agrupadas por naturaleza contable —resultados, personal, capital de
 * trabajo, estructura financiera y flujo de efectivo— porque así están en los
 * estados que trae el contador: el consultor las va cazando de un documento a
 * la vez en lugar de saltar entre carátulas. Todo lo demás de la radiografía se
 * deriva de aquí (ver RAZONES en data/finanzas.ts).
 */
export const EJERCICIOS: Ejercicio[] = [
  // El MTD corre del 1 de enero al último cierre mensual disponible. Cuál es ese
  // mes lo elige el consultor en el encabezado, porque depende de qué tan al
  // corriente esté la contabilidad del cliente. Sus flujos se anualizan antes de
  // cualquier razón, para que la comparación contra un año completo no salga
  // hecha con siete doceavos de venta.
  { etiqueta: 'MTD 2026', meses: 7, enCurso: true },
  { etiqueta: 'Cierre 2025', meses: 12 },
  { etiqueta: 'Cierre 2024', meses: 12 },
]

export const CAMPOS_FINANCIEROS: CampoFinanciero[] = [
  /* ---------- Resultados del ejercicio ---------- */
  {
    clave: 'ventas', concepto: 'Facturación', unidad: 'mxn', fuente: 'sesion', naturaleza: 'resultados',
    ayuda: 'Venta neta del periodo, sin IVA.',
    acumula: true,
    valores: [111_300_000, 180_400_000, 152_900_000],
  },
  {
    clave: 'costoVentas', concepto: 'Costo de ventas', unidad: 'mxn', fuente: 'caratula', naturaleza: 'resultados',
    ayuda: 'Material, mano de obra directa y gastos indirectos de fabricación.',
    acumula: true,
    valores: [89_000_000, 141_250_000, 109_935_000],
  },
  {
    clave: 'utilidadOperativa', concepto: 'Utilidad de operación', unidad: 'mxn', fuente: 'caratula', naturaleza: 'resultados',
    ayuda: 'Antes de intereses e impuestos. Es la que mide el negocio, no la estructura financiera.',
    acumula: true,
    valores: [3_150_000, 7_400_000, 11_010_000],
  },
  {
    clave: 'depreciacion', concepto: 'Depreciación y amortización', unidad: 'mxn', fuente: 'caratula', naturaleza: 'resultados',
    ayuda: 'Cargo contable del periodo. No sale de la caja, por eso se suma de vuelta para llegar al EBITDA.',
    acumula: true,
    valores: [5_400_000, 8_900_000, 7_600_000],
  },
  {
    // El dato que pide el banco. No se pregunta: la utilidad de operación y la
    // depreciación ya están arriba.
    clave: 'ebitda', concepto: 'EBITDA', unidad: 'mxn', fuente: 'caratula', naturaleza: 'resultados',
    ayuda: 'Calculado: Utilidad de operación + Depreciación y amortización.',
    acumula: true,
    valores: [],
    derivado: (v) => (
      v.utilidadOperativa !== undefined && v.depreciacion !== undefined
        ? v.utilidadOperativa + v.depreciacion
        : null
    ),
  },
  {
    clave: 'utilidadNeta', concepto: 'Utilidad neta declarada', unidad: 'mxn', fuente: 'sesion', naturaleza: 'resultados',
    ayuda: 'La que el cliente declara. Se toma como dicha, se valida después.',
    acumula: true,
    valores: [1_180_000, 5_590_000, 6_730_000],
  },

  /* ---------- Personal ---------- */
  {
    clave: 'nomina', concepto: 'Nómina total del periodo', unidad: 'mxn', fuente: 'sesion', naturaleza: 'personal',
    ayuda: 'Sueldos, cargas sociales y prestaciones. Costo, no percepción.',
    acumula: true,
    valores: [21_500_000, 33_400_000, 22_500_000],
  },
  {
    clave: 'empleados', concepto: 'Empleados totales', unidad: 'conteo', fuente: 'sesion', naturaleza: 'personal',
    ayuda: 'Plantilla al corte, nómina propia más outsourcing fijo.',
    valores: [147, 140, 118],
  },

  /* ---------- Capital de trabajo ---------- */
  {
    clave: 'caja', concepto: 'Caja y bancos', unidad: 'mxn', fuente: 'sesion', naturaleza: 'capitalTrabajo',
    ayuda: 'Saldo disponible al corte, sin inversiones restringidas.',
    valores: [1_450_000, 2_100_000, 4_800_000],
  },
  {
    clave: 'cxc', concepto: 'Cuentas por cobrar', unidad: 'mxn', fuente: 'caratula', naturaleza: 'capitalTrabajo',
    ayuda: 'Cartera de clientes al corte, bruta.',
    valores: [39_800_000, 35_100_000, 21_800_000],
  },
  {
    clave: 'inventarioInicial', concepto: 'Inventario inicial', unidad: 'mxn', fuente: 'caratula', naturaleza: 'capitalTrabajo',
    ayuda: 'El que quedó al cierre del periodo anterior. Materia prima, en proceso y producto terminado, a costo.',
    valores: [22_500_000, 15_960_000, 11_200_000],
  },
  {
    clave: 'inventarioFinal', concepto: 'Inventario final', unidad: 'mxn', fuente: 'sesion', naturaleza: 'capitalTrabajo',
    ayuda: 'El que hay al corte, con el mismo criterio de valuación.',
    valores: [25_900_000, 22_500_000, 15_960_000],
  },
  {
    // Nadie recuerda cuánto compró en el año, pero sí lo que tenía en bodega al
    // abrir y al cerrar. La contabilidad da lo mismo por el camino largo.
    clave: 'compras', concepto: 'Compras del periodo', unidad: 'mxn', fuente: 'caratula', naturaleza: 'capitalTrabajo',
    ayuda: 'Calculado: Inventario final + Costo de ventas − Inventario inicial.',
    acumula: true,
    valores: [],
    derivado: (v) => (
      v.inventarioFinal !== undefined && v.costoVentas !== undefined && v.inventarioInicial !== undefined
        ? v.inventarioFinal + v.costoVentas - v.inventarioInicial
        : null
    ),
  },
  {
    clave: 'cxp', concepto: 'Cuentas por pagar', unidad: 'mxn', fuente: 'caratula', naturaleza: 'capitalTrabajo',
    ayuda: 'Proveedores de operación. No incluye deuda bancaria.',
    valores: [23_400_000, 20_100_000, 13_550_000],
  },
  {
    clave: 'activoCirculante', concepto: 'Activo circulante total', unidad: 'mxn', fuente: 'caratula', naturaleza: 'capitalTrabajo',
    ayuda: 'Todo lo que se vuelve efectivo dentro de doce meses: caja, cartera, inventario, anticipos e impuestos a favor.',
    valores: [70_950_000, 63_100_000, 45_460_000],
  },
  {
    clave: 'pasivoCirculante', concepto: 'Pasivo circulante total', unidad: 'mxn', fuente: 'caratula', naturaleza: 'capitalTrabajo',
    ayuda: 'Todo lo que vence dentro de doce meses: proveedores, impuestos, acreedores y la porción corriente de la deuda.',
    valores: [41_200_000, 34_800_000, 22_400_000],
  },

  /* ---------- Estructura financiera ---------- */
  {
    clave: 'deuda', concepto: 'Deuda con costo', unidad: 'mxn', fuente: 'sesion', naturaleza: 'estructura',
    ayuda: 'Bancos y arrendamiento. No incluye proveedores.',
    valores: [44_500_000, 38_000_000, 24_500_000],
  },
  {
    clave: 'capital', concepto: 'Capital contable', unidad: 'mxn', fuente: 'caratula', naturaleza: 'estructura',
    ayuda: 'Patrimonio de los socios al corte. Sin él no hay ROE.',
    valores: [63_100_000, 62_400_000, 57_300_000],
  },

  /* ---------- Flujo de efectivo ---------- */
  {
    clave: 'fco', concepto: 'Flujo de caja de operación', unidad: 'mxn', fuente: 'caratula', naturaleza: 'flujo',
    ayuda: 'Efectivo que dejó la operación, del estado de flujo de efectivo. Es la utilidad ya cobrada y pagada.',
    acumula: true,
    valores: [620_000, 1_850_000, 8_900_000],
  },
  {
    clave: 'capex', concepto: 'Inversión en activo fijo', unidad: 'mxn', fuente: 'caratula', naturaleza: 'flujo',
    ayuda: 'Lo que se gastó en máquinas, equipo e instalaciones durante el periodo.',
    acumula: true,
    valores: [2_900_000, 6_400_000, 4_200_000],
  },
]

/**
 * Mapa de riesgos del caso demostrativo.
 *
 * Es lo que devolvería el análisis a profundidad sobre estos números, y sirve
 * para ver el motor lleno sin gastar una llamada. En cuanto haya credencial y
 * alguien pulse "Análisis a profundidad", esto se reemplaza por la lectura real.
 * Las dimensiones de `dimensionesEvidentes` son las que el paso 02 premarca en
 * amarillo.
 */
export const MAPA_DEMO: MapaRiesgos = {
  urgencia: 'rojo',
  veredicto:
    'La empresa creció 18% en venta y perdió la mitad de su rentabilidad haciéndolo. El problema no es comercial: cada peso vendido de más exige 22 centavos de capital de trabajo que nadie está financiando con operación, así que se financian con deuda — que pasó de $24.5M a $44.5M en año y medio. La utilidad que declara el estado de resultados no llega al banco: de cada peso facturado en el periodo en curso solo 0.6 centavos se convirtieron en caja. Ya cruzó el covenant de 3 veces deuda sobre EBITDA y le quedan dieciséis días de tesorería.',
  riesgos: [
    {
      titulo: 'La utilidad existe en el papel y no en el banco',
      semaforo: 'rojo',
      frente: 'Liquidez',
      lectura:
        'El estado de resultados declara utilidad y la operación no genera efectivo. La diferencia se la está tragando el capital de trabajo: cartera e inventario crecieron más rápido que la venta y la caja se drenó para financiarlos. Mientras esa brecha siga abierta, cada mes bueno en ventas empeora la posición de caja.',
      evidencia: [
        'Margen de caja: 0.6% MTD anualizado vs 1.0% en 2025 y 5.8% en 2024. La industria está en 10.5%.',
        'Utilidad neta declarada 2025: $5,590,000. Flujo de caja de operación del mismo año: $1,850,000.',
        'Caja y bancos: $4,800,000 al cierre 2024, $2,100,000 al cierre 2025, $1,450,000 al corte de julio.',
      ],
      ventana: 'Ya está ocurriendo. La siguiente nómina de aguinaldo es el punto de quiebre.',
      primerMovimiento:
        'Poner un corte semanal de cobranza con los seis clientes que hacen el 80% de la venta, empezando por los que traen más de 90 días.',
    },
    {
      titulo: 'La deuda ya rompió el covenant bancario',
      semaforo: 'rojo',
      frente: 'Deuda',
      lectura:
        'Deuda sobre EBITDA cruzó las 3 veces que trae escrito casi todo contrato de crédito en México. Medido contra la caja que de verdad genera la operación, en lugar del EBITDA contable, el número es indefendible. Es probable que el banco ya lo sepa y esté esperando la renovación para apretar.',
      evidencia: [
        'Deuda sobre EBITDA: 3.04x MTD anualizado vs 2.33x en 2025 y 1.32x en 2024. Promedio del sector: 2.2x.',
        'Deuda sobre flujo de caja operativo: 41.9x MTD vs 2.75x en 2024. La industria está en 3.0x.',
        'Deuda con costo: $24,500,000 en 2024, $38,000,000 en 2025, $44,500,000 al corte.',
      ],
      ventana: 'A la próxima renovación de línea. Antes si el banco pide estados intermedios.',
      primerMovimiento:
        'Armar el estado de flujo proyectado a trece semanas antes de sentarse con el banco, para llegar con un plan en lugar de con una explicación.',
    },
    {
      titulo: 'Crecer está destruyendo valor',
      semaforo: 'rojo',
      frente: 'Rentabilidad',
      lectura:
        'El ROIC quedó por debajo del costo de la deuda. Con la TIIE en 6.74%, cada peso nuevo que entra al negocio rinde menos de lo que cuesta financiarlo. En esas condiciones vender más no arregla nada: acelera la sangría, y es exactamente lo que el cliente vino a pedir.',
      evidencia: [
        'ROIC: 3.5% MTD anualizado vs 5.2% en 2025 y 9.4% en 2024. Promedio del sector: 9.0%.',
        'TIIE 28 días en 6.74% (Banxico, agosto 2026): el retorno está casi la mitad por debajo del costo del dinero.',
        'ROS: 2.8% MTD vs 8.5% de la industria. Margen EBITDA: 7.7% vs 14.5%.',
      ],
      ventana: 'Estructural. Cada trimestre de crecimiento sin corregir margen amplía el hueco.',
      primerMovimiento:
        'Sacar la rentabilidad por cliente y por línea con costos indirectos asignados, antes de aceptar un pedido más.',
    },
    {
      titulo: 'El capital de trabajo crece más rápido que la venta',
      semaforo: 'rojo',
      frente: 'Capital de trabajo',
      lectura:
        'El ciclo de conversión de efectivo se alargó a 83 días y la cartera es la que lo mueve: se cobra ocho días más tarde que hace un año y trece días más tarde que el promedio del sector. Cada día de cartera son aproximadamente $530,000 inmovilizados a la venta actual.',
      evidencia: [
        'Cuentas por cobrar en días: 51 en 2024, 70 en 2025, 75 al corte. Industria: 62.',
        'Ciclo de conversión de efectivo: 83 días MTD vs 78 en 2025. Industria: 75.',
        'Capital de trabajo operativo: $29,010,000 en 2024, $39,600,000 en 2025, $43,750,000 al corte — creció 51% mientras la venta creció 18%.',
        'NOF sobre ventas: 22.2% MTD vs 18.5% de la industria.',
      ],
      ventana: 'Seis meses antes de que la línea de crédito no alcance para el ciclo.',
      primerMovimiento:
        'Renegociar plazo con los tres proveedores principales: se paga a 53 días contra 55 del sector, y ahí hay financiamiento gratis sin usar.',
    },
    {
      titulo: 'La nómina creció al doble de velocidad que la venta',
      semaforo: 'amarillo',
      frente: 'Recurso humano',
      lectura:
        'Se contrataron 29 personas en año y medio y la venta por peso de nómina cayó. La estructura creció comprando costo fijo, no capacidad: la productividad por colaborador está por debajo de donde estaba antes de contratar.',
      evidencia: [
        'Nómina: $22,500,000 en 2024 a $33,400,000 en 2025, +48%. La venta creció 18% en el mismo periodo.',
        'Venta por peso de nómina: 6.80x en 2024, 5.40x en 2025, 5.18x MTD anualizado. Industria: 5.5x.',
        'Plantilla: 118 a 140 a 147 empleados.',
      ],
      ventana: 'Doce meses. Es reversible mientras no se vuelva estructura formal.',
      primerMovimiento:
        'Congelar contrataciones y medir venta por peso de nómina por área, no global, para saber dónde se fue el crecimiento.',
    },
    {
      titulo: 'Seis clientes sostienen el 80% de la facturación',
      semaforo: 'amarillo',
      frente: 'Comercial',
      lectura:
        'La concentración multiplica todo lo anterior: son los mismos clientes que definen el plazo de cobro y los que pueden imponer precio. Perder uno no es perder un cliente, es perder un décimo de la empresa con la caja ya comprometida.',
      evidencia: [
        'Seis clientes concentran el 80% de la venta sobre 11 líneas activas.',
        'Cartera en 75 días: el plazo lo está poniendo el cliente, no la empresa.',
      ],
      ventana: 'Latente. Se vuelve crítico el día que uno se atrase o se vaya.',
      primerMovimiento:
        'Poner el margen de contribución de cada uno de esos seis sobre la mesa antes de la próxima negociación de precio.',
    },
    {
      titulo: 'El inventario es lo único que va mejor que su industria',
      semaforo: 'verde',
      frente: 'Operación',
      lectura:
        'Los inventarios rotan siete días más rápido que el promedio del sector y esa ventaja se sostuvo mientras todo lo demás se deterioraba. Es la parte del ciclo que ya funciona y sobre la que se puede construir; el problema del capital de trabajo está en la cartera, no en la bodega.',
      evidencia: [
        'Inventarios en días: 61 al corte vs 68 del promedio de la industria.',
        'Prueba del ácido: 1.09x, por encima del 1.05x del sector.',
      ],
      ventana: 'Sin riesgo. Conviene defenderlo de recortes mal dirigidos.',
      primerMovimiento:
        'No tocarlo. Si se busca liberar caja, la palanca está en cartera y en plazo de proveedores.',
    },
  ],
  puntosCiegos: [
    'El margen bruto cayó 6.4 puntos, pero estos números no dicen si fue por precio o por costo. Sin la apertura de descuentos y de costo unitario no se puede saber cuál de las dos atacar primero.',
    'No hay dato de antigüedad de cartera. Setenta y cinco días promedio pueden ser todos los clientes pagando a 75 o la mitad pagando a 30 y un par a 180 — el plan cambia por completo.',
    'La deuda aparece como monto, no como calendario. Sin el perfil de vencimientos no se puede decir si el problema es de estructura o de tiempo.',
    'Los 147 empleados no vienen abiertos por área. Sin eso no se sabe si el crecimiento de nómina fue en producción, en administración o en ventas.',
  ],
  dimensionesEvidentes: [
    'Unit economics deteriorados',
    'Dependencia de clientes / productos clave',
    'Escalabilidad limitada',
    'Estructura de costos sobredimensionada',
    'Tiempos de ciclo excesivos',
    'Estructura organizacional sobredimensionada',
    'Riesgo de continuidad / ciberseguridad',
  ],
}

/**
 * Plan de arranque del caso demostrativo. Es lo que devolvería la priorización
 * sobre estas quince dimensiones marcadas y el mapa de riesgos de arriba.
 */
export const PLAN_DEMO: PlanArranque = {
  resumen:
    'Manufacturas del Norte creció 18% en venta y perdió la mitad de su rentabilidad haciéndolo: el ROIC quedó en 3.5% contra una TIIE de 6.74%, la deuda pasó de $24.5M a $44.5M y quedan dieciséis días de tesorería. Las quince dimensiones marcadas se reducen a tres frentes. Se arranca por cobranza y ciclo de capital de trabajo, que es lo único que devuelve efectivo en semanas. Sigue rentabilidad por cliente y por línea, para poder decirle que no a un pedido. Cierra estructura y productividad, donde está el costo fijo que se comió el margen. El cliente pidió vender más y el plan es cobrar, medir y contener.',
  frentes: [
    {
      nombre: 'Cobranza y ciclo de capital de trabajo',
      criticidad: 'rojo',
      porQue:
        'Es el único frente que devuelve efectivo en semanas y no en trimestres. La cartera se alargó de 51 a 75 días en año y medio: cada día que se recupera son unos $530,000 que regresan a la caja sin vender un peso más. Con dieciséis días de tesorería, esto no es una mejora, es lo que compra el tiempo para hacer los otros dos.',
      dimensiones: [
        'Capital de trabajo detenido',
        'Liquidez en riesgo',
        'Tiempos de ciclo excesivos',
        'Escalabilidad limitada',
        'Riesgo de continuidad / ciberseguridad',
      ],
      desbloquea:
        'Caja para operar sin ampliar línea de crédito, y con ella el margen de maniobra para negociar con el banco desde un plan en vez de desde una urgencia.',
      siNoSeAtiende:
        'La línea de crédito se agota en el ciclo antes de fin de año y cualquier corrección de rentabilidad llega tarde porque ya no hay con qué financiarla.',
      primerasAcciones: [
        'Sacar la antigüedad de cartera por cliente y separar lo que está a más de 90 días: es el dato que hoy no existe y sin él la cobranza se hace a ciegas.',
        'Corte semanal de cobranza con los seis clientes que hacen el 80% de la venta, con nombre y apellido del responsable de cada uno.',
        'Renegociar plazo con los tres proveedores principales: se paga a 53 días contra 55 del sector, y ahí hay financiamiento gratis sin usar.',
        'Congelar cualquier crecimiento de inventario mientras el ciclo no baje de 78 días.',
      ],
    },
    {
      nombre: 'Rentabilidad por cliente y por línea',
      criticidad: 'rojo',
      porQue:
        'El ROIC quedó en 3.5% contra una TIIE de 6.74%: crecer destruye valor y nadie sabe con qué clientes ni con qué líneas. El margen bruto cayó 6.4 puntos y el expediente no dice si fue precio o costo. Sin esa apertura, cualquier decisión comercial de los próximos meses es una apuesta.',
      dimensiones: [
        'Rentabilidad erosionada',
        'Retorno sobre capital insuficiente',
        'Unit economics deteriorados',
        'Clientes destructores de margen',
        'Productos / servicios destructores de margen',
        'Dependencia de clientes / productos clave',
      ],
      desbloquea:
        'Poder decirle que no a un pedido. Es también lo que convierte la cobranza del frente 01 en negociación de precio y plazo con argumento.',
      siNoSeAtiende:
        'Se sigue creciendo con los clientes que destruyen margen, que suelen ser los mismos que imponen el plazo de 75 días.',
      primerasAcciones: [
        'Estado de resultados por cliente y por línea con costos indirectos asignados, para los seis clientes que concentran el 80%.',
        'Abrir la caída de margen bruto en efecto precio y efecto costo, mes a mes desde enero de 2025.',
        'Poner piso de margen de contribución por pedido y quién tiene autoridad para bajarlo.',
      ],
    },
    {
      nombre: 'Estructura y productividad del recurso humano',
      criticidad: 'amarillo',
      porQue:
        'La nómina creció 48% mientras la venta creció 18%, y la venta por peso de nómina cayó de 6.80x a 5.18x. Es el costo fijo que se comió el margen. Va tercero a propósito: recortar antes de tener el frente 02 es cortar donde no duele hoy y sí duele en doce meses.',
      dimensiones: [
        'Estructura de costos sobredimensionada',
        'Baja productividad por colaborador',
        'Estructura organizacional sobredimensionada',
        'Desperdicios y retrabajos',
      ],
      desbloquea:
        'Recuperar los puntos de margen operativo que el crecimiento de estructura se llevó, ya sabiendo qué áreas sostienen a los clientes que sí dejan.',
      siNoSeAtiende:
        'El costo fijo queda instalado y la empresa necesita vender cada vez más solo para quedar tablas.',
      primerasAcciones: [
        'Abrir los 147 empleados por área y calcular venta por peso de nómina de cada una, no global.',
        'Congelar contrataciones hasta cerrar el frente 02.',
        'Medir el costo de retrabajo con dato, no con el 7.8% estimado que hoy nadie sostiene.',
      ],
    },
  ],
  esperanTurno: [
    {
      dimension: 'Fugas de precio y descuentos',
      porQue: 'Sale sola del frente 02 en cuanto se abra la caída de margen en precio y costo. Atacarla antes sería adivinar.',
    },
    {
      dimension: 'Cost-to-serve excesivo',
      porQue: 'Depende de tener el costo por cliente asignado. Es el segundo entregable del frente 02, no un frente aparte.',
    },
    {
      dimension: 'Costo de mala calidad',
      porQue: 'El sistema de calidad quedó sin explorar y no hay una sola cifra de devoluciones ni de garantías. Se levanta en la carga del paso 04.',
    },
    {
      dimension: 'Riesgo fiscal',
      porQue: 'No espera por prioridad sino por información: con utilidad declarada de $5.59M y flujo operativo de $1.85M en el mismo ejercicio, conviene revisarlo en la siguiente sesión antes de que lo revise alguien más.',
    },
  ],
}

/**
 * Batería del paso 03 para el caso demostrativo. Es lo que escribiría el motor
 * a partir de los tres frentes de PLAN_DEMO: cada pregunta existe para
 * confirmar o tumbar algo de ese plan, y las cifras que la radiografía ya
 * resuelve vienen con derivaDe en lugar de preguntarse.
 */
export const BATERIA_DEMO: BateriaContexto = {
  preguntas: [
    /* ---- Frente 01 ---- */
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      pregunta: '¿Cuántos días tarda en convertir un peso invertido en inventario en un peso cobrado?',
      tipo: 'cifra',
      derivaDe: 'cicloEfectivo',
    },
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      pregunta: '¿Cuántos días puede seguir operando con la caja que tiene hoy?',
      tipo: 'cifra',
      derivaDe: 'tesoreria',
    },
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      pregunta: '¿Existe un reporte de antigüedad de cartera y quién lo revisa?',
      tipo: 'opciones',
      opciones: ['Semanal, con responsable por cliente', 'Se saca pero nadie lo revisa', 'No existe'],
    },
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      pregunta: '¿Quién autoriza el plazo de crédito que se le da a un cliente?',
      tipo: 'opciones',
      opciones: ['Política escrita con topes', 'El dueño, caso por caso', 'El vendedor', 'Se copia el del cliente anterior'],
    },
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      pregunta: '¿Se ha negociado el plazo de pago con los tres proveedores principales en los últimos 12 meses?',
      tipo: 'opciones',
      opciones: ['Sí, y se movió', 'Se intentó y no se movió', 'Hace más de un año', 'Nunca'],
    },
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      pregunta: '¿Qué pasó las últimas dos veces que un cliente grande se atrasó más de 60 días?',
      tipo: 'abierta',
    },
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      pregunta: '¿Cuántas veces su generación de caja operativa cuesta la deuda que trae?',
      tipo: 'cifra',
      derivaDe: 'apalancamiento',
    },

    /* ---- Frente 02 ---- */
    {
      frente: 'Rentabilidad por cliente y por línea',
      pregunta: '¿Cuántos puntos de margen bruto perdió respecto al periodo anterior?',
      tipo: 'cifra',
      derivaDe: 'margenBruto',
    },
    {
      frente: 'Rentabilidad por cliente y por línea',
      pregunta: '¿Sabe cuánto le deja cada cliente después de repartir los costos indirectos?',
      tipo: 'opciones',
      opciones: ['Rentabilidad por cliente y por línea', 'Solo margen bruto por línea', 'Solo margen global', 'Ni eso'],
    },
    {
      frente: 'Rentabilidad por cliente y por línea',
      pregunta: '¿Quién puede autorizar un descuento y hasta qué porcentaje?',
      tipo: 'opciones',
      opciones: ['Política escrita con tope', 'El dueño, caso por caso', 'El vendedor sin tope', 'No se dan descuentos'],
    },
    {
      frente: 'Rentabilidad por cliente y por línea',
      pregunta: '¿Cuándo se actualizó por última vez el costeo de las líneas principales?',
      tipo: 'opciones',
      opciones: ['Este año', 'Hace uno o dos años', 'Más de dos años', 'Nunca se ha hecho'],
    },
    {
      frente: 'Rentabilidad por cliente y por línea',
      pregunta: 'De las 11 líneas activas, ¿cuáles cree que son las más rentables y en qué se basa para decirlo?',
      tipo: 'abierta',
    },
    {
      frente: 'Rentabilidad por cliente y por línea',
      pregunta: '¿La caída de margen viene de que se vende más barato o de que cuesta más producir?',
      tipo: 'opciones',
      opciones: ['Se vende más barato', 'Cuesta más producir', 'Las dos cosas', 'No lo tiene separado'],
    },

    /* ---- Frente 03 ---- */
    {
      frente: 'Estructura y productividad del recurso humano',
      pregunta: '¿A qué velocidad creció la nómina frente a la venta?',
      tipo: 'cifra',
      derivaDe: 'nominaVenta',
    },
    {
      frente: 'Estructura y productividad del recurso humano',
      pregunta: 'Las 29 personas que entraron en año y medio, ¿en qué área quedaron?',
      tipo: 'opciones',
      opciones: ['Mayoría en producción', 'Repartido', 'Mayoría en administración y ventas', 'No lo tiene claro'],
    },
    {
      frente: 'Estructura y productividad del recurso humano',
      pregunta: '¿Se mide la productividad por área o solo la global?',
      tipo: 'opciones',
      opciones: ['Por área, con meta', 'Por área, sin meta', 'Solo global', 'No se mide'],
    },
    {
      frente: 'Estructura y productividad del recurso humano',
      pregunta: '¿Qué se logró hacer con las personas que entraron el último año que antes no se podía?',
      tipo: 'abierta',
    },
    {
      frente: 'Estructura y productividad del recurso humano',
      pregunta: '¿El 7.8% de retrabajo y merma está medido o es una estimación de piso?',
      tipo: 'opciones',
      opciones: ['Medido y registrado', 'Se estima por lote', 'Es percepción del jefe de planta', 'No se mide'],
    },
  ],
}

/**
 * Costo de la inacción del caso demostrativo, amarrado a los tres frentes de
 * PLAN_DEMO. El total no se declara aquí: lo suma el motor.
 */
export const COSTO_DEMO: CostoInaccion = {
  lectura:
    'El cliente pidió vender más. Vender más al ritmo actual amplifica una pérdida de $31M al año y consume una capacidad de crecimiento financiable que la empresa ya rebasó: creció 18% con estructura para 6%. El crecimiento no es la solución — es el mecanismo que está acelerando el problema. Los tres frentes del diagnóstico son exactamente los tres renglones de esta cuenta, así que lo que se va a arreglar y lo que se está perdiendo son la misma cosa.',
  frentes: [
    {
      frente: 'Cobranza y ciclo de capital de trabajo',
      monto: 7_300_000,
      base: 'El ciclo de efectivo está en 83 días contra 75 del sector. Sobre una venta diaria de $530,000, esos 8 días de más inmovilizan $4.2M; sumados a los 24 días que se alargó la cartera desde 2024 ($12.7M), son $16.9M financiados a 13% anual — el costo real de la deuda con costo hoy. A eso se le agregan los descuentos por pronto pago que no se toman por falta de caja.',
      supuestos: [
        'Costo de la deuda con costo en 13% anual: TIIE 28 en 6.74% más 6.3 puntos de spread bancario típico para empresa mediana sin garantía real.',
        'Venta diaria de $530,000, sobre facturación anualizada de $190.8M entre 360 días.',
        'Descuentos por pronto pago no tomados estimados en 1.5% sobre el 40% de las compras anuales.',
      ],
      recuperable:
        'Entre $4M y $5M en los primeros seis meses, sin inversión: son días de cartera y de plazo con proveedor, no capital nuevo.',
    },
    {
      frente: 'Rentabilidad por cliente y por línea',
      monto: 14_900_000,
      base: 'El margen bruto pasó de 28.1% en 2024 a 20.0% en el periodo en curso: 8.1 puntos sobre una venta anualizada de $190.8M son $15.5M. Se descuenta el punto y medio atribuible al alza de insumos del sector, que no es controlable, y quedan $14.9M de erosión propia.',
      supuestos: [
        'Alza de insumos no controlable estimada en 1.5 puntos de margen, por debajo de la inflación de productor del sector metalmecánico.',
        'La venta anualizada del MTD ($190.8M) se sostiene el resto del año.',
        'Se toma 2024 como año base porque es el último con margen normalizado.',
      ],
      recuperable:
        'De $8M a $10M en doce meses, pero solo después de tener la rentabilidad abierta por cliente y por línea: sin esa apertura no se sabe a quién subirle precio ni a quién dejar ir.',
    },
    {
      frente: 'Estructura y productividad del recurso humano',
      monto: 8_800_000,
      base: 'Si la venta por peso de nómina se hubiera sostenido en los 6.80x de 2024, la venta anualizada de $190.8M exigiría una nómina de $28.1M. La real es de $36.9M. La diferencia, $8.8M, es estructura que se contrató sin capacidad que la respalde.',
      supuestos: [
        'Se toma 6.80x de 2024 como productividad de referencia, no el 5.5x de la industria: la propia empresa demostró que podía operar a ese nivel.',
        'La nómina anualizada del MTD ($36.9M) incluye cargas sociales y prestaciones.',
        'No se descuenta ningún incremento salarial de mercado, lo que hace la cifra conservadora.',
      ],
      recuperable:
        'De $3M a $4M en doce meses por reacomodo y no reposición, sin recorte masivo. El resto exige que la venta crezca contra la estructura ya instalada.',
    },
  ],
  fueraDeLaSuma: [
    {
      etiqueta: 'Capital de trabajo detenido',
      valor: '$18,400,000',
      detalle: 'Inventario liberable tras descontar material apartado por contrato. Es un monto parado, no una pérdida anual: su costo financiero ya está contado en el frente 01.',
    },
    {
      etiqueta: 'Venta potencial no capturada',
      valor: '$31,000,000',
      detalle: 'Capacidad instalada al 68%. Es facturación, no utilidad, y contarla como pérdida infla la cifra hasta volverla indefendible.',
    },
    {
      etiqueta: 'Retrabajo y merma',
      valor: '7.8%',
      detalle: 'Percepción del jefe de planta, no medición. Entra a la suma en cuanto llegue el registro de los últimos 12 meses.',
    },
    {
      etiqueta: 'Días de tesorería',
      valor: '16 días',
      detalle: 'Lo que aguanta operando con la caja actual si deja de entrar un peso. Es una alarma de plazo, no un costo anual; la industria opera con 38.',
    },
    {
      etiqueta: 'Brecha de crecimiento sostenible',
      valor: '11.6 pp',
      detalle: 'Creció 18% con una estructura financiera que sostiene 6.4%. Explica por qué sube la deuda, pero el efecto ya está repartido en los tres frentes.',
    },
  ],

}

/**
 * Cadenas de causalidad del caso demostrativo, una por frente de PLAN_DEMO.
 * Todo esto es editable en pantalla: el motor propone, el consultor corrige.
 */
export const CAUSAS_DEMO: CausasRaiz = {
  convergencia:
    'Las tres cadenas terminan en el mismo lugar: la empresa decide sobre información que no produce, y ningún resultado tiene dueño nominal. Cartera, margen y plantilla son tres síntomas del mismo mecanismo. Eso es una buena noticia para el plan — un solo arreglo mueve los tres frentes — y una mala para el calendario: el arreglo es de gobierno, no de finanzas, y esos tardan más.',
  cadenas: [
    {
      id: 'ia-0-cobranza',
      origen: 'Cobranza y ciclo de capital de trabajo',
      sintoma: '"Vendemos más y no hay dinero."',
      porques: [
        'Porque la cartera se alargó de 51 a 75 días mientras la venta crecía 18%.',
        'Porque el plazo real lo está poniendo el cliente, no la empresa.',
        'Porque el plazo de crédito se autoriza caso por caso, sin política escrita ni tope.',
        'Porque no existe reporte de antigüedad de cartera que alguien revise cada semana.',
        'Porque la cobranza no tiene responsable nominal por cliente: es de todos y por lo tanto de nadie.',
      ],
      causaRaiz: 'Nadie responde por el plazo de cobro con nombre y apellido, así que el plazo lo termina fijando quien más presiona: el cliente.',
      porQueAhi:
        'Se detiene en la asignación de responsabilidad porque es lo que el dueño puede cambiar el lunes: nombrar responsable por cliente y poner un corte semanal no cuesta dinero ni sistema. Bajar a "falta disciplina" no sería accionable.',
      implicacion:
        'Cualquier gestión de cobranza que se haga sin asignar responsable va a recuperar días este trimestre y perderlos el siguiente, porque nadie sostiene la presión cuando el consultor se va.',
    },
    {
      id: 'ia-1-rentabilidad',
      origen: 'Rentabilidad por cliente y por línea',
      sintoma: '"Facturamos como nunca pero la utilidad no aparece."',
      porques: [
        'Porque el margen bruto cayó 8.1 puntos, de 28.1% a 20.0%, mientras el volumen subía.',
        'Porque el crecimiento se concentró en las cuentas y líneas que operan con menos margen.',
        'Porque comercial autoriza precio y condición de crédito sin piso de margen definido.',
        'Porque no existe rentabilidad calculada por cliente ni por línea: se decide contra margen bruto global.',
        'Porque el sistema de indicadores mide volumen y no mide margen, y nadie es dueño nominal del margen.',
      ],
      causaRaiz: 'La empresa toma decisiones comerciales sobre información que no existe, y nadie responde por el resultado de esas decisiones. El margen no tiene dueño.',
      porQueAhi:
        'El corte está en la información y su dueño porque ahí es donde se puede intervenir: sacar rentabilidad por cliente es un ejercicio de tres semanas y nombrar dueño del margen es una decisión de una junta. Lo que hay debajo —la cultura de vender por volumen— tarda años y no se puede poner en un plan de 90 días.',
      implicacion:
        'Cualquier plan que empiece por renegociar precios sin instalar primero la medición de rentabilidad por cliente y el dueño nominal del margen va a recuperar puntos que se volverán a perder en el siguiente ciclo comercial.',
    },
    {
      id: 'ia-2-estructura',
      origen: 'Estructura y productividad del recurso humano',
      sintoma: '"Contratamos para poder crecer y seguimos igual de apretados."',
      porques: [
        'Porque la nómina creció 48% mientras la venta creció 18%.',
        'Porque la venta por peso de nómina bajó de 6.80x a 5.18x: se compró costo fijo, no capacidad.',
        'Porque se contrató contra el volumen esperado y no contra capacidad medida.',
        'Porque la productividad se mide global y no por área, así que no se sabe dónde faltaba gente.',
        'Porque ninguna área tiene meta propia de venta por peso de nómina y nadie responde por la suya.',
      ],
      causaRaiz: 'Se contrata contra la sensación de estar saturados, no contra una medición de capacidad por área, y ningún responsable de área carga con el costo de su propia plantilla.',
      porQueAhi:
        'Se detiene en la medición por área y su responsable porque es lo accionable: abrir la nómina por centro de costo ya es posible con lo que hay, y asignar meta por área es decisión de dirección. La causa de fondo —contratar por percepción— desaparece sola cuando existe la medida.',
      implicacion:
        'Un recorte hecho antes de tener la medición por área va a cortar donde menos duele hoy y más duele en doce meses, que suele ser producción y no administración.',
    },
  ],
}

/**
 * Plan de trabajo del caso demostrativo: los tres frentes repartidos en las
 * cuatro ventanas. El área responsable es editable en pantalla, porque el
 * organigrama real casi nunca es el que uno supone desde fuera.
 */
export const PLAN_TRABAJO_DEMO: PlanTrabajo = {
  lectura:
    'Los primeros 30 días no arreglan nada: destraban. Se nombra a los responsables que hoy no existen y se saca la información sobre la que se va a decidir, que es lo que la causa raíz señaló como el hueco de fondo. Entre 31 y 60 días está el dinero: renegociación de cuentas y de plazos, con la información ya en la mano. De 61 a 90 se instala la política y la medición para que lo ganado no se vuelva a perder. Después de 90 días ya no hay proyecto, hay operación normal con dueño: si el plan se hizo bien, el consultor sobra a partir de ahí.',
  acciones: [
    {
      id: 'demo-1', frente: 'Cobranza y ciclo de capital de trabajo', ventana: '0-30',
      accion: 'Nombrar responsable de cobranza por cliente para las seis cuentas del 80% de la venta',
      area: 'Dirección General',
      entregable: 'Lista firmada de responsables, publicada y comunicada a los clientes',
    },
    {
      id: 'demo-2', frente: 'Cobranza y ciclo de capital de trabajo', ventana: '0-30',
      accion: 'Sacar la antigüedad de cartera y separar todo lo que pasa de 90 días',
      area: 'Finanzas',
      entregable: 'Reporte de antigüedad por cliente y por vencimiento, actualizado al corte',
      herramienta: { nombre: 'Formato de Antigüedad de Cartera por Cliente', modulo: 'Finanzas' },
    },
    {
      id: 'demo-3', frente: 'Cobranza y ciclo de capital de trabajo', ventana: '31-60',
      accion: 'Instalar el corte semanal de cobranza los martes, con avance por responsable',
      area: 'Comercial',
      entregable: 'Minuta semanal con compromiso de fecha por cada cuenta vencida',
    },
    {
      id: 'demo-4', frente: 'Cobranza y ciclo de capital de trabajo', ventana: '31-60',
      accion: 'Renegociar plazo de pago con los tres proveedores principales',
      area: 'Materiales',
      entregable: 'Convenios firmados con el plazo nuevo por escrito',
      herramienta: { nombre: 'Kit de Negociación de Condiciones con Proveedores', modulo: 'Operación' },
    },
    {
      id: 'demo-5', frente: 'Cobranza y ciclo de capital de trabajo', ventana: '61-90',
      accion: 'Escribir la política de crédito con tope por cliente y quién autoriza la excepción',
      area: 'Finanzas',
      entregable: 'Política firmada por Dirección y cargada en el sistema de facturación',
      herramienta: { nombre: 'Política de Crédito y Cobranza', modulo: 'Finanzas' },
    },
    {
      id: 'demo-6', frente: 'Cobranza y ciclo de capital de trabajo', ventana: '+90',
      accion: 'Ligar el variable de comercial al cobro y no a la facturación',
      area: 'Dirección General',
      entregable: 'Esquema de compensación nuevo, vigente desde el siguiente trimestre',
    },
    {
      id: 'demo-7', frente: 'Rentabilidad por cliente y por línea', ventana: '0-30',
      accion: 'Construir la rentabilidad por cliente y por línea con costos indirectos asignados por driver',
      area: 'Finanzas',
      entregable: 'Matriz de rentabilidad de los seis clientes principales y las once líneas',
      herramienta: { nombre: 'Matriz de Rentabilidad por Cliente y Línea', modulo: 'Finanzas' },
    },
    {
      id: 'demo-8', frente: 'Rentabilidad por cliente y por línea', ventana: '31-60',
      accion: 'Separar la caída de margen en efecto precio y efecto costo, mes a mes desde enero',
      area: 'Finanzas',
      entregable: 'Puente de margen con los dos efectos aislados y cuantificados',
    },
    {
      id: 'demo-9', frente: 'Rentabilidad por cliente y por línea', ventana: '31-60',
      accion: 'Definir el piso de margen por familia de producto y quién puede autorizar por debajo',
      area: 'Comercial',
      entregable: 'Tabla de pisos firmada y matriz de autorización de descuentos',
      herramienta: { nombre: 'Política de Piso de Margen y Autorización de Descuentos', modulo: 'Ventas' },
    },
    {
      id: 'demo-10', frente: 'Rentabilidad por cliente y por línea', ventana: '61-90',
      accion: 'Renegociar o soltar de forma ordenada las cuentas que operan bajo el piso',
      area: 'Comercial',
      entregable: 'Escenario cuantificado por cuenta: precio nuevo, condición o salida',
      herramienta: { nombre: 'Kit de Renegociación de Cuentas Destructoras', modulo: 'Ventas' },
    },
    {
      id: 'demo-11', frente: 'Rentabilidad por cliente y por línea', ventana: '+90',
      accion: 'Instalar el tablero mensual de margen por cliente con dueño nominal',
      area: 'Dirección General',
      entregable: 'Tablero vivo y junta mensual de rentabilidad con decisión documentada',
    },
    {
      id: 'demo-12', frente: 'Estructura y productividad del recurso humano', ventana: '0-30',
      accion: 'Congelar contrataciones hasta cerrar el costeo por línea',
      area: 'Dirección General',
      entregable: 'Instrucción escrita a las áreas, con excepciones que solo autoriza Dirección',
    },
    {
      id: 'demo-13', frente: 'Estructura y productividad del recurso humano', ventana: '0-30',
      accion: 'Abrir la nómina por centro de costo y clasificar cada plaza en fija o variable',
      area: 'Recursos Humanos',
      entregable: 'Layout de nómina por centro con catálogo y clasificación',
      herramienta: { nombre: 'Costo Hora-Hombre por Área', modulo: 'RRHH' },
    },
    {
      id: 'demo-14', frente: 'Estructura y productividad del recurso humano', ventana: '31-60',
      accion: 'Poner meta de venta por peso de nómina a cada área, no solo la global',
      area: 'Dirección General',
      entregable: 'Meta por área acordada con su responsable y con línea base medida',
    },
    {
      id: 'demo-15', frente: 'Estructura y productividad del recurso humano', ventana: '61-90',
      accion: 'Instalar el registro de retrabajo y merma en piso, con captura diaria por centro',
      area: 'Producción',
      entregable: 'Formato de captura en operación y primer mes de dato real',
      herramienta: { nombre: 'Formato de Registro de Retrabajo por Centro', modulo: 'Operación' },
    },
    {
      id: 'demo-16', frente: 'Estructura y productividad del recurso humano', ventana: '+90',
      accion: 'Revisar la plantilla contra capacidad medida cada trimestre',
      area: 'Recursos Humanos',
      entregable: 'Revisión trimestral en calendario, con decisión de alta o baja documentada',
    },
  ],
}

/**
 * Instructivos del caso demostrativo. Solo dos acciones vienen aterrizadas —las
 * demás se generan al abrirlas—, suficientes para ver de qué se trata: el
 * renglón del tablero convertido en algo que alguien ejecuta el lunes.
 */
export const DETALLES_DEMO: Record<string, DetalleAccion> = {
  'demo-1': {
    porQue:
      'La causa raíz de este frente es que nadie responde por el plazo de cobro con nombre y apellido, así que el plazo lo termina fijando quien más presiona: el cliente. Todo lo demás de la cobranza —el reporte, la política, el corte semanal— se cae si no existe alguien que cargue con el resultado. Por eso esta acción va primero y no cuesta un peso: es una decisión, no un proyecto.',
    evidencia: [
      'La cartera pasó de 51 días en el cierre 2024 a 75 días al corte de julio, mientras la venta creció 18%.',
      'Seis clientes concentran el 80% de la facturación: seis conversaciones cubren casi toda la cartera.',
      'Cada día de cartera equivale a $530,000 inmovilizados sobre la venta actual.',
      'Quedan 16 días de tesorería. La industria opera con 38.',
    ],
    comoSeHace: [
      { paso: 'Sacar del sistema la lista de los seis clientes que hacen el 80% de la venta, con su saldo y su plazo pactado', quien: 'Finanzas', cuando: 'Día 1' },
      { paso: 'Asignar un responsable por cliente entre Comercial y Finanzas, evitando que una sola persona cargue con más de dos cuentas grandes', quien: 'Dirección General', cuando: 'Día 2' },
      { paso: 'Cerrar la asignación en una reunión de 30 minutos con los responsables presentes, no por correo', quien: 'Dirección General', cuando: 'Día 3' },
      { paso: 'Comunicar al cliente quién es su contacto de cobranza, por escrito y con copia al responsable', quien: 'Comercial', cuando: 'Semana 1' },
      { paso: 'Publicar la lista donde todos la vean y dejarla como punto fijo del corte semanal', quien: 'Finanzas', cuando: 'Semana 2' },
    ],
    impacto: {
      libera: '8 a 12 días de cartera',
      inversion: 'Cero pesos. Unas seis horas de dirección repartidas en la primera semana.',
      ventana: 'Los primeros días recuperados se ven al cierre del segundo mes.',
      comoSeMide: 'Días de cartera al cierre de cada mes. Base de hoy: 75 días. Meta al día 90: 63 días.',
    },
    escenarios: [
      {
        nombre: 'Conservador',
        alcance: 'Solo los tres clientes más grandes, con responsable asignado y sin comunicar al cliente.',
        resultado: '4 a 6 días de cartera',
        plazo: '60 días',
        queRequiere: 'Que Dirección sostenga la asignación aunque el vendedor de la cuenta se resista.',
      },
      {
        nombre: 'Recomendado',
        alcance: 'Los seis clientes del 80%, con responsable asignado y comunicado por escrito al cliente.',
        resultado: '8 a 12 días de cartera · unos $5.3M de caja',
        plazo: '90 días',
        queRequiere: 'Que el responsable de cada cuenta tenga autoridad real para detener un embarque, no solo para llamar y pedir.',
      },
      {
        nombre: 'Agresivo',
        alcance: 'Toda la cartera, con responsable por cliente y el variable de comercial ligado al cobro desde ya.',
        resultado: '14 a 18 días de cartera',
        plazo: '120 días',
        queRequiere: 'Cambiar el esquema de compensación a media temporada comercial, que suele costar dos o tres renuncias en el equipo de ventas.',
      },
    ],
    riesgos: [
      {
        riesgo: 'Comercial lo lee como desconfianza y se planta: "yo ya cobro, el problema es que el cliente no paga".',
        mitigacion: 'Presentarlo como asignación de autoridad, no de culpa: el responsable ahora puede detener un embarque, cosa que antes no podía. Es una facultad, no una vigilancia.',
      },
      {
        riesgo: 'La asignación se hace por correo, nadie contesta y en tres semanas nadie recuerda quién quedó con qué cuenta.',
        mitigacion: 'La reunión de 30 minutos del día 3 es lo que hace que exista. Sin ese acto público, esta acción no ocurrió.',
      },
      {
        riesgo: 'El cliente escala con el dueño y el dueño concede el plazo, con lo que el responsable queda sin piso.',
        mitigacion: 'Acordar de antemano que toda excepción de plazo pasa por el responsable, incluso las que autoriza el dueño. Una sola excepción por fuera desarma el esquema.',
      },
    ],
    mensajes: {
      correo: {
        para: 'Dirección General',
        asunto: 'Asignación de responsable de cobranza por cliente — arranca esta semana',
        cuerpo:
          'Estimado,\n\nComo quedamos en la sesión, el primer movimiento del plan es asignar un responsable de cobranza por cliente para las seis cuentas que concentran el 80% de la facturación. No cuesta dinero y es lo que sostiene todo lo demás del frente de cobranza: hoy la cartera está en 75 días contra 51 el año pasado, y cada día son $530,000 inmovilizados.\n\nLe propongo esta secuencia:\n\n1. Finanzas saca mañana la lista de las seis cuentas con saldo y plazo pactado.\n2. Usted define quién responde por cada una, entre Comercial y Finanzas, sin cargarle más de dos cuentas grandes a la misma persona.\n3. El miércoles cerramos la asignación en una reunión de 30 minutos con los responsables presentes. Es importante que sea reunión y no correo: si no se dice en voz alta y delante de todos, en tres semanas nadie recuerda quién quedó con qué.\n\nUn punto que conviene acordar desde ahora: el responsable necesita poder detener un embarque. Sin esa facultad la asignación es simbólica y el plazo lo va a seguir poniendo el cliente.\n\nQuedo pendiente para confirmar el día y la hora de la reunión.\n\nSaludos.',
      },
      whatsapp:
        'Buen día. Arrancamos con lo que acordamos: asignar responsable de cobranza por cliente para las 6 cuentas del 80%.\nFinanzas saca hoy la lista con saldos y plazos.\n¿Le late que cerremos la asignación el miércoles en 30 min con los responsables presentes? Necesita ser en junta, no por correo.\nLa cartera está en 75 días vs 51 del año pasado — cada día son $530 mil parados.',
      junta: {
        titulo: 'Asignación de responsables de cobranza — cuentas del 80%',
        cuando: 'Miércoles 8:30 a 9:00 · 30 minutos · Sala de juntas',
        asistentes: 'Dirección General, Gerencia Comercial, Jefatura de Finanzas y los vendedores de las seis cuentas',
        agenda: [
          'Dónde está la cartera hoy y cuánto cuesta cada día — 5 min',
          'Asignación cuenta por cuenta, en voz alta y con el responsable presente — 15 min',
          'Qué facultad tiene el responsable: hasta dónde puede detener un embarque — 5 min',
          'Cómo se comunica al cliente y quién lo hace — 3 min',
          'Fecha del primer corte semanal — 2 min',
        ],
      },
    },
  },

  'demo-7': {
    porQue:
      'La causa raíz de este frente es que la empresa decide sobre información que no existe: se fija precio y se acepta un pedido contra margen bruto global, sin saber qué deja cada cliente ni cada línea. Mientras no exista esa apertura, cualquier renegociación de precio es una apuesta y cualquier decisión de soltar una cuenta se toma con la corazonada del vendedor.',
    evidencia: [
      'El margen bruto pasó de 28.1% en 2024 a 20.0% en el periodo en curso: 8.1 puntos sobre $190.8M anualizados.',
      'El ROIC quedó en 3.5% contra una TIIE de 6.74%: crecer con la mezcla actual destruye valor.',
      'Once líneas activas y seis clientes que hacen el 80%, sin rentabilidad calculada para ninguno.',
      'El expediente no puede separar si la caída fue de precio o de costo.',
    ],
    comoSeHace: [
      { paso: 'Bajar del sistema ventas y costo de ventas por cliente y por línea, mensual, desde enero de 2025', quien: 'Finanzas', cuando: 'Semana 1' },
      { paso: 'Definir los drivers de asignación de indirectos con Producción: horas máquina, metros cuadrados y número de embarques', quien: 'Finanzas', cuando: 'Semana 1' },
      { paso: 'Asignar los gastos indirectos por driver y no por prorrateo sobre ventas, que es lo que hoy esconde a los clientes caros de servir', quien: 'Finanzas', cuando: 'Semana 2' },
      { paso: 'Armar la matriz de rentabilidad por cliente y por línea, y ordenarla de mayor a menor margen de contribución', quien: 'Finanzas', cuando: 'Semana 3' },
      { paso: 'Presentarla a Dirección y Comercial juntos, sin conclusiones todavía: primero que la vean y la discutan', quien: 'Dirección General', cuando: 'Semana 3' },
    ],
    impacto: {
      libera: 'Habilita entre $8M y $10M del frente de rentabilidad',
      inversion: 'Cero pesos si lo arma Finanzas. Unas 40 horas de trabajo repartidas en tres semanas.',
      ventana: 'La matriz está en tres semanas. El dinero llega después, con la renegociación.',
      comoSeMide: 'Porcentaje de la facturación con margen de contribución conocido. Base de hoy: 0%. Meta a la semana 3: 80% de la venta cubierta.',
    },
    escenarios: [
      {
        nombre: 'Conservador',
        alcance: 'Solo los seis clientes del 80%, con indirectos prorrateados sobre ventas como se hace hoy.',
        resultado: 'Identifica las cuentas destructoras evidentes',
        plazo: '2 semanas',
        queRequiere: 'Nada que no exista ya. Es el piso, y sirve para arrancar la conversación con Comercial.',
      },
      {
        nombre: 'Recomendado',
        alcance: 'Seis clientes y once líneas, con indirectos asignados por driver.',
        resultado: 'Rentabilidad real del 80% de la venta',
        plazo: '3 semanas',
        queRequiere: 'Que Producción acepte definir los drivers. Es media jornada de su tiempo y es donde suele atorarse.',
      },
      {
        nombre: 'Agresivo',
        alcance: 'Todos los clientes y líneas, más costo de servir por cliente: fletes, devoluciones y tiempo de atención.',
        resultado: 'Rentabilidad completa con cost-to-serve',
        plazo: '6 semanas',
        queRequiere: 'Registro de fletes y devoluciones por cliente, que hoy no existe. Sin ese dato el ejercicio se vuelve estimación.',
      },
    ],
    riesgos: [
      {
        riesgo: 'La discusión se atora en el método de asignación y la matriz nunca sale.',
        mitigacion: 'Fijar de entrada que el criterio es imperfecto a propósito y se revisa en tres meses. Una matriz aproximada hoy vale más que una exacta en junio.',
      },
      {
        riesgo: 'Comercial ve la matriz como preparación para quitarle cuentas y empieza a discutir los números en lugar de las decisiones.',
        mitigacion: 'Presentarla sin conclusiones la primera vez, con Comercial en la sala mientras se arma. Que la matriz sea suya también.',
      },
    ],
    mensajes: {
      correo: {
        para: 'Jefatura de Finanzas',
        asunto: 'Matriz de rentabilidad por cliente y línea — entrega en tres semanas',
        cuerpo:
          'Estimada,\n\nEl segundo frente del plan depende de un solo entregable: saber cuánto deja cada cliente y cada línea después de indirectos. Hoy se decide precio y crédito contra margen bruto global, y por eso el margen cayó 8.1 puntos sin que nadie pudiera decir de dónde.\n\nLe pido armar la matriz con este alcance:\n\n• Ventas y costo de ventas por cliente y por línea, mensual, desde enero de 2025.\n• Indirectos asignados por driver —horas máquina, metros cuadrados, número de embarques— y no prorrateados sobre ventas. Este punto es el que cambia el resultado: el prorrateo sobre ventas esconde justo a los clientes que son caros de servir.\n• Ordenada de mayor a menor margen de contribución.\n\nPara los drivers va a necesitar media jornada de Producción. Le sugiero apartarla desde ya, porque ahí es donde este tipo de ejercicio se suele atorar.\n\nUn punto de método: el criterio de asignación va a ser imperfecto y está bien. Lo revisamos en tres meses. Una matriz aproximada en tres semanas vale más que una exacta en junio.\n\nCuando esté, la presentamos a Dirección y Comercial juntos, sin conclusiones todavía.\n\nSaludos.',
      },
      whatsapp:
        'Buen día. Arrancamos la matriz de rentabilidad por cliente y línea, entrega en 3 semanas.\nClave: los indirectos van asignados por driver, no prorrateados sobre ventas — si no, se esconden los clientes caros de servir.\nVa a necesitar media jornada de Producción para definir drivers, ¿la puede apartar esta semana?\nEl criterio va a ser imperfecto y está bien, lo afinamos en 3 meses.',
      junta: {
        titulo: 'Presentación de la matriz de rentabilidad por cliente y línea',
        cuando: 'Semana 3, jueves 9:00 a 10:00 · 60 minutos',
        asistentes: 'Dirección General, Gerencia Comercial, Jefatura de Finanzas',
        agenda: [
          'Cómo se armó y qué criterio de asignación se usó — 10 min',
          'La matriz completa, sin conclusiones: solo leerla juntos — 20 min',
          'Qué sorprende y qué no cuadra con la percepción de Comercial — 15 min',
          'Qué falta para poder decidir sobre las cuentas de abajo — 10 min',
          'Fecha de la sesión de decisiones — 5 min',
        ],
      },
    },
  },
}

/**
 * Cierre del caso demostrativo: lo que queda medido y con dueño cuando el
 * consultor se va.
 */
export const ACCOUNTABILITY_DEMO: Accountability = {
  cierre:
    'Manufacturas del Norte creció 18% en venta y perdió la mitad de su rentabilidad haciéndolo. Sostener la situación actual cuesta $31 millones al año, 16.2% de la facturación, y ya cruzó el covenant de 3 veces deuda sobre EBITDA con dieciséis días de tesorería en caja. Las tres cadenas de causalidad terminan en el mismo lugar: la empresa decide sobre información que no produce y ningún resultado tiene dueño nominal. El plan de 90 días no arregla el margen ni la cartera directamente — instala quién responde por cada uno y con qué información decide. Si se ejecuta completo, entre $15 y $19 millones vuelven a la operación el primer año; si se abandona en la semana seis, la deuda sigue creciendo al ritmo actual y la conversación del año que entra ya no es con el consultor, es con el banco.',
  kpis: [
    { indicador: 'Días de cartera', frente: 'Cobranza y ciclo de capital de trabajo', base: '75 días', meta: '63 días', frecuencia: 'Semanal', responsable: 'Dir. Finanzas' },
    { indicador: 'Ciclo de conversión de efectivo', frente: 'Cobranza y ciclo de capital de trabajo', base: '83 días', meta: '70 días', frecuencia: 'Quincenal', responsable: 'Dir. Finanzas' },
    { indicador: 'Días de tesorería disponibles', frente: 'Cobranza y ciclo de capital de trabajo', base: '16 días', meta: '30 días', frecuencia: 'Semanal', responsable: 'Dir. General' },
    { indicador: 'Facturación con margen de contribución conocido', frente: 'Rentabilidad por cliente y por línea', base: '0% de la venta', meta: '80% de la venta', frecuencia: 'Mensual', responsable: 'Jefe de Finanzas' },
    { indicador: 'Margen bruto', frente: 'Rentabilidad por cliente y por línea', base: '20.0%', meta: '23.5%', frecuencia: 'Mensual', responsable: 'Dir. Comercial' },
    { indicador: 'Cuentas operando bajo el piso de margen', frente: 'Rentabilidad por cliente y por línea', base: 'Sin medir', meta: 'Cero sin plan de salida', frecuencia: 'Mensual', responsable: 'Dir. Comercial' },
    { indicador: 'Venta por peso de nómina', frente: 'Estructura y productividad del recurso humano', base: '5.18x', meta: '5.80x', frecuencia: 'Mensual', responsable: 'Dir. General' },
    { indicador: 'Áreas con meta de productividad acordada', frente: 'Estructura y productividad del recurso humano', base: '0 de 5', meta: '5 de 5', frecuencia: 'Mensual', responsable: 'Gte. de Recursos Humanos' },
  ],
  ritmo: [
    {
      junta: 'Corte semanal de cobranza',
      cuando: 'Martes 8:00 · 30 minutos',
      asistentes: 'Dir. Finanzas, Dir. Comercial y los responsables de las seis cuentas del 80%',
      proposito: 'Decidir qué se hace con cada cuenta vencida esta semana: quién llama, qué se detiene y con qué fecha se compromete el cliente.',
    },
    {
      junta: 'Junta mensual de rentabilidad',
      cuando: 'Primer jueves · 90 minutos',
      asistentes: 'Dir. General, Dir. Comercial, Jefe de Finanzas',
      proposito: 'Decidir sobre las cuentas y líneas que quedaron bajo el piso de margen: se renegocia, se rediseña o se suelta.',
    },
    {
      junta: 'Revisión quincenal de avance del plan',
      cuando: 'Miércoles alternos · 45 minutos',
      asistentes: 'Dir. General y los responsables de cada acción vigente',
      proposito: 'Decidir qué acción se destraba y cuál se reprograma. Es la única junta que puede mover fechas del plan.',
    },
  ],
  senalesTempranas: [
    'El reporte de antigüedad de cartera llega el lunes sin que nadie lo pida. Cuando alguien lo empieza a mandar solo, la responsabilidad ya se movió de lugar.',
    'Un vendedor rechaza o escala un pedido por quedar debajo del piso de margen. La primera vez que pasa es la señal de que la política dejó de ser papel.',
    'Alguien pregunta por su indicador antes de la junta, no durante. Significa que ya lo siente suyo.',
    'La junta de los martes se sostiene tres semanas seguidas con el dueño ausente. Si solo ocurre cuando él está, no se instaló nada.',
  ],
  riesgoDeNoSostener:
    'El punto de quiebre histórico está en la semana seis: es cuando la urgencia del diagnóstico se enfría y la junta empieza a moverse "por esta semana nada más". Si el ritmo se cae ahí, los días de cartera regresan en dos meses, el piso de margen se vuelve sugerencia y los $31 millones anuales siguen corriendo — con la diferencia de que ahora el dueño ya sabía. El antecedente de 2022, cuando se documentaron procesos que nadie sostuvo, es el mismo patrón.',
}

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

/**
 * Las cuatro primeras ya las contesta la radiografía del paso 01: se autollenan
 * con la variación real y el consultor solo las corrige si tiene mejor dato. Las
 * dos últimas no salen de los estados financieros y siguen siendo entrevista.
 */
export const CONTEXTO_NUMEROS: PreguntaNumero[] = [
  {
    etiqueta: 'Rentabilidad erosionada',
    pregunta: '¿Cuántos puntos de margen bruto perdió respecto al periodo anterior?',
    valor: '',
    derivaDe: 'margenBruto',
  },
  {
    etiqueta: 'Capital de trabajo detenido',
    pregunta: '¿Cuántos días tarda el cliente en convertir un peso invertido en inventario en un peso cobrado?',
    valor: '',
    derivaDe: 'cicloEfectivo',
  },
  {
    etiqueta: 'Liquidez en riesgo',
    pregunta: '¿Cuántos días puede seguir operando con la caja que tiene hoy?',
    valor: '',
    derivaDe: 'tesoreria',
  },
  {
    etiqueta: 'Rentabilidad del RH',
    pregunta: '¿A qué velocidad creció la nómina frente a la venta?',
    valor: '',
    derivaDe: 'nominaVenta',
  },
  {
    etiqueta: 'Retorno sobre capital insuficiente',
    pregunta: '¿Cuántas veces su generación anual de caja operativa cuesta la deuda?',
    valor: '',
    derivaDe: 'apalancamiento',
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

/* ---------- PASO 05 ---------- */


/* ---------- PASO 06 ---------- */



/* ---------- PASO 07 ---------- */




/* ---------- PASO 08 ---------- */


  'La empresa toma decisiones comerciales sobre información que no existe, y nadie responde por el resultado de esas decisiones. El margen no tiene dueño.'

/* ---------- PASO 09 ---------- */


/* ---------- PASO 10 ---------- */


