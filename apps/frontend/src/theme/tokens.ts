/**
 * Theme token utilities for easy access to design system values
 */

// Color tokens for direct use in components
export const colors = {
  // Light mode colors
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  
  card: 'var(--card)',
  cardForeground: 'var(--card-foreground)',
  
  popover: 'var(--popover)',
  popoverForeground: 'var(--popover-foreground)',
  
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  
  secondary: 'var(--secondary)',
  secondaryForeground: 'var(--secondary-foreground)',
  
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  
  accent: 'var(--accent)',
  accentForeground: 'var(--accent-foreground)',
  
  destructive: 'var(--destructive)',
  destructiveForeground: 'var(--destructive-foreground)',
  
  border: 'var(--border)',
  input: 'var(--input)',
  inputBackground: 'var(--input-background)',
  switchBackground: 'var(--switch-background)',
  ring: 'var(--ring)',
  
  // Chart colors
  chart1: 'var(--chart-1)',
  chart2: 'var(--chart-2)',
  chart3: 'var(--chart-3)',
  chart4: 'var(--chart-4)',
  chart5: 'var(--chart-5)',
  
  // Sidebar colors
  sidebar: 'var(--sidebar)',
  sidebarForeground: 'var(--sidebar-foreground)',
  sidebarPrimary: 'var(--sidebar-primary)',
  sidebarPrimaryForeground: 'var(--sidebar-primary-foreground)',
  sidebarAccent: 'var(--sidebar-accent)',
  sidebarAccentForeground: 'var(--sidebar-accent-foreground)',
  sidebarBorder: 'var(--sidebar-border)',
  sidebarRing: 'var(--sidebar-ring)',
} as const

// Radius tokens
export const radius = {
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
} as const

// Font weight tokens
export const fontWeights = {
  normal: 'var(--font-weight-normal)',
  medium: 'var(--font-weight-medium)',
} as const

// Font size tokens
export const fontSizes = {
  base: 'var(--font-size)',
  sm: 'calc(var(--font-size) * 0.875)',
  lg: 'calc(var(--font-size) * 1.125)',
  xl: 'calc(var(--font-size) * 1.25)',
  '2xl': 'calc(var(--font-size) * 1.5)',
} as const

// Chakra UI semantic token mapping
export const semanticTokens = {
  colors: {
    bg: {
      DEFAULT: colors.background,
      subtle: colors.muted,
      muted: colors.accent,
      card: colors.card,
      popover: colors.popover,
      sidebar: colors.sidebar,
    },
    fg: {
      DEFAULT: colors.foreground,
      subtle: colors.mutedForeground,
      muted: colors.mutedForeground,
      card: colors.cardForeground,
      popover: colors.popoverForeground,
      sidebar: colors.sidebarForeground,
    },
    border: {
      DEFAULT: colors.border,
      sidebar: colors.sidebarBorder,
    },
    accent: {
      DEFAULT: colors.accent,
      fg: colors.accentForeground,
      sidebar: colors.sidebarAccent,
    },
    primary: {
      DEFAULT: colors.primary,
      fg: colors.primaryForeground,
      sidebar: colors.sidebarPrimary,
    },
    secondary: {
      DEFAULT: colors.secondary,
      fg: colors.secondaryForeground,
    },
    destructive: {
      DEFAULT: colors.destructive,
      fg: colors.destructiveForeground,
    },
    muted: {
      DEFAULT: colors.muted,
      fg: colors.mutedForeground,
    },
  },
} as const

// Helper function to get color with dark mode support
export const getColor = (lightColor: string, darkColor?: string) => {
  if (!darkColor) return lightColor
  return `light-dark(${lightColor}, ${darkColor})`
}

// Theme utilities for component styling
export const themeUtils = {
  // Get a color token
  color: (token: keyof typeof colors) => colors[token],
  
  // Get a radius token
  radius: (size: keyof typeof radius) => radius[size],
  
  // Get a font weight token
  fontWeight: (weight: keyof typeof fontWeights) => fontWeights[weight],
  
  // Get a font size token
  fontSize: (size: keyof typeof fontSizes) => fontSizes[size],
  
  // Create a CSS custom property
  cssVar: (name: string) => `var(--${name})`,
  
  // Create a light-dark function for CSS
  lightDark: (light: string, dark: string) => `light-dark(${light}, ${dark})`,
} as const

export default {
  colors,
  radius,
  fontWeights,
  fontSizes,
  semanticTokens,
  themeUtils,
}