'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Mail, Lock, User as UserIcon, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { OrDivider } from '@/components/auth/Divider';
import { Alert } from '@/components/ds';
import { apiClient, ApiError } from '@/lib/api/client';
import { isValidEmail, checkPasswordStrength } from '@/lib/validators';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const { refresh } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = checkPasswordStrength(password);
  const valid =
    fullName.trim().length >= 2 && isValidEmail(email) && strength.ok;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.auth.register({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
      });
      await refresh();
      // Newly-registered user always lacks memberships → mandatory journey.
      router.replace('/onboarding');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_already_registered') {
        setError(t('emailInUse'));
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
        data-testid="register-title"
      >
        {t('title')}
      </h1>
      <p className="text-[14.5px] text-text-muted mb-7">{t('subtitle')}</p>

      <GoogleButton>{t('google')}</GoogleButton>

      <OrDivider>{t('divider')}</OrDivider>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthField
          label={t('nameLabel')}
          icon={UserIcon}
          autoComplete="name"
          autoFocus
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t('namePlaceholder')}
          data-testid="register-name-input"
        />
        <AuthField
          label={t('emailLabel')}
          icon={Mail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          data-testid="register-email-input"
        />
        <AuthField
          label={t('passwordLabel')}
          icon={Lock}
          type="password"
          togglePassword
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          data-testid="register-password-input"
        />
        <div className="flex gap-4 text-xs">
          <PasswordHint ok={strength.minLength} label={t('passwordHintMin')} />
          <PasswordHint ok={strength.hasNumber} label={t('passwordHintNumber')} />
        </div>

        {error && (
          <div data-testid="register-error">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        <button
          type="submit"
          disabled={!valid || submitting}
          aria-busy={submitting || undefined}
          data-testid="register-submit-button"
          className={
            'w-full h-12 mt-1 inline-flex items-center justify-center gap-2 rounded-[12px] font-body text-[15px] font-bold transition-colors ' +
            (!valid || submitting
              ? 'bg-surface-2 text-text-subtle cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-hover')
          }
        >
          {submitting ? '…' : t('submit')}
          {!submitting && <ArrowRight size={17} strokeWidth={1.6} />}
        </button>

        <p className="text-center text-xs text-text-subtle mt-2 leading-relaxed">
          {t('termsBefore')}{' '}
          <a href="#" className="text-text-muted underline hover:text-text">
            {t('termsLink')}
          </a>{' '}
          {t('termsAnd')}{' '}
          <a href="#" className="text-text-muted underline hover:text-text">
            {t('privacyLink')}
          </a>
          .
        </p>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        {t('haveAccount')}{' '}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
          data-testid="register-go-login"
        >
          {t('login')}
        </Link>
      </p>
    </AuthShell>
  );
}

function PasswordHint({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 ' + (ok ? 'text-success' : 'text-text-subtle')
      }
    >
      <Check size={12} strokeWidth={2.4} className={ok ? 'opacity-100' : 'opacity-40'} />
      {label}
    </span>
  );
}
