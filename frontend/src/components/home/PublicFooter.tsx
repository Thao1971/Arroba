'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const SOURCE_LOGOS = [
  { name: 'INE', src: '/intake/logos/logo-ine.png' },
  { name: 'BOE · BORME', src: '/intake/logos/logo-boe.png' },
  { name: 'Banco de España', src: '/intake/logos/logo-bde.png' },
  { name: 'CNMV', src: '/intake/logos/logo-cnmv.png' },
  { name: 'Registradores', src: '/intake/logos/logo-registradores.png' },
  { name: 'Comercio Exterior', src: '/intake/logos/logo-comercio.png' },
  { name: 'Contratación Pública', src: '/intake/logos/logo-contratacion.png' },
];

/**
 * Public footer with institutional data-source logos. Logos are sourced from
 * `_design_intake/uploads/` (copied to /public/intake/logos/ at build time).
 */
export function PublicFooter() {
  return (
    <footer
      data-testid="public-footer"
      className="border-t border-border bg-surface"
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-primary mb-3">
            <Sparkles size={11} strokeWidth={1.5} /> Fuentes institucionales
          </p>
          <p className="text-sm text-text-muted max-w-2xl mx-auto leading-relaxed">
            Cruzamos datos oficiales del Estado y operadores económicos públicos
            para que cada decisión tenga trazabilidad y confianza.
          </p>
        </div>
        <ul
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6"
          data-testid="public-footer-logos"
        >
          {SOURCE_LOGOS.map((s) => (
            <li
              key={s.name}
              className="flex items-center gap-2.5"
              data-testid={`public-footer-logo-${slug(s.name)}`}
            >
              <Image
                src={s.src}
                alt={s.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain opacity-80"
              />
              <span className="text-xs text-text-subtle font-body">{s.name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-subtle">
          {/* HARDENING-030 · logo real ARROBA. */}
          <img src="/brand/logo.png" alt="arroba" className="h-6 w-auto" />
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-text">Acceder</Link>
            <Link href="/registro" className="hover:text-text">Crear cuenta</Link>
          </div>
          <span>© {new Date().getFullYear()} arroba.com</span>
        </div>
      </div>
    </footer>
  );
}

function slug(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
