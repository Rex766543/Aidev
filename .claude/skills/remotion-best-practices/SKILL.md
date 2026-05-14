---
name: remotion-best-practices
description: Best practices for Remotion — video creation in React. Covers composition structure, animation primitives, asset handling, audio, the project's schema contract, and rendering workflow.
---

# Remotion Best Practices

## Core primitives

| Primitive | Purpose |
|---|---|
| `<Composition>` | Declares a renderable video with id, component, fps, width, height, durationInFrames |
| `<AbsoluteFill>` | Full-size overlay layer (position: absolute, inset 0) |
| `<Series>` / `<Series.Sequence>` | Place scenes end-to-end without manual frame offsets |
| `<Sequence from={n} durationInFrames={d}>` | Shift child timeline by n frames |
| `<Audio src={url} volume={v}>` | Overlay BGM or narration; always resolve with `staticFile()` for local assets |
| `<Img src={url}>` | Static image; prefer over `<img>` — Remotion pre-fetches and waits |
| `<OffthreadVideo src={url}>` | Video asset; renders each frame off the main thread for accurate stills |

## Animation hooks

```ts
const frame = useCurrentFrame();           // 0-based frame index
const { fps, durationInFrames } = useVideoConfig();

// Linear interpolation with clamping
const x = interpolate(frame, [0, 30], [0, 100], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

// Physics-based spring (use for natural entrances)
const reveal = spring({
  frame,
  fps,
  config: { damping: 20, stiffness: 180 },
  durationInFrames: Math.min(12, durationInFrames),
});
```

- Always clamp `interpolate` unless intentional overshoot is needed.
- Use `spring()` for UI element entrances; use `interpolate()` for sustained motion (Ken Burns, pan).
- Compute derived values from `frame` only — never mutate state inside a component render.

## Asset resolution

```ts
// Correct: works in both preview and render
const src = asset.src.startsWith('http') ? asset.src : staticFile(asset.src);

// Wrong: bare relative paths break in render
const src = `./public/${asset.src}`;
```

- Remote URLs (https://…) are fetched directly — no `staticFile()` needed.
- Local files must be under `public/` and referenced via `staticFile('filename.mp4')`.

## Ken Burns / motion presets

This project implements motion on images via `KenBurnsImage`:

| Preset | Transform |
|---|---|
| `zoom-in` | `scale(1.00 → 1.12)` |
| `zoom-out` | `scale(1.10 → 1.00)` |
| `pan-left` | `translateX(0 → -80px) scale(1.08)` |
| `pan-right` | `translateX(0 → +80px) scale(1.08)` |
| `none` | `scale(1.04)` (subtle stabiliser) |

Always apply motion to image scenes so the output feels like video rather than a slideshow.

## Audio

- BGM: `<Audio src={bgmSrc} volume={bgmVolume} />` — keep `bgmVolume` in range 0.10–0.20.
- Narration: `<Audio src={narrationSrc} volume={1.9} />` — slightly boosted for clarity over music.
- Both start at frame 0 of the composition and play across all scenes automatically.

## Fade transitions

Apply per-scene fade-in/out via `interpolate` on `opacity`:

```ts
const opacity = interpolate(
  frame,
  [0, 10, durationInFrames - 10, durationInFrames],
  [0, 1, 1, 0],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
);
```

Use the same pattern in `VideoScene` — don't add cross-dissolve at the `Series` level; dissolves between scenes require `<TransitionSeries>` and are opt-in.

## Captions

Captions are time-coded to milliseconds (not frames):

```json
{ "startMs": 0, "endMs": 2400, "text": "石畳の路地を歩くと、街の空気が一気に変わる。" }
```

Convert to frames inside the component: `Math.round((ms / 1000) * fps)`.

`CaptionBlock` uses a spring entrance + linear exit. Keep caption windows ≥ 1 s and ≤ 5 s for readability.

## project.json schema contract

Source of truth: `src/lib/schema.ts` (Zod). Key fields:

```json
{
  "theme": "string",
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "audioMode": "generated-audio | original-audio",
  "narrationSrc": "https://… or sessions/<slug>/narration.mp3",
  "bgmSrc": "https://… or sessions/<slug>/bgm.mp3",
  "bgmVolume": 0.14,
  "scenes": [
    {
      "id": "unique-string",
      "overlayText": "optional overlay",
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

`VideoScene` renders segments inside `<Sequence>` with accumulated frame offsets — do not overlap segments.

## Rendering

```bash
# Preview in browser (hot reload)
npx remotion studio

# Render a session
npm run render:session -- projects/YYYY-MM-DD_slug

# Render a specific composition (ad-hoc)
npx remotion render src/index.ts TravelShort out/video.mp4 --props='{"theme":"…", ...}'
```

The `render:session` script reads `work/project.json` and injects it as `--props`. Never hand-edit the render command's JSON inline — always edit `project.json` first.

## `calculateMetadata` pattern

Use `calculateMetadata` to derive fps, width, height, and total duration from props at render time:

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

This keeps the `<Composition>` defaults as placeholders only — the real values come from `project.json`.

## Performance

- Use `<OffthreadVideo>` for video, not `<Video>` — it gives frame-accurate stills during rendering.
- Avoid `useEffect` and `useState`; Remotion renders each frame independently (no React lifecycle continuity).
- Keep component tree shallow. All scene logic lives in `VideoScene`; `TravelShort` is just a `<Series>` wrapper.
- Do not use `Math.random()` or `Date.now()` — outputs must be deterministic per-frame.

## Checklist before rendering

- [ ] All `asset.src` values resolve (local files in `public/`, remote URLs reachable)
- [ ] Each scene has a motion preset (image) or valid segments (video)
- [ ] Caption `endMs` > `startMs` and within scene duration
- [ ] `bgmVolume` ≤ 0.20
- [ ] `project.json` passes `projectSchema.parse()` without errors
- [ ] `npm run render:session` uses the correct project slug
