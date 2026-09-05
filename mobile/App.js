import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useAppTheme } from "./src/theme/ThemeContext";
import { I18nProvider } from "./src/i18n/I18nContext";
import RootNavigator from "./src/navigation/RootNavigator";

function AppShell() {
  const { colors } = useAppTheme();
  return (
    <>
      <StatusBar style={colors.statusBarStyle === "light" ? "light" : "dark"} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </ThemeProvider>
  );
}
