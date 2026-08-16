# FANCY DICE — FUTURE COMPANION ARCHITECTURE

**Status**: Architectural Concept Only — **FUTURE / OUT OF SCOPE / NOT PART OF CURRENT ROADMAP**

---

## 1. ARCHITECTURAL PRINCIPLE

Fancy Dice is and must remain a **100% independently functional, standalone mobile application**.

It will not be tightly coupled to any external application's internal implementation. Companion integration is recorded strictly as a future architectural possibility for tabletop software integration, particularly:

**`japiohopman/artificer`**

---

## 2. CONCEPTUAL HIGH-LEVEL ARCHITECTURE

```text
Artificer
    │
    │ Roll Request (e.g. "1d20+5", "Fireball 8d6")
    ▼
Fancy Dice Companion
    │
    │ Physical 3D Roll Simulation
    ▼
Roll Result
    │
    ▼
Artificer
```

---

## 3. THEORETICAL DATA EXCHANGE MODEL

If future integration is ever explored, the companion interface would theoretically communicate only high-level roll data structures:

- **Roll Requests**: Requested dice formula or preset action.
- **Dice Formulas**: Standard notation strings (e.g. `2d20kh1+4`).
- **Request Identifiers**: Unique UUIDs mapping async roll calls to origin requests.
- **Roll Results**: Final aggregated totals and sum breakdowns.
- **Natural Results**: Individual die face outcomes (e.g. natural 20s, natural 1s, dropped dice).
- **Modifiers**: Numerical offsets applied to the roll.
- **Metadata**: Roll labels or action descriptions (e.g. "Attack Roll", "Fireball Damage").

---

## 4. STRICT SCOPE BOUNDARIES — DO NOT IMPLEMENT

The following technologies and features are **STRICTLY PROHIBITED and OUT OF SCOPE** for Fancy Dice:

- ❌ Networking / HTTP clients / REST endpoints
- ❌ WebSockets / Real-time socket servers
- ❌ Bluetooth / BLE pairing
- ❌ Authentication / User accounts
- ❌ Device pairing protocols
- ❌ Backend infrastructure / Databases
- ❌ Android background services

This document serves as an architectural note only. No implementation code or networking logic will be added to Fancy Dice.
