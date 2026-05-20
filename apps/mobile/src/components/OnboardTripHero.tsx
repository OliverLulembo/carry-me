import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { ActiveTap } from "@/api/endpoints";
import { Button } from "./Button";
import { colors, fontSize, radii, shadow, spacing, tints } from "@/theme/tokens";

export function OnboardTripHero({
  activeTap,
  rideLoading,
  rideBusy,
  isDestinationNext,
  canTapOff,
  onTapOff,
}: {
  activeTap: ActiveTap;
  rideLoading: boolean;
  rideBusy: boolean;
  isDestinationNext: boolean;
  canTapOff: boolean;
  onTapOff: () => void;
}) {
  const progressPct =
    activeTap.distanceToDestinationMeters == null
      ? 34
      : Math.max(
          8,
          Math.min(
            92,
            100 - (activeTap.distanceToDestinationMeters / 8000) * 100,
          ),
        );

  return (
    <LinearGradient
      colors={["#1A1814", colors.brand.deep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.card, shadow.card]}
    >
      <View style={styles.orbA} pointerEvents="none" />
      <View style={styles.orbB} pointerEvents="none" />

      <View style={styles.eyebrowRow}>
        <View style={styles.liveDot} />
        <Text style={styles.eyebrow}>ON BOARD</Text>
      </View>

      <View style={styles.pills}>
        <View style={styles.platePill}>
          <Text style={styles.plateText}>{activeTap.busPlate}</Text>
        </View>
        <View style={styles.routePill}>
          <Feather name="git-branch" size={12} color={colors.brand.primary} />
          <Text style={styles.routeText}>{activeTap.route.name}</Text>
        </View>
      </View>

      {rideLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.brand.primary} size="small" />
          <Text style={styles.loadingText}>Updating your ride…</Text>
        </View>
      ) : activeTap.currentStop ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionLabel}>Bus at stop</Text>
          <Text style={styles.heroTitle}>{activeTap.currentStop.name}</Text>
        </View>
      ) : activeTap.nextStop ? (
        <View style={{ marginTop: spacing.md }}>
          {isDestinationNext ? (
            <>
              <Text style={styles.sectionLabel}>Your stop is next</Text>
              <Text style={styles.heroTitle}>{activeTap.nextStop.name}</Text>
            </>
          ) : (
            <Text style={styles.nextStop}>
              Next stop:{" "}
              <Text style={styles.nextStopAccent}>{activeTap.nextStop.name}</Text>
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.nextStop}>On route — enjoy the ride</Text>
      )}

      <Text style={styles.sub}>
        Boarded at {activeTap.onStop.name}
        {activeTap.groupSize > 1 ? ` · ${activeTap.groupSize} passengers` : ""}.{" "}
        {canTapOff
          ? "You can tap off now — fare is charged when you disembark."
          : "Tap off becomes available when the driver marks arrival at your stop."}
      </Text>

      <View style={styles.progressCard}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{activeTap.onStop.name}</Text>
          <Text style={styles.progressLabel}>
            {activeTap.offStop?.name ?? "Destination"}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.progressMeta}>
          {activeTap.etaToDestinationMinutes != null
            ? `${activeTap.etaToDestinationMinutes} min`
            : "On route"}
          {activeTap.distanceToDestinationMeters != null
            ? ` · ${(activeTap.distanceToDestinationMeters / 1000).toFixed(1)} km remaining`
            : ""}
        </Text>
      </View>

      <View style={styles.statusPills}>
        <View style={styles.statusPill}>
          <Feather name="truck" size={12} color={colors.white} />
          <Text style={styles.statusPillText}>Ride in progress</Text>
        </View>
        <View style={styles.statusPill}>
          <Feather name="smartphone" size={12} color={colors.white} />
          <Text style={styles.statusPillText}>Tap off to pay</Text>
        </View>
      </View>

      <Button
        label="Tap off"
        onPress={onTapOff}
        loading={rideBusy}
        disabled={!canTapOff}
        leftIcon={<Feather name="log-out" size={16} color={colors.white} />}
        block
        style={{ marginTop: spacing.lg }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
    minHeight: 420,
  },
  orbA: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: tints.primaryStrong,
  },
  orbB: {
    position: "absolute",
    bottom: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: tints.secondaryGlow,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  eyebrow: {
    color: colors.brand.primary,
    fontWeight: "800",
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
  },
  pills: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.brand.deep,
  },
  plateText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  routePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: tints.onDarkMedium,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  routeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  loadingRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.sm,
  },
  sectionLabel: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    marginTop: 4,
    color: colors.brand.primary,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 36,
  },
  nextStop: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: "700",
    lineHeight: 28,
  },
  nextStopAccent: {
    color: colors.brand.primary,
  },
  sub: {
    marginTop: spacing.sm,
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.sm,
    lineHeight: 19,
    maxWidth: 320,
  },
  progressCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: tints.onDarkMedium,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  progressLabel: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "700",
    flex: 1,
  },
  progressTrack: {
    marginTop: spacing.sm,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  progressMeta: {
    marginTop: spacing.sm,
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSize.sm,
  },
  statusPills: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: tints.onDarkMedium,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  statusPillText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
