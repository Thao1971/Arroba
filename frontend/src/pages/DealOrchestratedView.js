import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDealPresentation } from '../hooks/useDealPresentation';
import { DealActionPanel } from '../components/DealActionPanel';
import { DealTeaserPage } from '../components/DealTeaserPage';
import { DealPreContactPage } from '../components/DealPreContactPage';
import { DealPremiumAnalysis } from '../components/DealPremiumAnalysis';
import { fmtMillions } from '../utils/formatES';
import {
  ArrowLeft, Loader2, Building2, Shield, Star, Eye,
  BarChart3, FileText, Briefcase
} from 'lucide-react';

const DealOrchestratedView = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { presentation, loading, error, contactLoading, requestContact, refresh } = useDealPresentation(dealId);

  const handleAction = (action) => {
    if (action === 'upgrade') navigate('/planes?role=buyer');
    else if (action === 'sign_nda') navigate(`/explorar/${dealId}?action=nda`);
    else if (action === 'view_infomemo') navigate(`/explorar/${dealId}`);
    else if (action === 'view_teaser') { /* already on this page */ }
    else if (action === 'submit_questions') navigate(`/explorar/${dealId}?section=qa`);
    else if (action === 'save_deal') { /* handled by existing save logic */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--outline)' }}>{error}</p>
          <Link to="/explorar" className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>Volver al marketplace</Link>
        </div>
      </div>
    );
  }

  if (!presentation) return null;

  const { visibility_state, card_only, buyer_tier, visual_mode, content_richness_score, deal_summary, premium_modules } = presentation;
  const showPreContact = card_only || visibility_state === 'LOCKED_CONTACT_REQUIRED';
  const showTeaser = !showPreContact && visibility_state !== 'CONTACT_REQUESTED';
  const showWaiting = visibility_state === 'CONTACT_REQUESTED';
  const showPremium = buyer_tier === 'pro+' && premium_modules?.available;

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="deal-orchestrated-view">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--surface-lowest)', borderBottom: '1px solid var(--surface-2)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--outline)' }}>
            <ArrowLeft size={12} /> VOLVER
          </button>
          <div className="h-4 w-px" style={{ background: 'var(--surface-2)' }} />
          <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: buyer_tier === 'pro+' ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: buyer_tier === 'pro+' ? 'var(--arroba-primary)' : 'var(--outline)' }}>
            {buyer_tier?.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>
            RIQUEZA: {content_richness_score}%
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: visual_mode === 'rich' ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: visual_mode === 'rich' ? '#16a34a' : 'var(--outline)' }}>
            {visual_mode?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {showPreContact && (
              <DealPreContactPage
                presentation={presentation}
                onContact={requestContact}
                contactLoading={contactLoading}
              />
            )}

            {showWaiting && (
              <div className="text-center py-16" style={{ background: 'var(--surface-lowest)' }}>
                <Loader2 size={24} className="animate-spin mx-auto mb-4" style={{ color: 'var(--outline)' }} />
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--on-surface)' }}>Solicitud enviada</h2>
                <p className="text-xs" style={{ color: 'var(--outline)' }}>El vendedor esta revisando tu solicitud de contacto.</p>
              </div>
            )}

            {showTeaser && (
              <DealTeaserPage presentation={presentation} deal={presentation.deal_summary} />
            )}

            {showPremium && (
              <div className="mt-6">
                <DealPremiumAnalysis analysis={null} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <DealActionPanel
                presentation={presentation}
                onContact={requestContact}
                onAction={handleAction}
              />

              {/* Quick stats */}
              {deal_summary && (
                <div className="mt-4 p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                  <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>RESUMEN</p>
                  <div className="space-y-2">
                    {deal_summary.sector && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: 'var(--outline)' }}>Sector</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{deal_summary.sector}</span>
                      </div>
                    )}
                    {deal_summary.city && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: 'var(--outline)' }}>Ciudad</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{deal_summary.city}</span>
                      </div>
                    )}
                    {deal_summary.revenue && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: 'var(--outline)' }}>Facturacion</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{fmtMillions(deal_summary.revenue)}</span>
                      </div>
                    )}
                    {deal_summary.employees_range && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: 'var(--outline)' }}>Empleados</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{deal_summary.employees_range}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealOrchestratedView;
