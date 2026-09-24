'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Compass } from 'lucide-react';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { ApiError, api } from '../../lib/api-client';
import styles from './page.module.css';

export default function LoginPage() {
  const t = useTranslations('login');
  const tApp = useTranslations('app');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await api.login(email, password);
      router.push('/profile');
      router.refresh();
    } catch (err) {
      // CA-201.1: un solo mensaje genérico, nunca se distingue el motivo.
      if (err instanceof ApiError && err.status === 401) {
        setErrorMessage(t('errorInvalidCredentials'));
      } else {
        setErrorMessage(t('errorGeneric'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Compass size={18} strokeWidth={2.5} />
          </span>
          <div>
            <h1 className={styles.title}>{tApp('name')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
        </div>

        <Card>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <h2 className="sr-only">{t('title')}</h2>

            {errorMessage && <Banner variant="error">{errorMessage}</Banner>}

            <TextField
              label={t('emailLabel')}
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <TextField
              label={t('passwordLabel')}
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />

            <Button type="submit" isLoading={isSubmitting} fullWidth>
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
