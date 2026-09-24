export type FleetDataType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';

export interface FleetAttributeDef {
  code: string;
  label: string;
  dataType: FleetDataType;
  options: string[] | null;
  isRequired: boolean;
  idFleetType: number | null;
}

export type MetadataResult =
  | { ok: true; value: Record<string, string | number | boolean | null> }
  | { ok: false; message: string };

export function applicableAttributes(defs: FleetAttributeDef[], idFleetType: number | null): FleetAttributeDef[] {
  return defs.filter((def) => def.idFleetType === null || def.idFleetType === idFleetType);
}

export function validateMetadata(
  defs: FleetAttributeDef[],
  idFleetType: number | null,
  raw: unknown,
): MetadataResult {
  if (raw === undefined || raw === null) raw = {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, message: 'Los atributos de la unidad tienen que ser un objeto.' };
  }
  const input = raw as Record<string, unknown>;
  const applicable = applicableAttributes(defs, idFleetType);
  const byCode = new Map(applicable.map((def) => [def.code, def]));
  const value: Record<string, string | number | boolean | null> = {};

  for (const key of Object.keys(input)) {
    if (!byCode.has(key)) {
      return { ok: false, message: `«${key}» no está definido para este tipo de flota.` };
    }
  }

  for (const def of applicable) {
    const present = Object.prototype.hasOwnProperty.call(input, def.code);
    const current = present ? input[def.code] : null;
    const empty = current === null || current === undefined || current === '';
    if (empty) {
      if (def.isRequired) return { ok: false, message: `«${def.label}» es obligatorio.` };
      continue;
    }
    const checked = checkValue(def, current);
    if (!checked.ok) return checked;
    value[def.code] = checked.value;
  }

  return { ok: true, value };
}

function checkValue(
  def: FleetAttributeDef,
  current: unknown,
): { ok: true; value: string | number | boolean } | { ok: false; message: string } {
  if (def.dataType === 'TEXT') {
    if (typeof current !== 'string') return { ok: false, message: `«${def.label}» tiene que ser texto.` };
    return { ok: true, value: current };
  }
  if (def.dataType === 'NUMBER') {
    if (typeof current !== 'number' || !Number.isFinite(current)) {
      return { ok: false, message: `«${def.label}» tiene que ser un número.` };
    }
    return { ok: true, value: current };
  }
  if (def.dataType === 'BOOLEAN') {
    if (typeof current !== 'boolean') return { ok: false, message: `«${def.label}» tiene que ser sí o no.` };
    return { ok: true, value: current };
  }
  if (def.dataType === 'DATE') {
    if (typeof current !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(current)) {
      return { ok: false, message: `«${def.label}» tiene que ser una fecha (aaaa-mm-dd).` };
    }
    return { ok: true, value: current };
  }
  const options = def.options ?? [];
  if (typeof current !== 'string' || !options.includes(current)) {
    const expected = options.length > 0 ? options.join(', ') : 'una opción definida';
    return { ok: false, message: `«${def.label}» no admite «${String(current)}». Valores esperados: ${expected}.` };
  }
  return { ok: true, value: current };
}
