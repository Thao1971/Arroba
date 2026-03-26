import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Only redirect to login for protected routes, not for public pages
      // Don't redirect if we're on public pages or already on auth pages
      const publicPaths = ['/', '/marketplace', '/explorar', '/pricing', '/planes', '/about', '/login', '/register', '/auth/callback', '/como-funciona', '/vender', '/valoracion'];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.some(path => 
        currentPath === path || currentPath.startsWith('/marketplace/') || currentPath.startsWith('/explorar/') || currentPath.startsWith('/boceto/')
      );
      
      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  processGoogleSession: (sessionId) => api.post('/auth/session', { session_id: sessionId }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  updateBuyerProfile: (data) => api.put('/users/me/buyer-profile', data),
  changeRole: (role) => api.put(`/users/me/role?role=${role}`),
};

// Marketplace API
export const marketplaceAPI = {
  listDeals: (params) => api.get('/marketplace/deals', { params }),
  getDealTeaser: (dealId) => api.get(`/marketplace/deals/${dealId}/teaser`),
  getSectors: () => api.get('/marketplace/sectors'),
  getStats: () => api.get('/marketplace/stats'),
  getFeaturedDeals: () => api.get('/marketplace/featured'),
};

// Companies API
export const companiesAPI = {
  create: (data) => api.post('/companies', data),
  list: () => api.get('/companies'),
  get: (companyId) => api.get(`/companies/${companyId}`),
  update: (companyId, data) => api.put(`/companies/${companyId}`, data),
  updateFinancials: (companyId, data) => api.post(`/companies/${companyId}/financials`, data),
  calculateValuation: (companyId) => api.post(`/companies/${companyId}/calculate-valuation`),
  getValuation: (companyId) => api.get(`/companies/${companyId}/valuation`),
};

// Deals API
export const dealsAPI = {
  create: (data) => api.post('/deals', data),
  list: (status) => api.get('/deals', { params: { status } }),
  get: (dealId) => api.get(`/deals/${dealId}`),
  update: (dealId, data) => api.put(`/deals/${dealId}`, data),
  activate: (dealId, force = false) => api.post(`/deals/${dealId}/activate?force=${force}`),
  readiness: (dealId) => api.get(`/deals/${dealId}/readiness`),
  health: (dealId) => api.get(`/deals/${dealId}/health`),
  requestAccess: (dealId) => api.post(`/deals/${dealId}/request-access`),
  approveAccess: (dealId, buyerId) => api.post(`/deals/${dealId}/approve-access/${buyerId}`),
  signNda: (dealId) => api.post(`/deals/${dealId}/sign-nda`),
  getInfomemo: (dealId) => api.get(`/deals/${dealId}/infomemo`),
  createShortlist: (dealId, buyerIds) => api.post(`/deals/${dealId}/shortlist`, buyerIds),
  grantExclusivity: (dealId, buyerId, days) => api.post(`/deals/${dealId}/grant-exclusivity/${buyerId}?days=${days}`),
  close: (dealId, data) => api.post(`/deals/${dealId}/close`, null, { params: data }),
  drop: (dealId, reason) => api.post(`/deals/${dealId}/drop`, null, { params: { reason } }),
  getDealPage: (dealId) => api.get(`/deals/${dealId}/page`),
  getActivationPreview: (dealId) => api.get(`/deals/${dealId}/activation-preview`),
  getFunnel: (dealId) => api.get(`/deals/${dealId}/funnel`),
};

// Infomemo API
export const infomemoAPI = {
  generate: (companyId) => api.post(`/infomemo/generate/${companyId}`),
  get: (dealId) => api.get(`/infomemo/${dealId}`),
  update: (dealId, content) => api.put(`/infomemo/${dealId}`, { content }),
};

// CIF Lookup API
export const cifAPI = {
  lookup: (cif) => api.get(`/cif/${cif}/lookup`),
};

// Teaser API
export const teaserAPI = {
  generate: (companyId) => api.post(`/teaser/generate/${companyId}`),
  get: (dealId) => api.get(`/teaser/${dealId}`),
  update: (dealId, data) => api.put(`/teaser/${dealId}`, data),
};

// Taxonomy API
export const taxonomyAPI = {
  getCategories: () => api.get('/taxonomy/categories'),
  getSubcategories: () => api.get('/taxonomy/subcategories'),
};

// Events API
export const eventsAPI = {
  trackTimeSpent: (dealId, seconds) => api.post(`/deals/${dealId}/track-time`, { seconds }),
};

// Engagements API
export const engagementsAPI = {
  submitInterest: (data) => api.post('/engagements/interest', data),
  upgradeToLoi: (engagementId, data) => api.post(`/engagements/${engagementId}/upgrade-to-loi`, data),
  getMyStatus: (dealId) => api.get(`/engagements/my-status/${dealId}`),
  listDealEngagements: (dealId) => api.get(`/engagements/deal/${dealId}`),
  acceptInterest: (dealId, buyerId) => api.post(`/engagements/deal/${dealId}/accept/${buyerId}`),
  shortlistBuyer: (dealId, buyerId) => api.post(`/engagements/deal/${dealId}/shortlist/${buyerId}`),
  removeFromShortlist: (dealId, buyerId) => api.delete(`/engagements/deal/${dealId}/shortlist/${buyerId}`),
  rejectBuyer: (dealId, buyerId) => api.post(`/engagements/deal/${dealId}/reject/${buyerId}`),
  grantExclusivity: (dealId, buyerId) => api.post(`/engagements/deal/${dealId}/exclusivity/${buyerId}`),
  saveDeal: (dealId) => api.post(`/engagements/save/${dealId}`),
  unsaveDeal: (dealId) => api.delete(`/engagements/save/${dealId}`),
  checkSaved: (dealId) => api.get(`/engagements/save/${dealId}/status`),
  listSaved: () => api.get('/engagements/saved'),
  getMyProcesses: () => api.get('/engagements/my-processes'),
};

// Matching API
export const matchingAPI = {
  getRecommendedDeals: () => api.get('/matching/deals'),
  getCompatibleBuyers: (dealId) => api.get(`/matching/buyers/${dealId}`),
  trackClick: (dealId) => api.post(`/matching/click/${dealId}`),
};

// Data Room API
export const dataroomAPI = {
  getFolders: () => api.get('/dataroom/folders'),
  uploadDocument: (dealId, formData) => api.post(`/dataroom/deals/${dealId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  listDocuments: (dealId) => api.get(`/dataroom/deals/${dealId}/documents`),
  deleteDocument: (docId) => api.delete(`/dataroom/documents/${docId}`),
  downloadDocument: (docId) => api.get(`/dataroom/documents/${docId}/download`, { responseType: 'blob' }),
  viewDocument: (docId) => api.get(`/dataroom/documents/${docId}/view`, { responseType: 'blob' }),
  getPermissions: (dealId) => api.get(`/dataroom/deals/${dealId}/permissions`),
  setPermissions: (dealId, buyerId, allowedFolders) => api.put(`/dataroom/deals/${dealId}/permissions/${buyerId}`, { allowed_folders: allowedFolders }),
  getAccessLog: (dealId) => api.get(`/dataroom/deals/${dealId}/access-log`),
};

// Notifications API
export const notificationsAPI = {
  list: (unreadOnly = false) => api.get(`/notifications?unread_only=${unreadOnly}`),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (notifId) => api.post(`/notifications/${notifId}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// Time Tracking & Intent API
export const trackingAPI = {
  recordTime: (dealId, section, durationSeconds, sessionId) =>
    api.post('/tracking/time', { deal_id: dealId, section, duration_seconds: durationSeconds, session_id: sessionId }),
  getBuyerTime: (dealId, buyerId) => api.get(`/tracking/time/${dealId}/${buyerId}`),
  getDealIntent: (dealId) => api.get(`/tracking/intent/${dealId}`),
  getBuyerIntent: (dealId, buyerId) => api.get(`/tracking/intent/${dealId}/${buyerId}`),
  getSuggestions: (dealId) => api.get(`/tracking/suggestions/${dealId}`),
};

// Coaching API
export const coachingAPI = {
  exclusivityCheck: (dealId, buyerId) => api.get(`/coaching/exclusivity-check/${dealId}/${buyerId}`),
  getDealNudges: (dealId) => api.get(`/coaching/nudges/deal/${dealId}`),
  getSellerNudges: () => api.get('/coaching/nudges'),
  getSellerInteresados: () => api.get('/engagements/seller/interesados'),
};

// Conversations Q&A API
export const conversationsAPI = {
  getForDeal: (dealId) => api.get(`/conversations/deal/${dealId}`),
  getMy: () => api.get('/conversations/my'),
  getPending: () => api.get('/conversations/pending/seller'),
  getOne: (conversationId) => api.get(`/conversations/${conversationId}`),
  createQuestion: (conversationId, content) => api.post(`/conversations/${conversationId}/questions`, { content }),
  createAnswer: (conversationId, questionId, content) => api.post(`/conversations/${conversationId}/answers?question_id=${questionId}`, { content }),
  closeQuestion: (conversationId, questionId) => api.post(`/conversations/${conversationId}/close/${questionId}`),
};

// Subscriptions API
export const subscriptionsAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  createCheckout: (planType) => api.post(`/subscriptions/create-checkout?plan_type=${planType}`),
  getCheckoutStatus: (sessionId) => api.get(`/subscriptions/checkout/status/${sessionId}`),
  getStatus: () => api.get('/subscriptions/status'),
  cancel: () => api.post('/subscriptions/cancel'),
};

// Valuation API
export const valuationAPI = {
  getCategories: () => api.get('/valuation/taxonomy/categories'),
  getSubcategories: (categoryId) => api.get(`/valuation/taxonomy/subcategories/${categoryId}`),
  getPublicConfig: () => api.get('/valuation/config/public'),
  estimate: (data) => api.post('/valuation/estimate', data),
  getMyValuations: () => api.get('/valuation/my-valuations'),
  getLead: (leadId) => api.get(`/valuation/lead/${leadId}`),
  requestPremium: (data) => api.post('/valuation/premium-request', data),
  sendResultEmail: (leadId) => api.post('/valuation/send-result-email', { lead_id: leadId }),
};

// Plans API
export const plansAPI = {
  getPublic: () => api.get('/plans/public'),
};

// NDA API
export const ndaAPI = {
  getTemplate: (dealId) => api.get(`/nda/template/${dealId}`),
  sign: (data) => api.post('/nda/sign', data),
  getPdf: (signatureId) => api.get(`/nda/${signatureId}/pdf`),
  sendEmail: (signatureId) => api.post(`/nda/${signatureId}/send-email`),
  mySignatures: () => api.get('/nda/my-signatures'),
};

// Buyer Certification API
export const buyerAPI = {
  getCertification: () => api.get('/buyer/certification'),
};

export default api;
