import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge, Button } from '@/components/ds';
import { LocaleSwitcher } from './_components/LocaleSwitcher';

export default function HomePage() {
  const t = useTranslations('landing');
  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
      <div className="mb-3 flex justify-center">
        <Badge variant="default" icon={<Sparkles size={12} strokeWidth={1.5} className="ai-marker" />}>
          {t('stage')}
        </Badge>
      </div>
      <h1 className="font-display font-semibold text-3xl md:text-display tracking-tight text-center leading-tight">
        {t('title')}
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-center text-lg text-text-muted font-body">
        {t('subtitle')}
      </p>
      <div className="mt-8 flex justify-center gap-3 items-center">
        <Link href="/design-system">
          <Button size="lg" rightIcon={<ArrowRight size={16} strokeWidth={1.5} />}>
            {t('ctaDesignSystem')}
          </Button>
        </Link>
        <LocaleSwitcher />
      </div>
    </section>
  );
}
