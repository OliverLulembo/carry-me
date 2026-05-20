import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useAuth } from "@/auth/session";
import { RideProvider } from "@/ride/RideProvider";
import { colors } from "@/theme/tokens";

export default function TabsLayout() {
  const { status } = useAuth();
  if (status === "signedOut") {
    return <Redirect href="/" />;
  }

  return (
    <RideProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.ink[500],
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: -2,
          },
          tabBarStyle: {
            backgroundColor: colors.surface.raised,
            borderTopColor: colors.ink[100],
            paddingTop: 6,
            paddingBottom: Platform.OS === "ios" ? 24 : 10,
            height: Platform.OS === "ios" ? 84 : 64,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: "Wallet",
            tabBarIcon: ({ color, size }) => (
              <Feather name="credit-card" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stops"
          options={{
            title: "Stops",
            tabBarIcon: ({ color, size }) => (
              <Feather name="map-pin" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: "Trips",
            tabBarIcon: ({ color, size }) => (
              <Feather name="list" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size - 2} color={color} />
            ),
          }}
        />
      </Tabs>
    </RideProvider>
  );
}
