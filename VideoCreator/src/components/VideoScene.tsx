import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Scene} from '../types';
import {getCaptionForFrame} from '../lib/scene-utils';
import {CaptionBlock} from './CaptionBlock';
import {KenBurnsImage} from './KenBurnsImage';

export const VideoScene: React.FC<{
  scene: Scene;
}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const caption = getCaptionForFrame(scene.captions, frame, fps);

  return (
    <AbsoluteFill style={{opacity}}>
      {scene.asset.kind === 'video' ? (
        scene.asset.segments && scene.asset.segments.length > 0 ? (
          <>
            {scene.asset.segments.reduce((acc, segment, index) => {
              const src = segment.src.startsWith('http')
                ? segment.src
                : staticFile(segment.src);
              acc.nodes.push(
                <Sequence
                  key={`${scene.id}-segment-${index}`}
                  from={acc.offset}
                  durationInFrames={segment.durationInFrames}
                >
                  <OffthreadVideo
                    src={src}
                    startFrom={segment.startFrom}
                    endAt={segment.endAt}
                    playbackRate={segment.playbackRate}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Sequence>,
              );
              acc.offset += segment.durationInFrames;
              return acc;
            }, {offset: 0, nodes: [] as React.ReactNode[]}).nodes}
          </>
        ) : (
          <OffthreadVideo
            src={scene.asset.src.startsWith('http') ? scene.asset.src : staticFile(scene.asset.src)}
            startFrom={scene.asset.startFrom}
            endAt={scene.asset.endAt}
            playbackRate={scene.asset.playbackRate}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )
      ) : (
        <KenBurnsImage
          src={scene.asset.src}
          motion={scene.asset.motion}
        />
      )}

      <AbsoluteFill
        style={{
          justifyContent: 'space-between',
          padding: '84px 72px',
        }}
      >
        <div />

        <CaptionBlock caption={caption} frame={frame} fps={fps} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
