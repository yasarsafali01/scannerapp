import { useI18n } from "../i18n/I18nContext.jsx";

export default function LanguageSwitcher() {
  const { lang, setLang, languages, t } = useI18n();
  const trOption = languages.find((l) => l.code === "tr");
  const otherOptions = languages.filter((l) => l.code !== "tr");
  const selectValue = lang !== "tr" ? lang : "";

  return (
    <div className="lang-switcher">
      <span className="lang-switcher-label">
        <span className="lang-switcher-label-icon">🌐</span>
        {t("language.selectPrompt")}
      </span>

      <button
        type="button"
        className={lang === "tr" ? "lang-quick-btn active" : "lang-quick-btn"}
        onClick={() => setLang("tr")}
      >
        <span className="lang-switcher-flag">{trOption?.flag}</span>
        {trOption?.name}
      </button>

      <div className="lang-select-wrap">
        <select
          className={lang !== "tr" ? "lang-select active" : "lang-select"}
          value={selectValue}
          onChange={(e) => setLang(e.target.value)}
          aria-label={t("language.label")}
        >
          <option value="" disabled>
            EN
          </option>
          {otherOptions.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.name}
            </option>
          ))}
        </select>
        <span className="lang-select-chevron">▾</span>
      </div>
    </div>
  );
}
