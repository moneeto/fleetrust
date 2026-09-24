import { getTranslations } from 'next-intl/server';
import type { MeResponse } from '../../../lib/api-client';
import { fetchFromApiServer } from '../../../lib/server-api';
import { Card } from '../../components/Card';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const t = await getTranslations('profile');
  const res = await fetchFromApiServer('/api/me');
  const user = (await res.json()) as MeResponse;

  return (
    <section style={{ maxWidth: 480 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, marginBottom: 20 }}>
        {t('title')}
      </h1>
      <Card>
        <ProfileForm user={user} />
      </Card>
    </section>
  );
}
