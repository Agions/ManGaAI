import { ClassifiedParagraph } from '../parser/classifier';
import { Scene } from '../types/scene';
import { DialogueLine } from '../types/script';

export interface DialogueGenerationOptions {
  includeInnerMonologue?: boolean; // 默认 true
}

/**
 * 基于场景和角色性格生成对话
 */
export function generateDialogue(
  scene: Scene,
  paragraphs: ClassifiedParagraph[],
  options: DialogueGenerationOptions = {}
): DialogueLine[] {
  const { includeInnerMonologue = true } = options;
  const lines: DialogueLine[] = [];

  // 找到该场景相关的段落
  const sceneParagraphs = filterParagraphsForScene(scene, paragraphs);

  sceneParagraphs.forEach((p) => {
    if (p.type === 'dialogue' && p.speaker) {
      lines.push({
        character: p.speaker,
        type: 'dialogue',
        content: cleanDialogueContent(p.content, p.speaker),
        emotion: scene.emotion,
      });
    } else if (p.type === 'action') {
      lines.push({
        character: '',
        type: 'action',
        content: p.content,
        emotion: scene.emotion,
      });
    } else if (p.type === 'inner_monologue' && includeInnerMonologue) {
      lines.push({
        character: '',
        type: 'inner_monologue',
        content: p.content,
        emotion: scene.emotion,
      });
    }
  });

  // 如果没有原始对话，基于场景和角色生成
  // 但如果用户明确排除 inner_monologue 且结果为空，则不生成 fallback
  const hasDialogueOrAction = sceneParagraphs.some(
    (p) => p.type === 'dialogue' || p.type === 'action'
  );
  if (lines.length === 0 && (includeInnerMonologue || hasDialogueOrAction)) {
    lines.push(...generateFallbackDialogue(scene));
  }

  return lines;
}

function filterParagraphsForScene(
  scene: Scene,
  paragraphs: ClassifiedParagraph[]
): ClassifiedParagraph[] {
  // 对话按角色过滤，动作/独白则全部保留
  return paragraphs
    .filter((p) => {
      if (p.type === 'dialogue') {
        return p.speaker && scene.characters.includes(p.speaker);
      }
      // action 和 inner_monologue 不做角色过滤
      return p.type === 'action' || p.type === 'inner_monologue';
    })
    .slice(0, 10);
}

function cleanDialogueContent(content: string, speaker: string): string {
  // 移除说话人前缀
  return content
    .replace(new RegExp(`^${speaker}：[：:]?`), '')
    .replace(new RegExp(`^"${speaker}"：[：:]?`), '')
    .replace(new RegExp(`^「${speaker}」：[：:]?`), '')
    .trim();
}

function generateFallbackDialogue(scene: Scene): DialogueLine[] {
  const lines: DialogueLine[] = [];

  if (scene.type === '对峙' || scene.emotion === 'angry') {
    lines.push({
      character: scene.characters[0] || '角色A',
      type: 'dialogue',
      content: '你为什么要这样做？',
      emotion: 'angry',
    });
    if (scene.characters.length > 1) {
      lines.push({
        character: scene.characters[1] || '角色B',
        type: 'dialogue',
        content: '我没有选择。',
        emotion: 'tense',
      });
    }
  } else if (scene.type === '情感' || scene.emotion === 'sad') {
    lines.push({
      character: scene.characters[0] || '角色',
      type: 'dialogue',
      content: '事情已经结束了。',
      emotion: 'sad',
    });
  } else {
    // 默认对话
    lines.push({
      character: scene.characters[0] || '角色',
      type: 'dialogue',
      content: '我们该走了。',
      emotion: 'neutral',
    });
  }

  return lines;
}
