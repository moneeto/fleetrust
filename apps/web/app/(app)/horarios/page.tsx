'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '../../../lib/api-client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField, SelectField } from '../../components/TextField';

interface Range { weekday: number; startTime: string; endTime: string }
interface Exception { idCalendarException: number; date: string; isClosed: number; label: string | null }
interface HoursPayload {
  slotGranularityMinutes: number;
  defaultMinLeadMinutes: number | null;
  defaultMaxLeadDays: number | null;
  ranges: Array<Range & { idBusinessHour: number }>;
  exceptions: Exception[];
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function HoursPage() {
  const t = useTranslations('hours');
  const [data, setData] = useState<HoursPayload | null>(null);
  const [ranges, setRanges] = useState<Range[]>([]);
  const [granularity, setGranularity] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [closed, setClosed] = useState(true);

  function load() {
    api.get<HoursPayload>('/api/hours').then((res) => {
      setData(res);
      setRanges(res.ranges.map((range) => ({ weekday: range.weekday, startTime: String(range.startTime).slice(0, 5), endTime: String(range.endTime).slice(0, 5) })));
      setGranularity(String(res.slotGranularityMinutes));
    }).catch((err) => setError(message(err)));
  }
  useEffect(() => { load(); }, []);

  async function save(confirm: boolean) {
    if (!data) return;
    setError(null);
    setImpact(null);
    try {
      await api.put('/api/hours', {
        slotGranularityMinutes: Number(granularity),
        defaultMinLeadMinutes: data.defaultMinLeadMinutes,
        defaultMaxLeadDays: data.defaultMaxLeadDays,
        ranges,
        confirm,
      });
      load();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'hours.impactsBookings') setImpact(err.message);
      else setError(message(err));
    }
  }

  if (!data) return <p>{error ?? '…'}</p>;
  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, margin: 0 }}>{t('title')}</h1>
      {error && <p role="alert">{error}</p>}
      <Card>
        <SelectField label={t('granularity')} value={granularity} onChange={(event) => setGranularity(event.target.value)}>
          {[15, 30, 60, 120].map((value) => <option key={value} value={value}>{value}</option>)}
        </SelectField>
        <ul>
          {ranges.map((range, index) => (
            <li key={`${range.weekday}-${index}`}>{DAYS[range.weekday]} {range.startTime}–{range.endTime}</li>
          ))}
        </ul>
        <form style={{ display: 'grid', gap: 12 }} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setRanges((current) => [...current, { weekday: Number(form.get('weekday')), startTime: String(form.get('from')), endTime: String(form.get('to')) }]);
        }}>
          <SelectField name="weekday" label={t('weekday')} defaultValue="1">
            {DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
          </SelectField>
          <TextField name="from" label={t('from')} type="time" required />
          <TextField name="to" label={t('to')} type="time" required />
          <Button type="submit" variant="secondary">{t('addRange')}</Button>
        </form>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button type="button" onClick={() => void save(false)}>{t('save')}</Button>
          {impact && <Button type="button" variant="secondary" onClick={() => void save(true)}>{t('confirm')}</Button>}
        </div>
        {impact && <p role="alert">{impact}</p>}
      </Card>
      <Card>
        <h2>{t('exceptions')}</h2>
        <form style={{ display: 'grid', gap: 12 }} onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await api.post('/api/hours/exceptions', {
            date: form.get('date'),
            isClosed: closed,
            startTime: closed ? null : form.get('from'),
            endTime: closed ? null : form.get('to'),
            label: String(form.get('label') || '') || null,
          });
          load();
        }}>
          <TextField name="date" label={t('date')} type="date" required />
          <TextField name="label" label={t('label')} />
          <label><input type="checkbox" checked={closed} onChange={(event) => setClosed(event.target.checked)} /> {t('closed')}</label>
          {!closed && <TextField name="from" label={t('from')} type="time" required />}
          {!closed && <TextField name="to" label={t('to')} type="time" required />}
          <Button type="submit">{t('addException')}</Button>
        </form>
        <ul>{data.exceptions.map((item) => (
          <li key={item.idCalendarException}>
            {String(item.date).slice(0, 10)} {item.label ?? ''}
            <Button type="button" variant="secondary" onClick={async () => { await api.del(`/api/hours/exceptions/${item.idCalendarException}`); load(); }}>{t('remove')}</Button>
          </li>
        ))}</ul>
      </Card>
      <Card>
        <h2>{t('preview')}</h2>
        <form style={{ display: 'grid', gap: 12 }} onSubmit={async (event) => {
          event.preventDefault();
          const res = await api.get<{ slots: string[] }>(`/api/hours/preview?date=${previewDate}`);
          setSlots(res.slots);
        }}>
          <TextField label={t('date')} type="date" value={previewDate} onChange={(event) => setPreviewDate(event.target.value)} required />
          <Button type="submit">{t('preview')}</Button>
        </form>
        {slots && (slots.length === 0 ? <p>{t('previewEmpty')}</p> : <p>{slots.join(' · ')}</p>)}
      </Card>
    </section>
  );
}

function message(err: unknown) {
  return err instanceof ApiError ? err.message : 'No se pudo completar la operación.';
}
