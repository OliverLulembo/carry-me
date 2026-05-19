import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useToken } from "@/auth/session";
import { shareCredits } from "@/api/endpoints";
import { colors, fontSize, radii, spacing } from "@/theme/tokens";
import { formatZmw } from "@/lib/format";

const PRESETS = [10, 25, 50, 100];

export default function ShareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useToken();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number>(25);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The web's share endpoint enforces min 1, max 500 daily.
  const validAmount = amount >= 1 && amount <= 500;
  const validPhone = phone.replace(/\D/g, "").length >= 7;

  async function submit() {
    if (!validAmount || !validPhone) return;
    setBusy(true);
    setError(null);
    try {
      await shareCredits(token, phone.trim(), amount, note || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send credits");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityLabel="Close"
          >
            <Feather name="x" size={20} color={colors.brand.deep} />
          </Pressable>
          <Text style={styles.title}>Share credits</Text>
          <View style={styles.close} />
        </View>

        <Card>
          <Text style={styles.lead}>
            Send credits to anyone by phone number. If they're not on CarryMe
            yet, we'll hold the credits for 7 days.
          </Text>
        </Card>

        <Text style={styles.label}>RECIPIENT PHONE</Text>
        <View style={styles.field}>
          <Feather name="phone" size={16} color={colors.brand.primary} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+260 977 000 002"
            placeholderTextColor={colors.ink[300]}
            keyboardType="phone-pad"
            autoComplete="tel"
            style={styles.fieldInput}
          />
        </View>

        <Text style={styles.label}>AMOUNT</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map((v) => {
            const active = amount === v;
            return (
              <Pressable
                key={v}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAmount(v);
                }}
                style={({ pressed }) => [
                  styles.preset,
                  active && styles.presetActive,
                  pressed && !active && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    active && styles.presetTextActive,
                  ]}
                >
                  K{v}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>NOTE (optional)</Text>
        <View style={styles.field}>
          <Feather name="message-circle" size={16} color={colors.brand.primary} />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="For school bus today"
            placeholderTextColor={colors.ink[300]}
            style={styles.fieldInput}
            maxLength={140}
          />
        </View>

        {error && (
          <View style={styles.error}>
            <Feather name="alert-triangle" size={14} color={colors.status.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label={`Send ${formatZmw(amount)}`}
          onPress={submit}
          loading={busy}
          disabled={!validAmount || !validPhone}
          rightIcon={<Feather name="send" size={16} color={colors.white} />}
          block
          style={{ marginTop: spacing.lg }}
        />
        <Text style={styles.footnote}>
          Daily share cap K500 · OTP confirmation will be required on launch
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.raised,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.brand.deep,
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  lead: {
    color: colors.ink[700],
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  label: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.sm,
    marginBottom: 8,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
  },
  fieldInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.brand.deep,
    fontWeight: "600",
    padding: 0,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  preset: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.surface.raised,
    flexGrow: 1,
    alignItems: "center",
  },
  presetActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  presetText: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  presetTextActive: {
    color: colors.white,
  },
  error: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: radii.md,
  },
  errorText: {
    color: colors.status.danger,
    fontSize: fontSize.sm,
    flex: 1,
  },
  footnote: {
    marginTop: 10,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    textAlign: "center",
  },
});
