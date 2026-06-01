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

## Next Candidate Experiments

- Rope threat: a simple event where a threat climbs the protection rope after a checkpoint is placed.
- Avalanche variant: an environment event that removes or downgrades a bounded set of non-Golden noise holds.
- Spatial scan playtest pass: compare readability with scan off, visual-only scan, and a temporary playable projection branch.
- Route template expansion: add named level templates with distinct event timing and hazard budgets.
