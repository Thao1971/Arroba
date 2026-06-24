'use client';
import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { EmptyStateBlock } from '@/components/blocks';

export default function AjustesPage() {
  return (
    <RequireAuth>
      <AjustesInner />
    </RequireAuth>
  );
}

function AjustesInner() {
  const t = useTranslations();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <EmptyStateBlock
        icon={Settings}
        title={t('header.settings')}
        description="Idioma, tema y notificaciones llegarán en una sub-fase posterior."
        testId="ajustes-placeholder"
      />
    </div>
  );
}
