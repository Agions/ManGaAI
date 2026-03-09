import CostService from '@/core/services/cost.service';

describe('costService enhancements', () => {
  let service: CostService;

  beforeEach(() => {
    localStorage.clear();
    service = new CostService();
    service.clear();
  });

  it('should aggregate project stats by projectId', () => {
    service.recordLLMCost('alibaba', 'qwen-plus', 1000, 1000, { projectId: 'p1' });
    service.recordLLMCost('alibaba', 'qwen-plus', 500, 500, { projectId: 'p2' });

    const p1 = service.getProjectStats('p1');
    const p2 = service.getProjectStats('p2');

    expect(p1.total).toBeGreaterThan(0);
    expect(p2.total).toBeGreaterThan(0);
    expect(p1.total).not.toBe(p2.total);
  });

  it('should record audio and storage cost', () => {
    const a = service.recordAudioCost('edge', 60, { projectId: 'p1' });
    const s = service.recordStorageCost('local-export', 100, { projectId: 'p1' });

    expect(a.type).toBe('audio');
    expect(s.type).toBe('storage');
    expect(service.getProjectStats('p1').total).toBeCloseTo(a.cost + s.cost, 5);
  });

  it('should emit budget alerts', () => {
    const alerts: string[] = [];
    service.setBudget({ daily: 0.001, weekly: 0.001, monthly: 0.001 });
    const unsub = service.subscribeAlert((alert) => alerts.push(alert.period));

    service.recordLLMCost('openai', 'gpt-5', 1000, 1000, { projectId: 'p1' });

    unsub();
    expect(alerts.length).toBeGreaterThan(0);
  });
});
