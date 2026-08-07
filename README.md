<div align="center">

<br />

```
  █████╗      ██╗███████╗███████╗██╗   ██╗███████╗
 ██╔══██╗     ██║██╔════╝██╔════╝██║   ██║██╔════╝
 ███████║     ██║█████╗  ███████╗██║   ██║███████╗
 ██╔══██║██   ██║██╔══╝  ╚════██║██║   ██║╚════██║
 ██║  ██║╚█████╔╝███████╗███████║╚██████╔╝███████║
 ╚═╝  ╚═╝ ╚════╝ ╚══════╝╚══════╝ ╚═════╝ ╚══════╝
                                   3D · 404 · PAGE
```

<br />

<p>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT" />
  <img src="https://img.shields.io/badge/60_FPS-canvas_keying-orange?style=flat-square" alt="60FPS" />
</p>

<br />

**A premium 404 experience built around four 3D figurines rendered directly in the browser.**  
Real-time chroma keying on a `<canvas>`, hardware-accelerated transitions, and an editorial-grade loading screen.  
No WebGL. No external video player. Just vanilla HTML5 + React.

<br />

</div>

---

## What it is

Most 404 pages are an afterthought. This one isn't.

The page presents four animated 3D character videos — Shark, Cactus, Raccoon, and Ducky — each filmed against a studio backdrop and composited live in the browser using a custom `<canvas>` pixel pipeline. The backdrop is stripped frame-by-frame at ~60 FPS, leaving only the character floating against a colour-matched background that transitions with each selection.

The preloader holds for a minimum of three seconds, long enough for the editorial-grade loading screen to breathe. When it lifts, the experience is fully buffered and ready.

---

## Characters

| ID | Name | Series | Background theme |
|---|---|---|---|
| `shark` | Shark 3D | Ocean Nomad | Warm sand — `#F8F4EE → #DDD1BF` |
| `cactus` | Cactus 3D | Botanical | Amber parchment — `#F9F6EE → #DBCBB2` |
| `racoon` | Raccoon 3D | Gamer | Cool slate — `#F1F5F9 → #CBD5E1` |
| `ducky` | Ducky 3D | Tropical | Sun yellow — `#FEF9C3 → #FCD34D` |

Each character has its own independently calibrated keying threshold. The values live in a typed lookup table inside [`ChromaKeyVideo.tsx`](src/components/common/ChromaKeyVideo.tsx) and are trivial to tune per-character.

---

## How the chroma keying works

The studio footage has a near-white, low-saturation backdrop — not a classic green screen. Each frame goes through this path:

```
HTMLVideoElement  →  drawImage (downscaled to 540px wide)
  →  getImageData  →  per-pixel minChannel / saturation test
  →  alpha write   →  putImageData  →  <canvas> composite
```

**Why 540px?** At native 1080p, the pixel loop touches ~8.3 M array slots per frame. At 540px, that drops to ~1.2 M — well under the 16.7 ms frame budget at 60 FPS, measured at ~1.5 ms on mid-range hardware.

Each pixel is evaluated against two thresholds:

```ts
if (minChannel > cfg.minCThreshold && saturation < cfg.satThreshold) {
  // fully transparent above cutoff, linear ramp below — avoids aliasing at edges
}
```

When a character is not the active slide, its `<video>` is paused and the canvas loop returns early — no wasted GPU time on invisible frames.

**Ducky** has a noticeable jump at the loop boundary, so a 450 ms opacity fade is applied at both ends of playback using `currentTime / duration`.

---

## Preloader

Videos are pre-buffered in parallel using throwaway `<video>` elements that fire `canplaythrough`. The loader tracks per-asset readiness and dismisses only after **both** conditions are satisfied:

1. All four assets have buffered (or errored — broken assets never block the UI).
2. A minimum of **3 seconds** has elapsed since mount.

If the network is slow and 8 seconds pass before all assets are ready, the fallback fires and the UI appears anyway with whatever has loaded.

---

## Navigation

| Input | Action |
|---|---|
| Click a pill in the top bar | Switch character |
| `←` / `→` arrow keys | Previous / next character |
| Swipe left / right (touch) | Previous / next character |
| Bottom arrow buttons | Previous / next character |

---

## Project structure

```
.
├── public/
│   ├── shark.mp4           — Shark figurine footage
│   ├── cactus.mp4          — Cactus figurine footage
│   ├── racoon.mp4          — Raccoon figurine footage
│   └── ducky.mp4           — Ducky figurine footage
│
└── src/
    ├── data/
    │   └── characters.ts   — Typed character config (id, src, keying key, theme colours, icon)
    ├── components/
    │   ├── common/
    │   │   └── ChromaKeyVideo.tsx   — Canvas keying engine + RAF loop
    │   └── sections/
    │       └── NotFoundSection.tsx  — Page layout, preloader, carousel, navigation
    ├── App.tsx             — Root component
    ├── main.tsx            — React DOM entry
    └── index.css           — Tailwind base + reduced-motion override
```

---

## Getting started

**Requirements:** Node ≥ 18, npm ≥ 9

```bash
git clone https://github.com/ajesus/ajesus-3d-404-page.git
cd ajesus-3d-404-page
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # production build → dist/
npm run preview      # preview the production build locally
```

---

## Adding a new character

1. Drop your `.mp4` into `public/`.
2. Add an entry to the `CHARACTERS` array in [`src/data/characters.ts`](src/data/characters.ts):

```ts
{
  id:                 'mychar',
  name:               'MyChar 3D',
  badge:              'CUSTOM OUTFIT',
  tagline:            '3D CHARACTER • SPECIAL EDITION',
  description:        'Short description shown on desktop.',
  src:                '/mychar.mp4',
  bgGradient:         'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
  watermarkTextColor: 'text-slate-900/[0.06]',
  accentPrimary:      '#1E293B',
  accentSecondary:    '#6366F1',
  icon:               Sparkles,
  iconColor:          'text-violet-400',
}
```

3. Tune the keying thresholds in the `KEYING_CONFIG` table in [`ChromaKeyVideo.tsx`](src/components/common/ChromaKeyVideo.tsx):

```ts
mychar: { minCThreshold: 160, satThreshold: 36, cutoff: 190, slope: 8.0 },
```

The `CharacterKey` union type in `characters.ts` will need to include your new id — TypeScript will tell you exactly where.

---

## License

MIT — do whatever you want, attribution appreciated.

<br />

<div align="center">
  <sub>Built by <strong>Amirhossein Dehghaniazar</strong> &nbsp;·&nbsp; <em>ajesus</em></sub>
</div>
