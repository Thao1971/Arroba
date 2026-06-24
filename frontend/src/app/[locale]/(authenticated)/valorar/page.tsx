'use client';
import { useTranslations } from 'next-intl';
import { Scale } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { EmptyStateBlock } from '@/components/blocks';

export default function ValorarPage() {
  return (
    <RequireAuth>
      <ValorarInner />
    </RequireAuth>
  );
}

function ValorarInner() {
  const t = useTranslations('placeholders.valorar');
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <EmptyStateBlock
        icon={Scale}
        title={t('title')}
        description={t('description')}
        hint={t('hint')}
        testId="valorar-placeholder"
      />
    </div>
  );
}
