import { useEffect, useRef, useState } from "react";
import CornerEditor from "./scanner/CornerEditor.jsx";
import ProgressBar from "./scanner/ProgressBar.jsx";
import ShareButtons from "./scanner/ShareButtons.jsx";
import Stepper from "./scanner/Stepper.jsx";
import { defaultCorners } from "./scanner/cornerUtils.js";
import { rotateImageFile } from "./scanner/rotateImage.js";
import { uploadFormData } from "./scanner/uploadWithProgress.js";
import { getHistory, saveScan } from "./storage/history.js";

const MODES = [
  { value: "bw", label: "Siyah-Beyaz" },
  { value: "gray", label: "Gri Tonlama" },
  { value: "color", label: "Renkli" },
];

export default function ScannerView({ onOpenMulti }) {
  const galleryInputRef = useRef(null);

  const [totalCount, setTotalCount] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [corners, setCorners] = useState(null);
  const [mode, setMode] = useState("bw");
  const [ocr, setOcr] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setTotalCount(getHistory().length);
  }, []);

  function handleFileChange(e) {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = "";
    if (selectedFiles.length === 0) return;
    if (selectedFiles.length > 1) {
      onOpenMulti(selectedFiles);
      return;
    }
    const selected = selectedFiles[0];

    const url = URL.createObjectURL(selected);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      setFile(selected);
      setPreview(url);
      setNaturalSize({ width, height });
      setCorners(defaultCorners(width, height));
      setBrightness(0);
      setContrast(0);
      setResult(null);
      setError(null);
    };
    img.src = url;
  }

  async function rotateBy(degrees) {
    if (rotating || !file) return;
    setRotating(true);
    try {
      const rotated = await rotateImageFile(file, degrees);
      URL.revokeObjectURL(preview);
      const url = URL.createObjectURL(rotated.file);
      setFile(rotated.file);
      setPreview(url);
      setNaturalSize({ width: rotated.width, height: rotated.height });
      setCorners(defaultCorners(rotated.width, rotated.height));
    } catch {
      setError("Fotoğraf döndürülemedi.");
    } finally {
      setRotating(false);
    }
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
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    formData.append("ocr", String(ocr));
    formData.append("corners", JSON.stringify(corners));
    formData.append("brightness", String(brightness));
    formData.append("contrast", String(contrast));

    try {
      const data = await uploadFormData("/api/scan", formData, {
        onUploadProgress: setUploadProgress,
      });
      setResult(data);
      saveScan({ images: [data.image], pdf: data.pdf, text: data.text, mode });
      setTotalCount((c) => c + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="scanner-view">
      {!preview && (
        <>
          <div className="home-header">
            <div>
              <h2>Merhaba 👋</h2>
              <p className="hint-text">Belgelerinizi saniyeler içinde tarayıp dijitalleştirin.</p>
            </div>
            {totalCount > 0 && (
              <span className="stat-chip">
                <span className="stat-chip-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {totalCount} belge tarandı
              </span>
            )}
          </div>

          <div className="quick-actions">
            <button className="quick-action primary" onClick={() => galleryInputRef.current?.click()} type="button">
              <span className="quick-action-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="m3 16 5-5 4 4 4-4 5 5" />
                </svg>
              </span>
              <span className="quick-action-copy">
                <span>Galeriden Seç</span>
                <span className="quick-action-desc">Bir fotoğraf seçip taramaya başla</span>
              </span>
            </button>
            <button className="quick-action" onClick={onOpenMulti} type="button">
              <span className="quick-action-icon">
                <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="3" width="12" height="16" rx="2" />
                  <path d="M9 21h8a2 2 0 0 0 2-2V7" />
                </svg>
              </span>
              <span className="quick-action-copy">
                <span>Çoklu Sayfa Tara</span>
                <span className="quick-action-desc">Birden fazla sayfayı tek PDF yap</span>
              </span>
            </button>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
          </div>
        </>
      )}

      {preview && naturalSize && corners && !result && (
        <section className="card">
          <div className="card-header">
            <div className="card-header-title">
              <span className="card-header-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0 1 14-4.5M20 15a8 8 0 0 1-14 4.5" />
                </svg>
              </span>
              <h2>Köşeleri Ayarla</h2>
            </div>
            <button className="secondary-btn" onClick={reset} type="button">
              Vazgeç
            </button>
          </div>

          <div className="editor-frame">
            <CornerEditor
              imageUrl={preview}
              naturalWidth={naturalSize.width}
              naturalHeight={naturalSize.height}
              corners={corners}
              onChange={setCorners}
            />
          </div>
          <p className="hint-text">Köşeleri belgenin kenarlarına sürükleyerek düzeltebilirsiniz.</p>

          <p className="section-title">Döndür</p>
          <div className="rotate-row">
            <button type="button" className="secondary-btn" onClick={() => rotateBy(-90)} disabled={rotating}>
              ↺ Sola Döndür
            </button>
            <button type="button" className="secondary-btn" onClick={() => rotateBy(90)} disabled={rotating}>
              ↻ Sağa Döndür
            </button>
          </div>

          <p className="section-title">Ayarlar</p>
          <div className="adjust-box">
            <Stepper label="Parlaklık" value={brightness} onChange={setBrightness} />
            <Stepper label="Kontrast" value={contrast} onChange={setContrast} />
          </div>

          <div className="controls">
            <p className="section-title" style={{ margin: 0 }}>Mod</p>
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
              <button className="scan-btn" onClick={handleScan} disabled={loading} type="button">
                {loading ? "Taranıyor…" : "Tara"}
              </button>
            </div>
            {loading &&
              (uploadProgress < 1 ? (
                <ProgressBar progress={uploadProgress} label={`Yükleniyor %${Math.round(uploadProgress * 100)}`} />
              ) : (
                <ProgressBar progress={1} indeterminate label="İşleniyor…" />
              ))}
          </div>

          {error && <p className="error">{error}</p>}
        </section>
      )}

      {result && (
        <section className="card result">
          <div className="card-header">
            <div className="card-header-title">
              <span className="card-header-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h2>Sonuç</h2>
            </div>
            <button className="secondary-btn" onClick={reset} type="button">
              Yeni Tarama
            </button>
          </div>
          <img src={result.image} alt="taranmış belge" className="scanned" />

          <ShareButtons image={result.image} pdf={result.pdf} />

          {result.text !== null && (
            <div className="ocr-text">
              <h3>Algılanan Metin</h3>
              <pre>{result.text || "(metin bulunamadı)"}</pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
