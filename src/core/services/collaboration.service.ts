/**
 * 协同服务（D3）：分镜评论、版本快照、回滚
 */

export interface FrameComment {
  id: string;
  projectId: string;
  frameId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface StoryboardVersion {
  id: string;
  projectId: string;
  label: string;
  createdAt: string;
  createdBy: string;
  payload: unknown;
}

export interface VersionDiffSummary {
  leftVersionId: string;
  rightVersionId: string;
  changedKeys: string[];
  changeCount: number;
}

class CollaborationService {
  private comments: FrameComment[] = [];
  private versions: StoryboardVersion[] = [];

  addComment(input: Omit<FrameComment, 'id' | 'createdAt'>): FrameComment {
    const comment: FrameComment = {
      ...input,
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  listComments(projectId: string, frameId?: string): FrameComment[] {
    return this.comments
      .filter(item => item.projectId === projectId && (!frameId || item.frameId === frameId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveVersion(input: Omit<StoryboardVersion, 'id' | 'createdAt'>): StoryboardVersion {
    const version: StoryboardVersion = {
      ...input,
      id: `version_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.versions.push(version);
    return version;
  }

  listVersions(projectId: string): StoryboardVersion[] {
    return this.versions
      .filter(item => item.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getVersion(versionId: string): StoryboardVersion | undefined {
    return this.versions.find(item => item.id === versionId);
  }

  diffVersions(leftVersionId: string, rightVersionId: string): VersionDiffSummary {
    const left = this.getVersion(leftVersionId);
    const right = this.getVersion(rightVersionId);
    if (!left || !right) {
      return {
        leftVersionId,
        rightVersionId,
        changedKeys: [],
        changeCount: 0,
      };
    }

    const leftStr = JSON.stringify(left.payload ?? {});
    const rightStr = JSON.stringify(right.payload ?? {});

    const changedKeys = new Set<string>();

    try {
      const leftObj = JSON.parse(leftStr);
      const rightObj = JSON.parse(rightStr);
      collectDiffKeys(leftObj, rightObj, '', changedKeys);
    } catch {
      if (leftStr !== rightStr) changedKeys.add('root');
    }

    return {
      leftVersionId,
      rightVersionId,
      changedKeys: [...changedKeys],
      changeCount: changedKeys.size,
    };
  }

  rollback(projectId: string, versionId: string): unknown | null {
    const version = this.versions.find(item => item.projectId === projectId && item.id === versionId);
    return version ? version.payload : null;
  }

  hydrate(projectId: string, comments: FrameComment[] = [], versions: StoryboardVersion[] = []): void {
    this.comments = [
      ...this.comments.filter(item => item.projectId !== projectId),
      ...comments.filter(item => item.projectId === projectId)
    ];
    this.versions = [
      ...this.versions.filter(item => item.projectId !== projectId),
      ...versions.filter(item => item.projectId === projectId)
    ];
  }
}

function collectDiffKeys(a: any, b: any, prefix: string, target: Set<string>): void {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      target.add(prefix || 'frames');
    }
    return;
  }

  const keys = new Set([...(a ? Object.keys(a) : []), ...(b ? Object.keys(b) : [])]);
  keys.forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const av = a?.[key];
    const bv = b?.[key];

    if (typeof av === 'object' && av !== null && typeof bv === 'object' && bv !== null) {
      collectDiffKeys(av, bv, path, target);
      return;
    }

    if (JSON.stringify(av) !== JSON.stringify(bv)) {
      target.add(path);
    }
  });
}

export const collaborationService = new CollaborationService();
export default CollaborationService;
