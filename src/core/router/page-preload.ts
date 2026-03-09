type Importer = () => Promise<unknown>;

const pageImporters = {
  home: () => import('@/pages/Home'),
  workflow: () => import('@/pages/Workflow'),
  projectEdit: () => import('@/pages/ProjectEdit'),
  projectDetail: () => import('@/pages/ProjectDetail'),
  scriptDetail: () => import('@/pages/ScriptDetail'),
  settings: () => import('@/pages/Settings'),
  demo: () => import('@/components/common/Demo'),
} as const;

const routeImporterMap: Array<{ prefix: string; importer: Importer }> = [
  { prefix: '/workflow', importer: pageImporters.workflow },
  { prefix: '/project/new', importer: pageImporters.projectEdit },
  { prefix: '/project/edit', importer: pageImporters.projectEdit },
  { prefix: '/project/', importer: pageImporters.projectDetail },
  { prefix: '/project', importer: pageImporters.projectEdit },
  { prefix: '/settings', importer: pageImporters.settings },
  { prefix: '/demo', importer: pageImporters.demo },
  { prefix: '/script', importer: pageImporters.scriptDetail },
  { prefix: '/', importer: pageImporters.home },
];

const preloaded = new Set<string>();

export function getPageImporters() {
  return pageImporters;
}

export async function preloadPage(importer: Importer, key: string): Promise<void> {
  if (preloaded.has(key)) return;
  preloaded.add(key);
  try {
    await importer();
  } catch {
    preloaded.delete(key);
  }
}

export function matchPagePrefix(path: string): string | null {
  const hit = routeImporterMap.find(item => path.startsWith(item.prefix));
  return hit ? hit.prefix : null;
}

export function preloadPageByPath(
  path: string,
  preloader: (importer: Importer, key: string) => void = (importer, key) => {
    void preloadPage(importer, key);
  },
): void {
  const hit = routeImporterMap.find(item => path.startsWith(item.prefix));
  if (!hit) return;
  preloader(hit.importer, hit.prefix);
}

export function __resetPagePreloadForTests(): void {
  preloaded.clear();
}
