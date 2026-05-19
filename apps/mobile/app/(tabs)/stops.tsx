import { useCallback, useEffect, useState } from "react";
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
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { InboundBuses } from "@/components/InboundBuses";
import { useToken } from "@/auth/session";
import {
  getInboundBuses,
  getNearbyStops,
  logArrival,
} from "@/api/endpoints";
import type { InboundBus, Stop } from "@/api/client";
import { colors, fontSize, radii, spacing } from "@/theme/tokens";

const DEFAULT_LOCATION = { lat: -15.4167, lng: 28.2833 };

export default function StopsScreen() {
  const insets = useSafeAreaInsets();
  const token = useToken();
  const [stops, setStops] = useState<Stop[]>([]);
  const [loc, setLoc] = useState<{ lat: number; lng: number; resolved: boolean }>({
    ...DEFAULT_LOCATION,
    resolved: false,
  });
  const [selected, setSelected] = useState<Stop | null>(null);
  const [buses, setBuses] = useState<InboundBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busAction, setBusAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStops = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "refresh") setRefreshing(true);
      try {
        let here = loc;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            here = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              resolved: true,
            };
            setLoc(here);
          } else {
            here = { ...here, resolved: false };
          }
        } catch {
          /* keep default */
        }

        const res = await getNearbyStops(token, here.lat, here.lng, 10);
        setStops(res.stops);
        if (!selected && res.stops[0]) setSelected(res.stops[0]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, selected, loc],
  );

  useEffect(() => {
    fetchStops("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh inbound buses whenever the selected stop changes.
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getInboundBuses(token, selected.id);
        if (!cancelled) setBuses(res.buses);
      } catch {
        if (!cancelled) setBuses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, selected]);

  const onPickStop = useCallback((s: Stop) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected(s);
    setActionMessage(null);
  }, []);

  const onLogArrival = useCallback(async () => {
    if (!selected) return;
    setBusAction(true);
    setActionMessage(null);
    try {
      await logArrival(token, selected.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setActionMessage(`You're now waiting at ${selected.name}. Open Home for the live view.`);
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Could not log arrival",
      );
    } finally {
      setBusAction(false);
    }
  }, [token, selected]);

  if (loading) {
    return (
      <View style={styles.root}>
        <Header subtitle="Stops" />
        <View style={styles.boot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header subtitle="Stops" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl + 64 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStops("refresh")}
            tintColor={colors.brand.primary}
          />
        }
      >
        <Card>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.cardTitle}>Stops near you</Text>
              <Text style={styles.cardSub}>
                {loc.resolved
                  ? `Centred on your live location`
                  : `Using Lusaka centre — grant location to refine`}
              </Text>
            </View>
            <Pill tone="secondary">{stops.length} stops</Pill>
          </View>

          <View style={{ gap: 8, marginTop: spacing.md }}>
            {stops.map((s) => {
              const active = selected?.id === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => onPickStop(s)}
                  style={({ pressed }) => [
                    styles.stopRow,
                    active && styles.stopActive,
                    pressed && !active && styles.stopPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.bullet,
                      active && { backgroundColor: colors.brand.primary },
                    ]}
                  >
                    <Feather
                      name="map-pin"
                      size={14}
                      color={active ? colors.white : colors.brand.deep}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopName}>{s.name}</Text>
                    <Text style={styles.stopMeta}>
                      {s.walkingMinutes} min walk · {Math.round(s.distanceMeters)} m
                    </Text>
                  </View>
                  {active && (
                    <Feather
                      name="check-circle"
                      size={18}
                      color={colors.brand.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {selected && (
          <>
            <Card>
              <Text style={styles.cardTitle}>{selected.name}</Text>
              <Text style={styles.cardSub}>
                Let drivers know you're here so they can pick you up.
              </Text>

              {actionMessage && (
                <View style={styles.toast}>
                  <Feather
                    name="check"
                    size={14}
                    color={colors.brand.deep}
                  />
                  <Text style={styles.toastText}>{actionMessage}</Text>
                </View>
              )}

              <Button
                label={`I'm here at ${selected.name}`}
                onPress={onLogArrival}
                loading={busAction}
                rightIcon={<Feather name="arrow-right" size={16} color={colors.white} />}
                block
                style={{ marginTop: spacing.md }}
              />
            </Card>

            <InboundBuses
              stopName={selected.name}
              isLiveArrival={false}
              buses={buses}
            />
          </>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  cardSub: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  stopPressed: {
    backgroundColor: colors.surface.base,
  },
  stopActive: {
    borderColor: colors.brand.primary,
    backgroundColor: "rgba(243, 66, 19, 0.06)",
  },
  bullet: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.ink[100],
    alignItems: "center",
    justifyContent: "center",
  },
  stopName: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  stopMeta: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  toast: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(243, 66, 19, 0.10)",
    borderRadius: radii.md,
  },
  toastText: {
    flex: 1,
    color: colors.brand.deep,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
