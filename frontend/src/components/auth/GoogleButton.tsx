'use client';
import { useState, type ReactNode } from 'react';

/**
 * Emergent-managed Google OAuth launcher.
 *
 * STATUS E1.1: **DISABLED** — UI-only placeholder.
 * Per scope decision the Google OAuth wire-up is deferred to a later E1.x
 * sub-task. Backend already exposes POST /api/auth/session for the future
 * callback, but no /auth/callback page is shipped in E1.1. See
 * /app/backend/README.md → "Google OAuth · deferred wire-up".
 *
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS,
 * THIS BREAKS THE AUTH. (Kept here so any future agent wiring the real
 * launch builds the redirect from `window.location.origin + '/auth/callback'`
 * dynamically, never hard-coded.)
 */
export function GoogleButton({ children }: { children: ReactNode }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        disabled
        aria-disabled
        aria-describedby="google-oauth-tooltip"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        data-testid="google-oauth-button"
        className="w-full inline-flex items-center justify-center gap-2.5 h-12 rounded-[12px] border-[1.5px] border-border-strong bg-surface text-text-subtle font-body text-[14.5px] font-semibold cursor-not-allowed opacity-70"
      >
        <GoogleGlyph muted />
        {children}
      </button>
      {showTip && (
        <span
          id="google-oauth-tooltip"
          role="tooltip"
          data-testid="google-oauth-tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 px-2.5 py-1 rounded-md text-[11px] font-medium bg-text text-bg shadow-md"
        >
          Próximamente
        </span>
      )}
    </div>
  );
}

function GoogleGlyph({ muted }: { muted?: boolean }) {
  if (muted) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false" className="opacity-60">
        <path fill="currentColor" d="M21.6 12.2c0-.7-.06-1.37-.18-2H12v3.78h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 3-4.33 3-7.33Z" />
        <path fill="currentColor" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.23-2.52c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z" />
        <path fill="currentColor" d="M6.39 13.88a6.02 6.02 0 0 1 0-3.76V7.52H3.04a10 10 0 0 0 0 8.96l3.35-2.6Z" />
        <path fill="currentColor" d="M12 6.04c1.47 0 2.79.5 3.83 1.5l2.86-2.85A10 10 0 0 0 3.04 7.52l3.35 2.6C7.18 7.8 9.4 6.04 12 6.04Z" />
      </svg>
    );
  }
  return null;
}
