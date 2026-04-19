import React from 'react';
import {interpolate, spring} from 'remotion';
import {CaptionSegment} from '../types';

export const CaptionBlock: React.FC<{
  caption: CaptionSegment | null;
  frame: number;
  fps: number;
}> = ({caption, frame, fps}) => {
  if (!caption) {
    return null;
  }

  const startFrame = Math.max(0, Math.round((caption.startMs / 1000) * fps));
  const endFrame = Math.max(startFrame + 1, Math.round((caption.endMs / 1000) * fps));
  const localFrame = Math.max(0, frame - startFrame);
  const visibleDuration = Math.max(1, endFrame - startFrame);
  const enter = spring({
    frame: localFrame,
    fps,
    config: {damping: 20, stiffness: 180},
    durationInFrames: Math.min(12, visibleDuration),
  });
  const exit = interpolate(
    frame,
    [Math.max(startFrame, endFrame - 8), endFrame],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const opacity = Math.max(0, Math.min(1, enter * exit));
  const translateY = interpolate(enter, [0, 1], [22, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 72,
        bottom: 160,
        padding: '22px 28px',
        borderRadius: 28,
        background: 'rgba(12, 18, 27, 0.78)',
        color: '#fffdf5',
        fontSize: 44,
        lineHeight: 1.35,
        fontWeight: 700,
        letterSpacing: 0.6,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {caption.text}
    </div>
  );
};
