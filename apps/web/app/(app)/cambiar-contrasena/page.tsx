'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Banner } from '../../components/Banner';
import { api } from '../../../lib/api-client';

export default function ChangePasswordPage() {
  const t = useTranslations('access');
  const router = useRouter();
  const [currentPassword, setCurrent] = useState('');
  const [nextPassword, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <form onSubmit={async (event) => {
      event.preventDefault();
      try {
        await api.changePassword(currentPassword, nextPassword);
        router.push('/profile');
        router.refresh();
      } catch {
        setError(t('invalid'));
      }
    }} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <h1>{t('changeTitle')}</h1>
      <TextField label={t('currentPassword')} type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
      <TextField label={t('nextPassword')} type="password" value={nextPassword} onChange={(e) => setNext(e.target.value)} minLength={8} required />
      {error && <Banner variant="error">{error}</Banner>}
      <Button type="submit">{t('submit')}</Button>
    </form>
  );
}
