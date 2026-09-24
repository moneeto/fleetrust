'use client';

import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorText?: string;
}

export function TextField({ label, errorText, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = errorText ? `${fieldId}-error` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <input
        id={fieldId}
        className={styles.input}
        aria-invalid={!!errorText}
        aria-describedby={errorId}
        {...rest}
      />
      {errorText && (
        <span id={errorId} className={styles.errorText} role="alert">
          {errorText}
        </span>
      )}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, id, children, ...rest }: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <select id={fieldId} className={styles.select} {...rest}>
        {children}
      </select>
    </div>
  );
}
