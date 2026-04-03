interface LabelProps {
  index?: string;
  children: React.ReactNode;
}

export function Label({ index, children }: LabelProps) {
  return (
    <p className="font-mono text-[var(--color-accent)] text-xs tracking-[0.3em] uppercase mb-12 flex items-center gap-3">
      {index && <span className="text-[var(--color-muted)]">{index}</span>}
      {children}
    </p>
  );
}
