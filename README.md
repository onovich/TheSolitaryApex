# TheSolitaryApex

[简体中文](README.zh-CN.md)

[Play online](https://game.onovich.com/TheSolitaryApex/)

TheSolitaryApex is a hard 2D climbing prototype about moving four limbs independently, protecting the last stable hold, and managing stamina as the wall becomes less forgiving.

![TheSolitaryApex cover](docs/cover.png)

## How to play

- Drag a hand or foot toward a reachable hold.
- Release near the hold to attach that limb.
- Keep enough points of contact to protect balance.
- Use chalk and other limited items before fatigue becomes unrecoverable.
- After placing protection, pull the climber downward and release to commit to a longer dyno.
- Reach the top, or restart after a fall and try a different route.

Mouse and touch use the same direct limb controls.

## Features

- Independent control for both hands and both feet.
- Guaranteed-solvable route generation with multiple authored route templates.
- Reach, balance, stamina, rest, wind, injury, and fall systems.
- Chalk, protection, energy gel, collectible resources, and checkpoint recovery.
- Fragile holds, timed holds, obstacles, pursuit pressure, earthquakes, avalanches, and rescue encounters.
- English, Chinese, Japanese, Spanish, and Brazilian Portuguese interfaces.
- Developer tools for route seeds, run configuration, level inspection, and tuning export.

## Development

Install dependencies and start the Vite app:

```bash
npm install
npm run dev
```

On Windows, `StartLocalTest.cmd` opens a local test build and `OpenOnlineTest.cmd` opens the published game.

Run the main i18n, level, gameplay, and production-build checks:

```bash
npm run validate
```

Useful authoring reports:

```bash
npm run report:levels
npm run report:level -- pursuit-crux-ascent
```

## Status

The current web build is playable and contains a large set of route, movement, survival, encounter, item, and developer-authoring systems. It is still a prototype under active tuning: content balance, onboarding, device coverage, and the dedicated level editor are not complete.

Detailed level-authoring and maintenance notes live in `docs/level-config-maintenance.md` and `docs/level-editor-plan.md`.

## License

No open-source license is currently included in this repository.
