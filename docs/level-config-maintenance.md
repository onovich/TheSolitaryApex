# Level Config Maintenance Guide

This guide is the practical handoff for maintaining official route templates in `src/data/levelConfig.js`.

## Edit Order

When tuning or adding a level, work in this order:

1. Pick the level personality.
   - `authoring.templateId`
   - `authoring.intendedPace`
   - `wallHeight`
   - `seed`

2. Shape the route.
   - `routeGeneration.zoneSequence`
   - `routeGeneration.zones.*.segmentSpanMin`
   - `routeGeneration.zones.*.segmentSpanMax`
   - `routeGeneration.zones.*.routeHoldTypes`
   - `routeGeneration.zones.*.noiseHoldTypes`
   - `routeGeneration.zones.*.windMultiplier`
   - `routeGeneration.zones.*.staminaModifier`

3. Place authored pressure.
   - `environmentEvents`
   - `pursuit`
   - `ropeThreat`
   - `rescueTargets`
   - `laneBlockers`

4. Tune randomized content budgets.
   - `routeGeneration.zones.*.mechanicBudget.fragile`
   - `routeGeneration.zones.*.mechanicBudget.timedSoft`
   - `routeGeneration.zones.*.mechanicBudget.obstacle`
   - `routeGeneration.zones.*.mechanicBudget.resource`

5. Update the validation targets.
   - `authoring.contentTargets`
   - `authoring.pressureTargets`
   - `authoring.resourcePressureTargets`
   - `authoring.goldenPathRules`
   - `authoring.pressureRules`

## What Each Target Means

`contentTargets` validates generated mechanic counts. Use it to keep a route from silently changing from sparse to noisy after budget edits.

`pressureTargets` validates broad route feel:

- `averageWindMultiplier`: weighted average wind pressure across route segments.
- `averageStaminaModifier`: weighted average segment stamina modifier.
- `hazardPer100Stances`: fragile, timed soft, and obstacle density.
- `resourcePer100Stances`: fruit density.

`resourcePressureTargets` validates whole-route recovery pressure:

- `staminaRecoveryPer100Stances`: fruit stamina recovery density.
- `thirstReliefPer100Stances`: fruit thirst relief density.
- `worstLoadoutThirstGain`: thirst gain for the harshest balancing preset over the route estimate.
- `worstLoadoutNetThirstRelief`: fruit relief minus the harshest preset's estimated thirst gain.

`goldenPathRules` protects the authored main route. Hazard and encounter markers should stay off `routeRole: "golden"` unless a future validator explicitly proves that variant remains solvable.

`pressureRules` validates timing and local density:

- `minEnvironmentEventSpacingFrames`: minimum separation after one environment event ends before the next starts.
- `maxEnvironmentEvents`: hard cap for environment events.
- `majorEncounterWindowFrames` and `maxMajorEncountersPerWindow`: density check for environment events, pursuit, rescues, and lane blockers.
- `pressureEventWindowFrames` and `maxPressureEventsPerWindow`: broader pressure check that also includes protection-rope threat readiness.
- `resourceWindowFrames` and `maxResourceFruitsPerWindow`: local cap for fruit clusters.
- `maxResourceGapFrames`: maximum route time without a fruit, including start-to-first-fruit and last-fruit-to-route-end.

## Random Versus Authored

Keep these authored or validated:

- Golden Path reachability.
- Zone order and segment length ranges.
- First appearance and spacing of major pressure events.
- Rescue target placement.
- Lane blocker placement.
- Pursuit and rope threat timing.
- Content, pressure, resource, event density, and Golden Path safety targets.

Allow these to vary within configured bounds:

- Golden Path horizontal drift.
- Noise hold offsets.
- Noise hold type selection.
- Eligible hazard selection on non-Golden Path holds.
- Fruit placement inside the configured budget and density rules.
- Wind phase and visual particles.

## Tuning Workflow

After editing `src/data/levelConfig.js`, run:

```bash
npm run report:levels
```

Use the report to inspect:

- `Content`: actual generated mechanic counts.
- `Golden Path`: blocked hazard count must stay `0`.
- `Pressure`: weighted wind, stamina, hazard density, and resource density.
- `Resource Pressure`: fruit stamina, thirst relief, harshest-preset thirst gain, and net relief.
- `Event Density`: pressure-event peak, fruit cluster peak, and maximum fruit gap.
- `Targets`: the configured ranges currently used by validation.

Then run:

```bash
npm run validate
```

Commit only after the full gate passes.

## DEV Panel

The in-game `DEV` panel shows the active level's authoring summary and target ranges. Use the `Run config` block there to pick a route preset, override starting inventory, and toggle event families for debugging. Use `Copy level config` to export the current level snippet for the selected preset.

Dyno feel tuning is separate. Use the Dyno controls in the same panel, then `Copy config` to export values for `src/data/gameConfig.js`.

The dedicated level editor now goes one step further than the `DEV` panel: its `Events` tab includes a shared frame ruler so environment events, pursuit, rope threat, rescue targets, and lane blockers can be tuned against one visible pacing timeline before falling back to raw JSON edits.

For the broader standalone authoring direction beyond this lightweight debug flow, see `docs/level-editor-plan.md`.
