'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Compass, Menu, X } from 'lucide-react';
import type { MeResponse, NavigationItem } from '../../lib/api-client';
import { resolveModuleIcon } from '../../lib/icon-map';
import { LogoutButton } from './LogoutButton';
import { Banner } from '../components/Banner';
import styles from './AppShell.module.css';

interface AppShellProps {
  user: MeResponse;
  navItems: NavigationItem[];
  children: ReactNode;
}

export function AppShell({ user, navItems, children }: AppShellProps) {
  const t = useTranslations('shell');
  const tApp = useTranslations('app');
  const tModules = useTranslations('modules');
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Cerrar el menú móvil al navegar, para no dejarlo abierto tapando la pantalla siguiente.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileNavOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  return (
    <div className={styles.shell}>
      {isMobileNavOpen && <div className={styles.backdrop} onClick={() => setIsMobileNavOpen(false)} />}

      <nav
        className={[styles.sidebar, isMobileNavOpen ? styles.sidebarOpen : ''].filter(Boolean).join(' ')}
        aria-label={tApp('name')}
      >
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Compass size={16} strokeWidth={2.5} />
          </span>
          <span className={styles.brandName}>{tApp('name')}</span>
        </div>

        {navItems.length > 0 ? (
          <ul className={styles.nav} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {navItems.map((item) => {
              const Icon = resolveModuleIcon(item.icon);
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={[styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {tModules(item.i18nKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.navEmpty}>{t('navEmptyTitle')}</p>
        )}
        <div className={styles.account}>
          <Link href="/profile" className={styles.accountName}>
            {user.name ?? user.email}
          </Link>
          {user.name ? <span className={styles.accountEmail}>{user.email}</span> : null}
          <LogoutButton />
        </div>
      </nav>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={isMobileNavOpen}
            aria-label={isMobileNavOpen ? t('closeMenu') : t('openMenu')}
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </header>

        {user.modoSuplantacion && (
          <div style={{ padding: '12px 34px 0' }}>
            <Banner variant="warning">
              {t('impersonationBanner')}{' '}
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                  window.location.href = process.env.NEXT_PUBLIC_ADMIN_ORIGIN ?? 'http://localhost:4000';
                }}
              >
                {t('exitImpersonation')}
              </button>
            </Banner>
          </div>
        )}

        {user.accountStatus === 'SUSPENDED' && (
          <div style={{ padding: '12px 34px 0' }}>
            <Banner variant="warning">{t('readOnlyBanner')}</Banner>
          </div>
        )}

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
