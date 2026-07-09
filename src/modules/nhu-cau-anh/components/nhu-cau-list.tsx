'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { api } from '@/lib/api';
import { confirmDelete } from '@/lib/confirm';
import { searchableProps } from '@/lib/select';
import type { MucTieu, Nguon } from '@/infrastructure/prisma/generated/client';
import {
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
  PAGE_SIZE_OPTIONS,
  TRANG_THAI_NHU_CAU_LABELS,
  TRANG_THAI_TAG_COLOR,
} from '@/modules/shared/constants';
import type { LoaiNhuCau, TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';
import { useNhuCauList, useDeleteNhuCau } from '../hooks/use-nhu-cau-anh';
import { NhuCauFormDialog } from './nhu-cau-form-dialog';
import type { NhuCauAnhDetail } from '../api/nhu-cau-anh-service';

const { Title, Paragraph, Text } = Typography;

const ALL = 'ALL' as const;

export function NhuCauList() {
  const { notification } = App.useApp();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [trangThai, setTrangThai] = useState<TrangThaiNhuCau | typeof ALL>(ALL);
  const [nguonId, setNguonId] = useState<number | typeof ALL>(ALL);
  const [mucTieuId, setMucTieuId] = useState<number | typeof ALL>(ALL);
  const [loaiNhuCau, setLoaiNhuCau] = useState<LoaiNhuCau | typeof ALL>(ALL);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NhuCauAnhDetail | null>(null);
  const deleteMut = useDeleteNhuCau();

  const { data: mucTieuData } = useQuery({
    queryKey: ['muc-tieu'],
    queryFn: () => api.get<MucTieu[]>('/api/muc-tieu'),
  });
  const { data: nguonData } = useQuery({
    queryKey: ['nguon'],
    queryFn: () => api.get<Nguon[]>('/api/nguon'),
  });

  const { data, isLoading, error, isFetching, refetch } = useNhuCauList({
    page,
    pageSize,
    trangThai: trangThai === ALL ? undefined : trangThai,
    nguonId: nguonId === ALL ? undefined : nguonId,
    mucTieuId: mucTieuId === ALL ? undefined : mucTieuId,
    loaiNhuCau: loaiNhuCau === ALL ? undefined : loaiNhuCau,
    search: search || undefined,
  });

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (n: NhuCauAnhDetail) => {
    setEditing(n);
    setOpen(true);
  };

  const handleDelete = async (n: NhuCauAnhDetail) => {
    const ok = await confirmDelete(`Xóa nhu cầu ảnh #${n.id}?`);
    if (!ok) return;
    try {
      await deleteMut.mutateAsync(n.id);
      notification.success({ message: 'Đã xóa nhu cầu ảnh' });
    } catch (e) {
      notification.error({
        message: 'Không xóa được',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const resetFilters = () => {
    setTrangThai(ALL);
    setNguonId(ALL);
    setMucTieuId(ALL);
    setLoaiNhuCau(ALL);
    setSearch('');
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (trangThai !== ALL) params.set('trangThai', trangThai);
    if (nguonId !== ALL) params.set('nguonId', String(nguonId));
    if (mucTieuId !== ALL) params.set('mucTieuId', String(mucTieuId));
    if (loaiNhuCau !== ALL) params.set('loaiNhuCau', loaiNhuCau);
    if (search) params.set('search', search);
    const qs = params.toString();
    window.location.href = `/api/nhu-cau-anh/export${qs ? `?${qs}` : ''}`;
  };

  const total = data?.total ?? 0;

  const nguonFilterOptions = [
    { value: ALL, label: 'Tất cả nguồn' },
    ...(nguonData ?? []).map((n) => ({ value: String(n.id), label: n.tenNguon })),
  ];
  const mucTieuFilterOptions = [
    { value: ALL, label: 'Tất cả mục tiêu' },
    ...(mucTieuData ?? []).map((m) => ({ value: String(m.id), label: m.ten })),
  ];

  const columns: TableProps<NhuCauAnhDetail>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (_, n) => (
        <Link href={`/nhu-cau-anh/${n.id}`}>
          <Text code>#{n.id}</Text>
        </Link>
      ),
    },
    { title: 'Mục tiêu', dataIndex: ['mucTieu', 'ten'], ellipsis: true },
    {
      title: 'Nguồn',
      dataIndex: ['nguon', 'tenNguon'],
      ellipsis: true,
      render: (_, n) => (
        <Flex gap={6} align="center" wrap>
          <Tag>
            {NGUON_LOAI_LABELS[n.nguon.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon.nguon}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {n.nguon.tenNguon}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'loaiNhuCau',
      width: 100,
      render: (v: LoaiNhuCau) => <Tag>{LOAI_NHU_CAU_LABELS[v]}</Tag>,
    },
    {
      title: 'Địa bàn',
      dataIndex: 'diaBan',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 130,
      render: (v: TrangThaiNhuCau) => (
        <Tag color={TRANG_THAI_TAG_COLOR[v]}>{TRANG_THAI_NHU_CAU_LABELS[v]}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, n) => (
        <Flex gap={4} justify="center">
          <Link href={`/nhu-cau-anh/${n.id}`}>
            <Button type="text" icon={<EyeOutlined />} />
          </Link>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(n)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => void handleDelete(n)}
            loading={deleteMut.isPending}
          />
        </Flex>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Flex justify="space-between" align="flex-start">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Nhu cầu ảnh
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Quản lý nhu cầu đặt chụp ảnh
          </Paragraph>
        </div>
        <Flex gap={8}>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={isLoading || !!error}
          >
            Export CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm nhu cầu
          </Button>
        </Flex>
      </Flex>

      <Card title="Bộ lọc">
        <Form layout="vertical">
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Trạng thái" style={{ marginBottom: 0 }}>
                <Select
                  value={trangThai}
                  onChange={(v) => {
                    setTrangThai(v);
                    setPage(1);
                  }}
                  options={[
                    { value: ALL, label: 'Tất cả trạng thái' },
                    ...Object.entries(TRANG_THAI_NHU_CAU_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Nguồn" style={{ marginBottom: 0 }}>
                <Select
                  value={nguonId === ALL ? ALL : String(nguonId)}
                  onChange={(v) => {
                    setNguonId(v === ALL ? ALL : Number(v));
                    setPage(1);
                  }}
                  {...searchableProps(nguonFilterOptions)}
                  options={nguonFilterOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Mục tiêu" style={{ marginBottom: 0 }}>
                <Select
                  value={mucTieuId === ALL ? ALL : String(mucTieuId)}
                  onChange={(v) => {
                    setMucTieuId(v === ALL ? ALL : Number(v));
                    setPage(1);
                  }}
                  {...searchableProps(mucTieuFilterOptions)}
                  options={mucTieuFilterOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Loại nhu cầu" style={{ marginBottom: 0 }}>
                <Select
                  value={loaiNhuCau}
                  onChange={(v) => {
                    setLoaiNhuCau(v);
                    setPage(1);
                  }}
                  options={[
                    { value: ALL, label: 'Tất cả loại' },
                    ...Object.entries(LOAI_NHU_CAU_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Tìm kiếm" style={{ marginBottom: 0 }}>
                <Input.Search
                  placeholder="Tìm kiếm..."
                  allowClear
                  onSearch={(v) => {
                    setSearch(v.trim());
                    setPage(1);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Button onClick={resetFilters}>Đặt lại</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title={
          <Flex align="center" gap={8}>
            <span>Danh sách nhu cầu ảnh</span>
            {isFetching && !isLoading ? (
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                đang tải...
              </Text>
            ) : null}
          </Flex>
        }
      >
        {error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
            onRetry={() => void refetch()}
          />
        ) : !isLoading && (!data || data.items.length === 0) ? (
          <EmptyState
            title="Chưa có nhu cầu ảnh nào"
            description="Bấm “Thêm nhu cầu” để tạo bản ghi đầu tiên."
            action={
              <Button onClick={handleAdd} icon={<PlusOutlined />}>
                Thêm nhu cầu
              </Button>
            }
          />
        ) : (
          <Table<NhuCauAnhDetail>
            rowKey="id"
            columns={columns}
            dataSource={data?.items ?? []}
            loading={isLoading}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              showTotal: (t) => `Tổng ${t} bản ghi`,
            }}
          />
        )}
      </Card>

      <NhuCauFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        mucTieuList={mucTieuData ?? []}
        nguonList={nguonData ?? []}
      />
    </div>
  );
}
