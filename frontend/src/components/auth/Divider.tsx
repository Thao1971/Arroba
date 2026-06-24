/** Divider used in /login and /registro between Google and email form. */
export function OrDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 my-5">
      <span className="flex-1 h-px bg-border" />
      <span className="text-xs text-text-subtle font-body">{children}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}
