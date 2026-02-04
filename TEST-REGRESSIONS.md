# Test Regressions - Modern UI System

**Status**: ❌ CRITICAL
**Date**: 2024-02-02
**Subtask**: 6-1 - Run all existing unit tests

## Summary

The modern UI system implementation (Phases 1-5) introduced **79 failing tests** out of 1227 total tests (6.4% failure rate).

## Test Results

- ✅ **Passed**: 1148 tests (93.6%)
- ❌ **Failed**: 79 tests (6.4%)
- **Test Files**: 32 passed, 6 failed

## Failed Test Files

1. **components/MemberRow.test.tsx**
2. **components/MembersTable.test.tsx**
3. **components/SessionActions.test.tsx**
4. **components/SessionSettings.test.tsx**
5. **components/SessionWizard.test.tsx**
6. **components/ui/button.test.tsx**

## Root Cause

The new Radix UI components have different DOM structures and ARIA roles compared to the previous HTML implementations:

### 1. Select Component (Radix UI)
- **Old**: `<select>` with `role="combobox"`
- **New**: Radix Select with custom button trigger
- **Impact**: Tests looking for `role="button"` with mode labels fail
- **Affected**: SessionSettings, SessionWizard

### 2. Switch Component (Radix UI)
- **Old**: `<input type="checkbox">` with `role="checkbox"`
- **New**: Radix Switch with `role="switch"`
- **Impact**: Tests looking for `role="checkbox"` fail
- **Affected**: SessionSettings, SessionWizard

### 3. Button Component
- **Old**: Simple button with children
- **New**: Button with animation wrapper spans
- **Impact**: Empty children tests fail (button contains animation elements)
- **Affected**: Button component tests

### 4. Input Component
- **Old**: Simple input with "input" CSS class
- **New**: Styled input with different class structure
- **Impact**: Tests checking for "input" class fail
- **Affected**: MemberRow, MembersTable

### 5. Dialog Component
- **Issue**: Missing DialogDescription
- **Impact**: Accessibility warnings in tests
- **Affected**: SessionHistory

## Specific Failures

### SessionSettings.test.tsx (ALL tests failing)
```
Unable to find an accessible element with the role "button" and name `/Gleich/i`
Unable to find an accessible element with the role "checkbox" and name `/Transfer Tax berücksichtigen/i`
```

### SessionWizard.test.tsx (MOST tests failing)
```
Unable to find an accessible element with the role "button" and name `/Gleich|Prozent|Anpassbar/i`
Unable to find an accessible element with the role "checkbox" and name `/Transfer Tax berücksichtigen/i`
Unable to find an accessible element with the role "button" and name "+ Kosten"
Found multiple elements with the text of: /Session Name/i
```

### MembersTable.test.tsx
```
Found multiple elements with the text: Members
Found multiple elements with the text: Handle
Found multiple elements with the display value: Pilot.
```

### MemberRow.test.tsx
```
expect(element).toHaveClass("input")
Expected the element to have class: input
Received: [different class structure]
```

### Button.test.tsx
```
expect(element).toBeEmptyDOMElement()
Received: "<span class="absolute inset-0..."></span><span class="relative z-10"></span>"
```

## Required Fixes

To resolve these regressions, the following updates are needed:

### 1. Update SessionSettings Tests
- [ ] Use proper Radix Select selectors (find by trigger button)
- [ ] Update Switch component selectors (role="switch" not "checkbox")
- [ ] Update assertions to match new component structure

### 2. Update SessionWizard Tests
- [ ] Same as SessionSettings
- [ ] Fix "Session Name" multiple matches issue
- [ ] Update expense button selectors
- [ ] Update reset button selector

### 3. Update MembersTable Tests
- [ ] Use more specific selectors to avoid multiple matches
- [ ] Update to work with new Input component structure
- [ ] Possibly use `data-testid` attributes

### 4. Update MemberRow Tests
- [ ] Remove assertions for "input" CSS class
- [ ] Use semantic queries (getByRole, getByLabelText)

### 5. Update Button Tests
- [ ] Update empty children tests to account for animation wrappers
- [ ] Either check for visual emptiness or update expectations

### 6. Fix Dialog Accessibility
- [ ] Add DialogDescription to SessionHistory component
- [ ] Ensure all Dialog instances have proper descriptions

### 7. Update SessionActions Tests
- [ ] Update button style/class assertions to match new implementation

## Recommendations

1. **Prioritize Test Fixes**: Address these regressions before adding new features
2. **Use Data-TestID**: Consider adding `data-testid` attributes for complex component queries
3. **Update Test Patterns**: Document new testing patterns for Radix components
4. **Accessibility**: Ensure all Dialog components have Description elements
5. **CI/CD**: Do not merge until all tests pass

## Next Steps

1. Fix SessionSettings tests (highest priority - all failing)
2. Fix SessionWizard tests (highest priority - most failing)
3. Fix MembersTable tests (multiple element matches)
4. Fix MemberRow tests (CSS class assertions)
5. Fix Button tests (empty children edge cases)
6. Fix Dialog accessibility warnings
7. Re-run full test suite
8. Verify all 1227 tests pass

## Status

🚨 **BLOCKER**: This must be resolved before the modern UI system can be considered complete.
