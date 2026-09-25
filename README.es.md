<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/rowly-logo-dark.svg">
  <img src="docs/assets/brand/rowly-logo.svg" alt="Rowly DB" width="400">
</picture>

<br>

<p>
  <a href="https://github.com/anderson-andres-dev/rowly-db/releases"><strong>Descargar Rowly DB</strong></a>
  &nbsp;·&nbsp;
  <a href="#instalación">Instalación</a>
  &nbsp;·&nbsp;
  <a href="README.md">English</a>
</p>

<p>
  <a href="https://github.com/anderson-andres-dev/rowly-db/stargazers"><img alt="Estrellas" src="https://img.shields.io/github/stars/anderson-andres-dev/rowly-db?style=for-the-badge&amp;label=STARS&amp;labelColor=283640&amp;color=00AFAF"></a>
  <a href="https://github.com/anderson-andres-dev/rowly-db/issues"><img alt="Incidencias abiertas" src="https://img.shields.io/github/issues/anderson-andres-dev/rowly-db?style=for-the-badge&amp;label=ISSUES&amp;labelColor=283640&amp;color=00AFAF"></a>
  <a href="https://github.com/anderson-andres-dev/rowly-db/pulls"><img alt="Solicitudes de cambio abiertas" src="https://img.shields.io/github/issues-pr/anderson-andres-dev/rowly-db?style=for-the-badge&amp;label=PULL%20REQUESTS&amp;labelColor=283640&amp;color=00AFAF"></a>
  <a href="docs/assets/rowly-db.webp"><img alt="Ver captura" src="https://img.shields.io/badge/SHOWCASE-SCREENSHOT-283640?style=for-the-badge&amp;labelColor=283640"></a>
</p>

</div>

<br>

<p align="center">
  <img src="docs/assets/rowly-db.webp" alt="Interfaz de Rowly DB con temas claro y oscuro" width="900">
</p>

## Funciones

Explorador de esquemas · Autocompletado SQL · Resultados editables · Almacén seguro del sistema · Actualizaciones confirmadas

## Instalación

Descarga tu paquete desde [Releases](https://github.com/anderson-andres-dev/rowly-db/releases).
Ejecuta el comando en la carpeta de descargas. Los paquetes Linux son para **x86_64**.

| Linux | Instalar |
| :--- | :--- |
| Basadas en Debian `.deb` | `sudo apt install ./Rowly*.deb` |
| Basadas en Fedora `.rpm` | `sudo dnf install ./Rowly*.rpm` |
| Basadas en Arch `.pkg.tar.zst` | `sudo pacman -U ./rowly-db_*.pkg.tar.zst` |
| AppImage | `chmod +x ./Rowly*.AppImage`<br>`./Rowly*.AppImage` |

En **Windows**, ejecuta el `.msi` o `.exe`. En **macOS**, abre el `.dmg` para tu
procesador y arrastra Rowly DB a Aplicaciones.

Las nuevas versiones aparecen en **Ajustes → Actualizaciones**.

## Compilar desde el código

Necesitas Rust 1.85+, Node.js 20.19+ y las [dependencias de Tauri](https://tauri.app/start/prerequisites/).

```bash
git clone https://github.com/anderson-andres-dev/rowly-db.git
cd rowly-db/app
npm ci
npm run tauri build
```

Los paquetes quedan en `target/release/bundle/`.

## Contribuir

[Guía de desarrollo](CONTRIBUTING.md) · [Reportar un problema](https://github.com/anderson-andres-dev/rowly-db/issues)

## Licencia

Licencia dual. Elige [MIT](LICENSE-MIT) o [Apache 2.0](LICENSE-APACHE).
