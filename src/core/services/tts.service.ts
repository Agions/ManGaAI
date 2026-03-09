/**
 * TTS (Text-to-Speech) 服务
 * 支持多种 TTS 提供商：Edge, Azure, 阿里云, 百度, 讯飞, CosyVoice
 */

import { message } from 'antd';
import type { TTSProvider, TTSVoice, TTSConfig, TTSRequest, TTSResponse, TTSStreamChunk } from '@/core/types';

// 默认 TTS 配置
export const DEFAULT_TTS_CONFIG: TTSConfig = {
  provider: 'edge',
  voice: 'zh-CN-XiaoxiaoNeural',
  speed: 1.0,
  pitch: 1.0,
  volume: 100,
  format: 'audio-24khz-48kbitrate-mono-mp3',
};

// 可用的音色列表
export const TTS_VOICES: Record<TTSProvider, TTSVoice[]> = {
  edge: [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', gender: 'female', language: 'zh-CN', provider: 'edge', style: 'newscast' },
    { id: 'zh-CN-YunxiNeural', name: '云希', gender: 'male', language: 'zh-CN', provider: 'edge', style: 'newscast' },
    { id: 'zh-CN-YunyangNeural', name: '云扬', gender: 'male', language: 'zh-CN', provider: 'edge', style: 'newscast' },
    { id: 'zh-CN-XiaoyiNeural', name: '小艺', gender: 'female', language: 'zh-CN', provider: 'edge', style: 'affectionate' },
    { id: 'zh-CN-YunhaoNeural', name: '云浩', gender: 'male', language: 'zh-CN', provider: 'edge', style: 'advertisement' },
    { id: 'zh-CN-XiaoxuanNeural', name: '小璇', gender: 'female', language: 'zh-CN', provider: 'edge', style: 'customerservice' },
    { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'female', language: 'en-US', provider: 'edge', style: 'newscast' },
    { id: 'en-US-GuyNeural', name: 'Guy', gender: 'male', language: 'en-US', provider: 'edge', style: 'newscast' },
  ],
  azure: [
    { id: 'zh-CN-XiaoxiaoAzureNeural', name: '晓晓', gender: 'female', language: 'zh-CN', provider: 'azure' },
    { id: 'zh-CN-YunxiAzureNeural', name: '云希', gender: 'male', language: 'zh-CN', provider: 'azure' },
    { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'female', language: 'en-US', provider: 'azure' },
  ],
  aliyun: [
    { id: 'xiaoyun', name: '云小朵', gender: 'female', language: 'zh-CN', provider: 'aliyun' },
    { id: 'xiaogang', name: '阿钢', gender: 'male', language: 'zh-CN', provider: 'aliyun' },
    { id: 'ruoxi', name: '若曦', gender: 'female', language: 'zh-CN', provider: 'aliyun' },
  ],
  baidu: [
    { id: '0', name: '度小美', gender: 'female', language: 'zh-CN', provider: 'baidu' },
    { id: '1', name: '度小宇', gender: 'male', language: 'zh-CN', provider: 'baidu' },
    { id: '3', name: '度米朵', gender: 'female', language: 'zh-CN', provider: 'baidu' },
    { id: '4', name: '阿靖小宇', gender: 'male', language: 'zh-CN', provider: 'baidu' },
  ],
  iflytek: [
    { id: 'xiaoyan', name: '小燕', gender: 'female', language: 'zh-CN', provider: 'iflytek' },
    { id: 'xiaoyu', name: '小宇', gender: 'male', language: 'zh-CN', provider: 'iflytek' },
    { id: 'catherine', name: 'Catherine', gender: 'female', language: 'en-US', provider: 'iflytek' },
  ],
  cosyvoice: [
    { id: 'cosyvoice-v2-emo-female-na', name: 'Emo 女生', gender: 'female', language: 'zh-CN', provider: 'cosyvoice' },
    { id: 'cosyvoice-v2-emo-male-na', name: 'Emo 男生', gender: 'male', language: 'zh-CN', provider: 'cosyvoice' },
  ],
};

class TTSService {
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * 获取指定提供商的所有音色
   */
  getVoices(provider: TTSProvider): TTSVoice[] {
    return TTS_VOICES[provider] || [];
  }

  /**
   * 获取所有可用的音色
   */
  getAllVoices(): TTSVoice[] {
    return Object.values(TTS_VOICES).flat();
  }

  /**
   * 根据 ID 获取音色
   */
  getVoiceById(id: string): TTSVoice | undefined {
    return this.getAllVoices().find(v => v.id === id);
  }

  /**
   * 生成语音
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const { text, config, signal } = request;

    if (!text || text.trim().length === 0) {
      throw new Error('文本内容不能为空');
    }

    switch (config.provider) {
      case 'edge':
        return this.edgeTTS(text, config, signal);
      case 'azure':
        return this.azureTTS(text, config, signal);
      case 'aliyun':
        return this.aliyunTTS(text, config, signal);
      case 'baidu':
        return this.baiduTTS(text, config, signal);
      case 'iflytek':
        return this.iflytekTTS(text, config, signal);
      case 'cosyvoice':
        return this.cosyvoiceTTS(text, config, signal);
      default:
        throw new Error(`不支持的 TTS 提供商: ${config.provider}`);
    }
  }

  /**
   * 流式生成语音
   */
  async *streamSynthesize(
    request: TTSRequest
  ): AsyncGenerator<TTSStreamChunk> {
    const { text, config, signal } = request;

    if (!text || text.trim().length === 0) {
      throw new Error('文本内容不能为空');
    }

    // 目前仅 Edge 和 Azure 支持流式
    switch (config.provider) {
      case 'edge':
        yield* this.edgeTTSStream(text, config, signal);
        break;
      case 'azure':
        yield* this.azureTTSStream(text, config, signal);
        break;
      default:
        // 其他提供商使用非流式
        const response = await this.synthesize(request);
        yield { audio: response.audio, isFinal: true };
    }
  }

  /**
   * 取消指定请求
   */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Edge TTS
   */
  private async edgeTTS(text: string, config: TTSConfig, signal?: AbortSignal): Promise<TTSResponse> {
    const endpoint = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';

    const voiceConfig = this.getVoiceById(config.voice);
    const style = voiceConfig?.style || 'newscast';

    const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="${config.voice}">
    <prosody rate="${config.speed - 1}" pitch="${(config.pitch - 1) * 50}%">
      <express-as style="${style}" styledegree="1">
        ${this.escapeSSML(text)}
      </express-as>
    </prosody>
  </voice>
</speak>`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'X-Timestamp': new Date().toISOString(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: ssml,
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge TTS 请求失败: ${response.status} - ${errorText}`);
    }

    const audio = await response.arrayBuffer();

    return {
      audio,
      duration: this.estimateDuration(text, config.speed),
      size: audio.byteLength,
      format: config.format,
    };
  }

  /**
   * Edge TTS 流式
   */
  private async *edgeTTSStream(
    text: string,
    config: TTSConfig,
    signal?: AbortSignal
  ): AsyncGenerator<TTSStreamChunk> {
    // Edge TTS 目前不支持真正的流式，我们分段处理
    const maxCharsPerChunk = 500;
    const chunks = this.splitText(text, maxCharsPerChunk);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isFinal = i === chunks.length - 1;

      const response = await this.edgeTTS(chunk, config, signal);

      yield {
        audio: response.audio,
        isFinal,
      };
    }
  }

  /**
   * Azure TTS
   */
  private async azureTTS(text: string, config: TTSConfig, signal?: AbortSignal): Promise<TTSResponse> {
    // Azure TTS 需要 API Key，这里使用模拟实现
    message.warning('Azure TTS 需要配置 API Key，当前使用 Edge TTS');
    return this.edgeTTS(text, config, signal);
  }

  /**
   * Azure TTS 流式
   */
  private async *azureTTSStream(
    text: string,
    config: TTSConfig,
    signal?: AbortSignal
  ): AsyncGenerator<TTSStreamChunk> {
    yield* this.edgeTTSStream(text, config, signal);
  }

  /**
   * 阿里云 TTS
   */
  private async aliyunTTS(text: string, config: TTSConfig, signal?: AbortSignal): Promise<TTSResponse> {
    // 阿里云 TTS 需要 API Key，这里使用模拟实现
    message.warning('阿里云 TTS 需要配置 API Key，当前使用 Edge TTS');
    return this.edgeTTS(text, config, signal);
  }

  /**
   * 百度 TTS
   */
  private async baiduTTS(text: string, config: TTSConfig, signal?: AbortSignal): Promise<TTSResponse> {
    // 百度 TTS 需要 API Key，这里使用模拟实现
    message.warning('百度 TTS 需要配置 API Key，当前使用 Edge TTS');
    return this.edgeTTS(text, config, signal);
  }

  /**
   * 讯飞 TTS
   */
  private async iflytekTTS(text: string, config: TTSConfig, signal?: AbortSignal): Promise<TTSResponse> {
    // 讯飞 TTS 需要 API Key，这里使用模拟实现
    message.warning('讯飞 TTS 需要配置 API Key，当前使用 Edge TTS');
    return this.edgeTTS(text, config, signal);
  }

  /**
   * CosyVoice TTS
   */
  private async cosyvoiceTTS(text: string, config: TTSConfig, signal?: AbortSignal): Promise<TTSResponse> {
    // CosyVoice 需要 API Key，这里使用模拟实现
    message.warning('CosyVoice TTS 需要配置 API Key，当前使用 Edge TTS');
    return this.edgeTTS(text, config, signal);
  }

  /**
   * 保存音频到文件
   */
  async saveAudio(audio: ArrayBuffer, filename: string): Promise<void> {
    const blob = new Blob([audio], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 估算音频时长
   */
  private estimateDuration(text: string, speed: number): number {
    // 假设中文每字 0.3 秒，英文每词 0.2 秒
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

    const baseDuration = chineseChars * 0.3 + englishWords * 0.2;
    return baseDuration / speed;
  }

  /**
   * 转义 SSML 特殊字符
   */
  private escapeSSML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 分割文本为小块
   */
  private splitText(text: string, maxLength: number): string[] {
    const sentences = text.split(/([。！？.!?])/);
    const chunks: string[] = [];
    let current = '';

    for (const part of sentences) {
      if (current.length + part.length > maxLength) {
        if (current) {
          chunks.push(current);
          current = '';
        }
        // 如果单个句子超长，强制分割
        if (part.length > maxLength) {
          for (let i = 0; i < part.length; i += maxLength) {
            chunks.push(part.slice(i, i + maxLength));
          }
        } else {
          current = part;
        }
      } else {
        current += part;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks.length > 0 ? chunks : [text];
  }
}

export const ttsService = new TTSService();
export default ttsService;
