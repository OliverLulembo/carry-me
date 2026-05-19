import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/Button";
import { useToken } from "@/auth/session";
import {
  getActiveTap,
  getInboundBuses,
  tapOff,
  tapOn,
  type ActiveTap,
  type FareHint,
} from "@/api/endpoints";
import { ApiError, type InboundBus } from "@/api/client";
import { colors, fontSize, radii, spacing, tints } from "@/theme/tokens";

export default function TapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useToken();
  const params = useLocalSearchParams<{
    stopId?: string;
    stopName?: string;
    mode?: string;
  }>();

  const stopId = typeof params.stopId === "string" ? params.stopId : "";
  const stopName =
    typeof params.stopName === "string" ? params.stopName : "Your stop";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTap, setActiveTap] = useState<ActiveTap | null>(null);
  const [fareHints, setFareHints] = useState<FareHint[]>([]);
  const [buses, setBuses] = useState<InboundBus[]>([]);
  const [groupSize, setGroupSize] = useState(1);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const active = await getActiveTap(token);
      setActiveTap(active.tap);
      setFareHints(active.fareHints ?? []);
      if (!active.tap && stopId) {
        const inbound = await getInboundBuses(token, stopId);
        setBuses(inbound.buses);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [token, stopId]);

  useEffect(() => {
    load();
  }, [load]);

  const onBoard = async (tripId: string) => {
    if (!token || !stopId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await tapOn(token, { tripId, stopId, groupSize });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setSuccess(res.message);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Boarding failed");
    } finally {
      setBusy(false);
    }
  };

  const onDisembark = async (offStopId: string) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await tapOff(token, { stopId: offStopId, tapId: activeTap?.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setSuccess(res.message);
      setTimeout(() => router.back(), 1200);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Tap off failed");
    } finally {
      setBusy(false);
    }
  };

  const hintFor = (id: string) => fareHints.find((h) => h.stopId === id);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
          <Feather name="x" size={22} color={colors.brand.deep} />
        </Pressable>
        <Text style={styles.title}>
          {activeTap ? "Tap off" : "Tap to board"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
        >
          {success && (
            <View style={styles.bannerOk}>
              <Text style={styles.bannerOkText}>{success}</Text>
            </View>
          )}
          {error && (
            <View style={styles.bannerErr}>
              <Text style={styles.bannerErrText}>{error}</Text>
            </View>
          )}

          {activeTap ? (
            <>
              <Text style={styles.lead}>
                On board · {activeTap.busPlate}. Boarded at {activeTap.onStop.name}.
                Choose where you&apos;re getting off — fare is charged now.
              </Text>
              {activeTap.route.stops
                .filter((s) => s.id !== activeTap.onStop.id)
                .map((s) => {
                  const hint = hintFor(s.id);
                  return (
                    <Pressable
                      key={s.id}
                      disabled={busy || !hint}
                      onPress={() => onDisembark(s.id)}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && styles.rowPressed,
                        !hint && styles.rowDisabled,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{s.name}</Text>
                        {hint ? (
                          <Text style={styles.rowFare}>
                            {hint.totalCredits} credits
                            {activeTap.groupSize > 1
                              ? ` (${hint.creditsPerPassenger} × ${activeTap.groupSize})`
                              : ""}
                          </Text>
                        ) : (
                          <Text style={styles.rowMuted}>Fare not configured</Text>
                        )}
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.ink[500]} />
                    </Pressable>
                  );
                })}
            </>
          ) : (
            <>
              <Text style={styles.lead}>
                Boarding at <Text style={styles.leadBold}>{stopName}</Text>. Pick a
                bus — you won&apos;t be charged until you tap off.
              </Text>

              <Text style={styles.sectionLabel}>Group size</Text>
              <View style={styles.groupRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setGroupSize(n)}
                    style={[
                      styles.groupChip,
                      groupSize === n && styles.groupChipOn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupChipText,
                        groupSize === n && styles.groupChipTextOn,
                      ]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Active buses</Text>
              {buses.length === 0 ? (
                <Text style={styles.empty}>No active buses serve this stop right now.</Text>
              ) : (
                buses.map((b) => (
                  <Pressable
                    key={b.tripId}
                    disabled={busy}
                    onPress={() => onBoard(b.tripId)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{b.busPlate}</Text>
                      <Text style={styles.rowMuted}>{b.route.name}</Text>
                      <Text style={styles.rowMuted}>
                        {b.seatsAvailable} seats
                        {b.etaMinutes != null ? ` · ~${b.etaMinutes} min` : ""}
                      </Text>
                    </View>
                    <Feather name="wifi" size={18} color={colors.brand.primary} />
                  </Pressable>
                ))
              )}
            </>
          )}

          <Button
            label="Done"
            variant="secondary"
            onPress={() => router.back()}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.base },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  close: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.brand.deep,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.lg },
  lead: {
    fontSize: fontSize.sm,
    color: colors.ink[700],
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  leadBold: { fontWeight: "700", color: colors.brand.deep },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.ink[500],
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  groupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.lg,
  },
  groupChip: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    alignItems: "center",
    justifyContent: "center",
  },
  groupChipOn: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  groupChipText: { fontWeight: "700", color: colors.brand.deep },
  groupChipTextOn: { color: colors.white },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
    marginBottom: spacing.sm,
  },
  rowPressed: { opacity: 0.85 },
  rowDisabled: { opacity: 0.5 },
  rowTitle: { fontWeight: "700", color: colors.brand.deep, fontSize: fontSize.sm },
  rowFare: {
    color: colors.brand.primary,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: "600",
  },
  rowMuted: { color: colors.ink[500], fontSize: fontSize.xs, marginTop: 2 },
  empty: { color: colors.ink[500], fontSize: fontSize.sm, marginBottom: spacing.md },
  bannerOk: {
    backgroundColor: tints.successSoft,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  bannerOkText: { color: colors.brand.deep, fontSize: fontSize.sm },
  bannerErr: {
    backgroundColor: "#FEE2E2",
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  bannerErrText: { color: "#B91C1C", fontSize: fontSize.sm },
});
