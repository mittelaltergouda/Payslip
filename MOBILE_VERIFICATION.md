# Mobile Responsiveness Verification for Share Page

## Overview
This document provides manual verification steps for the share page mobile responsiveness (375px viewport).

## Prerequisites
1. Start the development server: `npm run dev`
2. Create a test session and generate a share link
3. Open the share link in a browser

## Verification Steps

### 1. Open Developer Tools
- Press F12 to open browser DevTools
- Click the device toolbar icon (or press Ctrl+Shift+M)
- Set viewport to **375px x 667px** (iPhone SE size)

### 2. Navigate to Share Page
- Use a valid share link (format: `http://localhost:3000/share/[token]`)
- Page should load without errors

### 3. Verify Layout Integrity
✅ **Check:** Page doesn't require horizontal scrolling at the body level
- The main content area should fit within 375px width
- No elements should force the entire page to scroll horizontally

✅ **Check:** Table is scrollable within its container
- The members results table should have horizontal scroll
- Scroll should be contained within the table wrapper (overflow-x-auto)
- Use finger swipe (mobile) or click-drag (desktop DevTools) to scroll the table

✅ **Check:** Headers and title wrap properly
- Session name should wrap if too long
- "Read-only share link" text should be visible
- Date and session type should be visible

### 4. Verify Touch Targets
✅ **Check:** All interactive elements are touchable
- Although share page is read-only, verify any links are tappable
- Minimum touch target size should be 44x44px (iOS guideline)

### 5. Verify Content Display
✅ **Check:** All table columns are visible (via horizontal scroll)
- Handle
- Revenue
- Investment
- Expenses
- Taxes
- Profit Share
- Net After Fees

✅ **Check:** Numbers format correctly
- No overlap or text cutoff
- Proper thousand separators (e.g., 1,500,000)

✅ **Check:** Color coding works
- Positive net amounts show in neon/green
- Negative amounts show in red

### 6. Test Different Screen Sizes
✅ **Test on multiple viewports:**
- 375px (iPhone SE, small phones)
- 390px (iPhone 12/13)
- 414px (iPhone Plus models)
- 360px (small Android phones)

### 7. Verify Grid Responsiveness
✅ **Check:** Two-column layout collapses to single column on mobile
- Summary stats should stack above transfers list
- No horizontal overflow from grid layout

## Expected Behavior

### ✅ PASS Criteria
- Main page content fits within viewport width
- Table is horizontally scrollable within its container
- No broken layouts or overlapping elements
- All text is readable
- Numbers display correctly with proper formatting

### ❌ FAIL Criteria
- Entire page requires horizontal scrolling
- Table scroll is broken or doesn't work
- Text is cut off or overlapping
- Layout elements are not visible
- Console errors appear

## Common Issues to Watch For

1. **Horizontal Page Scroll**: If the entire page scrolls horizontally, check:
   - Grid containers have `min-w-0` class
   - Overflow containers are properly nested
   - No fixed-width elements exceed viewport

2. **Table Not Scrollable**: If table doesn't scroll, check:
   - Parent container has `overflow-x-auto`
   - Table has proper width classes
   - No CSS conflicts

3. **Text Overflow**: If text is cut off, check:
   - Headers have `flex-wrap` where needed
   - Long text has proper wrapping
   - No `whitespace-nowrap` on mobile-critical text

## Automated Test Reference

The E2E test in `tests/e2e/share-link.spec.ts` includes a mobile responsiveness test that:
- Sets viewport to 375x667
- Verifies table is visible
- Checks for proper rendering

## Implementation Details

### CSS Classes Used
- `max-w-7xl mx-auto px-4`: Main container with responsive padding
- `min-w-0`: Allows flex/grid items to shrink below content size
- `overflow-x-auto`: Enables horizontal scrolling on table
- `lg:grid-cols-2`: Two columns on large screens, single column on mobile
- `flex-wrap`: Allows flex items to wrap on smaller screens

### Files Modified
- `app/share/[token]/page.tsx`: Share page component with mobile-responsive table

## Testing Checklist

- [ ] Page loads without errors on 375px viewport
- [ ] Main content fits within viewport (no page-level horizontal scroll)
- [ ] Table is scrollable horizontally within container
- [ ] Session title and metadata visible
- [ ] All table columns accessible via table scroll
- [ ] Numbers formatted correctly
- [ ] Color coding works (green/red for net amounts)
- [ ] Grid layout responsive (stacks on mobile)
- [ ] No console errors
- [ ] Tested on multiple mobile viewport sizes

## Notes
- The table SHOULD scroll horizontally - this is expected behavior for a 7-column table on a 375px screen
- The page itself should NOT scroll horizontally - only the table container should scroll
- Use `min-w-0` on grid/flex containers to enable proper overflow handling
