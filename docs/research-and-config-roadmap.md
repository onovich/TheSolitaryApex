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
npm run report:engine:top
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
  - Seeded wall generation wrapper, Golden Path validation entry point, retry handling, and stable public route API re-exported by `gameEngine.js`.
- `src/logic/engine/routeBlueprintGeneration.js`
  - Final wall-blueprint assembly from spawn holds, Golden Path stances, randomized content, authored rescue targets, lane blockers, and level metadata.
- `src/logic/engine/routePathGeneration.js`
- `src/logic/engine/routeSpawnHoldGeneration.js`
- `src/logic/engine/routeGoldenStanceGeneration.js`
- `src/logic/engine/routeGoldenPathGeneration.js`
  - Spawn holds, Golden Path stance creation, and Golden Path scaffold generation used by route assembly, with `routePathGeneration.js` preserving stable facade exports.
- `src/logic/engine/routeSegmentGeneration.js`
  - Route segment creation and stance-to-segment lookup used by route assembly and progress tracking.
- `src/logic/engine/routeContentGeneration.js`
  - Non-Golden Path noise hold placement for route content.
- `src/logic/engine/routeContentMetadata.js`
  - Randomized hazard/resource metadata selection for route content noise holds.
- `src/logic/engine/routeContentHazardMetadata.js`
  - Hazard/resource metadata factory functions for fragile holds, timed-soft holds, obstacles, and resource fruit.
- `src/logic/engine/routeAuthoredContentGeneration.js`
  - Authored rescue target and lane blocker hold creation from level-config stance placements.
- `src/logic/engine/routeGenerationPrimitives.js`
  - Stable route-generation primitive facade for random helpers, hold creation, and corridor clamping.
- `src/logic/engine/routeRandomSystem.js`
  - Seeded-random generation, injectable random source scoping, random range/int helpers, hold-type picking, and numeric clamping.
- `src/logic/engine/routeHoldFactorySystem.js`
  - Route hold object creation, hold radius lookup, and route corridor X clamping.
- `src/logic/engine/weatherSystem.js`
  - Weather state initialization, natural wind target updates, smoothing, and derived wind synchronization used by the runtime engine.
- `src/logic/engine/weatherDebugOverrideSystem.js`
  - Wind debug override clamping, angle normalization, target-vector application, and immediate derived-state synchronization.
- `src/logic/engine/windVectorSystem.js`
  - Wind angle normalization, polar vector conversion, derived wind state synchronization, and scaled wind-vector snapshots shared by weather and movement systems.
- `src/logic/engine/windLineDebugSystem.js`
  - Wind-line debug tuning initialization and patch application for the developer tuning panel.
- `src/logic/engine/environmentEventActivationSystem.js`
  - Environment event activation dispatch by configured event type.
- `src/logic/engine/environmentEventCandidateSystem.js`
  - Shared alterable noise-hold selection and randomized event candidate picking.
- `src/logic/engine/earthquakeEventActivationSystem.js`
  - Earthquake fragile-hold mutation and earthquake feedback particles.
- `src/logic/engine/avalancheEventActivationSystem.js`
  - Avalanche noise-hold removal, debris marking, and avalanche feedback particles.
- `src/logic/engine/environmentEvents.js`
  - Environment event scheduling, active-event timers, triggered-event tracking, and activation dispatch.
- `src/logic/engine/encounterSystems.js`
  - Encounter pressure orchestration for pursuit, rope threat, rescue burden, and lane-blocker pressure ticks.
- `src/logic/engine/rescueBurdenSystem.js`
  - Rescue burden activation and countdown clearing after protected rescue targets.
- `src/logic/engine/laneBlockerPressureSystem.js`
  - Lane-blocker proximity scanning and active stamina-pressure state updates.
- `src/logic/engine/pursuitSystem.js`
  - Stable pursuit ticking facade for phase progression, danger updates, and catch resolution.
- `src/logic/engine/pursuitPhaseSystem.js`
  - Stable pursuit-phase facade for trigger gating and rising/retreating phase dispatch.
- `src/logic/engine/pursuitPhaseMotionSystem.js`
  - Rising and retreating pursuit threat-height progression.
- `src/logic/engine/pursuitPhaseStateSystem.js`
  - Pursuit trigger and completion state transitions.
- `src/logic/engine/pursuitCatchSystem.js`
  - Pursuit catch failure routing, invincible pursuit stabilization, and pursuit danger gap updates.
- `src/logic/engine/pursuitHeightSystem.js`
  - Shared current-height calculation for pursuit pressure and route progress.
- `src/logic/engine/ropeThreatSystem.js`
  - Rope-threat delayed checkpoint pressure ticking and progress/danger threshold dispatch.
- `src/logic/engine/ropeThreatStateSystem.js`
  - Rope-threat reset, arming, checkpoint break cleanup, and break feedback particles.
- `src/logic/engine/particleSystem.js`
  - Shared particle spawning and per-frame particle decay used by engine feedback, environmental events, and encounter pressure systems.
- `src/logic/engine/holdInteractions.js`
  - Compatibility facade for hold interaction ticks used by frame updates and attachment release.
- `src/logic/engine/fragileHoldSystem.js`
  - Fragile hold departure collapse and departure feedback particles.
- `src/logic/engine/timedSoftHoldSystem.js`
  - Timed-soft hold loading, collapse, forced detachment, and balance-failure routing.
- `src/logic/engine/obstacleDrillingSystem.js`
  - Drillable-obstacle runtime tick orchestration and stamina-failure routing.
- `src/logic/engine/obstacleDrillingTargetSystem.js`
  - Drillable-obstacle rule lookup, closest-target selection, and inactive obstacle reset.
- `src/logic/engine/obstacleDrillingProgressSystem.js`
  - Sustained drilling progress, stamina cost, obstacle destruction, and drilling feedback particles.
- `src/logic/engine/survivalResourceSystem.js`
  - Survival/resource compatibility facade for frame-update imports.
- `src/logic/engine/survivalPressureSystem.js`
  - Thirst pressure ticking and sensory-flow countdown.
- `src/logic/engine/resourceFruitSystem.js`
  - Resource fruit collection tick orchestration.
- `src/logic/engine/resourceFruitTargetSystem.js`
  - Resource fruit rule lookup and nearest collectable-fruit targeting.
- `src/logic/engine/resourceFruitCollectionSystem.js`
  - Resource fruit stamina/thirst/sensory-flow rewards, collection counts, and pickup feedback.
- `src/logic/engine/itemFeedbackSystem.js`
  - Shared item feedback particle emission for attached-hand and player-core item effects.
- `src/logic/engine/itemSystem.js`
  - Item activation orchestration and activation-type dispatch.
- `src/logic/engine/itemChannelSystem.js`
  - Channel item startup, countdown completion, cancellation, stamina restore, and feedback.
- `src/logic/engine/checkpointItemSystem.js`
  - Protection checkpoint snapshot capture and rope-threat arming.
- `src/logic/engine/rescueItemSystem.js`
  - Rescue-target lookup, protection item rescue handoff, rescue burden startup, and rescue feedback particles.
- `src/logic/engine/itemAvailabilitySystem.js`
  - Inventory count lookup, item active-state checks, and shared use-availability gatekeeping.
- `src/logic/engine/itemActivationAvailabilitySystem.js`
  - Activation-specific item availability rules for checkpoint and channel item requirements.
- `src/logic/engine/itemInventorySystem.js`
  - Starting inventory creation, inventory UI snapshots, and checkpoint activation lookup.
- `src/logic/engine/itemEffectsSystem.js`
  - Active item-effect value queries, effect presence checks, per-frame effect decay, and refresh/stacking application.
- `src/logic/engine/fallEntrySystem.js`
  - Stable fall-entry facade exports for failure-to-fall entry and checkpoint pose restoration.
- `src/logic/engine/fallBeginSystem.js`
  - Failure-to-fall entry, checkpoint rope-fall state creation, death-fall state creation, and transient climbing-state cleanup.
- `src/logic/engine/checkpointPoseRecoverySystem.js`
  - Checkpoint pose restoration for invincible/fallback recovery flows.
- `src/logic/engine/fallRecoverySystem.js`
  - Fall-mode dispatch between death fall, rope catch, and hanging recovery.
- `src/logic/engine/deathFallSystem.js`
  - Death-fall gravity, detached limb motion, invincible stabilization handoff, and game-over finalization.
- `src/logic/engine/ropeFallCatchSystem.js`
  - Checkpoint rope-fall gravity, catch transition to hanging, rope particles, and rope camera follow.
- `src/logic/engine/hangingRecoverySystem.js`
  - Hanging rope recovery ticks, reeling, rope camera movement, stamina recovery, and recovery completion back to climbing.
- `src/logic/engine/recoveryStateSystem.js`
  - Fall/recovery state initialization and stable recovery-window facade exports.
- `src/logic/engine/recoveryWindowSystem.js`
  - Rescue-window ratio queries, rescue stamina/wind bonuses, and per-frame rescue-window decay.
- `src/logic/engine/failureSystem.js`
  - Game-over finalization, failure-to-fall routing, and fall/dyno reset.
- `src/logic/engine/invincibleFailureSystem.js`
  - Invincible debug toggling and invincible-state failure stabilization after balance/exhaustion failures.
- `src/logic/engine/invincibleRecoverySystem.js`
  - Invincible-state limb reattachment recovery orchestration and checkpoint-pose fallback after failures.
- `src/logic/engine/invincibleAttachmentRecoverySystem.js`
  - Reachable detached-limb reattachment and forced fallback attachment orchestration for invincible recovery.
- `src/logic/engine/invincibleAttachmentSearchSystem.js`
  - Used-hold tracking and nearest available fallback-hold search for invincible recovery.
- `src/logic/engine/invincibleAttachmentApplySystem.js`
  - Recovered-limb hold attachment and anchor synchronization.
- `src/logic/engine/frameUpdateSystem.js`
  - Per-frame engine orchestration for particles, feedback, weather, hazards, fall recovery, dyno flight, route progress, stamina, and failure branches.
- `src/logic/engine/framePostUpdateSystem.js`
  - Shared per-frame tail ticks for active effects, dyno decay, channel items, recovery windows, stamina application, and camera updates.
- `src/logic/engine/dynoSystem.js`
  - Dyno cooldown decay and public dyno facade exports.
- `src/logic/engine/dynoChargeSystem.js`
  - Stable dyno-charge facade exports for input actions and per-frame charge ticking.
- `src/logic/engine/dynoChargeInputSystem.js`
  - Dyno charge begin/cancel input actions and charge readiness guards.
- `src/logic/engine/dynoChargeTickSystem.js`
  - Pull-vector charge ticking and launch-vector preparation.
- `src/logic/engine/dynoLaunchSystem.js`
  - Stable dyno-release facade exports and launch-parameter calculation.
- `src/logic/engine/dynoLaunchApplySystem.js`
  - Dyno launch vector application, stamina spend, hold release, and launch feedback particles.
- `src/logic/engine/dynoChargeMetricsSystem.js`
  - Dyno raw/eased charge ratios, reach ratio, and pull-vector calculation.
- `src/logic/engine/dynoMetricsSystem.js`
  - Dyno availability reasons and stamina-cost query.
- `src/logic/engine/dynoStateSystem.js`
  - Dyno state initialization, reset, and stable dyno lifecycle facade exports.
- `src/logic/engine/dynoLifecycleSystem.js`
  - Dyno preparation cancellation and flight-finish cleanup.
- `src/logic/engine/dynoFlightSystem.js`
  - Dyno airborne motion and apex-to-auto-attach transition.
- `src/logic/engine/dynoAutoAttachSystem.js`
  - Dyno auto-attach state startup, completion, and failed-landing balance resolution.
- `src/logic/engine/dynoAutoAttachMotionSystem.js`
  - Dyno auto-attach body freeze, per-frame progress, easing, and limb interpolation.
- `src/logic/engine/dynoLandingTargetSystem.js`
  - Dyno landing target selection and stable landing-target facade exports.
- `src/logic/engine/dynoLandingAttachSystem.js`
  - Dyno landing hold validation, limb attachment, and landing feedback particles.
- `src/logic/engine/bodyStateSystem.js`
  - Stable body-state facade exports for climbing motion.
- `src/logic/engine/restPoseSystem.js`
  - Rest-pose detection, stability-frame locking, and supported/perfect rest classification.
- `src/logic/engine/bodyVelocitySystem.js`
  - Body velocity application, damping, and deadzone snapping.
- `src/logic/engine/injuryStateSystem.js`
  - Hand-injury progression, bloodied-hold marking, and injury severity updates.
- `src/logic/engine/initialStateSystem.js`
- `src/logic/engine/initialMovementStateSystem.js`
- `src/logic/engine/initialDebugStateSystem.js`
- `src/logic/engine/initialFeedbackStateSystem.js`
- `src/logic/engine/initialSpatialScanStateSystem.js`
- `src/logic/engine/initialItemRouteStateSystem.js`
  - Movement, debug, feedback, spatial-scan, item, and route state factories, with `initialStateSystem.js` preserving stable facade exports alongside fall/recovery, condition, and player factory exports.
- `src/logic/engine/playerStateSystem.js`
  - Player body center, limb profile, and initial limb attachment creation.
- `src/logic/engine/conditionStateSystem.js`
  - Condition-state initialization for weather, injury, survival, environment events, and encounter pressure defaults.
- `src/logic/engine/gameStateFactory.js`
  - Initial aggregate game-state assembly from prepared run content and subsystem state factories.
- `src/logic/engine/gameInitialRunContent.js`
  - Full run initialization, generated-content filtering, and route analysis snapshot creation before aggregate state assembly.
- `src/logic/engine/gameRunDebugSystem.js`
  - Run-start option resolution and developer debug-run event filtering for generated content.
- `src/logic/engine/gameEngine.js`
  - Stable public engine facade for hooks and UI callers, preserving action, frame-update, snapshot, route-generation, and debug-tuning exports.
- `src/logic/engine/gameEngineRuntime.js`
  - Runtime adapter assembly for cross-system callbacks and shared helper dependencies used by frame updates, interactions, items, dyno, failure, and snapshots.
- `src/logic/engine/gameRuntimeAdapters.js`
  - Runtime adapter composition for frame, interaction, item, dyno, failure, fall-recovery, and encounter dependency bundles.
- `src/logic/engine/gameRuntimeInteractionAdapters.js`
  - Stable interaction-side runtime adapter composition for drag, body action, dyno, item, limb reach, and hold-interaction dependencies.
- `src/logic/engine/gameRuntimeHoldInteractionAdapter.js`
  - Hold-interaction runtime dependency bundle creation for stamina, hold availability, and failure routing.
- `src/logic/engine/gameRuntimeMovementAdapters.js`
  - Dyno, limb-reach, drag-interaction, and body-action runtime dependency bundle creation.
- `src/logic/engine/gameRuntimeItemAdapter.js`
  - Item runtime dependency bundle creation for attached-limb, checkpoint-anchor, single-hand-hang, and stamina helpers.
- `src/logic/engine/gameRuntimeFallAdapters.js`
- `src/logic/engine/gameRuntimeEncounterAdapter.js`
- `src/logic/engine/gameRuntimeFallRecoveryAdapter.js`
- `src/logic/engine/gameRuntimeFailureAdapter.js`
  - Failure and fall-side runtime dependency bundle builders for encounter, fall recovery, and failure-routing dependencies, with `gameRuntimeFallAdapters.js` preserving the stable getter facade.
- `src/logic/engine/limbReachMetricsSystem.js`
  - Stable limb-reach facade exports and raw target reachability checks.
- `src/logic/engine/limbReachProfileSystem.js`
  - Limb root projection, dynamic reach profiles, and dyno reach bonus application.
- `src/logic/engine/limbReachConstraintSystem.js`
  - Drag reach snapshot capture and active reach-constraint selection.
- `src/logic/engine/limbHoldLookupSystem.js`
  - Closest hold lookup, reachable-hold lookup, and landing-attach scoring rules shared by drag, dyno landing, and invincible recovery.
- `src/logic/engine/limbHoldSearchSystem.js`
  - Shared available-hold iteration and best-score selection used by limb hold lookup rules.
- `src/logic/engine/limbReachSystem.js`
  - Stable limb-reach facade exports for reach lookup, drag reach feedback, and attached-limb anchor sync.
- `src/logic/engine/limbReachFeedbackSystem.js`
  - Drag reach rejection feedback against the closest candidate hold.
- `src/logic/engine/attachedLimbAnchorSyncSystem.js`
  - Attached-limb anchor synchronization and optional out-of-reach release.
- `src/logic/engine/dragInteractionSystem.js`
  - Limb drag start and stable drag interaction facade exports.
- `src/logic/engine/dragPointerSystem.js`
  - Pointer coordinate updates and active drag reach-feedback dispatch.
- `src/logic/engine/spatialScanInteractionSystem.js`
  - Spatial-scan toggling, angle coercion, and attached-limb anchor resync.
- `src/logic/engine/dragReleaseSystem.js`
  - Drag-release hold snapping, grip particles, drag rejection feedback, and hanging recovery completion through reattachment.
- `src/logic/engine/bodyActionSystem.js`
  - Body long-press action routing between hanging reeling and dyno charge/release/cancel preparation flows.
- `src/logic/engine/attachmentSystem.js`
  - Stable attachment facade exports shared across runtime systems.
- `src/logic/engine/attachmentAvailabilitySystem.js`
  - Hold availability rules for attachable versus blocked hold types.
- `src/logic/engine/attachmentReleaseSystem.js`
  - Limb attachment release and departed-hold collapse dispatch.
- `src/logic/engine/attachedLimbQuerySystem.js`
  - Attached-limb and single-hand hang queries.
- `src/logic/engine/checkpointAnchorSystem.js`
  - Checkpoint anchor hold selection and stored-anchor position resolution.
- `src/logic/engine/limbAttachmentMotionSystem.js`
  - Detached and suspended limb pose updates for dyno flight, fall recovery, and hanging recovery.
- `src/logic/engine/feedbackSystem.js`
  - Drag rejection feedback, drag constraint snapshot clearing, and per-frame feedback countdown state shared by drag, fall, and game-over flows.
- `src/logic/engine/uiSnapshotSystem.js`
  - Runtime-to-UI snapshot assembly for top-level frame/play state, stamina, item, movement, condition, tutorial, and end-message fields.
- `src/logic/engine/uiSnapshotCoreSections.js`
  - Runtime-to-UI loadout, route, recovery, fall, feedback, debug, and level-analysis snapshot section builders.
- `src/logic/engine/uiSnapshotSections.js`
  - Runtime-to-UI movement and condition snapshot section builders with nested encounter-state cloning.
- `src/logic/engine/staminaSystem.js`
  - Stamina clamping, stamina restoration, and per-frame climbing stamina delta aggregation from rest pose, pressure deltas, recovery, route modifiers, and active item effects.
- `src/logic/engine/staminaPressureSystem.js`
  - Hold penalties, bloodied-hold pressure, wind, injury, thirst, pursuit, rope-threat, rescue-burden, and lane-blocker stamina pressure deltas.
- `src/logic/engine/climbingMotionSystem.js`
  - Climbing-body motion orchestration facade for body velocity, rest pose, injury, wind, center-of-mass, and detached-limb follow updates.
- `src/logic/engine/climbingLimbGroupSystem.js`
  - Attached versus detached climbing limb grouping.
- `src/logic/engine/climbingWindSystem.js`
  - Effective climbing wind calculation from rest-pose resistance, route wind multipliers, and recovery-window mitigation.
- `src/logic/engine/climbingBodyCenterSystem.js`
  - Center-of-mass sway target calculation and interpolation.
- `src/logic/engine/detachedLimbFollowSystem.js`
  - Detached climbing limb follow motion and dragged-limb pointer anchoring.
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
  - Current status: `npm run report:engine` prints engine module size and export/import counts, while `npm run report:engine:top` prints the largest modules for low-token refactor planning.
  - Current status: shared visual-feedback helpers now live in `src/logic/engine/particleSystem.js`, reducing repeated helper code across engine modules.
  - Current status: item activation orchestration lives in `src/logic/engine/itemSystem.js`, channel item startup and ticks live in `src/logic/engine/itemChannelSystem.js`, and shared item feedback particle emission lives in `src/logic/engine/itemFeedbackSystem.js`.
  - Current status: protection checkpoint capture now lives in `src/logic/engine/checkpointItemSystem.js`, while rescue-target protection interactions now live in `src/logic/engine/rescueItemSystem.js`.
  - Current status: inventory count lookup, item active-state checks, and shared use-availability gatekeeping live in `src/logic/engine/itemAvailabilitySystem.js`, activation-specific item availability rules live in `src/logic/engine/itemActivationAvailabilitySystem.js`, while inventory creation, inventory UI snapshots, and checkpoint activation lookup live in `src/logic/engine/itemInventorySystem.js`.
  - Current status: active item-effect queries, per-frame decay, and refresh/stacking application now live in `src/logic/engine/itemEffectsSystem.js`.
  - Current status: failure-to-fall entry now lives in `src/logic/engine/fallBeginSystem.js`, checkpoint pose restoration lives in `src/logic/engine/checkpointPoseRecoverySystem.js`, `src/logic/engine/fallEntrySystem.js` preserves stable facade exports, fall-mode dispatch lives in `src/logic/engine/fallRecoverySystem.js`, death-fall updates live in `src/logic/engine/deathFallSystem.js`, rope catch updates live in `src/logic/engine/ropeFallCatchSystem.js`, and hanging rope recovery lives in `src/logic/engine/hangingRecoverySystem.js`.
  - Current status: fall/recovery state initialization lives in `src/logic/engine/recoveryStateSystem.js`, while rescue-window queries, rescue stamina/wind bonuses, and per-frame rescue-window decay live in `src/logic/engine/recoveryWindowSystem.js`.
  - Current status: game-over finalization, failure-to-fall routing, and fall/dyno reset now live in `src/logic/engine/failureSystem.js`, while invincible debug toggling lives in `src/logic/engine/invincibleFailureSystem.js`, invincible recovery orchestration lives in `src/logic/engine/invincibleRecoverySystem.js`, reachable attachment orchestration lives in `src/logic/engine/invincibleAttachmentRecoverySystem.js`, fallback hold search lives in `src/logic/engine/invincibleAttachmentSearchSystem.js`, and recovered-limb attachment application lives in `src/logic/engine/invincibleAttachmentApplySystem.js`.
  - Current status: per-frame engine orchestration now lives in `src/logic/engine/frameUpdateSystem.js`, with shared tail ticks in `src/logic/engine/framePostUpdateSystem.js` and `gameEngine.js` preserving the public `updateFrame` export.
  - Current status: cross-system runtime adapter wiring now lives in `src/logic/engine/gameEngineRuntime.js`, with frame/fall composition in `src/logic/engine/gameRuntimeAdapters.js` and `src/logic/engine/gameRuntimeFallAdapters.js`, while fall dependency bundles are split into `src/logic/engine/gameRuntimeEncounterAdapter.js`, `src/logic/engine/gameRuntimeFallRecoveryAdapter.js`, and `src/logic/engine/gameRuntimeFailureAdapter.js`, and interaction dependency bundles are split into `src/logic/engine/gameRuntimeInteractionAdapters.js`, `src/logic/engine/gameRuntimeHoldInteractionAdapter.js`, `src/logic/engine/gameRuntimeMovementAdapters.js`, and `src/logic/engine/gameRuntimeItemAdapter.js`, keeping `gameEngine.js` focused on stable public facade exports.
  - Current status: dyno public facade exports and cooldown decay now live in `src/logic/engine/dynoSystem.js`, charge begin/cancel input actions now live in `src/logic/engine/dynoChargeInputSystem.js`, per-frame charge ticking now lives in `src/logic/engine/dynoChargeTickSystem.js`, `src/logic/engine/dynoChargeSystem.js` preserves stable facade exports, dyno release gating and launch-parameter calculation live in `src/logic/engine/dynoLaunchSystem.js`, and launch state application lives in `src/logic/engine/dynoLaunchApplySystem.js`.
  - Current status: dyno availability reasons and stamina-cost query live in `src/logic/engine/dynoMetricsSystem.js`, while raw/eased charge ratios, reach ratio, and pull-vector calculation live in `src/logic/engine/dynoChargeMetricsSystem.js`.
  - Current status: dyno state initialization and reset now live in `src/logic/engine/dynoStateSystem.js`, while dyno preparation cancellation and flight-finish cleanup live in `src/logic/engine/dynoLifecycleSystem.js`.
  - Current status: dyno airborne motion and apex-to-auto-attach transition now live in `src/logic/engine/dynoFlightSystem.js`, auto-attach startup/completion now lives in `src/logic/engine/dynoAutoAttachSystem.js`, auto-attach motion interpolation lives in `src/logic/engine/dynoAutoAttachMotionSystem.js`, landing target selection lives in `src/logic/engine/dynoLandingTargetSystem.js`, and landing validation/attachment application lives in `src/logic/engine/dynoLandingAttachSystem.js`.
  - Current status: rest-pose detection now lives in `src/logic/engine/restPoseSystem.js`, body velocity damping lives in `src/logic/engine/bodyVelocitySystem.js`, `src/logic/engine/bodyStateSystem.js` preserves stable facade exports, and hand injury plus bloodied-hold marking live in `src/logic/engine/injuryStateSystem.js`.
  - Current status: `src/logic/engine/initialStateSystem.js` now preserves stable facade exports, movement defaults live in `src/logic/engine/initialMovementStateSystem.js`, debug defaults live in `src/logic/engine/initialDebugStateSystem.js`, feedback defaults live in `src/logic/engine/initialFeedbackStateSystem.js`, spatial-scan defaults live in `src/logic/engine/initialSpatialScanStateSystem.js`, item/route defaults live in `src/logic/engine/initialItemRouteStateSystem.js`, player limb creation lives in `src/logic/engine/playerStateSystem.js`, condition-state initialization lives in `src/logic/engine/conditionStateSystem.js`, and fall/recovery state factories live in `src/logic/engine/recoveryStateSystem.js`.
  - Current status: initial run content generation, debug filtering, and route analysis snapshot creation now live in `src/logic/engine/gameInitialRunContent.js`, aggregate state assembly lives in `src/logic/engine/gameStateFactory.js`, and debug-run option resolution and event filtering live in `src/logic/engine/gameRunDebugSystem.js`.
  - Current status: limb root projection and dyno reach bonus now live in `src/logic/engine/limbReachProfileSystem.js`, drag reach snapshots now live in `src/logic/engine/limbReachConstraintSystem.js`, raw reachability checks remain in the stable `src/logic/engine/limbReachMetricsSystem.js` facade, hold lookup scoring now lives in `src/logic/engine/limbHoldLookupSystem.js`, shared best-hold selection lives in `src/logic/engine/limbHoldSearchSystem.js`, drag reach feedback lives in `src/logic/engine/limbReachFeedbackSystem.js`, attached-limb anchor sync lives in `src/logic/engine/attachedLimbAnchorSyncSystem.js`, and `src/logic/engine/limbReachSystem.js` preserves stable facade exports.
  - Current status: limb drag start and stable facade exports live in `src/logic/engine/dragInteractionSystem.js`, pointer updates and active drag reach-feedback dispatch live in `src/logic/engine/dragPointerSystem.js`, spatial-scan toggling and attached-limb anchor resync live in `src/logic/engine/spatialScanInteractionSystem.js`, while drag-release hold snapping, grip feedback, rejection feedback, and hanging recovery completion live in `src/logic/engine/dragReleaseSystem.js`.
  - Current status: body long-press action routing between hanging reeling and dyno charge/release/cancel preparation flows now lives in `src/logic/engine/bodyActionSystem.js`.
  - Current status: hold availability now lives in `src/logic/engine/attachmentAvailabilitySystem.js`, limb attachment release lives in `src/logic/engine/attachmentReleaseSystem.js`, attached-limb queries live in `src/logic/engine/attachedLimbQuerySystem.js`, checkpoint anchors live in `src/logic/engine/checkpointAnchorSystem.js`, `src/logic/engine/attachmentSystem.js` preserves stable facade exports, and detached/suspended limb pose updates live in `src/logic/engine/limbAttachmentMotionSystem.js`.
  - Current status: drag rejection feedback, drag constraint snapshot clearing, and feedback countdown ticks now live in `src/logic/engine/feedbackSystem.js`.
  - Current status: runtime-to-UI snapshot assembly now lives in `src/logic/engine/uiSnapshotSystem.js`, core snapshot section builders live in `src/logic/engine/uiSnapshotCoreSections.js`, movement and condition section builders live in `src/logic/engine/uiSnapshotSections.js`, and `gameEngine.js` preserves the public `getUiSnapshot` export.
  - Current status: stamina clamping, restoration, and per-frame climbing stamina aggregation live in `src/logic/engine/staminaSystem.js`, while hold and condition pressure deltas live in `src/logic/engine/staminaPressureSystem.js`.
  - Current status: climbing limb grouping now lives in `src/logic/engine/climbingLimbGroupSystem.js`, effective climbing wind lives in `src/logic/engine/climbingWindSystem.js`, center-of-mass sway lives in `src/logic/engine/climbingBodyCenterSystem.js`, detached-limb follow motion lives in `src/logic/engine/detachedLimbFollowSystem.js`, and `src/logic/engine/climbingMotionSystem.js` preserves the stable climbing-motion facade.
  - Current status: closest Golden Path stance lookup, route state updates, height tracking, and camera follow now live in `src/logic/engine/routeProgressSystem.js`.
  - Current status: `docs/manual-smoke-checklist.md` now documents the local and online smoke pass.
  - Current status: the smoke checklist notes that Pages refreshes after the `main` push workflow finishes.
- Developer tuning panel:
  - Current status: the in-game `DEV` panel supports runtime Dyno tuning, local save, active-level authoring summary, route preset selection, starting inventory overrides, event toggles, run-config JSON import/export, `Copy config`, and `Copy level config`.
  - Current status: wind debug override routes through `src/logic/engine/weatherDebugOverrideSystem.js`, natural weather updates route through `src/logic/engine/weatherSystem.js`, wind-vector math now lives in `src/logic/engine/windVectorSystem.js`, and wind-line tuning routes through `src/logic/engine/windLineDebugSystem.js`.
  - Current status: generated analysis values are shown next to target ranges for content counts, Golden Path safety, pressure, resource pressure, and event density.
  - Current status: `Copy level summary` exports a focused Markdown tuning handoff for the currently applied level.
  - Current status: a first-pass separate level-config screen now exists, opened from the `DEV` panel, with `Start / Route / Events / Validation` tabs and local draft JSON editing.
  - Next step: decide which parts of that screen should become true persistent authoring instead of local draft tooling.
  - Boundary: keep this as a developer tuning panel, not a player-facing UGC editor.
- Level config contract:
  - Current status: each level has authoring metadata, authored controls, randomized controls, content targets, pressure targets, resource-pressure targets, Golden Path rules, pressure rules, required validators, and a stable seed.
  - Current status: generated-route analysis and target validation now share `src/logic/analysis/levelAnalysis.js` across runtime snapshots, level-editor previews, reports, and validation scripts.
  - Current status: UI snapshots clone level-analysis data through `cloneLevelAnalysisSnapshot`, keeping new analysis fields out of ad hoc engine copy code.
  - Current status: seeded wall generation wrapper now lives in `src/logic/engine/routeGeneration.js`, final wall-blueprint assembly lives in `src/logic/engine/routeBlueprintGeneration.js`, route path scaffolding facade lives in `src/logic/engine/routePathGeneration.js`, spawn holds live in `src/logic/engine/routeSpawnHoldGeneration.js`, Golden Path stance construction lives in `src/logic/engine/routeGoldenStanceGeneration.js`, Golden Path scaffold generation lives in `src/logic/engine/routeGoldenPathGeneration.js`, route segment lookup split into `src/logic/engine/routeSegmentGeneration.js`, randomized route content split into `src/logic/engine/routeContentGeneration.js`, route content metadata selection lives in `src/logic/engine/routeContentMetadata.js`, hazard/resource metadata factories live in `src/logic/engine/routeContentHazardMetadata.js`, authored route content split into `src/logic/engine/routeAuthoredContentGeneration.js`, random helpers live in `src/logic/engine/routeRandomSystem.js`, hold creation and corridor clamping live in `src/logic/engine/routeHoldFactorySystem.js`, and `src/logic/engine/routeGenerationPrimitives.js` preserves stable primitive facade exports.
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
  - Current status: survival/resource frame-update compatibility lives in `src/logic/engine/survivalResourceSystem.js`, thirst pressure lives in `src/logic/engine/survivalPressureSystem.js`, resource fruit collection orchestration lives in `src/logic/engine/resourceFruitSystem.js`, fruit targeting lives in `src/logic/engine/resourceFruitTargetSystem.js`, and pickup rewards/feedback live in `src/logic/engine/resourceFruitCollectionSystem.js`.
  - Next step: test whether resource-reading levels need local scarcity rules, such as minimum fruit presence in route windows, optional detours, fruit corridors, or fruit decay.
  - Next step: design route-side acquisition for chalk, energy gel, and protection, such as exposed pickups, rescue rewards, obstacle caches, or post-crux rest ledges.
  - Boundary: do not turn fruit into inventory management until basic route reading proves it needs that depth.
- Encounter pressure:
  - Current status: pursuit line, lane blockers, and rope threat exist as constrained pressure systems.
  - Current status: encounter orchestration lives in `src/logic/engine/encounterSystems.js`, rescue-burden runtime pressure lives in `src/logic/engine/rescueBurdenSystem.js`, lane-blocker runtime pressure lives in `src/logic/engine/laneBlockerPressureSystem.js`, pursuit trigger gating and phase dispatch live in `src/logic/engine/pursuitPhaseSystem.js`, pursuit threat-height motion lives in `src/logic/engine/pursuitPhaseMotionSystem.js`, pursuit trigger/completion state transitions live in `src/logic/engine/pursuitPhaseStateSystem.js`, `src/logic/engine/pursuitSystem.js` preserves stable pursuit ticking facade exports, pursuit catch resolution lives in `src/logic/engine/pursuitCatchSystem.js`, and shared current-height calculation lives in `src/logic/engine/pursuitHeightSystem.js`.
  - Current status: rope-threat delayed checkpoint pressure ticking and progress/danger threshold dispatch now live in `src/logic/engine/ropeThreatSystem.js`, while reset, arming, and checkpoint break cleanup live in `src/logic/engine/ropeThreatStateSystem.js`.
  - Next step: tune spacing and readability before adding new enemy/NPC behavior.
  - Boundary: keep them as readable pressure markers until the player can parse route priorities under stress.
- Environmental hazards:
  - Current status: fragile holds, timed soft holds, drillable obstacles, earthquake, and avalanche are implemented and kept off Golden Path by validation.
  - Current status: fragile runtime interactions live in `src/logic/engine/fragileHoldSystem.js`, timed-soft runtime interactions live in `src/logic/engine/timedSoftHoldSystem.js`, `src/logic/engine/holdInteractions.js` preserves the compatibility facade, while drillable-obstacle targeting and progress are split between `src/logic/engine/obstacleDrillingSystem.js`, `src/logic/engine/obstacleDrillingTargetSystem.js`, and `src/logic/engine/obstacleDrillingProgressSystem.js`.
  - Current status: environment event scheduling and timers live in `src/logic/engine/environmentEvents.js`, activation dispatch lives in `src/logic/engine/environmentEventActivationSystem.js`, candidate selection lives in `src/logic/engine/environmentEventCandidateSystem.js`, earthquake mutation lives in `src/logic/engine/earthquakeEventActivationSystem.js`, and avalanche mutation lives in `src/logic/engine/avalancheEventActivationSystem.js`.
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
