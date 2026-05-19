import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, radii, shadow, spacing, tints } from "@/theme/tokens";
import { formatCredits, formatZmw, timeAgo } from "@/lib/format";
import type { LinkedDevice, LinkedDeviceType } from "@/api/client";
import { Button } from "./Button";
import { Pill } from "./Pill";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

// Mirrors apps/web dashboard BalanceCard: a white "shadow-pop" surface with
// two soft brand-tinted blobs in the corners. Replaces the previous full
// gradient hero so the 60/30/10 palette stays balanced — the brand-primary
// shows up only as ambient glow plus the CTA + accent text, leaving the rest
// of the card calm and easy to read.
export function BalanceCard({
  balance,
  tripsThisWeek,
  devices = [],
}: {
  balance: number;
  tripsThisWeek: number;
  devices?: LinkedDevice[];
}) {
  const router = useRouter();

  return (
    <View style={[styles.card, shadow.pop]}>
      <View style={styles.orbA} pointerEvents="none" />
      <View style={styles.orbB} pointerEvents="none" />

      <Text style={styles.eyebrow}>BALANCE</Text>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatZmw(balance)}</Text>
      </View>
      <Text style={styles.subAmount}>{formatCredits(balance)} available</Text>

      <View style={styles.metaRow}>
        <Pill tone="neutral">
          {tripsThisWeek} {tripsThisWeek === 1 ? "trip" : "trips"} this week
        </Pill>
      </View>

      <View style={styles.actions}>
        <Button
          label="Top up"
          variant="primary"
          leftIcon={<Feather name="plus" size={16} color={colors.white} />}
          onPress={() => router.push("/topup")}
          style={styles.actionBtn}
        />
        <Button
          label="Share"
          variant="ghost"
          leftIcon={<Feather name="send" size={16} color={colors.ink[700]} />}
          onPress={() => router.push("/share")}
          style={styles.actionBtn}
        />
      </View>

      <LinkedDevicesList devices={devices} />
    </View>
  );
}

// Per-device row + summary, modelled on the web's LinkedDevicesList. Lives in
// the same file because it has no use outside the balance card.
function LinkedDevicesList({ devices }: { devices: LinkedDevice[] }) {
  const activeCount = devices.filter((d) => d.active).length;

  return (
    <View style={styles.devices}>
      <View style={styles.devicesHead}>
        <Text style={styles.devicesTitle}>LINKED DEVICES</Text>
        <View style={styles.devicesCountPill}>
          <Text style={styles.devicesCountText}>
            {activeCount}/{devices.length} active
          </Text>
        </View>
      </View>

      {devices.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No devices linked yet</Text>
          <Text style={styles.emptySub}>
            Multi-device support arrives in v1.1
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {devices.map((d) => (
            <DeviceRow key={d.id} device={d} />
          ))}
        </View>
      )}
    </View>
  );
}

const DEVICE_ICON: Record<LinkedDeviceType, FeatherName> = {
  PHONE: "smartphone",
  CARD: "credit-card",
  WRISTBAND: "watch",
};

const DEVICE_DEFAULT_LABEL: Record<LinkedDeviceType, string> = {
  PHONE: "Phone",
  CARD: "NFC card",
  WRISTBAND: "Wristband",
};

const DEVICE_TYPE_LABEL: Record<LinkedDeviceType, string> = {
  PHONE: "Phone · Android HCE",
  CARD: "NFC card",
  WRISTBAND: "Wristband",
};

function DeviceRow({ device }: { device: LinkedDevice }) {
  const subtitle = device.lastSeenAt
    ? `${DEVICE_TYPE_LABEL[device.type]} · seen ${timeAgo(device.lastSeenAt)}`
    : `${DEVICE_TYPE_LABEL[device.type]} · never synced`;

  return (
    <View style={styles.deviceRow}>
      <View style={styles.deviceIconWrap}>
        <Feather
          name={DEVICE_ICON[device.type]}
          size={16}
          color={colors.brand.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.deviceLabelRow}>
          <Text style={styles.deviceLabel} numberOfLines={1}>
            {device.label ?? DEVICE_DEFAULT_LABEL[device.type]}
          </Text>
          <View
            style={[
              styles.deviceStatusDot,
              device.active
                ? styles.deviceStatusDotActive
                : styles.deviceStatusDotInactive,
            ]}
          />
        </View>
        <Text style={styles.deviceSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.raised,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  orbA: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: tints.primarySoft,
  },
  orbB: {
    position: "absolute",
    bottom: -60,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: tints.secondaryGlow,
  },
  eyebrow: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  amountRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  amount: {
    color: colors.brand.deep,
    fontSize: fontSize.display,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subAmount: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  metaRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
  devices: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
  },
  devicesHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm + 2,
  },
  devicesTitle: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  devicesCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  devicesCountText: {
    color: colors.ink[700],
    fontSize: 10,
    fontWeight: "700",
  },
  emptyBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.base,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.ink[700],
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  emptySub: {
    color: colors.ink[500],
    fontSize: 11,
    marginTop: 2,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.base,
  },
  deviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: tints.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deviceLabel: {
    color: colors.ink[700],
    fontWeight: "700",
    fontSize: fontSize.sm,
    flexShrink: 1,
  },
  deviceStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  deviceStatusDotActive: {
    backgroundColor: colors.brand.primary,
    borderWidth: 2,
    borderColor: tints.primaryGlow,
  },
  deviceStatusDotInactive: {
    backgroundColor: colors.ink[300],
  },
  deviceSub: {
    color: colors.ink[500],
    fontSize: 11,
    marginTop: 2,
  },
});
