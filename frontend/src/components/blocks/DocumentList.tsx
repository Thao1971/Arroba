'use client';
/**
 * DocumentList — módulo canónico Documentación (ENTITY_FRAMEWORK §3.10).
 *
 * En Sprint 1 la lista puede venir vacía (upload no disponible aún). Si
 * llega vacía, mostramos EmptyStateBlock con CTA de subida deshabilitada.
 *
 * Estados canónicos:
 *   - data: lista de documentos con nombre, tamaño y fecha.
 *   - empty: EmptyStateBlock.
 *   - error: ErrorBlock.
 *   - loading: LoadingBlock (delegado al padre).
 */
import { FileText, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { EmptyStateBlock } from './EmptyStateBlock';
import { ErrorBlock } from './ErrorBlock';

export interface DocumentItem {
  doc_id: string;
  kind: 'memoria_mercantil' | 'cuentas_anuales' | 'teaser' | 'otro';
  display_name: string;
  size_bytes: number | null;
  uploaded_at: string | null;
  download_url: string | null;
}

export interface DocumentListProps {
  items: DocumentItem[];
  canUpload?: boolean;
  error?: { message: string } | null;
  className?: string;
  testId?: string;
}

function humanBytes(bytes: number | null): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function DocumentList({
  items,
  canUpload = false,
  error,
  className,
  testId = 'document-list',
}: DocumentListProps) {
  if (error) {
    return (
      <ErrorBlock
        testId={`${testId}-error`}
        title="No se pudieron cargar los documentos"
        message={error.message}
      />
    );
  }

  if (!items.length) {
    return (
      <EmptyStateBlock
        testId={`${testId}-empty`}
        icon={Upload}
        title="Aún no hay documentos"
        description="Sube memorias mercantiles, cuentas anuales u otros documentos relevantes de esta empresa."
        action={
          <button
            type="button"
            disabled
            aria-disabled="true"
            data-testid={`${testId}-upload-disabled`}
            title="La subida de documentos llegará en próximas versiones."
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2',
              'text-body-sm font-semibold border border-border-default',
              'text-text-muted bg-surface-muted',
              'cursor-not-allowed opacity-70',
            )}
          >
            <Upload size={16} /> Subir documento
          </button>
        }
      />
    );
  }

  void canUpload; // Sprint 1: upload aún no disponible.

  return (
    <ul
      data-testid={testId}
      className={cn('space-y-2', className)}
    >
      {items.map((doc) => (
        <li
          key={doc.doc_id}
          data-testid={`${testId}-item-${doc.doc_id}`}
          className={cn(
            'flex items-center gap-4 rounded-xl border border-border-default bg-surface p-3',
            'hover:bg-surface-muted/50 transition-colors duration-fast',
          )}
        >
          <div className="rounded-lg p-2 bg-surface-muted text-text-secondary shrink-0" aria-hidden>
            <FileText size={18} strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body font-medium text-text-primary truncate">
              {doc.display_name}
            </p>
            <p className="text-caption text-text-muted">
              {humanBytes(doc.size_bytes)}
              {doc.uploaded_at ? ` · ${formatDate(doc.uploaded_at)}` : ''}
            </p>
          </div>
          {doc.download_url && (
            <a
              href={doc.download_url}
              data-testid={`${testId}-download-${doc.doc_id}`}
              className="rounded-full p-2 hover:bg-surface-muted text-text-secondary"
              aria-label={`Descargar ${doc.display_name}`}
            >
              <Download size={16} strokeWidth={1.6} />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
