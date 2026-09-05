import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, translations } from "./translations.js";

const STORAGE_KEY = "freescanner_language";

const I18nContext = createContext(null);

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && translations[saved] ? saved : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.rtl ? "rtl" : "ltr";
  }, [lang, meta.rtl]);

  function setLang(code) {
    if (!translations[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // localStorage unavailable, ignore
    }
  }

  const value = useMemo(() => {
    const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
    function t(path, ...args) {
      const entry = getByPath(dict, path);
      if (typeof entry === "function") return entry(...args);
      if (typeof entry === "string") return entry;
      return path;
    }
    return { lang, setLang, t, isRTL: Boolean(meta.rtl), languages: LANGUAGES };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
