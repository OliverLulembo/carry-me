import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PassengerNotification } from "@/lib/passenger-notifications";
import { colors, fontSize, radii, shadow, spacing } from "@/theme/tokens";

export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: PassengerNotification | null;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notification) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 12_000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification || !visible) return null;

  return (
    <View
      style={[styles.wrap, { top: insets.top + 56 }]}
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Feather name="truck" size={20} color={colors.brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>
        <Pressable
          onPress={() => {
            setVisible(false);
            onDismiss();
          }}
          accessibilityLabel="Dismiss notification"
          hitSlop={8}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}
        >
          <Feather name="x" size={18} color={colors.ink[500]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(243, 66, 19, 0.30)",
    backgroundColor: colors.surface.raised,
    ...shadow.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: "rgba(243, 66, 19, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.ink[700],
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  message: {
    marginTop: 4,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    lineHeight: 17,
  },
  close: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
});
