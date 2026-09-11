'use client';
/**
 * Ajustes — CANONICAL_SCREENS.md #8.
 * Implementación real de ACC_CUENTA_v0.1.md (Capítulo Ajustes): reemplaza el
 * EmptyStateBlock placeholder por los seis componentes documentados
 * (COMP-14005 a COMP-14010). Idioma/Tema y Organización y equipo están
 * completamente cableados; Notificaciones, Plan y facturación, Privacidad y
 * Zona de peligro se dejan como próximamente honesto porque el backend
 * todavía no tiene esos endpoints (ver ACC_CUENTA_v0.1.md por componente).
 */
import { useTranslations } from 'next-intl';
import { RequireAuth } from '@/components/RequireAuth';
import { LanguageTheme } from '@/components/account/LanguageTheme';
import { NotificationPreferences } from '@/components/account/NotificationPreferences';
import { OrganizationTeam } from '@/components/account/OrganizationTeam';
import { PlanBilling } from '@/components/account/PlanBilling';
import { PrivacyData } from '@/components/account/PrivacyData';
import { DangerZone } from '@/components/account/DangerZone';

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
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6" data-testid="ajustes-page">
      <header>
        <h1 className="font-display font-semibold text-2xl text-text">{t('header.settings')}</h1>
      </header>
      <LanguageTheme />
      <OrganizationTeam />
      <NotificationPreferences />
      <PlanBilling />
      <PrivacyData />
      <DangerZone />
    </div>
  );
}
