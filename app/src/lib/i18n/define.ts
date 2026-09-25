import type { Locale } from "./locales";

type OtherLocale = Exclude<Locale, "es">;

/**
 * Textos de un área de la interfaz en todos los idiomas. Las claves salen del
 * español; TypeScript exige que cada idioma tenga exactamente esas claves.
 * Los parámetros se escriben `{nombre}` y se reemplazan con `t(clave, { nombre })`.
 */
export function defineMessages<const K extends string>(
  messages: { es: Record<K, string> } & { [L in OtherLocale]: Record<K, string> },
): Record<Locale, Record<K, string>> {
  return messages;
}
