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

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // If user data was passed from AuthCallback, use it immediately
  if (location.state?.user) {
    return children;
  }

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
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
    if (user?.role === 'advisor') return <Navigate to="/advisor/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/buyer/dashboard" replace />;
  }

  return children;
};

// App Router with session_id detection
const AppRouter = () => {
  const location = useLocation();

  // CRITICAL: Check URL fragment for session_id during render (NOT in useEffect)
  // This prevents race conditions with ProtectedRoute
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/marketplace/:dealId" element={<Marketplace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/pricing" element={<Home />} />
      <Route path="/about" element={<Home />} />

      {/* Buyer Routes */}
      <Route
        path="/buyer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'admin']}>
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/profile"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'admin']}>
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/processes"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'admin']}>
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Seller Routes */}
      <Route
        path="/seller/dashboard"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/onboarding"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/company/new"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/company/:companyId"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/deal/new"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/deal/:dealId"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Advisor Routes */}
      <Route
        path="/advisor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['advisor', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advisor/onboarding"
        element={
          <ProtectedRoute allowedRoles={['advisor', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Companies Route (for sellers/advisors) */}
      <Route
        path="/companies"
        element={
          <ProtectedRoute allowedRoles={['seller', 'advisor', 'admin']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
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
