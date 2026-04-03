import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ hover = false, className = "", children, ...props }: GlassCardProps) {
  return (
    <div
      className={[
        "glass rounded-2xl",
        hover && "transition-colors duration-300 hover:border-[var(--color-accent)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
