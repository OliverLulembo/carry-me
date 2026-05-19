import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, fontSize, radii, spacing, tints } from "@/theme/tokens";
import { useAuth } from "@/auth/session";
import { BrandLogo } from "@/components/BrandLogo";

// Mirrors apps/web DashboardHeader: the wordmark sits next to a small "LUSAKA"
// tag separated by a hairline divider, with a notifications affordance and the
// user avatar pinned to the right. Stays light/translucent over the dashboard
// background so the brand-tinted page glow can show through.
export function Header({ subtitle }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const initials = user
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <BrandLogo height={24} />
          <Text style={styles.subtitle}>{subtitle ?? "Lusaka"}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="bell" size={18} color={colors.ink[700]} />
            <View style={styles.notifyDot} />
          </Pressable>
          <Pressable
            accessibilityLabel="Profile"
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [
              styles.avatar,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: "rgba(250, 248, 243, 0.85)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink[100],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  subtitle: {
    color: colors.ink[500],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.ink[100],
    paddingLeft: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: colors.ink[100],
    alignItems: "center",
    justifyContent: "center",
  },
  notifyDot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
    borderWidth: 2,
    borderColor: colors.surface.raised,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.deep,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.3,
  },
});

// Re-export the tints so consumers don't reach into the token module directly
// for the ambient bg glow values. Cheap indirection that pays off when we
// re-skin the dashboard later.
export const HEADER_BG_TINT = tints.primarySoft;
