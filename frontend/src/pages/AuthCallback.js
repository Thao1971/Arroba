import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { processGoogleSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL hash fragment
        const hash = location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/login?error=no_session');
          return;
        }

        // Exchange session_id for user data
        const user = await processGoogleSession(sessionId);

        // Redirect based on user role
        if (user.role === 'seller') {
          navigate('/seller/dashboard', { state: { user } });
        } else if (user.role === 'advisor') {
          navigate('/advisor/dashboard', { state: { user } });
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard', { state: { user } });
        } else {
          navigate('/buyer/dashboard', { state: { user } });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=auth_failed');
      }
    };

    processSession();
  }, [location.hash, navigate, processGoogleSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="auth-callback">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-arroba-coral mx-auto mb-4" />
        <p className="text-slate-600">Procesando autenticación...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
