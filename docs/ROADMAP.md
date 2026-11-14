# Fancy Dice — product and engineering roadmap

This document is a concise map of the approved backlog. GitHub issues are the source of truth for scope and acceptance criteria; do not use this page to create a second implementation queue.

## Product direction

Keep Fancy Dice a standalone 3D dice roller. The dice table remains the centre of the experience. Navigation should be compact and non-disruptive; formula correctness, reliable physical rolls, responsiveness, accessibility, maintainability and PWA behaviour remain first-class requirements.

The longer-term visual direction is **Tavern Table**: deep felt, ivory/bone dice, warm walnut/espresso surfaces, restrained brass and clear numeric typography. This is a gradual visual direction, not permission for a wholesale redesign or rename. See Issue #55.

## Product freeze boundaries

The current roadmap does not authorize new gameplay systems, accounts, cloud sync, multiplayer, remote rolling, Bluetooth, backend services or implementation of the Artificer companion concept. The companion document is future architecture only.

## Current issue status

| Area | Issue | Status | Remaining work / dependency |
| --- | --- | --- | --- |
| Navigation | [#30 Compact two-tier navigation](https://github.com/japiohopman/fancy-dice/issues/30) | Complete | — |
| Navigation | [#31 Non-disruptive overlay menus](https://github.com/japiohopman/fancy-dice/issues/31) | Complete | — |
| Navigation | [#32 Unified Options menu](https://github.com/japiohopman/fancy-dice/issues/32) | Complete | — |
| Customization | [#33 Discoverable custom dice color picker](https://github.com/japiohopman/fancy-dice/issues/33) | Complete | — |
| History | [#34 Compact one-line Roll History](https://github.com/japiohopman/fancy-dice/issues/34) | Complete | — |
| Visual UX | [#35 Stage framing](https://github.com/japiohopman/fancy-dice/issues/35) | Complete | — |
| Visual UX | [#36 Premium tabletop visual system](https://github.com/japiohopman/fancy-dice/issues/36) | Complete | — |
| Responsive UX | [#37 Responsive and accessibility verification](https://github.com/japiohopman/fancy-dice/issues/37) | Complete | — |
| Overlay polish | [#48 Menu and overlay transitions](https://github.com/japiohopman/fancy-dice/issues/48) | Complete | — |
| Logic | [#38 Strict dice notation validation](https://github.com/japiohopman/fancy-dice/issues/38) | Implementation merged | Manual formula, keep/drop, Fate and chained-explosion verification remains. |
| Logic | [#39 Synchronize notation, builder, presets and history](https://github.com/japiohopman/fancy-dice/issues/39) | Complete | — |
| Reliability | [#40 Roll lifecycle and sensor listener reliability](https://github.com/japiohopman/fancy-dice/issues/40) | Complete | — |
| Performance | [#41 DiceBox/WebGL startup performance](https://github.com/japiohopman/fancy-dice/issues/41) | Complete | Bundle-splitting implementation and repeatable runtime measurement guidance are recorded. Do not infer device latency without measurements. |
| Performance | [#42 Audio and color-picker interaction performance](https://github.com/japiohopman/fancy-dice/issues/42) | Implementation merged | Physical-device sound, color-wheel, mute and background/foreground acceptance remains. |
| Maintenance | [#43 Remove unused legacy UI components](https://github.com/japiohopman/fancy-dice/issues/43) | Complete | Six unused files, orphaned type and unused confetti dependencies removed. |
| Documentation | [#44 Align architecture, roadmap and Android guidance](https://github.com/japiohopman/fancy-dice/issues/44) | In progress | This documentation pass aligns the repository docs with the shipped PWA and current source. |
| Visual direction | [#55 Tavern Table and numeric typography](https://github.com/japiohopman/fancy-dice/issues/55) | Open | Gradual, separately reviewed visual slices; no global rebrand. |

## Dependencies and order

- Issues #38 and #42 have implementation merged, but stay open for their explicitly required manual acceptance. These checks can be completed independently.
- Issues #39 and #40 are complete; they are not blockers for the remaining manual checks.
- Issue #44 documents the actual shipped product and does not authorize creation of a native Android project.
- Issue #55 is a gradual visual track and should not be mixed into logic, reliability or documentation fixes.

## Android delivery status

The current delivery is the installable PWA on GitHub Pages. Capacitor dependencies and configuration exist, but the native Android platform folder is ignored/not committed and the Motion/Haptics plugins are not integrated into the active runtime. Native Android project generation is not an active roadmap deliverable. See ANDROID_ROADMAP.md for the conditional path if this becomes an explicit product decision.

## Working agreement

Work one issue at a time:

1. Re-check the current source and the issue's acceptance criteria.
2. Keep the implementation within the issue's approved scope.
3. Run the relevant TypeScript checks, tests and production build.
4. Review the changed UI at relevant viewport sizes and on a physical device when the acceptance criteria require it.
5. Merge only after review and required acceptance; close the issue and update this roadmap/master tracker only when its criteria are complete.
