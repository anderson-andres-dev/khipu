# Borrador: copiado de resultados de consulta

## Estado

**Borrador de funcionalidad.** Este documento registra una necesidad inicial; no
autoriza su implementación todavía. Antes de desarrollar, se deben confirmar las
preguntas de la sección "Decisiones pendientes".

## Problema

Al seleccionar una celda en la grilla de resultados y usar `Ctrl+C`, Khipu no
copia su contenido. El copiado debe funcionar para selecciones de celdas y
debe ofrecer formatos configurables cuando la selección abarque más datos.

## Comportamiento propuesto

### Una sola celda

- Con una única celda seleccionada, `Ctrl+C` copiará su valor al portapapeles
  como texto plano.
- Ejemplo: si la celda contiene `2006-02-15 04:34:33.000000`, ese será el texto
  que se pegue en otra aplicación.
- Este caso no requiere elegir un formato de exportación.

### Selección de varias celdas, una fila o una columna

- El usuario podrá copiar una selección rectangular, una fila completa o una
  columna completa.
- En estos casos, el contenido copiado respetará el formato de copia elegido.
- Los formatos iniciales a considerar son JSON, TSV y CSV.

### Selector de formato de copia

- Incorporar un control simple de formato en la barra horizontal contextual de
  resultados, la misma zona donde actualmente se muestra la etiqueta `core`.
- El control debe permitir ver y cambiar el formato activo antes de usar
  `Ctrl+C`.
- La referencia visual aportada muestra un menú de "Data Extractors" de una
  herramienta de base de datos. Sirve solo como inspiración: contiene múltiples
  extractores y marca el formato activo (por ejemplo, JSON). Khipu no necesita
  reproducir ese menú completo en esta primera versión.
- La segunda referencia visual ubica la propuesta en la barra superior estrecha
  de la app, junto a la etiqueta `core`; no se propone añadir el selector dentro
  de la grilla ni abrir una pantalla separada.

## Posible mejora: visualización de JSON en celdas

### Objetivo

Cuando el valor de una celda sea JSON válido, debería mostrarse con resaltado
de sintaxis de JSON aunque la columna no esté declarada como JSON/JSONB.

Esto debe aplicar, por ejemplo, a columnas de texto que almacenan documentos
JSON. Es especialmente relevante para MySQL, donde el tipo disponible puede no
coincidir con la forma en que se guardan los datos. En PostgreSQL también debe
funcionar tanto para tipos JSON/JSONB como para texto que contenga JSON válido.

### Consideraciones

- La detección debe basarse en el contenido efectivo de la celda, no solo en el
  metadato del tipo de columna.
- El resaltado no debe alterar el valor que se copia ni el valor enviado a una
  edición posterior: es únicamente una mejora visual.
- Debe analizarse cuidadosamente el rendimiento antes de implementarlo. Parsear
  todas las celdas de una grilla grande como JSON podría degradar el renderizado
  y la interacción.
- Entre las alternativas a evaluar están limitar el análisis a celdas visibles,
  hacerlo bajo demanda al seleccionar o expandir una celda, imponer un límite
  de tamaño y cachear el resultado de la detección.

## Posible mejora: recargar resultados

### Objetivo

Incorporar un botón de recarga en la interfaz de resultados para actualizar los
datos sin que el usuario tenga que volver a ejecutar manualmente la consulta.

La intención es hacer más rápido el flujo de comprobar cambios en la base de
datos después de una modificación, manteniendo la consulta que generó la grilla
actual.

### Consideraciones

- El botón debería estar cerca de las acciones de la consulta o de la grilla,
  en una ubicación fácil de descubrir.
- Debe indicar visualmente que la recarga está en curso y evitar solicitudes
  duplicadas mientras haya una activa.
- Se debe preservar, cuando sea posible, el contexto de la grilla: consulta,
  paginación, filtros, orden, columna visible y selección.

## Alcance inicial sugerido

1. Detectar `Ctrl+C` cuando el foco esté en la grilla de resultados.
2. Copiar una celda individual como texto plano.
3. Permitir escoger entre JSON, TSV y CSV para selecciones de más de una celda.
4. Usar el formato seleccionado al copiar filas, columnas y rangos.
5. Mantener la interfaz del selector compacta y consistente con la barra de
   resultados existente.

## Fuera de alcance por ahora

- Implementar todos los extractores del menú de referencia (SQL Inserts, HTML,
  XML, Markdown, etc.).
- Configuración avanzada de CSV.
- Exportar a archivos; este borrador se limita al portapapeles.
- Definir atajos adicionales distintos de `Ctrl+C`.

## Decisiones pendientes antes de implementar

Estas preguntas deben resolverse explícitamente con quien solicita la
funcionalidad antes de convertir el borrador en una especificación final:

1. ¿El formato elegido debe persistir entre consultas, pestañas o reinicios de
   la aplicación? ¿Cuál debe ser el valor predeterminado?
2. Para JSON, ¿se copiará una matriz de valores, una lista de objetos con los
   nombres de columna, o habrá ambas opciones?
3. Para CSV y TSV, ¿la primera fila incluirá encabezados de columnas?
4. ¿Cómo se representarán valores `NULL`, fechas, booleanos, binarios y celdas
   con saltos de línea o separadores?
5. ¿Qué debe ocurrir ante una selección discontinua, una selección vacía o una
   consulta que aún está cargando resultados?
6. ¿Las filas y columnas completas se seleccionan desde los encabezados de la
   grilla? Si aún no existe esa interacción, ¿forma parte de esta misma tarea o
   de un trabajo separado?
7. ¿El selector debe ser un menú desplegable, botones compactos o una acción
   dentro de un menú de contexto? La referencia solo fija su ubicación general,
   no el control final.
8. ¿Debe mostrarse confirmación visual después de copiar, por ejemplo, un aviso
   breve con el formato y número de celdas copiadas?
9. ¿El resaltado de JSON se aplicará de forma automática, solo a celdas
   seleccionadas/expandidas, o mediante una opción que active el usuario?
10. ¿Cuál es el límite de tamaño y cantidad de celdas que puede analizarse sin
    afectar de forma perceptible el rendimiento?
11. ¿Qué estructuras se consideran JSON visualizable: solo objetos y arreglos,
    o también escalares JSON válidos como cadenas, números, `true` y `null`?
12. ¿El formato debe mostrarse compacto en la grilla, con una vista formateada
    disponible al expandir o abrir el detalle de la celda?
13. ¿"Recargar" debe ejecutar de nuevo la última consulta SQL exactamente como
    fue enviada, o solo volver a solicitar la página de resultados ya cargada?
14. ¿Qué estado de la grilla debe preservarse al recargar (página, filtros,
    orden, posición de desplazamiento y selección)?
15. ¿La recarga debe pedir confirmación si existen ediciones locales sin guardar
    o una transacción abierta?

## Criterio para pasar a implementación

La implementación podrá planificarse cuando se confirme el comportamiento de
las preguntas anteriores y se defina la representación exacta de cada formato.
