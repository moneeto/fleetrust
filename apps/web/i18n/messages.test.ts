import { describe, expect, it } from 'vitest';
import esAR from '../messages/es-AR.json';
import enUS from '../messages/en-US.json';
import ptBR from '../messages/pt-BR.json';
import { SUPPORTED_LOCALES } from './locales.js';

/**
 * RF-703/RF-709: "verificación de completitud que bloquea la integración".
 * Las tres traducciones tienen que declarar exactamente las mismas claves.
 * Una clave faltante en cualquiera de los tres idiomas rompe el build antes
 * de llegar a producción.
 */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('Completitud de i18n (RF-703/RF-709)', () => {
  it('los tres idiomas soportados tienen un archivo de mensajes', () => {
    expect(SUPPORTED_LOCALES).toEqual(['es-AR', 'en-US', 'pt-BR']);
  });

  it('es-AR, en-US y pt-BR declaran exactamente las mismas claves', () => {
    const esKeys = flattenKeys(esAR).sort();
    const enKeys = flattenKeys(enUS).sort();
    const ptKeys = flattenKeys(ptBR).sort();

    expect(enKeys, 'en-US tiene claves distintas de es-AR').toEqual(esKeys);
    expect(ptKeys, 'pt-BR tiene claves distintas de es-AR').toEqual(esKeys);
  });

  it('ningún valor de traducción está vacío', () => {
    for (const [locale, messages] of [
      ['es-AR', esAR],
      ['en-US', enUS],
      ['pt-BR', ptBR],
    ] as const) {
      const emptyKeys = flattenKeys(messages).filter((key) => {
        const value = key.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], messages);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(emptyKeys, `${locale} tiene valores vacíos en: ${emptyKeys.join(', ')}`).toEqual([]);
    }
  });
});
