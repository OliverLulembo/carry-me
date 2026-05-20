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
import { TapActions } from "@/components/TapActions";
import { OnboardTripHero } from "@/components/OnboardTripHero";
import { InboundBuses } from "@/components/InboundBuses";
import { NearestStops } from "@/components/NearestStops";
import { RecentActivity } from "@/components/RecentActivity";
import { useDashboard } from "@/hooks/useDashboard";
import { RideSync, useRide } from "@/ride/RideProvider";
import { colors, fontSize, spacing, tints } from "@/theme/tokens";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dashboard = useDashboard();
  const ride = useRide();
  const refreshRef = useRef(dashboard.refresh);
  const [showNearestStops, setShowNearestStops] = useState(false);
  const [showRecentActivity, setShowRecentActivity] = useState(false);

  useEffect(() => {
    refreshRef.current = dashboard.refresh;
  }, [dashboard.refresh]);

  useFocusEffect(
    useCallback(() => {
      refreshRef.current();
      void ride.refreshActive();
    }, [ride.refreshActive]),
  );

  const boardingContext = useMemo(
    () => ({
      boardingStopId:
        dashboard.liveArrival?.stopId ?? dashboard.focusStop?.id ?? null,
      boardingStopName:
        dashboard.liveArrival?.stopName ??
        dashboard.focusStop?.name ??
        "Nearest stop",
      destinationStopId: dashboard.liveArrival?.destinationStopId ?? null,
      isWaitingAtStop: !!dashboard.liveArrival,
      inboundBuses: dashboard.inboundBuses,
    }),
    [
      dashboard.liveArrival,
      dashboard.focusStop,
      dashboard.inboundBuses,
    ],
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

  const handleBoard = useCallback(
    async (tripId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      try {
        await ride.tapOn(tripId);
        dashboard.refresh();
      } catch {
        /* ride.error surfaces in UI */
      }
    },
    [ride, dashboard],
  );

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

  const allStopOptions = useMemo(
    () => dashboard.stops.map((s) => ({ id: s.id, name: s.name })),
    [dashboard.stops],
  );

  const activeTap = ride.activeTap;
  const isDestinationNext =
    !!activeTap?.nextStop &&
    !!(boardingContext.destinationStopId ?? activeTap.offStop?.id) &&
    activeTap.nextStop.id ===
      (boardingContext.destinationStopId ?? activeTap.offStop?.id);

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
      <RideSync context={boardingContext} />
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
            onRefresh={() => {
              dashboard.refresh();
              void ride.refreshActive();
            }}
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

        {activeTap ? (
          <OnboardTripHero
            activeTap={activeTap}
            rideLoading={ride.loading}
            rideBusy={ride.busy}
            isDestinationNext={isDestinationNext}
            canTapOff={!!activeTap.currentStop}
            onTapOff={() => ride.setModal("off")}
          />
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
            inboundBuses={ride.inboundBuses.length > 0 ? ride.inboundBuses : dashboard.inboundBuses}
            busy={dashboard.busyAction !== null}
            error={dashboard.actionError}
            onLogArrival={handleLogArrival}
            onCancelArrival={handleCancelArrival}
            onPayNow={handlePayNow}
            onBoard={handleBoard}
            boardingBusy={ride.busy}
            rideError={ride.error}
          />
        )}

        {!dashboard.liveArrival && !activeTap && (
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

        <TapActions />

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
          <RecentActivity
            entries={dashboard.recent.slice(0, 6)}
            onSeeAll={() => router.push("/wallet")}
          />
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
});
