'use client';
import { useTranslations } from 'next-intl';
import { Handshake } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { EmptyStateBlock } from '@/components/blocks';

export default function CompraVentaPage() {
  return (
    <RequireAuth>
      <CompraVentaInner />
    </RequireAuth>
  );
}

function CompraVentaInner() {
  const t = useTranslations('placeholders.compraventa');
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <EmptyStateBlock
        icon={Handshake}
        title={t('title')}
        description={t('description')}
        hint={t('hint')}
        testId="compraventa-placeholder"
      />
    </div>
  );
}
