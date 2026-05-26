---
name: remotion-best-practices
description: Best practices for Remotion (remotion.dev) — video creation in React. Based on official Remotion v4 documentation. Use this before implementing any Remotion composition, animation, or render pipeline.
---

# Remotion Best Practices

> Remotion turns React components into videos. Each frame is a deterministic render of the component tree at a given `frame` value.

## Project setup

```bash
# Create new project
npx create-video@latest

# Key packages
remotion                  # core runtime
@remotion/cli             # npx remotion render / studio
@remotion/renderer        # programmatic rendering (Node.js)
@remotion/player          # embed video in a web page
@remotion/media-utils     # getAudioData, getVideoMetadata
@remotion/zod-types       # zColor and other Remotion-specific Zod types
```

Entry point (`src/index.ts`) must call `registerRoot(MyRoot)`.

---

## Composition

```tsx
import {Composition} from 'remotion';

export const Root: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{title: 'Hello'}}
    schema={myZodSchema}           // enables Studio prop editing
    calculateMetadata={calcMeta}   // override metadata dynamically from props
  />
);
```

### calculateMetadata

Use to derive `durationInFrames`, `fps`, `width`, `height` from props at render time:

```ts
import {type CalculateMetadataFunction} from 'remotion';

const calculateMetadata: CalculateMetadataFunction<MyProps> = async ({props}) => {
  return {
    durationInFrames: props.scenes.reduce((s, sc) => s + sc.frames, 0),
    fps: props.fps,
    width: props.width,
    height: props.height,
    props,   // pass validated/transformed props back
  };
};
```

`calculateMetadata` runs in both Studio and render. Since v4.0.342 it receives `isRendering: boolean` — skip expensive network calls when `!isRendering`.

---

## Layout components

| Component | Description |
|---|---|
| `<AbsoluteFill>` | `position:absolute; inset:0; display:flex` — full-canvas layer |
| `<Sequence from={n} durationInFrames={d}>` | Shifts child timeline: frame 0 inside = frame `n` outside |
| `<Series>` | Places `<Series.Sequence>` end-to-end without manual offsets |
| `<Freeze frame={n}>` | Holds children at a fixed frame |
| `<Loop durationInFrames={d}>` | Loops children repeatedly |
| `<OffthreadVideo>` | Preferred video component for rendering (see Media section) |
| `<Audio>` | Audio playback (BGM, narration) |
| `<Img>` | Image with pre-fetch guarantee |
| `<IFrame>` | Embed a URL (use with caution — render accuracy not guaranteed) |

---

## Animation hooks

```ts
const frame = useCurrentFrame();                       // 0-based, increments each render
const {fps, durationInFrames, width, height} = useVideoConfig();
```

### interpolate()

```ts
import {interpolate} from 'remotion';

const opacity = interpolate(
  frame,
  [0, 30],        // input range
  [0, 1],         // output range
  {
    extrapolateLeft: 'clamp',   // ← ALWAYS set; default is 'extend' (linear extrapolation)
    extrapolateRight: 'clamp',
  },
);
```

**Default extrapolation is `"extend"`** — values go outside the output range before/after the input range. For bounded animations (opacity, scale, position), always pass `clamp`.

Other `extrapolate` options: `"identity"` (return input value), `"wrap"` (modulo).

`interpolate` also accepts `easing` (e.g. `Easing.out(Easing.quad)` from `'remotion'`).

### spring()

```ts
import {spring} from 'remotion';

const scale = spring({
  frame,
  fps,
  config: {
    mass: 1,
    damping: 10,
    stiffness: 100,
    overshootClamping: false,   // set true to prevent exceeding `to`
  },
  from: 0,
  to: 1,
  durationInFrames: 20,   // stretches the curve to exactly N frames (hard constraint, not a hint)
  delay: 5,               // start after N frames
});
```

**`durationInFrames` rescales the physics simulation** — it changes how the spring feels. Without it, settling time is fps-dependent (same config settles at different frame counts at 24fps vs 30fps). Use `measureSpring({fps, config})` to compute settling frame count programmatically.

Without `overshootClamping: true`, spring can slightly exceed `to`. Clamp downstream `interpolate` calls: `interpolate(springVal, [0, 1], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })`.

### measureSpring()

```ts
import {measureSpring} from 'remotion';
const frames = measureSpring({fps: 30, config: {damping: 10, stiffness: 100}});
```

---

## Media components

### OffthreadVideo vs Video

| | `<OffthreadVideo>` | `<Video>` (legacy core) |
|---|---|---|
| Render method | FFmpeg frame extraction → `<img>` | HTML `<video>` seek (unreliable) |
| Frame accuracy | Exact | May produce duplicates |
| Studio preview | ✓ | ✓ |

**Always use `<OffthreadVideo>`** for render-critical code. The legacy `<Video>` from core uses HTML video seeking which can produce duplicate frames when source fps differs.

```tsx
<OffthreadVideo
  src={staticFile('clip.mp4')}
  startFrom={30}       // start from frame 30 of the source
  endAt={120}          // end at frame 120 of the source
  playbackRate={1.5}   // speed multiplier
  style={{width: '100%', height: '100%', objectFit: 'cover'}}
/>
```

### Audio

```tsx
<Audio
  src={staticFile('bgm.mp3')}
  volume={0.15}                      // 0–1; above 1 may cause clipping
  startFrom={0}
  endAt={150}
  playbackRate={1}
  loop
/>
```

`volume` can be a **function** `(f: number) => number` where `f` is the frame **relative to when this Audio clip starts** (not `useCurrentFrame()`). Use for per-clip fade-in/out:

```ts
volume={(f) => interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'})}
```

**Multiple `<Audio>` components mix additively.** Known issue: `playbackRate` combined with `startFrom`/`endAt` behaves differently in preview vs render (GitHub #3697).

### Img

```tsx
<Img src={staticFile('photo.jpg')} style={{width: '100%', objectFit: 'cover'}} />
```

Prefer `<Img>` over `<img>` — Remotion pre-fetches and waits for it before rendering frames.

---

## staticFile()

```ts
import {staticFile} from 'remotion';

const src = staticFile('video.mp4');          // → /public/video.mp4 during dev, bundled in render
const src = staticFile('assets/photo.jpg');   // subdirectory inside public/
```

- Files must be inside the **`public/`** folder (sibling to `package.json`).
- **Does not support relative paths** (`../`) or remote URLs — pass remote URLs directly.
- Assets must exist at bundle time; files added after `bundle()` are inaccessible during render.

```ts
// Remote URL — do NOT wrap in staticFile()
const src = 'https://example.com/video.mp4';
```

---

## Props schema with Zod

Pass `schema` to `<Composition>` to enable visual prop editing in Remotion Studio:

```ts
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';   // Remotion-specific types

const mySchema = z.object({
  title: z.string(),
  color: zColor(),
  durationSecs: z.number().min(1).max(60),
});

type MyProps = z.infer<typeof mySchema>;
```

Top-level schema **must be `z.object()`**. Derive TypeScript types from Zod — do not maintain parallel hand-written type definitions.

---

## Rendering

### CLI

```bash
# Interactive preview
npx remotion studio src/index.ts

# Render to file
npx remotion render src/index.ts MyVideo out/video.mp4

# Common flags
--props='{"title":"Hello"}'         # inline JSON
--props=./props.json                # JSON file path
--overwrite                         # overwrite existing output (default: true)
--codec=h264                        # h264 | h265 | av1 | vp8 | vp9 | prores | mp3 | aac
--concurrency=4                     # parallel Chrome tabs (default: CPU count)
--output=out/video.mp4
```

### Programmatic (Node.js)

```ts
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const serveUrl = await bundle({entryPoint: 'src/index.ts'});

const composition = await selectComposition({
  serveUrl,
  id: 'MyVideo',
  inputProps: {title: 'Hello'},   // required in v4/v5
});

await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: 'out/video.mp4',
  inputProps: {title: 'Hello'},
  concurrency: 4,
});
```

---

## Performance rules

- **Never use `Math.random()` or `Date.now()`** — each frame must be deterministic given the same `frame` value.
- **Never use `useState` or `useEffect`** — Remotion renders frames independently; React lifecycle has no continuity across frames.
- Use `<OffthreadVideo>` not `<Video>` (core).
- Pre-fetch data in `calculateMetadata`, not inside the component.
- For heavy per-frame computation, memoize with `useMemo` keyed on `frame`.
- `<Img>` and `<Audio>` block rendering until loaded — no manual loading state needed.

---

## Common patterns

### Fade in / out

```ts
const opacity = interpolate(
  frame,
  [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
  [0, 1, 1, 0],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
);
```

### Spring entrance

```tsx
const enter = spring({frame, fps, config: {damping: 20, stiffness: 180}, durationInFrames: 15});
const translateY = interpolate(enter, [0, 1], [40, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
// style={{ opacity: enter, transform: `translateY(${translateY}px)` }}
```

### Scene sequence

```tsx
<Series>
  {scenes.map((scene) => (
    <Series.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
      <SceneComponent scene={scene} />
    </Series.Sequence>
  ))}
</Series>
```

### Audio fade-out

```tsx
<Audio
  src={staticFile('bgm.mp3')}
  volume={(f) =>
    interpolate(f, [durationInFrames - 20, durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  }
/>
```

### Ken Burns (pan/zoom on image)

```ts
const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
const scale = interpolate(progress, [0, 1], [1, 1.12]);  // zoom-in
const panX = interpolate(progress, [0, 1], [0, 80]);      // pan-right (px)
```

Apply as `transform` on the image container with `overflow: hidden`.

---

## v4 breaking changes

| Old | New |
|---|---|
| `import {z} from 'remotion'` | `import {z} from 'zod'` (zod is a peer dep) |
| `webpackBundle` param | `serveUrl` param in `renderMedia()` |
| `parallelism` param | `concurrency` param in `renderMedia()` |
| `config` param in `renderFrames()` | `composition` param |
| `<MotionBlur>` | `<Trail>` |
| `downloadVideo()` | `downloadMedia()` |
| `Config.setOutputFormat()` | `Config.setCodec()` / `Config.setImageSequence()` |
| ProRes default audio codec AAC | `pcm_s16le` |

## v5 breaking changes (upcoming)

- `inputProps` is now **required** (not optional) in `selectComposition()` / `getCompositions()`.
- Node.js minimum: 18.0.0.
- `optimizeFor` audio default changed from `"accuracy"` to `"speed"`.
