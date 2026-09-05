import { useState } from "react";
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

const DISPLAY_WIDTH = Dimensions.get("window").width - 32;

export default function ResultScreen({ route, navigation }) {
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
      Alert.alert("İzin gerekli", "Galeriye kaydetmek için izin verilmedi.");
      return;
    }
    setSavingAll(true);
    try {
      for (const uri of imageUris) {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      Alert.alert(
        "Kaydedildi",
        imageUris.length > 1 ? `${imageUris.length} sayfa galerinize kaydedildi.` : "Fotoğraf galerinize kaydedildi."
      );
    } catch {
      Alert.alert("Hata", "Fotoğraflar kaydedilirken bir sorun oluştu.");
    } finally {
      setSavingAll(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Taramayı sil", "Bu tarama kalıcı olarak silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
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
          {entry.name || "Adsız Tarama"}
        </Text>
        <TouchableOpacity onPress={() => setRenaming(true)}>
          <Text style={styles.renameLink}>Yeniden adlandır</Text>
        </TouchableOpacity>
      </View>

      {imageUris.length > 1 && (
        <View style={styles.pageBadge}>
          <Text style={styles.pageBadgeText}>{imageUris.length} sayfa</Text>
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
            {imageUris.length > 1 ? `Sayfa ${activeIndex + 1} JPEG Paylaş` : "JPEG Paylaş"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => shareFile(entry.pdfUri)}>
          <Text style={styles.downloadBtnText}>PDF Paylaş (tüm sayfalar)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.downloadAllBtn} onPress={downloadAll} disabled={savingAll}>
        {savingAll ? (
          <ActivityIndicator color="#1d4ed8" />
        ) : (
          <Text style={styles.downloadAllBtnText}>
            {imageUris.length > 1 ? `Tüm Fotoğrafları İndir (${imageUris.length})` : "Fotoğrafı İndir"}
          </Text>
        )}
      </TouchableOpacity>

      {entry.text !== null && entry.text !== undefined && (
        <View style={styles.ocrBox}>
          <Text style={styles.ocrTitle}>Algılanan Metin</Text>
          <Text>{entry.text || "(metin bulunamadı)"}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
        <Text style={styles.deleteBtnText}>Taramayı Sil</Text>
      </TouchableOpacity>

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Taramayı yeniden adlandır</Text>
            <TextInput
              style={styles.modalInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Örn. Kira Sözleşmesi"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenaming(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveRename}>
                <Text style={styles.modalSaveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 60, backgroundColor: "#f1f3f6", alignItems: "center" },
  titleRow: { width: DISPLAY_WIDTH, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: "#111", flex: 1, marginRight: 8 },
  renameLink: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  pageBadge: { alignSelf: "flex-start", backgroundColor: "#eef2ff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  pageBadgeText: { color: "#1d4ed8", fontSize: 12, fontWeight: "600" },
  thumbList: { width: DISPLAY_WIDTH, marginTop: 10 },
  thumbListContent: { gap: 10 },
  thumb: { width: 56, height: 74, borderRadius: 6, backgroundColor: "#e5e7eb", borderWidth: 2, borderColor: "transparent" },
  thumbActive: { borderColor: "#2563eb" },
  thumbLabel: { textAlign: "center", fontSize: 10, color: "#6b7280", marginTop: 2 },
  downloads: { flexDirection: "row", gap: 12, marginTop: 16, width: DISPLAY_WIDTH },
  downloadBtn: { flex: 1, backgroundColor: "#2563eb", padding: 12, borderRadius: 8, alignItems: "center" },
  downloadBtnText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  downloadAllBtn: { marginTop: 10, padding: 12, width: DISPLAY_WIDTH, alignItems: "center", backgroundColor: "#eef2ff", borderRadius: 8 },
  downloadAllBtnText: { color: "#1d4ed8", fontWeight: "700" },
  ocrBox: { marginTop: 16, padding: 12, backgroundColor: "#fff", borderRadius: 8, width: DISPLAY_WIDTH },
  ocrTitle: { fontWeight: "700", marginBottom: 6 },
  deleteBtn: { marginTop: 20, padding: 12, width: DISPLAY_WIDTH, alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 8 },
  deleteBtnText: { color: "#dc2626", fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  modalTitle: { fontWeight: "700", fontSize: 15, marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  modalCancel: { paddingVertical: 8, paddingHorizontal: 12 },
  modalCancelText: { color: "#6b7280", fontWeight: "600" },
  modalSave: { backgroundColor: "#2563eb", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  modalSaveText: { color: "#fff", fontWeight: "700" },
});
