import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fontSize, radii, shadow, spacing } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "ghost" | "onPrimary" | "onPrimaryGhost";

type Props = Omit<PressableProps, "style" | "children" | "onPress"> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  block?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  haptic?: boolean;
};

export function Button({
  label,
  variant = "primary",
  loading,
  disabled,
  leftIcon,
  rightIcon,
  onPress,
  block,
  style,
  haptic = true,
  ...rest
}: Props) {
  const palette = PALETTES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      onPress={() => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        block ? styles.block : null,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border ?? "transparent",
          borderWidth: palette.border ? 1 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
        variant === "primary" ? shadow.pop : null,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={palette.fg} size="small" />
        ) : (
          leftIcon
        )}
        <Text style={[styles.label, { color: palette.fg }]} numberOfLines={1}>
          {label}
        </Text>
        {rightIcon}
      </View>
    </Pressable>
  );
}

// Button palettes mirror apps/web. "secondary" uses the warm khaki against
// deep ink for legibility (white on khaki washes out). "ghost" stays neutral
// against the surface and is the right pick for low-priority actions like
// "Share" next to a primary "Top up".
const PALETTES: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary:        { bg: colors.brand.primary,    fg: colors.white },
  secondary:      { bg: colors.brand.secondary,  fg: colors.brand.deep },
  ghost:          { bg: colors.surface.raised,   fg: colors.ink[700],   border: colors.ink[100] },
  onPrimary:      { bg: colors.white,            fg: colors.brand.deep },
  onPrimaryGhost: { bg: "rgba(255, 255, 255, 0.14)", fg: colors.white, border: "rgba(255, 255, 255, 0.20)" },
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  block: {
    width: "100%",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
