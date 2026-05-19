import Image from "next/image";

type Variant = "light" | "dark";

type BrandLogoProps = {
  /**
   * Which artwork to render. Defaults to the light-mode artwork (dark text /
   * orange mark) — the right read on our white/khaki surfaces. Pass "dark"
   * for coloured or dark hero backgrounds where the white-text variant is
   * needed.
   */
  variant?: Variant;
  /** Rendered height in px. Width follows the 4001×1162 source aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
};

const SRC_HEIGHT = 1162;
const SRC_WIDTH = 4001;

const SOURCES: Record<Variant, string> = {
  light: "/brand/app_logo_light_mode.png",
  dark: "/brand/app_logo_dark_mode.png",
};

/** CarryMe wordmark. Single image, light-mode artwork by default. */
export function BrandLogo({
  variant = "light",
  height = 28,
  className,
  priority,
}: BrandLogoProps) {
  const width = Math.round((height * SRC_WIDTH) / SRC_HEIGHT);

  return (
    <Image
      src={SOURCES[variant]}
      alt="CarryMe"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
