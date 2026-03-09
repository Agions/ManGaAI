import { audioPipelineService } from '@/core/services/audio-pipeline.service';
import { ttsService } from '@/core/services/tts.service';

jest.mock('@/core/services/tts.service', () => ({
  DEFAULT_TTS_CONFIG: {
    provider: 'edge',
    voice: 'zh-CN-XiaoxiaoNeural',
    speed: 1,
    pitch: 1,
    volume: 100,
    format: 'audio-24khz-48kbitrate-mono-mp3',
  },
  TTS_VOICES: {
    edge: [
      { id: 'zh-CN-XiaoxiaoNeural' },
      { id: 'zh-CN-YunxiNeural' },
    ],
  },
  ttsService: {
    synthesize: jest.fn(),
  },
}));

describe('audioPipelineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  });

  it('should extract dialogue lines', () => {
    const script = '林雨晴：你好\n王思远:早上好\n旁白：他们在雨中重逢';
    const lines = audioPipelineService.extractDialogueLines(script);

    expect(lines.length).toBe(3);
    expect(lines[0].speaker).toBe('林雨晴');
    expect(lines[1].speaker).toBe('王思远');
  });

  it('should generate voice tracks', async () => {
    (ttsService.synthesize as jest.Mock).mockResolvedValue({
      audio: new ArrayBuffer(128),
      duration: 2.3,
      size: 128,
      format: 'mp3',
    });

    const result = await audioPipelineService.generateVoiceTracks('林雨晴：你好\n王思远：欢迎回来', {
      id: 'a1',
      title: '测试',
      summary: '摘要',
      characters: [
        { name: '林雨晴', role: 'main', traits: [] },
        { name: '王思远', role: 'main', traits: [] },
      ],
      conflictPoints: [],
      chapters: [],
      createdAt: new Date().toISOString(),
    });

    expect(result.voiceTracks.length).toBe(2);
    expect(result.failedLines.length).toBe(0);
    expect(result.voiceTracks[0].fileUrl).toBe('blob:mock-url');
  });
});
