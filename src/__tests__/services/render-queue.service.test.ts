import RenderQueueService from '@/core/services/render-queue.service';
import { imageGenerationService } from '@/core/services/image-generation.service';

jest.mock('@/core/services/image-generation.service', () => ({
  imageGenerationService: {
    generateImage: jest.fn(),
  },
}));

describe('RenderQueueService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should enqueue and complete jobs', async () => {
    (imageGenerationService.generateImage as jest.Mock).mockResolvedValue({
      url: 'https://example.com/a.png',
    });

    const service = new RenderQueueService();
    service.enqueue([
      {
        frameId: 'f1',
        frameTitle: '分镜1',
        prompt: 'prompt',
        model: 'seedream-5.0',
        maxRetries: 1,
      },
    ]);

    await service.run();

    const state = service.getState();
    expect(state.jobs[0].status).toBe('completed');
    expect(state.jobs[0].imageUrl).toBe('https://example.com/a.png');
  });

  it('should fallback with placeholder after retry exhausted', async () => {
    (imageGenerationService.generateImage as jest.Mock).mockRejectedValue(new Error('network'));

    const service = new RenderQueueService();
    service.enqueue([
      {
        frameId: 'f2',
        frameTitle: '分镜2',
        prompt: 'prompt',
        model: 'seedream-5.0',
        maxRetries: 0,
      },
    ]);

    await service.run();

    const state = service.getState();
    expect(state.jobs[0].status).toBe('completed');
    expect(state.jobs[0].imageUrl?.startsWith('data:image/svg+xml')).toBe(true);
  });
});
