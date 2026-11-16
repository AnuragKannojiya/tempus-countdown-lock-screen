# Tempus — Countdown Lock Screen

> A beautiful, intelligent countdown lock screen experience that keeps you aware of what matters — built with pure HTML, CSS & JavaScript.

![Tempus](https://img.shields.io/badge/Tempus-Countdown_Lock_Screen-6366f1?style=for-the-badge)

## ✨ Features

- **🎨 6 Stunning Themes** — Aurora, Ocean, Sunset, Forest, Midnight, and Rosé, each with custom ambient color palettes
- **🌊 Dynamic Ambient Background** — Floating gradient orbs and rising particle effects that react to urgency
- **⏱️ Precision Countdown** — Days, hours, minutes, and seconds with animated progress ring
- **🔥 Urgency Mode** — As your deadline approaches, the screen intensifies: colors shift warm, particles accelerate, and digits pulse red
- **💡 Smart Insights** — Contextual progress messages that adapt based on time remaining
- **📝 Motivational Quotes** — Curated time-themed quotes that rotate every 30 seconds
- **⚡ Quick Presets** — One-tap timers for focus sessions (25m/50m), breaks, workouts, and custom countdowns
- **📱 Fully Responsive** — Pixel-perfect from iPhone SE to ultrawide monitors
- **🔒 Screen Wake Lock** — Keeps your display on (via Web Wake Lock API)
- **🎉 Celebration Mode** — Confetti burst and sound when the countdown hits zero
- **⌨️ Keyboard Shortcuts** — `F` for fullscreen, `S` for settings, `Esc` to close
- **♿ Accessible** — Respects `prefers-reduced-motion`, focus-visible outlines, semantic HTML

## 🚀 Getting Started

Simply open `index.html` in any modern browser. No build tools, no dependencies, no server required.

```
open index.html
```

Or serve it locally:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## 🎮 Controls

| Action | How |
|---|---|
| Open Settings | Click ⚙️ button or press `S` |
| Change Theme | Click 🌞 button or use theme grid in settings |
| Fullscreen | Click ⛶ button or press `F` |
| Keep Screen On | Click 💡 button |
| Quick Timer | Select a preset in settings |
| Double-tap countdown | Open settings |

## 🎨 Themes

| Theme | Vibe |
|---|---|
| Aurora | Indigo → Purple → Pink |
| Ocean | Cyan → Blue → Navy |
| Sunset | Orange → Red → Crimson |
| Forest | Green → Emerald → Dark Green |
| Midnight | Silver → Slate → Charcoal |
| Rosé | Pink → Rose → Deep Red |

## 🏗️ Architecture

```
countdown-lock-screen/
├── index.html      # Semantic HTML structure
├── style.css       # Responsive styles, themes, animations
├── app.js          # All application logic (zero dependencies)
└── README.md       # This file
```

**Zero Dependencies.** Pure HTML + CSS + JavaScript. No frameworks, no bundlers, no node_modules.

## 📐 Design Decisions

- **Glassmorphism UI** with backdrop blur for a premium lock-screen feel
- **CSS Custom Properties** for instant theme switching without JS style manipulation
- **`requestAnimationFrame`** for smooth 60fps ambient animations
- **`localStorage`** for persistent settings across sessions
- **Web APIs**: Wake Lock, Fullscreen, AudioContext (for completion chime)

## 📱 Browser Support

- Chrome 80+
- Firefox 90+
- Safari 15+
- Edge 80+

## 📄 License

MIT — Free to use, modify, and distribute.

---

Built with ❤️ for the **Handshake AI Skills Studio × Google Challenge**
