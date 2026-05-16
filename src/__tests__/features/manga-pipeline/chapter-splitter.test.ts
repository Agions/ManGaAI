import { splitChapters } from '../../../features/manga-pipeline/steps/step1-script-generation/parser/splitter';

describe('ChapterSplitter', () => {
  it('should split by "第X章" pattern', () => {
    const text = `第一章
内容一
第二章
内容二`;
    const result = splitChapters(text);
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].title).toBe('第一章');
    expect(result.chapters[1].title).toBe('第二章');
  });

  it('should split by "Chapter X" pattern', () => {
    const text = `Chapter 1
Content one
Chapter 2
Content two`;
    const result = splitChapters(text);
    expect(result.chapters).toHaveLength(2);
  });

  it('should return single chapter if no pattern found', () => {
    const text = `这是一个没有章节标题的文本`;
    const result = splitChapters(text);
    expect(result.chapters).toHaveLength(1);
    expect(result.chapters[0].title).toBe('第一章');
  });

  it('should handle empty text', () => {
    const result = splitChapters('');
    expect(result.chapters).toHaveLength(0);
    expect(result.rawLength).toBe(0);
  });

  it('should preserve chapter content', () => {
    const text = `第一章
第一段
第二段`;
    const result = splitChapters(text);
    expect(result.chapters[0].content).toContain('第一段');
  });
});
