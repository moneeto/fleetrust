import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import styles from './Banner.module.css';

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant: 'error' | 'warning' | 'success';
}

const ICONS_BY_VARIANT = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
} as const;

export function Banner({ variant, role, children, className, ...rest }: BannerProps) {
  const Icon = ICONS_BY_VARIANT[variant];
  return (
    <div
      className={[styles.banner, styles[variant], className].filter(Boolean).join(' ')}
      role={role ?? (variant === 'error' ? 'alert' : 'status')}
      {...rest}
    >
      <Icon size={16} className={styles.icon} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
