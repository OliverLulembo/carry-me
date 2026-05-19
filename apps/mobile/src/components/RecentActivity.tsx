import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, radii, spacing, tints } from "@/theme/tokens";
import { formatZmw, timeAgo } from "@/lib/format";
import type { WalletEntry, WalletEntryKind } from "@/api/client";
import { Card } from "./Card";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const KIND_META: Record<
  WalletEntryKind,
  { label: string; icon: FeatherName; tone: "in" | "out" | "neutral" }
> = {
  TOPUP:           { label: "Top-up",         icon: "arrow-down",   tone: "in" },
  TRIP_DEBIT:      { label: "Trip",           icon: "truck",        tone: "out" },
  TRIP_HOLD:       { label: "Held for trip",  icon: "credit-card",  tone: "neutral" },
  TRIP_RELEASE:    { label: "Released",       icon: "refresh-cw",   tone: "in" },
  SHARE_OUT:       { label: "Shared out",     icon: "send",         tone: "out" },
  SHARE_IN:        { label: "Received",       icon: "arrow-down",   tone: "in" },
  REFUND:          { label: "Refund",         icon: "arrow-down",   tone: "in" },
  ADJUSTMENT:      { label: "Adjustment",     icon: "refresh-cw",   tone: "neutral" },
  WITHDRAWAL_OUT:  { label: "Withdrawal",     icon: "arrow-up",     tone: "out" },
};

export function RecentActivity({
  entries,
  title = "Recent activity",
  emptyText = "No transactions yet. Top up to get started.",
}: {
  entries: WalletEntry[];
  title?: string;
  emptyText?: string;
}) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {entries.length > 0 && (
          <Pressable accessibilityLabel="See all">
            <Text style={styles.seeAll}>See all →</Text>
          </Pressable>
        )}
      </View>

      {entries.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <View>
          {entries.map((e, i) => {
            const meta =
              KIND_META[e.kind] ??
              ({ label: e.kind, icon: "circle", tone: "neutral" } as const);
            const tonePalette =
              meta.tone === "in"
                ? { bg: tints.successSoft, fg: colors.status.success }
                : meta.tone === "out"
                  ? { bg: tints.primarySoft, fg: colors.brand.primary }
                  : { bg: colors.surface.base, fg: colors.ink[500] };
            const sign = e.amount > 0 ? "+" : "-";
            const amountColor =
              e.amount >= 0 ? colors.status.success : colors.brand.deep;
            return (
              <View
                key={e.id}
                style={[styles.row, i > 0 && styles.rowBorder]}
              >
                <View
                  style={[styles.iconWrap, { backgroundColor: tonePalette.bg }]}
                >
                  <Feather name={meta.icon} size={16} color={tonePalette.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{meta.label}</Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {(e.note ?? "—") + " · " + timeAgo(e.createdAt)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.amount, { color: amountColor }]}>
                    {sign}
                    {formatZmw(Math.abs(e.amount))}
                  </Text>
                  <Text style={styles.balance}>
                    Bal {formatZmw(e.balanceAfter)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  seeAll: {
    color: colors.brand.primary,
    fontWeight: "700",
    fontSize: fontSize.xs,
  },
  empty: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  sub: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  amount: {
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  balance: {
    color: colors.ink[500],
    fontSize: 10,
    marginTop: 2,
  },
});
