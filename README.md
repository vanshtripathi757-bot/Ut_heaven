# The School Chronicles — Ut Heaven

A browser-based 3D courtyard prototype built with React, TypeScript, Vite, and Three.js.

## Current scope

This repository currently represents the Phase 1 visual and gameplay foundation:

- Aoyama Academy courtyard environment
- Haruka Aoyama player character
- Third-person and first-person camera modes
- Keyboard and touch movement, sprinting, and jumping
- Basic courtyard collision handling
- Lighting presets, atmosphere, HUD, and pause/status UI

This is a focused courtyard prototype, not yet a complete explorable school or open-world game.

## Development

Install dependencies with the package manager matching the lockfile (Bun):

```bash
bun install
bun run dev
```

## Quality checks

```bash
bun run lint
bun run test
bun run build
```

The test command runs the Node.js test suite through `tsx`. A successful deployment status alone does not prove these checks or mobile-device runtime behavior; run them in CI and test the deployed experience on target devices.

## Not yet implemented

NPC behavior, dialogue, quests, persistent save/load, multiplayer, authentication, and economy systems are outside the current Phase 1 implementation. Native Android APK packaging also requires a configured Unity 6 / Android build environment; the browser prototype is not an APK.
