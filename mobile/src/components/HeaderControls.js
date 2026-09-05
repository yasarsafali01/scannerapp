import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n/I18nContext";
import { useAppTheme } from "../theme/ThemeContext";
import LanguageModal from "./LanguageModal";

export default function HeaderControls() {
  const { lang, languages, t } = useI18n();
  const { isDark, toggleTheme, colors } = useAppTheme();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const current = languages.find((l) => l.code === lang);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.pill, { backgroundColor: colors.accentSoft }]}
        onPress={() => setLangModalVisible(true)}
      >
        <Text style={styles.flagText}>{current?.flag || "🏳️"}</Text>
        <Text style={[styles.pillText, { color: colors.accentDark }]}>{(current?.code || "tr").toUpperCase()}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.pill, { backgroundColor: colors.accentSoft }]} onPress={toggleTheme}>
        <Text style={styles.iconText}>{isDark ? "🌙" : "☀️"}</Text>
        <Text style={[styles.pillText, { color: colors.accentDark }]}>
          {isDark ? t("theme.dark") : t("theme.light")}
        </Text>
      </TouchableOpacity>
      <LanguageModal visible={langModalVisible} onClose={() => setLangModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 9,
  },
  flagText: { fontSize: 14 },
  iconText: { fontSize: 12 },
  pillText: { fontSize: 11.5, fontWeight: "700" },
});
