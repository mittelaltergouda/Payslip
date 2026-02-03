# Manual Testing Guide - Modern UI System

## Overview
This guide provides comprehensive manual testing procedures for the Modern UI System implementation, covering mobile devices, screen readers, browser compatibility, and keyboard-only navigation.

---

## 1. Mobile Device Testing

### 1.1 iPhone Safari Testing

**Device Requirements:**
- iPhone (iOS 15+)
- Safari browser

**Test Cases:**

#### TC-M1: Session Wizard on Mobile
1. Open http://localhost:3000 on iPhone Safari
2. Verify session name input is touch-friendly (large enough tap target)
3. Verify on-screen keyboard doesn't obscure input fields
4. Test "View History" button is easily tappable
5. Verify layout is responsive without horizontal scroll

**Expected Results:**
- ✅ All inputs are at least 44x44px (Apple HIG guideline)
- ✅ Viewport zooms appropriately on focus
- ✅ No horizontal scrolling
- ✅ Buttons have adequate spacing for finger taps

#### TC-M2: Members Table Card Layout (Mobile)
1. Navigate to members section
2. Verify table switches to card layout on narrow viewport
3. Test that each member card displays all fields vertically
4. Verify "Add Member" button is touch-friendly
5. Test input fields within cards are easily tappable
6. Verify delete/edit actions are accessible

**Expected Results:**
- ✅ Cards display below 768px breakpoint (md:)
- ✅ No horizontal scroll
- ✅ All member data visible in card format
- ✅ Touch targets meet 44x44px minimum

#### TC-M3: Distribution Mode Selector
1. Tap the distribution mode dropdown
2. Verify dropdown opens and is usable on touch
3. Test selecting different modes (EQUAL, PERCENT, ADJUSTABLE)
4. Verify mode preview appears on selection

**Expected Results:**
- ✅ Dropdown opens without issues
- ✅ Options are clearly visible and tappable
- ✅ Selection updates correctly

#### TC-M4: Tax Toggle Switch
1. Tap the tax toggle switch
2. Verify switch animates smoothly
3. Verify touch feedback is clear

**Expected Results:**
- ✅ Switch responds immediately to touch
- ✅ Visual state clearly indicates on/off
- ✅ Transition is smooth (150ms)

#### TC-M5: Results Display
1. Calculate session results
2. Verify results table is readable on mobile
3. Test that all columns are visible
4. Verify value highlight animation works on touch

**Expected Results:**
- ✅ Results display correctly on narrow viewports
- ✅ Numbers are legible
- ✅ Highlight animation triggers on recalculation

---

### 1.2 Android Chrome Testing

**Device Requirements:**
- Android device (Android 10+)
- Chrome browser

**Test Cases:**

#### TC-A1: Touch Gestures
1. Test all interactions from iPhone Safari tests (TC-M1 to TC-M5)
2. Verify swipe gestures don't interfere with UI
3. Test back button behavior

**Expected Results:**
- ✅ All iOS tests pass on Android
- ✅ Chrome-specific rendering is correct
- ✅ No Android-specific layout issues

#### TC-A2: Keyboard Input
1. Test numeric inputs with Android keyboard
2. Verify appropriate keyboard type appears (numeric for number fields)
3. Test that decimal input works correctly

**Expected Results:**
- ✅ Correct keyboard type for each input
- ✅ Number formatting works as expected
- ✅ No keyboard layout issues

---

## 2. Screen Reader Testing

### 2.1 NVDA (Windows)

**Software Requirements:**
- Windows 10/11
- NVDA screen reader (latest version)
- Firefox or Chrome

**Test Cases:**

#### TC-SR1: Session Wizard Navigation
1. Launch NVDA
2. Open http://localhost:3000
3. Use NVDA+Down Arrow to read page sequentially
4. Verify all content is announced correctly

**Expected Announcements:**
- ✅ "Session name, edit, type in text" (session name input)
- ✅ "View History, button" (history button)
- ✅ Form labels and hints are read
- ✅ Required fields announced as "required"

#### TC-SR2: Distribution Mode Selection
1. Navigate to distribution mode dropdown
2. Tab to the Select trigger
3. Press Enter to open dropdown
4. Use Arrow keys to navigate options
5. Verify NVDA announces each option

**Expected Announcements:**
- ✅ "Distribution mode, combo box, collapsed" (closed state)
- ✅ "Distribution mode, combo box, expanded" (open state)
- ✅ "EQUAL - Split revenue equally, option 1 of 3"
- ✅ Each option description is read

#### TC-SR3: Tax Toggle Switch
1. Navigate to tax toggle
2. Verify NVDA announces switch state

**Expected Announcements:**
- ✅ "Tax gross-up, switch, not pressed" (off state)
- ✅ "Tax gross-up, switch, pressed" (on state)
- ✅ Switch role and state are clear

#### TC-SR4: Members Table
1. Navigate to members table
2. Verify table structure is announced
3. Test row and column headers

**Expected Announcements:**
- ✅ "Members table, 3 rows, 6 columns"
- ✅ Column headers: "Name", "Revenue", "Investment", etc.
- ✅ Row data with proper associations
- ✅ "Remove member, button" for delete actions

#### TC-SR5: Error Messages
1. Trigger a validation error (empty required field)
2. Verify NVDA announces the error

**Expected Announcements:**
- ✅ "Session name, invalid, edit, Required"
- ✅ Error message is associated via aria-describedby
- ✅ aria-invalid="true" is announced

#### TC-SR6: Live Region Updates
1. Change a member's revenue amount
2. Calculate results
3. Verify NVDA announces the calculation update

**Expected Announcements:**
- ✅ "Session summary updated" (from aria-live region)
- ✅ New values are announced
- ✅ Updates don't interrupt current reading

#### TC-SR7: Dialog Navigation
1. Open session history
2. Verify focus moves to dialog
3. Test that focus is trapped within dialog
4. Press Escape to close
5. Verify focus returns to trigger element

**Expected Behavior:**
- ✅ "Session History, dialog" announced on open
- ✅ Focus moves to dialog title
- ✅ Tab cycles within dialog only
- ✅ Escape closes dialog
- ✅ Focus returns to "View History" button

---

### 2.2 JAWS (Windows)

**Software Requirements:**
- Windows 10/11
- JAWS screen reader (version 2020+)
- Chrome or Edge

**Test Cases:**

#### TC-J1: Repeat All NVDA Tests
1. Run all NVDA test cases (TC-SR1 to TC-SR7)
2. Verify JAWS provides equivalent or better announcements

**Expected Results:**
- ✅ All NVDA tests pass with JAWS
- ✅ JAWS-specific features work (e.g., Forms Mode)
- ✅ No JAWS-specific bugs

#### TC-J2: Forms Mode
1. Navigate to form inputs
2. Verify JAWS automatically enters Forms Mode
3. Test that all form controls work in Forms Mode

**Expected Results:**
- ✅ Forms Mode activates on input focus
- ✅ All inputs editable in Forms Mode
- ✅ Can exit Forms Mode with Numpad Plus

---

### 2.3 VoiceOver (macOS/iOS)

**Software Requirements:**
- macOS 12+ or iOS 15+
- Safari browser

**Test Cases:**

#### TC-VO1: Desktop VoiceOver
1. Enable VoiceOver (Cmd+F5)
2. Run all NVDA test cases (TC-SR1 to TC-SR7)
3. Verify VoiceOver rotor works for navigation

**Expected Results:**
- ✅ All tests pass with VoiceOver
- ✅ Rotor can navigate by headings, forms, landmarks
- ✅ Touch bar provides useful shortcuts

#### TC-VO2: iOS VoiceOver
1. Enable VoiceOver on iPhone
2. Test all mobile interactions with VoiceOver on
3. Verify swipe gestures work for navigation

**Expected Results:**
- ✅ Single swipe moves to next element
- ✅ Double tap activates buttons
- ✅ Rotor available for quick navigation
- ✅ All labels and roles announced correctly

---

## 3. Keyboard-Only Navigation

### 3.1 Tab Order and Focus Management

**Test Cases:**

#### TC-K1: Logical Tab Order
1. Start at top of page
2. Press Tab repeatedly
3. Verify focus moves in logical order:
   - Session name input
   - View History button
   - Distribution mode dropdown
   - Tax toggle switch
   - Member inputs (row by row)
   - Add Member button
   - Calculate/Save buttons

**Expected Results:**
- ✅ Tab order follows visual layout
- ✅ No focus traps (except in open dialogs)
- ✅ Focus indicators are clearly visible (2px neon ring)

#### TC-K2: Shift+Tab Reverse Navigation
1. Tab to bottom of page
2. Press Shift+Tab to navigate backwards
3. Verify reverse order matches forward order

**Expected Results:**
- ✅ Reverse tab order is correct
- ✅ No skipped elements

#### TC-K3: Skip to Main Content
1. Start at top of page
2. Verify skip link is available (if applicable)

**Expected Results:**
- ✅ Skip link appears on first Tab
- ✅ Activating skip link jumps to main content

#### TC-K4: Dropdown Navigation (Radix Select)
1. Tab to distribution mode dropdown
2. Press Enter or Space to open
3. Use Arrow keys to navigate options
4. Press Enter to select
5. Press Escape to close without selecting

**Expected Results:**
- ✅ Enter/Space opens dropdown
- ✅ Arrow keys navigate options
- ✅ Home/End jump to first/last option
- ✅ Enter selects option
- ✅ Escape closes dropdown

#### TC-K5: Switch Toggle
1. Tab to tax toggle switch
2. Press Space to toggle
3. Verify state changes

**Expected Results:**
- ✅ Space toggles switch
- ✅ Enter also works
- ✅ Visual state updates

#### TC-K6: Dialog Navigation
1. Tab to "View History" button
2. Press Enter to open dialog
3. Verify focus moves into dialog
4. Tab through dialog contents
5. Press Escape to close

**Expected Results:**
- ✅ Focus moves to dialog on open
- ✅ Tab cycles within dialog (focus trap)
- ✅ Escape closes dialog
- ✅ Focus returns to trigger button

#### TC-K7: Popover Navigation
1. Hover over distribution mode "i" icon
2. Verify popover can be opened with keyboard
3. Test navigation within popover

**Expected Results:**
- ✅ Popover opens on trigger focus + Enter
- ✅ Tab moves through popover contents
- ✅ Escape closes popover

---

### 3.2 Keyboard Shortcuts

#### TC-K8: Form Submission
1. Fill out form
2. Press Enter in input field
3. Verify form doesn't submit unexpectedly

**Expected Results:**
- ✅ Enter in text input moves to next field (if expected)
- ✅ Enter in last field doesn't cause unintended submission
- ✅ Explicit "Calculate" button required

---

## 4. Browser Compatibility

### 4.1 Desktop Browsers

**Test Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Test Cases:**

#### TC-B1: Visual Consistency
1. Open app in each browser
2. Compare layout and styling
3. Verify colors, fonts, spacing match

**Expected Results:**
- ✅ No visual regressions between browsers
- ✅ Sam palette colors render correctly
- ✅ Fonts load properly (system fonts)

#### TC-B2: Radix Component Rendering
1. Test all Radix components in each browser:
   - Select dropdown
   - Switch toggle
   - Checkbox
   - Dialog
   - Popover
2. Verify interactions work correctly

**Expected Results:**
- ✅ Dropdowns open/close correctly
- ✅ Switches toggle smoothly
- ✅ Dialogs overlay correctly
- ✅ No z-index issues

#### TC-B3: CSS Grid and Flexbox
1. Verify members table layout in each browser
2. Test responsive breakpoints
3. Verify card layout on mobile

**Expected Results:**
- ✅ Grid layout works in all browsers
- ✅ Flexbox alignment is correct
- ✅ No layout breaks

#### TC-B4: CSS Custom Properties
1. Inspect CSS variables in DevTools
2. Verify design tokens apply correctly
3. Test that color palette renders accurately

**Expected Results:**
- ✅ CSS variables defined and applied
- ✅ Fallbacks work if needed
- ✅ Colors match design system

#### TC-B5: Animations and Transitions
1. Test button ripple effect in each browser
2. Verify value highlight animation
3. Test hover states and transitions

**Expected Results:**
- ✅ Ripple animation plays smoothly
- ✅ Transitions are consistent (150-250ms)
- ✅ No janky animations

---

### 4.2 Mobile Browsers

**Test Browsers:**
- iOS Safari (iPhone)
- iOS Chrome (iPhone)
- Android Chrome
- Android Firefox
- Samsung Internet (Android)

**Test Cases:**

#### TC-MB1: Viewport Meta Tag
1. Verify page scales correctly on mobile
2. Test that user-scalable is allowed
3. Verify initial-scale=1.0

**Expected Results:**
- ✅ No unexpected zooming
- ✅ Users can pinch-zoom if needed
- ✅ Content fits viewport

#### TC-MB2: Touch Interactions
1. Test all touch interactions in each browser
2. Verify no click delays (300ms issue)
3. Test that hover states work appropriately

**Expected Results:**
- ✅ Immediate touch response
- ✅ No ghost clicks
- ✅ Hover states don't cause issues on touch devices

---

## 5. Accessibility Compliance Checklist

### WCAG 2.1 AA Requirements

#### Perceivable
- ✅ **1.1.1 Non-text Content:** All interactive elements have text alternatives
- ✅ **1.3.1 Info and Relationships:** Proper HTML semantics and ARIA
- ✅ **1.3.2 Meaningful Sequence:** Logical tab order
- ✅ **1.4.1 Use of Color:** Information not conveyed by color alone
- ✅ **1.4.3 Contrast (Minimum):** 4.5:1 for text, 3:1 for UI components
- ✅ **1.4.11 Non-text Contrast:** 3:1 for interactive components

#### Operable
- ✅ **2.1.1 Keyboard:** All functionality available via keyboard
- ✅ **2.1.2 No Keyboard Trap:** Can navigate away from all components
- ✅ **2.4.3 Focus Order:** Logical and intuitive
- ✅ **2.4.7 Focus Visible:** Clear focus indicators (2px neon ring)

#### Understandable
- ✅ **3.2.1 On Focus:** No context change on focus
- ✅ **3.2.2 On Input:** No unexpected context change on input
- ✅ **3.3.1 Error Identification:** Errors identified and described
- ✅ **3.3.2 Labels or Instructions:** All inputs have labels
- ✅ **3.3.3 Error Suggestion:** Error messages provide guidance

#### Robust
- ✅ **4.1.2 Name, Role, Value:** All components have accessible names and roles
- ✅ **4.1.3 Status Messages:** ARIA live regions for dynamic updates

---

## 6. Testing Tools

### Recommended Browser Extensions

1. **axe DevTools** (Chrome/Firefox)
   - Automated accessibility testing
   - Runs during development

2. **WAVE** (Chrome/Firefox)
   - Visual feedback for accessibility
   - Identifies errors and warnings

3. **Lighthouse** (Chrome DevTools)
   - Performance and accessibility audit
   - Generates reports

4. **Web Developer** (Chrome/Firefox)
   - Disable styles, images, JavaScript
   - Test linearization

### Screen Reader Software

1. **NVDA** (Windows) - Free
   - https://www.nvaccess.org/

2. **JAWS** (Windows) - Commercial (demo available)
   - https://www.freedomscientific.com/products/software/jaws/

3. **VoiceOver** (macOS/iOS) - Built-in
   - Cmd+F5 to toggle

### Device Testing Services

1. **BrowserStack** - Cross-browser and device testing
2. **Sauce Labs** - Automated and manual testing
3. **LambdaTest** - Real device cloud

---

## 7. Bug Reporting Template

When issues are found, use this template:

```markdown
## Issue Title
[Brief description]

### Environment
- Device: [e.g., iPhone 13 Pro]
- OS: [e.g., iOS 16.2]
- Browser: [e.g., Safari 16.2]
- Screen Reader: [e.g., VoiceOver, if applicable]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [etc.]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots/Videos
[Attach if available]

### Severity
- [ ] Critical (blocks functionality)
- [ ] High (major usability issue)
- [ ] Medium (minor usability issue)
- [ ] Low (cosmetic)

### Accessibility Impact
- [ ] Keyboard navigation broken
- [ ] Screen reader can't access content
- [ ] Focus indicator missing
- [ ] WCAG violation
- [ ] Not applicable
```

---

## 8. Sign-off Checklist

Before marking this subtask as complete, verify:

### Mobile Testing
- [ ] Tested on iPhone Safari (iOS 15+)
- [ ] Tested on Android Chrome (Android 10+)
- [ ] Card layout works on mobile (< 768px)
- [ ] No horizontal scroll on any viewport
- [ ] Touch targets meet 44x44px minimum

### Screen Reader Testing
- [ ] Tested with NVDA on Windows
- [ ] Tested with JAWS on Windows (or confirmed NVDA covers scenarios)
- [ ] Tested with VoiceOver on macOS or iOS
- [ ] All interactive elements announced correctly
- [ ] Form labels and errors are associated
- [ ] Live regions announce updates

### Keyboard Navigation
- [ ] Tab order is logical and complete
- [ ] All functionality available without mouse
- [ ] Focus indicators visible (2px ring)
- [ ] Dialogs trap focus correctly
- [ ] Dropdowns navigable with arrow keys
- [ ] No keyboard traps

### Browser Compatibility
- [ ] Chrome (latest) - desktop and mobile
- [ ] Firefox (latest) - desktop and mobile
- [ ] Safari (latest) - desktop and mobile
- [ ] Edge (latest) - desktop
- [ ] No visual regressions
- [ ] All interactions work consistently

### WCAG AA Compliance
- [ ] Color contrast meets 4.5:1 for text
- [ ] Color contrast meets 3:1 for UI components
- [ ] All images have alt text (if applicable)
- [ ] Forms have proper labels
- [ ] Error messages are accessible
- [ ] No accessibility violations in axe DevTools

---

## Notes

- This testing should be performed on a production-like build (`npm run build && npm start`)
- Document all issues found with screenshots/videos
- Prioritize critical accessibility issues (keyboard traps, screen reader failures)
- Remember that automated tools catch ~30% of accessibility issues - manual testing is essential

---

**Last Updated:** 2026-02-02
**Version:** 1.0
