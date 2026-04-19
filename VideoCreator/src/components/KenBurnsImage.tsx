import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {MotionPreset} from '../types';

const resolveSrc = (src: string) => (src.startsWith('http') ? src : staticFile(src));

const motionToTransform = (
  motion: MotionPreset,
  progress: number,
): string => {
  const scaleIn = interpolate(progress, [0, 1], [1, 1.12]);
  const scaleOut = interpolate(progress, [0, 1], [1.1, 1]);
  const pan = interpolate(progress, [0, 1], [0, 80]);

  switch (motion) {
    case 'zoom-in':
      return `scale(${scaleIn})`;
    case 'zoom-out':
      return `scale(${scaleOut})`;
    case 'pan-left':
      return `translateX(${-pan}px) scale(1.08)`;
    case 'pan-right':
      return `translateX(${pan}px) scale(1.08)`;
    default:
      return 'scale(1.04)';
  }
};

export const KenBurnsImage: React.FC<{src: string; motion?: MotionPreset}> = ({
  src,
  motion = 'zoom-in',
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const reveal = spring({
    frame,
    fps,
    config: {damping: 200},
    durationInFrames: Math.min(24, durationInFrames),
  });
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#08111a'}}>
      <AbsoluteFill
        style={{
          transform: motionToTransform(motion, progress),
          opacity: reveal,
        }}
      >
        <Img
          src={resolveSrc(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 38%, rgba(0,0,0,0.52) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
