const KEY = "freescanner_history";
const MAX_ITEMS = 30;

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveScan({ images, pdf, text, mode, pageCount }) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
    image: images[0],
    images,
    pdf,
    text,
    mode,
    pageCount: pageCount || images.length,
    name: null,
  };

  const history = [entry, ...getHistory()].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    // storage kotasi dolmus olabilir; en eski yariyi at ve tekrar dene
    const trimmed = history.slice(0, Math.ceil(history.length / 2));
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch {
      // yine sigmiyorsa sessizce vazgec, taramanin kendisi zaten gosterildi
    }
  }
  return entry;
}

export function deleteScan(id) {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(KEY, JSON.stringify(history));
}

export function renameScan(id, name) {
  const trimmed = (name || "").trim();
  const history = getHistory().map((h) => (h.id === id ? { ...h, name: trimmed || null } : h));
  localStorage.setItem(KEY, JSON.stringify(history));
  return history.find((h) => h.id === id);
}
