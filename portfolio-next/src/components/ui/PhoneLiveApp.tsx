"use client";

interface PhoneLiveAppProps {
  /** Maquette locale (source du repo), ex. /demo-app/app.html — embed=1 évite GPS / pop-ups navigateur */
  url?: string;
  label?: string;
}

const APP_WIDTH = 390;
const APP_HEIGHT = 844;
const FRAME_W = 260;
const FRAME_H = Math.round((FRAME_W / APP_WIDTH) * APP_HEIGHT);
const SCALE = FRAME_W / APP_WIDTH;

const DEFAULT_DEMO_URL = "/demo-app/app.html?embed=1";

function iframeSrc(url: string) {
  if (!url.includes("/demo-app/app.html") || url.includes("embed=1")) return url;
  return url.includes("?") ? `${url}&embed=1` : `${url}?embed=1`;
}

export function PhoneLiveApp({ url = DEFAULT_DEMO_URL, label = "Maquette interactive" }: PhoneLiveAppProps) {
  const src = iframeSrc(url);
  return (
    <div className="flex flex-col items-center gap-5 w-full py-2">
      <div
        className="relative shadow-2xl shrink-0"
        style={{
          width: FRAME_W + 12,
          height: FRAME_H + 12,
          background: "#111",
          borderRadius: 20,
          padding: 6,
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="overflow-hidden bg-white"
          style={{ borderRadius: 14, width: FRAME_W, height: FRAME_H, position: "relative" }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 72,
              height: 20,
              background: "#000",
              borderRadius: 12,
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
          <iframe
            src={src}
            title={label}
            scrolling="yes"
            className="border-0"
            style={{
              width: APP_WIDTH,
              height: APP_HEIGHT,
              transform: `scale(${SCALE})`,
              transformOrigin: "0 0",
              pointerEvents: "auto",
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] shadow-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden />
        Maquette locale (code source) — pas le site public
      </div>
    </div>
  );
}
