import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { useAuth } from "@/auth/session";
import { API_BASE_URL } from "@/api/client";
import { colors, fontSize, radii, shadow, spacing, tints } from "@/theme/tokens";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function confirmSignOut() {
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <View style={styles.root}>
      <Header subtitle="Account" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl + 64 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.brand.primary, "#D63A0F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.identity, shadow.pop]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.phone}>{user.phone}</Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <Pill tone="onDark">{user.role}</Pill>
            </View>
          </View>
        </LinearGradient>

        <Card>
          <Text style={styles.sectionTitle}>Account</Text>
          <Row icon="user" label="Personal info" detail="Edit name, photo" disabled />
          <Row icon="phone" label="Phone number" detail={user.phone} disabled />
          <Row icon="shield" label="Security" detail="OTP, device sessions" disabled />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Pay & ride</Text>
          <Row icon="credit-card" label="Payment methods" detail="Mobile money, cards" disabled />
          <Row icon="wifi" label="Linked devices" detail="One device per account in v1" disabled />
          <Row icon="gift" label="Sharing limits" detail="K500/day default" disabled />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>About</Text>
          <Row icon="info" label="Help & support" disabled />
          <Row icon="file-text" label="Terms & privacy" disabled />
          <Row
            icon="server"
            label="API endpoint"
            detail={API_BASE_URL}
            disabled
          />
        </Card>

        <Button
          label="Sign out"
          variant="ghost"
          onPress={confirmSignOut}
          leftIcon={<Feather name="log-out" size={16} color={colors.brand.deep} />}
          block
          style={{ marginTop: spacing.md }}
        />
        <Text style={styles.footer}>CarryMe v0.1 · Lusaka pilot</Text>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  detail,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  detail?: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.rowIcon}>
        <Feather name={icon} size={16} color={colors.brand.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail && (
          <Text style={styles.rowDetail} numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={18} color={colors.ink[300]} />
    </Pressable>
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
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: spacing.xl,
    borderRadius: radii.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSize.xl,
  },
  name: {
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSize.lg,
  },
  phone: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.brand.deep,
    fontSize: fontSize.md,
    fontWeight: "700",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: tints.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    color: colors.brand.deep,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  rowDetail: {
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.xl,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    textAlign: "center",
  },
});
