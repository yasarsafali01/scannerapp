import { useEffect, useState } from "react";
import ShareButtons from "./scanner/ShareButtons.jsx";
import { deleteScan, getHistory } from "./storage/history.js";

const MODE_LABELS = { bw: "Siyah-Beyaz", gray: "Gri Tonlama", color: "Renkli" };

export default function HistoryView() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  function handleDelete(id) {
    deleteScan(id);
    setItems(getHistory());
    setSelected(null);
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>Henüz kaydedilmiş taramanız yok.</p>
        <p className="hint-text">Bir belge taradığınızda burada listelenir.</p>
      </div>
    );
  }

  return (
    <div className="history-view">
      <div className="history-grid">
        {items.map((item) => (
          <button key={item.id} className="history-card" onClick={() => setSelected(item)} type="button">
            <img src={item.image} alt="" />
            <span className="history-date">
              {new Date(item.date).toLocaleDateString("tr-TR")}{" "}
              {new Date(item.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="history-mode">{MODE_LABELS[item.mode] || item.mode}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <img src={selected.image} alt="" className="scanned" />
            <ShareButtons image={selected.image} pdf={selected.pdf} />
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
