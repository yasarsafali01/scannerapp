import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import * as MediaLibrary from "expo-media-library";

import { deleteScan, renameScan } from "../storage/history";
import { shareFile } from "../scanner/shareFile";
import { useI18n } from "../i18n/I18nContext";
import { useAppTheme } from "../theme/ThemeContext";

const DISPLAY_WIDTH = Dimensions.get("window").width - 32;

export default function ResultScreen({ route, navigation }) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { entry: initialEntry } = route.params;
  const [entry, setEntry] = useState(initialEntry);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(entry.name || "");
  const [activeIndex, setActiveIndex] = useState(0);
  const [savingAll, setSavingAll] = useState(false);

  const imageUris = entry.imageUris || (entry.imageUri ? [entry.imageUri] : []);
  const activeUri = imageUris[activeIndex] || imageUris[0];

  async function downloadAll() {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("common.permissionRequired"), t("result.galleryPermissionDenied"));
      return;
    }
    setSavingAll(true);
    try {
      for (const uri of imageUris) {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      Alert.alert(
        t("result.saved"),
        imageUris.length > 1 ? t("result.savedPages", imageUris.length) : t("result.savedPhoto")
      );
    } catch {
      Alert.alert(t("common.error"), t("result.saveError"));
    } finally {
      setSavingAll(false);
    }
  }

  function confirmDelete() {
    Alert.alert(t("result.deleteConfirmTitle"), t("result.deleteConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteScan(entry.id);
          navigation.goBack();
        },
      },
    ]);
  }

  async function saveRename() {
    const updated = await renameScan(entry.id, nameDraft);
    if (updated) setEntry(updated);
    setRenaming(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {entry.name || t("result.untitled")}
        </Text>
        <TouchableOpacity onPress={() => setRenaming(true)}>
          <Text style={styles.renameLink}>{t("result.rename")}</Text>
        </TouchableOpacity>
      </View>

      {imageUris.length > 1 && (
        <View style={styles.pageBadge}>
          <Text style={styles.pageBadgeText}>{t("result.pagesCount", imageUris.length)}</Text>
        </View>
      )}

      <Image source={{ uri: activeUri }} style={{ width: DISPLAY_WIDTH, aspectRatio: 3 / 4 }} resizeMode="contain" />

      {imageUris.length > 1 && (
        <FlatList
          data={imageUris}
          horizontal
          style={styles.thumbList}
          contentContainerStyle={styles.thumbListContent}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => setActiveIndex(index)}>
              <Image
                source={{ uri: item }}
                style={[styles.thumb, index === activeIndex && styles.thumbActive]}
              />
              <Text style={styles.thumbLabel}>{index + 1}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.downloads}>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => shareFile(activeUri)}>
          <Text style={styles.downloadBtnText}>
            {imageUris.length > 1 ? t("result.shareJpegPage", activeIndex + 1) : t("result.shareJpeg")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => shareFile(entry.pdfUri)}>
          <Text style={styles.downloadBtnText}>{t("result.sharePdf")}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.downloadAllBtn} onPress={downloadAll} disabled={savingAll}>
        {savingAll ? (
          <ActivityIndicator color={colors.accentDark} />
        ) : (
          <Text style={styles.downloadAllBtnText}>
            {imageUris.length > 1 ? t("result.downloadAllPhotos", imageUris.length) : t("result.downloadPhoto")}
          </Text>
        )}
      </TouchableOpacity>

      {entry.text !== null && entry.text !== undefined && (
        <View style={styles.ocrBox}>
          <Text style={styles.ocrTitle}>{t("result.detectedText")}</Text>
          <Text style={styles.ocrBody}>{entry.text || t("result.noTextFound")}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
        <Text style={styles.deleteBtnText}>{t("result.deleteButton")}</Text>
      </TouchableOpacity>

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("result.renameModalTitle")}</Text>
            <TextInput
              style={styles.modalInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder={t("result.renamePlaceholder")}
              placeholderTextColor={colors.textFaint}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenaming(false)}>
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveRename}>
                <Text style={styles.modalSaveText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    page: { padding: 16, paddingBottom: 60, backgroundColor: colors.background, alignItems: "center" },
    titleRow: { width: DISPLAY_WIDTH, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 17, fontWeight: "700", color: colors.text, flex: 1, marginRight: 8 },
    renameLink: { color: colors.accent, fontSize: 13, fontWeight: "600" },
    pageBadge: { alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
    pageBadgeText: { color: colors.accentDark, fontSize: 12, fontWeight: "600" },
    thumbList: { width: DISPLAY_WIDTH, marginTop: 10 },
    thumbListContent: { gap: 10 },
    thumb: { width: 56, height: 74, borderRadius: 6, backgroundColor: colors.border, borderWidth: 2, borderColor: "transparent" },
    thumbActive: { borderColor: colors.accent },
    thumbLabel: { textAlign: "center", fontSize: 10, color: colors.textMuted, marginTop: 2 },
    downloads: { flexDirection: "row", gap: 12, marginTop: 16, width: DISPLAY_WIDTH },
    downloadBtn: { flex: 1, backgroundColor: colors.accent, padding: 12, borderRadius: 8, alignItems: "center" },
    downloadBtnText: { color: "#fff", fontWeight: "600", textAlign: "center" },
    downloadAllBtn: { marginTop: 10, padding: 12, width: DISPLAY_WIDTH, alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: 8 },
    downloadAllBtnText: { color: colors.accentDark, fontWeight: "700" },
    ocrBox: { marginTop: 16, padding: 12, backgroundColor: colors.card, borderRadius: 8, width: DISPLAY_WIDTH, borderWidth: 1, borderColor: colors.border },
    ocrTitle: { fontWeight: "700", marginBottom: 6, color: colors.text },
    ocrBody: { color: colors.text },
    deleteBtn: { marginTop: 20, padding: 12, width: DISPLAY_WIDTH, alignItems: "center", backgroundColor: colors.dangerSoft, borderRadius: 8 },
    deleteBtnText: { color: colors.danger, fontWeight: "600" },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
    modalCard: { width: "100%", backgroundColor: colors.card, borderRadius: 12, padding: 16 },
    modalTitle: { fontWeight: "700", fontSize: 15, marginBottom: 10, color: colors.text },
    modalInput: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
    modalCancel: { paddingVertical: 8, paddingHorizontal: 12 },
    modalCancelText: { color: colors.textMuted, fontWeight: "600" },
    modalSave: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    modalSaveText: { color: "#fff", fontWeight: "700" },
  });
}
