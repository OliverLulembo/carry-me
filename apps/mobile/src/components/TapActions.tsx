import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRide } from "@/ride/RideProvider";
import { Card } from "./Card";
import { colors, fontSize, radii, spacing } from "@/theme/tokens";

export function TapActions() {
  const {
    activeTap,
    loading,
    busy,
    error,
    modal,
    setModal,
    groupSize,
    setGroupSize,
    tapOn,
    tapOff,
    boardingStopName,
    inboundBuses,
    fareHints,
  } = useRide();

  const readyBuses = useMemo(
    () => inboundBuses.filter((b) => b.arrivedAtStop),
    [inboundBuses],
  );

  const handleBoardClick = () => {
    if (readyBuses.length === 0) return;
    if (readyBuses.length === 1) {
      void tapOn(readyBuses[0]!.tripId);
      return;
    }
    setModal("board");
  };

  const hintFor = (stopId: string) => fareHints.find((h) => h.stopId === stopId);

  return (
    <>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>Quick actions</Text>
          <Text style={styles.subtitle}>
            {activeTap ? "Boarding complete" : "Tap on / tap off"}
          </Text>
        </View>

        {activeTap ? (
          <Text style={styles.onBoardHint}>
            You&apos;re on board — trip details and tap off are in the trip hero above.
          </Text>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.brand.primary} size="small" />
                <Text style={styles.loadingText}>Checking ride status…</Text>
              </View>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={readyBuses.length > 0 ? styles.stack : styles.grid}>
              <ActionButton
                icon="smartphone"
                label={readyBuses.length > 0 ? "Tap to board now" : "Tap to board"}
                sub={
                  readyBuses.length > 0
                    ? `${readyBuses[0]!.busPlate} is at your stop · ${readyBuses.length} bus${readyBuses.length === 1 ? "" : "es"} ready`
                    : inboundBuses.length > 0
                      ? "Waiting for bus to arrive"
                      : "No active buses nearby"
                }
                tone="primary"
                disabled={busy || readyBuses.length === 0}
                onPress={handleBoardClick}
                prominent={readyBuses.length > 0}
              />
              <ActionButton
                icon="users"
                label="Boarding as a group"
                sub={`${groupSize} passenger${groupSize === 1 ? "" : "s"} selected`}
                tone="secondary"
                disabled={busy}
                onPress={() => setModal("group")}
              />
            </View>
          </>
        )}
      </Card>

      <RideModal
        visible={modal === "board"}
        title="Choose your bus"
        onClose={() => setModal(null)}
      >
        <Text style={styles.modalLead}>
          Boarding at <Text style={styles.modalLeadBold}>{boardingStopName}</Text>
        </Text>
        {readyBuses.map((b) => (
          <Pressable
            key={b.tripId}
            disabled={busy}
            onPress={() => tapOn(b.tripId)}
            style={({ pressed }) => [
              styles.modalRow,
              pressed && { opacity: 0.85 },
              busy && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.modalRowTitle}>{b.busPlate}</Text>
            <Text style={styles.modalRowSub}>{b.route.name}</Text>
            <Text style={styles.modalRowAccent}>
              At your stop · {b.seatsAvailable} seats
            </Text>
          </Pressable>
        ))}
      </RideModal>

      <RideModal
        visible={modal === "off" && !!activeTap}
        title="Tap off — where are you getting off?"
        onClose={() => setModal(null)}
      >
        {activeTap && (
          <>
            <Text style={styles.modalLead}>
              From {activeTap.onStop.name} on {activeTap.route.name}
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {activeTap.route.stops
                .filter((s) => s.id !== activeTap.onStop.id)
                .map((s) => {
                  const hint = hintFor(s.id);
                  const atStop = activeTap.currentStop?.id === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      disabled={busy || !hint || !atStop}
                      onPress={() => tapOff(s.id)}
                      style={({ pressed }) => [
                        styles.modalRow,
                        pressed && { opacity: 0.85 },
                        (busy || !hint || !atStop) && { opacity: 0.55 },
                      ]}
                    >
                      <Text style={styles.modalRowTitle}>{s.name}</Text>
                      {atStop && hint ? (
                        <Text style={styles.modalRowAccent}>
                          Bus is here · {hint.totalCredits} credits
                          {activeTap.groupSize > 1
                            ? ` (${hint.creditsPerPassenger} × ${activeTap.groupSize})`
                            : ""}
                        </Text>
                      ) : hint ? (
                        <Text style={styles.modalRowMuted}>
                          Wait until the bus arrives at this stop
                        </Text>
                      ) : (
                        <Text style={styles.modalRowMuted}>Fare not configured</Text>
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </>
        )}
      </RideModal>

      <RideModal
        visible={modal === "group"}
        title="Group size"
        onClose={() => setModal(null)}
      >
        <Text style={styles.modalLead}>
          Applies to your next tap on. Total fare is multiplied by group size at tap-off.
        </Text>
        <View style={styles.groupGrid}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Pressable
              key={n}
              onPress={() => {
                setGroupSize(n);
                setModal(null);
              }}
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
      </RideModal>
    </>
  );
}

function RideModal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color={colors.ink[500]} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionButton({
  icon,
  label,
  sub,
  tone,
  disabled,
  onPress,
  prominent,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sub: string;
  tone: "primary" | "secondary";
  disabled?: boolean;
  onPress?: () => void;
  prominent?: boolean;
}) {
  if (prominent) {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.prominentBtn,
          { opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
        ]}
      >
        <View style={styles.prominentIcon}>
          <Feather name={icon} size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.prominentLabel}>{label}</Text>
          <Text style={styles.prominentSub}>{sub}</Text>
        </View>
      </Pressable>
    );
  }

  const palette =
    tone === "primary"
      ? { bg: colors.brand.primary, fg: colors.white }
      : { bg: colors.brand.secondary, fg: colors.brand.deep };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: palette.bg }]}>
        <Feather name={icon} size={20} color={palette.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  onBoardHint: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  loadingText: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  error: {
    color: colors.status.danger,
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stack: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexBasis: "48%",
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  actionSub: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  prominentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
  prominentIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  prominentLabel: {
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSize.md,
  },
  prominentSub: {
    color: "rgba(255,255,255,0.80)",
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.40)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface.raised,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  modalLead: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  modalLeadBold: {
    fontWeight: "700",
    color: colors.brand.deep,
  },
  modalRow: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.base,
    marginBottom: spacing.sm,
  },
  modalRowTitle: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  modalRowSub: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  modalRowAccent: {
    color: colors.brand.primary,
    fontSize: fontSize.xs,
    fontWeight: "600",
    marginTop: 4,
  },
  modalRowMuted: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  groupChip: {
    width: 40,
    height: 40,
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
  groupChipText: {
    fontWeight: "700",
    color: colors.brand.deep,
  },
  groupChipTextOn: {
    color: colors.white,
  },
});
