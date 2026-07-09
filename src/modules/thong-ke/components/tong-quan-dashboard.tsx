'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AppstoreOutlined,
  DashboardOutlined,
  PictureOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { Card, Col, Empty, Flex, Progress, Row, Statistic, Tag, Typography } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { api } from '@/lib/api';
import {
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
  TRANG_THAI_NHU_CAU_LABELS,
  TRANG_THAI_TAG_COLOR,
} from '@/modules/shared/constants';
import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';
import type { TongQuanStats } from '../api/thong-ke-service';

const { Title, Paragraph, Text } = Typography;

const ALL_TRANG_THAI: TrangThaiNhuCau[] = ['DA_DAT', 'DA_HUY', 'DA_NHAN'];

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Card>
      <Flex justify="space-between" align="flex-start">
        <div>
          <Statistic title={title} value={value} />
          <Link href={href}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Xem danh sách →
            </Text>
          </Link>
        </div>
        <Text type="secondary">{icon}</Text>
      </Flex>
    </Card>
  );
}

export function TongQuanDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['thong-ke', 'tong-quan'] as const,
    queryFn: () => api.get<TongQuanStats>('/api/thong-ke/tong-quan'),
  });

  if (isLoading) {
    return <LoadingState message="Đang tải số liệu thống kê..." />;
  }
  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) {
    return <EmptyState title="Chưa có dữ liệu thống kê" />;
  }

  const countByTrangThai = new Map(data.theoTrangThai.map((t) => [t.trangThai, t.count]));
  const maxNguonCount = data.theoNguon.reduce((max, n) => Math.max(max, n.count), 0);
  const countByLoai = new Map(data.theoLoaiNhuCau.map((l) => [l.loaiNhuCau, l.count]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Tổng quan
        </Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Hệ thống quản lý nhu cầu đặt ảnh nội bộ
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Nhu cầu ảnh"
            value={data.totalNhuCau}
            icon={<PictureOutlined style={{ fontSize: 20 }} />}
            href="/nhu-cau-anh"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Nguồn"
            value={data.totalNguon}
            icon={<AppstoreOutlined style={{ fontSize: 20 }} />}
            href="/nguon"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Mục tiêu"
            value={data.totalMucTieu}
            icon={<AimOutlined style={{ fontSize: 20 }} />}
            href="/muc-tieu"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <DashboardOutlined />
                <span>Nhu cầu theo trạng thái</span>
              </Flex>
            }
          >
            {data.totalNhuCau === 0 ? (
              <EmptyState title="Chưa có nhu cầu ảnh nào" />
            ) : (
              <Row gutter={[12, 12]}>
                {ALL_TRANG_THAI.map((state) => {
                  const count = countByTrangThai.get(state) ?? 0;
                  return (
                    <Col key={state} xs={12} sm={6}>
                      <Card size="small">
                        <Flex vertical gap={4}>
                          <Tag color={TRANG_THAI_TAG_COLOR[state]}>
                            {TRANG_THAI_NHU_CAU_LABELS[state]}
                          </Tag>
                          <Statistic value={count} />
                        </Flex>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Phân loại nhu cầu">
            {data.totalNhuCau === 0 ? (
              <Empty description="Chưa có dữ liệu." />
            ) : (
              <Flex vertical gap={16}>
                {Object.entries(LOAI_NHU_CAU_LABELS).map(([value, label]) => {
                  const count = countByLoai.get(value as 'CO_DINH' | 'DOT_XUAT') ?? 0;
                  const pct =
                    data.totalNhuCau > 0 ? Math.round((count / data.totalNhuCau) * 100) : 0;
                  return (
                    <div key={value}>
                      <Flex justify="space-between" style={{ marginBottom: 4 }}>
                        <Text>{label}</Text>
                        <Text type="secondary">
                          {count} ({pct}%)
                        </Text>
                      </Flex>
                      <Progress percent={pct} showInfo={false} size="small" />
                    </div>
                  );
                })}
              </Flex>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Nhu cầu theo nguồn (Top 5)">
        {data.theoNguon.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu theo nguồn" />
        ) : (
          <Flex vertical gap={16}>
            {data.theoNguon.map((n) => {
              const pct = maxNguonCount > 0 ? Math.round((n.count / maxNguonCount) * 100) : 0;
              return (
                <div key={n.nguonId}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Flex gap={8} align="center">
                      <Tag>
                        {NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon}
                      </Tag>
                      <Text>{n.tenNguon}</Text>
                    </Flex>
                    <Text strong>{n.count}</Text>
                  </Flex>
                  <Progress percent={pct} showInfo={false} size="small" />
                </div>
              );
            })}
          </Flex>
        )}
      </Card>
    </div>
  );
}
