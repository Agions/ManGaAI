export interface Chapter {
  id: string;
  title: string;
  startLine: number;
  endLine: number;
  content: string;
}

export interface ChapterSplitResult {
  chapters: Chapter[];
  rawLength: number;
}

/**
 * 将小说原文拆分为章节
 * 支持格式：
 * - 第X章 / 第X回
 * - Chapter X / CHAPTER X
 * - 一、二、三、四（中文数字章节）
 * - 场景标记如 [Scene 1]
 */
export function splitChapters(text: string): ChapterSplitResult {
  const lines = text.split('\n');
  const chapters: Chapter[] = [];

  // 章节标题正则
  const patterns = [
    /^第[一二三四五六七八九十百千万\d]+[章节回篇]/, // 第1章
    /^Chapter\s+\d+/i, // Chapter 1
    /^[一二三四五六七八九十百千万]+、\.?[^\s]{2,}/, // 一、场景名
    /^\[Scene\s+\d+\]/, // [Scene 1]
    /^第[一二三四五六七八九十百千万\d]+部分/, // 第一部分
  ];

  let currentChapter: Chapter | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isChapterTitle = patterns.some((p) => p.test(line));

    if (isChapterTitle && line.length < 50) {
      if (currentChapter) {
        currentChapter.endLine = i - 1;
        currentChapter.content = lines.slice(currentChapter.startLine, i).join('\n');
        chapters.push(currentChapter);
      }
      currentChapter = {
        id: `chapter_${chapters.length + 1}`,
        title: line,
        startLine: i,
        endLine: lines.length - 1,
        content: '',
      };
    }
  }

  // 处理最后一章
  if (currentChapter) {
    currentChapter.endLine = lines.length - 1;
    currentChapter.content = lines.slice(currentChapter.startLine).join('\n');
    chapters.push(currentChapter);
  }

  // 如果没有识别到章节，整个文本作为一个章节
  if (chapters.length === 0 && text.trim()) {
    chapters.push({
      id: 'chapter_1',
      title: '第一章',
      startLine: 0,
      endLine: lines.length - 1,
      content: text,
    });
  }

  return { chapters, rawLength: text.length };
}
