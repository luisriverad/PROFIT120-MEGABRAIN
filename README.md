# Motor de Diagnóstico Empresarial — PROFIT120

Plataforma de diagnóstico consultivo de ocho pasos para empresas medianas
mexicanas. Convierte doce datos financieros y una conversación con el dueño en
un mapa de riesgos, una cifra de costo, tres frentes priorizados, sus causas
raíz, un plan de 90 días y un tablero con responsable nominal.

El motor no es un formulario: cada paso lee lo que produjo el anterior. El
análisis financiero del paso 01 premarca dimensiones en el 02; esas dimensiones
se reducen a tres frentes en el 04; los frentes ordenan las preguntas del 03, el
costo del 05, las cadenas del 06, el plan del 07 y los indicadores del 08.

## Arranque

```bash
npm install
cp .env.example .env.local     # y pon ahí la llave
npm run probar-llave           # comprueba credencial, esquemas y búsqueda web
npm run dev                    # http://localhost:5173
```

`npm run build` verifica tipos y compila a `/dist`. `npm run preview` lo sirve.

## Credenciales

Dos rutas, en `.env.local` — que está en `.gitignore` y **nunca** se sube:

| Variable | Cuándo |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Desarrollo en tu máquina. La llave viaja al navegador. |
| `VITE_IA_PROXY_URL` | Despliegue compartido. Un backend guarda la llave; el navegador no la ve. Si se define, la anterior se ignora. |

Sin ninguna de las dos, la aplicación funciona con el caso demostrativo y pide
la llave la primera vez que se pulsa un botón de análisis. El proxy recibe
`{ model, system, messages, schema }` y devuelve el texto de la respuesta.

> No pongas la llave en `.env.example`: ese archivo sí se sube. Es la plantilla.

## Los ocho pasos

| | Paso | Qué produce |
|---|---|---|
| 01 | Contexto | Radiografía de 16 datos, 20 razones contra el promedio de su industria, mapa de riesgos en semáforo |
| 02 | Problema declarado | Dimensiones marcadas: en verde las del consultor, en amarillo las que el análisis dejó en evidencia |
| 03 | Hipótesis del cliente | Batería de preguntas escrita sobre los tres frentes, más los temas que el cliente abra por su cuenta |
| 04 | Diagnóstico inicial | Los tres frentes en orden, con lo que desbloquea cada uno |
| 05 | Costo de la inacción | Un renglón por frente; el total se suma en código, no se le pide a la IA |
| 06 | Causa raíz | Una cadena por frente, editable renglón por renglón y con recálculo hacia abajo |
| 07 | Plan de trabajo | Ruta de 3 frentes × 4 ventanas; cada acción abre su instructivo y sus mensajes |
| 08 | Accountability | Indicadores con dueño, ritmo de juntas y señales tempranas |

## Estructura

```
src/
├── App.tsx                    Paso activo, layout de tres columnas
├── index.css                  Sistema de diseño completo (bright mode permanente)
├── types.ts                   Contratos de datos del dominio
├── estado/Expediente.tsx      Lo que un paso descubre y el siguiente necesita
├── lib/
│   ├── ia.ts                  Todas las llamadas al modelo, con sus esquemas
│   └── exportar.ts            PDF por motor de impresión · PPTX con pptxgenjs
├── data/
│   ├── catalogo.ts            Pasos, requisitos, dimensiones, sectores
│   ├── finanzas.ts            Razones, fórmulas y anualización del MTD
│   ├── benchmarks.ts          Promedio de industria por sector
│   ├── herramientas.ts        Herramientas candidatas por paso
│   └── caso.ts                CONTENIDO DEMOSTRATIVO — se reemplaza por el cliente real
└── components/
    ├── TopBar / Sidebar / RightRail / StepNav / Footer
    ├── ui/                    Primitivos, bloques de IA, modales, impresión
    └── steps/                 Una pantalla por paso
```

## Dónde tocar qué

| Necesidad | Archivo |
|---|---|
| Cambiar el caso demostrativo por un cliente real | `src/data/caso.ts` |
| Ajustar una razón financiera o agregar una nueva | `src/data/finanzas.ts` |
| Corregir un promedio de industria | `src/data/benchmarks.ts` (o el botón *Explicar promedio*) |
| Cambiar cómo razona el motor en un paso | `src/lib/ia.ts`, en el bloque de ese paso |
| Editar dimensiones o sectores | `src/data/catalogo.ts` |
| Colores, tipografía, espaciado | `src/index.css`, bloque `:root` |

## Cómo está construido el motor

Cada paso vive en `src/lib/ia.ts` como un trío: un esquema JSON que fija la forma
de la respuesta, un prompt de sistema con el oficio del consultor, y una función
que arma el expediente y llama al modelo. Tres decisiones lo sostienen:

**La aritmética no se delega.** El total del costo, el porcentaje sobre la
facturación y el múltiplo de la utilidad se calculan en código sobre lo que
devuelve el modelo. Una cifra que no cuadra con sus propios renglones destruye la
credibilidad en la primera pregunta del dueño.

**Ninguna probabilidad inventada.** Los escenarios dicen qué tiene que ser cierto
para funcionar, no un porcentaje de éxito que nadie puede calcular.

**El MTD se anualiza antes de cualquier razón.** La columna del periodo en curso
declara cuántos meses corre; los flujos se llevan a base anual y los saldos de
balance se leen a la fecha. Comparar siete meses de venta contra un capital de
doce daría una caída inventada.

## Exportación

El plan completo, una acción sola y el cierre se exportan a PDF y a PPTX.

El PDF sale del motor de impresión del navegador —texto vectorial, saltos de
página reales, carta vertical— y no de rasterizar la pantalla. El PPTX sale de
`pptxgenjs` como archivo editable, no como imágenes en diapositivas.

Los **mensajes de encargo** (correo, WhatsApp, convocatoria) nunca se exportan:
son herramienta de trabajo del consultor y hablan *del* cliente, no *para* él.

## Sistema de diseño

Bright mode permanente. No hay modo oscuro y no debe agregarse.

| Token | Valor | Uso |
|---|---|---|
| `--green` | `#6DBE45` | Verde de marca, extraído del logotipo oficial |
| `--green-dk` | `#57A233` | Hover de acciones primarias |
| `--green-dp` | `#3F7A25` | Texto sobre fondo verde pálido |
| `--green-pale` | `#F0F8EA` | Fondos de estado activo |
| `--green-line` | `#CDE7BA` | Bordes sobre fondo verde |
| `--ink` | `#1F2225` | Texto principal |
| `--slate` | `#3C4045` | Texto secundario |
| `--red` | `#B23A32` | Severidad crítica |
| `--amber` | `#B8862B` | Severidad de alerta |
| `--amber-dk` | `#8F6518` | Ámbar sobre el que va texto blanco |

Tipografía Inter, interfaz completamente en español de México. Dos reglas
permanentes: el contenido llena el ancho disponible —nunca una franja blanca
muerta a la derecha— y ningún título lleva subtítulo explicativo debajo.

## Estado actual

Los ocho pasos funcionan de punta a punta contra la API. El caso demostrativo
viene cargado para poder recorrer el motor lleno sin gastar llamadas; cualquier
botón de generar lo reemplaza por la corrida real.

Pendiente de conectar:

1. Persistencia de expedientes — hoy todo vive en memoria del navegador
2. Almacenamiento real de los archivos del expediente digital
3. Biblioteca de plantillas: las herramientas candidatas ya son botón, falta la ruta
4. Backend para la llave (`VITE_IA_PROXY_URL`) antes de cualquier despliegue compartido

## Despliegue en Vercel

Framework Vite, build `npm run build`, salida `dist`. Define
`VITE_IA_PROXY_URL` en las variables de entorno del proyecto — no
`VITE_ANTHROPIC_API_KEY`, que quedaría expuesta en el paquete servido.
