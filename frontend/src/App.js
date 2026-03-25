import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import SellerWizard from './pages/SellerWizard';
import DealManagement from './pages/DealManagement';
import DealPage from './pages/DealPage';
import BuyerOnboarding from './pages/BuyerOnboarding';
import SavedDeals from './pages/SavedDeals';
import SellerInteresados from './pages/SellerInteresados';
import AdvisorMandatos from './pages/AdvisorMandatos';
// SellerWizardBoceto removed - merged into SellerWizard V2
import ConversationPage from './pages/ConversationPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles, skipOnboardingCheck }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (location.state?.user) return children;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arroba-coral"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'seller') return <Navigate to="/seller/deals" replace />;
    if (user?.role === 'advisor') return <Navigate to="/advisor/mandatos" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/buyer/procesos" replace />;
  }

  if (!skipOnboardingCheck && user?.role === 'buyer' && !user?.buyer_profile?.profile_complete) {
    return <Navigate to="/buyer/onboarding" replace />;
  }

  return children;
};

// App Router
const AppRouter = () => {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/explorar" element={<Marketplace />} />
      <Route path="/marketplace" element={<Navigate to="/explorar" replace />} />
      <Route path="/marketplace/:dealId" element={<DealPage />} />
      <Route path="/explorar/:dealId" element={<DealPage />} />
      <Route path="/vender" element={<Register role="seller" />} />
      <Route path="/como-funciona" element={<Home />} />
      {/* Boceto route removed - merged into SellerWizard V2 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Buyer Routes */}
      <Route path="/buyer/onboarding" element={<ProtectedRoute allowedRoles={['buyer', 'admin']} skipOnboardingCheck><BuyerOnboarding /></ProtectedRoute>} />
      <Route path="/buyer/procesos" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><BuyerDashboard /></ProtectedRoute>} />
      <Route path="/buyer/guardados" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><SavedDeals /></ProtectedRoute>} />
      <Route path="/buyer/dashboard" element={<Navigate to="/buyer/procesos" replace />} />
      <Route path="/buyer/profile" element={<Navigate to="/buyer/procesos" replace />} />
      <Route path="/buyer/processes" element={<Navigate to="/buyer/procesos" replace />} />

      {/* Seller Routes */}
      <Route path="/seller/deals" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><SellerDashboard /></ProtectedRoute>} />
      <Route path="/seller/interesados" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><SellerInteresados /></ProtectedRoute>} />
      <Route path="/seller/dashboard" element={<Navigate to="/seller/deals" replace />} />
      <Route path="/seller/onboarding" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><SellerWizard /></ProtectedRoute>} />
      <Route path="/seller/company/new" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><SellerWizard /></ProtectedRoute>} />
      <Route path="/seller/company/:companyId" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><SellerWizard /></ProtectedRoute>} />
      <Route path="/seller/deal/new" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><SellerWizard /></ProtectedRoute>} />
      <Route path="/seller/deal/:dealId" element={<ProtectedRoute allowedRoles={['seller', 'admin']}><DealManagement /></ProtectedRoute>} />

      {/* Q&A Workspace */}
      <Route path="/qa/:conversationId" element={<ProtectedRoute allowedRoles={['buyer', 'seller', 'admin']}><ConversationPage /></ProtectedRoute>} />

      {/* Advisor Routes */}
      <Route path="/advisor/mandatos" element={<ProtectedRoute allowedRoles={['advisor', 'admin']}><AdvisorMandatos /></ProtectedRoute>} />
      <Route path="/advisor/interesados" element={<ProtectedRoute allowedRoles={['advisor', 'admin']}><SellerInteresados /></ProtectedRoute>} />
      <Route path="/advisor/dashboard" element={<Navigate to="/advisor/mandatos" replace />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><BuyerDashboard /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
