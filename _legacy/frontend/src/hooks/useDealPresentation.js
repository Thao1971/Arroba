import { useState, useEffect, useCallback } from 'react';
import { dealPresentationAPI } from '../services/api';
import api from '../services/api';

export function useDealPresentation(dealId) {
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [premiumAi, setPremiumAi] = useState(null);
  const [premiumAiLoading, setPremiumAiLoading] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dealPresentationAPI.getPresentation(dealId);
      setPresentation(res.data);

      // Async load premium AI if Pro+ with NDA
      if (res.data?.buyer_tier === 'pro+' && res.data?.has_nda) {
        setPremiumAiLoading(true);
        api.get(`/deals/${dealId}/premium-analysis`).then(aiRes => {
          setPremiumAi(aiRes.data);
        }).catch(() => {}).finally(() => setPremiumAiLoading(false));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar la presentacion');
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => { load(); }, [load]);

  const requestContact = async () => {
    setContactLoading(true);
    try {
      await dealPresentationAPI.requestContact(dealId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al solicitar contacto');
    } finally {
      setContactLoading(false);
    }
  };

  return { presentation, loading, error, contactLoading, requestContact, refresh: load, premiumAi, premiumAiLoading };
}
