// CarryMe design tokens — mirror apps/web/tailwind.config.ts so the two clients
// share one source of brand truth. 60/30/10 distribution: brand-primary (orange)
// dominates hero surfaces and primary CTAs, secondary (warm khaki) supports,
// accent (near-white) and deep (black) share the 10% accent allocation.

export const colors = {
  brand: {
    primary: "#F34213",
    primary600: "#D63A0F",
    primary700: "#B7320D",
    secondary: "#BEB7A4",
    secondary600: "#A9A28F",
    accent: "#FFFFFC",
    deep: "#000000",
  },
  ink: {
    900: "#1A1814",
    700: "#3D372E",
    500: "#6E665C",
    300: "#A8A095",
    100: "#E6E2DA",
  },
  surface: {
    base: "#FAF8F3",
    raised: "#FFFFFF",
  },
  status: {
    success: "#22C55E",
    warn: "#F59E0B",
    danger: "#EF4444",
  },
  white: "#FFFFFF",
  black: "#000000",
} as const;

// Pre-composed tints used by Pills, hover states, and ambient orbs. Kept in one
// place so a single brand-palette change doesn't require touching every screen.
export const tints = {
  primarySoft: "rgba(243, 66, 19, 0.10)",
  primaryGlow: "rgba(243, 66, 19, 0.20)",
  primaryStrong: "rgba(243, 66, 19, 0.30)",
  secondarySoft: "rgba(190, 183, 164, 0.20)",
  secondaryGlow: "rgba(190, 183, 164, 0.35)",
  successSoft: "rgba(34, 197, 94, 0.14)",
  warnSoft: "rgba(245, 158, 11, 0.14)",
  dangerSoft: "rgba(239, 68, 68, 0.10)",
  onDarkSoft: "rgba(255, 255, 255, 0.12)",
  onDarkMedium: "rgba(255, 255, 255, 0.18)",
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 34,
} as const;

export const shadow = {
  card: {
    shadowColor: "#1A1814",
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  // Brand-tinted shadow used on primary CTAs and the balance card. Mirrors the
  // web `shadow-pop` utility: a warm orange halo that lifts the surface
  // without competing with the orange primary.
  pop: {
    shadowColor: "#F34213",
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;
