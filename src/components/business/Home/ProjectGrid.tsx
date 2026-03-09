import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  List,
  Button,
  Tag,
  Empty,
  Spin,
  Typography,
  Modal,
  message
} from 'antd';
import {
  VideoCameraOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import styles from './ProjectGrid.module.less';

const { Text } = Typography;

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'processing' | 'completed';
  thumbnail?: string;
}

interface ProjectGridProps {
  projects: Project[];
  loading: boolean;
  onRefresh?: () => void;
}

/**
 * 项目网格组件
 * 展示项目列表，支持创建、查看、编辑、删除操作
 */
const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, loading, onRefresh }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleCreateProject = () => {
    navigate('/project/new');
  };

  const handleViewProject = (id: string) => {
    navigate(`/project/${id}`);
  };

  const handleEditProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/project/edit/${id}`);
  };

  const handleOpenEditor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/editor/${id}`);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除此项目吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.success('项目已删除');
        onRefresh?.();
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusTag = (status: Project['status']) => {
    const config = {
      draft: { color: 'blue', text: '草稿' },
      processing: { color: 'orange', text: '处理中' },
      completed: { color: 'green', text: '已完成' }
    };
    const { color, text } = config[status];
    return <Tag color={color} className={styles.statusTag}>{text}</Tag>;
  };

  return (
    <Card
      title={
        <div className={styles.sectionHeader}>
          <Text strong style={{ fontSize: 18 }}>
            <VideoCameraOutlined /> 我的项目
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateProject}
          >
            创建新项目
          </Button>
        </div>
      }
      className={`${styles.sectionCard} ${isDarkMode ? styles.darkCard : ''}`}
      bordered={false}
    >
      <Spin spinning={loading}>
        {projects.length === 0 ? (
          <Empty
            description="暂无项目，点击「创建新项目」开始使用"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateProject}
            >
              创建新项目
            </Button>
          </Empty>
        ) : (
          <List
            grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={projects}
            renderItem={(project) => (
              <List.Item>
                <Card
                  className={`${styles.projectCard} ${isDarkMode ? styles.darkProjectCard : ''}`}
                  hoverable
                  onClick={() => handleViewProject(project.id)}
                  cover={
                    project.thumbnail && (
                      <div className={styles.projectThumbnail}>
                        <img alt={project.name} src={project.thumbnail} width={100} style={{ width: 150, height: 150 }} />
                      </div>
                    )
                  }
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => handleEditProject(project.id, e)}
                    />,
                    <Button
                      key="scissors"
                      type="text"
                      icon={<PlayCircleOutlined />}
                      onClick={(e) => handleOpenEditor(project.id, e)}
                    />,
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    />
                  ]}
                >
                  <Card.Meta
                    title={
                      <div className={styles.projectTitle}>
                        <span>{project.name}</span>
                        {getStatusTag(project.status)}
                      </div>
                    }
                    description={
                      <>
                        <Text ellipsis style={{ marginBottom: 8, display: 'block' }}>
                          {project.description}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          更新于: {formatDate(project.updatedAt)}
                        </Text>
                      </>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Card>
  );
};

export default ProjectGrid;
