export type MotionPreset =
  | 'none'
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right';

export type SceneAsset = {
  kind: 'image' | 'video';
  src: string;
  motion?: MotionPreset;
  credit?: string;
  startFrom?: number;
  endAt?: number;
  playbackRate?: number;
  segments?: VideoSegment[];
};

export type VideoSegment = {
  src: string;
  startFrom: number;
  endAt: number;
  playbackRate: number;
  durationInFrames: number;
};

export type CaptionSegment = {
  startMs: number;
  endMs: number;
  text: string;
};

export type Scene = {
  id: string;
  title?: string;
  overlayText?: string;
  durationInFrames: number;
  asset: SceneAsset;
  captions?: CaptionSegment[];
};

export type ProjectData = {
  theme: string;
  fps: number;
  width: number;
  height: number;
  audioMode: 'original-audio' | 'generated-audio';
  narrationSrc?: string;
  bgmSrc?: string;
  bgmVolume: number;
  sourceText?: string;
  scenes: Scene[];
};
