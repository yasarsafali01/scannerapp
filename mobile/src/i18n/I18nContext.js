import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

import { DEFAULT_LANGUAGE, LANGUAGES, translations } from "./translations";

const STORAGE_KEY = "freescanner_language";

const I18nContext = createContext(null);

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && translations[saved]) setLangState(saved);
      setReady(true);
    });
  }, []);

  function setLang(code) {
    if (!translations[code]) return;
    setLangState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
    const meta = LANGUAGES.find((l) => l.code === code);
    const shouldBeRtl = Boolean(meta?.rtl);
    if (I18nManager.isRTL !== shouldBeRtl) {
      // Full RTL mirroring of native layout requires an app reload to take
      // effect everywhere; text direction/translation still updates instantly.
      I18nManager.allowRTL(shouldBeRtl);
      I18nManager.forceRTL(shouldBeRtl);
    }
  }

  const value = useMemo(() => {
    const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    function t(path, ...args) {
      const entry = getByPath(dict, path);
      if (typeof entry === "function") return entry(...args);
      if (typeof entry === "string") return entry;
      return path;
    }
    return { lang, setLang, t, isRTL: Boolean(meta.rtl), languages: LANGUAGES, ready };
  }, [lang, ready]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
