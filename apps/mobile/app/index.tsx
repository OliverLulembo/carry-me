import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { Redirect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/auth/session";
import { colors, fontSize, radii, spacing } from "@/theme/tokens";
import { Button } from "@/components/Button";
import { API_BASE_URL } from "@/api/client";

const ONBOARDING_KEY = "carrymeOnboardingSeen";
const LANGUAGE_KEY = "carrymeLanguage";

const ONBOARDING = [
  require("../assets/Splash Screens/Splash Screen1.jpg"),
  require("../assets/Splash Screens/Splash Screen2.jpg"),
  require("../assets/Splash Screens/Splash Screen3.jpg"),
];

const VERTICAL_LOGO = require("../assets/Vertical Carry Me logo white text.png");

const LANGUAGES = [
  { code: "en", name: "English", region: "Available now" },
];

export default function Index() {
  const { status, signInDev, error } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      SecureStore.getItemAsync(ONBOARDING_KEY),
      SecureStore.getItemAsync(LANGUAGE_KEY),
    ])
      .then(([seenOnboarding, language]) => {
        if (cancelled) return;
        setShowOnboarding(seenOnboarding !== "1");
        setShowLanguagePicker(!language);
      })
      .catch(() => {
        if (cancelled) return;
        setShowOnboarding(true);
        setShowLanguagePicker(true);
      })
      .finally(() => {
        if (!cancelled) setCheckingSetup(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      !checkingSetup &&
      !showOnboarding &&
      !showLanguagePicker &&
      status === "signedOut" &&
      !error
    ) {
      signInDev().catch(() => {});
    }
  }, [status, error, signInDev, checkingSetup, showOnboarding, showLanguagePicker]);

  async function advanceOnboarding() {
    if (slide < ONBOARDING.length - 1) {
      setSlide((current) => current + 1);
      return;
    }

    await SecureStore.setItemAsync(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }

  async function chooseLanguage(code: string) {
    await SecureStore.setItemAsync(LANGUAGE_KEY, code);
    setShowLanguagePicker(false);
  }

  if (status === "signedIn" && !showLanguagePicker) {
    return <Redirect href="/(tabs)" />;
  }

  if (checkingSetup || showOnboarding) {
    return (
      <View style={styles.onboarding}>
        <View style={styles.splashFrame}>
          <Image
            source={ONBOARDING[slide]}
            resizeMode="contain"
            style={styles.splashImage}
          />
        </View>
        <View
          style={styles.dots}
          accessibilityLabel={`Splash screen ${slide + 1} of ${ONBOARDING.length}`}
        >
          {ONBOARDING.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === slide && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          onPress={advanceOnboarding}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && { opacity: 0.86 },
          ]}
        >
          <Text style={styles.nextButtonText}>
            {slide === ONBOARDING.length - 1 ? "Get started" : "Next"}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.brand.primary} />
        </Pressable>
      </View>
    );
  }

  if (showLanguagePicker) {
    return (
      <View style={styles.languageScreen}>
        <Image source={VERTICAL_LOGO} resizeMode="contain" style={styles.languageLogo} />
        <View style={styles.languageIntro}>
          <Text style={styles.languageTitle}>Choose your language</Text>
          <Text style={styles.languageSub}>
            English is available now. Chewa and other Zambian languages will appear here once fully integrated.
          </Text>
        </View>
        <ScrollView
          style={styles.languageList}
          contentContainerStyle={styles.languageListContent}
          showsVerticalScrollIndicator={false}
        >
          {LANGUAGES.map((language) => (
            <Pressable
              key={language.code}
              onPress={() => chooseLanguage(language.code)}
              style={({ pressed }) => [
                styles.languageOption,
                pressed && { opacity: 0.86 },
              ]}
            >
              <View>
                <Text style={styles.languageName}>{language.name}</Text>
                <Text style={styles.languageRegion}>{language.region}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.brand.primary} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.center}>
        <Image source={VERTICAL_LOGO} resizeMode="contain" style={styles.loginLogo} />
        <Text style={styles.tagline}>Tap. Ride. Done.</Text>
        <Text style={styles.desc}>
          Pre-load credits, find your bus, and skip the cash on Lusaka public
          transport.
        </Text>

        {status === "loading" && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.loadingText}>Signing you in...</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    backgroundColor: colors.brand.primary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  loginLogo: {
    width: 190,
    height: 190,
    marginBottom: spacing.lg,
  },
  tagline: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  desc: {
    marginTop: spacing.md,
    color: colors.white,
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
    color: colors.white,
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },
  helpAccent: {
    color: colors.white,
    fontWeight: "700",
  },
  onboarding: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.brand.primary,
  },
  splashFrame: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
  },
  splashImage: {
    width: "100%",
    height: "100%",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.36)",
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.white,
  },
  nextButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: colors.brand.primary,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  languageScreen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.brand.primary,
  },
  languageLogo: {
    alignSelf: "center",
    width: 132,
    height: 132,
  },
  languageIntro: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  languageTitle: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    textAlign: "center",
  },
  languageSub: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    gap: 10,
    paddingBottom: spacing.lg,
  },
  languageOption: {
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  languageName: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  languageRegion: {
    marginTop: 2,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
