import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import EditScreen from "../screens/EditScreen";
import MultiScanScreen from "../screens/MultiScanScreen";
import ResultScreen from "../screens/ResultScreen";
import HistoryScreen from "../screens/HistoryScreen";

const Tab = createBottomTabNavigator();
const ScanStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();

function ScanStackScreen() {
  return (
    <ScanStack.Navigator>
      <ScanStack.Screen name="ScanHome" component={HomeScreen} options={{ title: "FreeScanner" }} />
      <ScanStack.Screen name="Edit" component={EditScreen} options={{ title: "Köşeleri Ayarla" }} />
      <ScanStack.Screen name="MultiScan" component={MultiScanScreen} options={{ title: "Çoklu Sayfa Tara" }} />
      <ScanStack.Screen name="Result" component={ResultScreen} options={{ title: "Sonuç" }} />
    </ScanStack.Navigator>
  );
}

function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="HistoryHome" component={HistoryScreen} options={{ title: "Taramalarım" }} />
      <HistoryStack.Screen name="Result" component={ResultScreen} options={{ title: "Sonuç" }} />
    </HistoryStack.Navigator>
  );
}

function TabIcon({ symbol }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563eb",
        }}
      >
        <Tab.Screen
          name="Tara"
          component={ScanStackScreen}
          options={{ tabBarIcon: () => <TabIcon symbol="📷" /> }}
        />
        <Tab.Screen
          name="Taramalarım"
          component={HistoryStackScreen}
          options={{ tabBarIcon: () => <TabIcon symbol="🗂️" /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
