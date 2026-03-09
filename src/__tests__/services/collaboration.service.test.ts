import CollaborationService from '@/core/services/collaboration.service';

describe('collaborationService', () => {
  let service: CollaborationService;

  beforeEach(() => {
    service = new CollaborationService();
  });

  it('should add and list frame comments', () => {
    service.addComment({ projectId: 'p1', frameId: 'f1', content: '镜头太长', author: 'qa' });
    service.addComment({ projectId: 'p1', frameId: 'f1', content: '建议快切', author: 'director' });

    const comments = service.listComments('p1', 'f1');
    expect(comments.length).toBe(2);
    expect(comments[0].frameId).toBe('f1');
  });

  it('should save versions and rollback payload', () => {
    const v1 = service.saveVersion({ projectId: 'p1', label: 'v1', createdBy: 'dev', payload: [{ id: 'f1', title: 'A' }] });
    const v2 = service.saveVersion({ projectId: 'p1', label: 'v2', createdBy: 'dev', payload: [{ id: 'f1', title: 'B' }] });

    const diff = service.diffVersions(v1.id, v2.id);
    expect(diff.changeCount).toBeGreaterThan(0);

    const rollbackPayload = service.rollback('p1', v1.id) as Array<{ title: string }>;
    expect(rollbackPayload[0].title).toBe('A');
  });
});
