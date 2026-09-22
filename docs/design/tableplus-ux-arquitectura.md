# TablePlus — Análisis exhaustivo de UX, flujo, pantallas y arquitectura de interfaz

> Referencia de diseño para Khipu. Guarda la filosofía de interacción de TablePlus (no su paleta de colores) como guía para las próximas fases de UI: sidebar como navegador de objetos, edición inline, herramientas contextuales temporales, progressive disclosure, cambios pendientes con preview antes de confirmar, etc.

## 1. Objetivo del análisis

Este documento descompone TablePlus desde el punto de vista de:

- arquitectura de información;
- flujo de navegación;
- estructura de pantallas;
- jerarquía visual;
- patrones de interacción;
- densidad de información;
- edición;
- navegación contextual;
- seguridad;
- estados;
- diseño de herramientas profesionales;
- principios reutilizables para SaaS, dashboards, backoffice y aplicaciones técnicas.

El objetivo no es copiar su identidad visual ni su paleta de colores, sino entender por qué la interfaz se percibe limpia, rápida y poco invasiva.

## 2. Tesis principal

TablePlus no intenta reducir la cantidad de información.

Reduce la cantidad de interfaz necesaria para operar esa información.

Su sensación de limpieza proviene de:

- pocas regiones persistentes;
- alta densidad de contenido;
- navegación orientada al dominio;
- edición inline;
- herramientas contextuales;
- progressive disclosure;
- shortcuts;
- command palette;
- preview tabs;
- inspectors temporales;
- estado ambiental;
- confirmación explícita sólo cuando existe riesgo;
- reutilización constante de los mismos componentes.

La idea central puede resumirse así:

> La base de datos es el contenido. La aplicación intenta desaparecer alrededor de ella.

## 3. Principio estructural general

La aplicación está organizada alrededor de un único workspace principal.

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOOLBAR / CONTEXTO DE CONEXIÓN / ACCIONES GLOBALES                 │
├───────────────┬─────────────────────────────────────────────────────┤
│               │                                                     │
│ OBJECT        │                 WORKSPACE                            │
│ NAVIGATION    │                                                     │
│               │        tabla / SQL / estructura / resultados       │
│               │                                                     │
│               │                                                     │
├───────────────┴─────────────────────────────────────────────────────┤
│ CONTEXT BAR: Data | Structure | +Row | Filters | Columns | status  │
└─────────────────────────────────────────────────────────────────────┘
```

La estructura casi nunca cambia. El usuario aprende una sola organización espacial y después cambia únicamente el objeto, el modo, el contenido o el contexto. Eso reduce la carga cognitiva de forma importante.

## 4. Arquitectura completa de pantallas

| Nivel | Pantalla / estado | Propósito |
|---|---|---|
| 0 | Welcome / Connections | Elegir dónde trabajar |
| 1 | Connection Form | Configurar acceso |
| 2 | Workspace | Contenedor permanente |
| 3A | Data Browser | Examinar/modificar registros |
| 3B | Structure | Modificar esquema |
| 3C | Query Editor | Trabajar directamente con SQL |
| 3D | View / Function / Procedure | Editar otros objetos |
| 4 | Filters | Filtrar el dataset actual |
| 4 | Columns | Elegir columnas visibles |
| 4 | Row Detail | Inspeccionar una fila |
| 4 | Open Anything | Navegación rápida |
| 4 | Quick Look | Inspección puntual |
| 4 | Code Preview | Revisar cambios |
| 5 | Commit / Safe Mode | Confirmar cambios de riesgo |

La clave es que las pantallas de nivel 3 y 4 no se perciben como aplicaciones diferentes. Son variaciones del mismo workspace.

## 5. Flujo principal de trabajo

```
Abrir TablePlus
      ↓
Seleccionar conexión
      ↓
Workspace
      ↓
Seleccionar objeto
      ↓
Explorar
      ↓
Inspeccionar
      ↓
Modificar
      ↓
Revisar
      ↓
Commit
```

Patrón conceptual: `Explore → Inspect → Modify → Review → Commit`.

La aplicación evita convertir tareas simples en: `Explore → Formulario → Wizard → Confirmación → Otra pantalla → Resultado`.

## 6. Pantalla inicial: Connections

Objetivo único: elegir dónde trabajar. No se convierte en un dashboard (sin noticias, tutoriales, analítica, salud del servidor, marketplace, plugins). La pregunta implícita es: *¿a qué base de datos quieres entrar?*

## 7. Flujo de creación de conexión

```
Connections → Choose Driver → Connection Form → Test / Connect → Workspace
```

La selección de driver ocurre **antes** del formulario. Esto evita formularios enormes con opciones irrelevantes de otros motores mezcladas. Ejemplo claro de *progressive disclosure*.

## 8. Workspace principal

```
┌───────────────────────────────────────────────────────────────────┐
│ Actions      SQL       CONNECTION / STATUS            Utilities  │
├──────┬────────────────────────────────────────────────────────────┤
│ DB   │ Items | Queries | History                                  │
│      │────────────────────────────────────────────────────────────│
│      │ Search                                                     │
│      │ ▸ Functions                                                │
│      │ ▾ Tables                                                   │
│      │   pg_class                                                 │
│      │   pg_collation                 MAIN CONTENT                │
│      │   pg_config                       GRID                     │
│      │   ...                                                      │
├──────┴────────────────────────────────────────────────────────────┤
│ DB ▼       Data   Structure   Index   + Row    Filters  Columns  │
└───────────────────────────────────────────────────────────────────┘
```

## 9. Jerarquía espacial

Cinco niveles conceptuales (toolbar global, contexto de conexión, navegación lateral, contenido, controles contextuales) que se perciben visualmente como tres: `HEADER / SIDEBAR / CONTENT`.

## 10. Sidebar orientado al dominio

El sidebar no representa *features* de la aplicación. Representa objetos de la base de datos.

Mala arquitectura:
```
App
├── Data Manager
├── Schema Manager
├── SQL Tools
├── Query Manager
├── Table Manager
└── Import Manager
```

TablePlus:
```
Database
├── customers
├── invoices
├── payments
├── products
├── views
└── functions
```

La navegación representa el dominio del usuario, no la arquitectura interna del software.

## 11. Items / Queries / History

El mismo espacio lateral se reutiliza para varios contextos (objetos, consultas guardadas, historial) en vez de mantener paneles permanentes compitiendo por atención.

## 12. Open Anything

Búsqueda global (⌘P) para llegar a cualquier objeto sin que la navegación visual tenga que representarlo todo.

> Regla derivada: las operaciones frecuentes son visibles; las operaciones arbitrarias son buscables.

## 13. Preview tabs

Abrir un objeto reutiliza la pestaña actual si no fue modificada; si se modificó, queda fijada; doble clic la fija explícitamente. Evita terminar con una fila interminable de pestañas tras pocos minutos de navegación (comparable a los preview tabs de VS Code).

## 14. Data Browser

El núcleo del producto: una tabla se presenta como una hoja de cálculo especializada. Interacción predominante: `select → double-click → edit`, no `select → Edit button → modal → form → save → close`.

## 15. Edición inline

El valor se edita en el mismo lugar donde vive (`Anderson` → `[ Anderson____________ ]`), sin cambiar el contexto espacial. Aplica a datos, estructura, índices, triggers y propiedades.

## 16. Data / Structure / Index como modos

El objeto (`users`) sigue siendo el mismo; lo que cambia es su representación, mediante un selector pequeño (`[ Data ] [ Structure ] [ Index ] [ + Row ]`), no navegando a otra página.

## 17. Barra contextual inferior

División semántica: arriba acciones globales, centro contenido, abajo acciones sobre el contenido visible (`Data Structure Index +Row … 1 of 415 selected … Filters Columns`).

## 18. Filters como herramienta temporal

El panel de filtros aparece junto a los datos, no como pantalla de "Query Builder". Cada regla: `field / operator / value`, con `+`/`-` para agregarlas o quitarlas, y visualización del SQL generado.

## 19. Herramientas reversibles

Filters puede abrirse/cerrarse (o cerrarse con Escape) sin abandonar el objeto — es un *modo temporal*, no una ubicación nueva de navegación.

## 20. Column selector

Selección de columnas visibles como propiedad de la vista actual, no como pantalla de configuración aparte.

## 21. Right Sidebar / Row Inspector

Un inspector lateral (activado con `Space`) muestra el detalle de una fila sin perder el grid de fondo — conserva contexto + selección + detalle simultáneamente, sin navegar a una página de detalle.

## 22. Quick Look

Inspección puntual de valores complejos (JSON, BLOB, texto largo) sin cambiar de pantalla: `select → quick look → close`.

## 23. Query Editor

```
┌────────────────────────────────────────────────────────────┐
│ SQL EDITOR                                                 │
│ select id, name from products where ...                    │
├────────────────────────────────────────────────────────────┤
│ options       Beautify        Run Current                  │
├────────────────────────────────────────────────────────────┤
│ RESULT GRID                                                 │
├────────────────────────────────────────────────────────────┤
│ Data | Message | Chart                  16 rows | Export    │
└────────────────────────────────────────────────────────────┘
```

La consulta y su resultado están espacialmente relacionados (`SQL ↓ RESULT`).

## 24. Resultado cerca de la acción

Patrón repetido: `FILTER ↓ DATA`, `SQL ↓ RESULT`, `STRUCTURE CONTROLS ↓ STRUCTURE`.

## 25. Reutilización del grid

`table data`, `query result`, `structure` e `indexes` reutilizan el mismo lenguaje visual (grid), reduciendo la cantidad de componentes que el usuario debe aprender.

## 26. Cambios pendientes

```
EDIT → PENDING → PREVIEW SQL → COMMIT
```

Mejora seguridad, control, comprensión y reversibilidad: el usuario ve el `UPDATE ... WHERE ...` real antes de ejecutarlo.

## 27. Code Preview

Transforma cambios visuales en una representación técnica verificable (el SQL real), conectando UI → operación real → SQL.

## 28. Action Control

```
[Discard]    [Preview]    [Commit]
```

Agrupar estas tres acciones (descartar / inspeccionar / aplicar) mejora claridad y reduce errores frente a una toolbar con `Save / Undo / Redo / Execute / Apply / Validate / Preview / Rollback` sin relación visual.

## 29. Safe Mode

```
DATA MODIFICATION → pending changes → discard | preview → commit → safe-mode check → DB
```

Una interfaz rápida no debe eliminar fricción donde existe riesgo real.

## 30–31. Estado de conexión como información ambiental

Color/entorno de la conexión (producción, desarrollo, SSH, motor) integrado discretamente en barras y títulos, no en tarjetas ("Status: online / Server: prod / Database: mydb").

## 32. Iconos y texto

- Global → iconos.
- Contextual → texto.
- Destructivo/importante → texto claro.

## 33. Densidad concentrada en el contenido

`UI CHROME → mínimo`, `USER DATA → máximo`. TablePlus no es baja densidad; el chrome sí lo es.

## 34. Progressive disclosure

Cada herramienta (Open Anything, Filter, Column selector, Row inspector, Quick Look, Code Preview, Safe Mode, History, Query Editor) aparece solo cuando se necesita — nada ocupa la pantalla permanentemente.

## 35. Context menus

Operaciones secundarias (export, import, duplicate, rename, delete...) ocultas en menús contextuales: menos *discoverability* inicial a cambio de mucho menos ruido permanente.

## 36. Keyboard-first, mouse-friendly

Dos interfaces superpuestas sin ser dos productos: *novice* (click → botón → acción) y *power user* (teclado → acción).

## 37. Agregar funciones sin agregar navegación

> Agregar una feature no implica agregar un menú.

Patrón a evitar: `new feature → new menu item → new page`. Patrón TablePlus: `new feature → acción contextual / popup / tab / shortcut / inspector`.

## 38. Arquitectura de componentes abstracta

```
ApplicationShell
├── Toolbar
├── WorkspaceSwitcher
├── Sidebar (Items | Queries | History)
├── TabBar
├── WorkspaceContent (DataGrid | StructureGrid | QueryEditor | ObjectEditor)
├── ContextPanel (Filter | RowDetail | ColumnSelector)
└── BottomBar
```

Sorprendentemente pequeña para una herramienta funcionalmente profunda.

## 39. Layout reutilizable

```
┌────────────────────────────────────────────────────────────┐
│ A. Global Action Bar                                       │ 44–52px
├──────────────┬─────────────────────────────────────────────┤
│              │ B. Context Tabs                            │ 32–40px
│ C. Object    ├─────────────────────────────────────────────┤
│ Navigator    │ D. Primary Workspace (flex: 1)              │
│ 220–280px    │                                             │
├──────────────┴─────────────────────────────────────────────┤
│ E. Contextual Bottom Toolbar                                │ 32–40px
└────────────────────────────────────────────────────────────┘
```

Inspector opcional (F, 280–360px) **no** permanece abierto siempre.

## 40. Matriz de ubicación de acciones

```
acción frecuente     → visible
acción contextual    → cerca del objeto
acción secundaria    → context menu
acción avanzada      → command palette
detalle              → inspector
edición sencilla     → inline
edición compleja     → panel
operación peligrosa  → review + explicit commit
```

## 41. Patrón de navegación (principio rector)

> No navegar cuando puedes transformar el contexto actual.

Ejemplos: `Table Data → Structure` sin nueva página; `Grid → Row Inspector` sin `/rows/{id}`; `Grid → Filters` sin Query Builder aparte; `Edit → Preview SQL` sin módulo separado; `Object → Open Anything` sin recorrer el árbol.

## 42–44. Qué produce (y qué no) la sensación de limpieza

No es principalmente espacio en blanco, bordes redondeados o pocos colores. Es:

```
pocas regiones persistentes
+ contenido protagonista
+ edición inline
+ acciones contextuales
+ progressive disclosure
+ command palette
+ shortcuts
+ preview tabs
+ estado ambiental
+ confirmación sólo donde hay riesgo
+ reutilización de componentes
```

Patrones a **no** copiar literalmente sin contexto: exceso de iconos sin label, acciones importantes solo en context menu, Safe Mode demasiado complejo para otros dominios — copiar la arquitectura, no cada control.

## 45–49. Principios reutilizables y ejemplos de aplicación

- Navegación orientada al dominio (`customers/orders/invoices` mejor que `Customer Manager/Order Manager`).
- Modos dentro del mismo objeto (`User → General/Permissions/Sessions/Activity`) en vez de módulos globales independientes.
- Inspector contextual en vez de navegar cuando la tarea principal sigue dependiendo del listado.
- Inline editing para valores simples con validación inmediata.
- Panel temporal para filtros/propiedades/configuración de vista/exportación.
- Command palette para acciones numerosas y poco frecuentes.
- Estado ambiental para entorno/conexión/modo/seguridad/permisos.
- Explicit commit (`modify → pending → review → commit`) para operaciones de riesgo.

Ejemplos de aplicación a un panel administrativo, infraestructura y una app financiera siguiendo el mismo esqueleto: `AppShell → TopBar / Sidebar / Tabs / Workspace / Inspector (opcional) / ContextBar`.

## 50–58. Reglas de diseño derivadas

1. El contenido ocupa la mayor parte del espacio.
2. El chrome es estable y reducido.
3. No crear una página nueva si basta con cambiar el modo actual.
4. Mantener visible el contexto al inspeccionar detalle.
5. Las acciones viven cerca del objeto afectado.
6. Las funciones poco frecuentes no necesitan presencia permanente.
7. La búsqueda puede sustituir navegación compleja.
8. El teclado acelera, no es obligatorio.
9. Reutilizar componentes y metáforas.
10. Introducir fricción únicamente donde el riesgo lo justifique.

Evitar `feature → menu → page`; preferir `feature → contextual action`. Evitar `object → details page → edit page`; preferir `object → inline edit / inspector`. Evitar navegación global para cada capacidad; preferir navegación global solo para entidades, y controles contextuales para capacidades.

## 59. Checklist para evaluar una pantalla

- **Navegación:** ¿representa entidades o *features*? ¿algo podría ser una acción contextual? ¿se puede buscar en vez de navegar varios niveles?
- **Contenido:** ¿ocupa la mayor parte del espacio? ¿hay chrome o tarjetas sin valor funcional?
- **Edición:** ¿puede ser inline? ¿el formulario necesita de verdad otra pantalla? ¿cabe un inspector?
- **Contexto:** ¿se pierde el objeto seleccionado? ¿el detalle puede abrirse sin navegar? ¿el resultado aparece cerca de la acción?
- **Riesgo:** ¿las acciones peligrosas tienen review? ¿los cambios pueden quedar pendientes? ¿la confirmación es proporcional?
- **Escalabilidad:** ¿agregar una feature obliga a agregar menú? ¿la arquitectura seguirá limpia con 50 features?

## 60–66. Conclusión

```
Useful Information Density
──────────────────────────
Persistent UI Chrome
```

TablePlus maximiza la densidad de información útil y minimiza la interfaz persistente necesaria — no persigue "menos elementos" sino menos interfaz por elemento de valor.

Fórmula resumida:

```
TABLEPLUS UX =
  Stable Workspace
  + Domain Navigation
  + High Content Density
  + Minimal Chrome
  + Inline Editing
  + Contextual Actions
  + Temporary Panels
  + Inspector
  + Command Palette
  + Keyboard Acceleration
  + Preview Tabs
  + Ambient State
  + Review Before Risk
```

Principios rectores finales:

1. No navegar cuando puedes transformar el contexto actual.
2. No ocultar datos para parecer limpio; eliminar interfaz que no aporta valor.
3. La velocidad percibida depende de cuántas veces se obliga al usuario a reconstruir su contexto mental.
4. Simplificar no significa eliminar seguridad — `edit → pending → preview → commit → safe-mode` combina rapidez, control, auditabilidad y seguridad.

Para replicar la calidad de TablePlus en Khipu conviene copiar estos principios de arquitectura e interacción, no su apariencia superficial.
