import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { colors, radii, spacing, fontSize, tints } from "@/theme/tokens";

type Tone =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "deep"
  | "success"
  | "warn"
  | "danger"
  | "onDark";

// Pill palettes mirror the web's tone vocabulary. "primary" reads as a soft
// brand wash on a white surface; "deep" inverts to the brand-deep accent;
// "onDark" is the translucent variant used on top of dark hero surfaces.
const PALETTE: Record<Tone, { bg: string; fg: string; border?: string }> = {
  neutral:   { bg: colors.surface.base,        fg: colors.ink[700],         border: colors.ink[100] },
  primary:   { bg: tints.primarySoft,          fg: colors.brand.primary700 },
  secondary: { bg: tints.secondarySoft,        fg: colors.ink[700],         border: colors.ink[100] },
  accent:    { bg: tints.secondaryGlow,        fg: colors.brand.deep },
  deep:      { bg: colors.brand.deep,          fg: colors.white },
  success:   { bg: tints.successSoft,          fg: "#15803D" },
  warn:      { bg: tints.warnSoft,             fg: "#B45309" },
  danger:    { bg: tints.dangerSoft,           fg: "#B91C1C" },
  onDark:    { bg: tints.onDarkSoft,           fg: colors.white,            border: tints.onDarkMedium },
};

export function Pill({
  children,
  tone = "neutral",
  icon,
  style,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  const palette = PALETTE[tone];
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border ?? "transparent",
          borderWidth: palette.border ? 1 : 0,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
