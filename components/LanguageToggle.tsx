"use client";

import { useEffect, useSyncExternalStore } from "react";

type Language = "zh" | "en";

const STORAGE_KEY = "brand-archetypes-language";
const LANGUAGE_CHANGE_EVENT = "brand-archetypes-language-change";

function applyLanguage(language: Language) {
  document.documentElement.dataset.language = language;
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
}

function readStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "zh";
  }

  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
}

function readServerLanguage(): Language {
  return "zh";
}

function subscribeToLanguage(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

export function LanguageToggle() {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    readStoredLanguage,
    readServerLanguage,
  );

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  function chooseLanguage(nextLanguage: Language) {
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    applyLanguage(nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }

  return (
    <div
      className="flex items-center gap-2 pr-2 font-mono text-xs tracking-widest"
      aria-label="Language switcher"
      suppressHydrationWarning
    >
      <button
        className={`transition-colors duration-300 ${language === "zh" ? "text-[#e53935]" : "text-white hover:text-[#e53935]"}`}
        type="button"
        aria-pressed={language === "zh"}
        onClick={() => chooseLanguage("zh")}
      >
        中
      </button>
      <span className="text-white/20">/</span>
      <button
        className={`transition-colors duration-300 ${language === "en" ? "text-[#e53935]" : "text-white hover:text-[#e53935]"}`}
        type="button"
        aria-pressed={language === "en"}
        onClick={() => chooseLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
