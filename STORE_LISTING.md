# 📱 Efficient Me — Google Play Store Launch & Listing Kit

This document provides copy, ASO metadata, and exact Google Play Console answers for publishing **Efficient Me** on the Android Google Play Store.

---

## 🏷️ 1. Store Listing Metadata

### App Title (Max 30 Characters)
```
Efficient Me: Circadian Focus
```
*(Alternative: `Efficient Me: ADHD & Habits`)*

### Short Description (Max 80 Characters)
```
100% offline circadian task manager, elastic habits & neuroscience focus audio.
```

### Category
- **Primary**: Productivity
- **Tags / Tags List**: `Task Manager`, `Habit Tracker`, `Focus Timer`, `ADHD`, `Offline`

---

## 📝 2. Full Store Description (Formatted for Google Play)

```markdown
⚡ Align your daily workload with your biological energy, build resilient habits without burnout, and protect your privacy with 100% offline storage.

Most productivity apps assume humans are machines with 100% energy all day. Efficient Me is engineered around your circadian biology and somatic nervous system.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ CIRCADIAN ENERGY MANAGEMENT
• 5-Second Energy Check-Ins: Rate your energy (1⚡ to 5⚡) and mood in seconds.
• Automatic Low-Energy Mode: When you're fatigued, the app pauses intensive tasks and surfaces gentle chores to keep you moving without burnout.
• Peak Focus Window Detection: Discovers your cognitive peak hours and schedules high-focus tasks when your brain is sharpest.

🌱 ELASTIC 3-TIER HABITS
• Zero-Guilt Streak Protection: Never break a streak again.
• 3 Elastic Tiers: Pick Mini (1-2 min), Standard (10-15 min), or Plus (30+ min) based on how much energy you have today.
• 1-Tap Habit Marketplace: Pre-built templates for ADHD focus, morning sunlight, somatic wind-downs, and deep reading.

⏱️ FOCUS SPRINT & SOMATIC RESET
• Preset Focus Timers: 5m, 20m, 50m flow sessions with 1-tap task completion.
• Neuroscience Soundscapes: 100% offline synthesized 10Hz Binaural Alpha Waves, Gentle Rain, Deep Brown Noise, and Forest Streams.
• Stanford Physiological Sigh & Box Breathing: Animated haptic orb for instant nervous system resets.

📝 NATURAL LANGUAGE TASK CAPTURE
• Type naturally: "Design sprint 3⚡ tomorrow at 10am P1" — auto-categorizes energy, priority, and due dates.
• Periodic Chores & Annual Celebrations: Escalating reminders for birthdays and recurring tasks.

🎯 OKR GOALS & MILESTONES
• Connect daily habits directly to long-term milestone goals with visual progress tracking.

🔒 100% OFFLINE DATA SOVEREIGNTY
• Zero cloud telemetry, zero third-party tracking, zero accounts.
• All data lives strictly in your device's encrypted local SQLite database.
• Password-protected AES-256 local backups and CSV/JSON export.

🌐 6 LANGUAGES SUPPORTED
• Instant language switching in English, Spanish, German, French, Hindi, and Japanese.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BUILT FOR HIGH PERFORMERS & NEURODIVERGENT MINDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Whether you have ADHD, struggle with task paralysis, or simply want to achieve peak cognitive efficiency, Efficient Me adapts to you.

Download Efficient Me today and experience guilt-free, biologically aligned productivity!
```

---

## 🛡️ 3. Google Play Data Safety Form Answers

When filling out the **Data safety** questionnaire in the Google Play Console:

| Question | Your Exact Answer | Rationale |
| :--- | :--- | :--- |
| **Does your app collect or share any user data?** | **No** | The app operates 100% locally with an embedded SQLite database. |
| **Is all user data encrypted in transit?** | **Not applicable (No network transmission)** | No network API calls are made. |
| **Do you provide a way for users to request data deletion?** | **Yes** | Built-in "Erase All Local Data" button in Settings. |
| **Is your app target age group 13 and above?** | **Yes (13+)** | Suitable for general productivity users. |

---

## 🛠️ 4. Commands to Build Release Binaries

### Option A: Build Standalone Testing APK (Install directly on Android device)
```bash
npx eas-cli build -p android --profile preview
```

### Option B: Build Signed Google Play App Bundle (`.aab`) (Upload to Play Console)
```bash
npx eas-cli build -p android --profile production
```
*(EAS will automatically manage keystores and output a signed `.aab` file ready for the Google Play Internal Testing, Closed Testing, or Production tracks).*
