'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '../../../lib/api-client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField, SelectField } from '../../components/TextField';

interface TypeRow { idFleetType: number; code: string; name: string; isActive: number }
interface AttributeRow {
  idFleetAttribute: number;
  idFleetType: number | null;
  code: string;
  label: string;
  dataType: string;
  options: string[] | null;
  isRequired: boolean;
  unit: string | null;
  showInList: boolean;
}
interface UnitRow {
  idFleetUnit: number;
  idFleetType: number | null;
  code: string;
  name: string;
  capacity: number;
  externalCode: string | null;
  isActive: number;
  metadata: Record<string, unknown> | null;
  deletedAt: string | null;
}

export default function FleetPage() {
  const t = useTranslations('fleet');
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typeId, setTypeId] = useState('');
  const [dataType, setDataType] = useState('TEXT');
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [unitType, setUnitType] = useState('');

  function load() {
    Promise.all([
      api.get<{ items: TypeRow[] }>('/api/fleet/types'),
      api.get<{ items: AttributeRow[] }>('/api/fleet/attributes'),
      api.get<{ items: UnitRow[] }>('/api/fleet/units'),
    ]).then(([typeRes, attributeRes, unitRes]) => {
      setTypes(typeRes.items);
      setAttributes(attributeRes.items);
      setUnits(unitRes.items);
    }).catch((err) => setError(message(err)));
  }
  useEffect(() => { load(); }, []);

  const applicable = attributes.filter((item) => item.idFleetType === null || String(item.idFleetType) === unitType);

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h1 style={title}>{t('title')}</h1>
      {error && <p role="alert">{error}</p>}
      <Card>
        <h2>{t('types')}</h2>
        <form onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const ok = await run(setError, () => api.post('/api/fleet/types', { code: form.get('code'), name: form.get('name') }));
          if (!ok) return;
          event.currentTarget.reset();
          load();
        }} style={row}>
          <TextField name="code" label={t('code')} required />
          <TextField name="name" label={t('name')} required />
          <Button type="submit">{t('add')}</Button>
        </form>
        <ul>{types.map((item) => <li key={item.idFleetType}>{item.name} ({item.code})</li>)}</ul>
      </Card>
      <Card>
        <h2>{t('attributes')}</h2>
        <form onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const options = String(form.get('options') || '').split(',').map((item) => item.trim()).filter(Boolean);
          const ok = await run(setError, () => api.post('/api/fleet/attributes', {
            idFleetType: typeId ? Number(typeId) : null,
            code: form.get('code'),
            label: form.get('label'),
            dataType,
            options: dataType === 'SELECT' ? options : null,
            isRequired: form.get('required') === 'on',
            unit: String(form.get('unit') || '') || null,
            showInList: form.get('showInList') === 'on',
          }));
          if (!ok) return;
          event.currentTarget.reset();
          load();
        }} style={row}>
          <TextField name="code" label={t('code')} required pattern="[a-z][a-z0-9]{1,48}" />
          <TextField name="label" label={t('label')} required />
          <SelectField label={t('type')} value={typeId} onChange={(event) => setTypeId(event.target.value)}>
            <option value="">{t('allTypes')}</option>
            {types.map((item) => <option key={item.idFleetType} value={item.idFleetType}>{item.name}</option>)}
          </SelectField>
          <SelectField label={t('dataType')} value={dataType} onChange={(event) => setDataType(event.target.value)}>
            {['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT'].map((value) => <option key={value} value={value}>{value}</option>)}
          </SelectField>
          {dataType === 'SELECT' && <TextField name="options" label={t('options')} />}
          <TextField name="unit" label={t('unit')} />
          <label><input type="checkbox" name="required" /> {t('required')}</label>
          <label><input type="checkbox" name="showInList" /> {t('showInList')}</label>
          <Button type="submit">{t('add')}</Button>
        </form>
        <ul>{attributes.map((item) => (
          <li key={item.idFleetAttribute}>
            {item.label} ({item.code}) {item.isRequired ? '*' : ''}
            <Button type="button" variant="secondary" onClick={async () => { await run(setError, () => api.del(`/api/fleet/attributes/${item.idFleetAttribute}`)); load(); }}>{t('deactivate')}</Button>
          </li>
        ))}</ul>
      </Card>
      <Card>
        <h2>{t('units')}</h2>
        <form onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const body: Record<string, unknown> = {};
          for (const attribute of applicable) {
            const raw = metadata[attribute.code] ?? '';
            if (raw === '') continue;
            body[attribute.code] = attribute.dataType === 'NUMBER' ? Number(raw) : attribute.dataType === 'BOOLEAN' ? raw === 'true' : raw;
          }
          const ok = await run(setError, () => api.post('/api/fleet/units', {
            idFleetType: unitType ? Number(unitType) : null,
            code: form.get('code'),
            name: form.get('name'),
            capacity: Number(form.get('capacity')),
            externalCode: String(form.get('externalCode') || '') || null,
            imageUrl: null,
            isActive: true,
            metadata: body,
          }));
          if (!ok) return;
          setMetadata({});
          event.currentTarget.reset();
          load();
        }} style={row}>
          <TextField name="code" label={t('code')} required />
          <TextField name="name" label={t('name')} required />
          <TextField name="capacity" label={t('capacity')} type="number" min={1} required />
          <TextField name="externalCode" label={t('externalCode')} />
          <SelectField label={t('type')} value={unitType} onChange={(event) => setUnitType(event.target.value)}>
            <option value="">{t('allTypes')}</option>
            {types.map((item) => <option key={item.idFleetType} value={item.idFleetType}>{item.name}</option>)}
          </SelectField>
          {applicable.map((attribute) => attribute.dataType === 'BOOLEAN' ? (
            <SelectField key={attribute.code} label={attribute.label} value={metadata[attribute.code] ?? ''} onChange={(event) => setMetadata((current) => ({ ...current, [attribute.code]: event.target.value }))}>
              <option value="">{attribute.isRequired ? '' : '—'}</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </SelectField>
          ) : attribute.dataType === 'SELECT' ? (
            <SelectField key={attribute.code} label={attribute.label} value={metadata[attribute.code] ?? ''} onChange={(event) => setMetadata((current) => ({ ...current, [attribute.code]: event.target.value }))}>
              <option value="">—</option>
              {(attribute.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectField>
          ) : (
            <TextField key={attribute.code} label={`${attribute.label}${attribute.unit ? ` (${attribute.unit})` : ''}`} type={attribute.dataType === 'NUMBER' ? 'number' : attribute.dataType === 'DATE' ? 'date' : 'text'} value={metadata[attribute.code] ?? ''} required={attribute.isRequired} onChange={(event) => setMetadata((current) => ({ ...current, [attribute.code]: event.target.value }))} />
          ))}
          <Button type="submit">{t('save')}</Button>
        </form>
        {units.length === 0 ? <p>{t('empty')}</p> : (
          <ul>{units.map((item) => (
            <li key={item.idFleetUnit}>
              {item.name} · {item.code} · {item.capacity}
              {item.deletedAt
                ? <Button type="button" variant="secondary" onClick={async () => { await run(setError, () => api.post(`/api/fleet/units/${item.idFleetUnit}/restore`, {})); load(); }}>{t('restore')}</Button>
                : <Button type="button" variant="secondary" onClick={async () => { await run(setError, () => api.post(`/api/fleet/units/${item.idFleetUnit}/deactivate`, {})); load(); }}>{t('deactivate')}</Button>}
            </li>
          ))}</ul>
        )}
      </Card>
    </section>
  );
}

const title = { fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, margin: 0 } as const;
const row = { display: 'grid', gap: 12, alignItems: 'end' } as const;

async function run(setError: (value: string | null) => void, action: () => Promise<unknown>) {
  setError(null);
  try {
    await action();
    return true;
  } catch (err) {
    setError(message(err));
    return false;
  }
}

function message(err: unknown) {
  return err instanceof ApiError ? err.message : 'No se pudo completar la operación.';
}
