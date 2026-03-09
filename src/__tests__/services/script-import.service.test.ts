import { scriptImportService } from '@/core/services/script-import.service';

describe('scriptImportService', () => {
  it('should detect file format by filename', () => {
    expect(scriptImportService.detectFileFormat('a.txt')).toBe('txt');
    expect(scriptImportService.detectFileFormat('a.md')).toBe('md');
    expect(scriptImportService.detectFileFormat('a.docx')).toBe('docx');
    expect(scriptImportService.detectFileFormat('a.pdf')).toBe('unknown');
  });

  it('should validate empty content as invalid', () => {
    const result = scriptImportService.validateContent('   ');
    expect(result.valid).toBe(false);
    expect(result.issues.some(item => item.code === 'EMPTY_CONTENT')).toBe(true);
  });

  it('should split by explicit chapter headings', () => {
    const content = [
      '第1章 初见',
      '主角在街头相遇。'.repeat(40),
      '',
      '第2章 冲突',
      '两人发生争执。'.repeat(40),
    ].join('\n');

    const chapters = scriptImportService.splitIntoChapters(content);

    expect(chapters.length).toBe(2);
    expect(chapters[0].title).toContain('第1章');
    expect(chapters[1].title).toContain('第2章');
    expect(chapters.every(item => item.wordCount > 0)).toBe(true);
  });

  it('should fallback split when no chapter heading', () => {
    const paragraph = '这是一个长段落。'.repeat(300);
    const content = [paragraph, paragraph, paragraph].join('\n\n');

    const chapters = scriptImportService.splitIntoChapters(content);

    expect(chapters.length).toBeGreaterThanOrEqual(1);
    expect(chapters[0].isAutoSplit).toBe(true);
  });

  it('should analyze import result with source and chapters', () => {
    const content = '第1章 开端\n\n故事开始。'.repeat(50);
    const result = scriptImportService.analyzeImport({
      sourceType: 'manual',
      filename: '手动输入',
      content,
    });

    expect(result.source.sourceType).toBe('manual');
    expect(result.estimatedChapters).toBeGreaterThan(0);
    expect(result.chapters.length).toBeGreaterThan(0);
  });
});
