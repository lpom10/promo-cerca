export type ThemeColors = {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  inputBackground: string;
  switchBackground: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;

  // Additional legacy names to ease migration
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
};

export const lightColors: ThemeColors = {
  // Nuevos tokens base claro (estimados de Tailwind default o diseño)
  background: "#FFFFFF",
  foreground: "#111827",
  card: "#FFFFFF",
  cardForeground: "#111827",
  popover: "#FFFFFF",
  popoverForeground: "#111827",
  primary: "#FF6745",
  primaryForeground: "#FFFFFF",
  secondary: "#F3F4F6",
  secondaryForeground: "#111827",
  muted: "#F3F4F6",
  mutedForeground: "#6B7280",
  accent: "#FFF5F3",
  accentForeground: "#FF6745",
  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",
  border: "#E5E7EB",
  input: "transparent",
  inputBackground: "#FFFFFF",
  switchBackground: "#E5E7EB",
  ring: "#FF6745",
  sidebar: "#FFFFFF",
  sidebarForeground: "#6B7280",
  sidebarPrimary: "#FF6745",
  sidebarPrimaryForeground: "#FFFFFF",
  sidebarAccent: "#FFF5F3",
  sidebarAccentForeground: "#FF6745",
  sidebarBorder: "#E5E7EB",
  sidebarRing: "#FF6745",

  // Legacy mappings para compatibilidad y facilidad
  text: "#111827",
  textSecondary: "#6B7280",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export const darkColors: ThemeColors = {
  // Paleta provista por el usuario
  background: "#121010",
  foreground: "#F5F0EE",
  card: "#1E1A18",
  cardForeground: "#F5F0EE",
  popover: "#1E1A18",
  popoverForeground: "#F5F0EE",
  primary: "#FF7A5C",
  primaryForeground: "#1A0A04",
  secondary: "#2C2420",
  secondaryForeground: "#F5F0EE",
  muted: "#2C2420",
  mutedForeground: "#9E8F88",
  accent: "#2A1208",
  accentForeground: "#FF7A5C",
  destructive: "#FF4D6D",
  destructiveForeground: "#FFFFFF",
  border: "rgba(255,255,255,0.08)",
  input: "transparent",
  inputBackground: "#2C2420",
  switchBackground: "#4A3830",
  ring: "#FF7A5C",
  sidebar: "#1E1A18",
  sidebarForeground: "#9E8F88",
  sidebarPrimary: "#FF7A5C",
  sidebarPrimaryForeground: "#1A0A04",
  sidebarAccent: "#2A1208",
  sidebarAccentForeground: "#FF7A5C",
  sidebarBorder: "rgba(255,255,255,0.08)",
  sidebarRing: "#FF7A5C",

  // Legacy mappings
  text: "#F5F0EE",
  textSecondary: "#9E8F88",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#FF4D6D", // matching destructive
};

// Temporalmente mantenemos esto para no romper la app de inmediato durante la migración
export const colors = lightColors;
