'use client';
/**
 * Perfil de usuario — CANONICAL_SCREENS.md #9.
 * Implementación real de ACC_CUENTA_v0.1.md (Capítulo Perfil): reemplaza el
 * EmptyStateBlock placeholder por los cuatro componentes documentados
 * (COMP-14001 a COMP-14004).
 */
import { useTranslations } from 'next-intl';
import { RequireAuth } from '@/components/RequireAuth';
import { IdentityCard } from '@/components/account/IdentityCard';
import { ProfileCompleteness } from '@/components/account/ProfileCompleteness';
import { CriteriaThesis } from '@/components/account/CriteriaThesis';
import { AccountSecurity } from '@/components/account/AccountSecurity';

export default function PerfilPage() {
  return (
    <RequireAuth>
      <PerfilInner />
    </RequireAuth>
  );
}

function PerfilInner() {
  const t = useTranslations();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6" data-testid="perfil-page">
      <header>
        <h1 className="font-display font-semibold text-2xl text-text">{t('header.profile')}</h1>
      </header>
      <IdentityCard />
      <ProfileCompleteness />
      <CriteriaThesis />
      <AccountSecurity />
    </div>
  );
}
