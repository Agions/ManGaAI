/**
 * 脚本导入与章节切分服务（A1）
 */

import type {
  ScriptChapter,
  ScriptFileFormat,
  ScriptSource,
  ScriptValidationResult,
} from '@/core/types';

export interface BuildScriptSourceInput {
  sourceType: ScriptSource['sourceType'];
  filename: string;
  filePath?: string;
  content: string;
}

export interface AnalyzeScriptImportResult {
  source: ScriptSource;
  chapters: ScriptChapter[];
  validation: ScriptValidationResult;
  estimatedChapters: number;
}

interface ChapterBoundary {
  startIndex: number;
  title: string;
  isAutoSplit: boolean;
}

class ScriptImportService {
  private readonly chapterHeadingPatterns = [
    /^第[一二三四五六七八九十百千\d]+[章回节卷]\s*[：:：\-\s]*(.+)?$/gim,
    /^chapter\s*\d+\s*[：:：\-\s]*(.+)?$/gim,
    /^#+\s+(.+)$/gm,
  ];

  private readonly defaultChapterCharSize = 8000;

  detectFileFormat(filename: string): ScriptFileFormat {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (ext === 'txt' || ext === 'md' || ext === 'docx') return ext;
    return 'unknown';
  }

  buildSource(input: BuildScriptSourceInput): ScriptSource {
    const now = new Date().toISOString();
    return {
      sourceType: input.sourceType,
      filename: input.filename,
      filePath: input.filePath,
      fileFormat: this.detectFileFormat(input.filename),
      fileSize: input.content.length,
      charCount: input.content.length,
      importedAt: now,
    };
  }

  validateContent(content: string, source?: ScriptSource): ScriptValidationResult {
    const issues: ScriptValidationResult['issues'] = [];
    const trimmed = content.trim();

    if (!trimmed) {
      issues.push({
        level: 'error',
        code: 'EMPTY_CONTENT',
        message: '导入内容为空，请检查文件内容或手动输入内容。',
      });
    }

    if (trimmed.length > 0 && trimmed.length < 100) {
      issues.push({
        level: 'warning',
        code: 'TOO_SHORT',
        message: '内容较短，后续章节切分效果可能不稳定。',
      });
    }

    if (trimmed.length > 500_000) {
      issues.push({
        level: 'warning',
        code: 'VERY_LARGE',
        message: '内容较长，建议先按卷/章拆分后再导入。',
      });
    }

    if (source?.fileFormat === 'docx') {
      issues.push({
        level: 'warning',
        code: 'DOCX_COMPAT',
        message: 'DOCX 文本抽取依赖系统编码，若出现乱码建议先另存为 TXT/MD。',
      });
    }

    if (/[\u0000-\u0008\u000E-\u001F]/.test(content)) {
      issues.push({
        level: 'warning',
        code: 'BINARY_CHARACTERS',
        message: '检测到不可见字符，可能是二进制文本，建议转换为纯文本后重试。',
      });
    }

    return {
      valid: !issues.some(issue => issue.level === 'error'),
      issues,
    };
  }

  splitIntoChapters(content: string, maxChapters = 200): ScriptChapter[] {
    const normalized = content.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const boundaries = this.findChapterBoundaries(normalized);

    if (boundaries.length === 0) {
      return this.fallbackSplit(normalized, maxChapters);
    }

    const uniqueBoundaries = boundaries
      .sort((a, b) => a.startIndex - b.startIndex)
      .filter((item, index, arr) => index === 0 || item.startIndex !== arr[index - 1].startIndex)
      .slice(0, maxChapters);

    const chapters: ScriptChapter[] = [];

    for (let i = 0; i < uniqueBoundaries.length; i++) {
      const start = uniqueBoundaries[i].startIndex;
      const end = uniqueBoundaries[i + 1]?.startIndex ?? normalized.length;
      const chapterContent = normalized.slice(start, end).trim();

      if (!chapterContent) continue;

      chapters.push({
        id: `chapter_${i + 1}`,
        title: uniqueBoundaries[i].title || `第${i + 1}章`,
        content: chapterContent,
        order: i,
        wordCount: chapterContent.length,
        startIndex: start,
        endIndex: end,
        isAutoSplit: uniqueBoundaries[i].isAutoSplit,
      });
    }

    return chapters.length > 0 ? chapters : this.fallbackSplit(normalized, maxChapters);
  }

  analyzeImport(input: BuildScriptSourceInput): AnalyzeScriptImportResult {
    const source = this.buildSource(input);
    const chapters = this.splitIntoChapters(input.content);
    const validation = this.validateContent(input.content, source);

    return {
      source,
      chapters,
      validation,
      estimatedChapters: Math.max(chapters.length, Math.ceil(input.content.length / 10000), 1),
    };
  }

  private findChapterBoundaries(content: string): ChapterBoundary[] {
    const boundaries: ChapterBoundary[] = [];

    for (const pattern of this.chapterHeadingPatterns) {
      for (const match of content.matchAll(pattern)) {
        boundaries.push({
          startIndex: match.index ?? 0,
          title: match[0].trim(),
          isAutoSplit: false,
        });
      }

      if (boundaries.length > 0) {
        return boundaries;
      }
    }

    return boundaries;
  }

  private fallbackSplit(content: string, maxChapters: number): ScriptChapter[] {
    const paragraphs = content.split(/\n{2,}/).filter(item => item.trim().length > 0);

    if (paragraphs.length === 0) {
      return [{
        id: 'chapter_1',
        title: '第1章',
        content,
        order: 0,
        wordCount: content.length,
        startIndex: 0,
        endIndex: content.length,
        isAutoSplit: true,
      }];
    }

    const chapters: ScriptChapter[] = [];
    let chunk = '';
    let startIndex = 0;

    for (const paragraph of paragraphs) {
      const nextChunk = chunk ? `${chunk}\n\n${paragraph}` : paragraph;
      const shouldFlush = nextChunk.length >= this.defaultChapterCharSize;

      if (shouldFlush && chunk) {
        const endIndex = Math.min(startIndex + chunk.length, content.length);
        chapters.push({
          id: `chapter_${chapters.length + 1}`,
          title: `第${chapters.length + 1}章`,
          content: chunk,
          order: chapters.length,
          wordCount: chunk.length,
          startIndex,
          endIndex,
          isAutoSplit: true,
        });

        startIndex = endIndex;
        chunk = paragraph;
      } else {
        chunk = nextChunk;
      }

      if (chapters.length >= maxChapters) break;
    }

    if (chunk && chapters.length < maxChapters) {
      chapters.push({
        id: `chapter_${chapters.length + 1}`,
        title: `第${chapters.length + 1}章`,
        content: chunk,
        order: chapters.length,
        wordCount: chunk.length,
        startIndex,
        endIndex: Math.min(startIndex + chunk.length, content.length),
        isAutoSplit: true,
      });
    }

    return chapters;
  }
}

export const scriptImportService = new ScriptImportService();
export default ScriptImportService;
