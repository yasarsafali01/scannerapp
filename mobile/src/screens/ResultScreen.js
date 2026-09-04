import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";

import { deleteScan } from "../storage/history";
import { shareFile } from "../scanner/shareFile";

const DISPLAY_WIDTH = Dimensions.get("window").width - 32;

export default function ResultScreen({ route, navigation }) {
  const { entry } = route.params;

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

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Image
        source={{ uri: entry.imageUri }}
        style={{ width: DISPLAY_WIDTH, aspectRatio: 3 / 4 }}
        resizeMode="contain"
      />

      <View style={styles.downloads}>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => shareFile(entry.imageUri)}>
          <Text style={styles.downloadBtnText}>JPEG Paylaş</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => shareFile(entry.pdfUri)}>
          <Text style={styles.downloadBtnText}>PDF Paylaş</Text>
        </TouchableOpacity>
      </View>

      {entry.text !== null && entry.text !== undefined && (
        <View style={styles.ocrBox}>
          <Text style={styles.ocrTitle}>Algılanan Metin</Text>
          <Text>{entry.text || "(metin bulunamadı)"}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
        <Text style={styles.deleteBtnText}>Taramayı Sil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 60, backgroundColor: "#f1f3f6", alignItems: "center" },
  downloads: { flexDirection: "row", gap: 12, marginTop: 16, width: DISPLAY_WIDTH },
  downloadBtn: { flex: 1, backgroundColor: "#2563eb", padding: 12, borderRadius: 8, alignItems: "center" },
  downloadBtnText: { color: "#fff", fontWeight: "600" },
  ocrBox: { marginTop: 16, padding: 12, backgroundColor: "#fff", borderRadius: 8, width: DISPLAY_WIDTH },
  ocrTitle: { fontWeight: "700", marginBottom: 6 },
  deleteBtn: { marginTop: 20, padding: 12, width: DISPLAY_WIDTH, alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 8 },
  deleteBtnText: { color: "#dc2626", fontWeight: "600" },
});
