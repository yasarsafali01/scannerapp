async function dataUriToFile(dataUri, filename, mimeType) {
  const res = await fetch(dataUri);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
}

function downloadDataUri(dataUri, filename) {
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Cihaz paylaşım sayfasını (Web Share API) açar; dosya paylaşımı
 * desteklenmiyorsa (çoğu masaüstü tarayıcı) doğrudan indirmeye düşer.
 */
export async function shareOrDownload(dataUri, filename, mimeType) {
  try {
    const file = await dataUriToFile(dataUri, filename, mimeType);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return; // kullanıcı paylaşımı iptal etti
  }
  downloadDataUri(dataUri, filename);
}
