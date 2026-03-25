import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { conversationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Loader2, ArrowLeft, MessageSquare, Clock, CheckCircle2,
  AlertCircle, Send, X, User, ChevronDown, ChevronUp
} from 'lucide-react';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const mins = Math.floor((now - d) / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return `hace ${Math.floor(days / 7)}sem`;
};

const statusConfig = {
  PENDING: { label: 'Pendiente', color: 'rgba(217,119,6,0.08)', text: '#92400e', icon: Clock },
  ANSWERED: { label: 'Respondida', color: 'rgba(0,100,147,0.08)', text: '#004b74', icon: CheckCircle2 },
  CLOSED: { label: 'Cerrada', color: 'rgba(130,195,89,0.1)', text: '#4d7a2e', icon: X },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.PENDING;
  const Icon = cfg.icon;
  return (
    <span className="badge-arroba" style={{ background: cfg.color, color: cfg.text }}
      data-testid={`status-${status}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};

const QuestionCard = ({ question, isSeller, onAnswer, onClose }) => {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(question.status === 'PENDING');
  const answers = question.answers || [];

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || submitting) return;
    setSubmitting(true);
    await onAnswer(question.qa_item_id, answerText.trim());
    setAnswerText('');
    setShowAnswerForm(false);
    setSubmitting(false);
  };

  return (
    <div style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}
      className="mb-3" data-testid={`question-${question.qa_item_id}`}>
      {/* Question header */}
      <div className="flex items-start justify-between p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={question.status} />
            <span className="text-[11px]" style={{ color: 'var(--outline)' }}>{timeAgo(question.created_at)}</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)', lineHeight: 1.6 }}>
            {question.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,100,147,0.08)' }}>
              <User size={10} style={{ color: 'var(--arroba-secondary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--outline)' }}>
              {question.author_name} <span className="label-arroba ml-1">BUYER</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {answers.length > 0 && (
            <span className="text-xs font-semibold" style={{ color: 'var(--outline)' }}>
              {answers.length} respuesta{answers.length !== 1 ? 's' : ''}
            </span>
          )}
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--outline)' }} /> : <ChevronDown size={16} style={{ color: 'var(--outline)' }} />}
        </div>
      </div>

      {/* Expanded: Answers + Actions */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--surface-1)' }}>
          {/* Answers */}
          {answers.map((a) => (
            <div key={a.qa_item_id} className="p-5 ml-8" style={{ borderTop: '1px solid var(--surface-1)' }}
              data-testid={`answer-${a.qa_item_id}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(182,33,42,0.08)' }}>
                  <User size={10} style={{ color: 'var(--arroba-primary)' }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>
                  {a.author_name}
                </span>
                <span className="label-arroba">SELLER</span>
                <span className="text-[11px]" style={{ color: 'var(--outline)' }}>{timeAgo(a.created_at)}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                {a.content}
              </p>
            </div>
          ))}

          {/* Actions */}
          {question.status !== 'CLOSED' && (
            <div className="p-4 flex gap-2" style={{ background: 'var(--surface-1)' }}>
              {isSeller && !showAnswerForm && (
                <>
                  <button className="btn-primary text-xs px-4 py-2" onClick={(e) => { e.stopPropagation(); setShowAnswerForm(true); }}
                    data-testid="btn-answer">
                    RESPONDER
                  </button>
                  <button className="btn-outline text-xs px-4 py-2" onClick={(e) => { e.stopPropagation(); onClose(question.qa_item_id); }}
                    data-testid="btn-close-question">
                    CERRAR PREGUNTA
                  </button>
                </>
              )}

              {isSeller && showAnswerForm && (
                <div className="w-full" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    className="input-arroba w-full mb-2"
                    rows={3}
                    placeholder="Escribe tu respuesta..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    data-testid="answer-textarea"
                    style={{ resize: 'vertical' }}
                  />
                  <div className="flex gap-2">
                    <button className="btn-primary text-xs px-4 py-2 flex items-center gap-1"
                      onClick={handleSubmitAnswer} disabled={submitting || !answerText.trim()}
                      data-testid="btn-submit-answer">
                      {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      ENVIAR
                    </button>
                    <button className="btn-outline text-xs px-4 py-2" onClick={() => setShowAnswerForm(false)}>
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ConversationPage = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isSeller = user?.user_id === conversation?.seller_id;
  const isBuyer = user?.user_id === conversation?.buyer_id;

  const loadData = useCallback(async () => {
    try {
      const res = await conversationsAPI.getOne(conversationId);
      setConversation(res.data.conversation);
      setQuestions(res.data.questions);
    } catch (e) {
      setError('Error cargando conversacion');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNewQuestion = async () => {
    if (!newQuestion.trim() || submitting) return;
    setSubmitting(true);
    try {
      await conversationsAPI.createQuestion(conversationId, newQuestion.trim());
      setNewQuestion('');
      await loadData();
    } catch (e) {
      console.error('Error creating question:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (questionId, content) => {
    try {
      await conversationsAPI.createAnswer(conversationId, questionId, content);
      await loadData();
    } catch (e) {
      console.error('Error creating answer:', e);
    }
  };

  const handleClose = async (questionId) => {
    try {
      await conversationsAPI.closeQuestion(conversationId, questionId);
      await loadData();
    } catch (e) {
      console.error('Error closing question:', e);
    }
  };

  if (loading) return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--outline)' }} />
      </div>
    </Layout>
  );

  if (error || !conversation) return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <AlertCircle className="w-6 h-6 mr-2" style={{ color: 'var(--arroba-primary)' }} />
        <p style={{ color: 'var(--outline)' }}>{error || 'Conversacion no encontrada'}</p>
      </div>
    </Layout>
  );

  const stats = conversation.stats || {};
  const backLink = isSeller ? `/seller/deal/${conversation.deal_id}` : '/buyer/procesos';

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6 max-w-4xl" data-testid="qa-workspace">
        {/* Back link */}
        <Link to={backLink} className="inline-flex items-center gap-1 text-sm font-semibold mb-6"
          style={{ color: 'var(--outline)' }} data-testid="back-link">
          <ArrowLeft size={14} /> Volver
        </Link>

        {/* Header */}
        <div className="mb-6 p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}
          data-testid="qa-header">
          <div className="flex items-start justify-between">
            <div>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>Q&A WORKSPACE</p>
              <h1 className="text-2xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                {conversation.deal_title}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm" style={{ color: 'var(--outline)' }}>
                  Buyer: <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{conversation.buyer_name}</span>
                </span>
                <span className="text-sm" style={{ color: 'var(--outline)' }}>
                  Seller: <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{conversation.seller_name}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-arroba" style={{
                background: conversation.status === 'OPEN' ? 'rgba(130,195,89,0.1)' : 'var(--surface-2)',
                color: conversation.status === 'OPEN' ? '#4d7a2e' : 'var(--outline)'
              }}>
                {conversation.status === 'OPEN' ? 'ACTIVA' : 'CERRADA'}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-4 pt-4" style={{ borderTop: '1px solid var(--surface-1)' }}>
            {[
              { label: 'Preguntas', value: stats.questions || 0 },
              { label: 'Pendientes', value: stats.pending || 0, warn: true },
              { label: 'Respondidas', value: stats.answered || 0 },
              { label: 'Cerradas', value: stats.closed || 0 },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-lg font-bold" style={{ color: s.warn && s.value > 0 ? '#92400e' : 'var(--on-surface)' }}>
                  {s.value}
                </p>
                <p className="label-arroba">{s.label}</p>
              </div>
            ))}
            <div className="ml-auto text-right">
              <p className="text-xs" style={{ color: 'var(--outline)' }}>Ultima actividad</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                {timeAgo(conversation.last_activity_at)}
              </p>
            </div>
          </div>
        </div>

        {/* New question form (buyer only) */}
        {isBuyer && conversation.status === 'OPEN' && (
          <div className="mb-6 p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}
            data-testid="new-question-form">
            <p className="label-arroba mb-3" style={{ color: 'var(--arroba-secondary)' }}>NUEVA PREGUNTA</p>
            <textarea
              className="input-arroba w-full mb-3"
              rows={3}
              placeholder="Escribe tu pregunta sobre este deal..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              data-testid="question-textarea"
              style={{ resize: 'vertical' }}
            />
            <button
              className="btn-primary text-xs px-5 py-2 flex items-center gap-1"
              onClick={handleNewQuestion}
              disabled={submitting || !newQuestion.trim()}
              data-testid="btn-submit-question"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              ENVIAR PREGUNTA
            </button>
          </div>
        )}

        {/* Questions list */}
        <div data-testid="questions-list">
          {questions.length === 0 ? (
            <div className="text-center py-16" style={{ background: 'var(--surface-1)' }}>
              <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
              <p className="font-semibold" style={{ color: 'var(--outline)' }}>
                {isBuyer ? 'Aun no has hecho preguntas' : 'No hay preguntas en esta conversacion'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--outline-variant)' }}>
                {isBuyer ? 'Escribe tu primera pregunta arriba' : 'El buyer aun no ha enviado preguntas'}
              </p>
            </div>
          ) : (
            questions.map((q) => (
              <QuestionCard
                key={q.qa_item_id}
                question={q}
                isSeller={isSeller}
                onAnswer={handleAnswer}
                onClose={handleClose}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ConversationPage;
