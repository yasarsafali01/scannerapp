import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { deleteScan, getHistory } from "../storage/history";

const MODE_LABELS = { bw: "Siyah-Beyaz", gray: "Gri Tonlama", color: "Renkli" };

export default function HistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setItems);
    }, [])
  );

  function confirmDelete(item) {
    Alert.alert("Taramayı sil", "Bu tarama kalıcı olarak silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteScan(item.id);
          setItems((prev) => prev.filter((e) => e.id !== item.id));
        },
      },
    ]);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const modeLabel = (MODE_LABELS[item.mode] || item.mode || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      const dateStr = new Date(item.date).toLocaleDateString("tr-TR");
      return name.includes(q) || modeLabel.includes(q) || dateStr.includes(q);
    });
  }, [items, query]);

  return (
    <View style={styles.container}>
      {items.length > 0 && (
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ara (isim, mod, tarih)"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Henüz kaydedilmiş taramanız yok.</Text>
          <Text style={styles.emptyHint}>Bir belge taradığınızda burada listelenir.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Result", { entry: item })}
              onLongPress={() => confirmDelete(item)}
            >
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
              {item.pageCount > 1 && (
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>{item.pageCount} sf</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={1}>
                {item.name || new Date(item.date).toLocaleDateString("tr-TR")}
              </Text>
              <Text style={styles.mode}>{MODE_LABELS[item.mode] || item.mode}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f3f6" },
  searchBox: { padding: 12, paddingBottom: 0 },
  searchInput: { backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111" },
  grid: { padding: 12, backgroundColor: "#f1f3f6" },
  row: { gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  thumb: { width: "100%", aspectRatio: 3 / 4, backgroundColor: "#e5e7eb" },
  pageBadge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(29,78,216,0.9)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pageBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  name: { fontSize: 12, color: "#111", fontWeight: "600", paddingHorizontal: 8, paddingTop: 6 },
  mode: { fontSize: 11, fontWeight: "700", color: "#1d4ed8", paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f3f6", padding: 24 },
  emptyText: { fontSize: 15, color: "#374151", fontWeight: "600" },
  emptyHint: { fontSize: 13, color: "#6b7280", marginTop: 6 },
});
