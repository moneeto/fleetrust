import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { isSupportedLocale, LOCALE_COOKIE, pickLocaleFromAcceptLanguage } from './locales';

/**
 * Sin rutas por locale (RF-102: una sola URL, sin subdominio ni segmento
 * `[locale]`). El idioma real es `users.locale` (RF-704), que el front
 * refleja en la cookie `fleetrust_locale` no sensible después de loguearse
 * y de cada cambio de preferencia. Antes de eso —pantalla de login—, se
 * usa el idioma del navegador.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  const locale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : pickLocaleFromAcceptLanguage((await headers()).get('accept-language'));

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
