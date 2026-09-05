import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
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
import Stepper from "../scanner/Stepper";
import { defaultCorners } from "../scanner/cornerUtils";
import { uploadFormData } from "../scanner/uploadWithProgress";
import { saveScan } from "../storage/history";

const DISPLAY_WIDTH = Dimensions.get("window").width - 32;

const MODES = [
  { value: "bw", label: "Siyah-Beyaz" },
  { value: "gray", label: "Gri Tonlama" },
  { value: "color", label: "Renkli" },
];

const MAX_PAGES = 60;

export default function MultiScanScreen({ navigation, route }) {
  const [pages, setPages] = useState([]);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [currentCorners, setCurrentCorners] = useState(null);
  const [currentBrightness, setCurrentBrightness] = useState(0);
  const [currentContrast, setCurrentContrast] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [mode, setMode] = useState("bw");
  const [ocr, setOcr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const initialAssets = route?.params?.initialAssets;

  function beginEditing(asset) {
    setCurrent(asset);
    setCurrentCorners(defaultCorners(asset.width, asset.height));
    setCurrentBrightness(0);
    setCurrentContrast(0);
  }

  async function rotateCurrentBy(degrees) {
    if (rotating || !current) return;
    setRotating(true);
    try {
      const result = await ImageManipulator.manipulateAsync(current.uri, [{ rotate: degrees }], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setCurrent((c) => ({ ...c, uri: result.uri, width: result.width, height: result.height }));
      setCurrentCorners(defaultCorners(result.width, result.height));
    } catch {
      Alert.alert("Hata", "Fotoğraf döndürülemedi.");
    } finally {
      setRotating(false);
    }
  }

  // Bir seferde galeriden birden fazla foto seçilmiş olabilir; hepsini sırayla
  // köşe düzenlemesinden geçirmek için kuyruğa alıp birer birer işliyoruz.
  function startQueue(assets) {
    if (!assets || assets.length === 0) return;

    const remaining = MAX_PAGES - pages.length;
    if (remaining <= 0) {
      Alert.alert("Sayfa sınırına ulaşıldı", `Bir taramada en fazla ${MAX_PAGES} sayfa olabilir.`);
      return;
    }
    let batch = assets;
    if (assets.length > remaining) {
      batch = assets.slice(0, remaining);
      Alert.alert(
        "Sayfa sınırına ulaşıldı",
        `Bir taramada en fazla ${MAX_PAGES} sayfa olabilir. Seçtiğiniz ${assets.length} fotoğraftan ilk ${remaining} tanesi eklenecek.`
      );
    }

    const [first, ...rest] = batch;
    setQueue(rest);
    beginEditing(first);
  }

  function advanceQueue() {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      beginEditing(next);
    } else {
      setCurrent(null);
      setCurrentCorners(null);
    }
  }

  useEffect(() => {
    if (initialAssets && initialAssets.length > 0) startQueue(initialAssets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Kamera erişim izni verilmedi.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) beginEditing(res.assets[0]);
  }

  async function addFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Galeriye erişim izni verilmedi.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!res.canceled) startQueue(res.assets);
  }

  function confirmPage() {
    setPages((prev) => [
      ...prev,
      { asset: current, corners: currentCorners, brightness: currentBrightness, contrast: currentContrast },
    ]);
    advanceQueue();
  }

  function removePage(index) {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  // Sayfa basina tahmini isleme suresi OCR acikken cok daha uzun surer;
  // zaman asimini ve ilerleme yuzdesi tahminini buna gore olcekliyoruz.
  const perPageSeconds = ocr ? 8 : 2.5;
  const estimateSeconds = Math.max(6, Math.round(pages.length * perPageSeconds + 3));
  const processingTimeoutMs = Math.min(600000, Math.max(120000, estimateSeconds * 1000 * 3));

  async function finish() {
    if (pages.length === 0) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      pages.forEach((p, i) => {
        formData.append("files", { uri: p.asset.uri, name: `page-${i}.jpg`, type: "image/jpeg" });
      });
      formData.append("corners", JSON.stringify(pages.map((p) => p.corners)));
      formData.append("brightnesses", JSON.stringify(pages.map((p) => p.brightness || 0)));
      formData.append("contrasts", JSON.stringify(pages.map((p) => p.contrast || 0)));
      formData.append("mode", mode);
      formData.append("ocr", String(ocr));

      const data = await uploadFormData(`${API_BASE_URL}/api/scan/multi`, formData, {
        onUploadProgress: setUploadProgress,
        timeoutMs: processingTimeoutMs,
      });
      const entry = await saveScan({
        images: data.images,
        pdf: data.pdf,
        text: data.text,
        mode,
        pageCount: data.pageCount,
      });
      navigation.replace("Result", { entry });
    } catch (err) {
      Alert.alert("Tarama Başarısız", err.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  if (current) {
    return (
      <ScrollView contentContainerStyle={styles.page} scrollEnabled={scrollEnabled}>
        <CornerEditor
          uri={current.uri}
          naturalWidth={current.width}
          naturalHeight={current.height}
          displayWidth={DISPLAY_WIDTH}
          corners={currentCorners}
          onChange={setCurrentCorners}
          onDragActive={(active) => setScrollEnabled(!active)}
        />
        <Text style={styles.hint}>Köşeleri belgenin kenarlarına sürükleyin.</Text>

        <View style={styles.rotateRow}>
          <TouchableOpacity style={styles.rotateBtn} onPress={() => rotateCurrentBy(-90)} disabled={rotating}>
            <Text style={styles.rotateBtnText}>↺ Sola Döndür</Text>
          </TouchableOpacity>
          {rotating && <ActivityIndicator size="small" color="#1d4ed8" style={styles.rotateSpinner} />}
          <TouchableOpacity style={styles.rotateBtn} onPress={() => rotateCurrentBy(90)} disabled={rotating}>
            <Text style={styles.rotateBtnText}>↻ Sağa Döndür</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.adjustBox}>
          <Stepper label="Parlaklık" value={currentBrightness} onChange={setCurrentBrightness} />
          <Stepper label="Kontrast" value={currentContrast} onChange={setCurrentContrast} />
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={confirmPage}>
          <Text style={styles.confirmBtnText}>Bu Sayfayı Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={advanceQueue}>
          <Text style={styles.cancelBtnText}>{queue.length > 0 ? "Bu Sayfayı Atla" : "Vazgeç"}</Text>
        </TouchableOpacity>
        {queue.length > 0 && (
          <Text style={styles.hint}>Kuyrukta {queue.length} fotoğraf daha var.</Text>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {pages.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Henüz sayfa eklemediniz.</Text>
          <Text style={styles.emptyHint}>Birden fazla sayfayı tek bir PDF olarak taramak için sayfa ekleyin.</Text>
        </View>
      ) : (
        <FlatList
          data={pages}
          horizontal
          contentContainerStyle={styles.pageList}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <View style={styles.pageThumb}>
              <Image source={{ uri: item.asset.uri }} style={styles.pageThumbImg} />
              <Text style={styles.pageThumbLabel}>Sayfa {index + 1}</Text>
              <TouchableOpacity style={styles.pageRemove} onPress={() => removePage(index)}>
                <Text style={styles.pageRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={styles.addRow}>
        <TouchableOpacity
          style={[styles.addBtn, pages.length >= MAX_PAGES && styles.addBtnDisabled]}
          onPress={addFromCamera}
          disabled={pages.length >= MAX_PAGES}
        >
          <Text style={styles.addBtnText}>📷 Kamerayla Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, pages.length >= MAX_PAGES && styles.addBtnDisabled]}
          onPress={addFromLibrary}
          disabled={pages.length >= MAX_PAGES}
        >
          <Text style={styles.addBtnText}>🖼️ Galeriden Ekle</Text>
        </TouchableOpacity>
      </View>

      {pages.length > 0 && (
        <Text style={styles.pageCounter}>
          {pages.length} / {MAX_PAGES} sayfa
          {pages.length >= MAX_PAGES ? " — sayfa sınırına ulaşıldı" : ""}
        </Text>
      )}

      {pages.length > 0 && (
        <>
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

          <TouchableOpacity style={styles.finishBtn} onPress={finish} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.finishBtnText}>Taramayı Bitir ({pages.length} sayfa)</Text>
            )}
          </TouchableOpacity>
          {loading &&
            (uploadProgress < 1 ? (
              <ProgressBar progress={uploadProgress} label={`Yükleniyor %${Math.round(uploadProgress * 100)}`} />
            ) : (
              <ProgressBar
                progress={1}
                indeterminate
                estimateSeconds={estimateSeconds}
                label="Sayfalar işleniyor…"
              />
            ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f3f6", padding: 16 },
  page: { padding: 16, paddingBottom: 60, backgroundColor: "#f1f3f6" },
  hint: { color: "#777", marginTop: 8, marginBottom: 12, fontSize: 13 },
  rotateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 },
  rotateBtn: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, alignItems: "center" },
  rotateBtnText: { color: "#1d4ed8", fontWeight: "600", fontSize: 13 },
  rotateSpinner: { width: 44 },
  adjustBox: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, marginTop: 12 },
  confirmBtn: { backgroundColor: "#16a34a", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 12 },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: { padding: 12, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#6b7280", fontWeight: "600" },
  emptyBox: { alignItems: "center", padding: 24, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  emptyText: { fontSize: 15, color: "#374151", fontWeight: "600" },
  emptyHint: { fontSize: 13, color: "#6b7280", marginTop: 6, textAlign: "center" },
  pageList: { gap: 12, paddingVertical: 4 },
  pageThumb: { width: 100 },
  pageThumbImg: { width: 100, height: 130, borderRadius: 8, backgroundColor: "#e5e7eb" },
  pageThumbLabel: { fontSize: 11, color: "#6b7280", marginTop: 4, textAlign: "center" },
  pageRemove: { position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: "#dc2626", alignItems: "center", justifyContent: "center" },
  pageRemoveText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  addRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  addBtn: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, alignItems: "center" },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: "#1d4ed8", fontWeight: "600", fontSize: 13 },
  pageCounter: { textAlign: "center", color: "#6b7280", fontSize: 12, marginTop: 8 },
  modes: { flexDirection: "row", gap: 8, marginTop: 16 },
  mode: { flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: "#ccc", alignItems: "center" },
  modeActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  modeText: { color: "#333" },
  modeTextActive: { color: "#fff" },
  ocrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  finishBtn: { backgroundColor: "#16a34a", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 16 },
  finishBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
