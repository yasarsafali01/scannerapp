import { useState } from "react";
import ScannerView from "./ScannerView.jsx";
import HistoryView from "./HistoryView.jsx";

export default function App() {
  const [tab, setTab] = useState("scan");

  return (
    <div className="app-shell">
      <header className="top-header">
        <h1>FreeScanner</h1>
      </header>

      <main className="app-content">{tab === "scan" ? <ScannerView /> : <HistoryView />}</main>

      <nav className="bottom-nav">
        <button className={tab === "scan" ? "nav-item active" : "nav-item"} onClick={() => setTab("scan")} type="button">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          <span>Tara</span>
        </button>
        <button
          className={tab === "history" ? "nav-item active" : "nav-item"}
          onClick={() => setTab("history")}
          type="button"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
          <span>Taramalarım</span>
        </button>
      </nav>
    </div>
  );
}
