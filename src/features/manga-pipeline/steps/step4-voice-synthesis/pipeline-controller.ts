import {
  PipelineStep,
  StepInput,
  StepOutput,
  CheckpointState,
} from '../../../../core/pipeline/step.interface';
import { Script } from '../step1-script-generation/types/script';

import { assignVoices, VoiceAssignment } from './services/assigner';
import { selectBGM, BGMSelection } from './services/bgm';
import {
  generateDialogueTTS,
  DialogueSegment,
  synthesizeAllDialogueAudio,
} from './services/tts-generator';

export interface VoiceSynthesisResult {
  script: Script;
  voiceAssignments: VoiceAssignment[];
  dialogueSegments: DialogueSegment[];
  bgmSelections: BGMSelection[];
  totalDuration: number; // 总时长（秒）
  metadata: {
    generatedAt: number;
    ttsEngine: string;
    voiceCount: number;
    synthesizedCount: number;
    failedCount: number;
  };
}

export class VoiceSynthesisPipeline implements PipelineStep<VoiceSynthesisResult> {
  id = 'voice-synthesis';
  name = 'Voice Synthesis';

  private _checkpoint: CheckpointState<VoiceSynthesisResult> | null = null;
  private _progress: number = 0;
  onProgress?: (event: { stepId: string; progress: number; message: string }) => void;

  setProgressHandler(handler: typeof this.onProgress) {
    this.onProgress = handler;
  }

  private reportProgress(progress: number, message: string) {
    this._progress = progress;
    this.onProgress?.({ stepId: this.id, progress, message });
  }

  async execute(input: StepInput): Promise<StepOutput> {
    return this.process(input);
  }

  async process(input: StepInput): Promise<StepOutput> {
    const { script } = input as StepInput & { script: Script };

    // Step 1: 音色分配
    this.reportProgress(0, '分配音色');
    const voiceAssignments = assignVoices(script.characters);
    this.reportProgress(20, '分配音色');

    // Step 2: 生成 TTS 配音序列
    this.reportProgress(20, '生成配音序列');
    const { segments, totalDuration } = generateDialogueTTS(script, voiceAssignments);
    this.reportProgress(40, '生成配音序列');

    // Step 3: 使用 Edge-TTS 合成真实音频
    this.reportProgress(40, '合成语音');
    const synthesizedSegments = await synthesizeAllDialogueAudio(segments);
    this.reportProgress(70, '合成语音');

    // 统计合成结果
    const synthesizedCount = synthesizedSegments.filter((s) => s.status === 'done').length;
    const failedCount = synthesizedSegments.filter((s) => s.status === 'failed').length;

    // 计算实际总时长（使用实际生成的音频时长）
    const actualTotalDuration = synthesizedSegments.reduce((sum, seg) => {
      return sum + (seg.duration || seg.endTime - seg.startTime);
    }, 0);

    // Step 4: 选择 BGM
    this.reportProgress(70, '选择背景音乐');
    const bgmSelections = selectBGM(script.scenes);
    this.reportProgress(90, '选择背景音乐');

    this.reportProgress(95, '封装结果');
    this.reportProgress(100, '完成');
    const result: VoiceSynthesisResult = {
      script,
      voiceAssignments,
      dialogueSegments: synthesizedSegments,
      bgmSelections,
      totalDuration: actualTotalDuration || totalDuration,
      metadata: {
        generatedAt: Date.now(),
        ttsEngine: 'edge-tts',
        voiceCount: voiceAssignments.length,
        synthesizedCount,
        failedCount,
      },
    };

    return { voiceSynthesis: result } as StepOutput;
  }

  getCheckpoint() {
    return this._checkpoint;
  }

  restore(state: CheckpointState<VoiceSynthesisResult>) {
    this._checkpoint = state;
  }
}
