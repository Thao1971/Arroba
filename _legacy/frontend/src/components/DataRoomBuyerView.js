import React, { useState, useEffect } from 'react';
import { dataroomAPI } from '../services/api';
import {
  FolderOpen, FileText, Download, Loader2, Lock, ChevronDown, ChevronRight, Eye
} from 'lucide-react';

const FOLDER_NAMES = {
  financiero: 'Financiero', legal: 'Legal', fiscal: 'Fiscal',
  comercial: 'Comercial', operaciones: 'Operaciones', equipo: 'Equipo (RRHH)', otros: 'Otros',
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const DataRoomBuyerView = ({ dealId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dataroomAPI.listDocuments(dealId);
        setData(res.data);
        // Auto-expand folders with documents
        const withDocs = Object.keys(res.data.folders || {}).filter(f => res.data.folders[f]?.length > 0);
        setExpandedFolders(new Set(withDocs));
      } catch (err) {
        if (err.response?.status === 403) {
          setError('No tienes acceso al Data Room');
        }
      } finally { setLoading(false); }
    };
    load();
  }, [dealId]);

  const handleDownload = async (doc) => {
    setDownloadingId(doc.document_id);
    try {
      const res = await dataroomAPI.downloadDocument(doc.document_id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = doc.filename; a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { setDownloadingId(null); }
  };

  const handleView = async (doc) => {
    try {
      const res = await dataroomAPI.viewDocument(doc.document_id);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch {}
  };

  const toggleFolder = (fId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(fId) ? next.delete(fId) : next.add(fId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center" data-testid="dataroom-no-access">
        <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data || data.total_documents === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center" data-testid="dataroom-empty">
        <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">El Data Room está vacío. El vendedor aún no ha subido documentos.</p>
      </div>
    );
  }

  const folders = data.folders || {};

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="dataroom-buyer">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="w-5 h-5 text-arroba-coral" />
        <h3 className="font-bold text-slate-900">Data Room</h3>
        <span className="text-xs text-slate-400 ml-auto">{data.total_documents} documento{data.total_documents !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-1">
        {Object.entries(folders).map(([fId, docs]) => {
          if (!docs || docs.length === 0) return null;
          const isExpanded = expandedFolders.has(fId);
          return (
            <div key={fId} className="border border-slate-100 rounded-lg overflow-hidden" data-testid={`buyer-folder-${fId}`}>
              <button onClick={() => toggleFolder(fId)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <FolderOpen className="w-4 h-4 text-arroba-coral" />
                  <span className="font-medium text-sm">{FOLDER_NAMES[fId] || fId}</span>
                </div>
                <span className="text-xs text-slate-400">{docs.length}</span>
              </button>
              {isExpanded && (
                <div className="border-t border-slate-50">
                  {docs.map(doc => (
                    <div key={doc.document_id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm"
                      data-testid={`buyer-doc-${doc.document_id}`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-slate-700">{doc.filename}</p>
                          <p className="text-xs text-slate-400">{formatSize(doc.size)}{doc.subcategory ? ` · ${doc.subcategory}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {doc.content_type?.startsWith('application/pdf') && (
                          <button onClick={() => handleView(doc)} className="p-1.5 hover:bg-slate-100 rounded" title="Ver">
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        )}
                        <button onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.document_id}
                          className="p-1.5 hover:bg-slate-100 rounded" title="Descargar">
                          {downloadingId === doc.document_id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                            : <Download className="w-3.5 h-3.5 text-arroba-coral" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataRoomBuyerView;
