import {
  __resetPagePreloadForTests,
  matchPagePrefix,
  preloadPage,
  preloadPageByPath,
} from '@/core/router/page-preload';

describe('page-preload', () => {
  beforeEach(() => {
    __resetPagePreloadForTests();
  });

  it('preloadPage deduplicates repeated calls with same key', async () => {
    const importer = jest.fn().mockResolvedValue(undefined);

    await preloadPage(importer, 'k1');
    await preloadPage(importer, 'k1');

    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('preloadPage allows retry after failure', async () => {
    const importer = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);

    await preloadPage(importer, 'k2');
    await preloadPage(importer, 'k2');

    expect(importer).toHaveBeenCalledTimes(2);
  });

  it('matchPagePrefix resolves expected route prefixes', () => {
    expect(matchPagePrefix('/workflow/abc')).toBe('/workflow');
    expect(matchPagePrefix('/project/new')).toBe('/project/new');
    expect(matchPagePrefix('/project/edit/1')).toBe('/project/edit');
    expect(matchPagePrefix('/project/123')).toBe('/project/');
    expect(matchPagePrefix('/settings/profile')).toBe('/settings');
    expect(matchPagePrefix('/')).toBe('/');
  });

  it('preloadPageByPath uses injected preloader callback', () => {
    const preloader = jest.fn();

    preloadPageByPath('/settings', preloader);
    preloadPageByPath('/unknown/path', preloader);

    expect(preloader).toHaveBeenCalledTimes(2);
    expect(preloader.mock.calls[0][1]).toBe('/settings');
    expect(preloader.mock.calls[1][1]).toBe('/');
    expect(typeof preloader.mock.calls[0][0]).toBe('function');
  });
});
