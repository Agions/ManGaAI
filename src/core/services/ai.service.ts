/**
 * AI 服务
 * 统一的 AI 模型调用服务
 */

import { getModelById } from '@/core/config/models.config';
import { LLM_MODELS, DEFAULT_LLM_MODEL, MODEL_RECOMMENDATIONS } from '@/core/constants';
import { promptBuilderService } from '@/core/domains/ai/services/prompt-builder.service';
import { logger } from '@/core/utils/logger';
import { requestCache } from '@/core/utils/requestCache';

// Re-export shared types from centralized types file
export type {
  AIResponse,
  RequestConfig,
  StreamCallbacks,
  MockConfig,
  AIModel,
  AIModelSettings,
  ScriptData,
  VideoAnalysis,
  ScriptSegment,
  Scene,
  Keyframe,
} from './ai.service.types';
import type {
  AIModel,
  AIModelSettings,
  ScriptData,
  VideoAnalysis,
  ScriptSegment,
  Scene,
  Keyframe,
  AIResponse,
  RequestConfig,
  MockConfig,
} from './ai.service.types';

class AIService {
  private abortControllers: Map<string, AbortController> = new Map();
  private mockConfigs: Map<string, MockConfig> = new Map();

  // 设置 Mock 配置
  setMockConfig(requestId: string, config: MockConfig): void {
    this.mockConfigs.set(requestId, config);
  }

  // 清除 Mock 配置
  clearMockConfig(requestId: string): void {
    this.mockConfigs.delete(requestId);
  }

  // 启用/禁用 Mock 模式
  private useMock = false;
  setMockMode(enabled: boolean): void {
    this.useMock = enabled;
  }
  isMockMode(): boolean {
    return this.useMock;
  }

  /**
   * 通用生成方法
   */
  async generate(
    prompt: string,
    options: {
      model: string;
      provider: string;
      signal?: AbortSignal;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    const model = this.getModelById(options.model);
    if (!model) {
      if (this.useMock) {
        const mockResponse = await this.mockCall({
          model: options.model,
          messages: [
            { role: 'system', content: '你是一个专业的视频内容创作助手。' },
            { role: 'user', content: prompt },
          ],
          temperature: options.temperature,
          max_tokens: options.max_tokens,
        });
        return mockResponse.content;
      }
      throw new Error(`Model ${options.model} not found`);
    }

    const settings: AIModelSettings = {
      enabled: true,
      apiKey: '',
      baseURL: '',
      model: model.id,
      temperature: options.temperature,
      maxTokens: options.max_tokens,
    } as AIModelSettings;

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('AI generate failed:', error);
      throw new Error(`AI生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private getModelById(modelId: string): AIModel | undefined {
    return getModelById(modelId);
  }

  /**
   * 生成脚本
   */
  async generateScript(
    model: AIModel,
    settings: AIModelSettings,
    params: {
      topic: string;
      style: string;
      tone: string;
      length: string;
      audience: string;
      language: string;
      keywords?: string[];
      requirements?: string;
      videoDuration?: number;
    }
  ): Promise<ScriptData> {
    const prompt = promptBuilderService.buildScriptPrompt(params);

    try {
      const response = await this.callAPI(model, settings, prompt);

      return {
        id: `script_${Date.now()}`,
        title: params.topic,
        content: response.content,
        segments: this.parseScriptSegments(response.content),
        metadata: {
          style: params.style,
          tone: params.tone,
          length: params.length as 'short' | 'medium' | 'long',
          targetAudience: params.audience,
          language: params.language,
          wordCount: response.content.length,
          estimatedDuration: this.estimateDuration(response.content.length),
          generatedBy: model.id,
          generatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('脚本生成失败:', error);
      throw error;
    }
  }

  /**
   * 分析视频
   */
  async analyzeVideo(
    model: AIModel,
    settings: AIModelSettings,
    videoInfo: {
      duration: number;
      width: number;
      height: number;
      format: string;
    }
  ): Promise<Partial<VideoAnalysis>> {
    const prompt = promptBuilderService.buildAnalysisPrompt(videoInfo);

    try {
      const response = await this.callAPI(model, settings, prompt);

      // 解析分析结果
      return {
        summary: response.content,
        scenes: this.generateMockScenes(videoInfo.duration),
        keyframes: this.generateMockKeyframes(videoInfo.duration),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('视频分析失败:', error);
      throw error;
    }
  }

  /**
   * 优化脚本
   */
  async optimizeScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    optimization: 'shorten' | 'lengthen' | 'simplify' | 'professional'
  ): Promise<string> {
    const prompt = promptBuilderService.buildOptimizationPrompt(script, optimization);

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('脚本优化失败:', error);
      throw error;
    }
  }

  /**
   * 翻译脚本
   */
  async translateScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    targetLanguage: string
  ): Promise<string> {
    const prompt = `请将以下脚本翻译成${targetLanguage}，保持原有的语气和风格：

${script}

请直接返回翻译后的内容，不要添加解释。`;

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('翻译失败:', error);
      throw error;
    }
  }

  /**
   * 调用 AI API
   */
  private async callAPI(
    model: AIModel,
    settings: AIModelSettings,
    prompt: string,
    requestId?: string
  ): Promise<AIResponse> {
    if (this.useMock) {
      return this.mockCall(
        {
          model: settings.model ?? model.id,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的视频内容创作助手，擅长生成高质量的解说脚本。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: settings.temperature ?? 0.7,
          max_tokens: settings.maxTokens ?? 2000,
        },
        requestId
      );
    }

    // 构建请求配置
    const config: RequestConfig = {
      model: settings.model ?? model.id,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的视频内容创作助手，擅长生成高质量的解说脚本。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens ?? 2000,
    };

    // 缓存键：只有 temperature=0 时才使用缓存（确定性输出）
    const cacheKey =
      settings.temperature === 0
        ? `ai:${model.provider}:${model.id}:${prompt.slice(0, 100)}`
        : null;

    // 根据提供商调用不同的 API
    const callAPI = async (): Promise<AIResponse> => {
      switch (model.provider) {
        case 'openai':
          return this.callOpenAI(settings.apiKey!, config);
        case 'anthropic':
          return this.callAnthropic(settings.apiKey!, config);
        case 'google':
          return this.callGoogle(settings.apiKey!, config);
        case 'baidu':
          return this.callBaidu(settings.apiKey!, settings.apiSecret!, config);
        case 'alibaba':
          return this.callAlibaba(settings.apiKey!, config);
        case 'zhipu':
          return this.callZhipu(settings.apiKey!, config);
        default:
          if (this.useMock || !settings.apiKey) {
            return this.mockCall(config, requestId);
          }
          return this.mockCall(config, requestId);
      }
    };

    // 启用缓存以减少重复 API 调用
    if (cacheKey) {
      return (
        requestCache.get<AIResponse>(cacheKey) ??
        (async () => {
          const result = await callAPI();
          requestCache.set(cacheKey, result, 10 * 60 * 1000); // 10分钟 TTL
          return result;
        })()
      );
    }

    return callAPI();
  }

  /**
   * OpenAI API
   */
  private async callOpenAI(apiKey: string, config: RequestConfig): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  }

  /**
   * Anthropic API
   */
  private async callAnthropic(apiKey: string, config: RequestConfig): Promise<AIResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        messages: config.messages,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API 错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: data.usage,
      model: data.model,
    };
  }

  /**
   * Google Gemini API
   */
  private async callGoogle(apiKey: string, config: RequestConfig): Promise<AIResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: config.messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.max_tokens,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google API 错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      model: config.model,
    };
  }

  /**
   * 百度文心 API
   */
  private async callBaidu(
    apiKey: string,
    apiSecret: string,
    config: RequestConfig
  ): Promise<AIResponse> {
    // 获取 access token
    const tokenResponse = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
      { method: 'POST' }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const response = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${config.model}?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: config.messages,
          temperature: config.temperature,
          max_output_tokens: config.max_tokens,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`百度 API 错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.result,
      model: config.model,
    };
  }

  /**
   * 阿里通义千问 API
   */
  private async callAlibaba(apiKey: string, config: RequestConfig): Promise<AIResponse> {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      }
    );

    if (!response.ok) {
      throw new Error(`阿里云 API 错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  }

  /**
   * 智谱 GLM API
   */
  private async callZhipu(apiKey: string, config: RequestConfig): Promise<AIResponse> {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`智谱 API 错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  }

  /**
   * 模拟调用（用于测试）- 增强版
   */
  private async mockCall(config: RequestConfig, requestId?: string): Promise<AIResponse> {
    // 获取自定义配置
    let mockConfig: MockConfig = {};
    if (requestId && this.mockConfigs.has(requestId)) {
      mockConfig = this.mockConfigs.get(requestId)!;
    } else if (this.mockConfigs.has('default')) {
      mockConfig = this.mockConfigs.get('default')!;
    }

    const delay = mockConfig.delay ?? 1500 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 模拟失败
    if (mockConfig.shouldFail) {
      throw new Error(mockConfig.errorMessage ?? 'Mock API 错误');
    }

    // 使用自定义内容或默认内容
    const content = mockConfig.content ?? this.generateMockContent(config);

    return {
      content,
      usage: {
        prompt_tokens: Math.floor(content.length / 4),
        completion_tokens: Math.floor(content.length / 4),
        total_tokens: Math.floor(content.length / 2),
      },
      model: config.model,
    };
  }

  /**
   * 生成模拟内容
   */
  private generateMockContent(config: RequestConfig): string {
    // 根据用户输入生成相关内容
    const userMessage = config.messages.find((m) => m.role === 'user')?.content ?? '';

    // 检测请求类型并生成相关内容
    if (userMessage.includes('脚本') || userMessage.includes('主题')) {
      return this.generateMockScript(userMessage);
    } else if (userMessage.includes('分析') || userMessage.includes('视频')) {
      return this.generateMockAnalysis();
    } else if (userMessage.includes('翻译')) {
      return this.generateMockTranslation(userMessage);
    } else if (userMessage.includes('优化')) {
      return this.generateMockOptimization(userMessage);
    }

    // 默认响应
    return `这是一个模拟生成的回复。

【开场】
您好！我收到了您的请求，正在为您处理。

【内容】
根据您提供的信息，我已经完成了相应的分析和生成工作。
这只是一个模拟响应，用于测试和开发目的。

【结尾】
如需实际功能，请配置真实的 API Key。

感谢您的使用！`;
  }

  private generateMockScript(topic: string): string {
    // 提取主题
    const match = topic.match(/主题[：:](.+?)(?:\n|$)/);
    const theme = match ? match[1] : '通用主题';

    return `【${theme}】视频脚本

【开场】
大家好！欢迎来到今天的视频！我是你们的主播。

今天我们要聊的话题是——${theme}。让我们一起来深入了解一下吧！

【主体内容】
首先，让我们来看一下${theme}的基本概念。
这个话题涉及很多方面，包括：

1. 第一点：核心要点解析
   - 详细说明第一个要点的重要性
   - 实际应用场景和案例分析

2. 第二点：深度分析
   - 从多个角度进行解读
   - 专家观点和最新研究

3. 第三点：实用建议
   - 具体的操作步骤
   - 常见问题解答

【互动环节】
大家对这个话题有什么看法呢？
欢迎在评论区留言告诉我！

【总结】
希望通过今天的视频，能够帮助大家更好地理解${theme}。
如果喜欢本期内容，请点赞、关注、收藏！

感谢观看，我们下期再见！`;
  }

  private generateMockAnalysis(): string {
    return `【视频分析报告】

1. 内容摘要
本视频涵盖了多个主题，内容丰富、结构清晰。

2. 脚本风格建议
推荐使用专业但不失活泼的风格，适合广大观众群体。

3. 目标受众
主要面向对相关话题感兴趣的中青年用户群体。

4. 内容亮点
- 开头吸引力强
- 内容层次分明
- 结尾互动性好

5. 改进建议
- 可以增加更多视觉元素
- 适当加入背景音乐
- 控制单个知识点时长`;
  }

  private generateMockTranslation(originalText: string): string {
    return `[翻译版本]

这是一个翻译后的内容示例。

（原文本长度：${originalText.length} 字符）

翻译说明：
- 保持了原文的语气和风格
- 进行了适当的本地化调整
- 确保表达自然流畅

[翻译完成]`;
  }

  private generateMockOptimization(text: string): string {
    return `[优化后的版本]

【优化说明】
根据您的需求，已对原文进行了优化处理。

【优化内容】
${text.slice(0, 500)}...

【优化完成】`;
  }

  /**
   * 获取推荐的模型
   */
  getRecommendedModels(
    task: keyof typeof MODEL_RECOMMENDATIONS
  ): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return [...(MODEL_RECOMMENDATIONS[task] || [DEFAULT_LLM_MODEL])];
  }

  /**
   * 获取模型信息
   */
  getModelInfo(modelId: string): (typeof LLM_MODELS)[keyof typeof LLM_MODELS] | null {
    return Object.values(LLM_MODELS).find((m) => m.modelId === modelId) ?? null;
  }

  /**
   * 获取所有可用模型
   */
  getAllModels(): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return Object.values(LLM_MODELS);
  }

  /**
   * 获取国内推荐模型
   */
  getDomesticModels(): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return Object.values(LLM_MODELS).filter((m) =>
      ['baidu', 'alibaba', 'moonshot', 'zhipu', 'minimax'].includes(m.provider)
    );
  }

  /**
   * 解析脚本片段
   */
  private parseScriptSegments(content: string): ScriptSegment[] {
    // 简单的段落分割
    const paragraphs = content.split('\n\n').filter((p) => p.trim());

    return paragraphs.map((p, index) => ({
      id: `seg_${index + 1}`,
      startTime: index * 30,
      endTime: (index + 1) * 30,
      content: p.trim(),
      type: index === 0 ? 'narration' : index === paragraphs.length - 1 ? 'narration' : 'dialogue',
    }));
  }

  /**
   * 估算时长
   */
  private estimateDuration(wordCount: number): number {
    // 按每分钟 150 字计算
    return Math.ceil(wordCount / 150);
  }

  /**
   * 生成模拟场景
   */
  private generateMockScenes(duration: number): Scene[] {
    const scenes = [];
    const sceneCount = Math.min(Math.floor(duration / 30), 10);

    for (let i = 0; i < sceneCount; i++) {
      scenes.push({
        id: `scene_${i + 1}`,
        startTime: i * 30,
        endTime: Math.min((i + 1) * 30, duration),
        thumbnail: '',
        description: `场景 ${i + 1}`,
        tags: [`场景${i + 1}`],
      });
    }

    return scenes;
  }

  /**
   * 生成模拟关键帧
   */
  private generateMockKeyframes(duration: number): Keyframe[] {
    const keyframes = [];
    const count = Math.min(Math.floor(duration / 5), 20);

    for (let i = 0; i < count; i++) {
      keyframes.push({
        id: `kf_${i + 1}`,
        timestamp: i * 5,
        thumbnail: '',
        description: `关键帧 ${i + 1}`,
      });
    }

    return keyframes;
  }

  /**
   * 取消进行中的请求
   */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 流式生成（适用于支持的 API）
   */
  async *streamGenerate(
    prompt: string,
    options: {
      model: string;
      provider: string;
      signal?: AbortSignal;
      temperature?: number;
      max_tokens?: number;
    }
  ): AsyncGenerator<string> {
    const model = this.getModelById(options.model);
    if (!model) {
      throw new Error(`Model ${options.model} not found`);
    }

    // 对于不支持流式的提供商，使用普通调用并分块返回
    if (!['openai', 'anthropic', 'alibaba', 'zhipu'].includes(model.provider)) {
      const response = await this.generate(prompt, options);
      // 模拟流式输出
      const chunks = this.chunkText(response, 10);
      for (const chunk of chunks) {
        yield chunk;
      }
      return;
    }

    const settings: AIModelSettings = {
      enabled: true,
      apiKey: '',
      baseURL: '',
      model: model.id,
      temperature: options.temperature,
      maxTokens: options.max_tokens,
    } as AIModelSettings;

    // 根据提供商使用流式 API
    switch (model.provider) {
      case 'openai':
        yield* this.streamOpenAI(settings.apiKey!, {
          model: settings.model ?? model.id,
          messages: [
            { role: 'system', content: '你是一个专业的视频内容创作助手。' },
            { role: 'user', content: prompt },
          ],
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        });
        break;
      default: {
        // 默认分块返回
        const response = await this.callAPI(model, settings, prompt);
        const chunks = this.chunkText(response.content, 10);
        for (const chunk of chunks) {
          yield chunk;
        }
      }
    }
  }

  /**
   * OpenAI 流式 API
   */
  private async *streamOpenAI(apiKey: string, config: RequestConfig): AsyncGenerator<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...config, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 错误: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 将文本分块
   */
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 批量生成（并行处理多个请求）
   */
  async batchGenerate(
    prompts: string[],
    options: {
      model: string;
      provider: string;
      temperature?: number;
      max_tokens?: number;
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<string[]> {
    const concurrency = options.concurrency ?? 3;
    const results: string[] = new Array(prompts.length);
    let completed = 0;

    for (let i = 0; i < prompts.length; i += concurrency) {
      const batch = prompts.slice(i, i + concurrency);
      const batchPromises = batch.map((prompt, batchIndex) =>
        this.generate(prompt, options).then((result) => {
          results[i + batchIndex] = result;
          completed++;
          options.onProgress?.(completed, prompts.length);
        })
      );
      await Promise.all(batchPromises);
    }

    return results;
  }
}

export const aiService = new AIService();
