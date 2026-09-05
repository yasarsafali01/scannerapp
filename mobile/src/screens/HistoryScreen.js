import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { deleteScan, getHistory } from "../storage/history";
import { useI18n } from "../i18n/I18nContext";
import { useAppTheme } from "../theme/ThemeContext";

export default function HistoryScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const MODE_LABELS = { bw: t("modes.bw"), gray: t("modes.gray"), color: t("modes.color") };

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setItems);
    }, [])
  );

  function confirmDelete(item) {
    Alert.alert(t("result.deleteConfirmTitle"), t("result.deleteConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
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
      const dateStr = new Date(item.date).toLocaleDateString();
      return name.includes(q) || modeLabel.includes(q) || dateStr.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query]);

  return (
    <View style={styles.container}>
      {items.length > 0 && (
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder={t("history.searchPlaceholder")}
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t("history.emptyTitle")}</Text>
          <Text style={styles.emptyHint}>{t("history.emptyHint")}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t("history.noResults")}</Text>
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
                  <Text style={styles.pageBadgeText}>{t("history.pageBadge", item.pageCount)}</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={1}>
                {item.name || new Date(item.date).toLocaleDateString()}
              </Text>
              <Text style={styles.mode}>{MODE_LABELS[item.mode] || item.mode}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchBox: { padding: 12, paddingBottom: 0 },
    searchInput: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text },
    grid: { padding: 12, backgroundColor: colors.background },
    row: { gap: 12 },
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    thumb: { width: "100%", aspectRatio: 3 / 4, backgroundColor: colors.border },
    pageBadge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(29,78,216,0.9)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    pageBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    name: { fontSize: 12, color: colors.text, fontWeight: "600", paddingHorizontal: 8, paddingTop: 6 },
    mode: { fontSize: 11, fontWeight: "700", color: colors.accentDark, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24 },
    emptyText: { fontSize: 15, color: colors.text, fontWeight: "600" },
    emptyHint: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  });
}
