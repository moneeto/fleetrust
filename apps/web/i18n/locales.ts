/** RF-701/RF-702: los tres idiomas soportados, en todo el proyecto. */
export const SUPPORTED_LOCALES = ['es-AR', 'en-US', 'pt-BR'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es-AR';

/** Cookie no sensible (legible por JS) que refleja el idioma activo. */
export const LOCALE_COOKIE = 'fleetrust_locale';

export function isSupportedLocale(value: string | undefined | null): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Antes de loguearse no hay `users.locale` todavía: se usa el navegador. */
export function pickLocaleFromAcceptLanguage(header: string | null): SupportedLocale {
  if (!header) return DEFAULT_LOCALE;
  const preferred = header
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase())
    .filter((v): v is string => !!v);

  for (const tag of preferred) {
    if (tag.startsWith('es')) return 'es-AR';
    if (tag.startsWith('pt')) return 'pt-BR';
    if (tag.startsWith('en')) return 'en-US';
  }
  return DEFAULT_LOCALE;
}
