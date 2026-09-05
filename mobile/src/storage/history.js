import { Directory, File, Paths } from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INDEX_KEY = "freescanner_history_index";
const MAX_ITEMS = 100;

function base64FromDataUri(dataUri) {
  return dataUri.split(",")[1] ?? dataUri;
}

function scansDir() {
  const dir = new Directory(Paths.document, "scans");
  dir.create({ idempotent: true });
  return dir;
}

export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveScan({ images, pdf, text, mode, pageCount }) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const dir = scansDir();

  const imageUris = images.map((image, i) => {
    const jpegFile = new File(dir, `${id}-${i}.jpg`);
    jpegFile.write(base64FromDataUri(image), { encoding: "base64" });
    return jpegFile.uri;
  });

  const pdfFile = new File(dir, `${id}.pdf`);
  pdfFile.write(base64FromDataUri(pdf), { encoding: "base64" });

  const entry = {
    id,
    date: new Date().toISOString(),
    mode,
    text,
    imageUri: imageUris[0],
    imageUris,
    pdfUri: pdfFile.uri,
    pageCount: pageCount || imageUris.length,
    name: null,
  };

  const history = [entry, ...(await getHistory())].slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(history));
  return entry;
}

export async function renameScan(id, name) {
  const history = await getHistory();
  const trimmed = (name || "").trim();
  const next = history.map((e) => (e.id === id ? { ...e, name: trimmed || null } : e));
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(next));
  return next.find((e) => e.id === id);
}

export async function deleteScan(id) {
  const history = await getHistory();
  const entry = history.find((e) => e.id === id);
  if (entry) {
    const uris = entry.imageUris || (entry.imageUri ? [entry.imageUri] : []);
    for (const uri of uris) {
      try {
        new File(uri).delete();
      } catch {
        // dosya zaten silinmis olabilir
      }
    }
    try {
      new File(entry.pdfUri).delete();
    } catch {
      // dosya zaten silinmis olabilir
    }
  }
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(history.filter((e) => e.id !== id)));
}
