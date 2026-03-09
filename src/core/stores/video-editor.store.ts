/**
 * 视频编辑器状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoInfo } from '@/core/types';

// 播放状态
export type PlaybackStatus = 'playing' | 'paused' | 'stopped';

// 时间线项类型
export type TimelineItemType = 'video' | 'audio' | 'subtitle' | 'image';

// 时间线项
export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  name: string;
  sourceId?: string; // 对应的源素材ID
  startTime: number;  // 在时间线上的开始时间（毫秒）
  duration: number;   // 持续时间（毫秒）
  trimStart: number;  // 裁剪开始时间
  trimEnd: number;   // 裁剪结束时间
  volume?: number;   // 音量 0-100
  opacity?: number;  // 透明度 0-100
  effects?: TimelineEffect[];
}

// 转场效果
export interface TimelineEffect {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number;
  params?: Record<string, unknown>;
}

// 字幕项
export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    position?: 'top' | 'bottom' | 'center';
  };
}

// 视频标记点
export interface VideoMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

// 选区
export interface Selection {
  start: number;
  end: number;
}

// 视频编辑器状态
export interface VideoEditorState {
  // 当前视频
  currentVideo: VideoInfo | null;

  // 播放状态
  playbackStatus: PlaybackStatus;
  currentTime: number;      // 当前播放时间（毫秒）
  volume: number;          // 音量 0-100
  isMuted: boolean;
  playbackRate: number;     // 播放速率

  // 时间线
  timelineItems: TimelineItem[];
  duration: number;         // 总时长（毫秒）
  zoom: number;            // 缩放比例

  // 字幕
  subtitles: SubtitleItem[];
  subtitleEnabled: boolean;

  // 标记
  markers: VideoMarker[];

  // 选区
  selection: Selection | null;
  selectedItems: string[];

  // 工具
  currentTool: 'select' | 'cut' | 'trim' | 'text';

  // 撤销/重做
  history: TimelineItem[][];
  historyIndex: number;

  // 视图
  visibleTimeRange: { start: number; end: number };

  // Actions - 播放控制
  setCurrentVideo: (video: VideoInfo | null) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;

  // Actions - 时间线
  addTimelineItem: (item: Omit<TimelineItem, 'id'>) => string;
  removeTimelineItem: (id: string) => void;
  updateTimelineItem: (id: string, updates: Partial<TimelineItem>) => void;
  moveTimelineItem: (id: string, newStartTime: number) => void;
  splitTimelineItem: (id: string, time: number) => void;
  duplicateTimelineItem: (id: string) => void;

  // Actions - 字幕
  addSubtitle: (subtitle: Omit<SubtitleItem, 'id'>) => string;
  removeSubtitle: (id: string) => void;
  updateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  toggleSubtitles: () => void;

  // Actions - 标记
  addMarker: (marker: Omit<VideoMarker, 'id'>) => string;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<VideoMarker>) => void;

  // Actions - 选择
  setSelection: (selection: Selection | null) => void;
  setSelectedItems: (ids: string[]) => void;
  clearSelection: () => void;

  // Actions - 工具
  setCurrentTool: (tool: VideoEditorState['currentTool']) => void;

  // Actions - 缩放
  setZoom: (zoom: number) => void;
  setVisibleTimeRange: (range: { start: number; end: number }) => void;

  // Actions - 撤销/重做
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;

  // Actions - 重置
  resetEditor: () => void;
}

const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const MAX_HISTORY = 50;

export const useVideoEditorStore = create<VideoEditorState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentVideo: null,
      playbackStatus: 'stopped',
      currentTime: 0,
      volume: 100,
      isMuted: false,
      playbackRate: 1,

      timelineItems: [],
      duration: 0,
      zoom: 1,

      subtitles: [],
      subtitleEnabled: true,

      markers: [],

      selection: null,
      selectedItems: [],

      currentTool: 'select',

      history: [[]],
      historyIndex: 0,

      visibleTimeRange: { start: 0, end: 60000 },

      // 播放控制
      setCurrentVideo: (video) => {
        set({
          currentVideo: video,
          currentTime: 0,
          playbackStatus: 'stopped',
          timelineItems: [],
          duration: video?.duration || 0,
        });
      },

      play: () => set({ playbackStatus: 'playing' }),
      pause: () => set({ playbackStatus: 'paused' }),
      stop: () => set({ playbackStatus: 'stopped', currentTime: 0 }),

      seek: (time) => {
        const { duration } = get();
        set({ currentTime: Math.max(0, Math.min(time, duration)) });
      },

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
      toggleMute: () => set(state => ({ isMuted: !state.isMuted })),
      setPlaybackRate: (rate) => set({ playbackRate: rate }),

      // 时间线操作
      addTimelineItem: (item) => {
        const id = generateId();
        const newItem = { ...item, id };

        set(state => {
          const newItems = [...state.timelineItems, newItem];
          const newDuration = Math.max(state.duration, item.startTime + item.duration);

          return {
            timelineItems: newItems,
            duration: newDuration,
          };
        });

        get().saveToHistory();
        return id;
      },

      removeTimelineItem: (id) => {
        set(state => ({
          timelineItems: state.timelineItems.filter(item => item.id !== id),
          selectedItems: state.selectedItems.filter(itemId => itemId !== id),
        }));
        get().saveToHistory();
      },

      updateTimelineItem: (id, updates) => {
        set(state => ({
          timelineItems: state.timelineItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
        get().saveToHistory();
      },

      moveTimelineItem: (id, newStartTime) => {
        const { timelineItems } = get();
        const item = timelineItems.find(i => i.id === id);
        if (!item) return;

        const offset = newStartTime - item.startTime;

        set(state => ({
          timelineItems: state.timelineItems.map(i =>
            i.id === id
              ? { ...i, startTime: Math.max(0, newStartTime) }
              : i
          ),
        }));
        get().saveToHistory();
      },

      splitTimelineItem: (id, time) => {
        const { timelineItems } = get();
        const item = timelineItems.find(i => i.id === id);
        if (!item) return;

        const relativeTime = time - item.startTime;
        if (relativeTime <= 0 || relativeTime >= item.duration) return;

        const newId1 = generateId();
        const newId2 = generateId();

        const part1: TimelineItem = {
          ...item,
          id: newId1,
          duration: relativeTime,
          trimEnd: item.trimStart + relativeTime,
        };

        const part2: TimelineItem = {
          ...item,
          id: newId2,
          startTime: item.startTime + relativeTime,
          duration: item.duration - relativeTime,
          trimStart: item.trimStart + relativeTime,
        };

        set(state => ({
          timelineItems: [
            ...state.timelineItems.filter(i => i.id !== id),
            part1,
            part2,
          ],
        }));
        get().saveToHistory();
      },

      duplicateTimelineItem: (id) => {
        const { timelineItems } = get();
        const item = timelineItems.find(i => i.id === id);
        if (!item) return;

        const newId = generateId();
        const newItem: TimelineItem = {
          ...item,
          id: newId,
          name: `${item.name} (副本)`,
          startTime: item.startTime + item.duration,
        };

        set(state => ({
          timelineItems: [...state.timelineItems, newItem],
        }));
        get().saveToHistory();
      },

      // 字幕操作
      addSubtitle: (subtitle) => {
        const id = generateId();
        set(state => ({
          subtitles: [...state.subtitles, { ...subtitle, id }],
        }));
        get().saveToHistory();
        return id;
      },

      removeSubtitle: (id) => {
        set(state => ({
          subtitles: state.subtitles.filter(s => s.id !== id),
        }));
        get().saveToHistory();
      },

      updateSubtitle: (id, updates) => {
        set(state => ({
          subtitles: state.subtitles.map(s =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
        get().saveToHistory();
      },

      toggleSubtitles: () => set(state => ({ subtitleEnabled: !state.subtitleEnabled })),

      // 标记操作
      addMarker: (marker) => {
        const id = generateId();
        set(state => ({
          markers: [...state.markers, { ...marker, id }],
        }));
        return id;
      },

      removeMarker: (id) => {
        set(state => ({
          markers: state.markers.filter(m => m.id !== id),
        }));
      },

      updateMarker: (id, updates) => {
        set(state => ({
          markers: state.markers.map(m =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      // 选择操作
      setSelection: (selection) => set({ selection }),
      setSelectedItems: (ids) => set({ selectedItems: ids }),
      clearSelection: () => set({ selection: null, selectedItems: [] }),

      // 工具
      setCurrentTool: (tool) => set({ currentTool: tool }),

      // 缩放
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
      setVisibleTimeRange: (range) => set({ visibleTimeRange: range }),

      // 撤销/重做
      saveToHistory: () => {
        const { timelineItems, history, historyIndex } = get();

        // 截断历史
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...timelineItems]);

        // 限制历史长度
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        set({
          timelineItems: [...history[newIndex]],
          historyIndex: newIndex,
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        set({
          timelineItems: [...history[newIndex]],
          historyIndex: newIndex,
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // 重置
      resetEditor: () => {
        set({
          currentVideo: null,
          playbackStatus: 'stopped',
          currentTime: 0,
          timelineItems: [],
          duration: 0,
          subtitles: [],
          markers: [],
          selection: null,
          selectedItems: [],
          history: [[]],
          historyIndex: 0,
        });
      },
    }),
    {
      name: 'mangaai-video-editor-storage',
      partialize: (state) => ({
        zoom: state.zoom,
        volume: state.volume,
        isMuted: state.isMuted,
        playbackRate: state.playbackRate,
        subtitleEnabled: state.subtitleEnabled,
      }),
    }
  )
);

export default useVideoEditorStore;
