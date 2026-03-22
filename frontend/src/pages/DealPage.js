import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { dealsAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, Shield, FileText, Eye, MapPin, Calendar, Users, TrendingUp,
  Check, Loader2, FileSignature, Building2, Bookmark, Mail, ChevronRight,
  AlertCircle, Clock
} from 'lucide-react';

const OperationBadge = ({ types }) => {
  const labels = {
    full_sale: { text: 'Venta Total', color: 'bg-arroba-coral/10 text-arroba-coral' },
    partial_sale: { text: 'Venta Parcial', color: 'bg-arroba-blue/10 text-arroba-blue' },
    merger: { text: 'Fusión', color: 'bg-purple-100 text-purple-700' },
  };
  return (
    <div className="flex gap-2" data-testid="operation-badges">
      {(types || []).map(t => {
        const l = labels[t] || { text: t, color: 'bg-slate-100 text-slate-600' };
        return (
          <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${l.color}`}>
            {l.text}
          </span>
        );
      })}
    </div>
  );
};

const NdaModal = ({ onAccept, onClose, loading }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="nda-modal">
    <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-arroba-coral" />
        <h2 className="text-lg font-bold">Acuerdo de Confidencialidad (NDA)</h2>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 mb-4 max-h-48 overflow-y-auto">
        <p className="font-semibold mb-2">ACUERDO DE NO DIVULGACIÓN</p>
        <p className="mb-2">
          Al aceptar este acuerdo, el firmante se compromete a:
        </p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Mantener la confidencialidad absoluta sobre toda la información recibida.</li>
          <li>No divulgar, copiar, ni distribuir el contenido del Information Memorandum.</li>
          <li>No contactar directamente a la empresa objetivo sin autorización previa.</li>
          <li>No utilizar la información para fines distintos a la evaluación de la oportunidad.</li>
          <li>Destruir toda la documentación si se decide no continuar con el proceso.</li>
        </ul>
        <p className="mt-2">
          El incumplimiento de este acuerdo podrá dar lugar a acciones legales. Este NDA tiene una vigencia de 24 meses.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Plataforma Arroba — BUD Advisors
        </p>
      </div>

      <NdaCheckbox onAccept={onAccept} onClose={onClose} loading={loading} />
    </div>
  </div>
);

const NdaCheckbox = ({ onAccept, onClose, loading }) => {
  const [accepted, setAccepted] = useState(false);
  return (
    <>
      <label className="flex items-start gap-2 mb-4 cursor-pointer" data-testid="nda-checkbox-label">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 rounded" data-testid="nda-checkbox" />
        <span className="text-sm">He leído y acepto los términos del Acuerdo de Confidencialidad (NDA)</span>
      </label>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1" data-testid="nda-cancel-btn">Cancelar</Button>
        <Button onClick={onAccept} disabled={!accepted || loading}
          className="flex-1 bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="nda-accept-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSignature className="w-4 h-4 mr-2" />}
          Firmar NDA
        </Button>
      </div>
    </>
  );
};

const DealPage = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [signingNda, setSigningNda] = useState(false);
  const startTimeRef = useRef(Date.now());

  const fetchDeal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dealsAPI.getDealPage(dealId);
      setDeal(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar el deal');
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
    startTimeRef.current = Date.now();
  }, [fetchDeal]);

  const handleSignNda = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/marketplace/${dealId}`);
      return;
    }
    setSigningNda(true);
    try {
      await dealsAPI.signNda(dealId);
      setShowNdaModal(false);
      await fetchDeal(); // Refresh to get post-NDA data
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al firmar el NDA');
    } finally {
      setSigningNda(false);
    }
  };

  const handleRequestAccess = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/marketplace/${dealId}`);
      return;
    }
    setShowNdaModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-arroba-coral mx-auto" />
        </div>
      </Layout>
    );
  }

  if (error || !deal) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-slate-600">{error || 'Deal no encontrado'}</p>
          <Link to="/marketplace"><Button variant="outline" className="mt-4">Volver al Marketplace</Button></Link>
        </div>
      </Layout>
    );
  }

  const teaser = deal.teaser || {};
  const hasNda = deal.has_nda;
  const isOwner = deal.is_owner;

  return (
    <Layout>
      {showNdaModal && <NdaModal onAccept={handleSignNda} onClose={() => setShowNdaModal(false)} loading={signingNda} />}

      <div className="container mx-auto px-4 py-8 max-w-5xl" data-testid="deal-page">
        {/* Back link */}
        <Link to="/marketplace" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6" data-testid="back-to-marketplace">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Marketplace
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <OperationBadge types={deal.operation_types_allowed} />
              {hasNda && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700" data-testid="nda-status-badge">
                  NDA Firmado
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="deal-title">
              {hasNda || isOwner
                ? (deal.company?.trade_name || deal.company?.legal_name || teaser.title)
                : teaser.title || teaser.headline || 'Oportunidad de Inversión'}
            </h1>
            <div className="flex items-center flex-wrap gap-4 text-sm text-slate-500">
              {(teaser.location || teaser.geography_display) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {teaser.location || teaser.geography_display}
                </span>
              )}
              {(teaser.year_founded) && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Fundada en {teaser.year_founded}
                </span>
              )}
              {teaser.sector_display && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> {teaser.sector_display}
                </span>
              )}
            </div>
          </div>

          {/* CTA Area */}
          <div className="flex gap-2 flex-shrink-0">
            {!hasNda && !isOwner && (
              <Button onClick={handleRequestAccess}
                className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="request-access-btn">
                <Shield className="w-4 h-4 mr-2" /> Solicitar Acceso
              </Button>
            )}
            {isAuthenticated && !isOwner && (
              <Button variant="outline" data-testid="save-deal-btn">
                <Bookmark className="w-4 h-4 mr-2" /> Guardar
              </Button>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-description">
              <p className="text-slate-600 leading-relaxed">
                {teaser.short_description || teaser.description || 'Sin descripción disponible'}
              </p>
            </div>

            {/* Highlights (max 2 in card, all here) */}
            {teaser.highlights?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-highlights">
                <h3 className="font-bold text-slate-900 mb-3">Puntos fuertes</h3>
                <ul className="space-y-2">
                  {teaser.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* POST-NDA: Infomemo */}
            {(hasNda || isOwner) && deal.infomemo?.content && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-infomemo">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-arroba-coral" />
                  <h3 className="font-bold text-slate-900">Information Memorandum</h3>
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{deal.infomemo.content}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* PRE-NDA: CTA to sign */}
            {!hasNda && !isOwner && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center" data-testid="nda-cta-section">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Documento completo disponible tras NDA
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Firma el acuerdo de confidencialidad para acceder al Information Memorandum completo
                  y conocer la identidad de la empresa.
                </p>
                <Button onClick={handleRequestAccess}
                  className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="request-access-cta-btn">
                  <Shield className="w-4 h-4 mr-2" /> Solicitar Acceso
                </Button>
              </div>
            )}

            {/* POST-NDA: Next steps */}
            {(hasNda || isOwner) && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="next-steps">
                <h3 className="font-bold text-slate-900 mb-4">Siguientes pasos</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 rounded-lg bg-arroba-coral/5 hover:bg-arroba-coral/10 transition-colors text-left" data-testid="send-interest-btn">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-arroba-coral" />
                      <div>
                        <p className="font-semibold text-sm">Enviar interés / LOI</p>
                        <p className="text-xs text-slate-500">Manifiesta tu interés formal</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left" data-testid="request-meeting-btn">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-arroba-blue" />
                      <div>
                        <p className="font-semibold text-sm">Solicitar reunión</p>
                        <p className="text-xs text-slate-500">Con el seller o su advisor</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {/* POST-NDA: Activity log */}
            {hasNda && deal.activity_log?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="activity-log">
                <h3 className="font-bold text-slate-900 mb-3">Actividad</h3>
                <div className="space-y-2">
                  {deal.activity_log.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {item.date ? new Date(item.date).toLocaleDateString('es-ES') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar - Key metrics */}
          <div className="space-y-6">
            {/* Financial summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-financials">
              <h3 className="font-bold text-slate-900 mb-4">Datos Financieros</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Facturación</p>
                  <p className="text-lg font-bold text-slate-900" data-testid="deal-revenue">
                    {teaser.revenue_range || teaser.revenue_display || 'N/D'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">EBITDA</p>
                  <p className="text-lg font-bold text-slate-900" data-testid="deal-ebitda">
                    {teaser.ebitda_range || teaser.ebitda_display || 'N/D'}
                  </p>
                </div>
                {(teaser.ebitda_margin_range) && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Margen EBITDA</p>
                    <p className="font-semibold text-slate-900">{teaser.ebitda_margin_range}</p>
                  </div>
                )}
                {teaser.growth_indicator && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Crecimiento</p>
                    <p className="font-semibold text-arroba-green flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> {teaser.growth_indicator}
                    </p>
                  </div>
                )}
                {(deal.asking_price || deal.price_range) && (
                  <div className="pt-3 border-t">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                      {deal.asking_price ? 'Precio solicitado' : 'Rango de valoración'}
                    </p>
                    <p className="text-lg font-bold text-arroba-coral">
                      {deal.asking_price 
                        ? `${(deal.asking_price / 1000000).toFixed(1)}M €`
                        : deal.price_range}
                    </p>
                    {deal.price_negotiable && (
                      <span className="text-xs text-slate-400">Negociable</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Company info (post-NDA) */}
            {(hasNda || isOwner) && deal.company && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="company-identity">
                <h3 className="font-bold text-slate-900 mb-4">Compañía</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Nombre Legal</p>
                    <p className="font-semibold">{deal.company.legal_name}</p>
                  </div>
                  {deal.company.trade_name && (
                    <div>
                      <p className="text-slate-400 text-xs">Marca</p>
                      <p className="font-semibold">{deal.company.trade_name}</p>
                    </div>
                  )}
                  {deal.company.website && (
                    <div>
                      <p className="text-slate-400 text-xs">Web</p>
                      <a href={deal.company.website} target="_blank" rel="noopener noreferrer"
                        className="text-arroba-coral hover:underline">{deal.company.website}</a>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400 text-xs">Ubicación</p>
                    <p>{deal.company.city}, {deal.company.country}</p>
                  </div>
                  {deal.company.employees_count && (
                    <div>
                      <p className="text-slate-400 text-xs">Empleados</p>
                      <p>{deal.company.employees_count}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick facts */}
            <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="quick-facts">
              <h3 className="font-bold text-slate-900 mb-4">Datos clave</h3>
              <div className="space-y-3 text-sm">
                {teaser.employees_range && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Empleados</span>
                    <span className="font-semibold">{teaser.employees_range}</span>
                  </div>
                )}
                {teaser.recurring_revenue_indicator && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recurrencia</span>
                    <span className="font-semibold">{teaser.recurring_revenue_indicator}</span>
                  </div>
                )}
                {teaser.deal_type && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operación</span>
                    <span className="font-semibold">{teaser.deal_type}</span>
                  </div>
                )}
              </div>
            </div>

            {/* NDA reminder for unauthenticated */}
            {!isAuthenticated && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center" data-testid="login-cta">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-3">
                  Regístrate para solicitar acceso al documento completo
                </p>
                <Link to={`/register?role=buyer&redirect=/marketplace/${dealId}`}>
                  <Button className="w-full bg-arroba-coral hover:bg-arroba-coral/90 text-white">
                    Crear cuenta
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DealPage;
