# Motor de Diagnóstico Empresarial — Profit120

Plataforma de diagnóstico consultivo de 10 pasos. Convierte un síntoma declarado
por el cliente en una cifra de costo, una causa raíz, un plan de trabajo y un
tablero de indicadores con responsable nominal.

## Arranque

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # verifica tipos y compila a /dist
npm run preview  # sirve /dist
```

## Estructura

```
src/
├── App.tsx                    Estado del paso activo y layout de tres columnas
├── index.css                  Sistema de diseño completo (bright mode permanente)
├── types.ts                   Contratos de datos del dominio
├── data/
│   ├── catalogo.ts            Pasos, módulos, requisitos, dimensiones, sectores
│   ├── herramientas.ts        Herramientas candidatas por paso
│   └── caso.ts                CONTENIDO DEL CASO — se reemplaza por cliente real
└── components/
    ├── TopBar / Sidebar / RightRail / StepNav / Footer
    ├── ui/Primitivos.tsx      Card, Campo, Pregunta, Hallazgo, Documento
    └── steps/Paso01…Paso10    Una pantalla por paso del método
```

## Dónde tocar qué

| Necesidad | Archivo |
|---|---|
| Cambiar el caso de ejemplo por un cliente real | `src/data/caso.ts` |
| Editar preguntas, dimensiones o sectores | `src/data/catalogo.ts` |
| Ajustar qué herramientas propone el motor | `src/data/herramientas.ts` |
| Cambiar colores, tipografía o espaciado | `src/index.css` (bloque `:root`) |
| Modificar una pantalla | `src/components/steps/PasoNN*.tsx` |
| Agregar un tipo de pregunta o tarjeta | `src/components/ui/Primitivos.tsx` |

## Sistema de diseño

Bright mode permanente. No hay modo oscuro y no debe agregarse.

| Token | Valor | Uso |
|---|---|---|
| `--green` | `#6DBE45` | Verde de marca, extraído del logotipo oficial |
| `--green-dk` | `#57A233` | Estado hover de acciones primarias |
| `--green-dp` | `#3F7A25` | Texto sobre fondo verde pálido |
| `--green-pale` | `#F0F8EA` | Fondos de estado activo |
| `--green-line` | `#CDE7BA` | Bordes sobre fondo verde |
| `--ink` | `#1F2225` | Texto principal |
| `--slate` | `#3C4045` | Texto secundario |
| `--red` | `#B23A32` | Severidad crítica y tendencia a la baja |
| `--amber` | `#B8862B` | Severidad de alerta |

Tipografía Inter. Interfaz completamente en español. Pie de página fijo con
`www.profit120.com` e `info@profit120.com`.

## Estado actual

Prototipo de interfaz con datos estáticos. La navegación entre pasos, la selección
de opciones, la tabla de tendencias y la validación de hallazgos ya responden.

Pendiente de conectar:

1. Indexador de la carpeta de Dropbox y generación de fichas por archivo
2. Búsqueda híbrida que alimente el panel de herramientas candidatas
3. Motor de preguntas dinámicas y cálculo real del costo de la inacción
4. Persistencia de expedientes y exportación del plan

## Despliegue en Vercel

Framework: Vite. Comando de build `npm run build`. Directorio de salida `dist`.
Sin variables de entorno por ahora.
