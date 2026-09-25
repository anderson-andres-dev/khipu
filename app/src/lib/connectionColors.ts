// Paleta de colores de identidad de una conexion (ColorPicker.svelte). Los
// mismos 8 tonos con nombre que ofrece DataGrip para sus data sources, en
// una intensidad media que se lee bien en tema claro y oscuro; cualquier
// otro color se elige con "Personalizado".
export const CONNECTION_COLORS = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#14b8a6", label: "Verde azulado" },
  { value: "#22c55e", label: "Verde" },
  { value: "#eab308", label: "Amarillo" },
  { value: "#f97316", label: "Naranja" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#a855f7", label: "Púrpura" },
  { value: "#8b929c", label: "Gris" },
] as const;

// Color de identidad de una conexion sin color elegido (avatar, degradados):
// el mismo gris de la paleta, para que se vea sobrio en vez de inventar uno.
export const NEUTRAL_IDENTITY_COLOR = "#8b929c";

export function isPaletteColor(color: string | undefined): boolean {
  return CONNECTION_COLORS.some((option) => option.value === color);
}

export function colorLabel(color: string | undefined): string {
  if (!color) return "Sin color";
  return CONNECTION_COLORS.find((option) => option.value === color)?.label ?? "Personalizado";
}
