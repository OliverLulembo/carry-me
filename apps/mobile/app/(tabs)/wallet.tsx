import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { RecentActivity } from "@/components/RecentActivity";
import { useAuth, useToken } from "@/auth/session";
import { getTransactions, getWallet } from "@/api/endpoints";
import type { WalletEntry } from "@/api/client";
import { ApiError } from "@/api/client";
import { colors, fontSize, radii, shadow, spacing, tints } from "@/theme/tokens";
import { formatCredits, formatZmw } from "@/lib/format";
import { LinearGradient } from "expo-linear-gradient";

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useToken();
  const { signOut } = useAuth();

  const [balance, setBalance] = useState<number>(0);
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);
      try {
        const [w, tx] = await Promise.all([
          getWallet(token),
          getTransactions(token, 30),
        ]);
        setBalance(w.wallet.balance);
        setEntries(tx.entries);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await signOut();
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load wallet");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, signOut],
  );

  useEffect(() => {
    load("initial");
  }, [load]);

  // Refresh whenever the user returns from the topup/share modal.
  useFocusEffect(
    useCallback(() => {
      load("refresh");
    }, [load]),
  );

  // Quick stats: net in / net out over the last 7 days.
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const netIn = entries
    .filter((e) => new Date(e.createdAt).getTime() >= weekStart && e.amount > 0)
    .reduce((acc, e) => acc + e.amount, 0);
  const netOut = entries
    .filter((e) => new Date(e.createdAt).getTime() >= weekStart && e.amount < 0)
    .reduce((acc, e) => acc + Math.abs(e.amount), 0);

  if (loading) {
    return (
      <View style={styles.bootScreen}>
        <Header subtitle="Wallet" />
        <View style={styles.boot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header subtitle="Wallet" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl + 64 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load("refresh")}
            tintColor={colors.brand.primary}
          />
        }
      >
        <LinearGradient
          colors={[colors.brand.primary, "#D63A0F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, shadow.pop]}
        >
          <View style={styles.heroOrb} />
          <Text style={styles.heroEyebrow}>WALLET BALANCE</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>{formatZmw(balance)}</Text>
            <Text style={styles.heroUnit}>ZMW</Text>
          </View>
          <Text style={styles.heroSub}>{formatCredits(balance)} available</Text>

          <View style={styles.heroActions}>
            <Button
              label="Top up"
              variant="onPrimary"
              leftIcon={<Feather name="plus" size={16} color={colors.brand.deep} />}
              onPress={() => router.push("/topup")}
              style={{ flex: 1 }}
            />
            <Button
              label="Share"
              variant="onPrimaryGhost"
              leftIcon={<Feather name="send" size={16} color={colors.white} />}
              onPress={() => router.push("/share")}
              style={{ flex: 1 }}
            />
          </View>
        </LinearGradient>

        <Card>
          <Text style={styles.statsTitle}>This week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Pill
                tone="success"
                icon={<Feather name="arrow-down" size={12} color="#15803D" />}
              >
                IN
              </Pill>
              <Text style={styles.statAmount}>{formatZmw(netIn)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Pill
                tone="primary"
                icon={<Feather name="arrow-up" size={12} color={colors.brand.primary} />}
              >
                OUT
              </Pill>
              <Text style={styles.statAmount}>{formatZmw(netOut)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Pill tone="neutral">TXNS</Pill>
              <Text style={styles.statAmount}>
                {entries.filter((e) => new Date(e.createdAt).getTime() >= weekStart).length}
              </Text>
            </View>
          </View>
        </Card>

        {error && (
          <Card padded style={{ borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.30)" }}>
            <Text style={styles.errorTitle}>Couldn't refresh</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </Card>
        )}

        <RecentActivity
          entries={entries}
          title="All transactions"
          emptyText="No wallet activity yet."
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  bootScreen: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  heroOrb: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  heroEyebrow: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  heroAmountRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  heroAmount: {
    color: colors.white,
    fontSize: fontSize.display,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroUnit: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  heroSub: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  heroActions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: 10,
  },
  statsTitle: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCol: {
    flex: 1,
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.ink[100],
    marginHorizontal: spacing.md,
  },
  statAmount: {
    color: colors.brand.deep,
    fontWeight: "800",
    fontSize: fontSize.lg,
  },
  errorTitle: {
    color: colors.status.danger,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  errorBody: {
    color: colors.ink[700],
    fontSize: fontSize.xs,
    marginTop: 4,
  },
});
