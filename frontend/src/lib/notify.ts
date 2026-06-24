/**
 * Lightweight in-page notifier — avoids pulling in `sonner` for E1.5.
 * Renders transient pill banners at the top of the viewport for ~3s.
 *
 * Shape mirrors the inline helper that already exists inside
 * `/app/frontend/src/app/[locale]/(authenticated)/w/[workspace_id]/page.tsx`
 * but exposed as a module so other surfaces (companies, etc.) can reuse it.
 *
 * Server-safe: no-ops when `window` is undefined.
 */
export type NotifyKind = 'success' | 'warn' | 'error' | 'info';

export interface NotifyParams {
  kind?: NotifyKind;
  text: string;
}

const HOST_ID = 'arroba-toast-host';

function ensureHost(): HTMLElement | null {
  if (typeof window === 'undefined') return null;
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('data-testid', 'arroba-toast-host');
    host.className =
      'fixed top-4 left-1/2 -translate-x-1/2 z-[1200] flex flex-col gap-2 items-center pointer-events-none';
    document.body.appendChild(host);
  }
  return host;
}

export function notify({ kind = 'info', text }: NotifyParams): void {
  const host = ensureHost();
  if (!host) return;
  const palette =
    kind === 'success'
      ? 'bg-success/95 text-white'
      : kind === 'warn'
      ? 'bg-warning/95 text-black'
      : kind === 'error'
      ? 'bg-danger/95 text-white'
      : 'bg-text/95 text-white';
  const node = document.createElement('div');
  node.className = `${palette} rounded-full px-4 py-2 text-sm font-medium shadow-lg pointer-events-auto`;
  node.setAttribute('data-testid', `arroba-toast-${kind}`);
  node.textContent = text;
  host.appendChild(node);
  window.setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity 200ms';
    window.setTimeout(() => node.remove(), 220);
  }, 3000);
}
