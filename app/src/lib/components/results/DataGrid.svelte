<script lang="ts">
  import { Columns3, Key } from "@lucide/svelte";
  import { tick } from "svelte";
  import type { ColumnCatalogInfo, QueryColumn, QueryRow } from "$lib/types";

  let {
    columns,
    rows,
    columnCatalogInfo = null,
  }: {
    columns: QueryColumn[];
    rows: QueryRow[];
    columnCatalogInfo?: Map<string, ColumnCatalogInfo> | null;
  } = $props();

  function catalogInfoFor(columnName: string): ColumnCatalogInfo | undefined {
    return columnCatalogInfo?.get(columnName.toLowerCase());
  }

  // id unico por instancia: el componente puede montarse mas de una vez
  // (varias consolas ejecutando en paralelo en el futuro), y aria-controls
  // necesita un id que no se repita en el documento.
  const viewportId = `grid-viewport-${crypto.randomUUID()}`;

  // --- Estructura del grid (por que no es una sola <table> sticky) -----
  // Todo vive dentro de UN solo contenedor con scroll nativo, pero con solo
  // TRES elementos sticky en total, sin importar filas ni columnas:
  //   - .grid-header: la fila de encabezados completa (sticky top)
  //   - .row-gutter: la columna de numeros de fila completa (sticky left)
  //   - .grid-corner: la esquina (sticky top + left)
  // La version anterior hacia sticky CADA <th> del header y CADA numero de
  // fila del cuerpo: en WebKitGTK (el motor de Tauri en Linux) cada uno es
  // una capa que se reposiciona en cada frame de scroll. Tres elementos
  // sticky en vez de cientos, y sin translateZ/will-change: nada de eso hace
  // falta con esta estructura.
  //
  // Tampoco hay virtualizacion de filas: 500 filas se montan una sola vez y
  // el scroll no toca el DOM. Montar/desmontar filas durante el scroll era
  // lo que se veia como "filas cargando lento" (incluso al volver hacia
  // arriba): el scroll llega a pintarse antes que el re-render.
  //
  // El costo dominante medido, de todos modos, era otro: overflow:hidden en
  // cada td (ver la nota en la hoja de estilos).

  // --- Selección tipo hoja de cálculo ---------------------------------
  // Un solo modelo (rango rectangular) cubre los tres casos: celda suelta
  // (start === end), arrastrar (end se mueve con el puntero) y columna
  // completa (start/end de fila = 0/ultima fila). Todavia es solo visual
  // — la idea es usarla despues para copiar al portapapeles — pero ya
  // queda armada para eso, no como un hack aparte.
  interface CellRange {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }

  let selection = $state<CellRange | null>(null);
  let isDragSelecting = $state(false);

  function normalized(sel: CellRange) {
    return {
      minRow: Math.min(sel.startRow, sel.endRow),
      maxRow: Math.max(sel.startRow, sel.endRow),
      minCol: Math.min(sel.startCol, sel.endCol),
      maxCol: Math.max(sel.startCol, sel.endCol),
    };
  }

  function selectCell(row: number, col: number, extend = false) {
    if (extend && selection) {
      selection = { ...selection, endRow: row, endCol: col };
    } else {
      selection = { startRow: row, startCol: col, endRow: row, endCol: col };
    }
  }

  function selectColumn(col: number) {
    selection = { startRow: 0, startCol: col, endRow: Math.max(0, rows.length - 1), endCol: col };
  }

  // Toggle: si ya esta todo seleccionado, un segundo clic lo limpia.
  function toggleSelectAll() {
    if (rows.length === 0 || columns.length === 0) return;
    const lastRow = rows.length - 1;
    const lastCol = columns.length - 1;
    if (selection) {
      const { minRow, maxRow, minCol, maxCol } = normalized(selection);
      if (minRow === 0 && minCol === 0 && maxRow === lastRow && maxCol === lastCol) {
        selection = null;
        return;
      }
    }
    selection = { startRow: 0, startCol: 0, endRow: lastRow, endCol: lastCol };
  }

  function selectRow(row: number) {
    selection = { startRow: row, startCol: 0, endRow: row, endCol: Math.max(0, columns.length - 1) };
  }

  // --- Tooltip de columna (nombre, tipo, comentario) ------------------
  // Propio de la app, no el title nativo del navegador (que ademas
  // aparece con delay y se ve distinto por SO). position:fixed para
  // escapar del overflow/scroll de .grid-viewport sin importar donde
  // este montado en el arbol.
  let hoveredColumn = $state<{ index: number; x: number; y: number } | null>(null);

  function showColumnTooltip(event: Event, columnIndex: number) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    hoveredColumn = { index: columnIndex, x: rect.left, y: rect.bottom };
  }

  function hideColumnTooltip() {
    hoveredColumn = null;
  }

  // --- Ancho de columnas -------------------------------------------------
  // Header y cuerpo son dos <table> distintas (el header tiene que poder ser
  // un unico bloque sticky), asi que comparten el mismo arreglo de anchos
  // via colgroup, siempre en table-layout:fixed.
  //
  // El ancho natural de cada columna se calcula midiendo el TEXTO con un
  // canvas, no dejando que la tabla lo resuelva con table-layout:auto: esa
  // pasada extra de layout sobre todas las celdas (500 x 43 = 21.500) era lo
  // mas caro de mostrar un resultado (~700ms medidos en WebKitGTK), y
  // mientras corria la pantalla seguia mostrando "Ejecutando...". La app usa
  // fuentes del sistema (sin webfonts que carguen tarde), asi que el canvas
  // mide con la misma fuente con la que despues se dibuja.
  //
  // Ni siquiera se mide cada texto: measureText cuesta ~10us en WebKitGTK
  // (21.500 llamadas = ~200ms). Se estima cada texto sumando el ancho de sus
  // caracteres (cacheado: hay pocos distintos) y solo los 3 candidatos mas
  // anchos de cada columna se miden de verdad (kerning incluido). El
  // resultado es el mayor de ambos, asi que nunca se queda corto.
  const MIN_COLUMN_WIDTH = 40;
  // padding horizontal (--space-2 a cada lado) + border-right de la celda,
  // mas 2px de aire para que un redondeo distinto entre canvas y layout no
  // deje el texto rozando el borde.
  const CELL_CHROME_WIDTH = 8 * 2 + 1 + 2;
  // Icono de tipo (12px) + gap (--space-1) del header.
  const HEADER_ICON_WIDTH = 12 + 4;

  let textMeasureContext: CanvasRenderingContext2D | null = null;

  function gridFonts() {
    const rootStyle = getComputedStyle(document.documentElement);
    const size = `${(parseFloat(rootStyle.fontSize) || 16) * 0.8125}px`; // font-size de .grid-canvas
    const family = getComputedStyle(document.body).fontFamily;
    const headingWeight = rootStyle.getPropertyValue("--font-weight-heading").trim() || "600";
    return {
      body: `${size} ${family}`,
      nullValue: `italic ${size} ${family}`,
      header: `${headingWeight} ${size} ${family}`,
    };
  }

  // white-space:nowrap colapsa saltos de linea/tabs/espacios repetidos en
  // un solo espacio al dibujar; medirlos sin colapsar sobreestima el ancho.
  function displayedText(value: string): string {
    return /\s\s|[\t\n\r]/.test(value) ? value.replace(/\s+/g, " ") : value;
  }

  const naturalWidths = $derived.by(() => {
    textMeasureContext ??= document.createElement("canvas").getContext("2d");
    const context = textMeasureContext;
    if (!context) {
      return { header: columns.map(() => MIN_COLUMN_WIDTH), body: columns.map(() => 0) };
    }
    const fonts = gridFonts();

    context.font = fonts.body;
    const charWidths = new Map<string, number>();
    const charWidth = (character: string) => {
      let width = charWidths.get(character);
      if (width === undefined) {
        width = context.measureText(character).width;
        charWidths.set(character, width);
      }
      return width;
    };

    const CANDIDATES = 3;
    const widest = columns.map(() => [] as { estimate: number; text: string }[]);
    const hasNull = columns.map(() => false);
    for (const row of rows) {
      for (let index = 0; index < columns.length; index++) {
        const value = row[index];
        if (value === null || value === undefined) {
          hasNull[index] = true;
          continue;
        }
        if (value === "") continue;
        const text = displayedText(value);
        let estimate = 0;
        for (const character of text) estimate += charWidth(character);
        const candidates = widest[index];
        if (candidates.length < CANDIDATES) {
          candidates.push({ estimate, text });
        } else {
          let smallest = 0;
          for (let i = 1; i < candidates.length; i++) {
            if (candidates[i].estimate < candidates[smallest].estimate) smallest = i;
          }
          if (estimate > candidates[smallest].estimate) candidates[smallest] = { estimate, text };
        }
      }
    }
    const textWidths = widest.map((candidates) =>
      candidates.reduce(
        (max, candidate) => Math.max(max, candidate.estimate, context.measureText(candidate.text).width),
        0,
      ),
    );

    context.font = fonts.nullValue;
    const nullWidth = context.measureText("NULL").width;
    const body = textWidths.map((width, index) =>
      Math.ceil(Math.max(width, hasNull[index] ? nullWidth : 0) + CELL_CHROME_WIDTH),
    );

    context.font = fonts.header;
    const header = columns.map((column) =>
      Math.ceil(context.measureText(column.name).width + HEADER_ICON_WIDTH + CELL_CHROME_WIDTH),
    );

    return { header, body };
  });

  // Anchos ajustados a mano con el mouse, atados al resultado para el que se
  // hicieron: un resultado nuevo vuelve a los anchos naturales sin depender
  // de un efecto que los resetee (que correria DESPUES del primer render).
  // $state.raw: `source` es el arreglo de filas tal cual; un proxy profundo
  // de 500 x N valores seria caro y ademas romperia la comparacion por
  // identidad.
  let resizedWidths = $state.raw<{ source: QueryRow[]; widths: number[] } | null>(null);

  const columnWidths = $derived(
    resizedWidths?.source === rows
      ? resizedWidths.widths
      : naturalWidths.header.map((headerWidth, index) =>
          Math.max(headerWidth, naturalWidths.body[index], MIN_COLUMN_WIDTH),
        ),
  );
  const widthsLocked = $derived(columnWidths.length > 0 && columnWidths.length === columns.length);
  const tableWidth = $derived(columnWidths.reduce((total, width) => total + width, 0));

  // Ancho de la columna # en funcion de cuantos digitos tiene el numero de
  // fila mas grande. En `ch` con tabular-nums, cada digito mide 1ch: no
  // hace falta medir nada en el DOM. 2 * --space-2 de padding + 4px de aire.
  const gutterWidth = $derived(`calc(${String(Math.max(rows.length, 1)).length}ch + 2 * var(--space-2) + 4px)`);

  // Mientras una columna mida al menos el ancho de su contenido, ninguna
  // celda desborda y no hace falta recortarlas. Solo las que el usuario
  // achico reciben overflow:hidden + ellipsis, via una regla por columna
  // (ver clipStyle) — ver la nota de rendimiento en la hoja de estilos.
  const clippedColumnsSelector = $derived(
    columnWidths
      .map((width, index) =>
        width < (naturalWidths.body[index] ?? 0) ? `#${viewportId} .grid-body-table td:nth-child(${index + 1})` : null,
      )
      .filter((selector) => selector !== null)
      .join(","),
  );

  function beginColumnResize(event: PointerEvent, columnIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    if (!widthsLocked) return;

    const startX = event.clientX;
    const startWidth = columnWidths[columnIndex];
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    function onMove(moveEvent: PointerEvent) {
      const next = [...columnWidths];
      next[columnIndex] = Math.round(Math.max(MIN_COLUMN_WIDTH, startWidth + (moveEvent.clientX - startX)));
      resizedWidths = { source: rows, widths: next };
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // El ancho total cambia el rango del scrollbar horizontal.
      void tick().then(updateThumbs);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // --- Overlay de seleccion ---------------------------------------------
  // La seleccion se dibuja con UN solo overlay posicionado por encima de
  // la tabla del cuerpo, no tocando el class/style de cada celda: con 500+
  // filas x varias decenas de columnas, reescribir el DOM de miles de <td>
  // en cada evento de arrastre (pointerenter tira muchos por segundo) se
  // sentia pesado. Las posiciones salen directo de columnWidths (sumas
  // acumuladas), sin medir el DOM.
  let rowHeight = $state(28);

  const columnLefts = $derived.by(() => {
    const lefts: number[] = [];
    let left = 0;
    for (const width of columnWidths) {
      lefts.push(left);
      left += width;
    }
    return lefts;
  });

  const selectionRect = $derived.by(() => {
    if (!selection || !widthsLocked) return null;
    const { minRow, maxRow, minCol, maxCol } = normalized(selection);
    const left = columnLefts[minCol];
    const right = columnLefts[maxCol] + columnWidths[maxCol];
    if (left === undefined || Number.isNaN(right)) return null;
    return {
      top: minRow * rowHeight,
      height: (maxRow - minRow + 1) * rowHeight,
      left,
      width: right - left,
    };
  });

  function onCellPointerDown(event: PointerEvent, row: number, col: number) {
    if (event.button !== 0) return;
    // Sin setPointerCapture a proposito: si el puntero queda "capturado"
    // por esta celda, pointerenter deja de dispararse en las demas celdas
    // y no hay forma de detectar sobre cual esta el mouse al arrastrar.
    event.preventDefault();
    selectCell(row, col, event.shiftKey);
    isDragSelecting = true;
  }

  function onCellPointerEnter(row: number, col: number) {
    if (!isDragSelecting || !selection) return;
    selection = { ...selection, endRow: row, endCol: col };
  }

  function onCellKeydown(event: KeyboardEvent, row: number, col: number) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectCell(row, col, event.shiftKey);
  }

  // Un solo listener por tipo de evento en el <tbody> en vez de tres por
  // celda: la fila/columna salen de la posicion de la celda en la tabla.
  function cellFromEvent(event: Event): { row: number; col: number } | null {
    const target = event.target;
    const cell = target instanceof Element ? target.closest("td") : null;
    const row = cell?.parentElement;
    const section = row?.parentElement;
    if (!cell || !(row instanceof HTMLTableRowElement) || !(section instanceof HTMLTableSectionElement)) {
      return null;
    }
    // Cada tanda es su propia tabla (ver renderBodyProgressively): el
    // indice real es el de la primera fila de la tanda + la posicion adentro.
    return { row: Number(section.dataset.firstRow ?? 0) + row.sectionRowIndex, col: cell.cellIndex };
  }

  function onBodyPointerDown(event: PointerEvent) {
    const cell = cellFromEvent(event);
    if (cell) onCellPointerDown(event, cell.row, cell.col);
  }

  // pointerover (burbujea) en vez de pointerenter (no burbujea, no se puede
  // delegar): las celdas solo tienen texto adentro, asi que cada pointerover
  // corresponde a entrar a una celda nueva.
  function onBodyPointerOver(event: PointerEvent) {
    const cell = cellFromEvent(event);
    if (cell) onCellPointerEnter(cell.row, cell.col);
  }

  function onBodyKeydown(event: KeyboardEvent) {
    const cell = cellFromEvent(event);
    if (cell) onCellKeydown(event, cell.row, cell.col);
  }

  // El cuerpo se arma como strings HTML en vez de un {#each} de Svelte:
  // son celdas de solo lectura, sin reactividad propia, y crear 21.500 <td>
  // uno por uno (cada uno con su {#if} para NULL/vacio y sus listeners)
  // costaba varios cientos de ms. El parser HTML del navegador arma el mismo
  // DOM de una sola vez, mucho mas rapido. Todo valor pasa por escapeHtml:
  // son datos de la base, nunca markup.
  const HTML_ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
  }

  function rowsHtml(from: number, to: number): string {
    const parts: string[] = [];
    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      parts.push(rowIndex % 2 === 1 ? '<tr class="zebra-odd">' : "<tr>");
      for (const value of rows[rowIndex]) {
        if (value === null) {
          parts.push('<td tabindex="0" class="null-value">NULL</td>');
        } else if (value === "") {
          parts.push('<td tabindex="0" aria-label="cadena vacía"></td>');
        } else {
          parts.push(`<td tabindex="0">${escapeHtml(value)}</td>`);
        }
      }
      parts.push("</tr>");
    }
    return parts.join("");
  }

  // Aun con anchos fijos, el navegador tarda ~400ms (WebKitGTK, 500 x 43) en
  // maquetar todas las celdas, y mientras tanto no pinta nada. Por eso las
  // filas se insertan por tandas: la primera cubre de sobra la pantalla y se
  // pinta enseguida; el resto se agrega en los frames siguientes. NO es
  // virtualizacion: una fila insertada no se quita nunca, asi que volver
  // hacia arriba no recarga nada. El alto total del scroll no cambia
  // mientras se completan, porque la columna # (.row-gutter) ya tiene las
  // 500 filas desde el principio.
  //
  // Cada tanda es una <table> propia, apiladas una debajo de otra: agregar
  // filas a UNA tabla obliga a re-maquetarla entera (medido: ~50ms por tanda
  // sin importar su tamaño), mientras que una tabla nueva no toca las
  // anteriores. Todas comparten los mismos anchos via variables CSS
  // (--col-N, --table-width en .grid-body-rows), asi que ajustar una columna
  // con el mouse las actualiza a todas sin tocar su HTML.
  const FIRST_BATCH_ROWS = 80;
  const BATCH_ROWS = 16;
  let bodyEl = $state<HTMLDivElement>();

  const columnWidthVars = $derived(
    [`--table-width:${tableWidth}px`, ...columnWidths.map((width, index) => `--col-${index}:${width}px`)].join(";"),
  );

  function batchHtml(from: number, to: number): string {
    const cols = columns.map((_, index) => `<col style="width:var(--col-${index})">`).join("");
    return (
      `<table class="body-batch"><colgroup>${cols}</colgroup>` +
      `<tbody data-first-row="${from}">${rowsHtml(from, to)}</tbody></table>`
    );
  }
  let batchFrame: number | null = null;

  function cancelBatches() {
    if (batchFrame !== null) {
      cancelAnimationFrame(batchFrame);
      batchFrame = null;
    }
  }

  function renderBodyProgressively(container: HTMLDivElement) {
    cancelBatches();
    let rendered = Math.min(rows.length, FIRST_BATCH_ROWS);
    container.innerHTML = batchHtml(0, rendered);
    const appendNextBatch = () => {
      batchFrame = null;
      const next = Math.min(rows.length, rendered + BATCH_ROWS);
      container.insertAdjacentHTML("beforeend", batchHtml(rendered, next));
      rendered = next;
      if (rendered < rows.length) batchFrame = requestAnimationFrame(appendNextBatch);
    };
    if (rendered < rows.length) batchFrame = requestAnimationFrame(appendNextBatch);
  }

  $effect(() => {
    function onGlobalPointerUp() {
      isDragSelecting = false;
    }
    window.addEventListener("pointerup", onGlobalPointerUp);
    return () => window.removeEventListener("pointerup", onGlobalPointerUp);
  });

  // --- Scrollbars a medida -------------------------------------------
  // El scroll real (rueda, trackpad, flechas) sigue siendo el nativo del
  // div con overflow:auto; solo se oculta su indicador visual y se dibujan
  // estos dos "thumbs" encima, acotados para que el vertical empiece
  // DESPUES del header y el horizontal DESPUES de la columna # — un
  // scrollbar nativo no puede excluir esas zonas de su carril, porque este
  // siempre refleja el alto/ancho TOTAL del contenido scrolleable (header
  // y columna de numeros incluidos), sean sticky o no.
  let viewportEl = $state<HTMLDivElement>();
  let cornerEl = $state<HTMLDivElement>();

  let headerHeight = $state(0);
  let rowNumberWidth = $state(0);
  let vThumb = $state({ visible: false, top: 0, height: 0 });
  let hThumb = $state({ visible: false, left: 0, width: 0 });

  const MIN_THUMB = 24;
  // Alto/ancho reservado en la esquina para que el thumb vertical y el
  // horizontal nunca se toquen entre si (como el "corner" de un scrollbar
  // nativo) — sin esto, cuando ambos hacen falta, uno termina justo donde
  // empieza el otro y se ven chocar.
  const SCROLLBAR_GUTTER = 12;

  // Solo se llama al cambiar el resultado o el tamaño del panel, nunca
  // durante el scroll.
  function measureFixedRegions() {
    headerHeight = cornerEl?.getBoundingClientRect().height ?? 0;
    rowNumberWidth = cornerEl?.getBoundingClientRect().width ?? 0;
    const firstBodyRow = bodyEl?.querySelector("tr");
    if (firstBodyRow) rowHeight = firstBodyRow.getBoundingClientRect().height;
  }

  function getTracks(el: HTMLDivElement) {
    const needsV = el.scrollHeight > el.clientHeight;
    const needsH = el.scrollWidth > el.clientWidth;
    return {
      needsV,
      needsH,
      trackHeight: el.clientHeight - headerHeight - (needsH ? SCROLLBAR_GUTTER : 0),
      trackWidth: el.clientWidth - rowNumberWidth - (needsV ? SCROLLBAR_GUTTER : 0),
    };
  }

  function updateThumbs() {
    const el = viewportEl;
    if (!el) return;
    const { needsV, needsH, trackHeight, trackWidth } = getTracks(el);

    let nextVThumb: typeof vThumb;
    if (needsV && trackHeight > 0) {
      const thumbHeight = Math.max(MIN_THUMB, (el.clientHeight / el.scrollHeight) * trackHeight);
      const maxScroll = el.scrollHeight - el.clientHeight;
      const progress = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      nextVThumb = { visible: true, height: thumbHeight, top: headerHeight + (trackHeight - thumbHeight) * progress };
    } else {
      nextVThumb = { visible: false, top: 0, height: 0 };
    }
    if (
      nextVThumb.visible !== vThumb.visible ||
      nextVThumb.top !== vThumb.top ||
      nextVThumb.height !== vThumb.height
    ) {
      vThumb = nextVThumb;
    }

    let nextHThumb: typeof hThumb;
    if (needsH && trackWidth > 0) {
      const thumbWidth = Math.max(MIN_THUMB, (el.clientWidth / el.scrollWidth) * trackWidth);
      const maxScroll = el.scrollWidth - el.clientWidth;
      const progress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
      nextHThumb = { visible: true, width: thumbWidth, left: rowNumberWidth + (trackWidth - thumbWidth) * progress };
    } else {
      nextHThumb = { visible: false, left: 0, width: 0 };
    }
    if (
      nextHThumb.visible !== hThumb.visible ||
      nextHThumb.left !== hThumb.left ||
      nextHThumb.width !== hThumb.width
    ) {
      hThumb = nextHThumb;
    }
  }

  let thumbAnimationFrame: number | null = null;

  function scheduleThumbUpdate() {
    if (thumbAnimationFrame !== null) return;
    thumbAnimationFrame = requestAnimationFrame(() => {
      thumbAnimationFrame = null;
      updateThumbs();
    });
  }

  function onViewportScroll() {
    // Los eventos nativos de scroll pueden llegar varias veces dentro del
    // mismo frame. Agruparlos evita repetir lecturas de layout y escrituras
    // reactivas que no podrian llegar a pintarse entre un evento y el otro.
    // Lo unico que se actualiza al scrollear son los dos thumbs.
    scheduleThumbUpdate();
  }

  let resultLayoutGeneration = 0;

  $effect(() => {
    columns;
    rows;
    const generation = ++resultLayoutGeneration;
    // Nueva consulta ejecutada: una seleccion de la tabla anterior (p.ej.
    // una columna entera, con endRow = ultima fila de ESE resultado) ya no
    // tiene sentido con las filas/columnas nuevas. Sin este reset quedaba
    // un rectangulo "fantasma" del tamaño de la seleccion vieja flotando
    // debajo de un resultado nuevo con menos filas.
    selection = null;
    isDragSelecting = false;

    // Los anchos ya vienen calculados (naturalWidths); solo falta medir
    // header/filas/scrollbars una vez que el DOM nuevo esta puesto.
    if (bodyEl) renderBodyProgressively(bodyEl);
    void tick().then(() => {
      if (generation !== resultLayoutGeneration) return;
      measureFixedRegions();
      updateThumbs();
    });
  });

  // El splitter editor/resultado y el tamaño de ventana cambian el alto y
  // ancho disponibles sin que columns/rows cambien; ResizeObserver los
  // captura para que los thumbs no queden con una medida vieja.
  $effect(() => {
    if (!viewportEl) return;
    const observer = new ResizeObserver(() => {
      measureFixedRegions();
      scheduleThumbUpdate();
    });
    observer.observe(viewportEl);
    return () => observer.disconnect();
  });

  $effect(() => {
    return () => {
      resultLayoutGeneration += 1;
      cancelBatches();
      if (thumbAnimationFrame !== null) {
        cancelAnimationFrame(thumbAnimationFrame);
        thumbAnimationFrame = null;
      }
    };
  });

  function dragVertical(event: PointerEvent) {
    const el = viewportEl;
    if (!el) return;
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    const startY = event.clientY;
    const startScrollTop = el.scrollTop;
    const { trackHeight } = getTracks(el);
    const range = trackHeight - vThumb.height;
    const maxScroll = el.scrollHeight - el.clientHeight;

    function onMove(moveEvent: PointerEvent) {
      const deltaScroll = range > 0 ? ((moveEvent.clientY - startY) / range) * maxScroll : 0;
      el!.scrollTop = Math.min(maxScroll, Math.max(0, startScrollTop + deltaScroll));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function dragHorizontal(event: PointerEvent) {
    const el = viewportEl;
    if (!el) return;
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startScrollLeft = el.scrollLeft;
    const { trackWidth } = getTracks(el);
    const range = trackWidth - hThumb.width;
    const maxScroll = el.scrollWidth - el.clientWidth;

    function onMove(moveEvent: PointerEvent) {
      const deltaScroll = range > 0 ? ((moveEvent.clientX - startX) / range) * maxScroll : 0;
      el!.scrollLeft = Math.min(maxScroll, Math.max(0, startScrollLeft + deltaScroll));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
</script>

{#if clippedColumnsSelector}
  {@html `<style>${clippedColumnsSelector}{overflow:hidden;text-overflow:ellipsis}</style>`}
{/if}

<div class="data-grid">
  <div
    class="grid-viewport"
    id={viewportId}
    bind:this={viewportEl}
    onscroll={onViewportScroll}
    style={`right:${vThumb.visible ? SCROLLBAR_GUTTER : 0}px; bottom:${hThumb.visible ? SCROLLBAR_GUTTER : 0}px;`}
  >
    <div class="grid-canvas" style:--gutter-width={gutterWidth}>
      <!-- Esquina: hermana (no hija) del header para no anidar un sticky
           dentro de otro; el margin-bottom negativo la superpone al hueco
           que .grid-header-spacer deja libre a la izquierda del header. -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="grid-corner"
        bind:this={cornerEl}
        role="button"
        tabindex="-1"
        aria-label="Seleccionar todo"
        onclick={toggleSelectAll}
      ></div>

      <div class="grid-header">
        <div class="grid-header-spacer" aria-hidden="true"></div>
        <table
          class:widths-locked={widthsLocked}
          style:width={widthsLocked ? `${tableWidth}px` : undefined}
        >
          {#if widthsLocked}
            <colgroup>
              {#each columnWidths as width, index (index)}
                <col style:width={`${width}px`} />
              {/each}
            </colgroup>
          {/if}
          <thead>
            <tr>
              {#each columns as column, columnIndex (columnIndex)}
                {@const info = catalogInfoFor(column.name)}
                <th
                  scope="col"
                  class="column-header"
                  onclick={() => selectColumn(columnIndex)}
                  onmouseenter={(event) => showColumnTooltip(event, columnIndex)}
                  onmouseleave={hideColumnTooltip}
                  onfocusin={(event) => showColumnTooltip(event, columnIndex)}
                  onfocusout={hideColumnTooltip}
                >
                  <span class="column-header-content">
                    {#if info?.isPrimaryKey}
                      <Key size={12} class="column-type-icon pk" aria-hidden="true" />
                    {:else if info?.isForeignKey}
                      <Key size={12} class="column-type-icon fk" aria-hidden="true" />
                    {:else}
                      <Columns3 size={12} class="column-type-icon" aria-hidden="true" />
                    {/if}
                    <span class="column-header-label">{column.name}</span>
                  </span>
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                  <div
                    class="col-resize-handle"
                    role="separator"
                    aria-orientation="vertical"
                    tabindex="-1"
                    onpointerdown={(event) => beginColumnResize(event, columnIndex)}
                    onclick={(event) => event.stopPropagation()}
                  ></div>
                </th>
              {/each}
            </tr>
          </thead>
        </table>
      </div>

      <div class="grid-body">
        <div class="row-gutter">
          {#each rows as _, rowIndex (rowIndex)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="row-number" onclick={() => selectRow(rowIndex)}>{rowIndex + 1}</div>
          {/each}
        </div>

        <div class="grid-body-table">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="grid-body-rows"
            bind:this={bodyEl}
            style={columnWidthVars}
            onpointerdown={onBodyPointerDown}
            onpointerover={onBodyPointerOver}
            onkeydown={onBodyKeydown}
          ></div>
          {#if selectionRect}
            <div
              class="selection-overlay"
              style={`top:${selectionRect.top}px; left:${selectionRect.left}px; width:${selectionRect.width}px; height:${selectionRect.height}px;`}
            ></div>
          {/if}
        </div>
      </div>

      <!--
        Espacio para marcar "esto es todo" al llegar al final, como en
        DataGrip: un padding-bottom en .grid-viewport se veia bien en el CSS
        pero el navegador lo recorta del scrollHeight cuando el contenido
        desborda (bug conocido de "padding al final de un contenedor con
        scroll"). Un bloque real dentro del contenido si cuenta.
      -->
      <div class="end-spacer" aria-hidden="true"></div>
    </div>
  </div>
  {#if vThumb.visible}
    <div
      class="scrollbar-thumb vertical"
      role="scrollbar"
      aria-orientation="vertical"
      tabindex="-1"
      aria-controls={viewportId}
      aria-valuenow={Math.round((vThumb.top - headerHeight) || 0)}
      style={`top:${vThumb.top}px; height:${vThumb.height}px;`}
      onpointerdown={dragVertical}
    ></div>
  {/if}
  {#if hThumb.visible}
    <div
      class="scrollbar-thumb horizontal"
      role="scrollbar"
      aria-orientation="horizontal"
      tabindex="-1"
      aria-controls={viewportId}
      aria-valuenow={Math.round((hThumb.left - rowNumberWidth) || 0)}
      style={`left:${hThumb.left}px; width:${hThumb.width}px;`}
      onpointerdown={dragHorizontal}
    ></div>
  {/if}
</div>

{#if hoveredColumn}
  {@const column = columns[hoveredColumn.index]}
  {@const info = catalogInfoFor(column.name)}
  <div class="column-tooltip" style={`left:${hoveredColumn.x}px; top:${hoveredColumn.y}px;`} role="tooltip">
    <div class="column-tooltip-title">{column.name}: {column.type}</div>
    {#if info?.comment}
      <div class="column-tooltip-comment">{info.comment}</div>
    {/if}
  </div>
{/if}

<style>
  .data-grid {
    --row-height: 1.75rem;
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  /* Sin contain / will-change / translateZ a proposito (ni aca ni en los
     sticky): son pistas que cambian como WebKit arma las capas del scroll,
     y en esta estructura no hacen falta — son solo tres elementos sticky. */
  .grid-viewport {
    position: absolute;
    top: 0;
    left: 0;
    /* right/bottom vienen del style inline: cuando el thumb de ese eje
       hace falta, le ceden su ancho/alto para que la tabla nunca dibuje
       datos debajo del carril del scrollbar — cada uno con su propio
       camino, ninguno se superpone al otro. */
    overflow: auto;
    /* El indicador nativo se oculta (Firefox y WebKit); el scroll en si
       sigue siendo el real del navegador, con teclado/rueda/trackpad
       funcionando igual — solo se reemplaza el dibujo del scrollbar por
       los thumbs de abajo. */
    scrollbar-width: none;
  }

  .grid-viewport::-webkit-scrollbar {
    display: none;
  }

  /* Sin min-width:100% a proposito: con pocas columnas angostas, el
     contenido queda del ancho de sus columnas y el resto del panel en
     blanco — asi es como lo hacen DataGrip y compania. */
  .grid-canvas {
    width: max-content;
    font-size: 0.8125rem;
  }

  .grid-corner {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 3;
    width: var(--gutter-width);
    height: var(--row-height);
    margin-bottom: calc(-1 * var(--row-height));
    box-sizing: border-box;
    background: var(--surface-elevated);
    box-shadow:
      inset -1px 0 0 var(--border),
      inset 0 -1px 0 var(--border);
    cursor: pointer;
  }

  .grid-corner:hover {
    background: color-mix(in srgb, var(--accent) 10%, var(--surface-elevated));
  }

  .grid-header {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    background: var(--surface-elevated);
  }

  .grid-header-spacer {
    flex: none;
    width: var(--gutter-width);
  }

  .grid-body {
    display: flex;
  }

  .row-gutter {
    position: sticky;
    left: 0;
    z-index: 1;
    flex: none;
    width: var(--gutter-width);
    background: var(--surface);
  }

  .row-number {
    box-sizing: border-box;
    height: var(--row-height);
    line-height: calc(var(--row-height) - 1px);
    border-bottom: 1px solid var(--border);
    box-shadow: inset -1px 0 0 var(--border);
    color: color-mix(in srgb, var(--text-secondary) 55%, transparent);
    text-align: center;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }

  .row-number:hover {
    background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  }

  .grid-body-table {
    position: relative;
    flex: none;
  }

  /* Un solo rectangulo por encima de la tabla en vez de clases/estilos
     por celda — ver el comentario de selectionRect en el script. z-index
     0 para quedar por debajo del header/columna # (sticky, z-index 1-3)
     cuando el scroll los deja tapando parte del rango; pointer-events
     none para que clicks/arrastres seguidos pasen a las celdas de abajo. */
  .selection-overlay {
    position: absolute;
    z-index: 0;
    pointer-events: none;
    box-sizing: border-box;
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    border: 1px solid var(--accent);
  }

  .scrollbar-thumb {
    position: absolute;
    z-index: 4;
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  .scrollbar-thumb.vertical {
    right: 2px;
    width: 8px;
  }

  .scrollbar-thumb.horizontal {
    bottom: 2px;
    height: 8px;
  }

  table {
    border-collapse: separate;
    border-spacing: 0;
    width: max-content;
  }

  /* Los anchos vienen de colgroup y el style inline fija su suma: sin un
     ancho de tabla explicito, `fixed` puede seguir usando el algoritmo
     automatico. */
  table.widths-locked,
  .grid-body-table :global(table.body-batch) {
    table-layout: fixed;
  }

  .grid-body-table :global(table.body-batch) {
    border-collapse: separate;
    border-spacing: 0;
    width: var(--table-width);
  }

  /* Las celdas del cuerpo se insertan como HTML (ver rowsHtml en el script) y no
     llevan la clase de alcance de Svelte: sus reglas van con :global, pero
     acotadas a .grid-body-table de este componente. */
  th,
  .grid-body-table :global(td) {
    box-sizing: border-box;
    padding: 0 var(--space-2);
    height: var(--row-height);
    border-right: 1px solid var(--grid-line);
    white-space: nowrap;
    text-align: left;
    /* Evita que arrastrar para seleccionar celdas dispare ademas la
       seleccion de texto nativa del navegador. */
    user-select: none;
  }

  /* overflow:hidden (o clip) SOLO donde hace falta. En WebKit cada elemento
     con overflow recortado recibe su propio RenderLayer: puesto en todos
     los td eran ~15.000 capas, y eso era lo que hacia el scroll pesado
     (medido en WebKitGTK 2.52: ~45ms por frame con la regla en cada td,
     17ms — 60fps — sin ella). Los th del header son pocos y siempre la
     necesitan; un td solo la necesita si su columna se achico por debajo
     del ancho de su contenido, y esa regla por columna la arma el script
     (ver clippedColumnsSelector). */
  th {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* El <th> ya no es sticky (lo es .grid-header entero), asi que puede
     tener su propio position:relative para .col-resize-handle. */
  /* display:flex directo en el <th> rompe la tabla (deja de comportarse
     como celda) — el flex va en un <span> interno. */
  .column-header {
    position: relative;
    cursor: pointer;
    background: var(--surface-elevated);
    color: var(--text-secondary);
    font-weight: var(--font-weight-heading);
    box-shadow: inset 0 -1px 0 var(--border);
  }

  .column-header-content {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
  }

  .column-header-label {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .column-header:hover {
    background: color-mix(in srgb, var(--accent) 10%, var(--surface-elevated));
  }

  .column-header :global(.column-type-icon) {
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  /* Mismo icono (Key) para PK y FK a proposito - la diferencia es solo el
     color, no la forma. Dorado para PK (la convencion mas reconocible del
     metaforo "llave"); el accent de la app para FK, para que se lea como
     "tambien es una clave, pero de otro tipo" sin confundirse con la PK. */
  .column-header :global(.column-type-icon.pk) {
    color: var(--key-primary);
  }

  .column-header :global(.column-type-icon.fk) {
    color: var(--accent);
  }

  .col-resize-handle {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    z-index: 1;
    cursor: col-resize;
    touch-action: none;
  }

  .col-resize-handle:hover,
  .col-resize-handle:active {
    background: color-mix(in srgb, var(--accent) 55%, transparent);
  }

  .grid-body-table :global(td) {
    border-bottom: 1px solid var(--grid-line);
    color: var(--text-primary);
    cursor: default;
    outline: none;
  }

  /* Pintar una sola superficie por fila evita repetir el fondo en cada td.
     Las celdas de datos son transparentes y dejan ver este fondo. */
  .grid-body-table :global(tr.zebra-odd) {
    background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  }

  .grid-body-table :global(td:focus-visible) {
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }

  .end-spacer {
    height: 4rem;
  }

  .grid-body-table :global(td.null-value) {
    color: var(--text-secondary);
    font-style: italic;
  }

  /* position:fixed (no absolute dentro de .data-grid) a proposito: asi
     escapa del overflow/scroll de .grid-viewport sin importar que tan
     adentro del arbol este montado el componente. */
  .column-tooltip {
    position: fixed;
    z-index: 1000;
    max-width: 20rem;
    margin-top: 2px;
    padding: var(--space-2) var(--space-3);
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    color: var(--text-primary);
    font-size: 0.75rem;
    box-shadow: var(--shadow-elevated);
    pointer-events: none;
    white-space: normal;
  }

  .column-tooltip-title {
    font-weight: var(--font-weight-heading);
  }

  .column-tooltip-comment {
    margin-top: var(--space-1);
    color: var(--text-secondary);
  }
</style>
