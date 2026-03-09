/**
 * 配音流水线服务（C2）
 */

import { ttsService, DEFAULT_TTS_CONFIG, TTS_VOICES } from './tts.service';
import { costService } from './cost.service';
import type { StoryAnalysis, TTSConfig } from '@/core/types';

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  index: number;
}

export interface GeneratedVoiceTrack {
  id: string;
  name: string;
  filePath: string;
  fileUrl?: string;
  duration: number;
  startTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  type: 'dubbing' | 'voiceover';
}

export interface AudioPipelineResult {
  voiceTracks: GeneratedVoiceTrack[];
  characterVoiceMap: Record<string, string>;
  failedLines: DialogueLine[];
}

export interface AudioPipelineOptions {
  maxLines?: number;
  ttsConfig?: Partial<TTSConfig>;
  projectId?: string;
}

const narratorAlias = ['旁白', 'narrator', '解说'];

class AudioPipelineService {
  extractDialogueLines(scriptText: string, maxLines = 50): DialogueLine[] {
    if (!scriptText.trim()) return [];

    const lines: DialogueLine[] = [];
    const sourceLines = scriptText.split(/\n+/);

    sourceLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 角色：台词
      const match = trimmed.match(/^([^：:]{1,18})[：:]\s*(.+)$/);
      if (match) {
        lines.push({
          id: `dlg_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          speaker: match[1].trim(),
          text: match[2].trim(),
          index: idx,
        });
        return;
      }

      // 引号对白，默认给旁白
      const quoteMatch = trimmed.match(/[“\"](.+?)[”\"]/);
      if (quoteMatch) {
        lines.push({
          id: `dlg_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          speaker: '旁白',
          text: quoteMatch[1].trim(),
          index: idx,
        });
      }
    });

    return lines.slice(0, maxLines);
  }

  async generateVoiceTracks(
    scriptText: string,
    analysis?: StoryAnalysis | null,
    options: AudioPipelineOptions = {}
  ): Promise<AudioPipelineResult> {
    const maxLines = options.maxLines ?? 30;
    const lines = this.extractDialogueLines(scriptText, maxLines);

    const characterVoiceMap = this.buildCharacterVoiceMap(lines, analysis);
    const voiceTracks: GeneratedVoiceTrack[] = [];
    const failedLines: DialogueLine[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const selectedVoice = characterVoiceMap[line.speaker] || DEFAULT_TTS_CONFIG.voice;
      const config: TTSConfig = {
        ...DEFAULT_TTS_CONFIG,
        ...options.ttsConfig,
        voice: selectedVoice,
      };

      try {
        const response = await ttsService.synthesize({ text: line.text, config });
        const blob = new Blob([response.audio], { type: 'audio/mp3' });
        const fileUrl = URL.createObjectURL(blob);

        voiceTracks.push({
          id: `voice_${line.id}`,
          name: `${line.speaker}_${i + 1}`,
          filePath: '',
          fileUrl,
          duration: response.duration,
          startTime: Math.max(i * 2.5, 0),
          volume: 80,
          fadeIn: 0,
          fadeOut: 0,
          type: narratorAlias.includes(line.speaker.toLowerCase()) ? 'voiceover' : 'dubbing',
        });
        costService.recordAudioCost(config.provider, response.duration, {
          operation: 'tts_voice_track',
          speaker: line.speaker,
          projectId: options.projectId
        });
      } catch {
        failedLines.push(line);
      }
    }

    return { voiceTracks, characterVoiceMap, failedLines };
  }

  private buildCharacterVoiceMap(lines: DialogueLine[], analysis?: StoryAnalysis | null): Record<string, string> {
    const voices = TTS_VOICES.edge;
    const map: Record<string, string> = {};
    const speakers = new Set<string>(lines.map(item => item.speaker));

    if (analysis?.characters?.length) {
      analysis.characters.forEach((character, index) => {
        if (speakers.has(character.name)) {
          map[character.name] = voices[index % voices.length]?.id || DEFAULT_TTS_CONFIG.voice;
        }
      });
    }

    [...speakers].forEach((speaker, index) => {
      if (!map[speaker]) {
        map[speaker] = voices[index % voices.length]?.id || DEFAULT_TTS_CONFIG.voice;
      }
    });

    return map;
  }
}

export const audioPipelineService = new AudioPipelineService();
export default AudioPipelineService;
