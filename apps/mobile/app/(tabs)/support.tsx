import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { colors, fontSize, radii, spacing } from "@/theme/tokens";

export default function SupportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Header subtitle="Support" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl + 64 },
        ]}
      >
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.primary700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Support</Text>
          <Text style={styles.heroSub}>
            Get help with payments, trips, and linked devices.
          </Text>
        </LinearGradient>

        <Card>
          <Text style={styles.body}>
            <Text style={styles.label}>Payments:</Text> Fare is charged when you tap off at your destination.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.label}>Phone:</Text> +260 977 000 000
          </Text>
          <Text style={styles.body}>
            <Text style={styles.label}>Email:</Text> support@carryme.local
          </Text>
        </Card>
      </ScrollView>
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
  body: {
    color: colors.ink[700],
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  label: {
    fontWeight: "700",
    color: colors.brand.deep,
  },
});
