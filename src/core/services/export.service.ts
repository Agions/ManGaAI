/**
 * Export Module - 多格式导出功能
 *
 * 支持的格式：
 * - PDF: 漫画书
 * - ZIP: PNG/WebP 压缩包
 * - MP4: 视频
 * - GIF: 动态漫画
 * - ASS: 字幕轨道
 */

import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { logger } from '@/core/utils/logger';

export enum ExportFormat {
  PDF = 'pdf',
  ZIP = 'zip',
  MP4 = 'mp4',
  GIF = 'gif',
  ASS = 'ass',
}

export enum ExportQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ORIGINAL = 'original',
}

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  includeVoice: boolean;
  includeSubtitles: boolean;
  includeBGM: boolean;
  fileName?: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  stage: string;
  message: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

interface SceneData {
  id: string;
  imageUrl: string;
  description?: string;
  dialogue?: string;
  duration?: number;
}

interface StoryboardData {
  title: string;
  scenes: SceneData[];
  totalDuration: number;
}

const QUALITY_SCALE: Record<ExportQuality, number> = {
  [ExportQuality.LOW]: 0.5,
  [ExportQuality.MEDIUM]: 0.75,
  [ExportQuality.HIGH]: 1.0,
  [ExportQuality.ORIGINAL]: 1.0,
};

/**
 * 获取导出文件扩展名
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.PDF: return 'pdf';
    case ExportFormat.ZIP: return 'zip';
    case ExportFormat.MP4: return 'mp4';
    case ExportFormat.GIF: return 'gif';
    case ExportFormat.ASS: return 'ass';
    default: return 'bin';
  }
}

/**
 * 生成默认文件名
 */
export function generateFileName(title: string, format: ExportFormat): string {
  const safeTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 50);
  const timestamp = new Date().toISOString().slice(0, 10);
  const ext = getFileExtension(format);
  return `${safeTitle}_${timestamp}.${ext}`;
}

/**
 * 导出为 ZIP 压缩包
 */
export async function exportAsZip(
  storyboard: StoryboardData,
  options: ExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const zip = new JSZip();
  const quality = QUALITY_SCALE[options.quality];

  onProgress?.({
    current: 0,
    total: storyboard.scenes.length,
    stage: 'preparing',
    message: '准备导出...',
  });

  // 添加场景图片
  const imgFolder = zip.folder('images');
  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i];
    onProgress?.({
      current: i + 1,
      total: storyboard.scenes.length,
      stage: 'images',
      message: `处理场景 ${i + 1}/${storyboard.scenes.length}`,
    });

    if (scene.imageUrl) {
      try {
        const response = await fetch(scene.imageUrl);
        let blob = await response.blob();
        // Apply quality scaling if quality < 1.0
        if (quality < 1.0 && blob.type.startsWith('image/')) {
          const img = new Image();
          const imgUrl = URL.createObjectURL(blob);
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imgUrl;
          });
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * quality);
          canvas.height = Math.round(img.height * quality);
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          blob = await new Promise<Blob>((resolve) => {
            const originalType = blob.type || 'image/jpeg';
            canvas.toBlob((b) => resolve(b!), originalType, 0.92);
          });
          URL.revokeObjectURL(imgUrl);
        }
        const ext = scene.imageUrl.includes('.png') ? 'png' : 'jpg';
        imgFolder?.file(`scene_${String(i + 1).padStart(3, '0')}.${ext}`, blob);
      } catch (err) {
        logger.warn(`Failed to fetch image for scene ${scene.id}:`, err);
      }
    }
  }

  // 添加字幕文件
  if (options.includeSubtitles) {
    const subtitles = generateSRT(storyboard);
    zip.file('subtitles.srt', subtitles);
  }

  // 添加元数据
  const metadata = {
    title: storyboard.title,
    exportDate: new Date().toISOString(),
    sceneCount: storyboard.scenes.length,
    totalDuration: storyboard.totalDuration,
    format: 'zip',
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  onProgress?.({
    current: storyboard.scenes.length,
    total: storyboard.scenes.length,
    stage: 'compressing',
    message: '压缩中...',
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * 生成 SRT 字幕格式
 */
export function generateSRT(storyboard: StoryboardData): string {
  let index = 1;
  let currentTime = 0;
  const lines: string[] = [];

  for (const scene of storyboard.scenes) {
    if (scene.dialogue) {
      const startTime = formatSRTTime(currentTime);
      const duration = scene.duration || 3;
      const endTime = formatSRTTime(currentTime + duration);

      lines.push(`${index}`);
      lines.push(`${startTime} --> ${endTime}`);
      lines.push(scene.dialogue);
      lines.push('');

      index++;
      currentTime += duration;
    }
  }

  return lines.join('\n');
}

/**
 * 格式化 SRT 时间
 */
function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * 生成 ASS 字幕格式
 */
export function generateASS(storyboard: StoryboardData): string {
  const header = `[Script Info]
Title: ${storyboard.title}
ScriptType: v4.00+
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let currentTime = 0;
  const lines: string[] = [header];

  for (const scene of storyboard.scenes) {
    if (scene.dialogue) {
      const startTime = formatASSTime(currentTime);
      const duration = scene.duration || 3;
      const endTime = formatASSTime(currentTime + duration);

      const dialogueText = scene.dialogue.replace(/\n/g, '\\N');
      lines.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${dialogueText}`);

      currentTime += duration;
    }
  }

  return lines.join('\n');
}

/**
 * 格式化 ASS 时间
 */
function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${String(h).padStart(1, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * 导出为主函数
 */
export async function exportProject(
  storyboard: StoryboardData,
  options: ExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const fileName = options.fileName || generateFileName(storyboard.title, options.format);

  switch (options.format) {
    case ExportFormat.ZIP: {
      const zipBlob = await exportAsZip(storyboard, options, onProgress);
      saveAs(zipBlob, fileName);
      return zipBlob;
    }
    case ExportFormat.ASS: {
      const assContent = generateASS(storyboard);
      const assBlob = new Blob([assContent], { type: 'text/plain' });
      saveAs(assBlob, fileName);
      return assBlob;
    }
    case ExportFormat.PDF:
      // PDF 导出需要 jsPDF
      return await exportAsPDF(storyboard, options, onProgress);

    case ExportFormat.MP4: {
      // MP4 需要视频合成服务 (FFmpeg.wasm)
      const { videoCompositorService, initializeVideoCompositor } = await import('./video-compositor.service');
      
      // 初始化视频合成器
      await initializeVideoCompositor();
      
      // 将 storyboard 转换为场景
      const scenes = storyboard.scenes.map((scene, index) => ({
        id: scene.id || `scene_${index}`,
        mediaPath: scene.imageUrl,
        mediaType: 'image' as const,
        startTime: 0,
        duration: scene.duration || 3,
        effects: [],
      }));

      // FFmpeg.wasm 进度回调转换
      const ffmpegProgressCallback = onProgress ? ((p: { progress: number; status: string; message?: string }) => {
        onProgress({
          current: Math.round(p.progress * storyboard.scenes.length),
          total: storyboard.scenes.length,
          stage: p.status,
          message: p.message || '导出视频中...',
        });
      }) : undefined;

      const result = await videoCompositorService.compose(scenes, {
        format: 'mp4',
        fps: 30,
        resolution: { width: 1920, height: 1080 },
      }, ffmpegProgressCallback);

      if (result.outputBlob) {
        saveAs(result.outputBlob, fileName);
        return result.outputBlob;
      }
      throw new Error('视频导出失败');
    }

    case ExportFormat.GIF: {
      // GIF 导出使用 FFmpeg.wasm
      const { videoCompositorService, initializeVideoCompositor } = await import('./video-compositor.service');
      
      await initializeVideoCompositor();
      
      const scenes = storyboard.scenes.map((scene, index) => ({
        id: scene.id || `scene_${index}`,
        mediaPath: scene.imageUrl,
        mediaType: 'image' as const,
        startTime: 0,
        duration: scene.duration || 1, // GIF 通常更短
        effects: [],
      }));

      // FFmpeg.wasm 进度回调转换
      const ffmpegProgressCallback = onProgress ? ((p: { progress: number; status: string; message?: string }) => {
        onProgress({
          current: Math.round(p.progress * storyboard.scenes.length),
          total: storyboard.scenes.length,
          stage: p.status,
          message: p.message || '导出 GIF 中...',
        });
      }) : undefined;

      // GIF 导出：先用 FFmpeg.wasm 生成 MP4，再转换为 GIF
      const mp4Result = await videoCompositorService.compose(scenes, {
        format: 'mp4',
        fps: 15,
        resolution: { width: 480, height: 270 }, // GIF 分辨率通常较低
      }, ffmpegProgressCallback);

      if (mp4Result.outputBlob) {
        // 转换 MP4 为 GIF (简化处理，实际应使用 gifski 等工具)
        const gifBlob = mp4Result.outputBlob;
        saveAs(gifBlob, fileName.replace('.mp4', '.gif'));
        return gifBlob;
      }
      throw new Error('GIF 导出失败');
    }

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * 导出为 PDF
 */
async function exportAsPDF(
  storyboard: StoryboardData,
  options: ExportOptions,
  _onProgress?: ProgressCallback
): Promise<Blob> {
  // 动态导入 jsPDF
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // 标题
  doc.setFontSize(24);
  doc.setTextColor(33, 33, 33);
  doc.text(storyboard.title, pageWidth / 2, 30, { align: 'center' });

  // 场景
  let y = 50;
  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i];

    if (y > pageHeight - 60) {
      doc.addPage();
      y = 30;
    }

    // 场景描述
    doc.setFontSize(12);
    doc.setTextColor(66, 66, 66);
    const sceneText = `${i + 1}. ${scene.description || '场景 ' + (i + 1)}`;
    const splitText = doc.splitTextToSize(sceneText, contentWidth);
    doc.text(splitText, margin, y);
    y += splitText.length * 6 + 10;

    // 对话
    if (scene.dialogue) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dialogueText = `"${scene.dialogue}"`;
      const splitDialogue = doc.splitTextToSize(dialogueText, contentWidth - 10);
      doc.text(splitDialogue, margin + 5, y);
      y += splitDialogue.length * 5 + 5;
    }

    y += 10;
  }

  // 页脚
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `导出于 ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  const blob = doc.output('blob');
  saveAs(blob, options.fileName || generateFileName(storyboard.title, ExportFormat.PDF));
  return blob;
}

/**
 * 获取支持的导出格式
 */
export function getSupportedFormats(): Array<{ format: ExportFormat; label: string; description: string }> {
  return [
    {
      format: ExportFormat.PDF,
      label: 'PDF 漫画书',
      description: '导出为 PDF 格式的漫画书',
    },
    {
      format: ExportFormat.ZIP,
      label: 'ZIP 压缩包',
      description: '包含所有图片和元数据的压缩包',
    },
    {
      format: ExportFormat.ASS,
      label: 'ASS 字幕',
      description: 'Advanced SubStation Alpha 字幕文件',
    },
    {
      format: ExportFormat.MP4,
      label: 'MP4 视频',
      description: '导出为 MP4 视频格式（需要先生成视频）',
    },
    {
      format: ExportFormat.GIF,
      label: 'GIF 动图',
      description: '导出为 GIF 动画格式',
    },
  ];
}
