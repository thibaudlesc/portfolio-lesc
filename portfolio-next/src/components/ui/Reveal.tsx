"use client";

import { useInView } from "@/hooks/useInView";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 100 | 200 | 300 | 400 | 500;
}

const DELAY: Record<NonNullable<RevealProps["delay"]>, string> = {
  0:   "delay-[0ms]",
  100: "delay-[100ms]",
  200: "delay-[200ms]",
  300: "delay-[300ms]",
  400: "delay-[400ms]",
  500: "delay-[500ms]",
};

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.12 });

  return (
    <div
      ref={ref}
      className={[
        "transition-[opacity,translate] duration-700",
        DELAY[delay],
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
