# Manual Smoke Checklist

Use this short checklist after a local feature pass and again after pushing to `main`.

## Local Smoke

1. Run the full validation gate:

```bash
npm run validate
```

2. Start the local app:

```bat
StartLocalTest.cmd
```

3. In the opened browser, check:
   - The game loads at `/TheSolitaryApex/`.
   - Dragging a hand or foot can attach to a nearby higher hold.
   - Stamina, height, route, wind, injury, thirst, and launch status update in the HUD.
   - Language buttons switch visible UI text.
   - The `DEV` panel opens, route preset changes can be applied, and `Copy level summary` copies a readable tuning summary.
   - The level editor opens from the `DEV` panel and the `Validation` tab shows generated analysis.

## Online Smoke

1. Open the deployed build:

```bat
OpenOnlineTest.cmd
```

2. Confirm the online page loads from:

```text
http://blog.onovich.com/TheSolitaryApex/
```

3. Repeat the same quick play, language switch, and `DEV` panel checks from the local smoke.

## Deployment Note

GitHub Pages deployment is triggered by pushes to `main` through `.github/workflows/deploy.yml`. If the online build still shows the previous version, wait for the Pages workflow to finish before treating the smoke as failed.
