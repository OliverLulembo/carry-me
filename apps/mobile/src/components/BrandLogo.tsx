import {
  Image,
  ImageProps,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
} from "react-native";

type Variant = "light" | "dark";

type BrandLogoProps = Omit<ImageProps, "source" | "style"> & {
  /**
   * Which artwork to render. Defaults to the light-mode artwork (dark text /
   * orange mark) — the right read on our default light surfaces. Pass "dark"
   * for coloured/dark hero backgrounds (e.g. the splash gradient) where the
   * white-text variant is needed.
   */
  variant?: Variant;
  /** Rendered height in dp. Width follows the 4001×1162 source aspect ratio. */
  height?: number;
  style?: StyleProp<ImageStyle>;
};

const ASSETS: Record<Variant, ImageSourcePropType> = {
  light: require("../../assets/logo-light.png"),
  dark: require("../../assets/logo-dark.png"),
};

const ASPECT = 4001 / 1162; // ≈ 3.44

export function BrandLogo({
  variant = "light",
  height = 28,
  style,
  ...rest
}: BrandLogoProps) {
  return (
    <Image
      source={ASSETS[variant]}
      accessibilityLabel="CarryMe"
      resizeMode="contain"
      {...rest}
      style={[{ height, width: height * ASPECT }, style]}
    />
  );
}
