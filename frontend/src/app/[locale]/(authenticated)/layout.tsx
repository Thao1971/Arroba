import { ReactNode } from 'react';
import { AuthHeader } from '@/components/layout/AuthHeader';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  // Per-page guards (RequireAuth / role gates) live inside each page.tsx.
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <AuthHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
