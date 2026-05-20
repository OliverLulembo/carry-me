import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontSize, radii, shadow, spacing, tints } from "@/theme/tokens";
import type { InboundBus } from "@/api/client";
import { Button } from "./Button";
import { InboundBuses } from "./InboundBuses";

export type NearestStop = {
  id: string;
  name: string;
  walkingMinutes: number;
  distanceMeters: number;
};

export type StopOption = {
  id: string;
  name: string;
};

export type LiveArrival = {
  stopId: string;
  stopName: string;
  expiresAt: string;
  destinationName?: string | null;
  // Absolute ISO timestamp of the soonest inbound bus. The hero ticks down
  // from this on the client so the count stays smooth between server refreshes.
  nextBusArrivalAt?: string | null;
};

type Props = {
  liveArrival: LiveArrival | null;
  nearestStops: NearestStop[];
  allStops: StopOption[];
  inboundBuses: InboundBus[];
  busy: boolean;
  error: string | null;
  onLogArrival: (stopId: string, destinationStopId?: string) => void;
  onCancelArrival: () => void;
  onPayNow: (tripId: string) => void;
  payingTripId?: string | null;
};

// Mirrors apps/web TripHero. The pre-arrival view is destination-first: only the
// destination typeahead shows until a stop is picked; then nearby stops, CTA,
// and footnote appear.
// Once arrival is logged the hero switches to a dark "WAITING AT STOP" mode
// that embeds the inbound-buses list inline so passengers don't leave the
// hero to see what's coming.
export function TripHero({
  liveArrival,
  nearestStops,
  allStops,
  inboundBuses,
  busy,
  error,
  onLogArrival,
  onCancelArrival,
  onPayNow,
  payingTripId,
}: Props) {
  const [destination, setDestination] = useState<StopOption | null>(null);
  const [arrivalStopId, setArrivalStopId] = useState<string | undefined>(
    nearestStops[0]?.id,
  );

  useEffect(() => {
    if (!arrivalStopId && nearestStops[0]) {
      setArrivalStopId(nearestStops[0].id);
    }
  }, [nearestStops, arrivalStopId]);

  if (liveArrival) {
    return (
      <WaitingHero
        arrival={liveArrival}
        inboundBuses={inboundBuses}
        busy={busy}
        onCancel={onCancelArrival}
        onPayNow={onPayNow}
        payingTripId={payingTripId}
      />
    );
  }

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.orb} pointerEvents="none" />

      <View style={styles.eyebrowRow}>
        <Feather name="navigation" size={12} color={colors.brand.primary} />
        <Text style={styles.eyebrow}>PLAN YOUR RIDE</Text>
      </View>

      <Text style={styles.heading}>Where are you headed?</Text>
      {destination && (
        <Text style={styles.sub}>
          Tell us where you are now and we&apos;ll show you the right bus to catch.
        </Text>
      )}

      <View style={{ marginTop: spacing.md }}>
        <DestinationAutocomplete
          stops={allStops}
          selected={destination}
          onSelect={setDestination}
          excludeStopId={arrivalStopId}
        />
      </View>

      {destination && (
        <>
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.pickLabel}>WHERE ARE YOU NOW?</Text>
            <View style={styles.stops}>
              {nearestStops.map((s) => {
                const active = s.id === arrivalStopId;
                const disabled = s.id === destination.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      if (disabled) return;
                      Haptics.selectionAsync().catch(() => {});
                      setArrivalStopId(s.id);
                    }}
                    disabled={disabled}
                    style={({ pressed }) => [
                      styles.stop,
                      active && !disabled && styles.stopActive,
                      pressed && !active && !disabled && styles.stopPressed,
                      disabled && styles.stopDisabled,
                    ]}
                  >
                    <View style={styles.stopRow}>
                      <Text style={styles.stopName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      {active && !disabled && (
                        <Feather
                          name="check-circle"
                          size={16}
                          color={colors.brand.primary}
                        />
                      )}
                    </View>
                    <Text style={styles.stopMeta}>
                      {s.walkingMinutes} min walk · {Math.round(s.distanceMeters)} m
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error && (
            <View style={styles.error}>
              <Feather name="alert-triangle" size={14} color={colors.status.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            label={`I'm here — find my bus to ${destination.name}`}
            loading={busy}
            disabled={!arrivalStopId}
            rightIcon={
              <Feather name="arrow-right" size={16} color={colors.white} />
            }
            onPress={() =>
              arrivalStopId && onLogArrival(arrivalStopId, destination.id)
            }
            block
            style={{ marginTop: spacing.lg }}
          />
          <Text style={styles.footnote}>
            Logs your arrival for 30 min. Drivers on inbound routes will see you.
          </Text>
        </>
      )}
    </View>
  );
}

function WaitingHero({
  arrival,
  inboundBuses,
  busy,
  onCancel,
  onPayNow,
  payingTripId,
}: {
  arrival: LiveArrival;
  inboundBuses: InboundBus[];
  busy: boolean;
  onCancel: () => void;
  onPayNow: (tripId: string) => void;
  payingTripId?: string | null;
}) {
  const nextBusCountdown = useCountdown(arrival.nextBusArrivalAt);

  return (
    <LinearGradient
      colors={["#1A1814", colors.brand.deep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.cardDark, shadow.card]}
    >
      <View style={styles.darkOrbA} pointerEvents="none" />
      <View style={styles.darkOrbB} pointerEvents="none" />

      <View style={styles.eyebrowRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>WAITING AT STOP</Text>
      </View>

      {arrival.destinationName && (
        <View style={styles.toPill}>
          <Feather name="navigation" size={12} color={colors.brand.primary} />
          <Text style={styles.toPillLabel}>Heading to</Text>
          <Text style={styles.toPillName} numberOfLines={1}>
            {arrival.destinationName}
          </Text>
        </View>
      )}

      <Text style={styles.darkHeading}>
        You&apos;re at{" "}
        <Text style={styles.darkHeadingAccent}>{arrival.stopName}</Text>
      </Text>
      <Text style={styles.darkSub}>
        Drivers heading here know you&apos;re waiting. Hold your phone to the
        driver&apos;s reader to board.
      </Text>

      <View style={styles.darkPills}>
        <View style={styles.darkPill}>
          <Feather name="wifi" size={12} color={colors.white} />
          <Text style={styles.darkPillText}>Tap-to-ride ready</Text>
        </View>
        {arrival.nextBusArrivalAt && nextBusCountdown != null ? (
          <View style={styles.darkPill}>
            <Feather name="clock" size={12} color={colors.brand.primary} />
            <Text style={styles.darkPillLabel}>Next bus in</Text>
            <Text style={styles.darkPillAccent}>
              {formatCountdown(nextBusCountdown)}
            </Text>
          </View>
        ) : (
          <View style={styles.darkPill}>
            <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.darkPillTextMuted}>No buses inbound yet</Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <InboundBuses
          stopName={arrival.stopName}
          isLiveArrival
          buses={inboundBuses}
          variant="embedded"
          onPayNow={onPayNow}
          payingTripId={payingTripId}
        />
      </View>

      <Button
        label="I'm no longer waiting"
        variant="onPrimaryGhost"
        onPress={onCancel}
        loading={busy}
        block
        style={{ marginTop: spacing.lg }}
      />

      {busy && (
        <ActivityIndicator
          color={colors.brand.primary}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </LinearGradient>
  );
}

// ─── Destination autocomplete ──────────────────────────────────────────────
// Mirrors the web combobox: a search input that filters the master stop list,
// excludes the currently-selected origin, and lets the user clear back to the
// empty state. Up to 6 default suggestions when the query is empty so the
// list is useful without typing.
function DestinationAutocomplete({
  stops,
  selected,
  onSelect,
  excludeStopId,
}: {
  stops: StopOption[];
  selected: StopOption | null;
  onSelect: (s: StopOption | null) => void;
  excludeStopId?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = stops.filter((s) => s.id !== excludeStopId);
    if (!q) return base.slice(0, 6);
    return base.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [stops, query, excludeStopId]);

  function pick(s: StopOption) {
    onSelect(s);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clear() {
    onSelect(null);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  const isActive = open || !!selected;

  return (
    <View>
      <View style={[styles.combo, isActive && styles.comboActive]}>
        <Feather
          name="search"
          size={18}
          color={isActive ? colors.brand.primary : colors.ink[300]}
        />
        {selected ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedEyebrow}>TO</Text>
            <Text style={styles.selectedName} numberOfLines={1}>
              {selected.name}
            </Text>
          </View>
        ) : (
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search a destination (e.g. Town, Manda Hill)"
            placeholderTextColor={colors.ink[300]}
            style={styles.comboInput}
          />
        )}
        {(selected || query.length > 0) && (
          <Pressable
            onPress={clear}
            accessibilityLabel="Clear destination"
            style={({ pressed }) => [
              styles.clearBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={14} color={colors.ink[500]} />
          </Pressable>
        )}
      </View>

      {open && !selected && (
        <View style={styles.listbox}>
          {filtered.length === 0 ? (
            <View style={styles.listEmpty}>
              <Text style={styles.listEmptyText}>
                No stop matches &ldquo;{query}&rdquo;
              </Text>
              <Text style={styles.listEmptySub}>
                Try a shorter name (e.g. &ldquo;Town&rdquo; instead of
                &ldquo;Town Bus Station&rdquo;)
              </Text>
            </View>
          ) : (
            <>
              {!query && (
                <Text style={styles.listHeader}>SUGGESTED DESTINATIONS</Text>
              )}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 260 }}
              >
                {filtered.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => pick(s)}
                    style={({ pressed }) => [
                      styles.listRow,
                      pressed && styles.listRowPressed,
                    ]}
                  >
                    <View style={styles.listRowIcon}>
                      <Feather
                        name="map-pin"
                        size={14}
                        color={colors.ink[500]}
                      />
                    </View>
                    <Text style={styles.listRowText} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={14}
                      color={colors.ink[300]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// Seconds-precision countdown used by the WAITING hero's "next bus in" pill.
// Returns null when there's no target so callers can render an empty state.
function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return useMemo(() => {
    if (!target) return null;
    const diffMs = new Date(target).getTime() - now;
    return Math.max(0, Math.round(diffMs / 1000));
  }, [target, now]);
}

function formatCountdown(totalSeconds: number) {
  if (totalSeconds <= 0) return "Arriving";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  cardDark: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  orb: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  darkOrbA: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: tints.primaryStrong,
  },
  darkOrbB: {
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
    gap: 6,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heading: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  sub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.82)",
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  pickLabel: {
    marginTop: 4,
    marginBottom: 8,
    color: "rgba(255,255,255,0.82)",
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  stops: {
    gap: 8,
  },
  stop: {
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
    backgroundColor: tints.primarySoft,
  },
  stopDisabled: {
    backgroundColor: colors.surface.base,
    opacity: 0.55,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stopName: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
    flex: 1,
  },
  stopMeta: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  error: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: tints.dangerSoft,
    borderRadius: radii.md,
  },
  errorText: {
    color: colors.status.danger,
    fontSize: fontSize.sm,
    flex: 1,
  },
  footnote: {
    marginTop: 8,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  // ── Live arrival (dark) ──────────────────────────────────────────────────
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  liveText: {
    color: colors.brand.primary,
    fontWeight: "800",
    fontSize: fontSize.xs,
    letterSpacing: 1.4,
  },
  toPill: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: tints.onDarkMedium,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignSelf: "flex-start",
  },
  toPillLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.xs,
  },
  toPillName: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "700",
    flexShrink: 1,
  },
  darkHeading: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  darkHeadingAccent: {
    color: colors.brand.primary,
  },
  darkSub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  darkPills: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  darkPill: {
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
  darkPillText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  darkPillTextMuted: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.xs,
  },
  darkPillLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.xs,
  },
  darkPillAccent: {
    color: colors.brand.primary,
    fontWeight: "800",
    fontSize: fontSize.xs,
  },
  // ── Autocomplete ─────────────────────────────────────────────────────────
  combo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  comboActive: {
    borderColor: colors.brand.primary,
  },
  comboInput: {
    flex: 1,
    color: colors.brand.deep,
    fontSize: fontSize.md,
    padding: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surface.base,
  },
  selectedRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedEyebrow: {
    color: colors.brand.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  selectedName: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "700",
    flexShrink: 1,
  },
  listbox: {
    marginTop: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
    overflow: "hidden",
    ...shadow.card,
  },
  listHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 4,
    color: colors.ink[500],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  listRowPressed: {
    backgroundColor: tints.primarySoft,
  },
  listRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surface.base,
    alignItems: "center",
    justifyContent: "center",
  },
  listRowText: {
    flex: 1,
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  listEmpty: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  listEmptyText: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
  },
  listEmptySub: {
    color: colors.ink[300],
    fontSize: fontSize.xs,
    marginTop: 4,
    textAlign: "center",
  },
});
