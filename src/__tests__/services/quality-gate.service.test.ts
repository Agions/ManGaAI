import { qualityGateService } from '@/core/services/quality-gate.service';

describe('qualityGateService', () => {
  it('should fail when frame count is too low', () => {
    const result = qualityGateService.evaluate({
      storyboardFrames: [
        { id: 'f1', title: '1', sceneDescription: 'a', composition: '中心构图', cameraType: 'wide', dialogue: '', duration: 5 },
        { id: 'f2', title: '2', sceneDescription: 'b', composition: '中心构图', cameraType: 'medium', dialogue: '', duration: 4 },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some(issue => issue.code === 'frame_count_low' && issue.level === 'error')).toBe(true);
  });

  it('should include frame location metadata for storyboard issues', () => {
    const result = qualityGateService.evaluate({
      storyboardFrames: [
        { id: 'f1', title: '1', sceneDescription: '', composition: '中心构图', cameraType: 'wide', dialogue: '', duration: 5 },
        { id: 'f2', title: '2', sceneDescription: 'ok', composition: '中心构图', cameraType: 'medium', dialogue: '', duration: 20 },
      ],
      thresholds: {
        minFrameCount: 2,
        minSceneCoverage: 1,
        minRenderedCoverage: 1,
        maxFrameDurationSec: 12,
      },
    });

    const sceneIssue = result.issues.find((issue) => issue.code === 'scene_coverage_low');
    const renderIssue = result.issues.find((issue) => issue.code === 'rendered_coverage_low');
    const durationIssue = result.issues.find((issue) => issue.code === 'frame_duration_high');
    expect(sceneIssue).toMatchObject({ frameId: 'f1', frameIndex: 0, field: 'sceneDescription' });
    expect(renderIssue).toMatchObject({ frameId: 'f1', frameIndex: 0, field: 'imageUrl' });
    expect(durationIssue).toMatchObject({ frameId: 'f2', frameIndex: 1, field: 'duration' });
  });

  it('should pass with healthy storyboard and evaluation summary', () => {
    const frames = Array.from({ length: 6 }).map((_, index) => ({
      id: `f${index}`,
      title: `镜头${index + 1}`,
      sceneDescription: '完整场景描述',
      composition: '三分法',
      cameraType: 'medium',
      dialogue: '',
      duration: 5,
      imageUrl: index < 5 ? `https://cdn/${index}.png` : undefined,
    }));

    const result = qualityGateService.evaluate({
      storyboardFrames: frames,
      evaluationSummary: {
        consistency: 83,
        pacing: 79,
        readability: 81,
        cost: 76,
        overall: 80,
      },
    });

    expect(result.passed).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  it('should mark missing evaluation as error in strict mode', () => {
    const frames = Array.from({ length: 6 }).map((_, index) => ({
      id: `f${index}`,
      title: `镜头${index + 1}`,
      sceneDescription: '完整场景描述',
      composition: '三分法',
      cameraType: 'medium',
      dialogue: '',
      duration: 5,
      imageUrl: `https://cdn/${index}.png`,
    }));

    const result = qualityGateService.evaluate({
      storyboardFrames: frames,
      thresholds: { requireEvaluationSummary: true },
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some(issue => issue.code === 'evaluation_missing' && issue.level === 'error')).toBe(true);
  });
});
