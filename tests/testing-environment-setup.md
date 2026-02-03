# Testing Environment Setup Guide

This guide helps you set up the necessary tools and environment for manual testing of the Modern UI System.

---

## 1. Local Development Environment

### Prerequisites
- Node.js 18+ installed
- Git installed
- Project cloned and dependencies installed

### Start the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server (for quick testing)
npm run dev
# Access at: http://localhost:3000

# OR - Build and start production mode (recommended for final testing)
npm run build
npm start
# Access at: http://localhost:3000
```

### Verify Build Success

```bash
# Run all checks
npm run check

# This runs:
# - TypeScript compilation
# - ESLint
# - Unit tests
# - Build verification
```

---

## 2. Browser Setup

### Desktop Browsers (Required)

1. **Google Chrome** (Latest)
   - Download: https://www.google.com/chrome/
   - Install axe DevTools extension
   - Install WAVE extension

2. **Mozilla Firefox** (Latest)
   - Download: https://www.mozilla.org/firefox/
   - Install axe DevTools extension

3. **Safari** (Latest) - macOS only
   - Built-in on macOS
   - Enable Developer Menu: Safari > Preferences > Advanced > Show Develop menu

4. **Microsoft Edge** (Latest)
   - Download: https://www.microsoft.com/edge
   - Install axe DevTools extension

### Mobile Browsers (Required)

1. **iPhone Safari**
   - iOS 15+ required
   - Enable Web Inspector for debugging:
     - Settings > Safari > Advanced > Web Inspector

2. **Android Chrome**
   - Android 10+ required
   - Enable USB debugging for remote inspection:
     - Settings > Developer Options > USB debugging

---

## 3. Browser Extensions

### axe DevTools (Accessibility Testing)

**Chrome/Edge:**
1. Visit: https://chrome.google.com/webstore
2. Search for "axe DevTools"
3. Click "Add to Chrome/Edge"

**Firefox:**
1. Visit: https://addons.mozilla.org
2. Search for "axe DevTools"
3. Click "Add to Firefox"

**Usage:**
1. Open DevTools (F12)
2. Click "axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review issues found

---

### WAVE (Web Accessibility Evaluation Tool)

**Chrome/Firefox:**
1. Visit: https://wave.webaim.org/extension/
2. Follow installation instructions
3. Click WAVE icon in toolbar to analyze page

**Usage:**
1. Navigate to page
2. Click WAVE extension icon
3. Review errors, alerts, and features
4. Click icons for details

---

### Lighthouse (Chrome DevTools)

**Built-in to Chrome/Edge:**
1. Open DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Analyze page load"

---

## 4. Screen Reader Setup

### Windows: NVDA (Free, Recommended)

**Installation:**
1. Download from: https://www.nvaccess.org/download/
2. Run installer
3. Choose installation or portable version
4. Follow setup wizard

**Basic Controls:**
- **Start/Stop:** Ctrl + Alt + N
- **Read next line:** Down Arrow
- **Read next character:** Right Arrow
- **Stop reading:** Ctrl
- **Elements list:** Insert + F7
- **Forms mode toggle:** Insert + Space
- **NVDA menu:** Insert + N

**Quick Start:**
1. Press Ctrl + Alt + N to start NVDA
2. Open http://localhost:3000 in Firefox or Chrome
3. Press Down Arrow to read line by line
4. Use Tab to navigate between interactive elements
5. Press Ctrl to stop reading

---

### Windows: JAWS (Commercial)

**Installation:**
1. Download from: https://www.freedomscientific.com/Downloads/JAWS
2. Run installer (free 40-minute demo mode available)
3. Restart computer

**Basic Controls:**
- **Read next line:** Down Arrow
- **Read next word:** Ctrl + Right Arrow
- **Stop reading:** Ctrl
- **Forms list:** Insert + F5
- **Links list:** Insert + F7
- **Virtual PC cursor toggle:** Insert + Z

---

### macOS: VoiceOver (Built-in)

**Enable VoiceOver:**
1. Press **Cmd + F5** (or triple-click Touch ID on MacBook Pro)
2. Or: System Preferences > Accessibility > VoiceOver > Enable

**Basic Controls:**
- **VoiceOver keys:** Control + Option (VO)
- **Start/Stop:** Cmd + F5
- **Navigate next:** VO + Right Arrow
- **Navigate previous:** VO + Left Arrow
- **Activate:** VO + Space
- **Rotor:** VO + U
- **Web Rotor:** VO + Command + U

**Quick Start:**
1. Press Cmd + F5 to start VoiceOver
2. Open http://localhost:3000 in Safari
3. Press VO + Right Arrow to navigate
4. Press VO + Space to activate elements
5. Press VO + U for Rotor (quick navigation)

---

### iOS: VoiceOver (Built-in)

**Enable VoiceOver:**
1. Settings > Accessibility > VoiceOver > On
2. Or: Triple-click Side/Home button (if enabled in Accessibility Shortcut)

**Basic Gestures:**
- **Navigate next:** Swipe right
- **Navigate previous:** Swipe left
- **Activate:** Double-tap
- **Rotor:** Rotate two fingers
- **Scroll:** Three-finger swipe
- **Back:** Two-finger Z gesture

**Quick Start:**
1. Triple-click Home button to enable VoiceOver
2. Open Safari
3. Navigate to http://[your-local-ip]:3000
4. Swipe right to navigate
5. Double-tap to activate

---

## 5. Mobile Device Testing

### Option A: Physical Devices (Recommended)

**iPhone Setup:**
1. Connect to same Wi-Fi as development machine
2. Find your computer's local IP: `ipconfig` (Windows) or `ifconfig` (macOS)
3. Open Safari on iPhone
4. Navigate to: http://[your-ip]:3000

**Android Setup:**
1. Enable USB debugging in Developer Options
2. Connect to same Wi-Fi as development machine
3. Find your computer's local IP
4. Open Chrome on Android
5. Navigate to: http://[your-ip]:3000

---

### Option B: Remote Device Testing (Alternative)

**BrowserStack (Free Trial):**
1. Sign up: https://www.browserstack.com/
2. Start free trial
3. Choose "Live" testing
4. Select device (iPhone, Android)
5. Enter URL: http://localhost:3000 (use BrowserStack Local)

**LambdaTest (Free Plan):**
1. Sign up: https://www.lambdatest.com/
2. Choose "Real Device Testing"
3. Select device
4. Test your app

---

### Option C: Browser DevTools (Quick Check)

**Chrome DevTools Device Emulation:**
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device from dropdown (e.g., iPhone 12 Pro)
4. Test responsive design

**Note:** Device emulation is good for layout testing but doesn't replace real device testing for touch interactions.

---

## 6. Network Throttling (Optional)

Test performance on slower connections:

**Chrome DevTools:**
1. Open DevTools (F12)
2. Click "Network" tab
3. Select throttling preset (e.g., "Slow 3G")
4. Reload page

---

## 7. Color Contrast Checkers

### Browser-based Tools

**WebAIM Contrast Checker:**
- URL: https://webaim.org/resources/contrastchecker/
- Enter foreground and background colors
- Verify WCAG AA compliance (4.5:1 for text)

**Coolors Contrast Checker:**
- URL: https://coolors.co/contrast-checker
- Visual interface for checking contrast

---

## 8. Keyboard Testing Setup

No special tools needed! Just use:
- **Tab:** Navigate forward
- **Shift + Tab:** Navigate backward
- **Enter:** Activate buttons/links
- **Space:** Activate buttons, toggle checkboxes
- **Arrow keys:** Navigate within components (dropdowns, radios)
- **Escape:** Close dialogs/popovers

**Tip:** Unplug your mouse to force keyboard-only navigation!

---

## 9. Viewport Sizes for Testing

Test these common viewport sizes:

| Device | Width | Height | Description |
|--------|-------|--------|-------------|
| iPhone SE | 375px | 667px | Small mobile |
| iPhone 12/13 Pro | 390px | 844px | Standard mobile |
| iPhone 12/13 Pro Max | 428px | 926px | Large mobile |
| iPad Mini | 768px | 1024px | Small tablet |
| iPad Pro | 1024px | 1366px | Large tablet |
| Laptop | 1366px | 768px | Small laptop |
| Desktop | 1920px | 1080px | Standard desktop |
| Large Desktop | 2560px | 1440px | Large desktop |

---

## 10. Testing Checklist Quick Links

After setup, use these guides:

1. **Detailed Test Procedures:** `tests/manual-testing-guide.md`
2. **Quick Checklist:** `tests/manual-testing-checklist.md`
3. **Report Template:** `tests/manual-test-report-template.md`

---

## 11. Troubleshooting

### Can't Access App on Mobile Device

**Issue:** Mobile device can't reach http://localhost:3000

**Solution:**
1. Ensure mobile and computer are on same Wi-Fi
2. Find computer's local IP:
   - Windows: `ipconfig` → Look for "IPv4 Address"
   - macOS/Linux: `ifconfig` → Look for "inet"
3. Use IP instead of localhost: http://192.168.1.x:3000
4. Check firewall settings (allow port 3000)

---

### Screen Reader Not Working

**NVDA:**
- Ensure NVDA is running (Ctrl + Alt + N)
- Check that browser has focus
- Try Insert + Q to restart NVDA

**VoiceOver:**
- Ensure VoiceOver is enabled (Cmd + F5)
- Check that Safari has focus
- Try restarting VoiceOver

**JAWS:**
- Ensure JAWS is running
- Check that browser is in focus
- Try restarting JAWS

---

### Browser Extensions Not Working

**Solution:**
1. Check extension is enabled in browser settings
2. Refresh page after enabling extension
3. Try incognito/private mode to rule out extension conflicts
4. Reinstall extension if issues persist

---

### Build Fails

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

## 12. Getting Help

### Documentation
- **React:** https://react.dev/
- **Next.js:** https://nextjs.org/docs
- **Radix UI:** https://www.radix-ui.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

### Accessibility Resources
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM:** https://webaim.org/
- **A11y Project:** https://www.a11yproject.com/

### Screen Reader Guides
- **NVDA User Guide:** https://www.nvaccess.org/documentation/
- **VoiceOver User Guide:** https://support.apple.com/guide/voiceover/
- **JAWS Keystrokes:** https://www.freedomscientific.com/training/jaws/keystrokes/

---

## 13. Ready to Test!

Once you've completed this setup:

1. ✅ Application running (http://localhost:3000)
2. ✅ Browsers installed (Chrome, Firefox, Safari, Edge)
3. ✅ Extensions installed (axe DevTools, WAVE)
4. ✅ At least one screen reader set up (NVDA, JAWS, or VoiceOver)
5. ✅ Mobile devices connected (or emulator ready)

**Next Step:** Start with `tests/manual-testing-checklist.md` for quick reference or `tests/manual-testing-guide.md` for detailed procedures.

**Good luck with testing!** 🎉

---

**Version:** 1.0
**Last Updated:** 2026-02-02
