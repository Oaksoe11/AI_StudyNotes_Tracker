"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = stored ? stored === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Use light mode" : "Use dark mode"}
      className={`grid place-items-center rounded-md border border-line bg-card text-ink shadow-sm transition hover:border-coral hover:text-coral ${
        compact ? "size-8" : "size-10"
      }`}
    >
      {isDark ? <Sun size={compact ? 15 : 17} /> : <Moon size={compact ? 15 : 17} />}
    </button>
  );
}
