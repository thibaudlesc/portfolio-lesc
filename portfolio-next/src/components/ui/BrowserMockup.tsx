"use client";

interface BrowserMockupProps {
  url: string;
  title?: string;
}

export function BrowserMockup({ url, title }: BrowserMockupProps) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Browser chrome */}
      <div className="bg-[#f0ece4] border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3">
        {/* Traffic lights */}
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        {/* URL bar */}
        <div className="flex-1 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2 border border-[var(--color-border)] min-w-0">
          <svg className="w-3 h-3 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="text-xs text-[var(--color-muted)] truncate font-mono">{title ?? url}</span>
        </div>
      </div>
      {/* Iframe */}
      <div className="relative w-full" style={{ height: "480px" }}>
        <iframe
          src={url}
          title={title ?? url}
          className="w-full h-full border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
}
