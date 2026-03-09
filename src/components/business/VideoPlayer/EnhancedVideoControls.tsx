/**
 * 增强视频播放器控件
 * 提供播放控制、时间显示、音量调节、全屏等功能
 */

import React from 'react';
import { Slider, Button, Tooltip, Dropdown, Space } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SoundOutlined,
  MutedOutlined,
  ExpandOutlined,
  CompressOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import styles from './EnhancedVideoControls.module.less';

const { ControlBar } = { ControlBar: 'div' };

// ============================================
// 类型定义
// ============================================

export interface VideoControlsProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 音量（0-1） */
  volume: number;
  /** 是否静音 */
  muted: boolean;
  /** 是否全屏 */
  isFullscreen: boolean;
  /** 播放速率 */
  playbackRate: number;
  /** 是否显示画质选项 */
  showQuality?: boolean;
  /** 播放速率选项 */
  playbackRates?: number[];
  /** 播放回调 */
  onPlay: () => void;
  /** 暂停回调 */
  onPause: () => void;
  /** 跳转回调 */
  onSeek: (time: number) => void;
  /** 音量变化回调 */
  onVolumeChange: (volume: number) => void;
  /** 静音切换回调 */
  onMuteToggle: () => void;
  /** 全屏切换回调 */
  onFullscreenToggle: () => void;
  /** 播放速率变化回调 */
  onPlaybackRateChange: (rate: number) => void;
  /** 自定义类名 */
  className?: string;
}

// 默认播放速率
const defaultPlaybackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ============================================
// 工具函数
// ============================================

/**
 * 格式化时间
 */
const formatTime = (time: number): string => {
  if (isNaN(time) || time < 0) return '00:00';

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ============================================
// 视频控制条组件
// ============================================

/**
 * 视频控制条组件
 */
export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  isFullscreen,
  playbackRate = 1,
  playbackRates = defaultPlaybackRates,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPlaybackRateChange,
  className,
}) => {
  // 处理播放/暂停
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  // 处理进度条点击
  const handleProgressChange = (value: number) => {
    onSeek(value);
  };

  // 处理音量变化
  const handleVolumeChange = (value: number) => {
    onVolumeChange(value / 100);
  };

  // 播放速率菜单
  const playbackRateMenu = {
    items: playbackRates.map((rate) => ({
      key: rate,
      label: (
        <span style={{ fontWeight: rate === playbackRate ? 600 : 400 }}>
          {rate}x
        </span>
      ),
      onClick: () => onPlaybackRateChange(rate),
    })),
  };

  // 进度百分比
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${styles.controls} ${className || ''}`}>
      {/* 进度条 */}
      <div className={styles.progressContainer}>
        <Slider
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleProgressChange}
          tooltip={{ formatter: (value) => formatTime(value || 0) }}
          className={styles.progressSlider}
        />
      </div>

      {/* 控制按钮区 */}
      <div className={styles.controlBar}>
        <div className={styles.leftControls}>
          {/* 播放/暂停 */}
          <Tooltip title={isPlaying ? '暂停' : '播放'}>
            <Button
              type="text"
              size="large"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handlePlayPause}
              className={styles.playButton}
            />
          </Tooltip>

          {/* 上一帧/下一帧 */}
          <Tooltip title="上一帧">
            <Button
              type="text"
              icon={<StepBackwardOutlined />}
              onClick={() => onSeek(Math.max(0, currentTime - 1 / 30))}
            />
          </Tooltip>
          <Tooltip title="下一帧">
            <Button
              type="text"
              icon={<StepForwardOutlined />}
              onClick={() => onSeek(Math.min(duration, currentTime + 1 / 30))}
            />
          </Tooltip>

          {/* 时间显示 */}
          <div className={styles.timeDisplay}>
            <span className={styles.currentTime}>{formatTime(currentTime)}</span>
            <span className={styles.timeSeparator}>/</span>
            <span className={styles.duration}>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={styles.rightControls}>
          {/* 播放速率 */}
          <Dropdown menu={playbackRateMenu} trigger={['click']}>
            <Button type="text" className={styles.rateButton}>
              {playbackRate}x
            </Button>
          </Dropdown>

          {/* 音量控制 */}
          <div className={styles.volumeControl}>
            <Tooltip title={muted ? '取消静音' : '静音'}>
              <Button
                type="text"
                icon={muted || volume === 0 ? <MutedOutlined /> : <SoundOutlined />}
                onClick={onMuteToggle}
              />
            </Tooltip>
            <Slider
              min={0}
              max={100}
              value={muted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
            />
          </div>

          {/* 全屏切换 */}
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={onFullscreenToggle}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 快捷键说明组件
// ============================================

export interface KeyboardShortcutsProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 快捷键说明组件
 */
export const VideoKeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  className,
}) => {
  const shortcuts = [
    { key: 'Space', description: '播放/暂停' },
    { key: '←', description: '后退5秒' },
    { key: '→', description: '前进5秒' },
    { key: '↑', description: '音量增加' },
    { key: '↓', description: '音量减少' },
    { key: 'M', description: '静音切换' },
    { key: 'F', description: '全屏切换' },
    { key: ',', description: '上一帧' },
    { key: '.', description: '下一帧' },
  ];

  return (
    <div className={`${styles.shortcuts} ${className || ''}`}>
      {shortcuts.map((shortcut) => (
        <div key={shortcut.key} className={styles.shortcutItem}>
          <kbd className={styles.shortcutKey}>{shortcut.key}</kbd>
          <span className={styles.shortcutDesc}>{shortcut.description}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// 导出
// ============================================

export default VideoControls;
