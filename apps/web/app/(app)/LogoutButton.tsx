'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../../lib/api-client';

export function LogoutButton() {
  const t = useTranslations('shell');
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await api.logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <Button variant="secondary" fullWidth isLoading={isLoggingOut} onClick={handleLogout}>
      <LogOut size={14} aria-hidden="true" />
      {t('logout')}
    </Button>
  );
}
