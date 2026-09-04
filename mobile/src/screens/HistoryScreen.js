import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getHistory } from "../storage/history";

const MODE_LABELS = { bw: "Siyah-Beyaz", gray: "Gri Tonlama", color: "Renkli" };

export default function HistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setItems);
    }, [])
  );

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Henüz kaydedilmiş taramanız yok.</Text>
        <Text style={styles.emptyHint}>Bir belge taradığınızda burada listelenir.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Result", { entry: item })}>
          <Image source={{ uri: item.imageUri }} style={styles.thumb} />
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString("tr-TR")}{" "}
            {new Date(item.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text style={styles.mode}>{MODE_LABELS[item.mode] || item.mode}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
  date: { fontSize: 11, color: "#6b7280", paddingHorizontal: 8, paddingTop: 6 },
  mode: { fontSize: 11, fontWeight: "700", color: "#1d4ed8", paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f3f6", padding: 24 },
  emptyText: { fontSize: 15, color: "#374151", fontWeight: "600" },
  emptyHint: { fontSize: 13, color: "#6b7280", marginTop: 6 },
});
