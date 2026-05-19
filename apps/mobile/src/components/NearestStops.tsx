import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, radii, spacing, tints } from "@/theme/tokens";
import type { Stop } from "@/api/client";
import { Card } from "./Card";

// Mirrors the web NearestStops card: a status caption explains *why* the list
// looks the way it does (live GPS vs. Lusaka fallback), a "Use my location"
// affordance lets the passenger upgrade from default, and each row exposes an
// "I'm here →" CTA that hands off to logArrival. The dashboard is responsible
// for actually requesting GPS — this component just renders whatever state.
export type GeoStatus =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "located"; accuracyMeters?: number }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "error"; message: string };

export type OriginInfo = {
  source: "default" | "user";
  accuracyMeters?: number;
};

export function NearestStops({
  stops,
  liveStopId,
  status = { kind: "idle" },
  origin = { source: "default" },
  areaLabel = null,
  pendingStopId = null,
  arrivalError = null,
  onPickStop,
  onLocate,
}: {
  stops: Stop[];
  liveStopId: string | null;
  status?: GeoStatus;
  origin?: OriginInfo;
  areaLabel?: string | null;
  pendingStopId?: string | null;
  arrivalError?: string | null;
  onPickStop?: (stopId: string) => void;
  onLocate?: () => void;
}) {
  const locating = status.kind === "locating";

  return (
    <Card>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Feather name="map-pin" size={14} color={colors.brand.primary} />
            <Text style={styles.title}>Nearest stops</Text>
          </View>
          <LocationCaption status={status} origin={origin} areaLabel={areaLabel} />
        </View>

        {onLocate && (
          <Pressable
            onPress={onLocate}
            disabled={locating}
            accessibilityLabel="Update my location"
            style={({ pressed }) => [
              styles.locateBtn,
              { opacity: pressed || locating ? 0.7 : 1 },
            ]}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.brand.primary} />
            ) : (
              <Feather
                name={origin.source === "user" ? "refresh-cw" : "crosshair"}
                size={12}
                color={colors.brand.deep}
              />
            )}
            <Text style={styles.locateText} numberOfLines={1}>
              {locating
                ? "Locating"
                : origin.source === "user"
                  ? "Refresh"
                  : "Use my location"}
            </Text>
          </Pressable>
        )}
      </View>

      {arrivalError && (
        <View style={styles.error}>
          <Feather
            name="alert-triangle"
            size={12}
            color={colors.status.danger}
          />
          <Text style={styles.errorText}>{arrivalError}</Text>
        </View>
      )}

      <View style={{ gap: 8 }}>
        {stops.length === 0 && (
          <Text style={styles.empty}>No stops nearby.</Text>
        )}
        {stops.map((s, i) => {
          const isLive = s.id === liveStopId;
          const isPending = pendingStopId === s.id;
          return (
            <View
              key={s.id}
              style={[styles.row, isLive && styles.rowLive]}
            >
              <View
                style={[
                  styles.index,
                  i === 0 ? styles.indexPrimary : styles.indexNeutral,
                ]}
              >
                <Text
                  style={[
                    styles.indexText,
                    i === 0 ? styles.indexTextOnPrimary : styles.indexTextNeutral,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {s.name}
                </Text>
                <View style={styles.metaRow}>
                  <Feather
                    name="navigation"
                    size={11}
                    color={colors.ink[500]}
                  />
                  <Text style={styles.meta}>
                    {s.walkingMinutes} min · {formatDistance(s.distanceMeters)}
                  </Text>
                </View>
              </View>
              {isLive ? (
                <View style={styles.waiting}>
                  <Text style={styles.waitingText}>WAITING</Text>
                </View>
              ) : (
                <Pressable
                  disabled={pendingStopId != null}
                  onPress={() => onPickStop?.(s.id)}
                  style={({ pressed }) => [
                    styles.cta,
                    pressed && { opacity: 0.7 },
                    pendingStopId != null && { opacity: 0.5 },
                  ]}
                >
                  {isPending && (
                    <ActivityIndicator
                      size="small"
                      color={colors.brand.primary}
                    />
                  )}
                  <Text style={styles.ctaText}>I&apos;m here →</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function LocationCaption({
  status,
  origin,
  areaLabel,
}: {
  status: GeoStatus;
  origin: OriginInfo;
  areaLabel: string | null;
}) {
  if (status.kind === "locating") {
    return (
      <View style={styles.captionRow}>
        <ActivityIndicator size="small" color={colors.ink[500]} />
        <Text style={styles.caption}>Finding your location…</Text>
      </View>
    );
  }
  if (status.kind === "denied") {
    return (
      <Text style={styles.caption}>
        Location permission denied — showing stops near Lusaka centre.
      </Text>
    );
  }
  if (status.kind === "unavailable") {
    return (
      <Text style={styles.caption}>
        Geolocation isn&apos;t available here — showing the default area.
      </Text>
    );
  }
  if (status.kind === "error") {
    return (
      <Text style={styles.caption}>
        Couldn&apos;t read your location. Showing the default area.
      </Text>
    );
  }
  if (origin.source === "user") {
    return (
      <View style={styles.captionRow}>
        <View style={styles.captionDot} />
        <Text style={styles.caption} numberOfLines={1}>
          {areaLabel ? `Near ${areaLabel}` : "From your current location"}
          {origin.accuracyMeters != null && origin.accuracyMeters > 0 ? (
            <Text style={styles.captionFaint}>
              {`  ·  ±${Math.round(origin.accuracyMeters)} m`}
            </Text>
          ) : null}
        </Text>
      </View>
    );
  }
  return (
    <Text style={styles.caption}>
      Showing stops near Lusaka centre — tap{" "}
      <Text style={styles.captionAccent}>Use my location</Text> for a personalised
      list.
    </Text>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
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
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  caption: {
    marginTop: 2,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  captionRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  captionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
    borderWidth: 2,
    borderColor: tints.primaryGlow,
  },
  captionFaint: {
    color: colors.ink[300],
  },
  captionAccent: {
    color: colors.brand.deep,
    fontWeight: "700",
  },
  locateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  locateText: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.xs,
  },
  error: {
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: tints.dangerSoft,
  },
  errorText: {
    color: colors.status.danger,
    fontSize: fontSize.xs,
    flex: 1,
  },
  empty: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.lg,
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
  rowLive: {
    borderColor: colors.brand.primary,
    backgroundColor: tints.primarySoft,
  },
  index: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  indexPrimary: {
    backgroundColor: colors.brand.primary,
  },
  indexNeutral: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  indexText: {
    fontWeight: "800",
    fontSize: fontSize.xs,
  },
  indexTextOnPrimary: {
    color: colors.white,
  },
  indexTextNeutral: {
    color: colors.brand.deep,
  },
  name: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  meta: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  waiting: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: tints.primarySoft,
  },
  waitingText: {
    color: colors.brand.primary700,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: tints.primarySoft,
  },
  ctaText: {
    color: colors.brand.primary700,
    fontWeight: "800",
    fontSize: fontSize.xs,
  },
});
