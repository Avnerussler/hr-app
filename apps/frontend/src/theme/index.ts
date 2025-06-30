import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

// Custom theme configuration based on Figma CSS variables
const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Light mode colors (root variables)
        background: { value: '#ffffff' },
        foreground: { value: 'oklch(0.145 0 0)' },
        
        card: { value: '#ffffff' },
        'card.foreground': { value: 'oklch(0.145 0 0)' },
        
        popover: { value: 'oklch(1 0 0)' },
        'popover.foreground': { value: 'oklch(0.145 0 0)' },
        
        primary: { value: '#030213' },
        'primary.foreground': { value: 'oklch(1 0 0)' },
        
        secondary: { value: 'oklch(0.95 0.0058 264.53)' },
        'secondary.foreground': { value: '#030213' },
        
        muted: { value: '#ececf0' },
        'muted.foreground': { value: '#717182' },
        
        accent: { value: '#e9ebef' },
        'accent.foreground': { value: '#030213' },
        
        destructive: { value: '#d4183d' },
        'destructive.foreground': { value: '#ffffff' },
        
        border: { value: 'rgba(0, 0, 0, 0.1)' },
        input: { value: 'transparent' },
        'input.background': { value: '#f3f3f5' },
        'switch.background': { value: '#cbced4' },
        ring: { value: 'oklch(0.708 0 0)' },
        
        // Chart colors
        'chart.1': { value: 'oklch(0.646 0.222 41.116)' },
        'chart.2': { value: 'oklch(0.6 0.118 184.704)' },
        'chart.3': { value: 'oklch(0.398 0.07 227.392)' },
        'chart.4': { value: 'oklch(0.828 0.189 84.429)' },
        'chart.5': { value: 'oklch(0.769 0.188 70.08)' },
        
        // Sidebar colors
        sidebar: { value: 'oklch(0.985 0 0)' },
        'sidebar.foreground': { value: 'oklch(0.145 0 0)' },
        'sidebar.primary': { value: '#030213' },
        'sidebar.primary.foreground': { value: 'oklch(0.985 0 0)' },
        'sidebar.accent': { value: 'oklch(0.97 0 0)' },
        'sidebar.accent.foreground': { value: 'oklch(0.205 0 0)' },
        'sidebar.border': { value: 'oklch(0.922 0 0)' },
        'sidebar.ring': { value: 'oklch(0.708 0 0)' },
      },
      
      radii: {
        sm: { value: 'calc(0.625rem - 4px)' },
        md: { value: 'calc(0.625rem - 2px)' },
        lg: { value: '0.625rem' },
        xl: { value: 'calc(0.625rem + 4px)' },
      },
      
      fontSizes: {
        base: { value: '14px' },
        sm: { value: '12px' },
        lg: { value: '16px' },
        xl: { value: '18px' },
        '2xl': { value: '24px' },
      },
      
      fontWeights: {
        normal: { value: 400 },
        medium: { value: 500 },
      },
      
      lineHeights: {
        base: { value: 1.5 },
      },
    },
    
    semanticTokens: {
      colors: {
        // Light mode semantic tokens
        bg: {
          DEFAULT: { value: '{colors.background}' },
          subtle: { value: '{colors.muted}' },
          muted: { value: '{colors.accent}' },
        },
        
        fg: {
          DEFAULT: { value: '{colors.foreground}' },
          subtle: { value: '{colors.muted.foreground}' },
          muted: { value: '{colors.muted.foreground}' },
        },
        
        // Dark mode overrides
        _dark: {
          bg: {
            DEFAULT: { value: 'oklch(0.145 0 0)' },
            subtle: { value: 'oklch(0.269 0 0)' },
            muted: { value: 'oklch(0.269 0 0)' },
          },
          
          fg: {
            DEFAULT: { value: 'oklch(0.985 0 0)' },
            subtle: { value: 'oklch(0.708 0 0)' },
            muted: { value: 'oklch(0.708 0 0)' },
          },
          
          // Dark mode color overrides
          background: { value: 'oklch(0.145 0 0)' },
          foreground: { value: 'oklch(0.985 0 0)' },
          
          card: { value: 'oklch(0.145 0 0)' },
          'card.foreground': { value: 'oklch(0.985 0 0)' },
          
          popover: { value: 'oklch(0.145 0 0)' },
          'popover.foreground': { value: 'oklch(0.985 0 0)' },
          
          primary: { value: 'oklch(0.985 0 0)' },
          'primary.foreground': { value: 'oklch(0.205 0 0)' },
          
          secondary: { value: 'oklch(0.269 0 0)' },
          'secondary.foreground': { value: 'oklch(0.985 0 0)' },
          
          muted: { value: 'oklch(0.269 0 0)' },
          'muted.foreground': { value: 'oklch(0.708 0 0)' },
          
          accent: { value: 'oklch(0.269 0 0)' },
          'accent.foreground': { value: 'oklch(0.985 0 0)' },
          
          destructive: { value: 'oklch(0.396 0.141 25.723)' },
          'destructive.foreground': { value: 'oklch(0.637 0.237 25.331)' },
          
          border: { value: 'oklch(0.269 0 0)' },
          input: { value: 'oklch(0.269 0 0)' },
          ring: { value: 'oklch(0.439 0 0)' },
          
          // Dark mode chart colors
          'chart.1': { value: 'oklch(0.488 0.243 264.376)' },
          'chart.2': { value: 'oklch(0.696 0.17 162.48)' },
          'chart.3': { value: 'oklch(0.769 0.188 70.08)' },
          'chart.4': { value: 'oklch(0.627 0.265 303.9)' },
          'chart.5': { value: 'oklch(0.645 0.246 16.439)' },
          
          // Dark mode sidebar colors
          sidebar: { value: 'oklch(0.205 0 0)' },
          'sidebar.foreground': { value: 'oklch(0.985 0 0)' },
          'sidebar.primary': { value: 'oklch(0.488 0.243 264.376)' },
          'sidebar.primary.foreground': { value: 'oklch(0.985 0 0)' },
          'sidebar.accent': { value: 'oklch(0.269 0 0)' },
          'sidebar.accent.foreground': { value: 'oklch(0.985 0 0)' },
          'sidebar.border': { value: 'oklch(0.269 0 0)' },
          'sidebar.ring': { value: 'oklch(0.439 0 0)' },
        },
      },
    },
  },
  
  globalCss: {
    html: {
      fontSize: '14px',
    },
    
    body: {
      bg: 'bg',
      color: 'fg',
      fontSize: 'base',
      fontWeight: 'normal',
      lineHeight: 'base',
    },
    
    // Typography styles
    'h1, h2, h3, h4': {
      fontWeight: 'medium',
      lineHeight: 'base',
    },
    
    h1: {
      fontSize: '2xl',
    },
    
    h2: {
      fontSize: 'xl',
    },
    
    h3: {
      fontSize: 'lg',
    },
    
    h4: {
      fontSize: 'base',
    },
    
    p: {
      fontSize: 'base',
      fontWeight: 'normal',
      lineHeight: 'base',
    },
    
    label: {
      fontSize: 'base',
      fontWeight: 'medium',
      lineHeight: 'base',
    },
    
    button: {
      fontSize: 'base',
      fontWeight: 'medium',
      lineHeight: 'base',
    },
    
    input: {
      fontSize: 'base',
      fontWeight: 'normal',
      lineHeight: 'base',
    },
  },
})

// Merge with default config
export const system = createSystem(defaultConfig, customConfig)

// Export theme for use in components
export const theme = system.theme

export default system