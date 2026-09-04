import { useRef, useState } from "react";
import CornerEditor from "./scanner/CornerEditor.jsx";
import ShareButtons from "./scanner/ShareButtons.jsx";
import { saveScan } from "./storage/history.js";

const MODES = [
  { value: "bw", label: "Siyah-Beyaz" },
  { value: "gray", label: "Gri Tonlama" },
  { value: "color", label: "Renkli" },
];

function defaultCorners(width, height) {
  const insetX = width * 0.08;
  const insetY = height * 0.08;
  return [
    { x: insetX, y: insetY },
    { x: width - insetX, y: insetY },
    { x: width - insetX, y: height - insetY },
    { x: insetX, y: height - insetY },
  ];
}

export default function ScannerView() {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [corners, setCorners] = useState(null);
  const [mode, setMode] = useState("bw");
  const [ocr, setOcr] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const url = URL.createObjectURL(selected);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      setFile(selected);
      setPreview(url);
      setNaturalSize({ width, height });
      setCorners(defaultCorners(width, height));
      setResult(null);
      setError(null);
    };
    img.src = url;
    e.target.value = "";
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setNaturalSize(null);
    setCorners(null);
    setResult(null);
    setError(null);
  }

  async function handleScan() {
    if (!file || !corners) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    formData.append("ocr", String(ocr));
    formData.append("corners", JSON.stringify(corners));

    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Tarama başarısız oldu.");
      }
      const data = await res.json();
      setResult(data);
      saveScan({ image: data.image, pdf: data.pdf, text: data.text, mode });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="scanner-view">
      {!preview && (
        <div className="quick-actions">
          <button className="quick-action primary" onClick={() => cameraInputRef.current?.click()} type="button">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <span>Kamerayla Tara</span>
          </button>
          <button className="quick-action" onClick={() => galleryInputRef.current?.click()} type="button">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="m3 16 5-5 4 4 4-4 5 5" />
            </svg>
            <span>Galeriden Seç</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            hidden
          />
          <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
        </div>
      )}

      {preview && naturalSize && corners && !result && (
        <section className="card">
          <CornerEditor
            imageUrl={preview}
            naturalWidth={naturalSize.width}
            naturalHeight={naturalSize.height}
            corners={corners}
            onChange={setCorners}
          />
          <p className="hint-text">Köşeleri belgenin kenarlarına sürükleyerek düzeltebilirsiniz.</p>

          <div className="controls">
            <div className="modes">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  className={mode === m.value ? "mode active" : "mode"}
                  onClick={() => setMode(m.value)}
                  type="button"
                >
                  {m.label}
                </button>
              ))}
            </div>

            <label className="ocr-toggle">
              <input type="checkbox" checked={ocr} onChange={(e) => setOcr(e.target.checked)} />
              Metni okunabilir hale getir (OCR)
            </label>

            <div className="edit-actions">
              <button className="secondary-btn" onClick={reset} type="button">
                Vazgeç
              </button>
              <button className="scan-btn" onClick={handleScan} disabled={loading} type="button">
                {loading ? "Taranıyor…" : "Tara"}
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
        </section>
      )}

      {result && (
        <section className="card result">
          <h2>Sonuç</h2>
          <img src={result.image} alt="taranmış belge" className="scanned" />

          <ShareButtons image={result.image} pdf={result.pdf} />

          {result.text !== null && (
            <div className="ocr-text">
              <h3>Algılanan Metin</h3>
              <pre>{result.text || "(metin bulunamadı)"}</pre>
            </div>
          )}

          <button className="secondary-btn full-width" onClick={reset} type="button">
            Yeni Tarama
          </button>
        </section>
      )}
    </div>
  );
}
