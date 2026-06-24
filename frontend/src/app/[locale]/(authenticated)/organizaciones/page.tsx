'use client';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { Plus, Building2, ArrowRight } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { Badge, Card, Spinner } from '@/components/ds';
import { swrFetcher, ApiError } from '@/lib/api/client';
import type { OrgWithMembership, OrgRole, OrgStatus } from '@/lib/api/types';

function OrganizationsInner() {
  const t = useTranslations('organizations');

  const { data, error, isLoading } = useSWR<OrgWithMembership[], ApiError>(
    '/api/organizations/mine',
    swrFetcher,
    { revalidateOnFocus: true }
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1
            className="font-display font-bold text-3xl tracking-tight mb-1"
            data-testid="organizations-title"
          >
            {t('title')}
          </h1>
          <p className="text-text-muted">{t('subtitle')}</p>
        </div>
        <Link
          href="/onboarding/organizacion"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-[12px] bg-primary text-white font-body text-sm font-semibold hover:bg-primary-hover transition-colors"
          data-testid="organizations-create-cta"
        >
          <Plus size={16} strokeWidth={1.6} />
          {t('createCta')}
        </Link>
      </header>

      {isLoading && (
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Spinner /> {t('loading')}
        </div>
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <Card>
          <div className="text-center py-10" data-testid="organizations-empty">
            <Building2 size={36} strokeWidth={1.5} className="text-text-subtle mx-auto mb-3" />
            <p className="text-text-muted mb-5">{t('empty')}</p>
            <Link
              href="/onboarding/organizacion"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-[12px] bg-primary text-white font-body text-sm font-semibold hover:bg-primary-hover transition-colors"
              data-testid="organizations-empty-cta"
            >
              <Plus size={16} strokeWidth={1.6} />
              {t('emptyCta')}
            </Link>
          </div>
        </Card>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <ul className="grid gap-4" data-testid="organizations-list">
          {data.map((row) => (
            <OrgRow key={row.org.org_id} row={row} t={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrgRow({
  row,
  t,
}: {
  row: OrgWithMembership;
  t: ReturnType<typeof useTranslations<'organizations'>>;
}) {
  const roleLabelMap: Record<OrgRole, string> = {
    owner: t('roleOwner'),
    admin: t('roleAdmin'),
    operator: t('roleOperator'),
  };
  const statusLabelMap: Record<OrgStatus, string> = {
    active: t('statusActive'),
    suspended: t('statusSuspended'),
    archived: t('statusArchived'),
  };
  const statusVariant: Record<OrgStatus, 'success' | 'warning' | 'default'> = {
    active: 'success',
    suspended: 'warning',
    archived: 'default',
  };

  return (
    <li>
      <Card
        className="hover:border-border-strong transition-colors"
        data-testid={`organizations-row-${row.org.org_id}`}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-display font-semibold text-lg truncate">
                {row.org.legal_name}
              </h3>
              <Badge variant={statusVariant[row.org.status]}>
                {statusLabelMap[row.org.status]}
              </Badge>
              <Badge variant="info">{roleLabelMap[row.membership.role_in_org]}</Badge>
            </div>
            <p className="text-sm text-text-muted font-mono">
              {row.org.tax_id || '—'} · {row.org.country}
            </p>
          </div>
          <ArrowRight
            size={20}
            strokeWidth={1.5}
            className="text-text-subtle shrink-0 mt-1"
            aria-hidden
          />
        </div>
      </Card>
    </li>
  );
}

export default function OrganizationsPage() {
  return (
    <RequireAuth>
      <OrganizationsInner />
    </RequireAuth>
  );
}
