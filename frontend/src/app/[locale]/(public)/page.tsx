'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ds';
import { useAuth } from '@/contexts/auth-context';

export default function HomePage() {
  const t = useTranslations('landing');
  const { isAuthenticated, isLoading, memberships } = useAuth();
  const router = useRouter();

  // If already authenticated, route the user away from the public landing.
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    router.replace(memberships && memberships.length === 0 ? '/onboarding' : '/organizaciones');
  }, [isAuthenticated, isLoading, memberships, router]);

  return (
    <section className="max-w-3xl mx-auto px-6 pt-16 pb-24 text-center" data-testid="public-landing">
      <div className="mb-3 flex justify-center">
        <Badge variant="default" icon={<Sparkles size={12} strokeWidth={1.5} className="ai-marker" />}>
          {t('stage')}
        </Badge>
      </div>
      <h1 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-tight">
        {t('title')}
      </h1>
      <p className="mt-6 max-w-xl mx-auto text-lg text-text-muted font-body">{t('subtitle')}</p>
      <div className="mt-8 flex justify-center gap-3 items-center flex-wrap">
        <Link
          href="/login"
          data-testid="landing-cta-login"
          className="inline-flex items-center gap-2 h-12 px-5 rounded-[12px] bg-primary text-white font-body text-sm font-bold hover:bg-primary-hover transition-colors"
        >
          {t('ctaPrimary')} <ArrowRight size={16} strokeWidth={1.6} />
        </Link>
        <Link
          href="/registro"
          data-testid="landing-cta-register"
          className="inline-flex items-center h-12 px-5 rounded-[12px] border-[1.5px] border-border-strong bg-surface text-text font-body text-sm font-semibold hover:bg-surface-2 transition-colors"
        >
          {t('ctaSecondary')}
        </Link>
      </div>
    </section>
  );
}
