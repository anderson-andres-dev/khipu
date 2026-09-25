import { translate, type MessageKey, type Translate } from "$lib/i18n";

// Paleta de colores de identidad de una conexion (ColorPicker.svelte). Los
// mismos 8 tonos con nombre que ofrece DataGrip para sus data sources, en
// una intensidad media que se lee bien en tema claro y oscuro; cualquier
// otro color se elige con "Personalizado". Cada tono guarda la clave de su
// nombre, que se traduce al pintarlo.
export const CONNECTION_COLORS: readonly { value: string; labelKey: MessageKey }[] = [
  { value: "#3b82f6", labelKey: "connections.color.blue" },
  { value: "#14b8a6", labelKey: "connections.color.teal" },
  { value: "#22c55e", labelKey: "connections.color.green" },
  { value: "#eab308", labelKey: "connections.color.yellow" },
  { value: "#f97316", labelKey: "connections.color.orange" },
  { value: "#ef4444", labelKey: "connections.color.red" },
  { value: "#a855f7", labelKey: "connections.color.purple" },
  { value: "#8b929c", labelKey: "connections.color.gray" },
];

// Color de identidad de una conexion sin color elegido (avatar, degradados):
// el mismo gris de la paleta, para que se vea sobrio en vez de inventar uno.
export const NEUTRAL_IDENTITY_COLOR = "#8b929c";

export function isPaletteColor(color: string | undefined): boolean {
  return CONNECTION_COLORS.some((option) => option.value === color);
}

// Los componentes pasan `$t` para que el nombre cambie con el idioma.
export function colorLabel(color: string | undefined, t: Translate = translate): string {
  if (!color) return t("connections.color.none");
  const option = CONNECTION_COLORS.find((candidate) => candidate.value === color);
  return option ? t(option.labelKey) : t("connections.color.custom");
}
