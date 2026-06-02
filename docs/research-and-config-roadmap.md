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
- Selectable loadouts: steady, bold dyno, technical, rescue support.
- Bloodied regrip holds: hand strain can contaminate poorer holds, regripping them adds stamina pressure, and chalk mitigates the bloodied regrip penalty.
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

The current direction is to keep shipping small, validated mechanics while improving the config and tuning workflow enough that future level edits stay safe.

### P0 - Keep The Prototype Editable

These tasks are the top priority because every new mechanic increases route-config complexity.

- Developer tuning panel:
  - Current status: the in-game `DEV` panel supports runtime Dyno tuning, local save, active-level authoring summary, `Copy config`, and `Copy level config`.
  - Next step: show actual generated analysis values next to target ranges, especially content counts, Golden Path safety, pressure, resource pressure, and event density.
  - Next step: add focused copy/export actions for tuning handoff, such as copied level report summary or copied target deltas.
  - Boundary: keep this as a developer tuning panel, not a player-facing UGC editor.
- Level config contract:
  - Current status: each level has authoring metadata, authored controls, randomized controls, content targets, pressure targets, resource-pressure targets, Golden Path rules, pressure rules, required validators, and a stable seed.
  - Next step: keep adding validators whenever a new route-affecting mechanic is added.
  - Next step: make report output easier to scan when balancing one level at a time.
  - Boundary: Golden Path reachability remains authored and validated, not left to unconstrained randomness.
- Loadout config support:
  - Current status: loadouts are selectable and schema-validated.
  - Next step: add report/validation output that summarizes each loadout's starting items and key pressure multipliers.
  - Next step: validate that route templates remain reasonable under the harshest relevant loadout.
- Random versus authored level content:
  - Keep authored: zone order, segment ranges, major event timing, pursuit timing, rope-threat timing, rescue target placement, lane blocker placement, target ranges, and validation rules.
  - Allow randomized within bounds: Golden Path drift, noise hold offsets, non-Golden Path hazard selection, fruit placement, wind phase, and visual particles.
  - Add randomness only when it has a corresponding report or validator.

### P1 - Next Small Gameplay Passes

These are good near-term implementation candidates because they extend existing systems without changing the four-limb control rhythm.

- Resource routing:
  - Current status: fruit restores stamina, relieves thirst, triggers sensory-flow visuals, and is checked by route-level density and maximum-gap validators.
  - Next step: test whether resource-reading levels need local scarcity rules, such as minimum fruit presence in route windows, optional detours, fruit corridors, or fruit decay.
  - Boundary: do not turn fruit into inventory management until basic route reading proves it needs that depth.
- Bloodied holds:
  - Current status: hand strain can mark poor holds as bloodied, regripping them adds stamina pressure, and chalk mitigates but does not erase the penalty.
  - Next step: only extend if route design needs richer injury tactics, such as bandage items, sharp-hold clusters, or level-specific hand-risk pacing.
- Rescue routes:
  - Current status: rescue targets use protection placements, trigger temporary burden pressure, and have a rescue-support loadout.
  - Next step: validate whether rescue-support can handle configured rescue-route goals without trivializing general routes.
  - Next step: tune rescue burden duration and stamina pressure against resource availability.
- Encounter pressure:
  - Current status: pursuit line, lane blockers, and rope threat exist as constrained pressure systems.
  - Next step: tune spacing and readability before adding new enemy/NPC behavior.
  - Boundary: keep them as readable pressure markers until the player can parse route priorities under stress.
- Environmental hazards:
  - Current status: fragile holds, timed soft holds, drillable obstacles, earthquake, and avalanche are implemented and kept off Golden Path by validation.
  - Next step: balance how often they appear together in the same local window.
  - Boundary: any Golden Path hazard variant needs a specific solvability validator first.

### P2 - Design Discussion Before Implementation

These ideas are attractive, but they can reshape the pacing or player mental model. Discuss and prototype separately before merging into the main loop.

- Pre-run strategy:
  - Baseline: keep the current small loadout model.
  - Current coverage: safe rack, bold dyno, technical poor-hold efficiency, and rescue support.
  - Discussion target: decide whether pre-run strategy should be "choose a route plan" or "assemble a kit".
  - Recommendation: route-plan loadouts are safer than a broad equipment system at this stage.
- Climbing shoes:
  - Current judgment: low urgency while holds are broad abstract categories.
  - Revisit when foot-specific mechanics exist, such as smears, edges, friction surfaces, wet/icy holds, or dynamic footholds.
  - If added, keep shoes as one small loadout identity rather than a separate RPG layer.
- Pseudo-3D rotation:
  - Current status: spatial scan is visual-only.
  - Required before gameplay rotation: a separate branch comparing scan off, visual scan, and playable projection.
  - Decision criteria: route reading must become clearer, four-limb dragging must remain predictable, and climbing tempo must not collapse into camera management.
  - Boundary: no attachment, collision, stamina, or failure-rule changes until this experiment proves value.
- NPC collaboration:
  - Current safe version: rescue targets plus temporary burden.
  - Discussion target: decide whether collaborators are route objectives, moving helpers, or narrative pressure.
  - Boundary: full cooperative AI should wait until rescue, protection, and encounter rules are stable.
- Enemies and pursuit:
  - Current safe version: pursuit line, lane blockers, and rope-threat pressure.
  - Discussion target: decide whether enemies are timing pressure, spatial blockers, or route-reading disruption.
  - Boundary: avoid full pathfinding enemies until feedback and route vocabulary are stronger.

### P3 - Later Scope And Packaging

These are useful long-term ideas, but they should wait until the core route language and validation pipeline are stronger.

- Four-legged creature world framing:
  - Useful for explaining independent limb control, lifelong ascent, hunger/thirst, non-human ecology, and rescue/collaboration.
  - Keep UI language mechanically clear until the game identity is ready for a stronger fiction pass.
- UGC route editor:
  - Not a near-term goal.
  - It requires editor UI, solvability validation, share format, moderation, content discovery, and player-facing error handling.
  - Better middle step: developer route config, seed reproduction, report output, and strong validators.
- Full official level pipeline:
  - Current direction: ship a small set of official templates first.
  - Next step after P0/P1 maturity: define how many route personalities the prototype should support and what each one teaches.
  - Boundary: do not scale content count faster than validation and tuning visibility.
