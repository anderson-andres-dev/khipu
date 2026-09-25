#!/usr/bin/env python3
"""Agrega el paquete de Arch a latest.json del release.

tauri-action genera latest.json con las entradas de AppImage, .deb, .rpm,
Windows y macOS. Rowly DB también instala actualizaciones con pacman, así que
el workflow suma la entrada `linux-<arch>-pacman` con la firma del paquete.

Uso: add-to-manifest.py latest.json paquete.pkg.tar.zst paquete.sig URL
"""

import json
import sys


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__, file=sys.stderr)
        return 2
    manifest_path, _package, signature_path, url = sys.argv[1:]
    with open(manifest_path, encoding="utf-8") as file:
        manifest = json.load(file)
    with open(signature_path, encoding="utf-8") as file:
        signature = file.read().strip()
    manifest.setdefault("platforms", {})["linux-x86_64-pacman"] = {"signature": signature, "url": url}
    with open(manifest_path, "w", encoding="utf-8") as file:
        json.dump(manifest, file, indent=2)
        file.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
