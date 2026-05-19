import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/auth/session";
import { colors, fontSize, radii, shadow, spacing } from "@/theme/tokens";
import { Button } from "@/components/Button";
import { BrandLogo } from "@/components/BrandLogo";
import { API_BASE_URL } from "@/api/client";

export default function Index() {
  const { status, signInDev, error } = useAuth();

  // Auto-attempt dev sign-in the moment auth resolves to signed-out — matches
  // the web app's one-click "Open passenger dashboard (dev)" flow.
  useEffect(() => {
    if (status === "signedOut" && !error) {
      signInDev().catch(() => {});
    }
  }, [status, error, signInDev]);

  if (status === "signedIn") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <LinearGradient
      colors={[colors.brand.primary, "#B7320D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.orb} />
      <View style={styles.orb2} />

      <View style={styles.center}>
        {/* Forced "dark" variant: the white-text artwork is what reads
           correctly on the orange gradient regardless of the OS theme. */}
        <BrandLogo variant="dark" height={56} style={styles.logo} />
        <Text style={styles.tagline}>Tap. Ride. Done.</Text>
        <Text style={styles.desc}>
          Pre-load credits, find your bus, and skip the cash on Lusaka public
          transport.
        </Text>

        {status === "loading" && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.loadingText}>Signing you in…</Text>
          </View>
        )}

        {status === "signedOut" && (
          <>
            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-triangle" size={14} color={colors.white} />
                <Text style={styles.errorText} numberOfLines={3}>
                  {error}
                </Text>
              </View>
            )}
            <Button
              label="Open passenger dashboard (dev)"
              variant="onPrimary"
              onPress={() => signInDev()}
              rightIcon={
                <Feather name="arrow-right" size={16} color={colors.brand.deep} />
              }
              block
              style={{ marginTop: spacing.lg }}
            />
            <Text style={styles.help}>
              Make sure the API is reachable at{"\n"}
              <Text style={styles.helpAccent}>{API_BASE_URL}</Text>
            </Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  orb: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  orb2: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(190, 183, 164, 0.28)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  logo: {
    marginBottom: spacing.lg,
  },
  tagline: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.md,
    letterSpacing: 0.4,
  },
  desc: {
    marginTop: spacing.md,
    color: "rgba(255, 255, 255, 0.84)",
    fontSize: fontSize.sm,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20,
  },
  loadingRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: colors.white,
    fontWeight: "600",
  },
  errorBox: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    borderRadius: radii.md,
  },
  errorText: {
    color: colors.white,
    fontSize: fontSize.xs,
    flex: 1,
  },
  help: {
    marginTop: spacing.lg,
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },
  helpAccent: {
    color: colors.white,
    fontWeight: "700",
  },
});
