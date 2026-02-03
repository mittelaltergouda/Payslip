# Manual Testing Checklist

Quick reference checklist for manual testing. See `manual-testing-guide.md` for detailed test procedures.

---

## 1. Mobile Device Testing

### iPhone Safari
- [ ] Session wizard displays correctly
- [ ] Members table switches to card layout
- [ ] All touch targets are at least 44x44px
- [ ] No horizontal scroll at any breakpoint
- [ ] Distribution mode dropdown works
- [ ] Tax toggle responds to touch
- [ ] Results display is readable
- [ ] On-screen keyboard doesn't obscure inputs
- [ ] Value highlight animation works

### Android Chrome
- [ ] All iPhone tests pass
- [ ] Correct keyboard type for number inputs
- [ ] Chrome-specific rendering is correct
- [ ] Back button works as expected

---

## 2. Screen Reader Testing

### NVDA (Windows)
- [ ] Session name input announced correctly
- [ ] Distribution mode dropdown announces state and options
- [ ] Tax switch announces state (pressed/not pressed)
- [ ] Members table structure announced
- [ ] Column and row headers read correctly
- [ ] Error messages announced with aria-invalid
- [ ] Live regions announce calculation updates
- [ ] Dialog focus trap works
- [ ] Focus returns to trigger on dialog close

### JAWS (Windows)
- [ ] All NVDA tests pass with JAWS
- [ ] Forms Mode activates automatically
- [ ] All controls work in Forms Mode

### VoiceOver (macOS/iOS)
- [ ] All NVDA tests pass with VoiceOver
- [ ] Rotor navigation works (headings, forms, landmarks)
- [ ] iOS: Swipe gestures work correctly
- [ ] iOS: Double-tap activates buttons

---

## 3. Keyboard-Only Navigation

### Tab Order
- [ ] Tab order follows visual layout
- [ ] No elements skipped
- [ ] Shift+Tab reverses correctly
- [ ] Focus indicators visible (2px neon ring)
- [ ] No focus traps outside dialogs

### Interactive Components
- [ ] Dropdown: Enter/Space opens, Arrows navigate, Enter selects, Escape closes
- [ ] Switch: Space toggles state
- [ ] Dialog: Focus trapped, Escape closes, Focus returns to trigger
- [ ] Popover: Keyboard accessible, Tab navigates contents
- [ ] Buttons: Enter and Space activate

### Form Behavior
- [ ] Enter in input doesn't cause unintended submission
- [ ] Required fields indicated
- [ ] Error validation works

---

## 4. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest): All features work
- [ ] Firefox (latest): All features work
- [ ] Safari (latest): All features work
- [ ] Edge (latest): All features work
- [ ] Visual consistency across browsers
- [ ] Radix components render correctly
- [ ] Animations smooth in all browsers
- [ ] CSS variables applied correctly

### Mobile Browsers
- [ ] iOS Safari: All features work
- [ ] iOS Chrome: All features work
- [ ] Android Chrome: All features work
- [ ] Android Firefox: All features work
- [ ] Samsung Internet: All features work (if available)
- [ ] No unexpected zoom behavior
- [ ] Touch interactions responsive

---

## 5. Accessibility Compliance (WCAG 2.1 AA)

### Perceivable
- [ ] All images have alt text
- [ ] Proper HTML semantics
- [ ] Logical reading order
- [ ] Information not conveyed by color alone
- [ ] Text contrast ≥ 4.5:1
- [ ] UI component contrast ≥ 3:1

### Operable
- [ ] All functionality keyboard accessible
- [ ] No keyboard traps
- [ ] Logical focus order
- [ ] Visible focus indicators

### Understandable
- [ ] No context change on focus
- [ ] No unexpected context change on input
- [ ] Errors clearly identified
- [ ] All inputs have labels
- [ ] Error messages provide guidance

### Robust
- [ ] All components have accessible names
- [ ] All components have correct roles
- [ ] Status messages announced

---

## 6. Responsive Design

- [ ] Breakpoint md (768px): Table ↔ Card layout transition works
- [ ] No horizontal scroll at any viewport width
- [ ] Content readable on 320px width (iPhone SE)
- [ ] Content readable on 1920px width (desktop)
- [ ] Touch targets adequate on mobile
- [ ] Text remains legible (no tiny fonts)

---

## 7. Performance

- [ ] Page loads in < 3 seconds
- [ ] Animations smooth (60fps)
- [ ] No layout shifts (CLS)
- [ ] Interactions responsive (< 100ms)

---

## 8. Visual QA

- [ ] Sam palette colors correct (neon, aura, sand, slate, night)
- [ ] Typography hierarchy clear
- [ ] Spacing consistent (8px grid)
- [ ] Border radius consistent
- [ ] Shadows/glows render correctly
- [ ] Button ripple effect works
- [ ] Value highlight animation works
- [ ] Hover states smooth

---

## 9. Automated Tool Verification

- [ ] axe DevTools: 0 violations
- [ ] WAVE: No critical errors
- [ ] Lighthouse: Accessibility score ≥ 95

---

## 10. Critical User Flows

- [ ] Create new session (name input, start)
- [ ] Add member (button, fields, save)
- [ ] Edit member (inline editing)
- [ ] Remove member (delete button)
- [ ] Change distribution mode (dropdown)
- [ ] Toggle tax gross-up (switch)
- [ ] Calculate results (button, display)
- [ ] View session history (dialog)
- [ ] Export/Import session (buttons)

---

## Issues Found

| # | Severity | Component | Issue | Browser/Device |
|---|----------|-----------|-------|----------------|
| 1 |          |           |       |                |
| 2 |          |           |       |                |
| 3 |          |           |       |                |

**Severity Levels:**
- **Critical**: Blocks functionality, prevents task completion
- **High**: Major usability issue, workaround possible
- **Medium**: Minor usability issue
- **Low**: Cosmetic issue

---

## Sign-off

- [ ] All critical and high severity issues resolved
- [ ] All checklist items verified
- [ ] Documentation updated if needed
- [ ] Ready for production

**Tester:** _______________________
**Date:** _______________________
**Signature:** _______________________

---

**Version:** 1.0
**Last Updated:** 2026-02-02
