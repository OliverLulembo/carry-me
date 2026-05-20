import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Header } from "@/components/Header";
import { BalanceCard } from "@/components/BalanceCard";
import { TripHero } from "@/components/TripHero";
import { QuickActions } from "@/components/QuickActions";
import { InboundBuses } from "@/components/InboundBuses";
import { NearestStops } from "@/components/NearestStops";
import { RecentActivity } from "@/components/RecentActivity";
import { useDashboard } from "@/hooks/useDashboard";
import { colors, fontSize, spacing, tints } from "@/theme/tokens";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dashboard = useDashboard();
  const refreshRef = useRef(dashboard.refresh);
  const [showNearestStops, setShowNearestStops] = useState(false);
  const [showRecentActivity, setShowRecentActivity] = useState(false);

  useEffect(() => {
    refreshRef.current = dashboard.refresh;
  }, [dashboard.refresh]);

  useFocusEffect(
    useCallback(() => {
      refreshRef.current();
    }, []),
  );

  const handleLogArrival = useCallback(
    (stopId: string, destinationStopId?: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      dashboard.onLogArrival(stopId, destinationStopId);
    },
    [dashboard],
  );

  const handleCancelArrival = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    dashboard.onCancelArrival();
  }, [dashboard]);

  const handlePayNow = useCallback(
    (tripId: string) => {
      if (!dashboard.liveArrival) return;
      router.push({
        pathname: "/tap" as const,
        params: {
          stopId: dashboard.liveArrival.stopId,
          stopName: dashboard.liveArrival.stopName,
          destinationStopId: dashboard.liveArrival.destinationStopId ?? "",
          tripId,
        },
      } as never);
    },
    [dashboard.liveArrival, router],
  );

  // Map the rich Stop list down to the lighter "option" shape the destination
  // autocomplete needs. Memoised so the combobox doesn't re-render on every
  // hook tick.
  const allStopOptions = useMemo(
    () => dashboard.stops.map((s) => ({ id: s.id, name: s.name })),
    [dashboard.stops],
  );

  if (dashboard.loading && dashboard.stops.length === 0) {
    return (
      <View style={styles.bootScreen}>
        <Header />
        <View style={styles.boot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
          <Text style={styles.bootText}>Loading your dashboard…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Soft ambient brand wash — mirrors the web ".bg-app" radial gradients
         so the dashboard sits inside the brand world without overwhelming it. */}
      <View style={styles.ambientA} pointerEvents="none" />
      <View style={styles.ambientB} pointerEvents="none" />

      <Header />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl + 64 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={dashboard.refreshing}
            onRefresh={dashboard.refresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {dashboard.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Couldn&apos;t reach CarryMe API</Text>
            <Text style={styles.errorBody}>{dashboard.error}</Text>
          </View>
        )}

        {dashboard.activeTap ? (
          <View style={styles.rideCard}>
            <Text style={styles.rideEyebrow}>RIDE IN PROGRESS</Text>
            <Text style={styles.rideTitle}>{dashboard.activeTap.route.name}</Text>
            <Text style={styles.rideSub}>
              Paid at boarding on {dashboard.activeTap.busPlate}
            </Text>
            <View style={styles.rideProgressTrack}>
              <View
                style={[
                  styles.rideProgressFill,
                  {
                    width: `${
                      dashboard.activeTap.distanceToDestinationMeters == null
                        ? 34
                        : Math.max(
                            8,
                            Math.min(
                              92,
                              100 -
                                (dashboard.activeTap.distanceToDestinationMeters / 8000) *
                                  100,
                            ),
                          )
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.rideMeta}>
              {dashboard.activeTap.etaToDestinationMinutes != null
                ? `${dashboard.activeTap.etaToDestinationMinutes} min`
                : "On route"}
              {dashboard.activeTap.distanceToDestinationMeters != null
                ? ` · ${(dashboard.activeTap.distanceToDestinationMeters / 1000).toFixed(1)} km remaining`
                : ""}
            </Text>
          </View>
        ) : (
          <TripHero
            liveArrival={
              dashboard.liveArrival
                ? {
                    stopId: dashboard.liveArrival.stopId,
                    stopName: dashboard.liveArrival.stopName,
                    expiresAt: dashboard.liveArrival.expiresAt,
                    destinationName: dashboard.liveArrival.destinationName,
                    nextBusArrivalAt: dashboard.nextBusArrivalAt,
                  }
                : null
            }
            nearestStops={dashboard.stops.slice(0, 3)}
            allStops={allStopOptions}
            inboundBuses={dashboard.inboundBuses}
            busy={dashboard.busyAction !== null}
            error={dashboard.actionError}
            onLogArrival={handleLogArrival}
            onCancelArrival={handleCancelArrival}
            onPayNow={handlePayNow}
          />
        )}

        {!dashboard.liveArrival && (
          <InboundBuses
            stopName={dashboard.focusStop?.name ?? "Nearest stop"}
            isLiveArrival={false}
            buses={dashboard.inboundBuses}
            loading={dashboard.refreshing}
          />
        )}

        <BalanceCard
          balance={dashboard.balance}
          tripsThisWeek={dashboard.tripsThisWeek}
          devices={dashboard.devices}
        />

        <QuickActions
          boardingStopId={
            dashboard.liveArrival?.stopId ?? dashboard.focusStop?.id ?? null
          }
          boardingStopName={
            dashboard.liveArrival?.stopName ??
            dashboard.focusStop?.name ??
            "Nearest stop"
          }
          hasActiveRide={!!dashboard.activeTap}
        />

        {/* Standalone inbound buses card — only shown pre-arrival. Once the
           passenger logs an arrival the same list renders inline inside the
           TripHero embedded view, so a separate card here would duplicate it. */}
        {false && !dashboard.liveArrival && (
          <InboundBuses
            stopName={dashboard.focusStop?.name ?? "Nearest stop"}
            isLiveArrival={false}
            buses={dashboard.inboundBuses}
            loading={dashboard.refreshing}
          />
        )}

        <Pressable
          onPress={() => setShowNearestStops((value) => !value)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {showNearestStops ? "Hide nearest stops" : "Show nearest stops"}
          </Text>
        </Pressable>

        {showNearestStops && (
        <NearestStops
          stops={dashboard.stops.slice(0, 3)}
          liveStopId={dashboard.liveArrival?.stopId ?? null}
          status={dashboard.geoStatus}
          origin={dashboard.origin}
          areaLabel={dashboard.areaLabel}
          pendingStopId={
            dashboard.busyAction === "arrive"
              ? (dashboard.liveArrival?.stopId ?? null)
              : null
          }
          arrivalError={dashboard.actionError}
          onLocate={dashboard.locate}
          onPickStop={handleLogArrival}
        />
        )}

        <Pressable
          onPress={() => setShowRecentActivity((value) => !value)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {showRecentActivity ? "Hide recent activity" : "Show recent activity"}
          </Text>
        </Pressable>

        {showRecentActivity && (
          <RecentActivity entries={dashboard.recent.slice(0, 6)} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  ambientA: {
    position: "absolute",
    top: -120,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: tints.primarySoft,
  },
  ambientB: {
    position: "absolute",
    top: -80,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: tints.secondaryGlow,
  },
  bootScreen: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  bootText: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  errorBanner: {
    backgroundColor: tints.dangerSoft,
    borderColor: "rgba(239, 68, 68, 0.30)",
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
  errorTitle: {
    color: colors.status.danger,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  errorBody: {
    color: colors.ink[700],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  toggleButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  toggleText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSize.sm,
  },
  rideCard: {
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    padding: spacing.xl,
  },
  rideEyebrow: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  rideTitle: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  rideSub: {
    marginTop: 4,
    color: colors.white,
    fontSize: fontSize.sm,
  },
  rideProgressTrack: {
    marginTop: spacing.lg,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },
  rideProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  rideMeta: {
    marginTop: spacing.md,
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSize.sm,
  },
});
