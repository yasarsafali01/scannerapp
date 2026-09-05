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
import * as ImageManipulator from "expo-image-manipulator";

import { API_BASE_URL } from "../config";
import CornerEditor from "../scanner/CornerEditor";
import ProgressBar from "../scanner/ProgressBar";
import { defaultCorners } from "../scanner/cornerUtils";
import { uploadFormData } from "../scanner/uploadWithProgress";
import { saveScan } from "../storage/history";

const DISPLAY_WIDTH = Dimensions.get("window").width - 32;

const MODES = [
  { value: "bw", label: "Siyah-Beyaz" },
  { value: "gray", label: "Gri Tonlama" },
  { value: "color", label: "Renkli" },
];

function Stepper({ label, value, onChange, min = -50, max = 50, step = 10 }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EditScreen({ route, navigation }) {
  const [asset, setAsset] = useState(route.params.asset);
  const [corners, setCorners] = useState(() => defaultCorners(asset.width, asset.height));
  const [mode, setMode] = useState("bw");
  const [ocr, setOcr] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  async function rotateBy(degrees) {
    if (rotating) return;
    setRotating(true);
    try {
      const result = await ImageManipulator.manipulateAsync(asset.uri, [{ rotate: degrees }], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setAsset({ ...asset, uri: result.uri, width: result.width, height: result.height });
      setCorners(defaultCorners(result.width, result.height));
    } catch {
      Alert.alert("Hata", "Fotoğraf döndürülemedi.");
    } finally {
      setRotating(false);
    }
  }
  function rotateLeft() {
    rotateBy(-90);
  }
  function rotateRight() {
    rotateBy(90);
  }

  async function handleScan() {
    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: "photo.jpg", type: "image/jpeg" });
      formData.append("mode", mode);
      formData.append("ocr", String(ocr));
      formData.append("corners", JSON.stringify(corners));
      formData.append("brightness", String(brightness));
      formData.append("contrast", String(contrast));

      const data = await uploadFormData(`${API_BASE_URL}/api/scan`, formData, {
        onUploadProgress: setUploadProgress,
        timeoutMs: 120000,
      });
      const entry = await saveScan({ images: [data.image], pdf: data.pdf, text: data.text, mode });
      navigation.replace("Result", { entry });
    } catch (err) {
      Alert.alert("Tarama Başarısız", err.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} scrollEnabled={scrollEnabled}>
      <CornerEditor
        uri={asset.uri}
        naturalWidth={asset.width}
        naturalHeight={asset.height}
        displayWidth={DISPLAY_WIDTH}
        corners={corners}
        onChange={setCorners}
        onDragActive={(active) => setScrollEnabled(!active)}
      />
      <Text style={styles.hint}>Köşeleri belgenin kenarlarına sürükleyin.</Text>

      <View style={styles.rotateRow}>
        <TouchableOpacity style={styles.rotateBtn} onPress={rotateLeft} disabled={rotating}>
          <Text style={styles.rotateBtnText}>↺ Sola Döndür</Text>
        </TouchableOpacity>
        {rotating && <ActivityIndicator size="small" color="#1d4ed8" style={styles.rotateSpinner} />}
        <TouchableOpacity style={styles.rotateBtn} onPress={rotateRight} disabled={rotating}>
          <Text style={styles.rotateBtnText}>↻ Sağa Döndür</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.adjustBox}>
        <Stepper label="Parlaklık" value={brightness} onChange={setBrightness} />
        <Stepper label="Kontrast" value={contrast} onChange={setContrast} />
      </View>

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
      {loading &&
        (uploadProgress < 1 ? (
          <ProgressBar progress={uploadProgress} label={`Yükleniyor %${Math.round(uploadProgress * 100)}`} />
        ) : (
          <ProgressBar progress={1} indeterminate estimateSeconds={6} label="İşleniyor…" />
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 60, backgroundColor: "#f1f3f6" },
  hint: { color: "#777", marginTop: 8, marginBottom: 12, fontSize: 13 },
  rotateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rotateBtn: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, alignItems: "center" },
  rotateBtnText: { color: "#1d4ed8", fontWeight: "600", fontSize: 13 },
  rotateSpinner: { width: 44 },
  adjustBox: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, marginTop: 14 },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  stepperLabel: { color: "#374151", fontWeight: "600", fontSize: 13 },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  stepperBtnText: { color: "#1d4ed8", fontSize: 18, fontWeight: "700", lineHeight: 20 },
  stepperValue: { width: 36, textAlign: "center", fontWeight: "600", color: "#111" },
  modes: { flexDirection: "row", gap: 8, marginTop: 14 },
  mode: { flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: "#ccc", alignItems: "center" },
  modeActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  modeText: { color: "#333" },
  modeTextActive: { color: "#fff" },
  ocrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  scanBtn: { backgroundColor: "#16a34a", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 16 },
  scanBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
