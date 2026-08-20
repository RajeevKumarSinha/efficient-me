# 07 — UI/UX Performance, Haptics & Design Excellence

> **Principle**: A user must be wowed at first glance. Software must feel alive, responsive, polished, and intuitive.

---

## 1. 60/120 FPS Rendering Standards

1. **Avoid Inline Object/Array Props in Loops**:
   - Inline styles and object literals inside `FlatList` render items allocate memory on every frame and trigger unnecessary child re-renders. Use `StyleSheet.create` or memoized objects.
2. **Native Thread Animations**:
   - Use `react-native-reanimated` or CSS hardware-accelerated transforms (`transform`, `opacity`). Never animate layout properties like `height`, `width`, or `top` on the JS thread.
3. **Touch Targets**:
   - All interactive touch targets must be at least $44 \times 44\text{ pt}$ (or use `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`).

---

## 2. Dynamic Theming & Contrast Ratios

- **Dark Mode**: Use deep, OLED-friendly blacks and dark slates (`#090D16`, `#131A29`) with high-contrast text (`#F8FAFC`, WCAG AAA ratio $\ge 7:1$).
- **Light Mode**: Crisp, clean slate backgrounds (`#F8FAFC`, `#FFFFFF`) with clear hierarchy.
- **Accents**: Use meaningful semantic colors (Amber for Energy, Indigo for Focus, Emerald for Success, Rose for Urgent).

---

## 3. Tactile Feedback & Micro-Interactions

- Add subtle haptic feedback (`expo-haptics`) to state changes:
  - Checkbox toggle $\rightarrow$ `Light` impact
  - Habit completion / Streak increment $\rightarrow$ `Success` notification vibration
  - Task deletion / Deferral $\rightarrow$ `Medium` impact
- Provide clear visual feedback (active opacity, subtle spring animations) for every touchable element.
