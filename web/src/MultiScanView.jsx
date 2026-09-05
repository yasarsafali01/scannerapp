import { useEffect, useRef, useState } from "react";
import CornerEditor from "./scanner/CornerEditor.jsx";
import ProgressBar from "./scanner/ProgressBar.jsx";
import ShareButtons from "./scanner/ShareButtons.jsx";
import Stepper from "./scanner/Stepper.jsx";
import { defaultCorners } from "./scanner/cornerUtils.js";
import { rotateImageFile } from "./scanner/rotateImage.js";
import { uploadFormData } from "./scanner/uploadWithProgress.js";
import { saveScan } from "./storage/history.js";

const MODES = [
  { value: "bw", label: "Siyah-Beyaz" },
  { value: "gray", label: "Gri Tonlama" },
  { value: "color", label: "Renkli" },
];

const MAX_PAGES = 60;

export default function MultiScanView({ onDone, initialFiles }) {
  const galleryInputRef = useRef(null);

  const [pages, setPages] = useState([]);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [rotating, setRotating] = useState(false);
  const [mode, setMode] = useState("bw");
  const [ocr, setOcr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [resultIndex, setResultIndex] = useState(0);

  function loadAndEdit(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      setCurrent({
        file,
        previewUrl: url,
        width,
        height,
        corners: defaultCorners(width, height),
        brightness: 0,
        contrast: 0,
      });
    };
    img.src = url;
  }

  async function rotateCurrentBy(degrees) {
    if (rotating || !current) return;
    setRotating(true);
    try {
      const rotated = await rotateImageFile(current.file, degrees);
      URL.revokeObjectURL(current.previewUrl);
      const url = URL.createObjectURL(rotated.file);
      setCurrent((c) => ({
        ...c,
        file: rotated.file,
        previewUrl: url,
        width: rotated.width,
        height: rotated.height,
        corners: defaultCorners(rotated.width, rotated.height),
      }));
    } catch {
      window.alert("Fotoğraf döndürülemedi.");
    } finally {
      setRotating(false);
    }
  }

  // Galeriden birden fazla dosya seçilebilir; hepsini sırayla köşe
  // düzenlemesinden geçirmek için kuyruğa alıp birer birer işliyoruz.
  function startQueue(files) {
    if (!files || files.length === 0) return;

    const remaining = MAX_PAGES - pages.length;
    if (remaining <= 0) {
      window.alert(`Bir taramada en fazla ${MAX_PAGES} sayfa olabilir.`);
      return;
    }
    let batch = files;
    if (files.length > remaining) {
      batch = files.slice(0, remaining);
      window.alert(
        `Bir taramada en fazla ${MAX_PAGES} sayfa olabilir. Seçtiğiniz ${files.length} fotoğraftan ilk ${remaining} tanesi eklenecek.`
      );
    }

    const [first, ...rest] = batch;
    setQueue(rest);
    loadAndEdit(first);
  }

  function advanceQueue() {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      loadAndEdit(next);
    } else {
      setCurrent(null);
    }
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    startQueue(files);
  }

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) startQueue(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function confirmPage() {
    setPages((prev) => [...prev, current]);
    advanceQueue();
  }

  function removePage(index) {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  async function finish() {
    if (pages.length === 0) return;
    setLoading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    pages.forEach((p) => formData.append("files", p.file));
    formData.append("corners", JSON.stringify(pages.map((p) => p.corners)));
    formData.append("brightnesses", JSON.stringify(pages.map((p) => p.brightness || 0)));
    formData.append("contrasts", JSON.stringify(pages.map((p) => p.contrast || 0)));
    formData.append("mode", mode);
    formData.append("ocr", String(ocr));

    try {
      const data = await uploadFormData("/api/scan/multi", formData, {
        onUploadProgress: setUploadProgress,
      });
      setResult(data);
      setResultIndex(0);
      saveScan({ images: data.images, pdf: data.pdf, text: data.text, mode, pageCount: data.pageCount });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <section className="card result">
        <div className="card-header">
          <div className="card-header-title">
            <span className="card-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2>Sonuç ({result.pageCount} sayfa)</h2>
          </div>
          <button className="secondary-btn" onClick={onDone} type="button">
            Ana Sayfaya Dön
          </button>
        </div>
        <img src={result.images[resultIndex]} alt="taranmış belge" className="scanned" />
        {result.images.length > 1 && (
          <div className="page-strip">
            {result.images.map((img, i) => (
              <button
                type="button"
                key={i}
                className="page-thumb"
                style={{ border: "none", padding: 0, cursor: "pointer" }}
                onClick={() => setResultIndex(i)}
              >
                <img
                  src={img}
                  alt={`Sayfa ${i + 1}`}
                  style={{ outline: i === resultIndex ? "2px solid var(--accent)" : "none" }}
                />
                <span>{i + 1}</span>
              </button>
            ))}
          </div>
        )}
        <ShareButtons image={result.images[resultIndex]} pdf={result.pdf} images={result.images} />
        {result.text !== null && (
          <div className="ocr-text">
            <h3>Algılanan Metin</h3>
            <pre>{result.text || "(metin bulunamadı)"}</pre>
          </div>
        )}
      </section>
    );
  }

  if (current) {
    return (
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
          <button className="secondary-btn" onClick={advanceQueue} type="button">
            {queue.length > 0 ? "Bu Sayfayı Atla" : "Vazgeç"}
          </button>
        </div>

        <div className="editor-frame">
          <CornerEditor
            imageUrl={current.previewUrl}
            naturalWidth={current.width}
            naturalHeight={current.height}
            corners={current.corners}
            onChange={(corners) => setCurrent((c) => ({ ...c, corners }))}
          />
        </div>
        <p className="hint-text">Köşeleri belgenin kenarlarına sürükleyin.</p>
        {queue.length > 0 && <p className="hint-text">Kuyrukta {queue.length} fotoğraf daha var.</p>}

        <p className="section-title">Döndür</p>
        <div className="rotate-row">
          <button type="button" className="secondary-btn" onClick={() => rotateCurrentBy(-90)} disabled={rotating}>
            ↺ Sola Döndür
          </button>
          <button type="button" className="secondary-btn" onClick={() => rotateCurrentBy(90)} disabled={rotating}>
            ↻ Sağa Döndür
          </button>
        </div>

        <p className="section-title">Ayarlar</p>
        <div className="adjust-box">
          <Stepper
            label="Parlaklık"
            value={current.brightness}
            onChange={(v) => setCurrent((c) => ({ ...c, brightness: v }))}
          />
          <Stepper
            label="Kontrast"
            value={current.contrast}
            onChange={(v) => setCurrent((c) => ({ ...c, contrast: v }))}
          />
        </div>

        <div className="edit-actions">
          <button className="scan-btn" onClick={confirmPage} type="button">
            Bu Sayfayı Ekle
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-header-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="5" y="3" width="12" height="16" rx="2" />
              <path d="M9 21h8a2 2 0 0 0 2-2V7" />
            </svg>
          </span>
          <h2>Çoklu Sayfa Tara</h2>
        </div>
        <button className="secondary-btn" onClick={onDone} type="button">
          Vazgeç
        </button>
      </div>
      {pages.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 8 }}>
          <span className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="3" width="12" height="16" rx="2" />
              <path d="M9 21h8a2 2 0 0 0 2-2V7" />
            </svg>
          </span>
          <p>Henüz sayfa eklemediniz.</p>
          <p className="hint-text">Birden fazla sayfayı tek bir PDF olarak taramak için sayfa ekleyin.</p>
        </div>
      ) : (
        <div className="page-strip">
          {pages.map((p, i) => (
            <div className="page-thumb" key={i}>
              <img src={p.previewUrl} alt={`Sayfa ${i + 1}`} />
              <span>Sayfa {i + 1}</span>
              <button type="button" className="page-remove" onClick={() => removePage(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="edit-actions" style={{ marginTop: 16 }}>
        <button
          className="secondary-btn full-width"
          onClick={() => galleryInputRef.current?.click()}
          type="button"
          disabled={pages.length >= MAX_PAGES}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="m3 16 5-5 4 4 4-4 5 5" />
          </svg>
          Galeriden Ekle
        </button>
      </div>
      {pages.length > 0 && (
        <p className="hint-text" style={{ textAlign: "center" }}>
          {pages.length} / {MAX_PAGES} sayfa{pages.length >= MAX_PAGES ? " — sayfa sınırına ulaşıldı" : ""}
        </p>
      )}
      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} hidden />

      {pages.length > 0 && (
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

          <button className="scan-btn" onClick={finish} disabled={loading} type="button">
            {loading ? "Taranıyor…" : `Taramayı Bitir (${pages.length} sayfa)`}
          </button>
          {loading &&
            (uploadProgress < 1 ? (
              <ProgressBar progress={uploadProgress} label={`Yükleniyor %${Math.round(uploadProgress * 100)}`} />
            ) : (
              <ProgressBar progress={1} indeterminate label="Sayfalar işleniyor…" />
            ))}
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
