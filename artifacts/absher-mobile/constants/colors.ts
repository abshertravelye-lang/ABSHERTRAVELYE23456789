/**
 * ABSHER TRAVEL — Premium Luxury Travel Brand Palette (Redesign Phase 1)
 */

const staticColors = {
  primaryNavy: '#0A2342',
  secondaryBlue: '#163354',
  premiumGold: '#C9A24B',
  premiumGoldActive: '#DAB868',
  umrahGreen: '#0B5E3B',
  skyBlue: '#38BDF8',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  
  // Legacy adapter tokens (to keep existing screens compiling)
  navy: '#0A2342',
  gold: '#C9A24B',
  cyan: '#163354', 
  radius: 12,
};

const light = {
  // New tokens
  background: '#F4F6F9',
  card: '#FFFFFF',
  text: '#0A2342',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#0A2342', // Navy
  primaryActive: '#163354', 
  accent: '#C9A24B',  // Gold
  accentActive: '#DAB868',
  success: staticColors.success,
  warning: staticColors.warning,
  error: staticColors.error,
  umrahGreen: staticColors.umrahGreen,
  skyBlue: staticColors.skyBlue,
  
  // Legacy adapter tokens
  foreground: '#0A2342',
  cardForeground: '#0A2342',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  input: '#E2E8F0',
  primaryForeground: '#FFFFFF',
  secondary: '#163354',
  secondaryForeground: '#FFFFFF',
  accentForeground: '#0A2342',
  destructive: staticColors.error,
  destructiveForeground: '#FFFFFF',
  iconBg: '#EBF0F8',
  goldTint: '#FBF6E4',
  cyanTint: '#E0F2FE',
  tint: '#0A2342',
};

const dark = {
  // New tokens
  background: '#041021', // Darker navy for dark mode
  card: '#0A2342',
  text: '#FFFFFF',
  textSecondary: '#CBD5E1',
  border: '#163354',
  primary: '#C9A24B',
  primaryActive: '#DAB868',
  accent: '#C9A24B',
  accentActive: '#DAB868',
  success: staticColors.success,
  warning: staticColors.warning,
  error: staticColors.error,
  umrahGreen: staticColors.umrahGreen,
  skyBlue: staticColors.skyBlue,
  
  // Legacy adapter tokens
  foreground: '#FFFFFF',
  cardForeground: '#FFFFFF',
  muted: '#163354',
  mutedForeground: '#CBD5E1',
  input: '#163354',
  primaryForeground: '#0A2342',
  secondary: '#38BDF8',
  secondaryForeground: '#FFFFFF',
  accentForeground: '#0A2342',
  destructive: staticColors.error,
  destructiveForeground: '#FFFFFF',
  iconBg: 'rgba(201,162,75,0.14)',
  goldTint: 'rgba(201,162,75,0.18)',
  cyanTint: 'rgba(22,51,84,0.14)',
  tint: '#C9A24B',
};

const colors = {
  light,
  dark,
  static: staticColors,
  ...staticColors, // Top-level for backwards compat if used directly (e.g. colors.navy)
};

export default colors;
