'use client';
import { type ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

/** Square avatar tile with the Copilot's ✦ spark glyph (port of CopilotAvatar). */
export function CopilotAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm"
    >
      <div
        className="w-full h-full rounded-[10px] flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
      >
        <Sparkles size={size * 0.5} strokeWidth={1.5} className="text-primary" />
      </div>
    </div>
  );
}

export function CopilotBubble({
  children,
  fadeIn,
  showName = true,
}: {
  children: ReactNode;
  fadeIn?: boolean;
  showName?: boolean;
}) {
  return (
    <div
      className={
        'flex gap-3 items-start ' + (fadeIn ? 'animate-[journeyIn_.4s_ease_both]' : '')
      }
      data-testid="journey-copilot-bubble"
    >
      <CopilotAvatar />
      <div className="flex-1 min-w-0 pt-0.5">
        {showName && (
          <div className="text-[10.5px] font-bold tracking-[0.06em] uppercase text-primary mb-1 inline-flex items-center gap-1">
            Arroba Copilot <Sparkles size={9} strokeWidth={1.5} />
          </div>
        )}
        <div className="text-[16.5px] text-text leading-relaxed font-body">{children}</div>
      </div>
    </div>
  );
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex justify-end animate-[journeyIn_.3s_ease_both]"
      data-testid="journey-user-bubble"
    >
      <div
        className="max-w-[82%] bg-primary text-white text-[14.5px] font-medium leading-snug px-4 py-2.5 rounded-[15px_15px_5px_15px]"
      >
        {children}
      </div>
    </div>
  );
}

export function Typing() {
  return (
    <div className="flex gap-3 items-center" data-testid="journey-typing-indicator">
      <CopilotAvatar />
      <div className="flex gap-1 px-1 py-2.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 150}ms` }}
            className="block w-1.5 h-1.5 rounded-full bg-text-subtle animate-[journeyBounce_1s_infinite_ease-in-out]"
          />
        ))}
      </div>
    </div>
  );
}
