import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n/I18nContext";
import { useAppTheme } from "../theme/ThemeContext";

export default function LanguageModal({ visible, onClose }) {
  const { lang, setLang, languages } = useI18n();
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.row,
                  { borderColor: colors.border },
                  item.code === lang && { backgroundColor: colors.accentSoft },
                ]}
                onPress={() => {
                  setLang(item.code);
                  onClose();
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                {item.code === lang && <Text style={[styles.check, { color: colors.accent }]}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 360, borderRadius: 14, overflow: "hidden", maxHeight: "70%" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1 },
  flag: { fontSize: 22 },
  name: { fontSize: 15, fontWeight: "600", flex: 1 },
  check: { fontSize: 16, fontWeight: "700" },
});
