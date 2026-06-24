'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Mail, Lock, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { OrDivider } from '@/components/auth/Divider';
import { Alert } from '@/components/ds';
import { apiClient, ApiError } from '@/lib/api/client';
import { isValidEmail } from '@/lib/validators';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidEmail(email) && password.length >= 1;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.auth.login({ email: email.trim().toLowerCase(), password });
      const me = await apiClient.auth.me();
      await refresh();
      const next = params.get('next');
      if (me.memberships.length === 0) {
        router.replace('/onboarding');
      } else {
        router.replace(next && next.startsWith('/') ? next : '/organizaciones');
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_credentials') {
        setError(t('invalidCredentials'));
      } else {
        setError(t('genericError'));
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1
        className="font-display font-bold text-[27px] tracking-tight text-text mb-2"
        data-testid="login-title"
      >
        {t('title')}
      </h1>
      <p className="text-[14.5px] text-text-muted mb-7">{t('subtitle')}</p>

      <GoogleButton>{t('google')}</GoogleButton>

      <OrDivider>{t('divider')}</OrDivider>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthField
          label={t('emailLabel')}
          icon={Mail}
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          data-testid="login-email-input"
        />
        <AuthField
          label={t('passwordLabel')}
          icon={Lock}
          type="password"
          togglePassword
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          data-testid="login-password-input"
        />

        <div className="flex items-center justify-between mt-1 mb-2">
          <label className="inline-flex items-center gap-2 cursor-pointer text-[13.5px] text-text-muted select-none">
            <button
              type="button"
              onClick={() => setRemember((r) => !r)}
              aria-pressed={remember}
              className={
                'w-[18px] h-[18px] rounded-[5px] border-[1.5px] inline-flex items-center justify-center transition-colors ' +
                (remember
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface border-border-strong')
              }
              data-testid="login-remember-toggle"
            >
              {remember && <Check size={12} strokeWidth={3} />}
            </button>
            {t('remember')}
          </label>
          <Link
            href="/recuperar"
            className="text-[13.5px] font-semibold text-primary hover:underline"
            data-testid="login-forgot-link"
          >
            {t('forgot')}
          </Link>
        </div>

        {error && (
          <div data-testid="login-error">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        <button
          type="submit"
          disabled={!valid || submitting}
          aria-busy={submitting || undefined}
          data-testid="login-submit-button"
          className={
            'w-full h-12 inline-flex items-center justify-center gap-2 rounded-[12px] font-body text-[15px] font-bold transition-colors ' +
            (!valid || submitting
              ? 'bg-surface-2 text-text-subtle cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-hover')
          }
        >
          {submitting ? '…' : t('submit')}
          {!submitting && <ArrowRight size={17} strokeWidth={1.6} />}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        {t('noAccount')}{' '}
        <Link
          href="/registro"
          className="font-semibold text-primary hover:underline"
          data-testid="login-go-register"
        >
          {t('createAccount')}
        </Link>
      </p>
    </AuthShell>
  );
}
