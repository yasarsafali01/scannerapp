import { useState } from "react";
import ScannerView from "./ScannerView.jsx";
import MultiScanView from "./MultiScanView.jsx";
import HistoryView from "./HistoryView.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import { I18nProvider, useI18n } from "./i18n/I18nContext.jsx";

function AppShell() {
  const { t } = useI18n();
  const [tab, setTab] = useState("scan");
  const [multiInitialFiles, setMultiInitialFiles] = useState(null);

  function openMulti(files) {
    setMultiInitialFiles(files || null);
    setTab("multiscan");
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
          </span>
          <div>
            <span className="brand-name">{t("appName")}</span>
            <span className="brand-tagline">Belge tarama ve dijitalleştirme</span>
          </div>
        </div>

        <LanguageSwitcher />

        <div className="header-actions">
          <nav className="main-nav">
            <button
              className={tab === "scan" || tab === "multiscan" ? "nav-link active" : "nav-link"}
              onClick={() => setTab("scan")}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {t("tabs.scan")}
            </button>
            <button
              className={tab === "history" ? "nav-link active" : "nav-link"}
              onClick={() => setTab("history")}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
              {t("tabs.history")}
            </button>
          </nav>

          <button className="header-cta secondary-btn" onClick={() => openMulti(null)} type="button">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="header-cta-label">{t("multiscan.newScan")}</span>
          </button>
        </div>
      </header>

      <main className="app-content">
        {tab === "scan" && <ScannerView onOpenMulti={openMulti} />}
        {tab === "multiscan" && (
          <MultiScanView
            initialFiles={multiInitialFiles}
            onDone={() => {
              setMultiInitialFiles(null);
              setTab("scan");
            }}
          />
        )}
        {tab === "history" && <HistoryView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}
