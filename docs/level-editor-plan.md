# Level Editor Plan

This document turns the current developer-side `run config` controls into a concrete next step for a fuller level configuration workflow.

## Goal

Keep the player-facing game clean while giving designers a reliable place to author:

- route identity
- enabled event families
- starting inventory and debug start state
- pacing and encounter timing
- finish and failure conditions

The current in-game `DEV` panel should remain the lightweight "run debugger". The fuller editor should become a separate authoring surface.

## Editor Scope

Recommended first version:

1. Level list
   - level id
   - display label
   - template id
   - seed
   - wall height

2. Start state
   - starting items: chalk, protection, energy gel
   - start stamina
   - optional invincible/debug flags
   - enabled systems: earthquake, avalanche, pursuit, rope threat, rescue targets, lane blockers

3. Route pacing
   - zone sequence
   - per-zone span range
   - wind multiplier range
   - stamina modifier range
   - mechanic budgets per zone

4. Encounter timeline
   - environment event start frames and durations
   - pursuit start, rise duration, sustain duration, retreat behavior
   - rope-threat timing
   - rescue target placements
   - lane blocker placements

5. Win / fail contract
   - target wall height or finish marker
   - optional survival thresholds
   - whether a route is endless prototype mode or authored finish mode

6. Validation view
   - generated content counts
   - Golden Path safety
   - pressure summary
   - resource pressure summary
   - event density summary
   - validation errors and warnings

## Suggested Data Split

Keep three layers instead of one giant blob:

1. `level template`
   - stable authored config checked into `src/data/levelConfig.js`

2. `run debug config`
   - temporary per-test overrides such as starting items and event on/off toggles

3. `generated report`
   - read-only computed summary from validators and route generation

That split keeps production authoring clean while still letting us rapidly test unusual starts.

## Random Vs Authored

Keep authored:

- zone order
- major event timing
- pursuit timing and retreat profile
- rope-threat timing
- rescue target placement
- lane blocker placement
- finish conditions
- target ranges used by validation

Allow bounded randomness:

- Golden Path drift
- decoy hold offsets
- non-Golden-Path hazard selection
- fruit placement inside density rules
- wind phase and visual presentation

## UI Recommendation

Recommended layout for a future standalone config screen:

1. Left sidebar: level list and duplicate/create buttons
2. Main column tabs:
   - `Start`
   - `Route`
   - `Events`
   - `Finish`
   - `Validation`
3. Right rail:
   - live summary
   - copy JSON
   - import/export
   - quick launch into playtest

## Near-Term Implementation Path

Do this in order:

1. Keep the current `DEV` panel `run config` section for quick debugging.
2. Add export/import for run-config JSON.
3. Add a read-only validation summary block beside the current level summary.
4. Create a separate level-config screen that edits one official template at a time.
5. After the shared timeline tooling is stable, consider timeline drag editing or visual node placement tools.

Current implementation status:

- Done: `DEV` panel run-config section.
- Done: run-config JSON import/export.
- Done: read-only validation summary in the `DEV` panel.
- Done: first-pass separate level-config screen with `Start / Route / Events / Validation`.
- Done: partial direct field editing for safe high-value fields such as wall height, seed, zone sequence, zone budgets, event timings, pursuit timing, rope-threat timing, and rescue/blocker stance indices.
- Done: config-fragment export for draft handoff.
- Done: shared timeline overview in the `Events` tab, with frame-based sliders for scripted encounters and stance-based sliders for rescue/blocker markers.
- Not done yet: persistent file editing, full field coverage, timeline drag editing, node placement tools, and editor-side save flow.

## Practical Recommendation

For now, remove route type and strategy from the player HUD permanently. Treat them as developer-only concepts:

- route preset selection belongs in debug tooling
- starting inventory belongs in debug tooling
- event enable/disable belongs in debug tooling

If the game later needs player-facing pre-run choice again, it should come back as a clearly motivated system, not as a generic test selector row.
