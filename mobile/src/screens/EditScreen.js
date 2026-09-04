import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

import { API_BASE_URL } from "../config";
import CornerEditor from "../scanner/CornerEditor";
import { saveScan } from "../storage/history";

const DISPLAY_WIDTH = Dimensions.get("window").width - 32;

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

export default function EditScreen({ route, navigation }) {
  const { asset } = route.params;
  const [corners, setCorners] = useState(() => defaultCorners(asset.width, asset.height));
  const [mode, setMode] = useState("bw");
  const [ocr, setOcr] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    setLoading(true);

    const formData = new FormData();
    formData.append("file", new File(asset.uri), "photo.jpg");
    formData.append("mode", mode);
    formData.append("ocr", String(ocr));
    formData.append("corners", JSON.stringify(corners));

    try {
      const res = await fetch(`${API_BASE_URL}/api/scan`, { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Tarama başarısız oldu.");
      }
      const data = await res.json();
      const entry = await saveScan({ image: data.image, pdf: data.pdf, text: data.text, mode });
      navigation.replace("Result", { entry });
    } catch (err) {
      Alert.alert("Hata", err.message || "Sunucuya bağlanılamadı. API adresini (src/config.js) kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <CornerEditor
        uri={asset.uri}
        naturalWidth={asset.width}
        naturalHeight={asset.height}
        displayWidth={DISPLAY_WIDTH}
        corners={corners}
        onChange={setCorners}
      />
      <Text style={styles.hint}>Köşeleri belgenin kenarlarına sürükleyin.</Text>

      <View style={styles.modes}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.mode, mode === m.value && styles.modeActive]}
            onPress={() => setMode(m.value)}
          >
            <Text style={mode === m.value ? styles.modeTextActive : styles.modeText}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.ocrRow}>
        <Text>Metni okunabilir hale getir (OCR)</Text>
        <Switch value={ocr} onValueChange={setOcr} />
      </View>

      <TouchableOpacity style={styles.scanBtn} onPress={handleScan} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanBtnText}>Tara</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 60, backgroundColor: "#f1f3f6" },
  hint: { color: "#777", marginTop: 8, marginBottom: 12, fontSize: 13 },
  modes: { flexDirection: "row", gap: 8, marginTop: 8 },
  mode: { flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: "#ccc", alignItems: "center" },
  modeActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  modeText: { color: "#333" },
  modeTextActive: { color: "#fff" },
  ocrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  scanBtn: { backgroundColor: "#16a34a", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 16 },
  scanBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
