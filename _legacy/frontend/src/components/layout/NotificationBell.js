import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Bell, Download, FolderOpen, FileSignature, Send, Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_CONFIG = {
  DOCUMENT_DOWNLOADED: { icon: Download, label: 'descargó un documento', color: 'text-green-600', toast: true },
  DATA_ROOM_ACCESSED: { icon: FolderOpen, label: 'accedió al Data Room por primera vez', color: 'text-blue-600', toast: false },
  LOI_SUBMITTED: { icon: FileSignature, label: 'envió una LOI', color: 'text-arroba-coral', toast: true },
  INTEREST_SUBMITTED: { icon: Send, label: 'expresó interés', color: 'text-amber-600', toast: false },
  NDA_SIGNED: { icon: Shield, label: 'firmó el NDA', color: 'text-slate-600', toast: false },
};

const NotificationBell = () => {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const prevCountRef = useRef(0);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsAPI.unreadCount();
      const newCount = res.data.unread_count || 0;
      // Toast for new notifications (downloads + LOI)
      if (newCount > prevCountRef.current && prevCountRef.current > 0) {
        toast.info('Nueva actividad en tus deals', { duration: 3000 });
      }
      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch {}
  }, [isAuthenticated]);

  // Poll every 30s
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPanel = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setLoading(true);
      try {
        const res = await notificationsAPI.list();
        setNotifications(res.data.notifications || []);
      } catch {} finally { setLoading(false); }
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      await notificationsAPI.markRead(notifId);
      setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  if (!isAuthenticated || user?.role === 'buyer') return null;

  return (
    <div className="relative" ref={panelRef} data-testid="notification-bell">
      {/* Bell button */}
      <button onClick={openPanel}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        data-testid="notification-bell-btn">
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-arroba-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            data-testid="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden"
          data-testid="notification-panel">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-sm">Actividad</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead}
                  className="text-xs text-arroba-coral hover:underline" data-testid="mark-all-read-btn">
                  Marcar todo leído
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400 text-sm">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center" data-testid="no-notifications">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No hay actividad reciente</p>
              </div>
            ) : (
              notifications.map(notif => {
                const config = EVENT_CONFIG[notif.event_type] || { icon: Bell, label: notif.event_type, color: 'text-slate-600' };
                const Icon = config.icon;
                const groupLabel = notif.group_count > 1 ? ` (${notif.group_count}x)` : '';

                return (
                  <div key={notif.notification_id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 transition-colors hover:bg-slate-50 ${!notif.read ? 'bg-arroba-coral/5' : ''}`}
                    data-testid={`notif-${notif.notification_id}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.read ? 'bg-arroba-coral/10' : 'bg-slate-100'}`}>
                      <Icon className={`w-4 h-4 ${!notif.read ? config.color : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{notif.actor_name || 'Un comprador'}</span>
                        {' '}{config.label}{groupLabel}
                      </p>
                      {notif.metadata?.document_name && (
                        <p className="text-xs text-slate-400 truncate">{notif.metadata.document_name}</p>
                      )}
                      {notif.metadata?.valuation_offer && (
                        <p className="text-xs text-arroba-coral font-medium">{Number(notif.metadata.valuation_offer).toLocaleString('es-ES')}€</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {notif.created_at ? new Date(notif.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    {!notif.read && (
                      <button onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.notification_id); }}
                        className="p-1 hover:bg-slate-100 rounded flex-shrink-0" title="Marcar como leído">
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 text-center">
              <Link to="/seller/dashboard" onClick={() => setIsOpen(false)}
                className="text-xs text-arroba-coral hover:underline">
                Ver toda la actividad
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
