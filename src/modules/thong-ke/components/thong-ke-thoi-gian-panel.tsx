'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Progress,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { api } from '@/lib/api';
import { useNguonList } from '@/modules/nguon/hooks/use-nguon';
import {
  LOAI_ANH_CHUP_LABELS,
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
} from '@/modules/shared/constants';
import type {
  ThongKeThoiGian,
  NguonDanhGia,
  NhuCauTheoLoai,
  ChamHanItem,
} from '../api/thong-ke-service';

const { Text, Title } = Typography;

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

function renderLoaiAnhTags(items: { loaiAnhChup: string; count: number }[]): React.ReactNode {
  if (items.length === 0) return <Text type="secondary">—</Text>;
  return (
    <Flex gap={4} wrap>
      {items.map((it) => (
        <Tag key={it.loaiAnhChup}>
          {LOAI_ANH_CHUP_LABELS[it.loaiAnhChup as keyof typeof LOAI_ANH_CHUP_LABELS] ??
            it.loaiAnhChup}
          : {it.count}
        </Tag>
      ))}
    </Flex>
  );
}

function LoaiNhuCauBlock({ data }: { data: NhuCauTheoLoai }) {
  const label = LOAI_NHU_CAU_LABELS[data.loaiNhuCau];
  const chuaDenHan = data.tongDat - data.daNhan - data.daHuy;
  return (
    <Card size="small" style={{ flex: 1, minWidth: 280 }}>
      <Flex vertical gap={8}>
        <Flex justify="space-between" align="center">
          <Text strong>
            {label}: {data.tongDat} mục tiêu
          </Text>
        </Flex>
        <Flex gap={16} wrap>
          <Text>
            Đã nhận: <Text strong>{data.daNhan}</Text>
          </Text>
          <Text type="secondary">Đã hủy: {data.daHuy}</Text>
          <Text type="secondary">Chưa đến hạn: {chuaDenHan}</Text>
        </Flex>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phân loại ảnh:
          </Text>
          <div style={{ marginTop: 4 }}>{renderLoaiAnhTags(data.theoLoaiAnh)}</div>
        </div>
      </Flex>
    </Card>
  );
}

function NguonDanhGiaCard({ n }: { n: NguonDanhGia }) {
  return (
    <Card size="small">
      <Flex vertical gap={8}>
        <Flex justify="space-between" align="center">
          <Flex gap={8} align="center">
            <Tag>{NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon}</Tag>
            <Text strong>{n.tenNguon}</Text>
          </Flex>
          <Text strong>
            {n.daNhan} ảnh{' '}
            <Text type="success" style={{ fontSize: 12, fontWeight: 'normal' }}>
              ({n.tiLeDungHan}% đúng hạn)
            </Text>
          </Text>
        </Flex>
        <Progress
          percent={100}
          success={{ percent: n.tiLeDungHan }}
          strokeColor="#faad14"
          showInfo={false}
          size="small"
        />
        <Flex gap={16} wrap>
          <Text type="success" style={{ fontSize: 12 }}>
            Đúng hạn: {n.dungHan}
          </Text>
          <Text type="warning" style={{ fontSize: 12 }}>
            Chậm hạn: {n.chamHan}
          </Text>
          {n.soNgayTreTrungBinh > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Trễ trung bình: {n.soNgayTreTrungBinh} ngày
            </Text>
          )}
        </Flex>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Loại ảnh đã nhận:
          </Text>
          <div style={{ marginTop: 4 }}>{renderLoaiAnhTags(n.theoLoaiAnh)}</div>
        </div>
      </Flex>
    </Card>
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
    title: 'Loại nhu cầu',
    dataIndex: 'loaiNhuCau',
    width: 110,
    render: (v: ChamHanItem['loaiNhuCau']) => <Tag>{LOAI_NHU_CAU_LABELS[v]}</Tag>,
  },
  {
    title: 'Loại ảnh',
    dataIndex: 'loaiAnhChup',
    width: 110,
    render: (v: ChamHanItem['loaiAnhChup']) => <Tag>{LOAI_ANH_CHUP_LABELS[v]}</Tag>,
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
    title: 'Ngày nhận',
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
  const [selectedNguonIds, setSelectedNguonIds] = useState<number[]>([]);
  const [appliedTu, setAppliedTu] = useState('');
  const [appliedDen, setAppliedDen] = useState('');
  const [appliedNguonIds, setAppliedNguonIds] = useState<number[]>([]);

  const { data: nguonList } = useNguonList();
  const nguonOptions = (nguonList ?? []).map((n) => ({
    value: n.id,
    label: `${n.tenNguon} (${n.nguon})`,
  }));

  const params = new URLSearchParams();
  if (appliedTu) params.set('tuNgay', appliedTu);
  if (appliedDen) params.set('denNgay', appliedDen);
  if (appliedNguonIds.length > 0) {
    params.set('nguonIds', appliedNguonIds.join(','));
  }
  const qs = params.toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['thong-ke', 'thoi-gian', appliedTu, appliedDen, appliedNguonIds] as const,
    queryFn: () => api.get<ThongKeThoiGian>(`/api/thong-ke/thoi-gian${qs ? `?${qs}` : ''}`),
  });

  const handleApply = () => {
    setAppliedTu(tuNgay);
    setAppliedDen(denNgay);
    setAppliedNguonIds(selectedNguonIds);
  };

  const handleReset = () => {
    setTuNgay('');
    setDenNgay('');
    setSelectedNguonIds([]);
    setAppliedTu('');
    setAppliedDen('');
    setAppliedNguonIds([]);
  };

  const hasFilter = appliedTu || appliedDen || appliedNguonIds.length > 0;

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
          <div style={{ minWidth: 240 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Nguồn
            </Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="Tất cả nguồn"
              value={selectedNguonIds}
              onChange={(v) => setSelectedNguonIds(v)}
              options={nguonOptions}
              style={{ display: 'block', marginTop: 4 }}
            />
          </div>
          <Button type="primary" onClick={handleApply}>
            Áp dụng
          </Button>
          {hasFilter && <Button onClick={handleReset}>Xoá lọc</Button>}
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
        ) : data.tongNhuCau === 0 ? (
          <EmptyState
            title="Chưa có nhu cầu nào trong khoảng thời gian này"
            description="Chọn khoảng thời gian khác hoặc tạo nhu cầu mới."
          />
        ) : (
          <>
            {/* Tổng quan nhanh */}
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <Card size="small">
                  <Statistic label="Tổng nhu cầu" value={data.tongNhuCau} />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small">
                  <Statistic label="Đã nhận ảnh" value={data.tongDaNhan} tone="blue" />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small">
                  <Statistic
                    label="Đúng hạn"
                    value={data.tongDungHan}
                    hint={`${data.tiLeDungHan}%`}
                    tone="green"
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small">
                  <Statistic label="Chậm hạn" value={data.tongChamHan} tone="amber" />
                </Card>
              </Col>
            </Row>

            {/* Theo loại nhu cầu */}
            <div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Theo loại nhu cầu
              </Title>
              <Flex gap={12} wrap>
                {data.theoLoaiNhuCau.map((loai) => (
                  <LoaiNhuCauBlock key={loai.loaiNhuCau} data={loai} />
                ))}
              </Flex>
            </div>

            {/* Đánh giá theo nguồn */}
            <div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Đánh giá theo nguồn ({data.theoNguon.length})
              </Title>
              {data.theoNguon.length === 0 ? (
                <Empty description="Chưa có nguồn nào đã nhận ảnh." />
              ) : (
                <Row gutter={[12, 12]}>
                  {data.theoNguon.map((n) => (
                    <Col key={n.nguonId} xs={24} md={12} lg={8}>
                      <NguonDanhGiaCard n={n} />
                    </Col>
                  ))}
                </Row>
              )}
            </div>

            {/* Danh sách chậm hạn */}
            <div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Danh sách nhu cầu chậm hạn ({data.danhSachChamHan.length})
              </Title>
              {data.danhSachChamHan.length === 0 ? (
                <Text type="success">Không có nhu cầu nào chậm hạn. Tuyệt vời!</Text>
              ) : (
                <Table<ChamHanItem>
                  rowKey="id"
                  columns={chamHanColumns}
                  dataSource={data.danhSachChamHan}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  size="small"
                />
              )}
            </div>
          </>
        )}
      </Flex>
    </Card>
  );
}

function Statistic({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'blue' | 'green' | 'amber';
}) {
  const color =
    tone === 'blue'
      ? '#3b82f6'
      : tone === 'green'
        ? '#10b981'
        : tone === 'amber'
          ? '#f59e0b'
          : '#475569';
  return (
    <Flex vertical gap={2}>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
      {hint && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {hint}
        </Text>
      )}
    </Flex>
  );
}
