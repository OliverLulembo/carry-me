import { View, StyleSheet, type ViewProps, type ViewStyle } from "react-native";
import { colors, radii, shadow } from "@/theme/tokens";

type Props = ViewProps & { padded?: boolean; tone?: "raised" | "subtle" };

export function Card({ style, padded = true, tone = "raised", ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        tone === "subtle" ? styles.subtle : styles.raised,
        padded ? styles.padded : null,
        style as ViewStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
  },
  raised: {
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: "rgba(230, 226, 218, 0.6)",
    ...shadow.card,
  },
  subtle: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  padded: {
    padding: 20,
  },
});
