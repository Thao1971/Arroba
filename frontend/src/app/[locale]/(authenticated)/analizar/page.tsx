'use client';
import { useTranslations } from 'next-intl';
import { LineChart } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { EmptyStateBlock } from '@/components/blocks';

export default function AnalizarPage() {
  return (
    <RequireAuth>
      <AnalizarInner />
    </RequireAuth>
  );
}

function AnalizarInner() {
  const t = useTranslations('placeholders.analizar');
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <EmptyStateBlock
        icon={LineChart}
        title={t('title')}
        description={t('description')}
        hint={t('hint')}
        testId="analizar-placeholder"
      />
    </div>
  );
}
