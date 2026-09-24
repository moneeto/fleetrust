'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '../../../lib/api-client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';

interface Professional {
  idProfessional: number;
  name: string;
  surname: string;
  phone: string | null;
  email: string | null;
  isActive: number;
  deletedAt: string | null;
}

export default function ProfessionalsPage() {
  const t = useTranslations('professionals');
  const [items, setItems] = useState<Professional[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createUser, setCreateUser] = useState(true);

  function load() {
    api.get<{ items: Professional[] }>('/api/professionals').then((res) => setItems(res.items)).catch((err) => setError(message(err)));
  }
  useEffect(() => { load(); }, []);

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, margin: 0 }}>{t('title')}</h1>
      {error && <p role="alert">{error}</p>}
      <Card>
        <p>{t('emailHint')}</p>
        <form style={{ display: 'grid', gap: 12 }} onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          try {
            await api.post('/api/professionals', {
              name: form.get('name'),
              surname: form.get('surname'),
              phone: String(form.get('phone') || '') || null,
              createUser,
              email: createUser ? form.get('email') : null,
            });
            event.currentTarget.reset();
            load();
          } catch (err) {
            setError(message(err));
          }
        }}>
          <TextField name="name" label={t('name')} required />
          <TextField name="surname" label={t('surname')} required />
          <TextField name="phone" label={t('phone')} />
          <label><input type="checkbox" checked={createUser} onChange={(event) => setCreateUser(event.target.checked)} /> {t('createUser')}</label>
          {createUser && <TextField name="email" label={t('email')} type="email" required />}
          <Button type="submit">{t('save')}</Button>
        </form>
      </Card>
      {items.length === 0 ? <p>{t('empty')}</p> : (
        <ul>{items.map((item) => (
          <li key={item.idProfessional}>
            {item.surname}, {item.name} {item.email ? `· ${item.email}` : ''}
            {item.deletedAt
              ? <Button type="button" variant="secondary" onClick={async () => { await api.post(`/api/professionals/${item.idProfessional}/restore`, {}); load(); }}>{t('restore')}</Button>
              : <Button type="button" variant="secondary" onClick={async () => {
                try { await api.post(`/api/professionals/${item.idProfessional}/deactivate`, {}); load(); }
                catch (err) { setError(message(err)); }
              }}>{t('deactivate')}</Button>}
          </li>
        ))}</ul>
      )}
    </section>
  );
}

function message(err: unknown) {
  return err instanceof ApiError ? err.message : 'No se pudo completar la operación.';
}
