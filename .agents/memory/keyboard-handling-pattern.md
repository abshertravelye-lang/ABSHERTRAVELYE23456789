---
name: Mobile keyboard handling convention
description: Product conventions for keyboard behavior and touch targets in the Expo app
---

**Rule:** All mobile form screens share one keyboard-avoidance wrapper (built on the keyboard-controller library already provided at the app root — never add a second provider). Chat-style screens (inverted list + input bar) use the controller's avoiding view instead. Never reach for React Native's raw KeyboardAvoidingView.

**Why:** The raw RN component is jumpy and doesn't keep the active field visible; mixing patterns caused fields hidden behind the keyboard. One shared wrapper keeps behavior consistent.

**How to apply:**
- The keyboard-controller library has no web support — every usage needs a web fallback (the shared wrapper already handles this).
- Fields chain focus: "next" keeps the keyboard open and moves to the following field; the last field uses done/send per the form's intent. Input components must forward refs to support this.
- Touch targets: interactive inputs and buttons need an explicit `minHeight: 48` — padding-derived heights fail accessibility review.
- Keyboard behavior cannot be verified in web preview; it needs a real device or Expo Go.
