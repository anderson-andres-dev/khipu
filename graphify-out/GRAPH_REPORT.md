# Graph Report - khipu  (2026-09-24)

## Corpus Check
- 119 files · ~82,703 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 6, .icns 1, .ico 1)

## Summary
- 1267 nodes · 2460 edges · 73 communities (62 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1de29a8c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- execution_guard.rs
- mysql/src/lib.rs
- sqlContext.ts
- postgres/src/lib.rs
- src-tauri/src/lib.rs
- sqlSchema.ts
- driver-core/src/lib.rs
- queryConsoles.ts
- docs/ARCHITECTURE.md
- sqlFolders.ts
- explorerTree.ts
- tauri.conf.json
- mysql/src/tls.rs
- sqlExecutionMarker.ts
- connection.ts
- KhipuLanguageServer
- svelte
- connectionProfiles.ts
- package.json
- dependencies
- vitest
- drivers.rs
- compilerOptions
- Explorador de base de datos
- DriverError
- devDependencies
- credentials.rs
- scripts
- default.json
- khipu-desktop
- postgres/src/introspect.rs
- sql_path
- assembly.rs
- app-environment.ts
- ssr
- mysql/src/version.rs
- CLAUDE.md
- sqlCompletionPolicy.ts
- sql_files.rs
- svelte.config.js
- SqlEditor.svelte
- postgres/src/tls.rs
- ref_app
- ResultPager.svelte
- theme.ts
- FileTree.svelte
- sqlSchema.test.ts
- types.ts
- extractFromContext
- sqlFiles.ts
- pagination.rs
- shortcuts.ts
- +layout.svelte
- DestructiveClassification
- codemirrorTheme.ts
- editorSettings.ts
- Dialect
- sidebarLayout.ts
- palettes.test.ts
- TablePlus UX & Architecture Analysis (design reference for Khipu)
- Theme bootstrap IIFE (pre-paint CSS var injection)
- parser.rs
- Quality CI Workflow
- CONTRIBUTING.md
- svelte
- vite.config.js
- #each

## God Nodes (most connected - your core abstractions)
1. `DriverError` - 50 edges
2. `TableInfo` - 19 edges
3. `Dialect` - 18 edges
4. `TableSet` - 16 edges
5. `DbConnector` - 16 edges
6. `requires()` - 16 edges
7. `vitest` - 15 edges
8. `text()` - 15 edges
9. `svelte` - 14 edges
10. `AppState` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Flujo de datos` --references--> `connect()`  [INFERRED]
  docs/design/explorador-base-de-datos.md → app/src/lib/stores/connection.ts
- `SSL/TLS por conexión` --references--> `TlsMode`  [INFERRED]
  docs/design/explorador-base-de-datos.md → app/src/lib/types.ts
- `Flujo de datos` --references--> `buildExplorerTree()`  [INFERRED]
  docs/design/explorador-base-de-datos.md → app/src/lib/explorerTree.ts
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

## Communities (73 total, 11 thin omitted)

### Community 0 - "execution_guard.rs"
Cohesion: 0.13
Nodes (24): add_column_insert_create_select_are_not_destructive(), cte_around_update_without_where_requires_confirmation(), cte_with_where_is_not_destructive(), delete_returning_without_where_requires_confirmation(), delete_using_without_where_requires_confirmation(), delete_with_leading_comment_without_where_requires_confirmation(), delete_with_where_is_not_destructive(), delete_with_where_true_is_not_destructive() (+16 more)

### Community 1 - "mysql/src/lib.rs"
Cohesion: 0.06
Nodes (60): async_trait, config_from_env(), config_with_tls(), connects_and_lists_schemas_and_tables_against_real_mysql(), ER_UNSUPPORTED_PS, execute_on_connection(), execute_query_returns_command_for_ddl(), execute_query_returns_error_with_code_for_bad_sql() (+52 more)

### Community 2 - "sqlContext.ts"
Cohesion: 0.18
Nodes (13): classifyContext(), classifyFrame(), CLAUSE_KEYWORDS, ClauseKind, FrameState, JOIN_MODIFIERS, lex(), Lexical (+5 more)

### Community 3 - "postgres/src/lib.rs"
Cohesion: 0.07
Nodes (51): QueryExecutionOptions, config_from_env(), config_with_tls(), connects_and_lists_schemas_and_tables_against_real_postgres(), execute_on_connection(), execute_query_returns_command_for_ddl(), execute_query_returns_error_with_code_and_position_for_bad_sql(), execute_query_returns_result_set_with_null_and_types() (+43 more)

### Community 4 - "src-tauri/src/lib.rs"
Cohesion: 0.10
Nodes (47): ActiveConnection, AppState, connect(), count_query_rows(), create_sql_file(), database_explorer(), DatabaseExplorer, DEFAULT_QUERY_ROW_LIMIT (+39 more)

### Community 5 - "sqlSchema.ts"
Cohesion: 0.15
Nodes (18): buildCompletionSource(), buildKeywordCompletion(), buildMultiTableCompletionSource(), dialectCache, filterSchemaResult(), findTableColumns(), findTableEntry(), FkIndex (+10 more)

### Community 6 - "driver-core/src/lib.rs"
Cohesion: 0.08
Nodes (33): CheckInfo, ColumnInfo, ConnectionConfig, DbConnector, EventInfo, ForeignKeyInfo, IndexInfo, KeyInfo (+25 more)

### Community 7 - "queryConsoles.ts"
Cohesion: 0.13
Nodes (26): appendConsole(), beginQueryExecution(), cancelQueryConfirmation(), closeQueryConsole(), consoleTitle(), createId(), createQueryConsole(), EMPTY_EXECUTION_STATE (+18 more)

### Community 8 - "docs/ARCHITECTURE.md"
Cohesion: 0.26
Nodes (13): app/README.md (Tauri + SvelteKit + TypeScript template note), Cómo sumar un motor de base de datos nuevo (procedure), app/src-tauri shell layer, DbConnector trait (crates/driver-core), Dialect enum (MySql/Postgres, crates/engine/src/lib.rs), crates/driver-core layer (DbConnector contract), crates/drivers/* layer (khipu-driver-mysql, khipu-driver-postgres, ... over sqlx), crates/engine layer (dialect-agnostic core) (+5 more)

### Community 9 - "sqlFolders.ts"
Cohesion: 0.14
Nodes (15): folderMenuItems(), startCreate(), pickSqlFolder(), closeSqlFolder(), DEFAULT_FILE_PANEL_HEIGHT, EMPTY, listRecord(), load() (+7 more)

### Community 10 - "explorerTree.ts"
Cohesion: 0.17
Nodes (16): buildExplorerTree(), columnList(), expandableKeys(), ExplorerIcon, ExplorerNode, folder(), matches(), schemaNode() (+8 more)

### Community 11 - "tauri.conf.json"
Cohesion: 0.11
Nodes (17): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+9 more)

### Community 12 - "mysql/src/tls.rs"
Cohesion: 0.15
Nodes (15): apply(), connection_error(), io_error(), is_tls_failure(), Error, ErrorKind, Option, TlsMode (+7 more)

### Community 13 - "sqlExecutionMarker.ts"
Cohesion: 0.06
Nodes (27): CatalogTableRef, definitionLinkExtension(), DefinitionLinkOptions, DefinitionLinkPlugin, isModifierHeld(), linkRangeField, setLinkRange, activeStatementHighlight (+19 more)

### Community 14 - "connection.ts"
Cohesion: 0.10
Nodes (21): editButton(), getDriver(), loadConnectionPassword(), runtimePasswords, catalogTables, completeConnection(), connect(), connection (+13 more)

### Community 15 - "KhipuLanguageServer"
Cohesion: 0.15
Nodes (11): Client, CompletionParams, CompletionResponse, KhipuLanguageServer, Option, Result, InitializeParams, InitializeResult (+3 more)

### Community 16 - "svelte"
Cohesion: 0.12
Nodes (10): neutral, active, selected, tinted, CONNECTION_COLORS, NEUTRAL_IDENTITY_COLOR, BackendKind, connectionDrivers (+2 more)

### Community 17 - "connectionProfiles.ts"
Cohesion: 0.15
Nodes (15): ConnectionDriver, PasswordPolicy, ConnectionConfig, ConnectionProfile, connectionProfiles, isDriver(), isHexColor(), isPasswordPolicy() (+7 more)

### Community 18 - "package.json"
Cohesion: 0.14
Nodes (13): description, license, name, type, version, codemirror, @codemirror/commands, devicon (+5 more)

### Community 19 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, codemirror, @codemirror/autocomplete, @codemirror/commands, @codemirror/lang-sql, @codemirror/language, @codemirror/state, @codemirror/view (+6 more)

### Community 20 - "vitest"
Cohesion: 0.10
Nodes (22): initials(), luminance(), readableTextColor(), describeTls(), summarizeError(), summarizeReport(), summaryText(), encrypted (+14 more)

### Community 21 - "drivers.rs"
Cohesion: 0.18
Nodes (19): connect(), ConnectedDatabase, DatabaseKind, open(), report(), Arc, ConnectionConfig, Option (+11 more)

### Community 22 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, skipLibCheck (+4 more)

### Community 23 - "Explorador de base de datos"
Cohesion: 0.20
Nodes (9): TlsStatus, Compatibilidad entre versiones, Contrato del driver, Explorador de base de datos, Limitaciones conocidas, MySQL / MariaDB — `information_schema`, PostgreSQL — `pg_catalog`, Próximos pasos (+1 more)

### Community 24 - "DriverError"
Cohesion: 0.11
Nodes (40): DriverError, COLUMNS_SQL, event_row(), EVENTS_SQL, fetch(), foreign_key_row(), FOREIGN_KEYS_SQL, format_parameter() (+32 more)

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

### Community 30 - "postgres/src/introspect.rs"
Cohesion: 0.11
Nodes (38): balanced(), check_expression(), COLUMNS_SQL, constraint_column_row(), CONSTRAINT_COLUMNS_SQL, ConstraintColumnRow, decode_trigger_type(), fetch() (+30 more)

### Community 32 - "assembly.rs"
Cohesion: 0.14
Nodes (25): crate, drops_rows_for_unknown_relations(), group(), groups_multi_column_keys_in_column_order(), groups_non_adjacent_rows_of_the_same_constraint(), ignores_duplicate_relation_names(), IndexColumnRow, key_row() (+17 more)

### Community 37 - "mysql/src/version.rs"
Cohesion: 0.07
Nodes (19): Capabilities, check_constraints_depend_on_flavor_and_version(), CheckConstraints, Flavor, MIN_MARIADB, MIN_MYSQL, Capabilities, Self (+11 more)

### Community 41 - "sqlCompletionPolicy.ts"
Cohesion: 0.22
Nodes (10): COMMON_STARTERS, completionPolicy, MYSQL_STARTERS, NO_BOOST(), POSTGRES_STARTERS, RELATION_TAIL_BASE, RELATION_TAIL_BOOST, relationTailKeywords() (+2 more)

### Community 42 - "sql_files.rs"
Cohesion: 0.10
Nodes (33): preserves_column_metadata(), preserves_foreign_keys(), IntoIterator, Item, tables_to_catalog(), absolute_dir(), create(), is_sql_file_name() (+25 more)

### Community 43 - "svelte.config.js"
Cohesion: 0.40
Nodes (3): config, @sveltejs/adapter-static, @sveltejs/vite-plugin-svelte

### Community 44 - "SqlEditor.svelte"
Cohesion: 0.11
Nodes (6): onMove(), onUp(), ContextMenuItem, table(), app_src_lib_sqleditoricons, state

### Community 45 - "postgres/src/tls.rs"
Cohesion: 0.15
Nodes (16): apply(), certificate_errors_are_labelled(), connection_error(), io_error(), is_tls_failure(), read_status(), Error, ErrorKind (+8 more)

### Community 46 - "ref_app"
Cohesion: 0.25
Nodes (7): applyForwardJoin(), applyReverseJoin(), buildJoinCompletionSource(), boostFor(), recordUsage(), usage, ref_app

### Community 47 - "ResultPager.svelte"
Cohesion: 0.10
Nodes (16): applyCustom(), changePageSize(), format(), goLast(), hideTooltip(), lastOffsetFor(), navButton(), prettyShortcut() (+8 more)

### Community 48 - "theme.ts"
Cohesion: 0.18
Nodes (13): ThemeFamily, DEFAULT_THEME_CHOICE, editorPalette, effectiveScheme, isSchemePreference(), isThemeFamily(), loadStoredThemeChoice(), SchemePreference (+5 more)

### Community 49 - "FileTree.svelte"
Cohesion: 0.15
Nodes (14): active, confirmTrash(), editValue, fileMenuItems(), finishEdit(), onEditKeydown(), requestTrash(), startRename() (+6 more)

### Community 50 - "sqlSchema.test.ts"
Cohesion: 0.20
Nodes (10): applyAndRecord(), buildFkIndex(), buildSqlSchema(), extractDefaultTable(), CATALOG, complete(), ORDERS, USERS (+2 more)

### Community 51 - "types.ts"
Cohesion: 0.09
Nodes (19): PageRequest, PendingQueryConfirmation, CatalogColumn, ColumnCatalogInfo, DestructiveStatement, ExecuteQueryResponse, ExplorerCheck, ExplorerColumn (+11 more)

### Community 52 - "extractFromContext"
Cohesion: 0.67
Nodes (4): currentStatement(), extractFromContext(), extractFromTables(), toRelation()

### Community 53 - "sqlFiles.ts"
Cohesion: 0.18
Nodes (17): openSqlFileAtPath(), openSqlFileWithDialog(), renameConsoleFile(), renameSqlFile(), saveConsole(), saveConsoleAs(), SQL_FILTERS, SqlDirEntry (+9 more)

### Community 54 - "pagination.rs"
Cohesion: 0.21
Nodes (11): ast, count_sql(), literal_limit(), literal_u64(), number(), paginate_sql(), parse_pageable_query(), Option (+3 more)

### Community 55 - "shortcuts.ts"
Cohesion: 0.16
Nodes (9): eventMatchesShortcut(), formatShortcutEvent(), MODIFIER_KEYS, ResolvedShortcut, ShortcutDefinition, shortcutDefinitions, shortcutOverrides, shortcuts (+1 more)

### Community 56 - "+layout.svelte"
Cohesion: 0.24
Nodes (13): setFilePanelHeight(), app_src_lib_styles_tokens, initThemeEffects(), clampFilePanelHeight(), onFilePanelHandleKeydown(), onSidebarHandleKeydown(), startFilePanelResize(), onMove() (+5 more)

### Community 57 - "DestructiveClassification"
Cohesion: 0.24
Nodes (13): AlterTableOperation, classify_alter_table(), classify_drop(), classify_query(), classify_selection(), classify_set_expr(), classify_statement(), DestructiveClassification (+5 more)

### Community 58 - "codemirrorTheme.ts"
Cohesion: 0.22
Nodes (7): LIGHT_OVERRIDES, ColorScheme, EditorPalette, palettes, ShellPalette, ThemeVariant, @lezer/highlight

### Community 59 - "editorSettings.ts"
Cohesion: 0.24
Nodes (8): DEFAULT_FORMATTER_LINE_WIDTH, defaultEditorSettings(), editorSettings, loadEditorSettings(), MAX_FORMATTER_LINE_WIDTH, MIN_FORMATTER_LINE_WIDTH, normalizeLineWidth(), setFormatterLineWidth()

### Community 60 - "Dialect"
Cohesion: 0.22
Nodes (7): classify(), classify_destructive_sql(), ParserError, Result, Dialect, Box, MYSQL

### Community 61 - "sidebarLayout.ts"
Cohesion: 0.39
Nodes (7): clampSidebarWidth(), DEFAULT_SIDEBAR_WIDTH, loadSidebarWidth(), MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, releaseSidebarDrag(), sidebarWidth

### Community 62 - "palettes.test.ts"
Cohesion: 0.25
Nodes (7): contrast(), DARK_BEFORE, FAMILIES, luminance(), SCHEMES, ref_app_html_raw, ref_styles_tokens_css_raw

### Community 63 - "TablePlus UX & Architecture Analysis (design reference for Khipu)"
Cohesion: 0.25
Nodes (9): ApplicationShell abstract component architecture, Command palette / Open Anything, TablePlus UX & Architecture Analysis (design reference for Khipu), Domain-oriented sidebar navigation, Explore -> Inspect -> Modify -> Review -> Commit flow, Inline editing, Pending changes / Preview / Commit / Safe Mode pattern, Preview tabs (+1 more)

### Community 64 - "Theme bootstrap IIFE (pre-paint CSS var injection)"
Cohesion: 0.25
Nodes (8): CSS_VAR_NAMES field-to-CSS-variable mapping, app/src/app.html (SvelteKit shell HTML), SHELL_PALETTES literal (datagrip/vscode x dark/light), palettes.ts palette definitions (external reference, file not read in this chunk), theme.ts SHELL_PALETTE_CSS_VARS (external reference, file not read in this chunk), Theme bootstrap IIFE (pre-paint CSS var injection), Rationale: palette literals duplicated inline to avoid flash-of-unstyled-theme before SvelteKit ES modules load, app/src frontend layer (Svelte + CodeMirror 6)

### Community 65 - "parser.rs"
Cohesion: 0.25
Nodes (3): ParserError, Result, validate()

### Community 66 - "Quality CI Workflow"
Cohesion: 0.29
Nodes (7): Node job (check, build), Rust job (fmt, clippy, test), Quality CI Workflow, Release job (multi-platform build & publish), tauri-apps/tauri-action, Release CI Workflow, Flujo de ramas y releases (branch protection + release flow)

### Community 67 - "CONTRIBUTING.md"
Cohesion: 0.40
Nodes (4): DbConnector trait (contributor guidance), Dialect enum (crates/engine), Driver contract tests (#[ignore = "requires database"] pattern), Driver factory branch in app/src-tauri/src/drivers.rs

### Community 68 - "svelte"
Cohesion: 0.67
Nodes (3): createMemoryStorage(), freshQueryConsoles(), svelte

### Community 69 - "vite.config.js"
Cohesion: 0.50
Nodes (3): ref_node_process, @sveltejs/kit, vite

## Ambiguous Edges - Review These
- `CSS_VAR_NAMES field-to-CSS-variable mapping` → `theme.ts SHELL_PALETTE_CSS_VARS (external reference, file not read in this chunk)`  [AMBIGUOUS]
  app/src/app.html · relation: references
- `SHELL_PALETTES literal (datagrip/vscode x dark/light)` → `palettes.ts palette definitions (external reference, file not read in this chunk)`  [AMBIGUOUS]
  app/src/app.html · relation: references

## Knowledge Gaps
- **230 isolated node(s):** `name`, `version`, `description`, `license`, `type` (+225 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 471 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `CSS_VAR_NAMES field-to-CSS-variable mapping` and `theme.ts SHELL_PALETTE_CSS_VARS (external reference, file not read in this chunk)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `SHELL_PALETTES literal (datagrip/vscode x dark/light)` and `palettes.ts palette definitions (external reference, file not read in this chunk)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `Explorador de base de datos` connect `Explorador de base de datos` to `explorerTree.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `SSL/TLS por conexión` connect `Explorador de base de datos` to `connectionProfiles.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `svelte` connect `svelte` to `queryConsoles.ts`, `sqlFolders.ts`, `connection.ts`, `ResultPager.svelte`, `theme.ts`, `connectionProfiles.ts`, `package.json`, `FileTree.svelte`, `ref_app`, `sqlFiles.ts`, `shortcuts.ts`, `editorSettings.ts`, `sidebarLayout.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _230 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `execution_guard.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._