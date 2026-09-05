import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Stepper({ label, value, onChange, min = -50, max = 50, step = 10 }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => onChange(Math.max(min, value - step))} disabled={value <= min}>
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.value}>{value}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => onChange(Math.min(max, value + step))} disabled={value >= max}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  label: { color: "#374151", fontWeight: "600", fontSize: 13 },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  btn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  btnText: { color: "#1d4ed8", fontSize: 18, fontWeight: "700", lineHeight: 20 },
  value: { width: 36, textAlign: "center", fontWeight: "600", color: "#111" },
});
