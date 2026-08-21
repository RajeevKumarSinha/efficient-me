export const darkTheme = {
  isDark: true,
  colors: {
    background: '#090D16',
    cardBackground: '#131A29',
    cardBackgroundElevated: '#1A2438',
    cardBorder: '#23304B',
    cardBorderHighlight: '#3B82F640',
    
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#090D16',
    
    accent: '#6366F1', // Indigo primary
    accentHover: '#4F46E5',
    accentLight: '#6366F120',
    
    energyHigh: '#F59E0B', // Amber
    energyHighBg: '#F59E0B20',
    energyMed: '#3B82F6', // Blue
    energyMedBg: '#3B82F620',
    energyLow: '#10B981', // Emerald gentle
    energyLowBg: '#10B98120',
    
    moodGreat: '#8B5CF6',
    moodGood: '#3B82F6',
    moodNeutral: '#94A3B8',
    moodLow: '#F59E0B',
    moodRough: '#F43F5E',
    
    priorityP1: '#EF4444', // Red
    priorityP2: '#F97316', // Orange
    priorityP3: '#EAB308', // Yellow
    priorityP4: '#64748B', // Gray
    
    success: '#10B981',
    successBg: '#10B98120',
    warning: '#F59E0B',
    danger: '#EF4444',
    dangerBg: '#EF444420',
    
    tabBarBackground: '#0F1626',
    tabBarBorder: '#1F2B44',
    tabBarActive: '#6366F1',
    tabBarInactive: '#64748B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const lightTheme = {
  isDark: false,
  colors: {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    cardBackgroundElevated: '#F1F5F9',
    cardBorder: '#E2E8F0',
    cardBorderHighlight: '#6366F130',
    
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#F8FAFC',
    
    accent: '#4F46E5',
    accentHover: '#4338CA',
    accentLight: '#EEF2FF',
    
    energyHigh: '#D97706',
    energyHighBg: '#FEF3C7',
    energyMed: '#2563EB',
    energyMedBg: '#DBEAFE',
    energyLow: '#059669',
    energyLowBg: '#D1FAE5',
    
    moodGreat: '#7C3AED',
    moodGood: '#2563EB',
    moodNeutral: '#64748B',
    moodLow: '#D97706',
    moodRough: '#DC2626',
    
    priorityP1: '#DC2626',
    priorityP2: '#EA580C',
    priorityP3: '#CA8A04',
    priorityP4: '#94A3B8',
    
    success: '#059669',
    successBg: '#D1FAE5',
    warning: '#D97706',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    tabBarActive: '#4F46E5',
    tabBarInactive: '#94A3B8',
  },
  spacing: darkTheme.spacing,
  borderRadius: darkTheme.borderRadius,
};

export type Theme = typeof darkTheme;
