import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, fontSize, radii, shadow, spacing } from "@/theme/tokens";
import { useAuth } from "@/auth/session";
import { useRideOptional } from "@/ride/RideProvider";
import { BrandLogo } from "@/components/BrandLogo";

export function Header({ subtitle }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const ride = useRideOptional();
  const [open, setOpen] = useState(false);

  const initials = user
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const notifications = ride?.notifications ?? [];
  const unreadCount = ride?.unreadNotificationCount ?? 0;

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
            onPress={() => {
              setOpen((v) => !v);
              if (!open) ride?.markAllNotificationsRead();
            }}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="bell" size={18} color={colors.ink[700]} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
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

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.panel, { marginTop: insets.top + 56 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Notifications</Text>
              {notifications.length > 0 && (
                <Pressable onPress={() => ride?.clearNotifications()}>
                  <Text style={styles.clearAll}>Clear all</Text>
                </Pressable>
              )}
            </View>
            {notifications.length === 0 ? (
              <Text style={styles.panelEmpty}>
                No notifications yet. When your bus starts boarding at your stop,
                you&apos;ll see an alert here.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {notifications.map((n) => (
                  <View key={n.id} style={styles.notifRow}>
                    <View style={styles.notifIcon}>
                      <Feather name="truck" size={16} color={colors.brand.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifMessage}>{n.message}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
  },
  panel: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.surface.raised,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.ink[100],
    padding: spacing.md,
    ...shadow.card,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
    marginBottom: spacing.sm,
  },
  panelTitle: {
    color: colors.ink[700],
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  clearAll: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  panelEmpty: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.lg,
    lineHeight: 20,
  },
  notifRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink[100],
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: "rgba(243, 66, 19, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    color: colors.ink[700],
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  notifMessage: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
    lineHeight: 17,
  },
});
