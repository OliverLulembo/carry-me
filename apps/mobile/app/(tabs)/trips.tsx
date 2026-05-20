import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { useToken } from "@/auth/session";
import { getTrips, type PassengerTrip } from "@/api/endpoints";
import { formatZmw } from "@/lib/format";
import { colors, fontSize, radii, spacing } from "@/theme/tokens";

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const token = useToken();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!token) return;
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await getTrips(token, 20);
        setTrips(res.trips);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load trips");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      load("initial");
    }, [load]),
  );

  return (
    <View style={styles.root}>
      <Header subtitle="Trips" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl + 64 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load("refresh")}
            tintColor={colors.brand.primary}
          />
        }
      >
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.primary700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Trips</Text>
          <Text style={styles.heroSub}>
            Your recent boarding payments and rides.
          </Text>
        </LinearGradient>

        <Card>
          {loading && trips.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brand.primary} />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : trips.length === 0 ? (
            <Text style={styles.empty}>No trips yet.</Text>
          ) : (
            trips.map((trip, index) => (
              <TripRow key={trip.id} trip={trip} bordered={index > 0} />
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function TripRow({ trip, bordered }: { trip: PassengerTrip; bordered: boolean }) {
  const credits = trip.finalCredits ?? trip.reservedCredits;
  return (
    <View style={[styles.row, bordered && styles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.routeName}>{trip.trip.routeName}</Text>
        <Text style={styles.rowSub}>
          {trip.onStop.name}
          {trip.offStop ? ` to ${trip.offStop.name}` : ""} on {trip.trip.busPlate}
        </Text>
      </View>
      <Text style={styles.credits}>{formatZmw(credits)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  heroTitle: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  heroSub: {
    marginTop: 4,
    color: "rgba(255,255,255,0.80)",
    fontSize: fontSize.sm,
  },
  center: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  empty: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
    paddingVertical: spacing.lg,
  },
  error: {
    color: colors.status.danger,
    fontSize: fontSize.sm,
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
  },
  routeName: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  rowSub: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  credits: {
    color: colors.brand.primary,
    fontWeight: "800",
    fontSize: fontSize.sm,
  },
});
