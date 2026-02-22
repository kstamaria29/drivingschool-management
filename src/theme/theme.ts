import {
  DARK_THEME_PRESETS,
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_LIGHT_THEME_KEY,
  LIGHT_THEME_PRESETS,
  type DarkThemeKey,
  type LightThemeKey,
} from "./palettes";

type ThemeColorSet = {
  placeholder: string;
  backgroundLight: string;
  backgroundDark: string;
  foregroundLight: string;
  foregroundDark: string;
  cardLight: string;
  cardDark: string;
  borderLight: string;
  borderDark: string;
  mutedLight: string;
  mutedDark: string;
  primary: string;
  primaryDark: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  danger: string;
  dangerDark: string;
};

type ActiveScheme = "light" | "dark";

function resolveThemeColors(
  lightThemeKey: LightThemeKey,
  darkThemeKey: DarkThemeKey,
  activeScheme: ActiveScheme,
): ThemeColorSet {
  const lightPalette = LIGHT_THEME_PRESETS[lightThemeKey];
  const darkPalette = DARK_THEME_PRESETS[darkThemeKey];
  const accentPalette = activeScheme === "dark" ? darkPalette : lightPalette;

  return {
    placeholder: activeScheme === "dark" ? darkPalette.tone.muted : lightPalette.tone.muted,
    backgroundLight: lightPalette.tone.background,
    backgroundDark: darkPalette.tone.background,
    foregroundLight: lightPalette.tone.foreground,
    foregroundDark: darkPalette.tone.foreground,
    cardLight: lightPalette.tone.card,
    cardDark: darkPalette.tone.card,
    borderLight: lightPalette.tone.border,
    borderDark: darkPalette.tone.border,
    mutedLight: lightPalette.tone.muted,
    mutedDark: darkPalette.tone.muted,
    primary: lightPalette.tone.primary,
    primaryDark: darkPalette.tone.primary,
    primaryForeground: "#ffffff",
    accent: accentPalette.accent,
    accentForeground:
      activeScheme === "dark" ? darkPalette.tone.foreground : lightPalette.tone.foreground,
    danger: lightPalette.tone.danger,
    dangerDark: darkPalette.tone.danger,
  };
}

function hexToRgbChannels(hex: string) {
  const normalized = hex.replace("#", "");
  const sixCharHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const parsed = Number.parseInt(sixCharHex, 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `${r} ${g} ${b}`;
}

export function getThemeColorVariables(
  lightThemeKey: LightThemeKey,
  darkThemeKey: DarkThemeKey,
  activeScheme: ActiveScheme,
) {
  const colors = resolveThemeColors(lightThemeKey, darkThemeKey, activeScheme);
  return {
    "--color-placeholder": hexToRgbChannels(colors.placeholder),
    "--color-background": hexToRgbChannels(colors.backgroundLight),
    "--color-background-dark": hexToRgbChannels(colors.backgroundDark),
    "--color-foreground": hexToRgbChannels(colors.foregroundLight),
    "--color-foreground-dark": hexToRgbChannels(colors.foregroundDark),
    "--color-card": hexToRgbChannels(colors.cardLight),
    "--color-card-dark": hexToRgbChannels(colors.cardDark),
    "--color-border": hexToRgbChannels(colors.borderLight),
    "--color-border-dark": hexToRgbChannels(colors.borderDark),
    "--color-muted": hexToRgbChannels(colors.mutedLight),
    "--color-muted-dark": hexToRgbChannels(colors.mutedDark),
    "--color-primary": hexToRgbChannels(colors.primary),
    "--color-primary-dark": hexToRgbChannels(colors.primaryDark),
    "--color-primary-foreground": hexToRgbChannels(colors.primaryForeground),
    "--color-accent": hexToRgbChannels(colors.accent),
    "--color-accent-foreground": hexToRgbChannels(colors.accentForeground),
    "--color-danger": hexToRgbChannels(colors.danger),
    "--color-danger-dark": hexToRgbChannels(colors.dangerDark),
  } as const;
}

const activeColors: ThemeColorSet = resolveThemeColors(
  DEFAULT_LIGHT_THEME_KEY,
  DEFAULT_DARK_THEME_KEY,
  "light",
);

export function applyThemeColors(
  lightThemeKey: LightThemeKey,
  darkThemeKey: DarkThemeKey,
  activeScheme: ActiveScheme,
) {
  Object.assign(activeColors, resolveThemeColors(lightThemeKey, darkThemeKey, activeScheme));
}

export const theme = {
  colors: activeColors,
  screen: {
    safeArea: "flex-1 bg-background dark:bg-backgroundDark",
    scrollContent: "flex-grow",
    container: "flex-1 w-full max-w-[720px] self-center px-6 py-6",
  },
  text: {
    base: "text-foreground dark:text-foregroundDark",
    variant: {
      title: "text-3xl",
      heading: "text-xl",
      body: "text-base",
      caption: "text-sm text-muted dark:text-mutedDark",
      label: "text-sm",
      error: "text-sm text-danger dark:text-dangerDark",
      button: "text-base",
    },
  },
  button: {
    base: "items-center justify-center rounded-xl border shadow-sm shadow-black/5 dark:shadow-black/30",
    disabled: "opacity-60",
    size: {
      md: "h-12 px-4",
      lg: "h-14 px-5",
      icon: "h-10 w-10 p-0",
    },
    variant: {
      primary: "bg-primary border-primary dark:bg-primaryDark dark:border-primaryDark",
      secondary: "bg-card border-border dark:bg-cardDark dark:border-borderDark",
      success: "bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500",
      danger: "bg-danger border-danger dark:bg-dangerDark dark:border-dangerDark",
      ghost: "bg-transparent border-0 shadow-none",
    },
    labelBase: "",
    labelVariant: {
      primary: "text-primaryForeground",
      secondary: "text-foreground dark:text-foregroundDark",
      success: "text-primaryForeground",
      danger: "text-primaryForeground",
      ghost: "text-primary dark:text-primaryDark",
    },
  },
  input: {
    wrapper: "",
    base: "mt-2 h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground dark:border-borderDark dark:bg-cardDark dark:text-foregroundDark",
    error: "border-danger dark:border-dangerDark",
  },
  card: {
    base: "rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 dark:border-borderDark dark:bg-cardDark dark:shadow-black/30",
  },
};
