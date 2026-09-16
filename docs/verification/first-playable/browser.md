# Browser verification — 2026-09-17

Implementation unit 2, based on db10a9e1363752f74fb90098abbd4ae4c5d79fa9.

PASS (installed Google Chrome, Playwright): setup; keyboard movement; canvas target
input; pause freezes time; 3-second resume; collision result; persisted local record;
swapped-layout persistence; portrait start blocker; failed required chart load retry.
Evidence: setup.png, playing.png, result.png, portrait.png and e2e/play.spec.mjs.

Failures preserved: first browser pass found an oversized menu asset, a Phaser
texture inserted before renderer initialization (`batchUnit` null), and asynchronous
image completion overwriting LOAD FAILED. Fixed image sizing, moved texture creation
to Scene.create, and prevented progress writes after failure. Re-run: 3/3 passed.

PASS: TypeScript + Vite production build, 23 rule tests. Updated Vitest to 4.1.11;
`npm install` reports zero vulnerabilities. Phaser 4.2.1 runtime.

Remaining verification in the next unit: touch emulation, four-zone rendering,
production/offline smoke and storage hardening. Physical iOS/Android devices and
hardware 60fps are not claimed verified. Final music and remaining character state
art are explicitly outside the first-playable contract.
