'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Banner } from '../components/Banner';
import { api } from '../../lib/api-client';
import styles from '../login/page.module.css';

export default function ImpersonationPage() {
  return <Suspense><ImpersonationForm /></Suspense>;
}

function ImpersonationForm() {
  const t = useTranslations('access');
  const codigo = useSearchParams().get('codigo') ?? '';
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codigo) {
      setError(t('impersonationError'));
      return;
    }
    api.impersonate(codigo).then(() => {
      router.replace('/profile');
      router.refresh();
    }).catch(() => setError(t('impersonationError')));
  }, [codigo, router, t]);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {error ? <Banner variant="error">{error}</Banner> : <p>{t('opening')}</p>}
      </div>
    </main>
  );
}
