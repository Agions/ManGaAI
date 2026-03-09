import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Progress, Select, Space, Table, Tag, Typography, List } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StoryboardFrame } from '@/components/business/StoryboardEditor';
import {
  renderQueueService,
  type FrameRenderJob,
  type RenderLog,
} from '@/core/services/render-queue.service';
import styles from './index.module.less';

const { Text } = Typography;

type LogFilter = 'all' | 'info' | 'warning' | 'error';

interface RenderCenterProps {
  frames: StoryboardFrame[];
  projectId?: string;
  onApplyRenderedFrame?: (frameId: string, imageUrl: string) => void;
}

const RenderCenter: React.FC<RenderCenterProps> = ({ frames, projectId, onApplyRenderedFrame }) => {
  const [jobs, setJobs] = useState<FrameRenderJob[]>([]);
  const [logs, setLogs] = useState<RenderLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logFilter, setLogFilter] = useState<LogFilter>('all');

  useEffect(() => {
    return renderQueueService.subscribe((state) => {
      setJobs(state.jobs);
      setLogs(state.logs);
      setIsRunning(state.isRunning);
      setIsPaused(state.isPaused);

      if (onApplyRenderedFrame) {
        state.jobs
          .filter((job) => job.status === 'completed' && job.imageUrl)
          .forEach((job) => onApplyRenderedFrame(job.frameId, job.imageUrl!));
      }
    });
  }, [onApplyRenderedFrame]);

  const filteredLogs = useMemo(
    () => logs.filter((log) => logFilter === 'all' || log.level === logFilter),
    [logs, logFilter]
  );

  const pendingCount = jobs.filter((job) => job.status === 'pending').length;
  const runningCount = jobs.filter((job) => job.status === 'running').length;
  const completedCount = jobs.filter((job) => job.status === 'completed').length;

  const enqueueFrames = () => {
    if (frames.length === 0) return;

    const renderedFrameIds = new Set(jobs.map((job) => job.frameId));
    const candidates = frames.filter((frame) => !renderedFrameIds.has(frame.id));

    if (candidates.length === 0) return;

    renderQueueService.enqueue(
      candidates.map((frame) => ({
        frameId: frame.id,
        frameTitle: frame.title,
        prompt: [
          frame.title,
          frame.sceneDescription,
          `构图：${frame.composition}`,
          `镜头：${frame.cameraType}`,
          frame.dialogue ? `对白：${frame.dialogue}` : '',
        ].filter(Boolean).join('，'),
        model: 'seedream-5.0',
        maxRetries: 1,
        projectId,
      }))
    );
  };

  const columns: ColumnsType<FrameRenderJob> = [
    {
      title: '分镜',
      dataIndex: 'frameTitle',
      key: 'frameTitle',
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const colorMap = {
          pending: 'default',
          running: 'processing',
          completed: 'success',
          failed: 'error',
        } as const;
        return <Tag color={colorMap[record.status]}>{record.status}</Tag>;
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 180,
      render: (value: number) => <Progress percent={value} size="small" />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.error && (
            <Button size="small" onClick={() => renderQueueService.retry(record.id)}>
              重试
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="渲染队列"
        extra={
          <Space>
            <Button onClick={enqueueFrames} disabled={frames.length === 0}>加入分镜</Button>
            {!isPaused ? (
              <Button onClick={() => renderQueueService.pause()} disabled={!isRunning}>暂停</Button>
            ) : (
              <Button onClick={() => renderQueueService.resume()}>继续</Button>
            )}
            <Button type="primary" onClick={() => void renderQueueService.run()} disabled={isRunning || pendingCount === 0}>
              开始渲染
            </Button>
            <Button onClick={() => renderQueueService.clearCompleted()}>清理已完成</Button>
          </Space>
        }
      >
        <Space size={24} className={styles.stats}>
          <Text>待处理: {pendingCount}</Text>
          <Text>进行中: {runningCount}</Text>
          <Text>已完成: {completedCount}</Text>
        </Space>

        <Table rowKey="id" columns={columns} dataSource={jobs} pagination={{ pageSize: 6 }} size="small" />
      </Card>

      <Card
        title="渲染日志"
        extra={
          <Select
            value={logFilter}
            style={{ width: 140 }}
            onChange={(value: LogFilter) => setLogFilter(value)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'info', label: '信息' },
              { value: 'warning', label: '警告' },
              { value: 'error', label: '错误' },
            ]}
          />
        }
      >
        <List
          size="small"
          dataSource={filteredLogs}
          locale={{ emptyText: '暂无日志' }}
          renderItem={(item) => (
            <List.Item>
              <Space>
                <Tag color={item.level === 'error' ? 'error' : item.level === 'warning' ? 'warning' : 'blue'}>
                  {item.level}
                </Tag>
                <Text>{item.message}</Text>
                <Text type="secondary">{new Date(item.timestamp).toLocaleTimeString()}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default RenderCenter;
