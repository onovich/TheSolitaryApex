# The Solitary Apex Research And Config Roadmap

This document is the working index for prototype systems, tuning entry points, and validation commands.

## Validation Gates

Run the full gate before every commit:

```bash
npm run validate
```

Focused checks:

```bash
npm run validate:levels
npm run validate:gameplay
npm run build
```

## Primary Config Files

- `src/data/levelConfig.js`
  - Route generation seed, wall height, zone order, zone templates, hazard budgets, environment events, pursuit settings, and spatial-scan experiment values.
- `src/data/loadoutConfig.js`
  - Pre-run loadouts, starting item counts, and small multipliers for dyno, poor-hold pressure, and thirst pressure.
- `src/data/gameConfig.js`
  - Low-level movement, stamina, weather, injury, recovery, survival, and visual constants.
- `src/dev/dynoTuning.js`
  - Runtime dyno tuning fields and browser-local persistence for feel iteration.

## Implemented Gameplay Prototypes

- Guaranteed Golden Path route generation with seeded reproducibility.
- Route zones: recovery, reading, exposure, crux.
- Runtime Dyno tuning panel.
- Selectable loadouts: steady, bold dyno, technical.
- Fragile holds: collapse after departure.
- Timed soft holds: collapse while loaded.
- Drillable obstacles: sustained limb drilling at stamina cost.
- Fruit resources and thirst pressure.
- Fruit-triggered sensory-flow overlay.
- Earthquake event: destabilizes decoy holds without touching Golden Path.
- Pursuit pressure line: creates upward tempo pressure without enemy AI.
- Spatial scan experiment: visual-only pseudo-3D projection for route-reading evaluation.
- Rescue targets: use protection placements as a collaboration tool without NPC AI.

## Current Design Boundaries

- Hazards should not be placed on the guaranteed Golden Path unless a validator proves the resulting route remains solvable.
- Spatial scan is visual-only. It must not change attachment, collision, stamina, or failure rules until a separate experiment proves that rotation improves route reading.
- Pursuit remains a pressure line, not a full enemy AI, until the readable route vocabulary is stronger.
- Loadouts stay intentionally small. They should create a run identity without turning the game into an equipment menu.

## Overall R&D Todo

### P0 - Config And Tooling Backbone

These tasks keep the prototype editable as mechanics accumulate.

- Expand `levelConfig` into a clearer authoring contract:
  - Named level templates with intended pace, route length, event timing, hazard budget, resource budget, and required validators.
  - Explicit split between authored values and randomized values.
  - Keep Golden Path reachability authored/validated rather than purely random.
- Add stronger validation around route pacing:
  - Event-density checks so earthquake, pursuit, rescue, fruit, and future rope threats do not stack into unreadable noise.
  - Resource-pressure checks so thirst, stamina, fruit, and loadout penalties stay recoverable.
  - Hazard-isolation checks so fragile, timed soft, drillable obstacle, and avalanche variants stay off the Golden Path unless a dedicated validator allows them.
- Generalize the current Dyno `DEV` panel into a small developer tuning panel:
  - Keep runtime sliders for high-risk feel values.
  - Add one-click copy/export snippets for formal config files.
  - Avoid turning it into a full UGC editor until official level config is stable.

### P1 - Next Small Gameplay Experiments

These are the best next implementation candidates because they extend existing systems without changing the whole control model.

- Rope threat prototype:
  - A simple threat starts only after a protection checkpoint exists.
  - It climbs along the protection rope over time.
  - Near danger range it creates HUD warning and stamina pressure.
  - If it reaches the anchor, it damages or disables the current protection point.
  - Config should live in `levelConfig`, with gameplay regression coverage.
- Avalanche variant:
  - Environment event that removes, downgrades, or temporarily hides a bounded set of non-Golden noise holds.
  - It should read as route re-evaluation pressure, not random punishment.
  - First pass should share the environment-event pipeline used by earthquake.
- Route template expansion:
  - Add several named official route templates rather than just increasing random variety.
  - Suggested first set: tutorial-safe, resource-reading, exposure-pressure, pursuit-crux, rescue-encounter.
  - Each template should declare allowed mechanics and forbidden mechanics.
- Rescue target second pass:
  - Test whether rescue should become a sustained burden after attaching protection, or remain a one-click semantic conversion.
  - If adding burden, start with a temporary stamina/weight pressure rather than full NPC AI.

### P2 - Systems That Need Design Discussion First

These are valuable, but they can easily distort the core rhythm if implemented too early.

- Pseudo-3D rotation:
  - Current implementation is visual-only spatial scan.
  - Before gameplay rotation, run a separate prototype branch comparing scan off, visual scan, and playable projection.
  - Decision criteria: can players predict the benefit, does it make route reading richer, and does it preserve four-limb drag clarity.
- Enemy/NPC behavior:
  - Current pursuit is a pressure line, not AI.
  - Prefer constrained encounter types first: lane blocker, protection-rope threat, or protected-route denial.
  - Full pathfinding enemies should wait until route vocabulary and feedback are clearer.
- Climbing shoes:
  - Not urgent while holds remain broad abstract categories.
  - Reconsider when the game has clearer friction points, foot-specific holds, smears, edges, dynamic holds, or surface types.
  - If tested, make shoes part of small loadout choices, not a separate equipment RPG.
- Pre-run strategy:
  - Keep the current loadout model as the baseline.
  - Future choices should be few, readable, and tied to route plans: safe rack, dyno route, technical poor-hold route, rescue support.

### P3 - Later Packaging And Larger Scope

These should wait until the core route language is stronger.

- Four-legged creature world framing:
  - Useful for explaining independent limb control, lifelong ascent, resource hunger/thirst, and non-human ecology.
  - Keep current climbing language in short-term UI until mechanics settle.
- UGC route editor:
  - Not a near-term goal.
  - It requires editor UI, solvability validation, share format, moderation, and content discovery.
  - A better middle step is developer route config plus seed reproduction and validation.
- Full NPC collaboration:
  - Start from rescue targets and temporary burden systems.
  - Full cooperative AI should wait until rescue, protection, and encounter rules are stable.
