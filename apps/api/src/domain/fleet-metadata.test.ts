import { describe, expect, it } from 'vitest';
import { validateMetadata, type FleetAttributeDef } from './fleet-metadata.js';

const defs: FleetAttributeDef[] = [
  { code: 'horasDeVuelo', label: 'Horas de vuelo', dataType: 'NUMBER', options: null, isRequired: true, idFleetType: 1 },
  { code: 'habilitacion', label: 'Habilitación', dataType: 'SELECT', options: ['VFR', 'IFR'], isRequired: false, idFleetType: 1 },
  { code: 'notas', label: 'Notas', dataType: 'TEXT', options: null, isRequired: false, idFleetType: null },
];

describe('validateMetadata', () => {
  it('rechaza una clave que no está definida para el tipo', () => {
    const result = validateMetadata(defs, 1, { notas: 'ok', eslora: 12 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('eslora');
  });

  it('exige el atributo obligatorio', () => {
    const result = validateMetadata(defs, 1, { notas: 'ok' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Horas de vuelo');
  });

  it('rechaza texto en un número y un valor fuera de las opciones', () => {
    const number = validateMetadata(defs, 1, { horasDeVuelo: '1240' });
    expect(number.ok).toBe(false);
    const select = validateMetadata(defs, 1, { horasDeVuelo: 10, habilitacion: 'NIGHT' });
    expect(select.ok).toBe(false);
    if (!select.ok) expect(select.message).toContain('VFR');
  });

  it('no arrastra atributos de otro tipo y persiste solo claves conocidas', () => {
    const result = validateMetadata(defs, 2, { notas: 'bote', horasDeVuelo: 3 });
    expect(result.ok).toBe(false);
    const ok = validateMetadata(defs, 2, { notas: 'bote' });
    expect(ok).toEqual({ ok: true, value: { notas: 'bote' } });
  });
});
