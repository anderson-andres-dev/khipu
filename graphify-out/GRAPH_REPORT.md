# Graph Report - khipu  (2026-09-24)

## Corpus Check
- 116 files · ~78,915 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 6, .icns 1, .ico 1)

## Summary
- 1214 nodes · 2360 edges · 51 communities (43 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e802e6a2`
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
- +layout.svelte
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
- sqlFormatter.ts
- drivers.rs
- compilerOptions
- connectionTest.ts
- vitest
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
- sqlCompletionPolicy.ts
- sql_files.rs
- svelte.config.js
- SqlEditor.svelte
- postgres/src/tls.rs
- ref_app
- theme.ts
- sqlSchema.test.ts
- types.ts
- extractFromContext

## God Nodes (most connected - your core abstractions)
1. `DriverError` - 50 edges
2. `TableInfo` - 19 edges
3. `TableSet` - 16 edges
4. `DbConnector` - 16 edges
5. `requires()` - 16 edges
6. `vitest` - 15 edges
7. `text()` - 15 edges
8. `svelte` - 13 edges
9. `MySqlConnector` - 13 edges
10. `PostgresConnector` - 13 edges

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

## Communities (51 total, 8 thin omitted)

### Community 0 - "execution_guard.rs"
Cohesion: 0.06
Nodes (47): AlterTableOperation, ast, add_column_insert_create_select_are_not_destructive(), classify(), classify_alter_table(), classify_destructive_sql(), classify_drop(), classify_query() (+39 more)

### Community 1 - "mysql/src/lib.rs"
Cohesion: 0.06
Nodes (60): QueryExecutionOptions, config_from_env(), config_with_tls(), connects_and_lists_schemas_and_tables_against_real_mysql(), ER_UNSUPPORTED_PS, execute_on_connection(), execute_query_returns_command_for_ddl(), execute_query_returns_error_with_code_for_bad_sql() (+52 more)

### Community 2 - "sqlContext.ts"
Cohesion: 0.18
Nodes (13): classifyContext(), classifyFrame(), CLAUSE_KEYWORDS, ClauseKind, FrameState, JOIN_MODIFIERS, lex(), Lexical (+5 more)

### Community 3 - "postgres/src/lib.rs"
Cohesion: 0.07
Nodes (50): config_from_env(), config_with_tls(), connects_and_lists_schemas_and_tables_against_real_postgres(), execute_on_connection(), execute_query_returns_command_for_ddl(), execute_query_returns_error_with_code_and_position_for_bad_sql(), execute_query_returns_result_set_with_null_and_types(), execute_query_truncates_at_max_rows() (+42 more)

### Community 4 - "src-tauri/src/lib.rs"
Cohesion: 0.11
Nodes (43): ActiveConnection, AppState, connect(), create_sql_file(), database_explorer(), DatabaseExplorer, DEFAULT_QUERY_ROW_LIMIT, delete_connection_password() (+35 more)

### Community 5 - "sqlSchema.ts"
Cohesion: 0.15
Nodes (18): buildCompletionSource(), buildKeywordCompletion(), buildMultiTableCompletionSource(), dialectCache, filterSchemaResult(), findTableColumns(), findTableEntry(), FkIndex (+10 more)

### Community 6 - "driver-core/src/lib.rs"
Cohesion: 0.08
Nodes (34): async_trait, CheckInfo, ColumnInfo, ConnectionConfig, DbConnector, EventInfo, ForeignKeyInfo, IndexInfo (+26 more)

### Community 7 - "queryConsoles.ts"
Cohesion: 0.06
Nodes (57): active, confirmTrash(), editValue, fileMenuItems(), finishEdit(), onEditKeydown(), requestTrash(), startRename() (+49 more)

### Community 8 - "docs/ARCHITECTURE.md"
Cohesion: 0.05
Nodes (47): Node job (check, build), Rust job (fmt, clippy, test), Quality CI Workflow, Release job (multi-platform build & publish), tauri-apps/tauri-action, Release CI Workflow, app/README.md (Tauri + SvelteKit + TypeScript template note), CSS_VAR_NAMES field-to-CSS-variable mapping (+39 more)

### Community 9 - "+layout.svelte"
Cohesion: 0.05
Nodes (44): folderMenuItems(), startCreate(), pickSqlFolder(), reset(), eventMatchesShortcut(), formatShortcutEvent(), MODIFIER_KEYS, ResolvedShortcut (+36 more)

### Community 10 - "explorerTree.ts"
Cohesion: 0.19
Nodes (15): buildExplorerTree(), columnList(), expandableKeys(), ExplorerIcon, ExplorerNode, folder(), matches(), schemaNode() (+7 more)

### Community 11 - "tauri.conf.json"
Cohesion: 0.11
Nodes (17): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+9 more)

### Community 12 - "mysql/src/tls.rs"
Cohesion: 0.13
Nodes (19): apply(), connection_error(), io_error(), is_tls_failure(), read_status(), Error, ErrorKind, MySqlPool (+11 more)

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
Cohesion: 0.11
Nodes (11): neutral, active, selected, tinted, CONNECTION_COLORS, NEUTRAL_IDENTITY_COLOR, BackendKind, connectionDrivers (+3 more)

### Community 17 - "connectionProfiles.ts"
Cohesion: 0.15
Nodes (15): ConnectionDriver, PasswordPolicy, ConnectionConfig, ConnectionProfile, connectionProfiles, isDriver(), isHexColor(), isPasswordPolicy() (+7 more)

### Community 18 - "package.json"
Cohesion: 0.12
Nodes (15): description, license, name, type, version, codemirror, @codemirror/commands, @lucide/svelte (+7 more)

### Community 19 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, codemirror, @codemirror/autocomplete, @codemirror/commands, @codemirror/lang-sql, @codemirror/language, @codemirror/state, @codemirror/view (+6 more)

### Community 20 - "sqlFormatter.ts"
Cohesion: 0.23
Nodes (10): CLAUSES_WITH_INLINE_BODY, compactStructuredLayout(), compactStructuredLayoutPass(), formatSqlBlock(), indentation(), isClause(), Quote, scanFormattedSql() (+2 more)

### Community 21 - "drivers.rs"
Cohesion: 0.16
Nodes (20): connect(), ConnectedDatabase, DatabaseKind, open(), report(), Arc, ConnectionConfig, Option (+12 more)

### Community 22 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, skipLibCheck (+4 more)

### Community 23 - "connectionTest.ts"
Cohesion: 0.21
Nodes (11): describeTls(), summarizeError(), summarizeReport(), summaryText(), encrypted, TestOutcome, TestSummary, TestConnectionReport (+3 more)

### Community 24 - "vitest"
Cohesion: 0.43
Nodes (4): initials(), luminance(), readableTextColor(), vitest

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
Cohesion: 0.10
Nodes (7): onMove(), onUp(), #each(), ContextMenuItem, table(), app_src_lib_sqleditoricons, isQueryConsoleDirty()

### Community 45 - "postgres/src/tls.rs"
Cohesion: 0.15
Nodes (16): apply(), certificate_errors_are_labelled(), connection_error(), io_error(), is_tls_failure(), read_status(), Error, ErrorKind (+8 more)

### Community 46 - "ref_app"
Cohesion: 0.25
Nodes (7): applyForwardJoin(), applyReverseJoin(), buildJoinCompletionSource(), boostFor(), recordUsage(), usage, ref_app

### Community 48 - "theme.ts"
Cohesion: 0.06
Nodes (35): DEFAULT_FORMATTER_LINE_WIDTH, defaultEditorSettings(), editorSettings, loadEditorSettings(), MAX_FORMATTER_LINE_WIDTH, MIN_FORMATTER_LINE_WIDTH, normalizeLineWidth(), setFormatterLineWidth() (+27 more)

### Community 50 - "sqlSchema.test.ts"
Cohesion: 0.20
Nodes (10): applyAndRecord(), buildFkIndex(), buildSqlSchema(), extractDefaultTable(), CATALOG, complete(), ORDERS, USERS (+2 more)

### Community 51 - "types.ts"
Cohesion: 0.10
Nodes (18): PendingQueryConfirmation, CatalogColumn, ColumnCatalogInfo, DestructiveStatement, ExecuteQueryResponse, ExplorerCheck, ExplorerColumn, ExplorerEvent (+10 more)

### Community 52 - "extractFromContext"
Cohesion: 0.67
Nodes (4): currentStatement(), extractFromContext(), extractFromTables(), toRelation()

## Ambiguous Edges - Review These
- `CSS_VAR_NAMES field-to-CSS-variable mapping` → `theme.ts SHELL_PALETTE_CSS_VARS (external reference, file not read in this chunk)`  [AMBIGUOUS]
  app/src/app.html · relation: references
- `SHELL_PALETTES literal (datagrip/vscode x dark/light)` → `palettes.ts palette definitions (external reference, file not read in this chunk)`  [AMBIGUOUS]
  app/src/app.html · relation: references

## Knowledge Gaps
- **224 isolated node(s):** `name`, `version`, `description`, `license`, `type` (+219 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `CSS_VAR_NAMES field-to-CSS-variable mapping` and `theme.ts SHELL_PALETTE_CSS_VARS (external reference, file not read in this chunk)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `SHELL_PALETTES literal (datagrip/vscode x dark/light)` and `palettes.ts palette definitions (external reference, file not read in this chunk)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `DriverError` connect `DriverError` to `mysql/src/lib.rs`, `postgres/src/lib.rs`, `driver-core/src/lib.rs`, `mysql/src/tls.rs`, `postgres/src/tls.rs`, `drivers.rs`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Explorador de base de datos` connect `docs/ARCHITECTURE.md` to `connection.ts`, `connectionTest.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `svelte` connect `queryConsoles.ts` to `+layout.svelte`, `connection.ts`, `ref_app`, `theme.ts`, `connectionProfiles.ts`, `package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _224 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `execution_guard.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.06291591046581972 - nodes in this community are weakly interconnected._