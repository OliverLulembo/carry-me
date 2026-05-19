import { useEffect, useRef } from "react";
import { Animated, View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, radii, spacing, tints } from "@/theme/tokens";
import type { InboundBus } from "@/api/client";
import { Card } from "./Card";

// Two presentations live in one component so the hero and the standalone
// dashboard card stay in lockstep:
//
//   "card"     — standalone surface; the default, used on the home tab pre-arrival.
//   "embedded" — rendered inside another card (e.g. the dark live-arrival hero).
//                Drops the outer Card chrome and the now-redundant stop subtitle,
//                and tints rows for legibility on the dark background.
//
// Matches the web's <InboundBuses variant="embedded" /> contract exactly.
type Variant = "card" | "embedded";

export function InboundBuses({
  stopName,
  isLiveArrival,
  buses,
  loading,
  variant = "card",
}: {
  stopName: string;
  isLiveArrival: boolean;
  buses: InboundBus[];
  loading?: boolean;
  variant?: Variant;
}) {
  const isEmbedded = variant === "embedded";

  const body = (
    <>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Feather
              name="truck"
              size={14}
              color={isEmbedded ? colors.brand.primary : colors.brand.primary}
            />
            <Text
              style={[
                styles.title,
                isEmbedded && { color: colors.white },
              ]}
            >
              Inbound buses
            </Text>
          </View>
          {!isEmbedded && (
            <Text style={styles.subtitle}>
              {isLiveArrival ? "Heading to your stop: " : "Closest stop: "}
              <Text style={styles.stopName}>{stopName}</Text>
            </Text>
          )}
        </View>
        {isLiveArrival && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {loading && buses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, isEmbedded && styles.emptyTextDark]}>
            Loading inbound buses…
          </Text>
        </View>
      ) : buses.length === 0 ? (
        <View
          style={[
            styles.empty,
            isEmbedded && styles.emptyEmbedded,
          ]}
        >
          <Feather
            name="truck"
            size={28}
            color={isEmbedded ? "rgba(255,255,255,0.55)" : colors.ink[300]}
          />
          <Text
            style={[
              styles.emptyTitle,
              isEmbedded && { color: colors.white },
            ]}
          >
            No active buses right now.
          </Text>
          <Text style={[styles.emptyText, isEmbedded && styles.emptyTextDark]}>
            Check back in a couple of minutes.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {buses.map((b) => (
            <BusRow key={b.tripId} bus={b} embedded={isEmbedded} />
          ))}
        </View>
      )}
    </>
  );

  if (isEmbedded) {
    return <View>{body}</View>;
  }
  return <Card>{body}</Card>;
}

function BusRow({ bus, embedded }: { bus: InboundBus; embedded: boolean }) {
  const blink = useRef(new Animated.Value(1)).current;
  const fillPct = Math.max(
    0,
    Math.min(100, ((bus.capacity - bus.seatsAvailable) / bus.capacity) * 100),
  );
  const tone =
    fillPct < 50
      ? colors.status.success
      : fillPct < 80
        ? colors.status.warn
        : colors.status.danger;
  const shouldBlink = tone === colors.status.success;

  useEffect(() => {
    if (!shouldBlink) {
      blink.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink, shouldBlink]);

  return (
    <View style={[styles.row, embedded && styles.rowEmbedded]}>
      <View style={{ flex: 1 }}>
        <View style={styles.rowHead}>
          <View style={styles.plate}>
            <Text style={styles.plateText}>{bus.busPlate}</Text>
          </View>
          <Text
            style={[styles.routeName, embedded && { color: "rgba(255,255,255,0.7)" }]}
            numberOfLines={1}
          >
            {bus.route.name}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather
              name="clock"
              size={12}
              color={embedded ? "rgba(255,255,255,0.7)" : colors.ink[500]}
            />
            <Text
              style={[styles.metaText, embedded && { color: colors.white }]}
            >
              {bus.etaMinutes != null ? `${bus.etaMinutes} min` : "ETA—"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather
              name="users"
              size={12}
              color={embedded ? "rgba(255,255,255,0.7)" : colors.ink[500]}
            />
            <Text
              style={[styles.metaText, embedded && { color: colors.white }]}
            >
              {bus.seatsAvailable}/{bus.capacity} seats
            </Text>
          </View>
          {bus.lastSeenAgoMinutes != null && bus.lastSeenAgoMinutes > 2 && (
            <View style={styles.warnPill}>
              <Text style={styles.warnPillText}>
                Last seen {bus.lastSeenAgoMinutes}m ago
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.barTrack,
            embedded && { backgroundColor: "rgba(255,255,255,0.18)" },
          ]}
        >
          <Animated.View
            style={[
              styles.barFill,
              {
                width: `${fillPct}%`,
                minWidth: shouldBlink ? 28 : 0,
                backgroundColor: tone,
                opacity: shouldBlink ? blink : 1,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.seatsBlock}>
        <Text style={styles.seatsCount}>{bus.seatsAvailable}</Text>
        <Text
          style={[
            styles.seatsLabel,
            embedded && { color: "rgba(255,255,255,0.7)" },
          ]}
        >
          {bus.seatsAvailable === 1 ? "seat free" : "seats free"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  stopName: {
    color: colors.brand.deep,
    fontWeight: "700",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: tints.primarySoft,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  liveText: {
    color: colors.brand.primary700,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.4,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 4,
  },
  emptyEmbedded: {
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  emptyTitle: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
    marginTop: 6,
  },
  emptyText: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  emptyTextDark: {
    color: "rgba(255,255,255,0.75)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  rowEmbedded: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plate: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.brand.deep,
  },
  plateText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  routeName: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    flex: 1,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: colors.ink[700],
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  warnPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: tints.warnSoft,
  },
  warnPillText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "700",
  },
  barTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink[100],
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Right-rail "seats free" summary block — replaces the previous "Reserve"
  // CTA so the row prioritises information (how full this bus is) over an
  // action that the backend can't honour yet.
  seatsBlock: {
    alignItems: "flex-end",
    paddingLeft: 6,
    minWidth: 56,
  },
  seatsCount: {
    color: colors.brand.primary,
    fontWeight: "800",
    fontSize: 28,
    lineHeight: 30,
  },
  seatsLabel: {
    marginTop: 2,
    color: colors.ink[500],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
