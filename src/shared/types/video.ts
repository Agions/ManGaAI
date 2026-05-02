// Video-related types extracted from index.ts

export interface VideoInfo {
  id: string;
  path: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  size: number;
  thumbnail?: string;
  createdAt: string;
}

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  thumbnail: string;
  description?: string;
  tags: string[];
  type?: string;
  confidence?: number;
  features?: any;
  objectCount?: number;
  dominantEmotion?: string;
}

export interface Keyframe {
  id: string;
  timestamp: number;
  thumbnail: string;
  description?: string;
}

export interface ObjectDetection {
  id: string;
  sceneId: string;
  category: string;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

export interface EmotionAnalysis {
  id: string;
  sceneId: string;
  timestamp: number;
  emotions: Array<{
    id: string;
    name: string;
    score: number;
  }>;
  dominant: string;
  intensity: number;
}

// Simple emotion tag used in video analysis
export interface Emotion {
  timestamp: number;
  type: string;
  intensity: number;
}

export interface KeyMoment {
  time: number;
  description: string;
  type: 'action' | 'transition' | 'highlight';
  importance?: number;
  timestamp?: number;
}

export interface VideoAnalysis {
  id: string;
  videoId: string;
  title?: string;
  duration?: number;
  scenes: Scene[];
  keyframes: Keyframe[];
  objects: ObjectDetection[];
  keyMoments?: KeyMoment[];
  emotions: EmotionAnalysis[];
  summary: string;
  stats?: {
    sceneCount: number;
    objectCount: number;
    avgSceneDuration: number;
    sceneTypes: Record<string, number>;
    objectCategories: Record<string, number>;
    dominantEmotions: Record<string, number>;
  };
  createdAt: string;
}
