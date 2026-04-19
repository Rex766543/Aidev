import React from 'react';
import {Audio, Series, staticFile} from 'remotion';
import {ProjectData} from '../types';
import {VideoScene} from '../components/VideoScene';

export const TravelShort: React.FC<ProjectData> = ({
  scenes,
  narrationSrc,
  bgmSrc,
  bgmVolume,
}) => {
  const resolvedBgmSrc = bgmSrc
    ? bgmSrc.startsWith('http')
      ? bgmSrc
      : staticFile(bgmSrc)
    : null;
  const resolvedNarrationSrc = narrationSrc
    ? narrationSrc.startsWith('http')
      ? narrationSrc
      : staticFile(narrationSrc)
    : null;

  return (
    <>
      {resolvedBgmSrc ? <Audio src={resolvedBgmSrc} volume={bgmVolume} /> : null}
      {resolvedNarrationSrc ? <Audio src={resolvedNarrationSrc} volume={1.9} /> : null}
      <Series>
        {scenes.map((scene) => (
          <Series.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
            <VideoScene scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    </>
  );
};
