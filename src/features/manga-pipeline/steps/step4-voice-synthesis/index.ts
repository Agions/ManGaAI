// Services
export { assignVoices } from './services/assigner';
export type { VoiceAssignment, VoiceProfile } from './services/assigner';
export {
  generateDialogueTTS,
  synthesizeSegmentAudio,
  synthesizeAllDialogueAudio,
} from './services/tts-generator';
export type { DialogueSegment, TTSGenerationResult } from './services/tts-generator';
export { selectBGM } from './services/bgm';
export type { BGMSelection, BGMTrack } from './services/bgm';

// Pipeline
export { VoiceSynthesisPipeline } from './pipeline-controller';
export type { VoiceSynthesisResult } from './pipeline-controller';
