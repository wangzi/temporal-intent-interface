"use client";

// Manual color-theme control (Light / Dark / Auto). Progressive enhancement:
// renders nothing until mounted, so JS-off readers never see a dead control and
// fall back to the system theme via @media (prefers-color-scheme) in globals.css.
// The choice is written to <html data-theme> (+ localStorage); a no-flash inline
// script in layout.tsx re-applies it before first paint. SSR/content is never
// gated on this — it only swaps token colors.

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

function applyTheme(t: Theme): void {
  const el = document.documentElement;
  try {
    if (t === "system") {
      delete el.dataset.theme;
      localStorage.removeItem("theme");
    } else {
      el.dataset.theme = t;
      localStorage.setItem("theme", t);
    }
  } catch {
    /* storage unavailable — the data-theme attribute still applies this session */
    if (t === "system") delete el.dataset.theme;
    else el.dataset.theme = t;
  }
}

function readTheme(): Theme {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`theme-toggle-opt${theme === o.value ? " on" : ""}`}
          aria-pressed={theme === o.value}
          onClick={() => {
            applyTheme(o.value);
            setTheme(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
