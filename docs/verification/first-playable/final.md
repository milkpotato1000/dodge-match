# First playable verification — 2026-09-17

Baseline plan: db10a9e1363752f74fb90098abbd4ae4c5d79fa9.
Environment: macOS, Node 24.15.0, TypeScript, Vite 7.3.6, Phaser 4.2.1,
Vitest 4.1.11, Playwright using installed Google Chrome.

## Executed checks

- PASS: `npm test` — 27 tests across core and storage.
- PASS: `npm run build` — TypeScript validation and production bundle.
- PASS: five development-browser scenarios (`e2e/play.spec.mjs`): actual keyboard
  and pointer inputs, pause/resume, collision result and storage after reload;
  swapped order and portrait blocking; required preload failure/retry;
  simultaneous emulated touch input; four-zone scene and split timers.
- PASS: production scenario (`e2e/production.spec.mjs`): first online load, required
  asset cache installation, fully offline reload and actual game start. Production
  contains no development diagnostic interface.
- PASS: dependency install audit reports zero vulnerabilities.
- PASS: contract guard worktree, index and committed baseline checks performed
  during delivery; protected planning contracts remain unchanged.

## Evidence and scope

`setup.png`, `playing.png`, `mobile.png`, `four-zone.png`, `result.png`,
`portrait.png`, `offline.png` are actual Chrome captures. The four-zone screenshot
uses a collision-free accelerated fixture; it is not a human survival achievement.
Automated 180-second completion also deliberately removes hazards to isolate
chart, scoring and termination. Collision/reflection are covered separately.

Core tests cover AC-06/07/08/09/10/11/13/14/17/20/23/28/29 mechanisms;
browser tests exercise AC-01/02/03/04/15/18 and required-load failure from AC-25.
This is evidence for those specific assertions, not blanket sign-off on all
29 acceptance criteria. UI renders the v2 dog, baseballs and matching zone glyphs;
remaining state artwork and final soundtrack are outside first-playable scope.

## Failures and fixes retained

- Initial menu image sizing and early Phaser texture creation prevented usable
  startup; corrected sizing and Scene.create texture registration. See browser.md
  and failure-texture.png. Re-run passed.
- Concurrent successful image loads replaced LOAD FAILED text; progress callbacks
  now stop updating UI after failure. Re-run passed.
- Initial Vitest discovery also collected Playwright specs; explicit unit-test
  include separates suites. Re-run passed.
- Initial offline reload missed cached cross-origin-mode JS/CSS despite same-origin
  URLs because the preview server emits Vary: Origin. Same-origin static cache
  fallback uses ignoreVary, with built JS/CSS precached at install. Offline test passed.
- Initial mobile D-pad shrank with canvas scaling; it now uses a fixed 112 CSS-pixel
  group, 44 CSS-pixel arms and 16-pixel outer inset. Touch emulation re-run passed.
- Restored pre-existing environment-file ignore rules alongside runtime ignores.

## Practical limits

Real iOS Safari/Android hardware, accessibility screen-reader gameplay, sustained
60fps on low-end hardware, PWA home-screen installation, and final audio/artwork
are not certified by these tests. Music is a 120 BPM generated test click. Local
scores are client-side browser data. The production bundle includes Phaser and
Vite reports the expected >500 kB chunk-size advisory (about 383 kB gzip).
