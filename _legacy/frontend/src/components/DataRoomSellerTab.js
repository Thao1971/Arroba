import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { dataroomAPI, engagementsAPI } from '../services/api';
import {
  Upload, FolderOpen, FileText, Trash2, Download, Loader2, Eye,
  Shield, Users, Clock, ChevronDown, ChevronRight, Check, X
} from 'lucide-react';

const FOLDER_META = {
  financiero: { name: 'Financiero', subs: ['P&L', 'Balance', 'Cash Flow', 'KPIs'] },
  legal: { name: 'Legal', subs: ['Estatutos', 'Contratos relevantes', 'Cap table'] },
  fiscal: { name: 'Fiscal', subs: ['Impuestos', 'Declaraciones'] },
  comercial: { name: 'Comercial', subs: ['Clientes', 'Pipeline', 'Contratos comerciales'] },
  operaciones: { name: 'Operaciones', subs: ['Procesos', 'Proveedores'] },
  equipo: { name: 'Equipo (RRHH)', subs: ['Organigrama', 'Contratos clave'] },
  otros: { name: 'Otros', subs: [] },
};

const ALL_FOLDER_IDS = Object.keys(FOLDER_META);

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// ===== SELLER DATA ROOM TAB =====
const DataRoomSellerTab = ({ deal }) => {
  const [docs, setDocs] = useState({});
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('financiero');
  const [selectedSub, setSelectedSub] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['financiero']));
  const [activeView, setActiveView] = useState('files'); // files | permissions | tracking
  const fileInputRef = useRef(null);

  const loadDocs = async () => {
    try {
      const res = await dataroomAPI.listDocuments(deal.deal_id);
      setDocs(res.data.folders || {});
      setTotalDocs(res.data.total_documents || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadDocs(); }, [deal.deal_id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Archivo demasiado grande (máximo 50MB)');
      return;
    }
    setUploading(true); setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', selectedFolder);
      formData.append('subcategory', selectedSub);
      await dataroomAPI.uploadDocument(deal.deal_id, formData);
      await loadDocs();
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Error al subir archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      await dataroomAPI.deleteDocument(docId);
      await loadDocs();
    } catch {}
  };

  const handleDownload = async (doc) => {
    try {
      const res = await dataroomAPI.downloadDocument(doc.document_id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = doc.filename; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const toggleFolder = (fId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(fId) ? next.delete(fId) : next.add(fId);
      return next;
    });
  };

  return (
    <div data-testid="dataroom-seller">
      {/* Sub-navigation */}
      <div className="flex gap-4 mb-6 border-b border-slate-100 pb-3">
        {[
          { id: 'files', label: 'Documentos', icon: FolderOpen },
          { id: 'permissions', label: 'Permisos', icon: Shield },
          { id: 'tracking', label: 'Seguimiento', icon: Eye },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 text-sm pb-1 border-b-2 transition-colors ${
              activeView === v.id ? 'border-arroba-coral text-arroba-coral font-medium' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`} data-testid={`dataroom-view-${v.id}`}>
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
      </div>

      {activeView === 'files' && (
        <>
          {/* Upload section */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 mb-6" data-testid="upload-section">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex-1 grid sm:grid-cols-2 gap-2 w-full">
                <div>
                  <label className="text-xs uppercase tracking-wider text-slate-400 mb-1 block">Carpeta</label>
                  <Select value={selectedFolder} onValueChange={v => { setSelectedFolder(v); setSelectedSub(''); }}>
                    <SelectTrigger className="h-9 text-sm" data-testid="upload-folder-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_FOLDER_IDS.map(fId => (
                        <SelectItem key={fId} value={fId}>{FOLDER_META[fId].name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {FOLDER_META[selectedFolder]?.subs?.length > 0 && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-slate-400 mb-1 block">Subcategoría</label>
                    <Select value={selectedSub || "none"} onValueChange={v => setSelectedSub(v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9 text-sm" data-testid="upload-sub-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General</SelectItem>
                        {FOLDER_META[selectedFolder].subs.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" data-testid="file-input" />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="bg-arroba-coral hover:bg-arroba-coral/90 text-white h-9 text-sm" data-testid="upload-btn">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                  Subir documento
                </Button>
              </div>
            </div>
            {uploadError && <p className="text-red-500 text-xs mt-2" data-testid="upload-error">{uploadError}</p>}
          </div>

          {/* File tree */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-1" data-testid="file-tree">
              <p className="text-xs text-slate-400 mb-3">{totalDocs} documento{totalDocs !== 1 ? 's' : ''} en el Data Room</p>
              {ALL_FOLDER_IDS.map(fId => {
                const folderDocs = docs[fId] || [];
                const isExpanded = expandedFolders.has(fId);
                return (
                  <div key={fId} className="border border-slate-200 rounded-lg overflow-hidden" data-testid={`folder-${fId}`}>
                    <button onClick={() => toggleFolder(fId)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <FolderOpen className="w-4 h-4 text-arroba-coral" />
                        <span className="font-medium text-sm">{FOLDER_META[fId].name}</span>
                      </div>
                      <span className="text-xs text-slate-400">{folderDocs.length} archivo{folderDocs.length !== 1 ? 's' : ''}</span>
                    </button>
                    {isExpanded && folderDocs.length > 0 && (
                      <div className="border-t border-slate-100">
                        {folderDocs.map(doc => (
                          <div key={doc.document_id} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm" data-testid={`doc-${doc.document_id}`}>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-700">{doc.filename}</p>
                                <p className="text-xs text-slate-400">{formatSize(doc.size)}{doc.subcategory ? ` · ${doc.subcategory}` : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-slate-100 rounded" title="Descargar">
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                              <button onClick={() => handleDelete(doc.document_id)} className="p-1.5 hover:bg-red-50 rounded" title="Eliminar">
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExpanded && folderDocs.length === 0 && (
                      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400 italic">Sin documentos</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeView === 'permissions' && <PermissionsView dealId={deal.deal_id} />}
      {activeView === 'tracking' && <TrackingView dealId={deal.deal_id} />}
    </div>
  );
};

// ===== PERMISSIONS VIEW =====
const PermissionsView = ({ dealId }) => {
  const [perms, setPerms] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Get existing permissions
        const permRes = await dataroomAPI.getPermissions(dealId);
        setPerms(permRes.data.permissions || []);
        // Get buyers with NDA (from engagements)
        const engRes = await engagementsAPI.listDealEngagements(dealId);
        setBuyers(engRes.data?.engagements?.map(e => ({
          buyer_id: e.buyer_id,
          buyer_name: e.buyer_name || 'Comprador',
          buyer_type: e.buyer_type,
        })) || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [dealId]);

  const getPermForBuyer = (buyerId) => perms.find(p => p.buyer_id === buyerId);

  const toggleFolderAccess = async (buyerId, folderId) => {
    setSaving(buyerId);
    const existing = getPermForBuyer(buyerId);
    let currentFolders = existing?.allowed_folders || null;
    
    if (currentFolders === null) {
      // Currently full access → restrict to all except this folder
      currentFolders = ALL_FOLDER_IDS.filter(f => f !== folderId);
    } else if (currentFolders.includes(folderId)) {
      currentFolders = currentFolders.filter(f => f !== folderId);
    } else {
      currentFolders = [...currentFolders, folderId];
    }

    // If all folders selected, set to null (full access)
    if (currentFolders.length === ALL_FOLDER_IDS.length) currentFolders = null;

    try {
      await dataroomAPI.setPermissions(dealId, buyerId, currentFolders);
      const permRes = await dataroomAPI.getPermissions(dealId);
      setPerms(permRes.data.permissions || []);
    } catch {} finally { setSaving(''); }
  };

  const setFullAccess = async (buyerId) => {
    setSaving(buyerId);
    try {
      await dataroomAPI.setPermissions(dealId, buyerId, null);
      const permRes = await dataroomAPI.getPermissions(dealId);
      setPerms(permRes.data.permissions || []);
    } catch {} finally { setSaving(''); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const allBuyerIds = [...new Set([...buyers.map(b => b.buyer_id), ...perms.map(p => p.buyer_id)])];

  return (
    <div data-testid="permissions-view">
      <p className="text-sm text-slate-500 mb-4">Controla qué carpetas puede ver cada comprador. Por defecto, todos los compradores con NDA tienen acceso completo.</p>
      {allBuyerIds.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Users className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No hay compradores con acceso aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allBuyerIds.map(buyerId => {
            const buyer = buyers.find(b => b.buyer_id === buyerId) || perms.find(p => p.buyer_id === buyerId) || {};
            const perm = getPermForBuyer(buyerId);
            const allowedFolders = perm?.allowed_folders;
            const hasFullAccess = allowedFolders === null || allowedFolders === undefined;

            return (
              <div key={buyerId} className="border border-slate-200 rounded-lg p-4" data-testid={`perm-buyer-${buyerId}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">{buyer.buyer_name || buyer.buyer_email || buyerId}</p>
                    {buyer.buyer_email && <p className="text-xs text-slate-400">{buyer.buyer_email}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {saving === buyerId && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    <button onClick={() => setFullAccess(buyerId)}
                      className={`text-xs px-2 py-1 rounded ${hasFullAccess ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 hover:bg-green-50'}`}>
                      {hasFullAccess ? 'Acceso completo' : 'Dar acceso completo'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_FOLDER_IDS.map(fId => {
                    const hasAccess = hasFullAccess || (allowedFolders && allowedFolders.includes(fId));
                    return (
                      <button key={fId} onClick={() => toggleFolderAccess(buyerId, fId)}
                        className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                          hasAccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`} data-testid={`perm-${buyerId}-${fId}`}>
                        {hasAccess ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                        {FOLDER_META[fId].name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===== TRACKING VIEW =====
const TrackingView = ({ dealId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dataroomAPI.getAccessLog(dealId);
        setLogs(res.data.logs || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [dealId]);

  const actionLabels = {
    VIEW: { label: 'Visualizó', color: 'text-blue-600' },
    DOWNLOAD: { label: 'Descargó', color: 'text-green-600' },
    DATA_ROOM_ACCESSED: { label: 'Accedió al Data Room', color: 'text-slate-600' },
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div data-testid="tracking-view">
      <p className="text-sm text-slate-500 mb-4">Actividad de compradores en tu Data Room. Detecta interés real por la frecuencia de acceso.</p>
      {logs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No hay actividad registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => {
            const actionMeta = actionLabels[log.action] || { label: log.action, color: 'text-slate-600' };
            return (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-slate-50" data-testid={`log-${i}`}>
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p>
                    <span className="font-medium">{log.buyer_name}</span>
                    {' '}
                    <span className={actionMeta.color}>{actionMeta.label}</span>
                    {log.document_name && (
                      <> — <span className="text-slate-600">{log.document_name}</span></>
                    )}
                  </p>
                  {log.folder && <p className="text-xs text-slate-400">Carpeta: {FOLDER_META[log.folder]?.name || log.folder}</p>}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataRoomSellerTab;
