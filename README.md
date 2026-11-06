# The School Chronicles — Aoyama Academy

A browser-based 3D courtyard exploration prototype built with React, TypeScript, Three.js, and Vite.

## Current scope

The current application is a **Three.js WebGL game**, not a native Unity application. It includes a procedural academy courtyard, an articulated student character, third-person and first-person cameras, basic movement/collision, lighting presets, falling sakura petals, synthesized audio, and desktop/mobile HUD controls.

Unity 6 URP C# and HLSL examples are currently embedded as copyable source strings in `src/game/unityScripts.ts`. They are **not** a complete Unity project, and this repository does not currently contain a compiled Android APK.

No backend API or Gemini integration is currently implemented in the inspected application source. Do not add private API keys to client-side Vite variables (for example, `VITE_GEMINI_API_KEY`). Any future AI integration must use a server-side endpoint.

## Requirements

- Bun (recommended; the repository includes `bun.lock`)
- A modern browser with WebGL 2 support

## Setup

```bash
bun install --frozen-lockfile
bun run dev
```

Vite serves the development app on port 3000.

## Quality checks

```bash
bun run lint
bun run test
bun run build
```

- `lint` runs the TypeScript compiler without emitting files.
- `test` runs the movement, collision, and camera unit tests with Node's test runner through `tsx`.
- `build` creates the production bundle in `dist/`.

## Controls

| Input | Action |
| --- | --- |
| W / A / S / D or arrow keys | Move |
| Shift | Sprint |
| Space | Jump |
| V | Toggle first-/third-person camera |
| L | Cycle lighting preset |
| R | Reset spawn |
| P / Escape | Pause / resume |
| M | Mute / unmute |
| I | Open implementation status and Unity source panel |
| Q / E | Rotate camera |
| Mouse drag / touch drag | Orbit camera |
| Mouse wheel | Zoom |
| Mobile virtual joystick | Move |
| Mobile Jump / Sprint buttons | Jump / toggle sprint |

## Vercel deployment

This is a static Vite application:

- Framework preset: **Vite**
- Build command: `bun run build`
- Output directory: `dist`
- Install command: `bun install --frozen-lockfile`

No Vercel environment variables are required by the current browser-only application. Configure a Vercel project to point to this repository and its `main` branch only after confirming the correct project/team.

## Known limitations

- Native Unity project generation and APK compilation are not included.
- AI/backend functionality is not implemented.
- Mobile performance and controls still require testing on physical devices.
- WebGL context restoration and broader browser integration tests remain future work.
- The current character uses a hierarchy of Three.js groups and meshes rather than a conventional weighted `SkinnedMesh` rig.

## Development principle

Keep the existing playable courtyard stable. Make larger gameplay and rendering changes in small, independently testable steps.
