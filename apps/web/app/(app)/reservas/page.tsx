'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '../../../lib/api-client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField, SelectField } from '../../components/TextField';

interface Service { idService: number; name: string; code: string; durationMinutes: number }
interface Unit { idFleetUnit: number; name: string; deletedAt: string | null }
interface Professional { idProfessional: number; name: string; surname: string; deletedAt: string | null }
interface Reason { code: string; requiresDetail: number }
interface Booking {
  idBooking: number;
  code: string;
  startAt: string;
  serviceName: string;
  unitName: string;
  professionalName: string;
  status: string;
  participantsCount: number;
  contactName: string | null;
}

export default function BookingsPage() {
  return (
    <Suspense>
      <BookingsScreen />
    </Suspense>
  );
}

function BookingsScreen() {
  const t = useTranslations('bookings');
  const params = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [items, setItems] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(params.get('code') ?? '');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');

  function load() {
    const query = new URLSearchParams();
    if (code) query.set('code', code);
    const unit = params.get('unit');
    const professional = params.get('professional');
    if (unit) query.set('unit', unit);
    if (professional) query.set('professional', professional);
    const suffix = query.toString() ? `?${query}` : '';
    Promise.all([
      api.get<{ items: Service[] }>('/api/services'),
      api.get<{ items: Unit[] }>('/api/fleet/units'),
      api.get<{ items: Professional[] }>('/api/professionals'),
      api.get<{ items: Reason[] }>('/api/bookings/reasons'),
      api.get<{ items: Booking[] }>(`/api/bookings${suffix}`),
    ]).then(([serviceRes, unitRes, professionalRes, reasonRes, bookingRes]) => {
      setServices(serviceRes.items);
      setUnits(unitRes.items.filter((item) => !item.deletedAt));
      setProfessionals(professionalRes.items.filter((item) => !item.deletedAt));
      setReasons(reasonRes.items);
      setItems(bookingRes.items);
      if (!reason && reasonRes.items[0]) setReason(reasonRes.items[0].code);
    }).catch((err) => setError(message(err)));
  }
  useEffect(() => { load(); }, [params]);

  const selected = reasons.find((item) => item.code === reason);

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, margin: 0 }}>{t('title')}</h1>
      {error && <p role="alert">{error}</p>}
      <Card>
        <h2>{t('services')}</h2>
        <form style={{ display: 'grid', gap: 12 }} onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await api.post('/api/services', { code: form.get('code'), name: form.get('name'), durationMinutes: Number(form.get('duration')) });
          event.currentTarget.reset();
          load();
        }}>
          <TextField name="code" label={t('code')} required />
          <TextField name="name" label={t('service')} required />
          <TextField name="duration" label={t('duration')} type="number" min={1} required />
          <Button type="submit">{t('saveService')}</Button>
        </form>
      </Card>
      <Card>
        <form style={{ display: 'grid', gap: 12 }} onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          try {
            await api.post('/api/bookings', {
              idService: Number(form.get('service')),
              idFleetUnit: Number(form.get('unit')),
              idProfessional: Number(form.get('professional')),
              startLocal: form.get('start'),
              participantsCount: Number(form.get('participants')),
              contactName: String(form.get('contact') || '') || null,
              contactEmail: String(form.get('email') || '') || null,
              contactPhone: String(form.get('phone') || '') || null,
              notes: String(form.get('notes') || '') || null,
            });
            event.currentTarget.reset();
            load();
          } catch (err) {
            setError(message(err));
          }
        }}>
          <SelectField name="service" label={t('service')} required>{services.map((item) => <option key={item.idService} value={item.idService}>{item.name}</option>)}</SelectField>
          <SelectField name="unit" label={t('unit')} required>{units.map((item) => <option key={item.idFleetUnit} value={item.idFleetUnit}>{item.name}</option>)}</SelectField>
          <SelectField name="professional" label={t('professional')} required>{professionals.map((item) => <option key={item.idProfessional} value={item.idProfessional}>{item.surname}, {item.name}</option>)}</SelectField>
          <TextField name="start" label={t('start')} type="datetime-local" required />
          <TextField name="participants" label={t('participants')} type="number" min={1} defaultValue={1} required />
          <TextField name="contact" label={t('contact')} />
          <TextField name="email" label={t('email')} type="email" />
          <TextField name="phone" label={t('phone')} />
          <TextField name="notes" label={t('notes')} />
          <Button type="submit">{t('save')}</Button>
        </form>
      </Card>
      <form onSubmit={(event) => { event.preventDefault(); load(); }}>
        <TextField label={t('code')} value={code} onChange={(event) => setCode(event.target.value)} />
        <Button type="submit">{t('search')}</Button>
      </form>
      {items.length === 0 ? <p>{t('empty')}</p> : (
        <ul>{items.map((item) => (
          <li key={item.idBooking}>
            {item.code} · {new Date(item.startAt).toLocaleString()} · {item.serviceName} · {item.unitName} · {item.professionalName} · {item.status}
            {item.status !== 'CANCELLED' && (
              <form style={{ display: 'inline-flex', gap: 8 }} onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await api.post(`/api/bookings/${item.idBooking}/cancel`, { reasonCode: reason, detail: detail || null });
                  load();
                } catch (err) {
                  setError(message(err));
                }
              }}>
                <SelectField label={t('reason')} value={reason} onChange={(event) => setReason(event.target.value)}>
                  {reasons.map((itemReason) => <option key={itemReason.code} value={itemReason.code}>{itemReason.code}</option>)}
                </SelectField>
                {selected?.requiresDetail === 1 && <TextField label={t('detail')} value={detail} onChange={(event) => setDetail(event.target.value)} required />}
                <Button type="submit" variant="secondary">{t('cancel')}</Button>
              </form>
            )}
          </li>
        ))}</ul>
      )}
    </section>
  );
}

function message(err: unknown) {
  return err instanceof ApiError ? err.message : 'No se pudo completar la operación.';
}
