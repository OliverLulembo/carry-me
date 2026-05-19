import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, radii, spacing } from "@/theme/tokens";
import { Card } from "./Card";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

type Action = {
  icon: FeatherName;
  label: string;
  sub: string;
  tone: "primary" | "secondary" | "neutral";
  onPress?: () => void;
  disabled?: boolean;
};

// Mirrors the web QuickActions block. Wording, ordering and tones intentionally
// match so passengers see the same shortcuts on either client.
export function QuickActions({
  boardingStopId,
  boardingStopName,
  hasActiveRide,
}: {
  boardingStopId?: string | null;
  boardingStopName?: string;
  hasActiveRide?: boolean;
}) {
  const router = useRouter();

  const openTap = () => {
    if (!hasActiveRide && !boardingStopId) return;
    router.push({
      pathname: "/tap" as const,
      params: {
        stopId: boardingStopId ?? "",
        stopName: boardingStopName ?? "Your stop",
      },
    } as never);
  };

  const actions: Action[] = [
    {
      icon: hasActiveRide ? "log-out" : "wifi",
      label: hasActiveRide ? "Tap off" : "Tap to board",
      sub: hasActiveRide ? "Pay fare at destination" : "Board via API",
      tone: "primary",
      onPress: openTap,
      disabled: !hasActiveRide && !boardingStopId,
    },
    {
      icon: "users",
      label: "Boarding as a group",
      sub: "Set size when boarding",
      tone: "secondary",
      onPress: openTap,
      disabled: hasActiveRide,
    },
    {
      icon: "credit-card",
      label: "Scan a card",
      sub: "Link a CarryMe card",
      tone: "neutral",
    },
    {
      icon: "map",
      label: "Plan a route",
      sub: "Coming soon",
      tone: "neutral",
    },
  ];

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Quick actions</Text>
        <Text style={styles.subtitle}>Most common things you&apos;ll do</Text>
      </View>
      <View style={styles.grid}>
        {actions.map((a) => (
          <ActionTile key={a.label} action={a} />
        ))}
      </View>
    </Card>
  );
}

function ActionTile({ action }: { action: Action }) {
  const palette =
    action.tone === "primary"
      ? { bg: colors.brand.primary, fg: colors.white }
      : action.tone === "secondary"
        ? { bg: colors.brand.secondary, fg: colors.brand.deep }
        : {
            bg: colors.surface.base,
            fg: colors.brand.deep,
            border: colors.ink[100],
          };

  return (
    <Pressable
      onPress={action.onPress}
      disabled={action.disabled}
      style={({ pressed }) => [
        styles.tile,
        { opacity: action.disabled ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      <View
        style={[
          styles.tileIcon,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border ?? "transparent",
            borderWidth: palette.border ? 1 : 0,
          },
        ]}
      >
        <Feather name={action.icon} size={20} color={palette.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tileLabel}>{action.label}</Text>
        <Text style={styles.tileSub}>{action.sub}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexBasis: "48%",
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  tileSub: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 1,
  },
});
