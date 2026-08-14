---
name: Dark mode fix pattern — React Native StyleSheet
description: How to fix hardcoded colors in static StyleSheet so they respond to light/dark theme.
---

## The Problem
`StyleSheet.create({ btn: { backgroundColor: '#FFFFFF' } })` is evaluated once at startup — it never updates when the theme changes.

## The Fix (two-step)
1. **Remove** `backgroundColor` from the StyleSheet entry.
2. **Add inline** override on the element: `style={[styles.btn, { backgroundColor: colors.card }]}`

The inline style overrides the (now absent) static one and re-evaluates on every render when the theme changes.

## Common mappings
| Hardcoded value | Correct token |
|---|---|
| `'#FFFFFF'` (cards, buttons on light bg) | `colors.card` |
| `'#0A2342'` / NAVY | `colors.primary` |
| `'#D4A017'` / GOLD | `colors.accent` |
| `'#F0FDF4'` (success tint) | `` `${colors.success}15` `` |
| `'#F0F4F8'` / `'#F8FAFC'` (neutral bg) | `colors.iconBg` |
| `'#E2E8F0'` (dividers/borders) | `colors.border` |
| `shadowColor: NAVY` | `shadowColor: '#000'` |

## Logo tintColor
All `<Image source={logo} />` elements must have `tintColor={colors.primary}` so the navy logo becomes white in dark mode.

**Why:** The logo images are vector-style PNGs that render as solid navy; without `tintColor` they stay dark in dark mode and are invisible.

## Screens fixed (main + medium priority)
- All `app/(tabs)/` screens (index, account, more, bookings, notifications)
- `app/settings.tsx`
- `app/visa/[id].tsx`
- `components/VisaCard.tsx` (VisaCardHorizontal)

## Screens NOT yet fixed (low priority)
- `app/flight-booking.tsx`
- `app/flight-results.tsx`
- `app/booking/[id].tsx`
- `app/umrah-tracking/[id].tsx`
- `app/program/[id].tsx`
- `app/destination/[id].tsx`
