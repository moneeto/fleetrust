'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { api } from '../../lib/api-client';
import styles from '../login/page.module.css';

export default function VerifyPage() {
  return <Suspense><VerifyForm /></Suspense>;
}

function VerifyForm() {
  const t = useTranslations('access');
  const token = useSearchParams().get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={async (event) => {
        event.preventDefault();
        try {
          await api.verifyEmail(token);
          setDone(true);
        } catch {
          setError(t('invalid'));
        }
      }}>
        <h1>{t('verifyTitle')}</h1>
        {done && <Banner variant="success">{t('done')}</Banner>}
        {error && <Banner variant="error">{error}</Banner>}
        <Button type="submit">{t('submit')}</Button>
      </form>
    </main>
  );
}
