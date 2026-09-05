import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = languages.find((l) => l.code === lang);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button type="button" className="lang-switcher-btn" onClick={() => setOpen((v) => !v)}>
        <span className="lang-switcher-flag">{current?.flag || "🏳️"}</span>
        <span className="lang-switcher-code">{(current?.code || "tr").toUpperCase()}</span>
      </button>
      {open && (
        <div className="lang-switcher-menu">
          {languages.map((l) => (
            <button
              type="button"
              key={l.code}
              className={l.code === lang ? "lang-switcher-item active" : "lang-switcher-item"}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              <span className="lang-switcher-flag">{l.flag}</span>
              <span>{l.name}</span>
              {l.code === lang && <span className="lang-switcher-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
