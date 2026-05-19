import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/Button";
import { useToken } from "@/auth/session";
import { getWallet, topUp, type TopUpMethod } from "@/api/endpoints";
import { colors, fontSize, radii, shadow, spacing, tints } from "@/theme/tokens";
import { formatZmw } from "@/lib/format";

// Mirrors apps/web TopUpModal: a three-tab flow (Mobile money / Card / Booth)
// with staged processing so the user feels the difference between sending an
// STK push and authorising a card. Booth is intentionally a "notify me"
// teaser so the UI prepares people for the cash-load partner rollout.

type TabId = "momo" | "card" | "booth";
type Provider = "MTN_MOMO" | "AIRTEL_MONEY" | "ZAMTEL_KWACHA" | "ZEDMOBILE_WALLET";

type FlowState =
  | "idle"
  | "momo_sending"
  | "momo_awaiting"
  | "card_verifying"
  | "card_processing"
  | "success"
  | "error";

type CardForm = { number: string; expiry: string; cvv: string; name: string };

const PRESETS = [20, 50, 100, 200];

const PROVIDERS: {
  id: Provider;
  label: string;
  logo: ImageSourcePropType;
}[] = [
  { id: "MTN_MOMO", label: "MTN MoMo", logo: require("../assets/payment-logos/momo.png") },
  { id: "AIRTEL_MONEY", label: "Airtel Money", logo: require("../assets/payment-logos/airtel.png") },
  { id: "ZAMTEL_KWACHA", label: "Zamtel Money", logo: require("../assets/payment-logos/zamtel.png") },
  { id: "ZEDMOBILE_WALLET", label: "Zedmobile Wallet", logo: require("../assets/payment-logos/zedmobile.png") },
];

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useToken();
  const [tab, setTab] = useState<TabId>("momo");
  const [amount, setAmount] = useState(50);
  const [customText, setCustomText] = useState("");
  const [provider, setProvider] = useState<Provider>("MTN_MOMO");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState<CardForm>({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [balance, setBalance] = useState<number | null>(null);
  const [flow, setFlow] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  const busy =
    flow !== "idle" && flow !== "error" && flow !== "success";

  // Pre-fetch the balance so the header card can show context — same as the
  // web modal's "Balance · K0" subtitle. Fail silently; the screen still
  // works without it.
  useEffect(() => {
    let cancelled = false;
    getWallet(token)
      .then((res) => {
        if (!cancelled) setBalance(res.wallet.balance);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  const effectiveAmount = customText
    ? Math.max(0, Math.min(2000, parseInt(customText, 10) || 0))
    : amount;

  const momoValid = phone.replace(/\D/g, "").length >= 9;
  const cardValid =
    card.number.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    card.cvv.length === 3;

  const persistTopUp = useCallback(
    async (method: TopUpMethod) => {
      await topUp(token, effectiveAmount, method);
    },
    [token, effectiveAmount],
  );

  async function runMomoFlow() {
    setError(null);
    try {
      setFlow("momo_sending");
      await sleep(1300);
      setFlow("momo_awaiting");
      await sleep(1800);
      await persistTopUp(provider);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setFlow("success");
      await sleep(1400);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Top-up failed");
      setFlow("error");
    }
  }

  async function runCardFlow() {
    setError(null);
    try {
      setFlow("card_verifying");
      await sleep(900);
      setFlow("card_processing");
      await sleep(1400);
      await persistTopUp("CARD");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setFlow("success");
      await sleep(1400);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setFlow("error");
    }
  }

  const showSuccess = flow === "success";
  const showProcessing = busy;
  const showForm = !showSuccess && !showProcessing;
  const showFooter = showForm;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Brand header ────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[colors.brand.primary, "#D63A0F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, shadow.pop]}
        >
          <View style={styles.headerOrbA} pointerEvents="none" />
          <View style={styles.headerOrbB} pointerEvents="none" />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>TOP UP WALLET</Text>
              <Text style={styles.title}>Add credits</Text>
              {balance != null && (
                <Text style={styles.balance}>
                  Balance ·{" "}
                  <Text style={styles.balanceStrong}>{formatZmw(balance)}</Text>
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => !busy && router.back()}
              disabled={busy}
              style={({ pressed }) => [
                styles.close,
                { opacity: pressed || busy ? 0.55 : 1 },
              ]}
              accessibilityLabel="Close top up"
            >
              <Feather name="x" size={18} color={colors.white} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <View style={styles.tabs}>
          <TabButton
            active={tab === "momo"}
            onPress={() => !busy && setTab("momo")}
            icon="smartphone"
            label="Mobile"
          />
          <TabButton
            active={tab === "card"}
            onPress={() => !busy && setTab("card")}
            icon="credit-card"
            label="Card"
          />
          <TabButton
            active={tab === "booth"}
            onPress={() => !busy && setTab("booth")}
            icon="home"
            label="Booth"
            badge="Soon"
          />
        </View>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <View style={styles.body}>
          {showSuccess ? (
            <SuccessView amount={effectiveAmount} />
          ) : showProcessing ? (
            <ProcessingView
              state={flow}
              provider={provider}
              amount={effectiveAmount}
            />
          ) : (
            <>
              {tab === "momo" && (
                <MomoTab
                  provider={provider}
                  setProvider={setProvider}
                  phone={phone}
                  setPhone={setPhone}
                />
              )}
              {tab === "card" && <CardTab card={card} setCard={setCard} />}
              {tab === "booth" && (
                <BoothTab notified={notified} onNotify={() => setNotified(true)} />
              )}

              {tab !== "booth" && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={styles.smallLabel}>AMOUNT</Text>
                  <View style={styles.presetGrid}>
                    {PRESETS.map((v) => {
                      const selected = !customText && amount === v;
                      return (
                        <Pressable
                          key={v}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setAmount(v);
                            setCustomText("");
                          }}
                          style={({ pressed }) => [
                            styles.preset,
                            selected && styles.presetActive,
                            pressed && !selected && { opacity: 0.85 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.presetText,
                              selected && styles.presetTextActive,
                            ]}
                          >
                            K{v}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.customAmount}>
                    <Text style={styles.currency}>K</Text>
                    <TextInput
                      keyboardType="number-pad"
                      placeholder="Other amount (10–2000)"
                      placeholderTextColor={colors.ink[300]}
                      value={customText}
                      onChangeText={(t) =>
                        setCustomText(t.replace(/[^0-9]/g, "").slice(0, 4))
                      }
                      style={styles.customInput}
                    />
                  </View>
                </View>
              )}

              {error && (
                <View style={styles.error}>
                  <Feather
                    name="alert-triangle"
                    size={14}
                    color={colors.status.danger}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {showFooter && (
          <View style={styles.footer}>
            {tab === "booth" ? (
              <View style={styles.footerBooth}>
                <Text style={styles.footerNote}>
                  Pick mobile money or card to top up right now.
                </Text>
                <Button
                  label="Close"
                  variant="ghost"
                  onPress={() => router.back()}
                />
              </View>
            ) : (
              <View style={styles.footerGrid}>
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={() => router.back()}
                  style={{ flex: 1 }}
                />
                <Button
                  label={
                    tab === "momo"
                      ? `Request K${effectiveAmount}`
                      : `Pay K${effectiveAmount}`
                  }
                  onPress={tab === "momo" ? runMomoFlow : runCardFlow}
                  disabled={
                    effectiveAmount < 10 ||
                    effectiveAmount > 2000 ||
                    (tab === "momo" && !momoValid) ||
                    (tab === "card" && !cardValid)
                  }
                  leftIcon={
                    <Feather
                      name={tab === "momo" ? "smartphone" : "shield"}
                      size={16}
                      color={colors.white}
                    />
                  }
                  style={{ flex: 1.4 }}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function TabButton({
  active,
  onPress,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        active && styles.tabActive,
        pressed && !active && { opacity: 0.85 },
      ]}
    >
      <Feather
        name={icon}
        size={15}
        color={active ? colors.brand.primary : colors.ink[500]}
      />
      <Text
        style={[styles.tabLabel, active && styles.tabLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {badge && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function MomoTab({
  provider,
  setProvider,
  phone,
  setPhone,
}: {
  provider: Provider;
  setProvider: (p: Provider) => void;
  phone: string;
  setPhone: (s: string) => void;
}) {
  return (
    <View>
      <Text style={styles.smallLabel}>MOBILE MONEY PROVIDER</Text>
      <View style={styles.providerGrid}>
        {PROVIDERS.map((p) => {
          const active = provider === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setProvider(p.id);
              }}
              style={({ pressed }) => [
                styles.provider,
                active && styles.providerActive,
                pressed && !active && { opacity: 0.85 },
              ]}
            >
              <View style={styles.providerBadge}>
                <Image source={p.logo} style={styles.providerLogo} resizeMode="contain" />
              </View>
              {active && (
                <View style={styles.providerCheck}>
                  <Feather name="check" size={10} color={colors.white} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.smallLabel, { marginTop: spacing.lg }]}>
        MOBILE MONEY NUMBER
      </Text>
      <View style={styles.phoneField}>
        <Text style={styles.phonePrefix}>+260</Text>
        <TextInput
          value={phone}
          onChangeText={(t) =>
            setPhone(t.replace(/[^\d\s]/g, "").slice(0, 12))
          }
          keyboardType="phone-pad"
          placeholder="977 000 000"
          placeholderTextColor={colors.ink[300]}
          style={styles.phoneInput}
        />
      </View>
      <View style={styles.helperRow}>
        <Feather name="shield" size={12} color={colors.ink[500]} />
        <Text style={styles.helper}>
          We&apos;ll send an approval prompt to your phone. No funds move until
          you confirm.
        </Text>
      </View>
    </View>
  );
}

function CardTab({
  card,
  setCard,
}: {
  card: CardForm;
  setCard: (c: CardForm) => void;
}) {
  function formatCardNumber(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length < 3) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return (
    <View>
      {/* Live card preview — keeps the form feeling tactile and confirms what
         the user is typing without a separate review screen. */}
      <LinearGradient
        colors={["#1A1814", colors.brand.deep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardPreview}
      >
        <View style={styles.cardPreviewOrbA} pointerEvents="none" />
        <View style={styles.cardPreviewOrbB} pointerEvents="none" />
        <View style={styles.cardPreviewTop}>
          <View style={styles.chip} />
          <Feather name="credit-card" size={18} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.cardPreviewNumber} numberOfLines={1}>
          {card.number || "•••• •••• •••• ••••"}
        </Text>
        <View style={styles.cardPreviewBottom}>
          <Text style={styles.cardPreviewName} numberOfLines={1}>
            {card.name || "Cardholder name"}
          </Text>
          <Text style={styles.cardPreviewExp}>{card.expiry || "MM/YY"}</Text>
        </View>
      </LinearGradient>

      <Text style={styles.smallLabel}>CARD NUMBER</Text>
      <TextInput
        keyboardType="number-pad"
        placeholder="1234 5678 9012 3456"
        placeholderTextColor={colors.ink[300]}
        value={card.number}
        onChangeText={(t) =>
          setCard({ ...card, number: formatCardNumber(t) })
        }
        style={[styles.input, { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }]}
      />

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.smallLabel}>EXPIRY</Text>
          <TextInput
            keyboardType="number-pad"
            placeholder="MM/YY"
            placeholderTextColor={colors.ink[300]}
            value={card.expiry}
            onChangeText={(t) =>
              setCard({ ...card, expiry: formatExpiry(t) })
            }
            style={styles.input}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.smallLabel}>CVV</Text>
          <TextInput
            keyboardType="number-pad"
            placeholder="123"
            placeholderTextColor={colors.ink[300]}
            maxLength={3}
            value={card.cvv}
            onChangeText={(t) =>
              setCard({ ...card, cvv: t.replace(/\D/g, "").slice(0, 3) })
            }
            style={styles.input}
          />
        </View>
      </View>

      <Text style={styles.smallLabel}>CARDHOLDER NAME</Text>
      <TextInput
        placeholder="Chanda Mwila"
        placeholderTextColor={colors.ink[300]}
        value={card.name}
        onChangeText={(t) => setCard({ ...card, name: t })}
        style={styles.input}
      />

      <View style={styles.helperRow}>
        <Feather name="shield" size={12} color={colors.ink[500]} />
        <Text style={styles.helper}>
          Encrypted in transit. Visa &amp; Mastercard issued in Zambia.
        </Text>
      </View>
    </View>
  );
}

function BoothTab({
  notified,
  onNotify,
}: {
  notified: boolean;
  onNotify: () => void;
}) {
  const booths = [
    { name: "Soweto Market", area: "Lusaka CBD" },
    { name: "Manda Hill bus park", area: "Manda Hill" },
    { name: "Kabwata Roundabout", area: "Kabwata" },
  ];

  return (
    <View>
      <View style={styles.boothHero}>
        <View style={styles.boothHeroOrb} pointerEvents="none" />
        <View style={styles.boothIcon}>
          <Feather name="home" size={36} color={colors.white} />
          <View style={styles.boothSoonBadge}>
            <Text style={styles.boothSoonText}>COMING SOON</Text>
          </View>
        </View>
        <Text style={styles.boothTitle}>Top up with cash at a CarryMe booth</Text>
        <Text style={styles.boothSub}>
          Visit a partner kiosk to load credits with cash — no app, no mobile
          money required.
        </Text>
      </View>

      <Text style={[styles.smallLabel, { marginTop: spacing.lg }]}>
        FIRST LOCATIONS GOING LIVE
      </Text>
      <View style={{ gap: 6 }}>
        {booths.map((b) => (
          <View key={b.name} style={styles.boothRow}>
            <View style={styles.boothRowIcon}>
              <Feather name="home" size={14} color={colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.boothRowName}>{b.name}</Text>
              <Text style={styles.boothRowArea}>{b.area}</Text>
            </View>
            <Text style={styles.boothRowSoon}>SOON</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onNotify}
        disabled={notified}
        style={({ pressed }) => [
          styles.boothNotify,
          notified && styles.boothNotifyDone,
          pressed && !notified && { opacity: 0.85 },
        ]}
      >
        <Feather
          name={notified ? "check" : "bell"}
          size={16}
          color={notified ? colors.status.success : colors.brand.deep}
        />
        <Text
          style={[
            styles.boothNotifyText,
            notified && { color: colors.status.success },
          ]}
        >
          {notified ? "We'll let you know" : "Notify me when booths go live"}
        </Text>
      </Pressable>
    </View>
  );
}

function ProcessingView({
  state,
  provider,
  amount,
}: {
  state: FlowState;
  provider: Provider;
  amount: number;
}) {
  const providerLabel =
    PROVIDERS.find((p) => p.id === provider)?.label ?? "Mobile money";

  const stages: Record<
    string,
    { title: string; body: string; icon: React.ReactNode; step: 1 | 2 }
  > = {
    momo_sending: {
      title: `Requesting K${amount}…`,
      body: `Sending an approval prompt to your ${providerLabel} app.`,
      icon: <ActivityIndicator color={colors.brand.primary} size="large" />,
      step: 1,
    },
    momo_awaiting: {
      title: "Check your phone",
      body: `Open ${providerLabel} and approve the K${amount} request to finish.`,
      icon: (
        <Feather name="smartphone" size={28} color={colors.brand.primary} />
      ),
      step: 2,
    },
    card_verifying: {
      title: "Verifying card…",
      body: "Checking the card details with your bank.",
      icon: <ActivityIndicator color={colors.brand.primary} size="large" />,
      step: 1,
    },
    card_processing: {
      title: `Authorising K${amount}…`,
      body: "Processing the payment securely.",
      icon: <Feather name="shield" size={28} color={colors.brand.primary} />,
      step: 2,
    },
  };

  const s = stages[state];
  if (!s) return null;

  return (
    <View style={styles.processing}>
      <View style={styles.processingIcon}>{s.icon}</View>
      <Text style={styles.processingTitle}>{s.title}</Text>
      <Text style={styles.processingBody}>{s.body}</Text>
      <View style={styles.dots}>
        <Dot active={s.step >= 1} />
        <Dot active={s.step >= 2} />
        <Dot active={false} />
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: active ? colors.brand.primary : colors.ink[100] },
      ]}
    />
  );
}

function SuccessView({ amount }: { amount: number }) {
  return (
    <View style={styles.processing}>
      <View style={styles.successIcon}>
        <Feather name="check" size={32} color={colors.status.success} />
      </View>
      <Text style={styles.processingTitle}>All set</Text>
      <Text style={styles.processingBody}>
        <Text style={styles.processingBodyStrong}>{formatZmw(amount)}</Text>{" "}
        added to your wallet.
      </Text>
      <View style={[styles.helperRow, { justifyContent: "center" }]}>
        <Feather name="zap" size={12} color={colors.ink[500]} />
        <Text style={styles.helper}>Ready to tap to ride.</Text>
      </View>
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
    gap: spacing.md,
  },
  header: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    overflow: "hidden",
    position: "relative",
  },
  headerOrbA: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerOrbB: {
    position: "absolute",
    bottom: -40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: tints.secondaryGlow,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.75)",
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 4,
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  balance: {
    marginTop: 4,
    color: "rgba(255,255,255,0.78)",
    fontSize: fontSize.xs,
  },
  balanceStrong: {
    color: colors.white,
    fontWeight: "700",
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    backgroundColor: colors.surface.raised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  tabActive: {
    backgroundColor: tints.primarySoft,
  },
  tabLabel: {
    color: colors.ink[500],
    fontWeight: "700",
    fontSize: fontSize.xs,
  },
  tabLabelActive: {
    color: colors.brand.primary,
  },
  tabBadge: {
    position: "absolute",
    top: -2,
    right: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.deep,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  body: {
    backgroundColor: colors.surface.raised,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  smallLabel: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  preset: {
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface.base,
    alignItems: "center",
  },
  presetActive: {
    backgroundColor: colors.brand.primary,
    ...shadow.pop,
  },
  presetText: {
    color: colors.brand.deep,
    fontWeight: "800",
    fontSize: fontSize.md,
  },
  presetTextActive: {
    color: colors.white,
  },
  customAmount: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  currency: {
    color: colors.ink[500],
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  customInput: {
    flex: 1,
    color: colors.brand.deep,
    fontSize: fontSize.sm,
    padding: 0,
  },
  providerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  provider: {
    width: "48.5%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 122,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
    position: "relative",
  },
  providerActive: {
    borderColor: colors.brand.primary,
    backgroundColor: tints.primarySoft,
  },
  providerBadge: {
    width: 150,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  providerLogo: {
    width: 140,
    height: 88,
  },
  providerCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  phonePrefix: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  phoneInput: {
    flex: 1,
    color: colors.brand.deep,
    fontSize: fontSize.sm,
    fontWeight: "600",
    padding: 0,
  },
  helperRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  helper: {
    flex: 1,
    color: colors.ink[500],
    fontSize: 11,
    lineHeight: 16,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
    color: colors.brand.deep,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  row2: {
    flexDirection: "row",
    gap: 12,
  },
  cardPreview: {
    height: 130,
    borderRadius: radii.lg,
    padding: spacing.md,
    overflow: "hidden",
    marginBottom: spacing.md,
    position: "relative",
  },
  cardPreviewOrbA: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: tints.secondaryGlow,
  },
  cardPreviewOrbB: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: tints.primaryStrong,
  },
  cardPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    width: 32,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#F5C44A",
  },
  cardPreviewNumber: {
    marginTop: 14,
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  cardPreviewBottom: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPreviewName: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    flex: 1,
  },
  cardPreviewExp: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  boothHero: {
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    backgroundColor: tints.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(243, 66, 19, 0.15)",
    overflow: "hidden",
    position: "relative",
  },
  boothHeroOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: tints.secondaryGlow,
  },
  boothIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.pop,
  },
  boothSoonBadge: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.deep,
  },
  boothSoonText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  boothTitle: {
    marginTop: 18,
    color: colors.brand.deep,
    fontWeight: "800",
    fontSize: fontSize.md,
    textAlign: "center",
  },
  boothSub: {
    marginTop: 4,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 260,
  },
  boothRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface.base,
  },
  boothRowIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  boothRowName: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  boothRowArea: {
    color: colors.ink[500],
    fontSize: 11,
    marginTop: 1,
  },
  boothRowSoon: {
    color: colors.ink[500],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  boothNotify: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.brand.secondary,
  },
  boothNotifyDone: {
    backgroundColor: tints.successSoft,
  },
  boothNotifyText: {
    color: colors.brand.deep,
    fontWeight: "800",
    fontSize: fontSize.sm,
  },
  error: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  footer: {
    paddingTop: spacing.sm,
  },
  footerBooth: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerNote: {
    flex: 1,
    color: colors.ink[500],
    fontSize: fontSize.xs,
  },
  footerGrid: {
    flexDirection: "row",
    gap: 10,
  },
  processing: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 8,
  },
  processingIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: tints.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  processingTitle: {
    marginTop: spacing.md,
    color: colors.brand.deep,
    fontWeight: "800",
    fontSize: fontSize.md,
  },
  processingBody: {
    color: colors.ink[500],
    fontSize: fontSize.sm,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 19,
  },
  processingBodyStrong: {
    color: colors.brand.deep,
    fontWeight: "700",
  },
  dots: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tints.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
