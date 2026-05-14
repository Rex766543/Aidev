import React from 'react';
import {Composition, type CalculateMetadataFunction} from 'remotion';
import {TravelShort} from './compositions/TravelShort';
import {getProjectDuration} from './lib/scene-utils';
import {projectSchema, type ProjectData as ProjectSchema} from './lib/schema';

const sampleProps: ProjectSchema = {
  theme: 'Lisbon alley walk and market bites',
  fps: 30,
  width: 1080,
  height: 1920,
  audioMode: 'generated-audio',
  narrationSrc: 'https://example.com/narration.mp3',
  bgmSrc: 'https://example.com/bgm.mp3',
  bgmVolume: 0.14,
  sourceText:
    '石畳の路地を歩くと、街の空気が一気に変わる。地元の市場は、その国の暮らしが一番濃く見える場所。',
  scenes: [
    {
      id: 'intro',
      title: 'Portugal',
      overlayText: '朝の路地から旅を始める',
      durationInFrames: 120,
      asset: {
        kind: 'image',
        src: 'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80',
        motion: 'zoom-in',
      },
      captions: [
        {startMs: 0, endMs: 1800, text: '石畳の路地を歩くと、街の空気が一気に変わる。'},
      ],
    },
    {
      id: 'market',
      title: 'Market',
      overlayText: '市場の色と香りを切り取る',
      durationInFrames: 120,
      asset: {
        kind: 'image',
        src: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
        motion: 'pan-right',
      },
      captions: [
        {startMs: 0, endMs: 2200, text: '地元の市場は、その国の暮らしが一番濃く見える場所。'},
      ],
    },
  ],
};

const calculateMetadata: CalculateMetadataFunction<ProjectSchema> = async ({
  props,
}) => {
  const parsed = projectSchema.parse(props);

  return {
    durationInFrames: getProjectDuration(parsed.scenes),
    fps: parsed.fps,
    width: parsed.width,
    height: parsed.height,
    props: parsed,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TravelShort"
      component={TravelShort}
      schema={projectSchema}
      defaultProps={sampleProps}
      durationInFrames={getProjectDuration(sampleProps.scenes)}
      fps={sampleProps.fps}
      width={sampleProps.width}
      height={sampleProps.height}
      calculateMetadata={calculateMetadata}
    />
  );
};
