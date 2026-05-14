import {z} from 'zod';

export const motionPresetSchema = z.enum([
  'none',
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
]);

export const captionSegmentSchema = z.object({
  startMs: z.number().nonnegative(),
  endMs: z.number().positive(),
  text: z.string().min(1),
});

export const videoSegmentSchema = z.object({
  src: z.string().min(1),
  startFrom: z.number().int().nonnegative(),
  endAt: z.number().int().positive(),
  playbackRate: z.number().positive(),
  durationInFrames: z.number().int().positive(),
});

export const sceneAssetSchema = z.object({
  kind: z.enum(['image', 'video']),
  src: z.string().min(1),
  motion: motionPresetSchema.optional(),
  credit: z.string().optional(),
  startFrom: z.number().int().nonnegative().optional(),
  endAt: z.number().int().positive().optional(),
  playbackRate: z.number().positive().optional(),
  segments: z.array(videoSegmentSchema).optional(),
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  overlayText: z.string().optional(),
  durationInFrames: z.number().int().positive(),
  asset: sceneAssetSchema,
  captions: z.array(captionSegmentSchema).optional(),
});

export const projectSchema = z.object({
  theme: z.string().min(1),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  audioMode: z.enum(['original-audio', 'generated-audio']),
  narrationSrc: z.string().optional(),
  bgmSrc: z.string().optional(),
  bgmVolume: z.number().min(0).max(1),
  sourceText: z.string().optional(),
  scenes: z.array(sceneSchema).min(1),
});

export type MotionPreset = z.infer<typeof motionPresetSchema>;
export type CaptionSegment = z.infer<typeof captionSegmentSchema>;
export type VideoSegment = z.infer<typeof videoSegmentSchema>;
export type SceneAsset = z.infer<typeof sceneAssetSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type ProjectSchema = ProjectData;
