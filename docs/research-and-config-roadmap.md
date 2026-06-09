# The Solitary Apex Research And Config Roadmap

This document is the working index for prototype systems, tuning entry points, and validation commands.

## Validation Gates

Run the full gate before every commit:

```bash
npm run validate
```

Focused checks:

```bash
npm run validate:i18n
npm run validate:logic
npm run validate:levels
npm run validate:gameplay
npm run build
```

Readable level handoff report:

```bash
npm run report:levels
```

Engine structure report for choosing the next refactor slice:

```bash
npm run report:engine
```

## Primary Config Files

- `src/data/levelConfig.js`
  - Route authoring metadata, pressure rules, resource-pressure targets, generation seed, wall height, zone order, zone templates, hazard budgets, environment events, pursuit settings, rope-threat settings, rescue targets, and spatial-scan experiment values.
- `src/data/loadoutConfig.js`
  - Legacy balancing presets for starting item counts and small dyno / hold / thirst multipliers. Still used by validation and engine compatibility, but no longer exposed in the player HUD.
- `src/data/gameConfig.js`
  - Low-level movement, stamina, weather, injury, recovery, survival, and visual constants.
- `src/logic/analysis/levelAnalysis.js`
  - Shared generated-route analysis, target checks, Golden Path safety summaries, resource-pressure summaries, and event-density summaries used by runtime snapshots, the level editor, reports, and validators.
- `src/logic/engine/routeGeneration.js`
  - Seeded wall blueprint generation, Golden Path validation entry points, route segments, non-Golden Path hazard/resource placement, rescue targets, and lane blockers. `gameEngine.js` re-exports the stable public route API for existing callers.
- `src/logic/engine/weatherSystem.js`
  - Weather state initialization, wind vector updates, wind debug override, and wind-line tuning entry points used by the runtime engine and game hook.
- `src/logic/engine/environmentEvents.js`
  - Earthquake and avalanche event activation, noise-hold alteration, active-event timers, and event particle feedback.
- `src/logic/engine/encounterSystems.js`
  - Pursuit pressure, rope-threat checkpoint pressure, rescue burden timers, lane-blocker proximity pressure, and shared encounter-height calculations.
- `src/logic/engine/particleSystem.js`
  - Shared particle spawning and per-frame particle decay used by engine feedback, environmental events, and encounter pressure systems.
- `src/logic/engine/holdInteractions.js`
  - Fragile hold departure collapse, timed-soft hold loading, drillable obstacles, resource fruit collection, thirst pressure, and related hold-feedback particles.
- `src/logic/engine/itemSystem.js`
  - Starting inventory, item UI state, active item effects, channel items, checkpoint capture, and rescue-target item interactions.
- `src/logic/engine/fallRecoverySystem.js`
  - Fall and rope recovery state initialization, checkpoint fall entry, hanging recovery ticks, rescue-window bonuses, and checkpoint pose restore.
- `src/logic/engine/dynoSystem.js`
  - Dyno state initialization, charge availability, charge/reach ratios, begin/release/cancel actions, launch stamina cost, cooldown decay, and flight reset helpers.
- `src/logic/engine/dynoFlightSystem.js`
  - Dyno airborne motion, apex-to-auto-attach transition, landing target selection, auto-attach interpolation, landing hold validation, landing particles, and failed-landing balance resolution.
- `src/logic/engine/bodyStateSystem.js`
  - Rest-pose detection, hand-injury progression, bloodied-hold marking, and body velocity damping.
- `src/logic/engine/initialStateSystem.js`
  - Player, movement, condition, debug, feedback, item, route, spatial-scan, fall, and recovery state factories.
- `src/logic/engine/limbReachSystem.js`
  - Limb root projection, dynamic reach profiles, drag reach feedback, closest-hold lookup, attached-limb anchor sync, and landing target selection.
- `src/logic/engine/dragInteractionSystem.js`
  - Pointer updates, spatial-scan reach resync, limb drag start, drag-release hold snapping, grip particles, drag rejection feedback, and hanging recovery completion through reattachment.
- `src/logic/engine/attachmentSystem.js`
  - Hold availability, limb attachment release, attached-limb queries, checkpoint anchor lookup, and detached/suspended limb anchor updates shared across runtime systems.
- `src/logic/engine/feedbackSystem.js`
  - Drag rejection feedback, drag constraint snapshot clearing, and per-frame feedback countdown state shared by drag, fall, and game-over flows.
- `src/logic/engine/uiSnapshotSystem.js`
  - Runtime-to-UI snapshot assembly for stamina, route, recovery, fall, feedback, movement, condition, debug, level analysis, tutorial, and end-message fields.
- `src/logic/engine/staminaSystem.js`
  - Stamina clamping, stamina restoration, and per-frame climbing stamina delta from rest pose, hold penalties, bloodied holds, wind, injury, thirst, encounters, recovery, route modifiers, and active item effects.
- `src/logic/engine/climbingMotionSystem.js`
  - Attached/detached limb grouping, body velocity application, rest-pose and injury updates, effective climbing wind, center-of-mass sway, and detached-limb follow motion.
- `src/logic/engine/routeProgressSystem.js`
  - Closest Golden Path stance lookup, current route segment/zone state updates, height tracking, and camera follow.
- `src/data/uiText.js`
  - Five-language UI text bundles, language options, and render-time helpers for items, levels, and game-over text.
- `src/dev/dynoTuning.js`
  - Runtime dyno tuning fields and browser-local persistence for feel iteration.
- `src/dev/runDebugConfig.js`
  - Developer-only run preset, starting inventory overrides, and event-family toggles used for local debugging.
- `scripts/validate-i18n.mjs`
  - Verifies that all configured language bundles have the same text-key surface.
- `StartLocalTest.cmd` and `OpenOnlineTest.cmd`
  - Manual Windows test launchers for local fallback-port testing and online demo access.
- `docs/level-config-maintenance.md`
  - Field-by-field maintenance guide for tuning official level templates, reading reports, and validating before commits.
- `docs/level-editor-plan.md`
  - Proposed standalone level-config editor structure and data split.
- `docs/manual-smoke-checklist.md`
  - Short local and online smoke checklist for validation, launcher checks, UI language switching, DEV tooling, level-editor validation, and Pages deployment timing.

## Implemented Gameplay Prototypes

- Guaranteed Golden Path route generation with seeded reproducibility.
- Official level templates: prototype mixed ascent, resource reading, pursuit crux, and rescue encounter.
- Route zones: recovery, reading, exposure, crux.
- Runtime Dyno tuning panel.
- Developer-side run config controls for route preset, starting items, and event toggles.
- Bloodied regrip holds: hand strain can contaminate poorer holds, regripping them adds stamina pressure, and chalk mitigates the bloodied regrip penalty.
- Fragile holds: collapse after departure.
- Timed soft holds: collapse while loaded.
- Drillable obstacles: sustained limb drilling at stamina cost.
- Fruit resources and thirst pressure.
- Fruit-triggered sensory-flow overlay.
- Earthquake event: destabilizes decoy holds without touching Golden Path.
- Avalanche event: removes bounded decoy holds without touching Golden Path.
- Pursuit pressure line: creates upward tempo pressure without enemy AI.
- Pursuit catch: when the pursuit line reaches the player, the run ends with a pursuit-specific failure.
- Lane blockers: local enemy pressure markers without pathfinding AI.
- Rope threat: converts placed protection into a time-limited risk if left unattended.
- Spatial scan experiment: visual-only pseudo-3D projection for route-reading evaluation, with right-button 360-degree rotation while enabled.
- Rescue targets: use protection placements as a collaboration tool with temporary burden pressure and without NPC AI.
- Five-language UI switching: Simplified Chinese, English, Japanese, Spanish, and Brazilian Portuguese, with dictionary-key validation.
- Manual test launchers: double-click local dev testing with fallback ports and direct online demo opening.

## Current Design Boundaries

- Hazards should not be placed on the guaranteed Golden Path unless a validator proves the resulting route remains solvable.
- Spatial scan is visual-only. It must not change attachment, collision, stamina, or failure rules until a separate experiment proves that rotation improves route reading.
- Pursuit remains a pressure line, not a full enemy AI, until the readable route vocabulary is stronger.
- The player HUD should stay free of route type and strategy selectors.
- Legacy balancing presets affect starting items and movement/pressure multipliers only; they do not change level generation.
- Avalanche currently removes non-Golden Path decoy holds and adds visual pressure; it does not directly destabilize the player.
- Localization is UI-only. Gameplay state should keep stable IDs and translate at render time.
- Manual test commands should stay project-root launchers, while reusable patterns live in global skills.

## Overall R&D Todo

The current direction is to keep shipping small, validated mechanics while improving the config and tuning workflow enough that future level edits stay safe.

### P0 - Keep The Prototype Editable And Testable

These tasks are the top priority because every new mechanic increases route-config complexity.

- Developer workflow:
  - Current status: root launchers can start local manual testing with fallback ports and open the online demo.
  - Current status: reusable global skills now exist for web test launchers and 2/3/5-language web i18n.
  - Current status: `npm run validate:logic` runs the high-signal level and gameplay checks used between engine refactor slices.
  - Current status: `npm run report:engine` prints compact engine module size and export/import counts for choosing the next refactor slice.
  - Current status: shared visual-feedback helpers now live in `src/logic/engine/particleSystem.js`, reducing repeated helper code across engine modules.
  - Current status: inventory, item activation, active effects, channel items, checkpoint capture, and rescue-target item use now live in `src/logic/engine/itemSystem.js`.
  - Current status: fall entry, rope catch/hanging recovery, checkpoint pose restore, and recovery-window bonuses now live in `src/logic/engine/fallRecoverySystem.js`.
  - Current status: dyno state, charge availability, begin/release/cancel actions, launch cost, reach ratios, cooldown decay, and flight reset helpers now live in `src/logic/engine/dynoSystem.js`.
  - Current status: dyno airborne motion, auto-attach transitions, landing target selection, landing hold validation, and failed-landing balance resolution now live in `src/logic/engine/dynoFlightSystem.js`.
  - Current status: rest pose, hand injury, bloodied-hold marking, and body velocity damping now live in `src/logic/engine/bodyStateSystem.js`.
  - Current status: player, movement, condition, debug, feedback, item, route, spatial-scan, fall, and recovery state factories now live in `src/logic/engine/initialStateSystem.js`.
  - Current status: limb reach profiles, drag reach feedback, closest-hold lookup, attached-limb anchor sync, and landing target selection now live in `src/logic/engine/limbReachSystem.js`.
  - Current status: pointer updates, spatial-scan reach resync, limb drag start, drag-release hold snapping, grip particles, drag rejection feedback, and hanging recovery completion through reattachment now live in `src/logic/engine/dragInteractionSystem.js`.
  - Current status: hold availability, limb attachment release, attached-limb queries, checkpoint anchors, and detached/suspended limb updates now live in `src/logic/engine/attachmentSystem.js`.
  - Current status: drag rejection feedback, drag constraint snapshot clearing, and feedback countdown ticks now live in `src/logic/engine/feedbackSystem.js`.
  - Current status: runtime-to-UI snapshot assembly now lives in `src/logic/engine/uiSnapshotSystem.js`, with `gameEngine.js` preserving the public `getUiSnapshot` export.
  - Current status: stamina clamping, restoration, and per-frame climbing stamina delta now live in `src/logic/engine/staminaSystem.js`.
  - Current status: attached/detached limb grouping, body motion, rest-pose/injury refresh, climbing wind, and detached-limb follow motion now live in `src/logic/engine/climbingMotionSystem.js`.
  - Current status: closest Golden Path stance lookup, route state updates, height tracking, and camera follow now live in `src/logic/engine/routeProgressSystem.js`.
  - Current status: `docs/manual-smoke-checklist.md` now documents the local and online smoke pass.
  - Current status: the smoke checklist notes that Pages refreshes after the `main` push workflow finishes.
- Developer tuning panel:
  - Current status: the in-game `DEV` panel supports runtime Dyno tuning, local save, active-level authoring summary, route preset selection, starting inventory overrides, event toggles, run-config JSON import/export, `Copy config`, and `Copy level config`.
  - Current status: wind debug override and wind-line tuning now route through `src/logic/engine/weatherSystem.js`.
  - Current status: generated analysis values are shown next to target ranges for content counts, Golden Path safety, pressure, resource pressure, and event density.
  - Current status: `Copy level summary` exports a focused Markdown tuning handoff for the currently applied level.
  - Current status: a first-pass separate level-config screen now exists, opened from the `DEV` panel, with `Start / Route / Events / Validation` tabs and local draft JSON editing.
  - Next step: decide which parts of that screen should become true persistent authoring instead of local draft tooling.
  - Boundary: keep this as a developer tuning panel, not a player-facing UGC editor.
- Level config contract:
  - Current status: each level has authoring metadata, authored controls, randomized controls, content targets, pressure targets, resource-pressure targets, Golden Path rules, pressure rules, required validators, and a stable seed.
  - Current status: generated-route analysis and target validation now share `src/logic/analysis/levelAnalysis.js` across runtime snapshots, level-editor previews, reports, and validation scripts.
  - Current status: UI snapshots clone level-analysis data through `cloneLevelAnalysisSnapshot`, keeping new analysis fields out of ad hoc engine copy code.
  - Current status: seeded wall and route generation now lives in `src/logic/engine/routeGeneration.js`, while `gameEngine.js` keeps the runtime entry points and compatibility exports.
  - Current status: `npm run report:level -- <level-id>` prints a focused single-level tuning report for balancing one route at a time.
  - Next step: keep adding validators whenever a new route-affecting mechanic is added.
  - Boundary: Golden Path reachability remains authored and validated, not left to unconstrained randomness.
- Localization support:
  - Current status: HUD, item labels, tutorial text, game-over overlay, and DEV panel text render from five language bundles.
  - Current status: `validate:i18n` checks dictionary-key parity across `zh-CN`, `en`, `ja`, `es`, and `pt-BR`.
  - Next step: move any remaining player-visible strings out of config defaults if they begin appearing in UI.
  - Next step: add a lightweight browser smoke once Playwright or another browser runner is available in the environment.
  - Boundary: do not translate engine state by mutating IDs or gameplay config.
- Debug start-state support:
  - Current status: players no longer choose route type or strategy in the HUD.
  - Current status: official route presets, starting items, and event-family switches now belong to developer debugging.
  - Current status: run-debug presets support JSON import/export in the `DEV` panel.
  - Next step: decide whether a future player-facing pre-run choice should exist at all, and only reintroduce it with strong gameplay meaning.
- Random versus authored level content:
  - Keep authored: zone order, segment ranges, major event timing, pursuit timing, rope-threat timing, rescue target placement, lane blocker placement, target ranges, and validation rules.
  - Allow randomized within bounds: Golden Path drift, noise hold offsets, non-Golden Path hazard selection, fruit placement, wind phase, and visual particles.
  - Add randomness only when it has a corresponding report or validator.

### P1 - Next Small Gameplay Passes

These are good near-term implementation candidates because they extend existing systems without changing the four-limb control rhythm.

- Rescue routes:
  - Current status: rescue targets use protection placements and trigger temporary burden pressure.
  - Current status: level analysis now reports rescue start-state coverage against `protectionCam` counts and validates that the default loadout can cover configured rescue targets.
  - Next step: use the coverage summary to decide whether rescue routes should prefer the default start state or a dedicated future rescue start state.
  - Next step: tune rescue burden duration and stamina pressure against resource availability.
  - Recommended next small implementation: tune under-covered legacy loadouts only if those loadouts become player-facing again.
- Resource routing:
  - Current status: fruit restores stamina, relieves thirst, triggers sensory-flow visuals, and is checked by route-level density and maximum-gap validators.
  - Current status: resource fruit pickup and thirst pressure now live in `src/logic/engine/holdInteractions.js`.
  - Next step: test whether resource-reading levels need local scarcity rules, such as minimum fruit presence in route windows, optional detours, fruit corridors, or fruit decay.
  - Next step: design route-side acquisition for chalk, energy gel, and protection, such as exposed pickups, rescue rewards, obstacle caches, or post-crux rest ledges.
  - Boundary: do not turn fruit into inventory management until basic route reading proves it needs that depth.
- Encounter pressure:
  - Current status: pursuit line, lane blockers, and rope threat exist as constrained pressure systems.
  - Current status: pursuit, rope threat, rescue burden, and lane-blocker runtime pressure now live in `src/logic/engine/encounterSystems.js`.
  - Next step: tune spacing and readability before adding new enemy/NPC behavior.
  - Boundary: keep them as readable pressure markers until the player can parse route priorities under stress.
- Environmental hazards:
  - Current status: fragile holds, timed soft holds, drillable obstacles, earthquake, and avalanche are implemented and kept off Golden Path by validation.
  - Current status: fragile, timed-soft, and drillable-obstacle runtime interactions now live in `src/logic/engine/holdInteractions.js`.
  - Current status: earthquake and avalanche runtime activation now lives in `src/logic/engine/environmentEvents.js`.
  - Current status: wind now has route-wide directional flow-line visualization.
  - Next step: balance how often they appear together in the same local window.
  - Next step: decide whether avalanche should directly affect stability, visibility, or only route topology.
  - Boundary: any Golden Path hazard variant needs a specific solvability validator first.
- Bloodied holds:
  - Current status: hand strain can mark poor holds as bloodied, regripping them adds stamina pressure, and chalk mitigates but does not erase the penalty.
  - Next step: only extend if route design needs richer injury tactics, such as bandage items, sharp-hold clusters, or level-specific hand-risk pacing.

### P2 - Design Discussion Before Implementation

These ideas are attractive, but they can reshape the pacing or player mental model. Discuss and prototype separately before merging into the main loop.

- Official level configuration:
  - Discussion target: decide how many official route personalities are needed for the next playtest.
  - Suggested frame: each route should teach one pressure idea, reuse the same validator suite, and avoid bespoke one-off mechanics.
  - Boundary: random generation can vary local holds and hazards, but route identity, event timing, rescue/blocker placement, and target ranges should stay authored.
  - Recommendation: the next tooling step should be a dedicated level-config screen with tabs for start state, route, events, finish, and validation.
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
