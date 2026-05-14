---
name: remotion-best-practices
description: Best practices for Remotion — video creation in React. Covers composition structure, animation primitives, asset handling, audio, the project's schema contract, and rendering workflow. Verified against Remotion v4 public documentation.
---

# Remotion Best Practices

## Core primitives

| Primitive | Purpose |
|---|---|
| `<Composition>` | Declares a renderable video. Always pass `schema={yourZodSchema}` to enable Studio prop editing. |
| `<AbsoluteFill>` | Full-size overlay layer (position: absolute, inset 0) |
| `<Series>` / `<Series.Sequence>` | Place scenes end-to-end without manual frame offsets |
| `<Sequence from={n} durationInFrames={d}>` | Shift child timeline by n frames |
| `<Audio src={url} volume={v}>` | Overlay BGM or narration; always resolve local files with `staticFile()` |
| `<Img src={url}>` | Static image; prefer over `<img>` — Remotion pre-fetches and waits |
| `<OffthreadVideo src={url}>` | Video asset; renders each frame off the main thread for frame-accurate stills |

**Do not use `<Video>` (core)** for render-critical code — it uses HTML video seek which can produce duplicate frames when fps doesn't match the source. Always use `<OffthreadVideo>`.

## Animation hooks

```ts
const frame = useCurrentFrame();           // 0-based frame index
const { fps, durationInFrames } = useVideoConfig();

// Linear interpolation — ALWAYS clamp unless overshoot is intentional
const x = interpolate(frame, [0, 30], [0, 100], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

// Physics-based spring for natural entrances
const reveal = spring({
  frame,
  fps,
  config: { damping: 20, stiffness: 180 },
  durationInFrames: Math.min(12, durationInFrames), // hard duration constraint, not a hint
});
```

### spring() gotchas
- `durationInFrames` **stretches** the physics curve to exactly that length — it is a hard constraint, not a hint. The spring physics feel changes with duration.
- Without `durationInFrames`, settling time is **fps-dependent**. Same config at 24fps vs 30fps settles at different frame counts. Use `measureSpring()` to compute settling frame programmatically if needed.
- `overshootClamping: true` prevents values going above `to` — important for opacity/scale where overshoot is visible.
- Spring values can slightly exceed 1.0 without `overshootClamping`. Always clamp derived `interpolate()` calls: `interpolate(springValue, [0, 1], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })`.

### interpolate() default is NOT clamped
Default `extrapolateLeft/Right` is `"extend"` (linear extrapolation beyond range). For frame-gated animations, ALWAYS pass clamp options or values go out of range before/after the clip.

## Asset resolution

```ts
// Correct: works in both preview and render
const src = asset.src.startsWith('http') ? asset.src : staticFile(asset.src);

// Wrong: bare relative paths break in render
const src = `./public/${asset.src}`;
```

- Remote URLs (https://…) are fetched directly — **do not** wrap in `staticFile()`.
- Local files must be under `public/` and referenced via `staticFile('path/to/file.mp4')`.
- `staticFile()` does not support relative paths (no `../`).
- Assets added to `public/` after `bundle()` runs are inaccessible during programmatic render.

## Ken Burns / motion presets

This project implements motion on images via `KenBurnsImage` (`src/components/KenBurnsImage.tsx`):

| Preset | Transform |
|---|---|
| `zoom-in` | `scale(1.00 → 1.12)` |
| `zoom-out` | `scale(1.10 → 1.00)` |
| `pan-left` | `translateX(0 → -80px) scale(1.08)` |
| `pan-right` | `translateX(0 → +80px) scale(1.08)` |
| `none` | `scale(1.04)` (subtle stabiliser) |

Always apply motion to image scenes. Static images look like slideshows.

## Audio

- BGM: `<Audio src={bgmSrc} volume={bgmVolume} />` — keep `bgmVolume` in range 0.10–0.20.
- Narration: `<Audio src={narrationSrc} volume={1} />` — do not exceed 1.0 to avoid clipping.
- `volume` can be a function `(f) => number` where `f` is frames since the clip started — **not** `useCurrentFrame()`. Use this for fade-in/out on individual audio clips.
- Both Audio elements start at frame 0 of the composition and play across all scenes.
- Known Remotion bug: `playbackRate` combined with `startFrom`/`endAt` behaves differently in preview vs render (GitHub issue #3697).

## Overlay text

`overlayText` on a scene is displayed as an atmospheric title at the top of the frame for the first portion of the scene (≤72 frames). It fades in with a spring and fades out before the midpoint. Implemented in `VideoScene.tsx`.

Do not confuse with `captions` (subtitle blocks at the bottom, time-coded to ms).

## Fade transitions

Per-scene fade-in/out via `interpolate` on `opacity` in `VideoScene`:

```ts
const opacity = interpolate(
  frame,
  [0, 10, durationInFrames - 10, durationInFrames],
  [0, 1, 1, 0],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
);
```

Scene minimum is 45 frames (enforced in `prepare-session.js`) so the 10-frame fade windows never overlap.

## Captions

Captions are time-coded to milliseconds:

```json
{ "startMs": 0, "endMs": 2400, "text": "石畳の路地を歩くと、街の空気が一気に変わる。" }
```

`getCaptionForFrame` in `src/lib/scene-utils.ts` subtracts `captions[0].startMs` as a scene offset so captions from the global audio timeline become scene-relative. `CaptionBlock` then converts ms→frames internally.

Keep caption windows ≥ 1 s and ≤ 5 s. `splitLongCaptionChunk` enforces max 18 chars (CJK-optimized).

## project.json schema contract

Source of truth: `src/lib/schema.ts` (Zod). All named types (`Scene`, `SceneAsset`, `CaptionSegment`, `VideoSegment`, `MotionPreset`, `ProjectData`) are derived from the Zod schemas — **do not** define parallel hand-written types.

Key fields:

```json
{
  "theme": "string",
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "audioMode": "generated-audio | original-audio",
  "narrationSrc": "https://… or sessions/<slug>/audio/narration.mp3",
  "bgmSrc": "https://… or sessions/<slug>/audio/bgm.mp3",
  "bgmVolume": 0.14,
  "scenes": [
    {
      "id": "unique-string",
      "overlayText": "optional atmospheric title (shown top, first 2-3s of scene)",
      "durationInFrames": 120,
      "asset": {
        "kind": "image | video",
        "src": "url-or-local-path",
        "motion": "zoom-in | zoom-out | pan-left | pan-right | none"
      },
      "captions": [{ "startMs": 0, "endMs": 2400, "text": "…" }]
    }
  ]
}
```

- `durationInFrames` is the scene length at the project fps (e.g. 4 s × 30 fps = 120).
- Validate with `projectSchema.parse(props)` before passing to the composition.
- `calculateMetadata` in `Root.tsx` derives total duration dynamically — do not hardcode `durationInFrames` on `<Composition>`.

## Video segments (multi-clip scene)

When a single scene needs multiple clips:

```json
"asset": {
  "kind": "video",
  "src": "",
  "segments": [
    { "src": "clip-a.mp4", "startFrom": 0, "endAt": 90, "playbackRate": 1, "durationInFrames": 90 },
    { "src": "clip-b.mp4", "startFrom": 15, "endAt": 75, "playbackRate": 1.25, "durationInFrames": 60 }
  ]
}
```

`VideoScene` renders segments inside `<Sequence>` with accumulated frame offsets — do not overlap segments. `allocateSegmentsForBlock` in `prepare-session.js` fills remaining frames using slow-motion from the last clip's tail; very high `playbackRate` values are possible in edge cases.

## Schema on Composition

Always pass `schema` to `<Composition>` for Studio prop editing:

```tsx
<Composition
  id="TravelShort"
  component={TravelShort}
  schema={projectSchema}   // enables visual prop editing in Remotion Studio
  defaultProps={sampleProps}
  calculateMetadata={calculateMetadata}
  ...
/>
```

## Rendering

```bash
# Preview in browser (hot reload)
npm run studio

# Render a session (reads work/project.json automatically)
npm run render:session -- projects/YYYY-MM-DD_slug [optional-output.mp4]

# Render ad-hoc with explicit props file
npx remotion render src/index.ts TravelShort out/video.mp4 --props=path/to/project.json
```

The `render:session` script passes `--props=<file-path>` to Remotion. Remotion v4 accepts a JSON file path directly. Never inline large JSON on the command line.

## calculateMetadata pattern

```ts
const calculateMetadata: CalculateMetadataFunction<ProjectSchema> = async ({ props }) => {
  const parsed = projectSchema.parse(props);
  return {
    durationInFrames: getProjectDuration(parsed.scenes),
    fps: parsed.fps,
    width: parsed.width,
    height: parsed.height,
    props: parsed,
  };
};
```

This keeps `<Composition>` defaults as placeholders only — the real values come from `project.json`.

## Image collection (collect-web-images.js)

1. Primary: Openverse API (open-licensed images, `aspect_ratio=tall` for 9:16).
2. Fallback: Picsum Photos (`picsum.photos/seed/<seed>/1080/1920`) — deterministic by block id so retries return the same image.

The `keywordMap` translates common Japanese travel/culture terms to English for API queries. Add new destination entries to the map as coverage expands. The `toEnglishHint` function strips non-letter/number characters after substitution so partial Japanese that didn't match still gets clean ASCII output.

**Deprecated (do not use):** `source.unsplash.com/featured` was shut down in March 2024.

## Performance

- Use `<OffthreadVideo>` for video — frame-accurate stills during rendering.
- Avoid `useEffect` and `useState`; Remotion renders each frame independently (no lifecycle continuity).
- Keep component tree shallow. All scene logic lives in `VideoScene`; `TravelShort` is just a `<Series>` wrapper.
- Do not use `Math.random()` or `Date.now()` — outputs must be deterministic per-frame.
- Each `<Audio>` element is mixed additively; multiple elements are fine.

## Checklist before rendering

- [ ] All `asset.src` values resolve (local files in `public/`, remote URLs reachable)
- [ ] Each scene has a motion preset (image) or valid segments (video)
- [ ] Caption `endMs` > `startMs` and within scene duration
- [ ] `bgmVolume` ≤ 0.20
- [ ] `project.json` passes `projectSchema.parse()` without errors
- [ ] `npm run render:session` uses the correct project slug

## v4 breaking changes to watch

- `z` is NOT exported from `remotion` — always `import { z } from 'zod'`.
- `webpackBundle` → `serveUrl` in programmatic render API.
- `parallelism` → `concurrency` in `renderMedia()`.
- `<MotionBlur>` removed — use `<Trail>`.
- `downloadVideo()` → `downloadMedia()`.
