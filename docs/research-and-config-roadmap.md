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

Readable level handoff report:

```bash
npm run report:levels
```

## Primary Config Files

- `src/data/levelConfig.js`
  - Route authoring metadata, pressure rules, resource-pressure targets, generation seed, wall height, zone order, zone templates, hazard budgets, environment events, pursuit settings, rope-threat settings, rescue targets, and spatial-scan experiment values.
- `src/data/loadoutConfig.js`
  - Pre-run loadouts, starting item counts, and small multipliers for dyno, poor-hold pressure, and thirst pressure.
- `src/data/gameConfig.js`
  - Low-level movement, stamina, weather, injury, recovery, survival, and visual constants.
- `src/dev/dynoTuning.js`
  - Runtime dyno tuning fields and browser-local persistence for feel iteration.
- `docs/level-config-maintenance.md`
  - Field-by-field maintenance guide for tuning official level templates, reading reports, and validating before commits.

## Implemented Gameplay Prototypes

- Guaranteed Golden Path route generation with seeded reproducibility.
- Selectable official level templates: prototype mixed ascent, resource reading, pursuit crux, and rescue encounter.
- Route zones: recovery, reading, exposure, crux.
- Runtime Dyno tuning panel.
- Selectable loadouts: steady, bold dyno, technical.
- Bloodied regrip holds: hand strain can contaminate poorer holds, and regripping them adds stamina pressure.
- Fragile holds: collapse after departure.
- Timed soft holds: collapse while loaded.
- Drillable obstacles: sustained limb drilling at stamina cost.
- Fruit resources and thirst pressure.
- Fruit-triggered sensory-flow overlay.
- Earthquake event: destabilizes decoy holds without touching Golden Path.
- Avalanche event: removes bounded decoy holds without touching Golden Path.
- Pursuit pressure line: creates upward tempo pressure without enemy AI.
- Lane blockers: local enemy pressure markers without pathfinding AI.
- Rope threat: converts placed protection into a time-limited risk if left unattended.
- Spatial scan experiment: visual-only pseudo-3D projection for route-reading evaluation.
- Rescue targets: use protection placements as a collaboration tool with temporary burden pressure and without NPC AI.

## Current Design Boundaries

- Hazards should not be placed on the guaranteed Golden Path unless a validator proves the resulting route remains solvable.
- Spatial scan is visual-only. It must not change attachment, collision, stamina, or failure rules until a separate experiment proves that rotation improves route reading.
- Pursuit remains a pressure line, not a full enemy AI, until the readable route vocabulary is stronger.
- Loadouts stay intentionally small. They should create a run identity without turning the game into an equipment menu.

## Overall R&D Todo

### P0 - Config And Tooling Backbone

These tasks keep the prototype editable as mechanics accumulate.

- Expand `levelConfig` into a clearer authoring contract:
  - Current status: each level now includes `authoring.templateId`, intended pace, authored controls, randomized controls, content targets, pressure targets, pressure rules, and required validators.
  - Current status: four named level templates now cover mixed prototype, resource reading, pursuit crux, and rescue encounter pacing.
  - Next step: add per-template target ranges for expected stamina pressure and resource recovery.
  - Keep Golden Path reachability authored/validated rather than purely random.
- Add stronger validation around route pacing:
  - Current status: `validate:levels` checks generated content counts against per-template `authoring.contentTargets`.
  - Current status: `validate:levels` checks weighted route pressure against per-template `authoring.pressureTargets`.
  - Current status: `validate:levels` checks resource-pressure recovery against per-template `authoring.resourcePressureTargets`, including fruit stamina recovery, thirst relief, worst-loadout thirst gain, and worst-loadout net relief.
  - Current status: `validate:levels` checks Golden Path hazard isolation against per-template `authoring.goldenPathRules`, so fragile, timed soft, obstacle, resource, rescue, and blocker markers do not land on authored main-route holds.
  - Current status: `validate:levels` checks environment-event count, spacing, major encounter density, wider pressure-event windows, resource-fruit window density, and maximum resource gap through `authoring.pressureRules`.
  - Current status: `validate:levels` prints a compact per-template pressure summary covering event types, rescue targets, pursuit, rope-threat usage, Golden Path safety, wind, stamina, hazard density, resource density, resource recovery, event density, resource gap, and major encounter timeline.
  - Current status: `report:levels` prints the same analysis as a Markdown table for tuning handoff, with dedicated Golden Path, resource-pressure, and event-density columns.
- Generalize the current Dyno `DEV` panel into a small developer tuning panel:
  - Current status: the `DEV` panel includes runtime Dyno sliders and an active-level authoring summary.
  - Current status: `Copy config` exports Dyno values, while `Copy level config` exports the active level snippet.
  - Avoid turning it into a full UGC editor until official level config is stable.

### P1 - Next Small Gameplay Experiments

These are the best next implementation candidates because they extend existing systems without changing the whole control model.

- Extend resource routing only if route design needs richer local scarcity tactics, such as required detours, fruit decay, or level-specific resource corridors.
- Extend bloodied holds only if route design needs richer hand-injury tactics, such as bandage items, chalk mitigation, or level-specific sharp-hold clusters.

### P2 - Systems That Need Design Discussion First

These are valuable, but they can easily distort the core rhythm if implemented too early.

- Pseudo-3D rotation:
  - Current implementation is visual-only spatial scan.
  - Before gameplay rotation, run a separate prototype branch comparing scan off, visual scan, and playable projection.
  - Decision criteria: can players predict the benefit, does it make route reading richer, and does it preserve four-limb drag clarity.
- Enemy/NPC behavior:
  - Current pursuit is a pressure line, not AI.
  - Current lane blockers and protection-rope threats cover constrained encounter prototypes first.
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
