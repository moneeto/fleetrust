'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '../../../lib/api-client';

interface Booking {
  idBooking: number;
  code: string;
  startAt: string;
  endAt: string;
  serviceName: string;
  unitName: string;
  status: string;
}

export default function AgendaPage() {
  const t = useTranslations('bookings');
  const [items, setItems] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.get<{ items: Booking[] }>('/api/agenda').then((res) => setItems(res.items)).catch((err) => setError(err instanceof ApiError ? err.message : 'Error'));
  }, []);
  return (
    <section>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800 }}>{t('agendaTitle')}</h1>
      {error && <p role="alert">{error}</p>}
      {items.length === 0 ? <p>{t('agendaEmpty')}</p> : (
        <ul>{items.map((item) => (
          <li key={item.idBooking}>{item.code} · {new Date(item.startAt).toLocaleString()} · {item.serviceName} · {item.unitName} · {item.status}</li>
        ))}</ul>
      )}
    </section>
  );
}
