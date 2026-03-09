/**
 * 视频播放器组件
 */

import React from 'react';
import { Button, Slider, Typography } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import type { UseVideoPlayerReturn } from '../hooks/useVideoPlayer';
import styles from './VideoPlayer.module.less';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoPath: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  formatTime: (time: number) => string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  videoPath,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  formatTime
}) => {
  return (
    <div className={styles.videoContainer}>
      <video
        ref={videoRef}
        src={`file://${videoPath}`}
        onEnded={() => {}}
        preload="metadata"
        className={styles.videoPlayer}
      />

      <div className={styles.controlsContainer}>
        <Button
          type="text"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={onTogglePlay}
          size="large"
        />

        <Typography.Text>{formatTime(currentTime)}</Typography.Text>

        <div className={styles.sliderContainer}>
          <Slider
            min={0}
            max={duration}
            value={currentTime}
            onChange={onSeek}
            step={0.1}
            tooltip={{ formatter: value => formatTime(value || 0) }}
          />
        </div>

        <Typography.Text>{formatTime(duration)}</Typography.Text>
      </div>
    </div>
  );
};

export default VideoPlayer;
