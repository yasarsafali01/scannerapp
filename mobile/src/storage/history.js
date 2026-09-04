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

export async function saveScan({ image, pdf, text, mode }) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const dir = scansDir();

  const jpegFile = new File(dir, `${id}.jpg`);
  jpegFile.write(base64FromDataUri(image), { encoding: "base64" });

  const pdfFile = new File(dir, `${id}.pdf`);
  pdfFile.write(base64FromDataUri(pdf), { encoding: "base64" });

  const entry = {
    id,
    date: new Date().toISOString(),
    mode,
    text,
    imageUri: jpegFile.uri,
    pdfUri: pdfFile.uri,
  };

  const history = [entry, ...(await getHistory())].slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(history));
  return entry;
}

export async function deleteScan(id) {
  const history = await getHistory();
  const entry = history.find((e) => e.id === id);
  if (entry) {
    try {
      new File(entry.imageUri).delete();
    } catch {
      // dosya zaten silinmis olabilir
    }
    try {
      new File(entry.pdfUri).delete();
    } catch {
      // dosya zaten silinmis olabilir
    }
  }
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(history.filter((e) => e.id !== id)));
}
