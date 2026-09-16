# Core rules verification — 2026-09-17

Baseline: db10a9e1363752f74fb90098abbd4ae4c5d79fa9. Implementation unit 1.

PASS: `npm test` — 23 assertions/tests covering inclusive timing boundaries,
151-target chart/41,575 max score, health and independent combos, normalized movement,
swept collision, corner reflection and frame subdivision, hairline hysteresis,
50.300-second synchronized timers and single-zone penalty, continuous fade,
seed replay, forbidden hold/touch, and an accelerated 180-second chart.
PASS: `npx tsc --noEmit`.

The full-chart fixture removes hazards deliberately to isolate chart completion;
it does not claim a human survival run, visual QA, or real-device multitouch verification.
