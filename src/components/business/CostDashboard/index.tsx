import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, InputNumber, Progress, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  costService,
  reviewExportService,
  type CostBudget,
  type CostRecord,
  type CostStats,
  type BudgetStatus,
  type CostAlert,
  type ReviewExportActivity,
  type ReviewExportStatus,
} from '@/core/services';
import styles from './index.module.less';

const { Text } = Typography;

interface CostDashboardProps {
  projectId?: string;
}

const fmt = (n: number) => `$${n.toFixed(3)}`;
const statusLabelMap: Record<ReviewExportStatus, string> = {
  success: '成功',
  cancelled: '已取消',
  failed: '失败',
};
const statusColorMap: Record<ReviewExportStatus, string> = {
  success: 'success',
  cancelled: 'default',
  failed: 'error',
};

const CostDashboard: React.FC<CostDashboardProps> = ({ projectId }) => {
  const [stats, setStats] = useState<CostStats>(projectId ? costService.getProjectStats(projectId) : costService.getStats());
  const [budget, setBudget] = useState<CostBudget>(costService.getBudget());
  const [lastAlert, setLastAlert] = useState<CostAlert | null>(null);
  const [exportActivities, setExportActivities] = useState<ReviewExportActivity[]>(
    reviewExportService.getActivities(projectId).slice(0, 8),
  );

  useEffect(() => {
    const unsubStats = costService.subscribe((next) => {
      setStats(projectId ? costService.getProjectStats(projectId) : next);
      setBudget(costService.getBudget());
    });

    const unsubAlert = costService.subscribeAlert((alert) => {
      setLastAlert(alert);
      message.warning(`${alert.period} 预算已使用 ${alert.percent.toFixed(1)}%`);
    });

    return () => {
      unsubStats();
      unsubAlert();
    };
  }, [projectId]);

  useEffect(() => {
    setExportActivities(reviewExportService.getActivities(projectId).slice(0, 8));
    const unsub = reviewExportService.subscribe(() => {
      setExportActivities(reviewExportService.getActivities(projectId).slice(0, 8));
    });
    return unsub;
  }, [projectId]);

  const budgetStatus: BudgetStatus = useMemo(() => {
    if (projectId) {
      return costService.getBudgetStatus(costService.getProjectStats(projectId));
    }
    return costService.getBudgetStatus(stats);
  }, [projectId, stats]);

  const records: CostRecord[] = costService.getRecords(projectId);
  const exportColumns: ColumnsType<ReviewExportActivity> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (v: string) => (
        <Tag>{v === 'project_edit' ? '编辑页' : v === 'project_detail' ? '详情页' : '未知'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: ReviewExportStatus) => (
        <Tag color={statusColorMap[v]}>{statusLabelMap[v]}</Tag>
      ),
    },
    {
      title: '文件',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
  ];

  const columns: ColumnsType<CostRecord> = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 120, render: (v: string) => new Date(v).toLocaleDateString() },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Provider', dataIndex: 'provider', key: 'provider', width: 100 },
    { title: '模型', dataIndex: 'model', key: 'model', width: 120, render: (v?: string) => v || '-' },
    { title: '成本', dataIndex: 'cost', key: 'cost', width: 100, render: (v: number) => fmt(v) },
  ];

  const updateBudget = (key: 'daily' | 'weekly' | 'monthly', value?: number | null) => {
    if (!value || value <= 0) return;
    const next = { ...budget, [key]: value };
    setBudget(next);
    costService.setBudget(next);
  };

  return (
    <div className={styles.container}>
      {lastAlert && (
        <Alert
          type="warning"
          showIcon
          message={`预算告警：${lastAlert.period} 已使用 ${lastAlert.percent.toFixed(1)}%`}
          className={styles.alert}
        />
      )}

      <Card title={projectId ? '项目成本看板' : '全局成本看板'}>
        <Space size={24} wrap>
          <Statistic title="总成本" value={stats.total} precision={3} prefix="$" />
          <Statistic title="今日" value={stats.today} precision={3} prefix="$" />
          <Statistic title="本周" value={stats.thisWeek} precision={3} prefix="$" />
          <Statistic title="本月" value={stats.thisMonth} precision={3} prefix="$" />
        </Space>

        <div className={styles.budgetRows}>
          <div>
            <Text>日预算 {fmt(budgetStatus.daily.used)} / {fmt(budgetStatus.daily.limit)}</Text>
            <Progress percent={Math.min(100, Number(budgetStatus.daily.percent.toFixed(1)))} status={budgetStatus.daily.percent >= budget.alerts.daily ? 'exception' : 'active'} />
          </div>
          <div>
            <Text>周预算 {fmt(budgetStatus.weekly.used)} / {fmt(budgetStatus.weekly.limit)}</Text>
            <Progress percent={Math.min(100, Number(budgetStatus.weekly.percent.toFixed(1)))} status={budgetStatus.weekly.percent >= budget.alerts.weekly ? 'exception' : 'active'} />
          </div>
          <div>
            <Text>月预算 {fmt(budgetStatus.monthly.used)} / {fmt(budgetStatus.monthly.limit)}</Text>
            <Progress percent={Math.min(100, Number(budgetStatus.monthly.percent.toFixed(1)))} status={budgetStatus.monthly.percent >= budget.alerts.monthly ? 'exception' : 'active'} />
          </div>
        </div>

        {!projectId && (
          <Space className={styles.budgetEdit}>
            <Text>预算设置:</Text>
            <span>日</span><InputNumber min={1} value={budget.daily} onChange={(v) => updateBudget('daily', v)} />
            <span>周</span><InputNumber min={1} value={budget.weekly} onChange={(v) => updateBudget('weekly', v)} />
            <span>月</span><InputNumber min={1} value={budget.monthly} onChange={(v) => updateBudget('monthly', v)} />
            <Button onClick={() => costService.saveToStorage()}>保存预算</Button>
          </Space>
        )}
      </Card>

      <Card title="成本明细（最近）">
        <Table rowKey="id" size="small" columns={columns} dataSource={records.slice(0, 20)} pagination={false} />
      </Card>

      <Card title="评审导出活动（最近）">
        <Table
          rowKey="id"
          size="small"
          columns={exportColumns}
          dataSource={exportActivities}
          pagination={false}
          locale={{ emptyText: '暂无导出活动' }}
        />
      </Card>
    </div>
  );
};

export default CostDashboard;
