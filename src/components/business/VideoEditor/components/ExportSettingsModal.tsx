/**
 * 导出设置弹窗组件
 */

import React from 'react';
import {
  Modal,
  Tabs,
  Select,
  Radio,
  Space,
  Row,
  Col,
  InputNumber,
  Typography,
  Alert,
  Slider
} from 'antd';
import type { TransitionType, ExportSettings } from '../types';
import { transitionOptions, qualityOptions, formatOptions } from '../types';
import styles from './ExportSettingsModal.module.less';

interface ExportSettingsModalProps {
  visible: boolean;
  settings: ExportSettings;
  onSettingsChange: (settings: ExportSettings) => void;
  onOk: () => void;
  onCancel: () => void;
}

export const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({
  visible,
  settings,
  onSettingsChange,
  onOk,
  onCancel
}) => {
  const [activeTab, setActiveTab] = React.useState('general');

  const handleChange = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Modal
      title="视频导出设置"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="开始导出"
      cancelText="取消"
      width={600}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="基本设置" key="general">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className={styles.settingItem}>
              <Typography.Text strong>视频质量:</Typography.Text>
              <Select
                value={settings.quality}
                onChange={(value) => handleChange('quality', value)}
                style={{ width: 200, marginLeft: 10 }}
                options={qualityOptions}
              />
            </div>

            <div className={styles.settingItem}>
              <Typography.Text strong>导出格式:</Typography.Text>
              <Select
                value={settings.format}
                onChange={(value) => handleChange('format', value)}
                style={{ width: 200, marginLeft: 10 }}
                options={formatOptions}
              />
            </div>

            <div className={styles.settingItem}>
              <Typography.Text strong>添加字幕:</Typography.Text>
              <Radio.Group
                value={settings.useSubtitles}
                onChange={(e) => handleChange('useSubtitles', e.target.value)}
                style={{ marginLeft: 10 }}
              >
                <Radio value={true}>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>
            </div>
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab="高级设置" key="advanced">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className={styles.settingItem}>
              <Typography.Text strong>转场效果:</Typography.Text>
              <Select
                value={settings.transitionType}
                onChange={(value: TransitionType) => handleChange('transitionType', value)}
                style={{ width: 200, marginLeft: 10 }}
                options={transitionOptions}
              />
            </div>

            <div className={styles.settingItem}>
              <Typography.Text strong>转场时长(秒):</Typography.Text>
              <InputNumber
                value={settings.transitionDuration}
                onChange={(value) => value !== null && handleChange('transitionDuration', value)}
                min={0.2}
                max={3}
                step={0.1}
                style={{ width: 200, marginLeft: 10 }}
              />
            </div>

            <div className={styles.settingItem}>
              <Typography.Text strong>音频音量:</Typography.Text>
              <Row style={{ width: 200, marginLeft: 10, display: 'flex', alignItems: 'center' }}>
                <Col span={18}>
                  <Slider
                    value={settings.audioVolume}
                    onChange={(value) => handleChange('audioVolume', value)}
                    min={0}
                    max={150}
                    step={5}
                  />
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <InputNumber
                    value={settings.audioVolume}
                    onChange={(value) => value !== null && handleChange('audioVolume', value)}
                    min={0}
                    max={150}
                    step={5}
                    style={{ marginLeft: 8, width: 60 }}
                    addonAfter="%"
                  />
                </Col>
              </Row>
            </div>
          </Space>

          <Alert
            message="高级设置说明"
            description="转场效果会在片段之间添加流畅过渡，可能会稍微增加处理时间。音频音量调整可以让您控制整个视频的音量大小，100%表示保持原音量不变。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default ExportSettingsModal;
