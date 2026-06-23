import Image from 'next/image';
import { cn } from '@/lib/cn';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

export interface AvatarProps {
  name?: string | null;
  src?: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 36, className }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? 'Avatar'}
        width={size}
        height={size}
        className={cn('rounded-full border border-border object-cover', className)}
      />
    );
  }
  return (
    <span
      aria-label={name ?? 'Avatar'}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-surface-2 text-text font-medium font-display border border-border',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}
