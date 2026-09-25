<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/rowly-logo-dark.svg">
  <img alt="Rowly DB" src="docs/assets/brand/rowly-logo.svg" width="300">
</picture>

**Cliente SQL libre y de código abierto**

Connect. Query. Explore.

Un cliente de escritorio liviano para PostgreSQL, MySQL y MariaDB.

**100 % gratis · Código abierto · Sin versión Pro**

[Descargar](https://github.com/anderson-andres-dev/rowly-db/releases) · [English](README.md)

</div>

<p align="center">
  <img alt="Rowly DB en sus variantes clara y oscura" src="docs/assets/rowly-db.webp">
</p>

## Qué es

Un cliente SQL de escritorio: te conectas a una base de datos, exploras su
esquema, escribes consultas con autocompletado y trabajas los resultados en un
grid rápido y editable. Funciona en local, guarda las contraseñas en el almacén
seguro del sistema y no tiene versión de pago.

## Instalar

Descarga el paquete de tu sistema desde
[Releases](https://github.com/anderson-andres-dev/rowly-db/releases).

| Sistema | Comando |
|---|---|
| Debian, Ubuntu | `sudo apt install ./Rowly*.deb` |
| Fedora | `sudo dnf install ./Rowly*.rpm` |
| Arch Linux | `sudo pacman -U rowly-db_*.pkg.tar.zst` |
| Otro Linux | `chmod +x Rowly*.AppImage && ./Rowly*.AppImage` |
| Windows, macOS | Ejecuta el `.msi`/`.exe` o abre el `.dmg` |

**Actualizaciones.** Ajustes → Actualizaciones muestra todas las versiones
publicadas. Instala la que quieras, más nueva o más vieja; nada se instala sin
preguntarte.

## Compilar desde el código

Requisitos: Rust 1.85+, Node.js 20+ y, en Linux, las
[dependencias de Tauri](https://tauri.app/start/prerequisites/)
(WebKitGTK 4.1, GTK 3, librsvg).

```bash
git clone https://github.com/anderson-andres-dev/rowly-db.git
cd rowly-db/app
npm install
npm run tauri build
```

Los instaladores quedan en `target/release/bundle/`.

## Desarrollo

```bash
cd app
npm install
npm run tauri dev      # la app con recarga en caliente
npm run check          # tipos
npm test               # tests de la interfaz
cargo test --workspace # motor y drivers
```

La arquitectura, los tests con bases de datos reales y cómo se publica una
versión están en [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

[MIT](LICENSE-MIT) o [Apache-2.0](LICENSE-APACHE), a tu elección.
