import { useEffect, useMemo, useState } from "react";
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
import { useI18n } from "../i18n/I18nContext";
import { useAppTheme } from "../theme/ThemeContext";

const DISPLAY_WIDTH = Dimensions.get("window").width - 32;
const MAX_PAGES = 60;

export default function MultiScanScreen({ navigation, route }) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const MODES = [
    { value: "bw", label: t("modes.bw") },
    { value: "gray", label: t("modes.gray") },
    { value: "color", label: t("modes.color") },
  ];

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
      Alert.alert(t("common.error"), t("edit.rotateFailed"));
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
      Alert.alert(t("multiscan.pageLimitTitle"), t("multiscan.pageLimitMessage", MAX_PAGES));
      return;
    }
    let batch = assets;
    if (assets.length > remaining) {
      batch = assets.slice(0, remaining);
      Alert.alert(
        t("multiscan.pageLimitTitle"),
        t("multiscan.pageLimitMessagePartial", MAX_PAGES, assets.length, remaining)
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
      Alert.alert(t("common.permissionRequired"), t("home.cameraPermissionDenied"));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) beginEditing(res.assets[0]);
  }

  async function addFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("common.permissionRequired"), t("home.galleryPermissionDenied"));
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
      Alert.alert(t("edit.scanFailedTitle"), err.message || t("edit.unexpectedError"));
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
        <Text style={styles.hint}>{t("edit.dragCorners")}</Text>

        <View style={styles.rotateRow}>
          <TouchableOpacity style={styles.rotateBtn} onPress={() => rotateCurrentBy(-90)} disabled={rotating}>
            <Text style={styles.rotateBtnText}>{t("edit.rotateLeft")}</Text>
          </TouchableOpacity>
          {rotating && <ActivityIndicator size="small" color={colors.accentDark} style={styles.rotateSpinner} />}
          <TouchableOpacity style={styles.rotateBtn} onPress={() => rotateCurrentBy(90)} disabled={rotating}>
            <Text style={styles.rotateBtnText}>{t("edit.rotateRight")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.adjustBox}>
          <Stepper label={t("edit.brightness")} value={currentBrightness} onChange={setCurrentBrightness} />
          <Stepper label={t("edit.contrast")} value={currentContrast} onChange={setCurrentContrast} />
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={confirmPage}>
          <Text style={styles.confirmBtnText}>{t("multiscan.addThisPage")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={advanceQueue}>
          <Text style={styles.cancelBtnText}>
            {queue.length > 0 ? t("multiscan.skipThisPage") : t("common.cancel")}
          </Text>
        </TouchableOpacity>
        {queue.length > 0 && <Text style={styles.hint}>{t("multiscan.queueRemaining", queue.length)}</Text>}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {pages.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t("multiscan.noPagesYet")}</Text>
          <Text style={styles.emptyHint}>{t("multiscan.addPagesHint")}</Text>
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
              <Text style={styles.pageThumbLabel}>{t("multiscan.pageLabel", index + 1)}</Text>
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
          <Text style={styles.addBtnText}>{t("multiscan.addFromCamera")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, pages.length >= MAX_PAGES && styles.addBtnDisabled]}
          onPress={addFromLibrary}
          disabled={pages.length >= MAX_PAGES}
        >
          <Text style={styles.addBtnText}>{t("multiscan.addFromGallery")}</Text>
        </TouchableOpacity>
      </View>

      {pages.length > 0 && (
        <Text style={styles.pageCounter}>
          {t("multiscan.pageCounter", pages.length, MAX_PAGES)}
          {pages.length >= MAX_PAGES ? t("multiscan.pageLimitReachedSuffix") : ""}
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
            <Text style={styles.ocrLabel}>{t("edit.ocrLabel")}</Text>
            <Switch value={ocr} onValueChange={setOcr} />
          </View>

          <TouchableOpacity style={styles.finishBtn} onPress={finish} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.finishBtnText}>{t("multiscan.finishScan", pages.length)}</Text>
            )}
          </TouchableOpacity>
          {loading &&
            (uploadProgress < 1 ? (
              <ProgressBar progress={uploadProgress} label={`${t("edit.uploading")} %${Math.round(uploadProgress * 100)}`} />
            ) : (
              <ProgressBar
                progress={1}
                indeterminate
                estimateSeconds={estimateSeconds}
                label={t("multiscan.processingPages")}
              />
            ))}
        </>
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16 },
    page: { padding: 16, paddingBottom: 60, backgroundColor: colors.background },
    hint: { color: colors.textMuted, marginTop: 8, marginBottom: 12, fontSize: 13 },
    rotateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 },
    rotateBtn: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, padding: 10, alignItems: "center" },
    rotateBtnText: { color: colors.accentDark, fontWeight: "600", fontSize: 13 },
    rotateSpinner: { width: 44 },
    adjustBox: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 12 },
    confirmBtn: { backgroundColor: colors.success, padding: 14, borderRadius: 8, alignItems: "center", marginTop: 12 },
    confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: { padding: 12, alignItems: "center", marginTop: 8 },
    cancelBtnText: { color: colors.textMuted, fontWeight: "600" },
    emptyBox: { alignItems: "center", padding: 24, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
    emptyText: { fontSize: 15, color: colors.text, fontWeight: "600" },
    emptyHint: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center" },
    pageList: { gap: 12, paddingVertical: 4 },
    pageThumb: { width: 100 },
    pageThumbImg: { width: 100, height: 130, borderRadius: 8, backgroundColor: colors.border },
    pageThumbLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: "center" },
    pageRemove: { position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" },
    pageRemoveText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    addRow: { flexDirection: "row", gap: 8, marginTop: 16 },
    addBtn: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, padding: 12, alignItems: "center" },
    addBtnDisabled: { opacity: 0.4 },
    addBtnText: { color: colors.accentDark, fontWeight: "600", fontSize: 13 },
    pageCounter: { textAlign: "center", color: colors.textMuted, fontSize: 12, marginTop: 8 },
    modes: { flexDirection: "row", gap: 8, marginTop: 16 },
    mode: { flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center" },
    modeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    modeText: { color: colors.text },
    modeTextActive: { color: "#fff" },
    ocrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
    ocrLabel: { color: colors.text, flex: 1, marginRight: 8 },
    finishBtn: { backgroundColor: colors.success, padding: 14, borderRadius: 8, alignItems: "center", marginTop: 16 },
    finishBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  });
}
