import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "freescanner_theme";

const lightColors = {
  background: "#f1f3f6",
  card: "#ffffff",
  cardAlt: "#fafafa",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#111111",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  accent: "#2563eb",
  accentSoft: "#eef2ff",
  accentDark: "#1d4ed8",
  success: "#16a34a",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  headerBg: "#ffffff",
  statusBarStyle: "dark",
};

const darkColors = {
  background: "#0f1115",
  card: "#1a1d24",
  cardAlt: "#20242c",
  border: "#2a2e37",
  borderStrong: "#3a3f4b",
  text: "#f2f3f5",
  textMuted: "#9aa0ac",
  textFaint: "#6b7280",
  accent: "#3b82f6",
  accentSoft: "#1e2a47",
  accentDark: "#60a5fa",
  success: "#22c55e",
  danger: "#f87171",
  dangerSoft: "#3a1e1e",
  headerBg: "#161920",
  statusBarStyle: "light",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Default is always light regardless of the device's system theme; the user
  // switches explicitly via the header toggle, and that choice is persisted.
  const [isDark, setIsDark] = useState(false);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "dark") setIsDark(true);
      else if (saved === "light") setIsDark(false);
      setLoadedFromStorage(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? "dark" : "light").catch(() => {});
      return next;
    });
  }

  const value = useMemo(
    () => ({ isDark, colors: isDark ? darkColors : lightColors, toggleTheme, loadedFromStorage }),
    [isDark, loadedFromStorage]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
