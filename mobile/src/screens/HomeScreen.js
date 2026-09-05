import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getHistory } from "../storage/history";

const MODE_LABELS = { bw: "Siyah-Beyaz", gray: "Gri Tonlama", color: "Renkli" };

export default function HomeScreen({ navigation }) {
  const [recent, setRecent] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getHistory().then((history) => {
        setRecent(history.slice(0, 8));
        setTotalCount(history.length);
      });
    }, [])
  );

  async function pickFromLibrary() {
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
    if (res.canceled) return;
    if (res.assets.length > 1) {
      navigation.navigate("MultiScan", { initialAssets: res.assets });
    } else {
      navigation.navigate("Edit", { asset: res.assets[0] });
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Kamera erişim izni verilmedi.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) navigation.navigate("Edit", { asset: res.assets[0] });
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Merhaba 👋</Text>
        <Text style={styles.headerSubtitle}>
          {totalCount > 0 ? `Şimdiye kadar ${totalCount} belge taradınız.` : "Hadi ilk taramanızı yapın."}
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryAction} onPress={takePhoto} activeOpacity={0.85}>
        <Text style={styles.primaryIcon}>📷</Text>
        <Text style={styles.primaryActionText}>Kamerayla Tara</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryAction} onPress={pickFromLibrary} activeOpacity={0.85}>
        <Text style={styles.secondaryIcon}>🖼️</Text>
        <Text style={styles.secondaryActionText}>Galeriden Seç</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={() => navigation.navigate("MultiScan")}
        activeOpacity={0.85}
      >
        <Text style={styles.secondaryIcon}>📚</Text>
        <Text style={styles.secondaryActionText}>Çoklu Sayfa Tara</Text>
      </TouchableOpacity>

      {recent.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Taramalar</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Taramalarım")}>
              <Text style={styles.sectionLink}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recent}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentCard}
                onPress={() => navigation.navigate("Result", { entry: item })}
              >
                <Image source={{ uri: item.imageUri }} style={styles.recentThumb} />
                {item.pageCount > 1 && (
                  <View style={styles.recentBadge}>
                    <Text style={styles.recentBadgeText}>{item.pageCount} sf</Text>
                  </View>
                )}
                <Text style={styles.recentMode} numberOfLines={1}>
                  {item.name || MODE_LABELS[item.mode] || item.mode}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f1f3f6", padding: 16 },
  header: { marginTop: 4, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },
  headerSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 26,
    marginTop: 16,
  },
  primaryIcon: { fontSize: 24 },
  primaryActionText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryIcon: { fontSize: 20 },
  secondaryActionText: { fontSize: 16, fontWeight: "600", color: "#111" },
  recentSection: { marginTop: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionLink: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  recentCard: { width: 100, marginRight: 12 },
  recentThumb: { width: 100, height: 130, borderRadius: 10, backgroundColor: "#e5e7eb" },
  recentBadge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(29,78,216,0.9)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  recentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  recentMode: { fontSize: 11, color: "#2563eb", fontWeight: "600", marginTop: 4 },
});
