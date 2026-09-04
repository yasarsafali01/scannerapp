import { shareOrDownload } from "./shareFile.js";

export default function ShareButtons({ image, pdf }) {
  return (
    <div className="share-block">
      <div className="downloads">
        <button className="share-btn" onClick={() => shareOrDownload(image, "scanned.jpg", "image/jpeg")} type="button">
          JPEG Paylaş
        </button>
        <button className="share-btn" onClick={() => shareOrDownload(pdf, "scanned.pdf", "application/pdf")} type="button">
          PDF Paylaş
        </button>
      </div>
      <div className="plain-downloads">
        <a href={image} download="scanned.jpg">
          JPEG indir
        </a>
        <a href={pdf} download="scanned.pdf">
          PDF indir
        </a>
      </div>
    </div>
  );
}
