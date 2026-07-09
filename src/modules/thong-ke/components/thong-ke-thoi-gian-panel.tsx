'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Flex, Input, Progress, Row, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { api } from '@/lib/api';
import { LOAI_NHU_CAU_LABELS, NGUON_LOAI_LABELS } from '@/modules/shared/constants';
import type { ThongKeThoiGian, ThongKeNguonThoiGian, ChamHanItem } from '../api/thong-ke-service';

const { Text } = Typography;

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

type Tone = 'emerald' | 'amber' | 'slate' | 'blue';

const TONE_STYLE: Record<Tone, { color: string; bg: string }> = {
  emerald: { color: '#10b981', bg: '#ecfdf5' },
  amber: { color: '#f59e0b', bg: '#fffbeb' },
  slate: { color: '#475569', bg: '#f1f5f9' },
  blue: { color: '#3b82f6', bg: '#eff6ff' },
};

function StatCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone: Tone;
}) {
  const t = TONE_STYLE[tone];
  return (
    <Card>
      <Flex align="center" gap={16}>
        <div
          style={{
            display: 'flex',
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            color: t.color,
            background: t.bg,
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{value}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {title}
          </Text>
          {hint && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {hint}
              </Text>
            </div>
          )}
        </div>
      </Flex>
    </Card>
  );
}

function NguonRow({ n, maxTong }: { n: ThongKeNguonThoiGian; maxTong: number }) {
  const tiLeDung = n.tong > 0 ? Math.round((n.dungHan / n.tong) * 100) : 0;
  const pct = maxTong > 0 ? Math.round((n.tong / maxTong) * 100) : 0;
  const dungPct = n.tong > 0 ? Math.round((pct * n.dungHan) / n.tong) : 0;
  return (
    <div>
      <Flex justify="space-between" style={{ marginBottom: 4 }}>
        <Flex gap={8} align="center">
          <Tag>{NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon}</Tag>
          <Text>{n.tenNguon}</Text>
        </Flex>
        <Text strong>
          {n.tong}{' '}
          <Text type="success" style={{ fontSize: 12, fontWeight: 'normal' }}>
            ({tiLeDung}% đúng)
          </Text>
        </Text>
      </Flex>
      <Progress
        percent={pct}
        success={{ percent: dungPct }}
        strokeColor="#faad14"
        showInfo={false}
        size="small"
      />
      <Flex gap={16}>
        <Text type="success" style={{ fontSize: 12 }}>
          Đúng hạn: {n.dungHan}
        </Text>
        <Text type="warning" style={{ fontSize: 12 }}>
          Chậm hạn: {n.chamHan}
        </Text>
      </Flex>
    </div>
  );
}

const chamHanColumns: TableProps<ChamHanItem>['columns'] = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
    render: (_, it) => (
      <Link href={`/nhu-cau-anh/${it.id}`}>
        <Text code>#{it.id}</Text>
      </Link>
    ),
  },
  { title: 'Mục tiêu', dataIndex: 'mucTieuTen', ellipsis: true },
  {
    title: 'Nguồn',
    dataIndex: 'nguonTen',
    ellipsis: true,
    render: (v: string) => (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {v}
      </Text>
    ),
  },
  {
    title: 'Loại',
    dataIndex: 'loaiNhuCau',
    width: 100,
    render: (v: ChamHanItem['loaiNhuCau']) => <Tag>{LOAI_NHU_CAU_LABELS[v]}</Tag>,
  },
  {
    title: 'Hạn mong muốn',
    dataIndex: 'hanMongMuon',
    width: 130,
    render: (v: string) => (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatDate(v)}
      </Text>
    ),
  },
  {
    title: 'Ngày trả',
    dataIndex: 'thoiGianTra',
    width: 130,
    render: (v: string) => (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatDate(v)}
      </Text>
    ),
  },
  {
    title: 'Trễ',
    dataIndex: 'soNgayTre',
    width: 90,
    align: 'right',
    render: (v: number) => <Tag color="gold">{v} ngày</Tag>,
  },
];

export function ThongKeThoiGianPanel() {
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [appliedTu, setAppliedTu] = useState('');
  const [appliedDen, setAppliedDen] = useState('');

  const params = new URLSearchParams();
  if (appliedTu) params.set('tuNgay', appliedTu);
  if (appliedDen) params.set('denNgay', appliedDen);
  const qs = params.toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['thong-ke', 'thoi-gian', appliedTu, appliedDen] as const,
    queryFn: () => api.get<ThongKeThoiGian>(`/api/thong-ke/thoi-gian${qs ? `?${qs}` : ''}`),
  });

  const handleApply = () => {
    setAppliedTu(tuNgay);
    setAppliedDen(denNgay);
  };

  const handleReset = () => {
    setTuNgay('');
    setDenNgay('');
    setAppliedTu('');
    setAppliedDen('');
  };

  const maxTong = data ? data.theoNguon.reduce((max, n) => Math.max(max, n.tong), 0) : 0;

  return (
    <Card
      title={
        <Flex align="center" gap={8}>
          <CalendarOutlined />
          <span>Thống kê đáp ứng theo thời gian</span>
        </Flex>
      }
    >
      <Flex vertical gap={20}>
        <Flex gap={12} wrap align="flex-end">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Từ ngày
            </Text>
            <Input
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              style={{ width: 180, display: 'block', marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Đến ngày
            </Text>
            <Input
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              style={{ width: 180, display: 'block', marginTop: 4 }}
            />
          </div>
          <Button type="primary" onClick={handleApply}>
            Áp dụng
          </Button>
          {(appliedTu || appliedDen) && <Button onClick={handleReset}>Xoá lọc</Button>}
        </Flex>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
            onRetry={() => void refetch()}
          />
        ) : !data ? (
          <EmptyState title="Chưa có dữ liệu" />
        ) : data.tongDaTraAnh === 0 ? (
          <EmptyState
            title="Chưa có nhu cầu nào đã trả ảnh"
            description="Thống kê đúng/chậm hạn chỉ áp dụng cho nhu cầu đã trả ảnh."
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <StatCard
                  title="Đã trả ảnh"
                  value={data.tongDaTraAnh}
                  icon={<CheckCircleOutlined />}
                  tone="blue"
                />
              </Col>
              <Col xs={12} md={6}>
                <StatCard
                  title="Đúng hạn"
                  value={data.dungHan}
                  hint={`${data.tiLeDungHan}% tổng số`}
                  icon={<CheckCircleOutlined />}
                  tone="emerald"
                />
              </Col>
              <Col xs={12} md={6}>
                <StatCard
                  title="Chậm hạn"
                  value={data.chamHan}
                  hint={`${100 - data.tiLeDungHan}% tổng số`}
                  icon={<WarningOutlined />}
                  tone="amber"
                />
              </Col>
              <Col xs={12} md={6}>
                <StatCard
                  title="Tỷ lệ đúng hạn"
                  value={`${data.tiLeDungHan}%`}
                  icon={<ClockCircleOutlined />}
                  tone="slate"
                />
              </Col>
            </Row>

            <div>
              <Text strong>Phân loại theo nguồn</Text>
              <div style={{ marginTop: 12 }}>
                {data.theoNguon.length === 0 ? (
                  <Empty description="Chưa có dữ liệu theo nguồn." />
                ) : (
                  <Flex vertical gap={16}>
                    {data.theoNguon.map((n) => (
                      <NguonRow key={n.nguonId} n={n} maxTong={maxTong} />
                    ))}
                  </Flex>
                )}
              </div>
            </div>

            <div>
              <Text strong>Danh sách nhu cầu chậm hạn ({data.danhSachChamHan.length})</Text>
              <div style={{ marginTop: 12 }}>
                {data.danhSachChamHan.length === 0 ? (
                  <Text type="success">Không có nhu cầu nào chậm hạn. Tuyệt vời!</Text>
                ) : (
                  <Table<ChamHanItem>
                    rowKey="id"
                    columns={chamHanColumns}
                    dataSource={data.danhSachChamHan}
                    pagination={false}
                    size="small"
                  />
                )}
              </div>
            </div>
          </>
        )}
      </Flex>
    </Card>
  );
}
