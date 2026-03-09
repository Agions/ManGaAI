import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  List,
  Button,
  message,
  Select,
  Steps,
  Typography,
  Space,
  Spin,
  Result,
  Alert
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, EditOutlined, CheckCircleOutlined, ThunderboltOutlined, UserOutlined, PictureOutlined, PlayCircleOutlined, SoundOutlined, ExportOutlined } from '@ant-design/icons';
import type { NovelMetadata } from '@/components/business/NovelImporter';
import type { StoryboardFrame } from '@/components/business/StoryboardEditor';
import type { AudioTrackConfig } from '@/components/business/AudioEditor';
import { loadProjectFromFile, saveProjectToFile, aiService } from '@/core/services/legacy';
import { audioPipelineService, collaborationService, costService, qualityGateService, reviewExportService, storyAnalysisService } from '@/core/services';
import type { ExportSettings, StoryAnalysis, Character, CompositionProject } from '@/core/types';
import type { EvaluationScores, FrameComment, QualityGateIssue, StoryboardVersion, VersionDiffSummary } from '@/core/services';
import { runWhenIdle } from '@/core/utils/idle';
import { v4 as uuid } from 'uuid';
import styles from './ProjectEdit.module.less';

const importNovelImporter = () => import('@/components/business/NovelImporter');
const importScriptEditor = () => import('@/components/business/ScriptEditor');
const importStoryboardEditor = () => import('@/components/business/StoryboardEditor');
const importRenderCenter = () => import('@/components/business/RenderCenter');
const importCharacterDesigner = () => import('@/components/business/CharacterDesigner/index');
const importCompositionStudio = () => import('@/components/business/CompositionStudio');
const importAudioEditor = () => import('@/components/business/AudioEditor');
const importVideoExporter = () => import('@/components/business/VideoExporter');
const importCostDashboard = () => import('@/components/business/CostDashboard');

const NovelImporter = lazy(importNovelImporter);
const ScriptEditor = lazy(importScriptEditor);
const StoryboardEditor = lazy(importStoryboardEditor);
const RenderCenter = lazy(importRenderCenter);
const CharacterDesigner = lazy(importCharacterDesigner);
const CompositionStudio = lazy(importCompositionStudio);
const AudioEditor = lazy(importAudioEditor);
const VideoExporter = lazy(importVideoExporter);
const CostDashboard = lazy(importCostDashboard);

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

interface ProjectData {
  id: string;
  name: string;
  description: string;
  content: string;
  novelMetadata?: NovelMetadata;
  storyAnalysis?: StoryAnalysis;
  storyboardFrames?: StoryboardFrame[];
  storyboardComments?: FrameComment[];
  storyboardVersions?: StoryboardVersion[];
  characters?: Character[];
  composition?: CompositionProject;
  audioConfig?: AudioTrackConfig;
  exportPreset?: '9:16' | '16:9' | '1:1';
  exportSettings?: Partial<ExportSettings>;
  evaluationSummary?: EvaluationScores;
  evaluationReport?: { summary?: EvaluationScores };
  script?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 项目编辑页面
 * 支持创建新项目或编辑现有项目
 */
const ProjectEdit: React.FC = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [content, setContent] = useState<string>('');
  const [novelMetadata, setNovelMetadata] = useState<NovelMetadata | null>(null);
  const [scriptText, setScriptText] = useState<string>('');
  const [storyAnalysis, setStoryAnalysis] = useState<StoryAnalysis | null>(null);
  const [storyboardFrames, setStoryboardFrames] = useState<StoryboardFrame[]>([]);
  const [analysisDraft, setAnalysisDraft] = useState<string>('');
  const [analysisState, setAnalysisState] = useState<'idle' | 'generated' | 'accepted'>('idle');
  const [selectedFrame, setSelectedFrame] = useState<StoryboardFrame | null>(null);
  const [storyboardComments, setStoryboardComments] = useState<FrameComment[]>([]);
  const [storyboardVersions, setStoryboardVersions] = useState<StoryboardVersion[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const [compareLeftVersionId, setCompareLeftVersionId] = useState<string | undefined>(undefined);
  const [compareRightVersionId, setCompareRightVersionId] = useState<string | undefined>(undefined);
  const [versionDiff, setVersionDiff] = useState<VersionDiffSummary | null>(null);
  const [focusFrameId, setFocusFrameId] = useState<string | undefined>(undefined);
  const [audioConfig, setAudioConfig] = useState<AudioTrackConfig>({
    voiceTracks: [],
    backgroundMusic: null,
    soundEffects: [],
    masterVolume: 80,
    voiceVolume: 80,
    musicVolume: 50,
    effectVolume: 70,
  });
  const [audioEditorKey, setAudioEditorKey] = useState('audio-init');
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [composition, setComposition] = useState<CompositionProject | null>(null);
  const [exportPreset, setExportPreset] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [exportSettings, setExportSettings] = useState<Partial<ExportSettings>>({
    format: 'mp4',
    quality: 'high',
    resolution: '1080p',
    frameRate: 30,
  });
  const [isNewProject, setIsNewProject] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evaluationSummary: EvaluationScores | undefined = project?.evaluationReport?.summary || project?.evaluationSummary;
  const exportQualityGate = useMemo(
    () =>
      qualityGateService.evaluate({
        storyboardFrames,
        evaluationSummary,
      }),
    [storyboardFrames, evaluationSummary]
  );
  const preloadByStep: Record<number, Array<() => Promise<unknown>>> = {
    0: [importScriptEditor, importStoryboardEditor],
    1: [importScriptEditor, importStoryboardEditor],
    2: [importStoryboardEditor, importCharacterDesigner],
    3: [importCharacterDesigner, importRenderCenter],
    4: [importRenderCenter, importCompositionStudio],
    5: [importCompositionStudio, importAudioEditor],
    6: [importAudioEditor, importVideoExporter],
    7: [importVideoExporter],
    8: [],
  };

  const preloadStepModules = (step: number) => {
    const tasks = preloadByStep[step] || [];
    tasks.forEach(task => {
      void task();
    });
  };

  useEffect(() => {
    const tasks = preloadByStep[currentStep] || [];
    if (tasks.length === 0) return;

    const warmup = () => preloadStepModules(currentStep);
    return runWhenIdle(warmup, { timeoutMs: 120 });
  }, [currentStep]);

  // 初始化 - 加载项目数据（如果是编辑现有项目）
  useEffect(() => {
    if (projectId) {
      setInitialLoading(true);
      setIsNewProject(false);

      loadProjectFromFile(projectId)
        .then(projectText => {
          const projectData = JSON.parse(projectText) as ProjectData;
          setProject(projectData);
          form.setFieldsValue({
            name: projectData.name,
            description: projectData.description
          });

          if (projectData.content) {
            setContent(projectData.content);
          }

          if (projectData.novelMetadata) {
            setNovelMetadata(projectData.novelMetadata);
          }

          if (projectData.storyAnalysis) {
            setStoryAnalysis(projectData.storyAnalysis);
            setAnalysisDraft(JSON.stringify(projectData.storyAnalysis, null, 2));
            setAnalysisState('accepted');
          }

          if (Array.isArray(projectData.storyboardFrames)) {
            setStoryboardFrames(projectData.storyboardFrames);
          }
          if (Array.isArray(projectData.storyboardComments) || Array.isArray(projectData.storyboardVersions)) {
            collaborationService.hydrate(
              projectData.id,
              projectData.storyboardComments || [],
              projectData.storyboardVersions || []
            );
            setStoryboardComments(collaborationService.listComments(projectData.id));
            setStoryboardVersions(collaborationService.listVersions(projectData.id));
          }

          if (projectData.audioConfig) {
            setAudioConfig(projectData.audioConfig);
            setAudioEditorKey(`audio-${Date.now()}`);
          }

          if (Array.isArray(projectData.characters)) {
            setCharacters(projectData.characters);
          }

          if (projectData.composition) {
            setComposition(projectData.composition);
          }

          if (projectData.exportPreset) {
            setExportPreset(projectData.exportPreset);
          }
          if (projectData.exportSettings) {
            setExportSettings(projectData.exportSettings);
          }

          if (projectData.script) {
            setScriptText(projectData.script);
            // 如果已经有剧本，进入剧本编辑步骤
            setCurrentStep(2);
          } else if (projectData.content) {
            // 如果只有内容，进入AI解析步骤
            setCurrentStep(1);
          }

          const search = new URLSearchParams(location.search);
          const frameId = search.get('frameId');
          const stepValue = search.get('step');
          if (frameId) {
            setCurrentStep(3);
            setFocusFrameId(frameId);
          } else if (stepValue) {
            const nextStep = Number(stepValue);
            if (Number.isInteger(nextStep) && nextStep >= 0 && nextStep <= 8) {
              setCurrentStep(nextStep);
            }
          }

          setError(null);
        })
        .catch(err => {
          console.error('加载项目失败:', err);
          setError('加载项目失败，请确认项目文件是否存在');
          message.error('加载项目失败');
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, [projectId, form, location.search]);

  // 处理小说内容导入
  const handleContentLoad = (newContent: string, metadata: NovelMetadata) => {
    setContent(newContent);
    setNovelMetadata(metadata);
    setStoryAnalysis(null);
    setStoryboardFrames([]);
    setAnalysisDraft('');
    setAnalysisState('idle');
    setSelectedFrame(null);
    setStoryboardComments([]);
    setStoryboardVersions([]);
    setCommentDraft('');
    setVersionLabel('');
    setCompareLeftVersionId(undefined);
    setCompareRightVersionId(undefined);
    setVersionDiff(null);

    // 自动进入下一步
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  };

  // 处理内容移除
  const handleContentRemove = () => {
    setContent('');
    setNovelMetadata(null);
    setScriptText('');
    setStoryAnalysis(null);
    setStoryboardFrames([]);
    setAnalysisDraft('');
    setAnalysisState('idle');
    setAudioConfig({
      voiceTracks: [],
      backgroundMusic: null,
      soundEffects: [],
      masterVolume: 80,
      voiceVolume: 80,
      musicVolume: 50,
      effectVolume: 70,
    });
  };

  const buildStoryboardDraft = (analysis: StoryAnalysis): StoryboardFrame[] => {
    const draft = analysis.chapters.slice(0, 20).map((chapter, index) => ({
      id: `frame_${Date.now()}_${index}`,
      title: chapter.title || `分镜 ${index + 1}`,
      sceneDescription: chapter.summary || '',
      composition: index % 2 === 0 ? '三分法' : '中心构图',
      cameraType: index % 3 === 0 ? 'wide' : index % 3 === 1 ? 'medium' : 'closeup',
      dialogue: chapter.keyEvents?.[0] || '',
      duration: 5,
    }));

    return draft.length > 0 ? draft : [{
      id: `frame_${Date.now()}_0`,
      title: '分镜 1',
      sceneDescription: analysis.summary || '',
      composition: '三分法',
      cameraType: 'medium',
      dialogue: '',
      duration: 5,
    }];
  };

  const handleApplyRenderedFrame = (frameId: string, imageUrl: string) => {
    setStoryboardFrames(prev =>
      prev.map(frame => (frame.id === frameId ? { ...frame, imageUrl } : frame))
    );
  };

  const handleAddFrameComment = () => {
    if (!project?.id || !selectedFrame || !commentDraft.trim()) return;
    collaborationService.addComment({
      projectId: project.id,
      frameId: selectedFrame.id,
      content: commentDraft.trim(),
      author: 'current-user',
    });
    setStoryboardComments(collaborationService.listComments(project.id));
    setCommentDraft('');
  };

  const handleSaveStoryboardVersion = () => {
    if (!project?.id) return;
    const version = collaborationService.saveVersion({
      projectId: project.id,
      label: versionLabel.trim() || `版本-${new Date().toLocaleTimeString()}`,
      createdBy: 'current-user',
      payload: storyboardFrames,
    });
    const versions = collaborationService.listVersions(project.id);
    setStoryboardVersions(versions);
    setVersionLabel('');
    setCompareLeftVersionId(version.id);
    message.success('已保存分镜版本快照');
  };

  const handleCompareVersions = () => {
    if (!compareLeftVersionId || !compareRightVersionId) {
      message.warning('请选择两个版本进行对比');
      return;
    }
    const diff = collaborationService.diffVersions(compareLeftVersionId, compareRightVersionId);
    setVersionDiff(diff);
  };

  const handleRollbackVersion = () => {
    if (!project?.id || !compareLeftVersionId) {
      message.warning('请选择要回滚的版本');
      return;
    }
    const payload = collaborationService.rollback(project.id, compareLeftVersionId);
    if (Array.isArray(payload)) {
      setStoryboardFrames(payload as StoryboardFrame[]);
      message.success('已回滚到所选版本');
      return;
    }
    message.error('回滚失败，未找到对应版本');
  };

  const handleGenerateVoices = async () => {
    if (!scriptText.trim()) {
      message.warning('请先完成剧本生成');
      return;
    }

    try {
      setAudioGenerating(true);
      message.info('正在生成配音轨道，请稍候...');

      const result = await audioPipelineService.generateVoiceTracks(scriptText, storyAnalysis, {
        maxLines: 20,
        projectId: project?.id,
      });

      setAudioConfig(prev => ({
        ...prev,
        voiceTracks: result.voiceTracks as AudioTrackConfig['voiceTracks'],
      }));
      setAudioEditorKey(`audio-${Date.now()}`);

      if (result.failedLines.length > 0) {
        message.warning(`已生成 ${result.voiceTracks.length} 条配音，${result.failedLines.length} 条失败`);
      } else {
        message.success(`已生成 ${result.voiceTracks.length} 条配音`);
      }
    } catch (error) {
      console.error('自动生成配音失败:', error);
      message.error('自动生成配音失败');
    } finally {
      setAudioGenerating(false);
    }
  };

  // 处理AI解析
  const handleAnalyzeContent = async () => {
    if (!content) {
      message.error('请先导入小说/剧本内容');
      return;
    }

    try {
      setLoading(true);
      message.info('正在结构化分析内容，请稍候...');

      const analyzed = await storyAnalysisService.analyze(content, {
        provider: 'alibaba',
        model: 'qwen-3.5',
        maxRetries: 2,
        projectId: project?.id,
      });

      setStoryAnalysis(analyzed);
      setAnalysisDraft(JSON.stringify(analyzed, null, 2));
      setAnalysisState('generated');
      message.success('结构化解析完成，请确认结果后继续');
    } catch (error) {
      console.error('AI解析失败:', error);
      message.error('AI解析失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAnalysis = async () => {
    if (!analysisDraft.trim()) {
      message.error('请先生成解析结果');
      return;
    }

    try {
      const parsed = JSON.parse(analysisDraft) as StoryAnalysis;
      setStoryAnalysis(parsed);
      setAnalysisState('accepted');
      if (storyboardFrames.length === 0) {
        setStoryboardFrames(buildStoryboardDraft(parsed));
      }

      setLoading(true);
      message.info('正在根据解析结果生成剧本...');

      const generatedScript = await aiService.generate(
        `请基于以下故事结构生成适合漫剧制作的剧本：\n\n${JSON.stringify(parsed, null, 2)}\n\n要求：按场景输出，包含旁白、对白、动作描述。`,
        { model: 'gpt-4', provider: 'openai' }
      );

      setScriptText(generatedScript);
      message.success('剧本生成完成');
      setCurrentStep(2);
    } catch (error) {
      console.error('接受解析结果失败:', error);
      message.error('解析 JSON 格式无效，请修正后重试');
    } finally {
      setLoading(false);
    }
  };


  // 保存项目
  const handleSaveProject = async () => {
    try {
      // 验证表单
      await form.validateFields();

      // 检查内容是否已导入
      if (!content) {
        message.error('请先导入小说/剧本内容');
        return;
      }

      setSaving(true);

      // 准备项目数据
      const formData = form.getFieldsValue();
      const now = new Date().toISOString();

      const projectData: ProjectData = {
        id: project?.id || uuid(),
        name: formData.name,
        description: formData.description,
        content: content,
        createdAt: project?.createdAt || now,
        updatedAt: now,
        novelMetadata: novelMetadata || undefined,
        storyAnalysis: storyAnalysis || undefined,
        storyboardFrames: storyboardFrames.length > 0 ? storyboardFrames : undefined,
        storyboardComments: storyboardComments.length > 0 ? storyboardComments : undefined,
        storyboardVersions: storyboardVersions.length > 0 ? storyboardVersions : undefined,
        characters: characters.length > 0 ? characters : undefined,
        composition: composition || undefined,
        audioConfig: audioConfig,
        exportPreset,
        exportSettings,
        script: scriptText || undefined
      };

      // 保存项目文件
      await saveProjectToFile(projectData.id, JSON.stringify(projectData));

      message.success('项目保存成功');
      setProject(projectData);

      // 如果是创建新项目，保存后跳转到项目详情页
      if (isNewProject) {
        navigate(`/project/${projectData.id}`);
      }
    } catch (error) {
      console.error('保存项目失败:', error);
      message.error('保存项目失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 导出脚本
  const handleExportScript = (format: string) => {
    message.info(`导出脚本为 ${format.toUpperCase()} 格式`);
    // 这里实现脚本导出功能
  };

  const handleExportReviewNotes = async () => {
    if (!project?.id) {
      message.warning('请先加载项目后再导出评审记录');
      return;
    }
    try {
      const projectComments = collaborationService.listComments(project.id);
      const projectVersions = collaborationService.listVersions(project.id);
      const projectCostStats = costService.getProjectStats(project.id);
      const projectCostRecords = costService.getRecords(project.id).slice(0, 30);
      const content = reviewExportService.toMarkdown({
        project: {
          id: project.id,
          name: form.getFieldValue('name') || project.name || '未命名项目',
          storyboardFrameCount: storyboardFrames.length,
        },
        comments: projectComments,
        versions: projectVersions,
        costStats: projectCostStats,
        costRecords: projectCostRecords,
        evaluationSummary,
      });
      const saved = await reviewExportService.saveMarkdownToFile(
        `${project.name}_评审记录.md`,
        content,
        {
          projectId: project.id,
          projectName: form.getFieldValue('name') || project.name || '未命名项目',
          source: 'project_edit',
        },
      );
      if (saved) {
        message.success('评审记录导出成功');
      }
    } catch (error) {
      console.error('导出评审记录失败:', error);
      message.error('导出评审记录失败');
    }
  };

  const handleLocateIssueFrame = (issue: QualityGateIssue) => {
    if (!issue.frameId) {
      message.info('该问题暂无具体分镜定位信息');
      return;
    }
    const exists = storyboardFrames.some((frame) => frame.id === issue.frameId);
    if (!exists) {
      message.warning('定位分镜不存在，可能已被删除');
      return;
    }
    setCurrentStep(3);
    setFocusFrameId(issue.frameId);
    const frameIndex = typeof issue.frameIndex === 'number' ? issue.frameIndex + 1 : undefined;
    message.success(`已定位到${frameIndex ? `第 ${frameIndex} 镜` : '目标分镜'}`);
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <FileTextOutlined /> 导入小说/剧本
            </Title>
            <Paragraph>
              请导入小说或剧本文件，支持 TXT、MD、DOCX 格式。您也可以直接粘贴内容。
            </Paragraph>
            <NovelImporter
              initialContent={content}
              onContentLoad={handleContentLoad}
              onRemove={handleContentRemove}
              loading={loading}
            />
            <div className={styles.stepActions}>
              <Button
                type="primary"
                onClick={() => setCurrentStep(1)}
                disabled={!content}
              >
                下一步
              </Button>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <EditOutlined /> AI解析内容
            </Title>
            <Paragraph>
              使用AI智能分析小说/剧本内容，提取关键信息，生成适合漫剧展示的剧本。
            </Paragraph>

            <Spin spinning={loading} tip="正在AI解析...">
              <div className={styles.analyzeContent}>
                <NovelImporter
                  initialContent={content}
                  onContentLoad={handleContentLoad}
                  onRemove={handleContentRemove}
                  loading={false}
                />

                {novelMetadata && (
                  <div className={styles.contentInfo}>
                    <Title level={5}>内容信息</Title>
                    <p>文件名: {novelMetadata.filename}</p>
                    <p>字符数: {novelMetadata.charCount.toLocaleString()}</p>
                    <p>章节数: {novelMetadata.chapterCount}</p>
                    <p>预估章节数: {novelMetadata.estimatedChapters}</p>
                  </div>
                )}

                {analysisState !== 'idle' && (
                  <div className={styles.analysisPanel}>
                    <Title level={5}>结构化解析结果（可编辑）</Title>
                    {analysisState === 'accepted' && (
                      <Alert type="success" message="当前解析结果已接受，可重跑覆盖" showIcon style={{ marginBottom: 12 }} />
                    )}
                    <Input.TextArea
                      value={analysisDraft}
                      rows={14}
                      onChange={(e) => setAnalysisDraft(e.target.value)}
                      placeholder="AI 解析 JSON 结果"
                    />
                  </div>
                )}
              </div>
            </Spin>

            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  上一步
                </Button>
                {analysisState !== 'idle' && (
                  <Button onClick={handleAnalyzeContent} loading={loading}>
                    重新解析
                  </Button>
                )}
                {analysisState === 'generated' || analysisState === 'accepted' ? (
                  <Button type="primary" onClick={handleAcceptAnalysis} loading={loading}>
                    接受并生成剧本
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleAnalyzeContent}
                    loading={loading}
                  >
                    开始AI解析
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <EditOutlined /> 编辑剧本
            </Title>
            <Paragraph>
              编辑和优化AI生成的剧本内容，可以添加、删除或修改片段。
            </Paragraph>

            <ScriptEditor
              videoPath=""
              initialSegments={[]}
              onSave={(segments) => setScriptText(segments as any)}
              onExport={handleExportScript}
            />

            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(1)}>
                  上一步
                </Button>
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(3)}
                >
                  下一步
                </Button>
              </Space>
            </div>
          </Card>
        );

      // Step 3: 分镜设计
      case 3:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <PictureOutlined /> 分镜设计
            </Title>
            <Paragraph>
              设计漫画分镜，确定每个场景的构图和镜头。
            </Paragraph>
            <div className={styles.storyboardContainer}>
              <div className={styles.storyboardActions}>
                <Button
                  onClick={() => {
                    if (!storyAnalysis) {
                      message.warning('请先完成 AI 结构化解析');
                      return;
                    }
                    setStoryboardFrames(buildStoryboardDraft(storyAnalysis));
                    message.success('已根据解析结果生成分镜草案');
                  }}
                >
                  生成分镜草案
                </Button>
              </div>
              <StoryboardEditor
                key={`${storyboardFrames.length}-${storyboardFrames[0]?.id || 'none'}`}
                initialFrames={storyboardFrames}
                focusFrameId={focusFrameId}
                onChange={setStoryboardFrames}
                onFrameSelect={setSelectedFrame}
              />
              <div className={styles.collaborationPanel}>
                <div className={styles.collabSection}>
                  <Title level={5}>镜头评论</Title>
                  <Space.Compact className={styles.commentInputWrap}>
                    <Input
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder={selectedFrame ? `对 ${selectedFrame.title} 添加评论` : '先选中一个分镜'}
                      disabled={!selectedFrame}
                    />
                    <Button type="primary" onClick={handleAddFrameComment} disabled={!selectedFrame || !commentDraft.trim()}>
                      添加
                    </Button>
                  </Space.Compact>
                  <List
                    size="small"
                    dataSource={project?.id ? collaborationService.listComments(project.id, selectedFrame?.id) : []}
                    locale={{ emptyText: '暂无评论' }}
                    renderItem={(item) => (
                      <List.Item>
                        <div>
                          <div>{item.content}</div>
                          <Text type="secondary">{new Date(item.createdAt).toLocaleString()}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
                <div className={styles.collabSection}>
                  <Title level={5}>版本管理</Title>
                  <Space className={styles.versionRow} wrap>
                    <Input
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                      placeholder="版本标签（可选）"
                      style={{ width: 220 }}
                    />
                    <Button onClick={handleSaveStoryboardVersion}>保存快照</Button>
                  </Space>
                  <Space className={styles.versionRow} wrap>
                    <Select
                      placeholder="选择版本A"
                      value={compareLeftVersionId}
                      onChange={setCompareLeftVersionId}
                      style={{ width: 180 }}
                      options={storyboardVersions.map(v => ({ value: v.id, label: `${v.label}` }))}
                    />
                    <Select
                      placeholder="选择版本B"
                      value={compareRightVersionId}
                      onChange={setCompareRightVersionId}
                      style={{ width: 180 }}
                      options={storyboardVersions.map(v => ({ value: v.id, label: `${v.label}` }))}
                    />
                    <Button onClick={handleCompareVersions}>版本差异</Button>
                    <Button danger onClick={handleRollbackVersion}>回滚到版本A</Button>
                  </Space>
                  {versionDiff && (
                    <Alert
                      type={versionDiff.changeCount > 0 ? 'info' : 'success'}
                      showIcon
                      message={`差异字段数: ${versionDiff.changeCount}`}
                      description={versionDiff.changedKeys.slice(0, 6).join(', ') || '无差异'}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(2)}>上一步</Button>
                <Button type="primary" onClick={() => setCurrentStep(4)}>下一步</Button>
              </Space>
            </div>
          </Card>
        );

      // Step 4: 角色设计
      case 4:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <UserOutlined /> 角色设计
            </Title>
            <Paragraph>
              为故事中的角色创建和管理形象档案，确保视觉一致性。
            </Paragraph>
            <div className={styles.characterDesignerContainer}>
              <CharacterDesigner
                characters={characters}
                onChange={setCharacters}
                projectId={project?.id}
              />
            </div>
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(3)}>上一步</Button>
                <Button type="primary" onClick={() => setCurrentStep(5)}>下一步</Button>
              </Space>
            </div>
          </Card>
        );

      // Step 5: 场景渲染
      case 5:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <CheckCircleOutlined /> 场景渲染
            </Title>
            <Paragraph>
              渲染漫画场景，包括背景、道具和光影效果。
            </Paragraph>
            <div className={styles.renderCenterContainer}>
              <RenderCenter
                frames={storyboardFrames}
                projectId={project?.id}
                onApplyRenderedFrame={handleApplyRenderedFrame}
              />
            </div>
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(4)}>上一步</Button>
                <Button type="primary" onClick={() => setCurrentStep(6)}>下一步</Button>
              </Space>
            </div>
          </Card>
        );

      // Step 6: 动态合成
      case 6:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <PlayCircleOutlined /> 动态合成
            </Title>
            <Paragraph>
              为分镜添加动画效果和镜头运动，让画面动起来。
            </Paragraph>
            <div className={styles.compositionStudioContainer}>
              <CompositionStudio
                frames={storyboardFrames}
                projectId={project?.id}
                onCompositionChange={(comp) => {
                  setComposition(comp);
                }}
              />
            </div>
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(5)}>上一步</Button>
                <Button type="primary" onClick={() => setCurrentStep(7)}>下一步</Button>
              </Space>
            </div>
          </Card>
        );

      // Step 7: 配音配乐
      case 7:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <SoundOutlined /> 配音配乐
            </Title>
            <Paragraph>
              添加配音和背景音乐。
            </Paragraph>
            <div className={styles.audioActions}>
              <Button
                type="primary"
                onClick={handleGenerateVoices}
                loading={audioGenerating}
                disabled={!scriptText}
              >
                一键生成配音
              </Button>
            </div>
            <div className={styles.audioContainer}>
              <AudioEditor
                key={audioEditorKey}
                initialConfig={audioConfig}
                onConfigChange={setAudioConfig}
                videoDuration={Math.max(storyboardFrames.length * 5, 60)}
              />
            </div>
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(6)}>上一步</Button>
                <Button type="primary" onClick={() => setCurrentStep(8)}>下一步</Button>
              </Space>
            </div>
          </Card>
        );

      // Step 8: 导出
      case 8:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <ExportOutlined /> 视频导出
            </Title>
            <Paragraph>
              导出最终漫剧视频。
            </Paragraph>
            <div className={styles.exportPresetBar}>
              <Space>
                <Button
                  type={exportPreset === '9:16' ? 'primary' : 'default'}
                  onClick={() => setExportPreset('9:16')}
                >
                  竖屏 9:16
                </Button>
                <Button
                  type={exportPreset === '16:9' ? 'primary' : 'default'}
                  onClick={() => setExportPreset('16:9')}
                >
                  横屏 16:9
                </Button>
                <Button
                  type={exportPreset === '1:1' ? 'primary' : 'default'}
                  onClick={() => setExportPreset('1:1')}
                >
                  方屏 1:1
                </Button>
              </Space>
            </div>
            <div className={styles.exporterContainer}>
              <Alert
                type={exportQualityGate.passed ? 'success' : 'warning'}
                showIcon
                className={styles.qualityGateAlert}
                message={exportQualityGate.passed ? '质量闸门已通过，可执行导出' : '质量闸门未完全通过，建议先修复以下问题'}
                description={(
                  <ul className={styles.qualityGateList}>
                    {exportQualityGate.issues.length > 0 ? (
                      exportQualityGate.issues.map((issue) => (
                        <li key={issue.code}>
                          [{issue.level === 'error' ? '阻断' : '建议'}] {issue.title}：{issue.detail}
                          {typeof issue.frameIndex === 'number' ? `（第 ${issue.frameIndex + 1} 镜）` : ''}
                          {issue.field ? ` 字段: ${issue.field}` : ''}
                          {issue.frameId ? (
                            <Button type="link" size="small" onClick={() => handleLocateIssueFrame(issue)}>
                              定位修复
                            </Button>
                          ) : null}
                        </li>
                      ))
                    ) : (
                      <li>分镜数量、镜头覆盖与评测摘要达到默认阈值。</li>
                    )}
                  </ul>
                )}
              />
              <VideoExporter
                projectId={project?.id}
                projectName={form.getFieldValue('name') || '未命名项目'}
                estimatedDuration={Math.max(storyboardFrames.length * 5, 60)}
                initialSettings={exportSettings}
                onExport={async (settings) => {
                  if (!exportQualityGate.passed) {
                    message.error('质量闸门未通过，已阻止导出。请先修复阻断项。');
                    return;
                  }
                  setExportSettings(settings);
                  costService.recordStorageCost('local-export', Math.max(storyboardFrames.length * 2, 30), {
                    operation: 'video_export',
                    projectId: project?.id,
                    preset: exportPreset,
                    format: settings.format
                  });
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  message.success(`已按 ${exportPreset} 预设完成导出任务`);
                }}
              />
            </div>
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(7)}>上一步</Button>
                <Button
                  type="primary"
                  onClick={handleSaveProject}
                  loading={saving}
                >
                  保存项目
                </Button>
              </Space>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  // 如果加载失败，显示错误信息
  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle={error}
        extra={[
          <Button key="back" onClick={handleBack}>
            返回
          </Button>
        ]}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Spin spinning={initialLoading} tip="加载项目中...">
        <div className={styles.header}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            返回
          </Button>
          <Title level={3}>
            {isNewProject ? '创建新项目' : '编辑项目'}
          </Title>
          <Space>
            <Button
              icon={<FileTextOutlined />}
              onClick={handleExportReviewNotes}
              disabled={!project?.id}
            >
              导出评审记录
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSaveProject}
              loading={saving}
            >
              保存项目
            </Button>
          </Space>
        </div>
        
        <Card className={styles.card}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              name: '',
              description: ''
            }}
          >
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" maxLength={100} />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="项目描述"
            >
              <Input.TextArea 
                placeholder="请输入项目描述（选填）" 
                rows={2} 
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </Card>

        <Suspense fallback={<Spin style={{ width: '100%' }} />}>
          <CostDashboard projectId={project?.id} />
        </Suspense>
        
        <div className={styles.stepsContainer}>
          <Steps
            current={currentStep}
            onChange={setCurrentStep}
            items={[
              {
                title: <span onMouseEnter={() => preloadStepModules(0)} onFocus={() => preloadStepModules(0)}>导入</span>,
                icon: <FileTextOutlined />,
                description: '小说/剧本',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(1)} onFocus={() => preloadStepModules(1)}>AI解析</span>,
                icon: <ThunderboltOutlined />,
                description: '智能分析',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(2)} onFocus={() => preloadStepModules(2)}>剧本</span>,
                icon: <EditOutlined />,
                description: '生成剧本',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(3)} onFocus={() => preloadStepModules(3)}>分镜</span>,
                icon: <PictureOutlined />,
                description: '漫画分镜',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(4)} onFocus={() => preloadStepModules(4)}>角色</span>,
                icon: <UserOutlined />,
                description: '角色形象',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(5)} onFocus={() => preloadStepModules(5)}>渲染</span>,
                icon: <CheckCircleOutlined />,
                description: '场景渲染',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(6)} onFocus={() => preloadStepModules(6)}>合成</span>,
                icon: <PlayCircleOutlined />,
                description: '动态效果',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(7)} onFocus={() => preloadStepModules(7)}>配音</span>,
                icon: <SoundOutlined />,
                description: '配音配乐',
              },
              {
                title: <span onMouseEnter={() => preloadStepModules(8)} onFocus={() => preloadStepModules(8)}>导出</span>,
                icon: <ExportOutlined />,
                description: '视频导出',
              },
            ]}
          />
        </div>
        
        <div className={styles.stepsContent}>
          <Suspense fallback={<Spin style={{ width: '100%' }} tip="加载模块中..." />}>
            {renderStepContent()}
          </Suspense>
        </div>
      </Spin>
    </div>
  );
};

export default ProjectEdit; 
