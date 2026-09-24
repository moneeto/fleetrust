'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { TextField, SelectField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Banner } from '../../components/Banner';
import { api, type MeResponse } from '../../../lib/api-client';
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type SupportedLocale } from '../../../i18n/locales';

interface ProfileFormProps {
  user: MeResponse;
}

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations('profile');
  const isReadOnly = user.accountStatus === 'SUSPENDED' || user.modoSuplantacion;

  const [name, setName] = useState(user.name ?? '');
  const [locale, setLocale] = useState<SupportedLocale>((user.locale as SupportedLocale) ?? 'es-AR');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const localeLabels: Record<SupportedLocale, string> = {
    'es-AR': t('localeEsAR'),
    'en-US': t('localeEnUS'),
    'pt-BR': t('localePtBR'),
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);
    try {
      await api.updateMe({ name, locale });
      // RF-704: la cookie de idioma se actualiza al toque; la próxima
      // navegación ya renderiza en el idioma nuevo sin volver a loguearse.
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}`;
      setFeedback({ type: 'success', message: t('saved') });
    } catch {
      setFeedback({ type: 'error', message: t('errorGeneric') });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
      {user.accountStatus === 'SUSPENDED' && <Banner variant="warning">{t('readOnlyNotice')}</Banner>}
      {feedback && <Banner variant={feedback.type}>{feedback.message}</Banner>}

      <TextField label={t('emailLabel')} value={user.email} disabled />

      <TextField
        label={t('nameLabel')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isReadOnly || isSaving}
        maxLength={150}
      />

      <SelectField
        label={t('localeLabel')}
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        disabled={isReadOnly || isSaving}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </SelectField>

      <div>
        <Button type="submit" isLoading={isSaving} disabled={isReadOnly}>
          {isSaving ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
