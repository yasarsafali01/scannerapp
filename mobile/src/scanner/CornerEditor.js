import { useCallback, useMemo, useRef } from "react";
import { Image, PanResponder, StyleSheet, View } from "react-native";

const HANDLE_SIZE = 44;
const HANDLE_HIT_SLOP = { top: 18, bottom: 18, left: 18, right: 18 };
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

function EdgeLine({ from, to }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: from.x,
        top: from.y,
        width: length,
        height: 2,
        backgroundColor: "#1d4ed8",
        transformOrigin: "0 0",
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

function CornerHandle({ point, index, bounds, onDrag, onDragActive }) {
  const pointRef = useRef(point);
  pointRef.current = point;
  const startRef = useRef(point);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          startRef.current = pointRef.current;
          onDragActive?.(true);
        },
        onPanResponderMove: (_evt, gesture) => {
          const x = Math.max(0, Math.min(bounds.width, startRef.current.x + gesture.dx));
          const y = Math.max(0, Math.min(bounds.height, startRef.current.y + gesture.dy));
          onDrag(index, { x, y });
        },
        onPanResponderRelease: () => onDragActive?.(false),
        onPanResponderTerminate: () => onDragActive?.(false),
      }),
    [bounds.width, bounds.height, index, onDrag, onDragActive]
  );

  return (
    <View
      {...pan.panHandlers}
      hitSlop={HANDLE_HIT_SLOP}
      style={[styles.handle, { left: point.x - HANDLE_SIZE / 2, top: point.y - HANDLE_SIZE / 2 }]}
    />
  );
}

export default function CornerEditor({
  uri,
  naturalWidth,
  naturalHeight,
  displayWidth,
  corners,
  onChange,
  onDragActive,
}) {
  const scale = displayWidth / naturalWidth;
  const displayHeight = naturalHeight * scale;
  const displayCorners = corners.map((c) => ({ x: c.x * scale, y: c.y * scale }));

  const handleDrag = useCallback(
    (index, displayPoint) => {
      const next = corners.slice();
      next[index] = { x: displayPoint.x / scale, y: displayPoint.y / scale };
      onChange(next);
    },
    [corners, scale, onChange]
  );

  return (
    <View style={{ width: displayWidth, height: displayHeight }}>
      <Image source={{ uri }} style={{ width: displayWidth, height: displayHeight }} resizeMode="contain" />
      {EDGES.map(([a, b], i) => (
        <EdgeLine key={i} from={displayCorners[a]} to={displayCorners[b]} />
      ))}
      {displayCorners.map((p, i) => (
        <CornerHandle
          key={i}
          point={p}
          index={i}
          bounds={{ width: displayWidth, height: displayHeight }}
          onDrag={handleDrag}
          onDragActive={onDragActive}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: "#1d4ed8",
    borderWidth: 3,
    borderColor: "#fff",
  },
});
