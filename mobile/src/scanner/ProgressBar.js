import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

const SEGMENT_WIDTH = 70;

export default function ProgressBar({ progress, label, indeterminate, estimateSeconds }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const [trackWidth, setTrackWidth] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const animX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!indeterminate) {
      setElapsed(0);
      return undefined;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [indeterminate]);

  const hasEstimate = indeterminate && estimateSeconds > 0;
  const simulatedPct = hasEstimate
    ? Math.min(97, Math.round((1 - Math.exp(-elapsed / estimateSeconds)) * 100))
    : null;

  useEffect(() => {
    if (!indeterminate || hasEstimate || trackWidth === 0) return undefined;
    animX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(animX, { toValue: 1, duration: 1100, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [indeterminate, hasEstimate, trackWidth, animX]);

  const translateX = animX.interpolate({
    inputRange: [0, 1],
    outputRange: [-SEGMENT_WIDTH, trackWidth],
  });

  const text = indeterminate
    ? `${label || "…"}${simulatedPct !== null ? ` %${simulatedPct}` : ""}${elapsed > 0 ? ` (${elapsed}s)` : ""}`
    : label || `%${pct}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        {indeterminate ? (
          simulatedPct !== null ? (
            <View style={[styles.fill, { width: `${simulatedPct}%` }]} />
          ) : (
            <Animated.View style={[styles.segment, { width: SEGMENT_WIDTH, transform: [{ translateX }] }]} />
          )
        ) : (
          <View style={[styles.fill, { width: `${pct}%` }]} />
        )}
      </View>
      <Text style={styles.label}>{text}</Text>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrap: { marginTop: 12 },
    track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" },
    fill: { height: "100%", backgroundColor: colors.accent },
    segment: { position: "absolute", height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
    label: { marginTop: 6, fontSize: 12, color: colors.textMuted, textAlign: "center" },
  });
}
