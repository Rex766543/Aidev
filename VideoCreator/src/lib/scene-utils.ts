import {CaptionSegment, Scene} from '../types';

export const getProjectDuration = (scenes: Scene[]): number => {
  return scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
};

export const getCaptionForFrame = (
  captions: CaptionSegment[] | undefined,
  frame: number,
  fps: number,
): CaptionSegment | null => {
  if (!captions || captions.length === 0) {
    return null;
  }

  const sceneOffsetMs = captions[0].startMs;
  const currentMs = (frame / fps) * 1000;
  const active = captions.find(
    (caption) =>
      currentMs >= caption.startMs - sceneOffsetMs &&
      currentMs <= caption.endMs - sceneOffsetMs,
  );

  if (!active) {
    return null;
  }

  return {
    ...active,
    startMs: Math.max(0, active.startMs - sceneOffsetMs),
    endMs: Math.max(0, active.endMs - sceneOffsetMs),
  };
};
