<div align="center">

# Rowly DB

**Cliente SQL libre y de código abierto**

Connect. Query. Explore.

Un cliente de escritorio liviano para consultar, explorar y entender bases de datos.

**100 % gratis · Código abierto · Sin versión Pro**

[Descargar](https://github.com/anderson-andres-dev/rowly-db/releases) · [Documentación](docs/ARCHITECTURE.md) · [Contribuir](CONTRIBUTING.md) · [English](README.md)

</div>

<p align="center">
  <img alt="Rowly DB en sus variantes clara y oscura: editor SQL, explorador de la base de datos, archivos SQL y grid de resultados" src="docs/assets/rowly-db.webp">
</p>

## Por qué Rowly DB

- **Gratis de verdad.** Sin suscripciones, sin versión Pro, sin funciones
  bloqueadas. Todo lo que se describe aquí es lo que obtienes.
- **Local y privado.** Rowly DB habla directo con tu base de datos. Las
  contraseñas se guardan en el almacén seguro de tu sistema operativo, nunca
  en archivos planos.
- **Liviano.** Una app de escritorio nativa hecha con Tauri y Rust; el
  instalador para Linux pesa unos 6 MB.

## Funcionalidades

**Conectar** · PostgreSQL 10+, MySQL 5.7+ y MariaDB 10.3+. Perfiles de
conexión con grupos y colores, modo SSL por conexión con el estado TLS
negociado a la vista, y una conexión por ventana.

**Consultar** · Un editor SQL con autocompletado según el esquema, buscar y
reemplazar, y archivos `.sql`. Las sentencias destructivas (`DELETE` sin
`WHERE`, `TRUNCATE`, `DROP`…) piden confirmación antes de ejecutarse.

**Explorar** · Un explorador con tablas, vistas, rutinas, secuencias, claves,
índices y triggers. Un grid de resultados rápido con paginación en el
servidor, orden, búsqueda, edición en línea aplicada en una sola
transacción, copiado como TSV/CSV/JSON/Markdown/SQL y exportación sin límite
de filas.

**A tu manera** · Ocho temas: Rowly, DataGrip, VS Code, Gruvbox y Solarized
en claro y oscuro, además de One Dark, Dracula y Nord. Disponible en español,
inglés, portugués, francés y alemán.

## Instalar

Rowly DB todavía no tiene una versión publicada. Hasta la primera, puedes
compilarlo desde el código fuente:

```bash
cd app
npm install
npm run tauri build
```

Los instaladores quedan en `target/release/bundle/`: `.deb`, `.rpm` y
AppImage en Linux, `.dmg` en macOS, `.msi`/`.exe` en Windows.

## Desarrollo

Necesitas Rust 1.85+ y Node.js 20+. En Linux, también las
[dependencias de sistema de Tauri](https://tauri.app/start/prerequisites/)
(WebKitGTK 4.1, GTK 3, librsvg).

```bash
cargo test --workspace          # motor y drivers
cd app && npm install
npm run check && npm test       # tipos y tests de la interfaz
npm run tauri dev               # ejecutar la app
```

Los tests que necesitan una base de datos real están marcados `#[ignore]`;
[CONTRIBUTING.md](CONTRIBUTING.md) explica cómo correrlos.

## Contribuir

Rowly DB se construye en abierto y hay espacio para ayudar en todos los
niveles:

- **Reporta** un error o propone una idea en los
  [issues](https://github.com/anderson-andres-dev/rowly-db/issues).
- **Traduce** la interfaz a un idioma nuevo: cada área es un archivo en
  `app/src/lib/i18n/messages/`.
- **Agrega una base de datos**: un driver implementa un solo trait,
  `DbConnector`.
- **Mejora el código**: lee [CONTRIBUTING.md](CONTRIBUTING.md) y abre un
  pull request.

## Arquitectura

El motor SQL (análisis, protección de ejecución, paginación, edición) y los
drivers viven en `crates/`, independientes de la interfaz. La app de
escritorio está en `app/src-tauri/` y la interfaz Svelte en `app/src/`. Más
detalles en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Hecho con [Tauri 2](https://tauri.app/), Rust, Svelte 5,
[CodeMirror 6](https://codemirror.net/),
[sqlparser](https://github.com/apache/datafusion-sqlparser-rs) y
[SQLx](https://github.com/launchbadge/sqlx).

**Rowly DB y Khipu.** Rowly DB es el producto. Khipu es el nombre de su motor
interno, por eso los crates se llaman `khipu-*`.

## Licencia

Rowly DB tiene doble licencia, [MIT](LICENSE-MIT) o
[Apache-2.0](LICENSE-APACHE), a tu elección.
