import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import EditScreen from "../screens/EditScreen";
import MultiScanScreen from "../screens/MultiScanScreen";
import ResultScreen from "../screens/ResultScreen";
import HistoryScreen from "../screens/HistoryScreen";
import HeaderControls from "../components/HeaderControls";
import { useAppTheme } from "../theme/ThemeContext";
import { useI18n } from "../i18n/I18nContext";

const Tab = createBottomTabNavigator();
const ScanStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();

function ScanStackScreen() {
  const { t } = useI18n();
  return (
    <ScanStack.Navigator screenOptions={{ headerRight: () => <HeaderControls /> }}>
      <ScanStack.Screen name="ScanHome" component={HomeScreen} options={{ title: t("titles.home") }} />
      <ScanStack.Screen name="Edit" component={EditScreen} options={{ title: t("titles.edit") }} />
      <ScanStack.Screen name="MultiScan" component={MultiScanScreen} options={{ title: t("titles.multiscan") }} />
      <ScanStack.Screen name="Result" component={ResultScreen} options={{ title: t("titles.result") }} />
    </ScanStack.Navigator>
  );
}

function HistoryStackScreen() {
  const { t } = useI18n();
  return (
    <HistoryStack.Navigator screenOptions={{ headerRight: () => <HeaderControls /> }}>
      <HistoryStack.Screen name="HistoryHome" component={HistoryScreen} options={{ title: t("titles.history") }} />
      <HistoryStack.Screen name="Result" component={ResultScreen} options={{ title: t("titles.result") }} />
    </HistoryStack.Navigator>
  );
}

function TabIcon({ symbol }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

export default function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const { t } = useI18n();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.accent,
      background: colors.background,
      card: colors.headerBg,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: { backgroundColor: colors.headerBg, borderTopColor: colors.border },
        }}
      >
        <Tab.Screen
          name="Tara"
          component={ScanStackScreen}
          options={{ title: t("tabs.scan"), tabBarIcon: () => <TabIcon symbol="📷" /> }}
        />
        <Tab.Screen
          name="Taramalarım"
          component={HistoryStackScreen}
          options={{ title: t("tabs.history"), tabBarIcon: () => <TabIcon symbol="🗂️" /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
