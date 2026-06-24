'use client';
import { useTranslations } from 'next-intl';
import { User as UserIcon } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { EmptyStateBlock } from '@/components/blocks';
import { useAuth } from '@/contexts/auth-context';

export default function PerfilPage() {
  return (
    <RequireAuth>
      <PerfilInner />
    </RequireAuth>
  );
}

function PerfilInner() {
  const t = useTranslations();
  const { user } = useAuth();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <EmptyStateBlock
        icon={UserIcon}
        title={t('header.profile')}
        description={user?.email ? `${user.email} — ${user.role}` : ''}
        hint="La edición del perfil llegará en una sub-fase posterior."
        testId="perfil-placeholder"
      />
    </div>
  );
}
