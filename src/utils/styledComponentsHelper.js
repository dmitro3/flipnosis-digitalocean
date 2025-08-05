// Utility to safely access theme properties in styled-components
export const safeThemeAccess = (props, path, fallback = '') => {
  try {
    if (!props || !props.theme) {
      return fallback
    }
    
    const keys = path.split('.')
    let value = props.theme
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return fallback
      }
    }
    
    return value || fallback
  } catch (error) {
    console.warn('⚠️ Error accessing theme property:', path, error)
    return fallback
  }
}

// Safe theme access helpers
export const getThemeColor = (props, colorName, fallback = '#ffffff') => {
  return safeThemeAccess(props, `colors.${colorName}`, fallback)
}

export const getThemeProperty = (props, propertyName, fallback = '') => {
  return safeThemeAccess(props, propertyName, fallback)
}

// Enhanced theme object with fallbacks
export const createSafeTheme = (theme) => {
  return {
    ...theme,
    // Ensure all commonly used properties exist
    primary: theme.primary || theme.colors?.neonGreen || '#00FF41',
    secondary: theme.secondary || theme.colors?.neonBlue || '#00bfff',
    border: theme.border || 'rgba(255, 255, 255, 0.2)',
    background: theme.background || 'rgba(255, 255, 255, 0.05)',
    accent: theme.accent || theme.colors?.neonPink || '#ff1493',
    // Add fallback colors
    colors: {
      ...theme.colors,
      primary: theme.colors?.primary || theme.colors?.neonGreen || '#00FF41',
      secondary: theme.colors?.secondary || theme.colors?.neonBlue || '#00bfff',
      accent: theme.colors?.accent || theme.colors?.neonPink || '#ff1493',
    }
  }
}

// Safe styled-components wrapper
export const createSafeStyledComponent = (styled, componentName) => {
  return (strings, ...interpolations) => {
    try {
      return styled[componentName](strings, ...interpolations)
    } catch (error) {
      console.error(`❌ Error creating styled component ${componentName}:`, error)
      // Return a fallback component
      return styled[componentName]`
        color: #ffffff;
        background: #000000;
        border: 1px solid #ffffff;
      `
    }
  }
} 