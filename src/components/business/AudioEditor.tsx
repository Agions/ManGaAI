import React, { useState, useRef, useEffect } from 'react';
import { Card, Tabs, Button, Upload, Slider, Switch, Select, Space, Table, Tag, message, Popconfirm, Input, Row, Col, Tooltip, Progress, Empty } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  CustomerServiceOutlined,
  AudioOutlined,
  SettingOutlined,
  AudioMutedOutlined,
  FolderOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { open } from '@tauri-apps/api/dialog';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import styles from './AudioEditor.module.less';

// ========== 类型定义 ==========

// 配音轨道类型
export interface VoiceTrack {
  id: string;
  name: string;
  filePath: string;
  fileUrl?: string;
  duration: number;
  startTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  type: 'dubbing' | 'voiceover';
}

// 背景音乐类型
export interface BackgroundMusic {
  id: string;
  name: string;
  filePath: string;
  fileUrl?: string;
  duration: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
  startTime: number;
}

// 音效类型
export interface SoundEffect {
  id: string;
  name: string;
  filePath: string;
  fileUrl?: string;
  duration: number;
  volume: number;
  startTime: number;
  category: string;
}

// 音频轨道完整配置
export interface AudioTrackConfig {
  voiceTracks: VoiceTrack[];
  backgroundMusic: BackgroundMusic | null;
  soundEffects: SoundEffect[];
  masterVolume: number;
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
}

// 组件属性
interface AudioEditorProps {
  initialConfig?: Partial<AudioTrackConfig>;
  onConfigChange?: (config: AudioTrackConfig) => void;
  videoDuration?: number;
  disabled?: boolean;
}

// 预设背景音乐列表
const PRESET_BGM_LIST = [
  { id: 'bgm-1', name: '温馨回忆', category: '温暖', duration: 180 },
  { id: 'bgm-2', name: '紧张悬疑', category: '悬疑', duration: 120 },
  { id: 'bgm-3', name: '欢快节奏', category: '欢快', duration: 150 },
  { id: 'bgm-4', name: '浪漫钢琴', category: '浪漫', duration: 200 },
  { id: 'bgm-5', name: '史诗大片', category: '史诗', duration: 240 },
  { id: 'bgm-6', name: '轻松午后', category: '轻松', duration: 160 },
];

// 预设音效列表
const PRESET_SFX_LIST = [
  { id: 'sfx-1', name: '门铃声', category: '环境' },
  { id: 'sfx-2', name: '电话铃', category: '环境' },
  { id: 'sfx-3', name: '脚步声', category: '动作' },
  { id: 'sfx-4', name: '敲门声', category: '动作' },
  { id: 'sfx-5', name: '鼓掌声', category: '动作' },
  { id: 'sfx-6', name: '笑声', category: '情感' },
  { id: 'sfx-7', name: '哭声', category: '情感' },
  { id: 'sfx-8', name: '风声', category: '自然' },
  { id: 'sfx-9', name: '雨声', category: '自然' },
  { id: 'sfx-10', name: '雷声', category: '自然' },
];

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 生成唯一ID
const generateId = (): string => {
  return `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const AudioEditor: React.FC<AudioEditorProps> = ({
  initialConfig,
  onConfigChange,
  videoDuration = 60,
  disabled = false,
}) => {
  // ========== State ==========
  const [voiceTracks, setVoiceTracks] = useState<VoiceTrack[]>(initialConfig?.voiceTracks || []);
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundMusic | null>(initialConfig?.backgroundMusic || null);
  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>(initialConfig?.soundEffects || []);
  const [masterVolume, setMasterVolume] = useState(initialConfig?.masterVolume ?? 80);
  const [voiceVolume, setVoiceVolume] = useState(initialConfig?.voiceVolume ?? 80);
  const [musicVolume, setMusicVolume] = useState(initialConfig?.musicVolume ?? 50);
  const [effectVolume, setEffectVolume] = useState(initialConfig?.effectVolume ?? 70);
  const [activeTab, setActiveTab] = useState('voice');

  // 播放状态
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playingMusic, setPlayingMusic] = useState(false);
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);

  // 录音状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 音频元素引用
  const voiceAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // ========== Effects ==========
  useEffect(() => {
    // 通知配置变化
    if (onConfigChange) {
      onConfigChange({
        voiceTracks,
        backgroundMusic,
        soundEffects,
        masterVolume,
        voiceVolume,
        musicVolume,
        effectVolume,
      });
    }
  }, [voiceTracks, backgroundMusic, soundEffects, masterVolume, voiceVolume, musicVolume, effectVolume]);

  // 清理音频元素
  useEffect(() => {
    return () => {
      voiceAudioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current.src = '';
      }
      sfxAudioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // ========== 配音轨道处理 ==========
  const handleVoiceImport = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: '音频文件',
          extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']
        }]
      });

      if (!selected || !Array.isArray(selected)) {
        return;
      }

      const newTracks: VoiceTrack[] = [];
      for (const filePath of selected) {
        const fileName = filePath.split('/').pop() || '配音音频';
        const audio = new Audio(convertFileSrc(filePath));

        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
            newTracks.push({
              id: generateId(),
              name: fileName.replace(/\.[^/.]+$/, ''),
              filePath,
              fileUrl: convertFileSrc(filePath),
              duration: audio.duration,
              startTime: 0,
              volume: 80,
              fadeIn: 0,
              fadeOut: 0,
              type: 'dubbing',
            });
            resolve();
          };
          audio.onerror = () => {
            message.error(`无法加载音频文件: ${fileName}`);
            resolve();
          };
        });
      }

      if (newTracks.length > 0) {
        setVoiceTracks([...voiceTracks, ...newTracks]);
        message.success(`成功导入 ${newTracks.length} 个配音文件`);
      }
    } catch (error) {
      console.error('导入配音失败:', error);
      message.error('导入配音失败，请重试');
    }
  };

  const handleVoiceRemove = (id: string) => {
    setVoiceTracks(voiceTracks.filter(track => track.id !== id));
    message.success('配音已移除');
  };

  const handleVoicePlay = (track: VoiceTrack) => {
    if (playingVoiceId === track.id) {
      const audio = voiceAudioRefs.current.get(track.id);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingVoiceId(null);
    } else {
      // 停止其他音频
      voiceAudioRefs.current.forEach((audio, id) => {
        if (id !== track.id) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        setPlayingMusic(false);
      }
      sfxAudioRefs.current.forEach((audio, id) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setPlayingSfxId(null);

      let audio = voiceAudioRefs.current.get(track.id);
      if (!audio && track.fileUrl) {
        audio = new Audio(track.fileUrl);
        voiceAudioRefs.current.set(track.id, audio);
      }
      if (audio) {
        audio.volume = (track.volume / 100) * (voiceVolume / 100) * (masterVolume / 100);
        audio.play();
        setPlayingVoiceId(track.id);
        audio.onended = () => setPlayingVoiceId(null);
      }
    }
  };

  const handleVoiceVolumeChange = (id: string, volume: number) => {
    setVoiceTracks(voiceTracks.map(track =>
      track.id === id ? { ...track, volume } : track
    ));
  };

  const handleVoiceStartTimeChange = (id: string, startTime: number) => {
    setVoiceTracks(voiceTracks.map(track =>
      track.id === id ? { ...track, startTime } : track
    ));
  };

  // ========== 背景音乐处理 ==========
  const handleMusicSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: '音频文件',
          extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']
        }]
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      const filePath = selected as string;
      const fileName = filePath.split('/').pop() || '背景音乐';
      const audio = new Audio(convertFileSrc(filePath));

      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          setBackgroundMusic({
            id: generateId(),
            name: fileName.replace(/\.[^/.]+$/, ''),
            filePath,
            fileUrl: convertFileSrc(filePath),
            duration: audio.duration,
            volume: 50,
            fadeIn: 2,
            fadeOut: 2,
            loop: true,
            startTime: 0,
          });
          message.success('背景音乐添加成功');
          resolve();
        };
        audio.onerror = () => {
          message.error('无法加载音频文件');
          resolve();
        };
      });
    } catch (error) {
      console.error('选择背景音乐失败:', error);
      message.error('选择背景音乐失败，请重试');
    }
  };

  const handleMusicRemove = () => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
    }
    setBackgroundMusic(null);
    setPlayingMusic(false);
    message.success('背景音乐已移除');
  };

  const handleMusicPlay = () => {
    if (!backgroundMusic) return;

    if (playingMusic) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current.currentTime = 0;
      }
      setPlayingMusic(false);
    } else {
      // 停止其他音频
      voiceAudioRefs.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setPlayingVoiceId(null);
      sfxAudioRefs.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setPlayingSfxId(null);

      let audio = musicAudioRef.current;
      if (!audio && backgroundMusic.fileUrl) {
        audio = new Audio(backgroundMusic.fileUrl);
        audio.loop = true;
        musicAudioRef.current = audio;
      }
      if (audio) {
        audio.volume = (backgroundMusic.volume / 100) * (musicVolume / 100) * (masterVolume / 100);
        audio.play();
        setPlayingMusic(true);
      }
    }
  };

  const handleMusicVolumeChange = (volume: number) => {
    if (backgroundMusic) {
      setBackgroundMusic({ ...backgroundMusic, volume });
    }
  };

  const handleMusicLoopChange = (loop: boolean) => {
    if (backgroundMusic) {
      setBackgroundMusic({ ...backgroundMusic, loop });
      if (musicAudioRef.current) {
        musicAudioRef.current.loop = loop;
      }
    }
  };

  // ========== 音效处理 ==========
  const handleSfxImport = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: '音频文件',
          extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']
        }]
      });

      if (!selected || !Array.isArray(selected)) {
        return;
      }

      const newEffects: SoundEffect[] = [];
      for (const filePath of selected) {
        const fileName = filePath.split('/').pop() || '音效';
        const audio = new Audio(convertFileSrc(filePath));

        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
            newEffects.push({
              id: generateId(),
              name: fileName.replace(/\.[^/.]+$/, ''),
              filePath,
              fileUrl: convertFileSrc(filePath),
              duration: audio.duration,
              volume: 80,
              startTime: 0,
              category: '自定义',
            });
            resolve();
          };
          audio.onerror = () => {
            message.error(`无法加载音频文件: ${fileName}`);
            resolve();
          };
        });
      }

      if (newEffects.length > 0) {
        setSoundEffects([...soundEffects, ...newEffects]);
        message.success(`成功导入 ${newEffects.length} 个音效文件`);
      }
    } catch (error) {
      console.error('导入音效失败:', error);
      message.error('导入音效失败，请重试');
    }
  };

  const handleSfxRemove = (id: string) => {
    setSoundEffects(soundEffects.filter(effect => effect.id !== id));
    message.success('音效已移除');
  };

  const handleSfxPlay = (effect: SoundEffect) => {
    if (playingSfxId === effect.id) {
      const audio = sfxAudioRefs.current.get(effect.id);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingSfxId(null);
    } else {
      // 停止其他音频
      voiceAudioRefs.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setPlayingVoiceId(null);
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        setPlayingMusic(false);
      }
      sfxAudioRefs.current.forEach((audio, id) => {
        if (id !== effect.id) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      let audio = sfxAudioRefs.current.get(effect.id);
      if (!audio && effect.fileUrl) {
        audio = new Audio(effect.fileUrl);
        sfxAudioRefs.current.set(effect.id, audio);
      }
      if (audio) {
        audio.volume = (effect.volume / 100) * (effectVolume / 100) * (masterVolume / 100);
        audio.play();
        setPlayingSfxId(effect.id);
        audio.onended = () => setPlayingSfxId(null);
      }
    }
  };

  const handleSfxVolumeChange = (id: string, volume: number) => {
    setSoundEffects(soundEffects.map(effect =>
      effect.id === id ? { ...effect, volume } : effect
    ));
  };

  const handleSfxStartTimeChange = (id: string, startTime: number) => {
    setSoundEffects(soundEffects.map(effect =>
      effect.id === id ? { ...effect, startTime } : effect
    ));
  };

  // ========== 录音功能 ==========
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const fileName = `录音_${formatTime(recordingTime)}`;

        const newTrack: VoiceTrack = {
          id: generateId(),
          name: fileName,
          filePath: '',
          fileUrl: url,
          duration: recordingTime,
          startTime: 0,
          volume: 80,
          fadeIn: 0,
          fadeOut: 0,
          type: 'voiceover',
        };

        setVoiceTracks([...voiceTracks, newTrack]);
        message.success('录音完成');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // 录音计时
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // 存储timer引用以便清除
      (window as any).__recordingTimer = timer;
    } catch (error) {
      console.error('开始录音失败:', error);
      message.error('无法访问麦克风，请检查权限设置');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      const timer = (window as any).__recordingTimer;
      if (timer) {
        clearInterval(timer);
      }
    }
  };

  // ========== 渲染组件 ==========

  // 配音轨道表格列
  const voiceColumns = [
    {
      title: '状态',
      dataIndex: 'id',
      key: 'status',
      width: 60,
      render: (_: unknown, record: VoiceTrack) => (
        <Button
          type="text"
          size="small"
          icon={playingVoiceId === record.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => handleVoicePlay(record)}
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration: number) => formatTime(duration),
    },
    {
      title: '音量',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (volume: number, record: VoiceTrack) => (
        <Slider
          min={0}
          max={100}
          value={volume}
          onChange={(value) => handleVoiceVolumeChange(record.id, value)}
          disabled={disabled}
        />
      ),
    },
    {
      title: '起始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (startTime: number, record: VoiceTrack) => (
        <Slider
          min={0}
          max={Math.max(videoDuration - 1, 0)}
          step={0.1}
          value={startTime}
          onChange={(value) => handleVoiceStartTimeChange(record.id, value)}
          disabled={disabled}
          tooltip={{ formatter: (value) => value ? formatTime(value) : '00:00' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: VoiceTrack) => (
        <Popconfirm
          title="确认移除此配音?"
          onConfirm={() => handleVoiceRemove(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // 音效表格列
  const sfxColumns = [
    {
      title: '状态',
      dataIndex: 'id',
      key: 'status',
      width: 60,
      render: (_: unknown, record: SoundEffect) => (
        <Button
          type="text"
          size="small"
          icon={playingSfxId === record.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => handleSfxPlay(record)}
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration: number) => formatTime(duration),
    },
    {
      title: '音量',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (volume: number, record: SoundEffect) => (
        <Slider
          min={0}
          max={100}
          value={volume}
          onChange={(value) => handleSfxVolumeChange(record.id, value)}
          disabled={disabled}
        />
      ),
    },
    {
      title: '起始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (startTime: number, record: SoundEffect) => (
        <Slider
          min={0}
          max={Math.max(videoDuration - 1, 0)}
          step={0.1}
          value={startTime}
          onChange={(value) => handleSfxStartTimeChange(record.id, value)}
          disabled={disabled}
          tooltip={{ formatter: (value) => value ? formatTime(value) : '00:00' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: SoundEffect) => (
        <Popconfirm
          title="确认移除此音效?"
          onConfirm={() => handleSfxRemove(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <SoundOutlined />
          <span>配音配乐编辑</span>
        </Space>
      }
      className={styles.audioEditor}
      extra={
        <Space>
          <Tooltip title="总音量">
            <div className={styles.masterVolumeControl}>
              <SoundOutlined />
              <Slider
                min={0}
                max={100}
                value={masterVolume}
                onChange={setMasterVolume}
                disabled={disabled}
                className={styles.masterSlider}
              />
              <span>{masterVolume}%</span>
            </div>
          </Tooltip>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'voice',
            label: (
              <Space>
                <CustomerServiceOutlined />
                <span>配音轨道</span>
                <Tag color="blue">{voiceTracks.length}</Tag>
              </Space>
            ),
            children: (
              <div className={styles.tabContent}>
                <div className={styles.toolbar}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<AudioMutedOutlined />}
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      danger={isRecording}
                      disabled={disabled}
                    >
                      {isRecording ? `停止录音 (${formatTime(recordingTime)})` : '开始录音'}
                    </Button>
                    <Button
                      icon={<UploadOutlined />}
                      onClick={handleVoiceImport}
                      disabled={disabled}
                    >
                      导入配音
                    </Button>
                  </Space>
                </div>

                {voiceTracks.length > 0 ? (
                  <Table
                    dataSource={voiceTracks}
                    columns={voiceColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    className={styles.trackTable}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无配音，点击上方按钮添加"
                  />
                )}
              </div>
            ),
          },
          {
            key: 'music',
            label: (
              <Space>
                <AudioOutlined />
                <span>背景音乐</span>
                {backgroundMusic && <Tag color="green">已添加</Tag>}
              </Space>
            ),
            children: (
              <div className={styles.tabContent}>
                <div className={styles.musicSection}>
                  {backgroundMusic ? (
                    <Card className={styles.musicCard} size="small">
                      <div className={styles.musicInfo}>
                        <div className={styles.musicName}>{backgroundMusic.name}</div>
                        <div className={styles.musicMeta}>
                          <span>时长: {formatTime(backgroundMusic.duration)}</span>
                          <span>循环: <Switch
                            size="small"
                            checked={backgroundMusic.loop}
                            onChange={handleMusicLoopChange}
                            disabled={disabled}
                          /></span>
                        </div>
                      </div>

                      <div className={styles.musicControls}>
                        <Button
                          type="primary"
                          icon={playingMusic ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                          onClick={handleMusicPlay}
                          disabled={disabled}
                        >
                          {playingMusic ? '暂停' : '播放'}
                        </Button>
                        <Popconfirm
                          title="确认移除背景音乐?"
                          onConfirm={handleMusicRemove}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button danger icon={<DeleteOutlined />} disabled={disabled}>
                            移除
                          </Button>
                        </Popconfirm>
                      </div>

                      <div className={styles.volumeControl}>
                        <span>音量:</span>
                        <Slider
                          min={0}
                          max={100}
                          value={backgroundMusic.volume}
                          onChange={handleMusicVolumeChange}
                          disabled={disabled}
                        />
                        <span>{backgroundMusic.volume}%</span>
                      </div>

                      <div className={styles.fadeControl}>
                        <div className={styles.fadeItem}>
                          <span>淡入:</span>
                          <Slider
                            min={0}
                            max={10}
                            step={0.5}
                            value={backgroundMusic.fadeIn}
                            onChange={(value) => setBackgroundMusic({ ...backgroundMusic, fadeIn: value })}
                            disabled={disabled}
                          />
                          <span>{backgroundMusic.fadeIn}s</span>
                        </div>
                        <div className={styles.fadeItem}>
                          <span>淡出:</span>
                          <Slider
                            min={0}
                            max={10}
                            step={0.5}
                            value={backgroundMusic.fadeOut}
                            onChange={(value) => setBackgroundMusic({ ...backgroundMusic, fadeOut: value })}
                            disabled={disabled}
                          />
                          <span>{backgroundMusic.fadeOut}s</span>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div className={styles.musicSelectArea}>
                      <div className={styles.selectButtons}>
                        <Button
                          type="primary"
                          icon={<FolderOutlined />}
                          onClick={handleMusicSelect}
                          disabled={disabled}
                          size="large"
                        >
                          选择本地音乐
                        </Button>
                      </div>

                      <div className={styles.presetSection}>
                        <div className={styles.presetTitle}>推荐背景音乐</div>
                        <div className={styles.presetList}>
                          {PRESET_BGM_LIST.map(bgm => (
                            <Tag
                              key={bgm.id}
                              className={styles.presetTag}
                              onClick={() => message.info(`将使用预设音乐: ${bgm.name}`)}
                            >
                              {bgm.name}
                              <span className={styles.presetMeta}>- {bgm.category}</span>
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'effects',
            label: (
              <Space>
                <SoundOutlined />
                <span>音效</span>
                <Tag color="purple">{soundEffects.length}</Tag>
              </Space>
            ),
            children: (
              <div className={styles.tabContent}>
                <div className={styles.toolbar}>
                  <Space>
                    <Button
                      icon={<UploadOutlined />}
                      onClick={handleSfxImport}
                      disabled={disabled}
                    >
                      导入音效
                    </Button>
                  </Space>
                </div>

                {soundEffects.length > 0 ? (
                  <Table
                    dataSource={soundEffects}
                    columns={sfxColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    className={styles.trackTable}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无音效，点击上方按钮添加"
                  >
                    <div className={styles.presetSfxSection}>
                      <div className={styles.presetTitle}>预设音效分类</div>
                      <div className={styles.presetList}>
                        {PRESET_SFX_LIST.map(sfx => (
                          <Tag
                            key={sfx.id}
                            className={styles.presetTag}
                            color="blue"
                            onClick={() => message.info(`将使用预设音效: ${sfx.name}`)}
                          >
                            {sfx.name}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Empty>
                )}
              </div>
            ),
          },
          {
            key: 'mix',
            label: (
              <Space>
                <SettingOutlined />
                <span>混音设置</span>
              </Space>
            ),
            children: (
              <div className={styles.tabContent}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card className={styles.mixCard} size="small">
                      <div className={styles.mixTitle}>
                        <CustomerServiceOutlined /> 配音音量
                      </div>
                      <Progress percent={voiceVolume} status="active" />
                      <Slider
                        min={0}
                        max={100}
                        value={voiceVolume}
                        onChange={setVoiceVolume}
                        disabled={disabled}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className={styles.mixCard} size="small">
                      <div className={styles.mixTitle}>
                        <AudioOutlined /> 音乐音量
                      </div>
                      <Progress percent={musicVolume} status="active" />
                      <Slider
                        min={0}
                        max={100}
                        value={musicVolume}
                        onChange={setMusicVolume}
                        disabled={disabled}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className={styles.mixCard} size="small">
                      <div className={styles.mixTitle}>
                        <SoundOutlined /> 音效音量
                      </div>
                      <Progress percent={effectVolume} status="active" />
                      <Slider
                        min={0}
                        max={100}
                        value={effectVolume}
                        onChange={setEffectVolume}
                        disabled={disabled}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className={styles.mixCard} size="small">
                      <div className={styles.mixTitle}>
                        <span className={styles.masterIcon}>M</span> 主音量
                      </div>
                      <Progress percent={masterVolume} status="active" />
                      <Slider
                        min={0}
                        max={100}
                        value={masterVolume}
                        onChange={setMasterVolume}
                        disabled={disabled}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card className={styles.summaryCard} size="small" title="音频轨道概览">
                  <Row gutter={[16, 12]}>
                    <Col xs={24} sm={8}>
                      <div className={styles.summaryItem}>
                        <CustomerServiceOutlined /> 配音轨道: <strong>{voiceTracks.length}</strong>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div className={styles.summaryItem}>
                        <AudioOutlined /> 背景音乐: <strong>{backgroundMusic ? '1' : '0'}</strong>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div className={styles.summaryItem}>
                        <SoundOutlined /> 音效: <strong>{soundEffects.length}</strong>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default AudioEditor;
