# FANCY DICE — FUTURE COMPANION ARCHITECTURE

This document outlines a high-level, lightweight architecture for potentially integrating **Fancy Dice** as an independent 3D dice companion with external tabletop applications, specifically:

**`japiohopman/artificer`**

---

## 1. ARCHITECTURAL PRINCIPLE

Fancy Dice is and will remain a **fully independent, standalone mobile application**.

Companion integration is designed as a non-intrusive, optional event interface. Fancy Dice will function identically whether embedded, invoked via custom URL schemes / deep links, or operated standalone.

---

## 2. HIGH-LEVEL ARCHITECTURE

```text
┌─────────────────────────┐
│       Artificer         │
│ (TRPG Campaign Manager) │
└────────────┬────────────┘
             │
             │ Roll Request (e.g. "1d20+5", "Fireball 8d6")
             ▼
┌─────────────────────────┐
│   Fancy Dice Companion  │
│  (3D Physics Renderer)  │
└────────────┬────────────┘
             │
             │ Physical 3D Roll Simulation
             ▼
┌─────────────────────────┐
│       Roll Result       │
│ (Total, Natural Crits)  │
└────────────┬────────────┘
             │
             │ Event Callback / Deep Link Response
             ▼
┌─────────────────────────┐
│        Artificer        │
│ (Log Result to Sheet)   │
└─────────────────────────┘
```

---

## 3. POTENTIAL INTEGRATION MECHANISMS

1. **Custom URL Scheme / Deep Linking** (Native Android/iOS): `fancydice://roll?formula=1d20%2B5&callback=artificer://result`
2. **PostMessage API** (WebView / Embedded iframe): Standard JSON RPC messaging interface for passing roll requests and receiving settled physical outcomes.
