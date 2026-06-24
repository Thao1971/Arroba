'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Badge } from '@/components/ds';

export default function RecuperarPage() {
  const t = useTranslations('auth.recuperar');
  return (
    <AuthShell>
      <Badge
        variant="default"
        icon={<Sparkles size={12} strokeWidth={1.5} className="text-primary" />}
      >
        {t('comingSoon')}
      </Badge>
      <h1
        className="font-display font-bold text-[27px] tracking-tight text-text mt-4 mb-3"
        data-testid="recuperar-title"
      >
        {t('title')}
      </h1>
      <p className="text-[14.5px] text-text-muted leading-relaxed mb-8">{t('subtitle')}</p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 h-11 px-4 rounded-[12px] border-[1.5px] border-border-strong bg-surface text-text font-body text-sm font-semibold hover:bg-surface-2 transition-colors"
        data-testid="recuperar-back-link"
      >
        <ArrowLeft size={16} strokeWidth={1.6} />
        {t('back')}
      </Link>
    </AuthShell>
  );
}
