import { useEffect, useMemo, useState } from "react";
import ShareButtons from "./scanner/ShareButtons.jsx";
import { deleteScan, getHistory, renameScan } from "./storage/history.js";

const MODE_LABELS = { bw: "Siyah-Beyaz", gray: "Gri Tonlama", color: "Renkli" };

export default function HistoryView() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setItems(getHistory());
  }, []);

  function openItem(item) {
    setSelected(item);
    setSelectedIndex(0);
  }

  function handleDelete(id) {
    deleteScan(id);
    setItems(getHistory());
    setSelected(null);
  }

  function handleRename(item) {
    const name = window.prompt("Tarama için bir isim girin:", item.name || "");
    if (name === null) return;
    const updated = renameScan(item.id, name);
    setItems(getHistory());
    if (updated) setSelected(updated);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const modeLabel = (MODE_LABELS[item.mode] || item.mode || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      const dateStr = new Date(item.date).toLocaleDateString("tr-TR");
      return name.includes(q) || modeLabel.includes(q) || dateStr.includes(q);
    });
  }, [items, query]);

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        </span>
        <p>Henüz kaydedilmiş taramanız yok.</p>
        <p className="hint-text">Bir belge taradığınızda burada listelenir.</p>
      </div>
    );
  }

  const selectedImages = selected ? selected.images || [selected.image] : [];
  const selectedImage = selectedImages[selectedIndex] || selectedImages[0];

  return (
    <div className="history-view">
      <div className="search-wrap">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          className="search-input"
          placeholder="Ara (isim, mod, tarih)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Sonuç bulunamadı.</p>
        </div>
      ) : (
        <div className="history-grid">
          {filtered.map((item) => (
            <button key={item.id} className="history-card" onClick={() => openItem(item)} type="button">
              <div className="history-thumb-wrap">
                <img src={item.image} alt="" />
                {item.pageCount > 1 && <span className="page-badge">{item.pageCount} sf</span>}
              </div>
              <span className="history-date">
                {item.name || new Date(item.date).toLocaleDateString("tr-TR")}
              </span>
              <span className="history-mode">{MODE_LABELS[item.mode] || item.mode}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} type="button" aria-label="Kapat">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <div className="modal-title-row">
              <h3>{selected.name || "Adsız Tarama"}</h3>
              <button className="link-btn" onClick={() => handleRename(selected)} type="button">
                Yeniden adlandır
              </button>
            </div>
            <img src={selectedImage} alt="" className="scanned" />
            {selectedImages.length > 1 && (
              <div className="page-strip">
                {selectedImages.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    className="page-thumb"
                    style={{ border: "none", padding: 0, cursor: "pointer" }}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <img
                      src={img}
                      alt={`Sayfa ${i + 1}`}
                      style={{ outline: i === selectedIndex ? "2px solid var(--accent)" : "none" }}
                    />
                    <span>{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
            <ShareButtons image={selectedImage} pdf={selected.pdf} images={selectedImages} />
            <button className="danger-btn full-width" onClick={() => handleDelete(selected.id)} type="button">
              Sil
            </button>
            {selected.text && (
              <div className="ocr-text">
                <h3>Algılanan Metin</h3>
                <pre>{selected.text}</pre>
              </div>
            )}
            <button className="secondary-btn full-width" onClick={() => setSelected(null)} type="button">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
