# Graph Report - khipu  (2026-09-25)

## Corpus Check
- 151 files · ~116,090 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .css 2, .icns 1)

## Summary
- 1598 nodes · 3281 edges · 78 communities (68 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d01bcd25`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- execution_guard.rs
- mysql/src/lib.rs
- resultEdits.ts
- postgres/src/lib.rs
- src-tauri/src/lib.rs
- sqlSchema.ts
- driver-core/src/lib.rs
- queryConsoles.ts
- docs/ARCHITECTURE.md
- theme.ts
- connections.ts
- tauri.conf.json
- sqlFiles.ts
- sqlDefinitionLink.ts
- connection.ts
- KhipuLanguageServer
- types.ts
- connectionProfiles.ts
- package.json
- dependencies
- sqlFormatter.ts
- postgres/src/tls.rs
- compilerOptions
- queryExecution.ts
- mysql/src/tls.rs
- devDependencies
- credentials.rs
- scripts
- default.json
- khipu-desktop
- DriverError
- sql_path
- assembly.rs
- app-environment.ts
- ssr
- mysql/src/version.rs
- CLAUDE.md
- sqlContext.ts
- shortcuts.ts
- export.rs
- editorSearchPanel.ts
- super
- gridFind.ts
- ResultPager.svelte
- sqlFolders.ts
- resultEditing.ts
- sqlCompletionPolicy.ts
- explorerTree.ts
- Explorador de base de datos
- FileTree.svelte
- Dialect
- withExecution
- sqlSchema.test.ts
- connectionTest.ts
- ExportDialog.svelte
- Workspace.svelte
- sqlExecutionMarker.ts
- gridClipboard.ts
- onPointerDown
- +layout.svelte
- vitest
- extractFromContext
- SqlEditor.svelte
- sql_files.rs
- catalog.rs
- ref_app
- catalog_adapter.rs
- sqlEditorBehavior.ts
- copyFormat.ts
- svelte
- sidebarLayout.ts
- startFilePanelResize
- StatusGutterMarker
- queryConsoles.test.ts

## God Nodes (most connected - your core abstractions)
1. `DriverError` - 50 edges
2. `Dialect` - 34 edges
3. `vitest` - 24 edges
4. `svelte` - 21 edges
5. `TableInfo` - 20 edges
6. `AppState` - 18 edges
7. `DbConnector` - 18 edges
8. `createSearchPanel()` - 16 edges
9. `TableSet` - 16 edges
10. `requires()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Flujo de datos` --references--> `buildExplorerTree()`  [INFERRED]
  docs/design/explorador-base-de-datos.md → app/src/lib/explorerTree.ts
- `SSL/TLS por conexión` --references--> `TlsMode`  [INFERRED]
  docs/design/explorador-base-de-datos.md → app/src/lib/types.ts
- `Flujo de datos` --references--> `connect()`  [INFERRED]
  docs/design/explorador-base-de-datos.md → app/src/lib/stores/connection.ts
- `SSL/TLS por conexión` --references--> `TlsStatus`  [INFERRED]
  docs/design/explorador-base-de-datos.md → app/src/lib/types.ts
- `app/README.md (Tauri + SvelteKit + TypeScript template note)` --semantically_similar_to--> `README.md (English)`  [INFERRED] [semantically similar]
  app/README.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI Quality Pipeline (workflow + its jobs)** — _github_workflows_quality_workflow, _github_workflows_quality_rust_job, _github_workflows_quality_node_job [EXTRACTED 1.00]
- **Branch protection to tagged-release pipeline flow** — contributing_branch_flow, _github_workflows_quality_workflow, _github_workflows_release_workflow [EXTRACTED 1.00]
- **TablePlus edit-review-commit UX pattern group** — docs_design_tableplus_ux_arquitectura_explore_inspect_modify_review_commit, docs_design_tableplus_ux_arquitectura_pending_changes_commit, docs_design_tableplus_ux_arquitectura_application_shell [INFERRED 0.85]

## Communities (78 total, 10 thin omitted)

### Community 0 - "execution_guard.rs"
Cohesion: 0.09
Nodes (41): AlterTableOperation, add_column_insert_create_select_are_not_destructive(), classify(), classify_alter_table(), classify_destructive_sql(), classify_drop(), classify_query(), classify_selection() (+33 more)

### Community 1 - "mysql/src/lib.rs"
Cohesion: 0.07
Nodes (59): QueryExecutionOptions, config_from_env(), config_with_tls(), connects_and_lists_schemas_and_tables_against_real_mysql(), ER_UNSUPPORTED_PS, execute_on_connection(), execute_query_returns_command_for_ddl(), execute_query_returns_error_with_code_for_bad_sql() (+51 more)

### Community 2 - "resultEdits.ts"
Cohesion: 0.20
Nodes (14): PendingEdits, ResultEditInfo, RowRange, clearResultPendingEdits(), commitResultEdits(), editStateFor(), EditStep, EMPTY_STATE (+6 more)

### Community 3 - "postgres/src/lib.rs"
Cohesion: 0.07
Nodes (52): async_trait, config_from_env(), config_with_tls(), connects_and_lists_schemas_and_tables_against_real_postgres(), execute_on_connection(), execute_query_returns_command_for_ddl(), execute_query_returns_error_with_code_and_position_for_bad_sql(), execute_query_returns_result_set_with_null_and_types() (+44 more)

### Community 4 - "src-tauri/src/lib.rs"
Cohesion: 0.09
Nodes (60): ActiveConnection, apply_result_changes(), AppState, connect(), count_query_rows(), create_sql_file(), database_explorer(), DatabaseExplorer (+52 more)

### Community 5 - "sqlSchema.ts"
Cohesion: 0.15
Nodes (18): buildCompletionSource(), buildKeywordCompletion(), buildMultiTableCompletionSource(), dialectCache, filterSchemaResult(), findTableColumns(), findTableEntry(), FkIndex (+10 more)

### Community 6 - "driver-core/src/lib.rs"
Cohesion: 0.08
Nodes (36): CheckInfo, ColumnInfo, ConnectionConfig, DbConnector, EventInfo, ForeignKeyInfo, IndexInfo, KeyInfo (+28 more)

### Community 7 - "queryConsoles.ts"
Cohesion: 0.13
Nodes (19): activateQueryConsole(), appendConsole(), closeQueryConsole(), consoleTitle(), createId(), createQueryConsole(), EMPTY_EXECUTION_STATE, EMPTY_STATE (+11 more)

### Community 8 - "docs/ARCHITECTURE.md"
Cohesion: 0.06
Nodes (41): Node job (check, build), Rust job (fmt, clippy, test), Quality CI Workflow, Release job (multi-platform build & publish), tauri-apps/tauri-action, Release CI Workflow, app/README.md (Tauri + SvelteKit + TypeScript template note), CSS_VAR_NAMES field-to-CSS-variable mapping (+33 more)

### Community 9 - "theme.ts"
Cohesion: 0.06
Nodes (36): DEFAULT_FORMATTER_LINE_WIDTH, defaultEditorSettings(), editorSettings, loadEditorSettings(), MAX_FORMATTER_LINE_WIDTH, MIN_FORMATTER_LINE_WIDTH, normalizeLineWidth(), setFormatterLineWidth() (+28 more)

### Community 10 - "connections.ts"
Cohesion: 0.11
Nodes (10): neutral, active, selected, tinted, CONNECTION_COLORS, NEUTRAL_IDENTITY_COLOR, BackendKind, connectionDrivers (+2 more)

### Community 11 - "tauri.conf.json"
Cohesion: 0.11
Nodes (17): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+9 more)

### Community 12 - "sqlFiles.ts"
Cohesion: 0.20
Nodes (15): openSqlFileAtPath(), openSqlFileWithDialog(), renameConsoleFile(), renameSqlFile(), saveConsole(), saveConsoleAs(), SQL_FILTERS, SqlDirEntry (+7 more)

### Community 13 - "sqlDefinitionLink.ts"
Cohesion: 0.18
Nodes (7): CatalogTableRef, definitionLinkExtension(), DefinitionLinkOptions, DefinitionLinkPlugin, isModifierHeld(), linkRangeField, setLinkRange

### Community 14 - "connection.ts"
Cohesion: 0.10
Nodes (23): editButton(), getDriver(), loadConnectionPassword(), runtimePasswords, catalogTables, completeConnection(), connect(), connection (+15 more)

### Community 15 - "KhipuLanguageServer"
Cohesion: 0.15
Nodes (11): Client, CompletionParams, CompletionResponse, KhipuLanguageServer, Option, Result, InitializeParams, InitializeResult (+3 more)

### Community 16 - "types.ts"
Cohesion: 0.12
Nodes (17): QueryExecutionState, CatalogColumn, ColumnCatalogInfo, ExplorerCheck, ExplorerColumn, ExplorerEvent, ExplorerForeignKey, ExplorerIndex (+9 more)

### Community 17 - "connectionProfiles.ts"
Cohesion: 0.16
Nodes (13): ConnectionDriver, PasswordPolicy, ConnectionProfile, connectionProfiles, isDriver(), isHexColor(), isPasswordPolicy(), isTlsMode() (+5 more)

### Community 18 - "package.json"
Cohesion: 0.09
Nodes (19): description, license, name, type, version, config, codemirror, @codemirror/commands (+11 more)

### Community 19 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, codemirror, @codemirror/autocomplete, @codemirror/commands, @codemirror/lang-sql, @codemirror/language, @codemirror/search, @codemirror/state (+8 more)

### Community 20 - "sqlFormatter.ts"
Cohesion: 0.23
Nodes (10): CLAUSES_WITH_INLINE_BODY, compactStructuredLayout(), compactStructuredLayoutPass(), formatSqlBlock(), indentation(), isClause(), Quote, scanFormattedSql() (+2 more)

### Community 21 - "postgres/src/tls.rs"
Cohesion: 0.08
Nodes (37): connect(), ConnectedDatabase, DatabaseKind, open(), report(), Arc, ConnectionConfig, Option (+29 more)

### Community 22 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, skipLibCheck (+4 more)

### Community 23 - "queryExecution.ts"
Cohesion: 0.22
Nodes (6): nextSort(), PageRequest, PendingQueryConfirmation, DestructiveStatement, ExecuteQueryResponse, SortKey

### Community 24 - "mysql/src/tls.rs"
Cohesion: 0.13
Nodes (19): apply(), connection_error(), io_error(), is_tls_failure(), read_status(), Error, ErrorKind, MySqlPool (+11 more)

### Community 25 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, svelte, svelte-check, @sveltejs/adapter-static, @sveltejs/kit, @sveltejs/vite-plugin-svelte, @tauri-apps/cli, typescript (+2 more)

### Community 26 - "credentials.rs"
Cohesion: 0.40
Nodes (9): delete(), entry(), load(), Option, Result, String, save(), SERVICE (+1 more)

### Community 27 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, check, check:watch, dev, prepare, preview, tauri (+1 more)

### Community 28 - "default.json"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 29 - "khipu-desktop"
Cohesion: 0.47
Nodes (6): khipu-desktop, khipu-driver-core, khipu-driver-mysql, khipu-driver-postgres, khipu-engine, khipu-lsp

### Community 30 - "DriverError"
Cohesion: 0.07
Nodes (73): DriverError, COLUMNS_SQL, event_row(), EVENTS_SQL, fetch(), foreign_key_row(), FOREIGN_KEYS_SQL, format_parameter() (+65 more)

### Community 32 - "assembly.rs"
Cohesion: 0.14
Nodes (25): crate, drops_rows_for_unknown_relations(), group(), groups_multi_column_keys_in_column_order(), groups_non_adjacent_rows_of_the_same_constraint(), ignores_duplicate_relation_names(), IndexColumnRow, key_row() (+17 more)

### Community 37 - "mysql/src/version.rs"
Cohesion: 0.13
Nodes (12): Capabilities, check_constraints_depend_on_flavor_and_version(), CheckConstraints, Flavor, MIN_MARIADB, MIN_MYSQL, Capabilities, Self (+4 more)

### Community 41 - "sqlContext.ts"
Cohesion: 0.18
Nodes (13): classifyContext(), classifyFrame(), CLAUSE_KEYWORDS, ClauseKind, FrameState, JOIN_MODIFIERS, lex(), Lexical (+5 more)

### Community 42 - "shortcuts.ts"
Cohesion: 0.16
Nodes (9): eventMatchesShortcut(), formatShortcutEvent(), MODIFIER_KEYS, ResolvedShortcut, ShortcutDefinition, shortcutDefinitions, shortcutOverrides, shortcuts (+1 more)

### Community 43 - "export.rs"
Cohesion: 0.15
Nodes (22): ALLOWED_EXTENSIONS, columns(), csv_field(), export(), ExportFormat, FileSink, is_json(), is_numeric() (+14 more)

### Community 44 - "editorSearchPanel.ts"
Cohesion: 0.08
Nodes (27): addExclusion, clearExclusions, createSearchPanel(), buildQuery(), commit(), excludeCurrent(), textField(), currentMatch() (+19 more)

### Community 45 - "super"
Cohesion: 0.14
Nodes (8): Capabilities, capabilities_by_version(), MIN_MAJOR, Capabilities, Self, String, ServerVersion, super

### Community 46 - "gridFind.ts"
Cohesion: 0.15
Nodes (14): onMove(), onUp(), buildMatcher(), cellText(), escapeRegex(), findInPage(), FindMatch, FindOptions (+6 more)

### Community 47 - "ResultPager.svelte"
Cohesion: 0.11
Nodes (15): applyCustom(), changePageSize(), goLast(), hideTooltip(), lastOffsetFor(), navButton(), prettyShortcut(), showTooltip() (+7 more)

### Community 48 - "sqlFolders.ts"
Cohesion: 0.14
Nodes (15): folderMenuItems(), startCreate(), pickSqlFolder(), closeSqlFolder(), DEFAULT_FILE_PANEL_HEIGHT, EMPTY, listRecord(), load() (+7 more)

### Community 49 - "resultEditing.ts"
Cohesion: 0.13
Nodes (19): for(), addRow(), buildChanges(), ChangeError, ColumnValue, deleteRows(), EditableColumn, EditTarget (+11 more)

### Community 50 - "sqlCompletionPolicy.ts"
Cohesion: 0.22
Nodes (10): COMMON_STARTERS, completionPolicy, MYSQL_STARTERS, NO_BOOST(), POSTGRES_STARTERS, RELATION_TAIL_BASE, RELATION_TAIL_BOOST, relationTailKeywords() (+2 more)

### Community 51 - "explorerTree.ts"
Cohesion: 0.19
Nodes (15): buildExplorerTree(), columnList(), expandableKeys(), ExplorerIcon, ExplorerNode, folder(), matches(), schemaNode() (+7 more)

### Community 52 - "Explorador de base de datos"
Cohesion: 0.20
Nodes (9): TlsStatus, Compatibilidad entre versiones, Contrato del driver, Explorador de base de datos, Limitaciones conocidas, MySQL / MariaDB — `information_schema`, PostgreSQL — `pg_catalog`, Próximos pasos (+1 more)

### Community 53 - "FileTree.svelte"
Cohesion: 0.14
Nodes (16): active, confirmTrash(), editValue, fileMenuItems(), finishEdit(), onEditKeydown(), requestTrash(), startRename() (+8 more)

### Community 54 - "Dialect"
Cohesion: 0.05
Nodes (73): edit_info(), EditableColumn, EditTarget, find_table(), names(), ResultEditInfo, BTreeMap, Option (+65 more)

### Community 55 - "withExecution"
Cohesion: 0.22
Nodes (13): beginQueryExecution(), cancelQueryConfirmation(), clearQueryResult(), executionForConsole(), finishQueryExecution(), requireQueryConfirmation(), setQueryCounting(), setQuerySort() (+5 more)

### Community 56 - "sqlSchema.test.ts"
Cohesion: 0.20
Nodes (10): applyAndRecord(), buildFkIndex(), buildSqlSchema(), extractDefaultTable(), CATALOG, complete(), ORDERS, USERS (+2 more)

### Community 57 - "connectionTest.ts"
Cohesion: 0.29
Nodes (8): describeTls(), summarizeError(), summarizeReport(), summaryText(), encrypted, TestOutcome, TestSummary, TestConnectionReport

### Community 58 - "ExportDialog.svelte"
Cohesion: 0.18
Nodes (10): format(), detectJsonColumns(), escapeHtml(), highlightJson(), HTML_ESCAPES, isJsonColumnType(), looksLikeJsonDocument(), MAX_HIGHLIGHTED_CHARS (+2 more)

### Community 59 - "Workspace.svelte"
Cohesion: 0.12
Nodes (7): labelForKey(), onKeydown(), tabExists(), executionLog, LogEntry, LogKind, svelte

### Community 60 - "sqlExecutionMarker.ts"
Cohesion: 0.17
Nodes (10): executionMarker, executionMarkerField, ExecutionMarkerStatus, executionTimeDecorations(), ExecutionTimeWidget, formatExecutionTime(), markerFromResult(), setExecutionMarker (+2 more)

### Community 61 - "gridClipboard.ts"
Cohesion: 0.14
Nodes (22): writeClipboard(), CopyColumn, CopyOptions, csvField(), externalValue(), jsonValue(), markdownField(), normalizeNewlines() (+14 more)

### Community 62 - "onPointerDown"
Cohesion: 0.42
Nodes (9): prefersReducedMotion(), onPointerDown(), cleanup(), onMove(), onUp(), resetStyles(), settle(), startDrag() (+1 more)

### Community 63 - "+layout.svelte"
Cohesion: 0.22
Nodes (6): installDialogMotion(), reset(), app_src_lib_styles_tokens, handleSidebarFind(), onSidebarFindKeydown(), onSidebarHandleKeydown()

### Community 64 - "vitest"
Cohesion: 0.43
Nodes (4): initials(), luminance(), readableTextColor(), vitest

### Community 65 - "extractFromContext"
Cohesion: 0.67
Nodes (4): currentStatement(), extractFromContext(), extractFromTables(), toRelation()

### Community 66 - "SqlEditor.svelte"
Cohesion: 0.15
Nodes (5): close(), ContextMenuItem, table(), app_src_lib_sqleditoricons, app_src_lib_styles_editorsearch

### Community 67 - "sql_files.rs"
Cohesion: 0.31
Nodes (15): absolute_dir(), create(), is_sql_file_name(), list_dir(), read(), rename(), PathBuf, Result (+7 more)

### Community 68 - "catalog.rs"
Cohesion: 0.23
Nodes (10): CatalogColumn, CatalogColumn, CatalogForeignKey, CatalogTable, CatalogTable, Option, String, Vec (+2 more)

### Community 69 - "ref_app"
Cohesion: 0.25
Nodes (7): applyForwardJoin(), applyReverseJoin(), buildJoinCompletionSource(), boostFor(), recordUsage(), usage, ref_app

### Community 70 - "catalog_adapter.rs"
Cohesion: 0.47
Nodes (5): preserves_column_metadata(), preserves_foreign_keys(), IntoIterator, Item, tables_to_catalog()

### Community 71 - "sqlEditorBehavior.ts"
Cohesion: 0.24
Nodes (9): activeStatementHighlight, autoUppercaseSqlKeywords, findStatement(), statementDecorations(), editFor(), uppercaseKeywordEdit, @codemirror/lang-sql, @codemirror/language (+1 more)

### Community 72 - "copyFormat.ts"
Cohesion: 0.40
Nodes (4): COPY_FORMATS, CopyFormat, copySettings, DEFAULTS

### Community 73 - "svelte"
Cohesion: 0.16
Nodes (13): reorderResultTabs(), moveItem(), reorderable(), ReorderParams, addPinnedTab(), consoleOfKey(), pinnedResults, PinnedTab (+5 more)

### Community 74 - "sidebarLayout.ts"
Cohesion: 0.39
Nodes (7): clampSidebarWidth(), DEFAULT_SIDEBAR_WIDTH, loadSidebarWidth(), MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, releaseSidebarDrag(), sidebarWidth

### Community 75 - "startFilePanelResize"
Cohesion: 0.39
Nodes (9): setFilePanelHeight(), clampFilePanelHeight(), onFilePanelHandleKeydown(), startFilePanelResize(), onMove(), onUp(), startSidebarResize(), onMove() (+1 more)

## Ambiguous Edges - Review These
- `CSS_VAR_NAMES field-to-CSS-variable mapping` → `theme.ts SHELL_PALETTE_CSS_VARS (external reference, file not read in this chunk)`  [AMBIGUOUS]
  app/src/app.html · relation: references
- `SHELL_PALETTES literal (datagrip/vscode x dark/light)` → `palettes.ts palette definitions (external reference, file not read in this chunk)`  [AMBIGUOUS]
  app/src/app.html · relation: references

## Knowledge Gaps
- **267 isolated node(s):** `name`, `version`, `description`, `license`, `type` (+262 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 548 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `CSS_VAR_NAMES field-to-CSS-variable mapping` and `theme.ts SHELL_PALETTE_CSS_VARS (external reference, file not read in this chunk)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `SHELL_PALETTES literal (datagrip/vscode x dark/light)` and `palettes.ts palette definitions (external reference, file not read in this chunk)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `SSL/TLS por conexión` connect `Explorador de base de datos` to `connection.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `Explorador de base de datos` connect `Explorador de base de datos` to `connection.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `resultEdits.ts`, `theme.ts`, `connectionProfiles.ts`, `package.json`, `sqlFormatter.ts`, `queryExecution.ts`, `sqlContext.ts`, `editorSearchPanel.ts`, `gridFind.ts`, `resultEditing.ts`, `sqlCompletionPolicy.ts`, `explorerTree.ts`, `sqlSchema.test.ts`, `connectionTest.ts`, `ExportDialog.svelte`, `sqlExecutionMarker.ts`, `gridClipboard.ts`, `sqlEditorBehavior.ts`, `svelte`, `sidebarLayout.ts`, `queryConsoles.test.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _267 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `execution_guard.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.08585858585858586 - nodes in this community are weakly interconnected._