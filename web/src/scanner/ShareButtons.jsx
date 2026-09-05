function downloadDataUri(dataUri, filename) {
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadAllImages(images) {
  images.forEach((img, i) => {
    setTimeout(() => downloadDataUri(img, `sayfa-${i + 1}.jpg`), i * 350);
  });
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 4v11m0 0-4-4m4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export default function ShareButtons({ image, pdf, images }) {
  const allImages = images && images.length > 1 ? images : null;

  return (
    <div className="share-block">
      <div className="downloads">
        <button className="share-btn" onClick={() => downloadDataUri(image, "scanned.jpg")} type="button">
          <DownloadIcon />
          JPEG İndir
        </button>
        <button className="share-btn" onClick={() => downloadDataUri(pdf, "scanned.pdf")} type="button">
          <DownloadIcon />
          PDF İndir
        </button>
      </div>
      {allImages && (
        <button className="secondary-btn full-width" onClick={() => downloadAllImages(allImages)} type="button">
          Tüm Fotoğrafları İndir ({allImages.length})
        </button>
      )}
    </div>
  );
}
