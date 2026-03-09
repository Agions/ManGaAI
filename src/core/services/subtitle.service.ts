/**
 * 字幕生成服务
 * 提供智能字幕生成功能，支持语音转文字、字幕格式转换、样式设置
 */

import { v4 as uuidv4 } from 'uuid';
import { aiService } from './ai.service';
import type { ScriptSegment } from '@/core/types';

// 字幕格式类型
export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'txt';

// 字幕样式配置
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  outline: number;
  outlineColor: string;
  shadow: number;
  alignment: 'left' | 'center' | 'right' | 'top' | 'bottom';
  margin: number;
  position: 'top' | 'middle' | 'bottom';
}

// 字幕条目
export interface SubtitleItem {
  id: string;
  index: number;
  startTime: number;  // 秒
  endTime: number;    // 秒
  text: string;
  style?: Partial<SubtitleStyle>;
}

// 字幕轨道
export interface SubtitleTrack {
  id: string;
  name: string;
  language: string;
  items: SubtitleItem[];
  style: SubtitleStyle;
  format: SubtitleFormat;
}

// 默认字幕样式
export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Microsoft YaHei, SimHei, Arial',
  fontSize: 24,
  fontColor: '#FFFFFF',
  backgroundColor: '#000000',
  outline: 2,
  outlineColor: '#000000',
  shadow: 0,
  alignment: 'center',
  margin: 10,
  position: 'bottom',
};

// ASS 样式预设
export const ASS_STYLE_PRESETS: Record<string, Partial<SubtitleStyle>> = {
  default: {},
  karaoke: {
    fontSize: 28,
    fontColor: '#FFFF00',
    outline: 1,
  },
  cinema: {
    fontSize: 32,
    fontColor: '#FFFFFF',
    backgroundColor: '#80000000',
    outline: 3,
  },
  minimal: {
    fontSize: 20,
    fontColor: '#FFFFFF',
    outline: 0,
    shadow: 2,
  },
};

class SubtitleService {
  /**
   * 从脚本生成字幕
   */
  generateFromScript(
    segments: ScriptSegment[],
    style: Partial<SubtitleStyle> = {}
  ): SubtitleTrack {
    const items: SubtitleItem[] = segments.map((segment, index) => ({
      id: segment.id || uuidv4(),
      index: index + 1,
      startTime: segment.startTime,
      endTime: segment.endTime,
      text: this.processText(segment.content),
    }));

    return {
      id: uuidv4(),
      name: '字幕轨道',
      language: 'zh-CN',
      items,
      style: { ...DEFAULT_SUBTITLE_STYLE, ...style },
      format: 'srt',
    };
  }

  /**
   * 从文本生成字幕（手动时间轴）
   */
  generateFromText(
    text: string,
    timeframes: Array<{ start: number; end: number; text: string }>,
    style: Partial<SubtitleStyle> = {}
  ): SubtitleTrack {
    const items: SubtitleItem[] = timeframes.map((frame, index) => ({
      id: uuidv4(),
      index: index + 1,
      startTime: frame.start,
      endTime: frame.end,
      text: this.processText(frame.text),
    }));

    return {
      id: uuidv4(),
      name: '字幕轨道',
      language: 'zh-CN',
      items,
      style: { ...DEFAULT_SUBTITLE_STYLE, ...style },
      format: 'srt',
    };
  }

  /**
   * 使用 AI 生成字幕（从音频/视频）
   */
  async generateFromVideo(
    videoText: string,
    duration: number,
    style: Partial<SubtitleStyle> = {}
  ): Promise<SubtitleTrack> {
    try {
      // 使用 AI 理解视频内容并生成字幕
      const prompt = `请为以下视频内容生成分段字幕。

视频总时长：${this.formatTime(duration)}

视频内容描述：
${videoText}

请生成字幕分段，每个片段约 3-5 秒。

返回格式要求：
- 每行一个字幕片段
- 格式：时间点|字幕文本
- 时间点使用秒数，如：0-5|这是第一条字幕

确保字幕：
1. 每行长度适中（约 20-30 字）
2. 语义完整
3. 适当断句`;

      const result = await aiService.generate(prompt, {
        model: 'gpt-3.5-turbo',
        provider: 'openai',
      });

      // 解析 AI 返回的结果
      const timeframes = this.parseAIGeneratedSubtitles(result, duration);

      return this.generateFromText('', timeframes, style);
    } catch (error) {
      console.error('AI 字幕生成失败:', error);
      // 返回空字幕轨道
      return {
        id: uuidv4(),
        name: '字幕轨道',
        language: 'zh-CN',
        items: [],
        style: { ...DEFAULT_SUBTITLE_STYLE, ...style },
        format: 'srt',
      };
    }
  }

  /**
   * 翻译字幕
   */
  async translateSubtitles(
    track: SubtitleTrack,
    targetLanguage: string
  ): Promise<SubtitleTrack> {
    const translatedItems: SubtitleItem[] = [];

    for (const item of track.items) {
      try {
        const prompt = `请翻译以下字幕到 ${targetLanguage}：

${item.text}

请直接返回翻译后的文本，不要添加任何解释。`;

        const translated = await aiService.generate(prompt, {
          model: 'gpt-3.5-turbo',
          provider: 'openai',
        });

        translatedItems.push({
          ...item,
          id: uuidv4(),
          text: translated.trim(),
        });
      } catch (error) {
        console.error(`翻译字幕 ${item.index} 失败:`, error);
        translatedItems.push(item);
      }
    }

    return {
      ...track,
      id: uuidv4(),
      name: `${track.name} (${targetLanguage})`,
      language: targetLanguage,
      items: translatedItems,
    };
  }

  /**
   * 导出字幕
   */
  exportSubtitles(track: SubtitleTrack, format?: SubtitleFormat): string {
    const outputFormat = format || track.format;

    switch (outputFormat) {
      case 'srt':
        return this.exportSRT(track);
      case 'vtt':
        return this.exportVTT(track);
      case 'ass':
        return this.exportASS(track);
      case 'txt':
        return this.exportTXT(track);
      default:
        return this.exportSRT(track);
    }
  }

  /**
   * 导出 SRT 格式
   */
  private exportSRT(track: SubtitleTrack): string {
    return track.items
      .map(item => {
        return `${item.index}\n${this.formatSRTTime(item.startTime)} --> ${this.formatSRTTime(item.endTime)}\n${item.text}\n`;
      })
      .join('\n');
  }

  /**
   * 导出 VTT 格式
   */
  private exportVTT(track: SubtitleTrack): string {
    const header = 'WEBVTT\n\n';
    const content = track.items
      .map(item => {
        const position = this.getVTTPosition(track.style.position, track.style.margin);
        return `${this.formatVTTTime(item.startTime)} --> ${this.formatVTTTime(item.endTime)}${position}\n${item.text}\n`;
      })
      .join('\n');

    return header + content;
  }

  /**
   * 导出 ASS 格式
   */
  private exportASS(track: SubtitleTrack): string {
    const style = track.style;
    const header = `[Script Info]
Title: ${track.name}
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},${this.assColor(style.fontColor)},&H00FFFFFF,${this.assColor(style.outlineColor)},${this.assColor(style.backgroundColor)},0,0,0,0,100,100,0,0,1,${style.outline},${style.shadow},${this.assAlignment(style.alignment)},10,10,${style.margin},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = track.items
      .map(item => {
        return `Dialogue: 0,${this.formatASSTime(item.startTime)},${this.formatASSTime(item.endTime)},Default,,0,0,0,,${item.text}`;
      })
      .join('\n');

    return header + events;
  }

  /**
   * 导出纯文本格式
   */
  private exportTXT(track: SubtitleTrack): string {
    return track.items.map(item => item.text).join('\n');
  }

  /**
   * 解析 SRT 字幕
   */
  parseSRT(content: string): SubtitleTrack {
    const items: SubtitleItem[] = [];
    const blocks = content.trim().split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;

      const index = parseInt(lines[0], 10);
      const timeMatch = lines[1].match(
        /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
      );

      if (!timeMatch) continue;

      const startTime = this.parseSRTTime(timeMatch[1]);
      const endTime = this.parseSRTTime(timeMatch[2]);
      const text = lines.slice(2).join('\n');

      items.push({
        id: uuidv4(),
        index,
        startTime,
        endTime,
        text,
      });
    }

    return {
      id: uuidv4(),
      name: '导入的字幕',
      language: 'zh-CN',
      items,
      style: DEFAULT_SUBTITLE_STYLE,
      format: 'srt',
    };
  }

  /**
   * 解析 VTT 字幕
   */
  parseVTT(content: string): SubtitleTrack {
    const items: SubtitleItem[] = [];
    const lines = content.split('\n');
    let index = 0;
    let currentItem: Partial<SubtitleItem> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('-->')) {
        const timeMatch = line.match(
          /(\d{2}:\d{2}:\d{2}[,.]\d{3}|\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3}|\d{2}:\d{2}[,.]\d{3})/
        );

        if (timeMatch) {
          currentItem = {
            id: uuidv4(),
            index: ++index,
            startTime: this.parseVTTTime(timeMatch[1]),
            endTime: this.parseVTTTime(timeMatch[2]),
            text: '',
          };
        }
      } else if (currentItem && line) {
        currentItem.text = currentItem.text ? `${currentItem.text}\n${line}` : line;

        // 检查下一行是否还是字幕
        if (i + 1 >= lines.length || !lines[i + 1].trim() || lines[i + 1].includes('-->')) {
          if (currentItem.text) {
            items.push(currentItem as SubtitleItem);
          }
          currentItem = null;
        }
      }
    }

    return {
      id: uuidv4(),
      name: '导入的字幕',
      language: 'zh-CN',
      items,
      style: DEFAULT_SUBTITLE_STYLE,
      format: 'vtt',
    };
  }

  /**
   * 导入字幕（自动检测格式）
   */
  importSubtitles(content: string, filename?: string): SubtitleTrack {
    const ext = filename?.split('.').pop()?.toLowerCase();

    if (ext === 'vtt' || content.startsWith('WEBVTT')) {
      return this.parseVTT(content);
    }

    return this.parseSRT(content);
  }

  /**
   * 调整字幕时间
   */
  adjustTiming(
    track: SubtitleTrack,
    offset: number,
    scale: number = 1
  ): SubtitleTrack {
    return {
      ...track,
      id: uuidv4(),
      items: track.items.map(item => ({
        ...item,
        id: uuidv4(),
        startTime: Math.max(0, item.startTime * scale + offset),
        endTime: Math.max(0, item.endTime * scale + offset),
      })),
    };
  }

  /**
   * 合并字幕轨道
   */
  mergeTracks(tracks: SubtitleTrack[]): SubtitleTrack {
    const mergedItems: SubtitleItem[] = [];
    let globalIndex = 1;

    for (const track of tracks) {
      for (const item of track.items) {
        mergedItems.push({
          ...item,
          id: uuidv4(),
          index: globalIndex++,
        });
      }
    }

    return {
      id: uuidv4(),
      name: '合并字幕',
      language: 'zh-CN',
      items: mergedItems,
      style: DEFAULT_SUBTITLE_STYLE,
      format: 'srt',
    };
  }

  /**
   * 处理文本（添加标点、格式化）
   */
  private processText(text: string): string {
    // 移除多余空白
    let processed = text.replace(/\s+/g, ' ').trim();

    // 自动添加标点（简单规则）
    if (!/[。！？.!?]$/.test(processed)) {
      // 末尾没有标点，添加句号
    }

    return processed;
  }

  /**
   * 解析 AI 生成的字幕
   */
  private parseAIGeneratedSubtitles(text: string, duration: number): Array<{ start: number; end: number; text: string }> {
    const timeframes: Array<{ start: number; end: number; text: string }> = [];
    const lines = text.split('\n');

    let currentTime = 0;
    const avgDuration = 4; // 平均每个字幕 4 秒

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 尝试解析 "时间点|文本" 格式
      const pipeMatch = trimmed.match(/(\d+)-(\d+)\|(.+)/);
      if (pipeMatch) {
        timeframes.push({
          start: parseInt(pipeMatch[1]),
          end: parseInt(pipeMatch[2]),
          text: pipeMatch[3],
        });
      } else {
        // 使用自动时间轴
        const endTime = Math.min(currentTime + avgDuration, duration);
        timeframes.push({
          start: currentTime,
          end: endTime,
          text: trimmed,
        });
        currentTime = endTime;
      }
    }

    return timeframes;
  }

  /**
   * 格式化 SRT 时间
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 格式化 VTT 时间
   */
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 格式化 ASS 时间
   */
  private formatASSTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);

    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }

  /**
   * 解析 SRT 时间
   */
  private parseSRTTime(time: string): number {
    const match = time.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) return 0;

    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const secs = parseInt(match[3], 10);
    const ms = parseInt(match[4], 10);

    return hours * 3600 + mins * 60 + secs + ms / 1000;
  }

  /**
   * 解析 VTT 时间
   */
  private parseVTTTime(time: string): number {
    // 处理短格式 (mm:ss.ms)
    if (!time.includes(':')) {
      const match = time.match(/(\d{2})[,.](\d{3})/);
      if (match) {
        return parseInt(match[1]) + parseInt(match[2]) / 1000;
      }
    }

    const match = time.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) return 0;

    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const secs = parseInt(match[3], 10);
    const ms = parseInt(match[4], 10);

    return hours * 3600 + mins * 60 + secs + ms / 1000;
  }

  /**
   * 获取 ASS 颜色
   */
  private assColor(color: string): string {
    // 转换 #RRGGBB 到 &HBBGGRR
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `&H${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`;
  }

  /**
   * 获取 ASS 对齐方式
   */
  private assAlignment(alignment: string): number {
    const map: Record<string, number> = {
      left: 1,
      center: 2,
      right: 3,
      top: 8,
      bottom: 4,
    };
    return map[alignment] || 2;
  }

  /**
   * 获取 VTT 位置
   */
  private getVTTPosition(position: string, margin: number): string {
    const posMap: Record<string, string> = {
      top: ` line:${margin}%`,
      middle: ` line:50%`,
      bottom: ` line:-${margin}%`,
    };
    return posMap[position] || '';
  }

  /**
   * 格式化时间
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export const subtitleService = new SubtitleService();
export default subtitleService;
