export type CameraType = '远景' | '全景' | '中景' | '近景' | '特写';
export type TransitionType = '淡入' | '淡出' | '切换' | '溶解' | '黑场';

export interface Scene {
  id: string;
  location: string;
  timeOfDay: '早晨' | '上午' | '下午' | '傍晚' | '夜晚';
  weather?: string;
  characters: string[];
  type: '对话' | '动作' | '追逐' | '对峙' | '情感' | '独白';
  cameraHint: CameraType;
  transition?: TransitionType;
  emotion: string;
  content: string; // 场景描述 + 对话
}
