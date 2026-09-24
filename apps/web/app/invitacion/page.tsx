'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Banner } from '../components/Banner';
import { ApiError, api } from '../../lib/api-client';
import styles from '../login/page.module.css';

export default function InvitationPage() {
  return (
    <Suspense>
      <InvitationForm />
    </Suspense>
  );
}

function InvitationForm() {
  const t = useTranslations('access');
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={async (event) => {
        event.preventDefault();
        try {
          await api.acceptInvitation(token, password);
          setDone(true);
        } catch (err) {
          setError(err instanceof ApiError ? t('invalid') : t('invalid'));
        }
      }}>
        <h1>{t('inviteTitle')}</h1>
        <TextField label={t('passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        {done && <Banner variant="success">{t('done')}</Banner>}
        {error && <Banner variant="error">{error}</Banner>}
        <Button type="submit">{t('submit')}</Button>
      </form>
    </main>
  );
}
