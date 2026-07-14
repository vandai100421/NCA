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
  UploadOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { api } from '@/lib/api';
import { confirmDelete } from '@/lib/confirm';
import { searchableProps } from '@/lib/select';
import type { MucTieu, Nguon } from '@/infrastructure/prisma/generated/client';
import {
  LOAI_ANH_CHUP_LABELS,
  LOAI_NHU_CAU_LABELS,
  PAGE_SIZE_OPTIONS,
  TRANG_THAI_NHU_CAU_LABELS,
  TRANG_THAI_TAG_COLOR,
  getNguonTagColor,
} from '@/modules/shared/constants';
import type {
  LoaiAnhChup,
  LoaiNhuCau,
  TrangThaiNhuCau,
} from '@/infrastructure/prisma/generated/client';
import { useNhuCauList, useDeleteNhuCau } from '../hooks/use-nhu-cau-anh';
import { NhuCauFormDialog } from './nhu-cau-form-dialog';
import { NhuCauImportDialog } from './nhu-cau-import-dialog';
import { ThongKeThoiGianPanel } from '@/modules/thong-ke/components/thong-ke-thoi-gian-panel';
import type { NhuCauAnhDetail } from '../api/nhu-cau-anh-service';

const { Title, Paragraph, Text } = Typography;

const formatDateTime = (d: Date | string | null | undefined): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function NhuCauList() {
  const { notification } = App.useApp();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [trangThai, setTrangThai] = useState<TrangThaiNhuCau[]>([]);
  const [nguonIds, setNguonIds] = useState<number[]>([]);
  const [mucTieuIds, setMucTieuIds] = useState<number[]>([]);
  const [loaiNhuCau, setLoaiNhuCau] = useState<LoaiNhuCau[]>([]);
  const [loaiAnhChup, setLoaiAnhChup] = useState<LoaiAnhChup[]>([]);
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
    trangThai: trangThai.length > 0 ? trangThai : undefined,
    nguonId: nguonIds.length > 0 ? nguonIds : undefined,
    mucTieuId: mucTieuIds.length > 0 ? mucTieuIds : undefined,
    loaiNhuCau: loaiNhuCau.length > 0 ? loaiNhuCau : undefined,
    loaiAnhChup: loaiAnhChup.length > 0 ? loaiAnhChup : undefined,
    tuNgay: tuNgay || undefined,
    denNgay: denNgay || undefined,
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
      notification.success({ title: 'Đã xóa nhu cầu ảnh' });
    } catch (e) {
      notification.error({
        message: 'Không xóa được',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const resetFilters = () => {
    setTrangThai([]);
    setNguonIds([]);
    setMucTieuIds([]);
    setLoaiNhuCau([]);
    setLoaiAnhChup([]);
    setTuNgay('');
    setDenNgay('');
    setSearch('');
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (trangThai.length > 0) params.set('trangThai', trangThai.join(','));
    if (nguonIds.length > 0) params.set('nguonId', nguonIds.join(','));
    if (mucTieuIds.length > 0) params.set('mucTieuId', mucTieuIds.join(','));
    if (loaiNhuCau.length > 0) params.set('loaiNhuCau', loaiNhuCau.join(','));
    if (loaiAnhChup.length > 0) params.set('loaiAnhChup', loaiAnhChup.join(','));
    if (tuNgay) params.set('tuNgay', tuNgay);
    if (denNgay) params.set('denNgay', denNgay);
    if (search) params.set('search', search);
    const qs = params.toString();
    window.location.href = `/api/nhu-cau-anh/export${qs ? `?${qs}` : ''}`;
  };

  const total = data?.total ?? 0;

  const nguonFilterOptions = (nguonData ?? []).map((n) => ({
    value: n.id,
    label: n.tenNguon,
  }));
  const mucTieuFilterOptions = (mucTieuData ?? []).map((m) => ({
    value: m.id,
    label: m.ten,
  }));

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
    {
      title: 'Thời gian đặt',
      dataIndex: 'thoiGianDat',
      width: 140,
      sorter: (a, b) => new Date(a.thoiGianDat).getTime() - new Date(b.thoiGianDat).getTime(),
      defaultSortOrder: 'ascend',
      render: (v: Date | string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDateTime(v)}
        </Text>
      ),
    },
    { title: 'Mục tiêu', dataIndex: ['mucTieu', 'ten'], ellipsis: true },
    {
      title: 'Địa bàn',
      dataIndex: 'diaBan',
      ellipsis: true,
    },
    {
      title: 'Nguồn',
      dataIndex: ['nguon', 'tenNguon'],
      ellipsis: true,
      render: (_, n) => (
        <Flex gap={6} align="center" wrap>
          <Tag color={getNguonTagColor(n.nguon.id)}>{n.nguon.tenNguon}</Tag>
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
      title: 'Loại ảnh',
      dataIndex: 'loaiAnhChup',
      width: 110,
      render: (v: LoaiAnhChup) => <Tag>{LOAI_ANH_CHUP_LABELS[v]}</Tag>,
    },

    {
      title: 'Ngày nhận mong muốn',
      key: 'mongMuon',
      width: 200,
      sorter: (a, b) => {
        const getMongMuon = (n: NhuCauAnhDetail) =>
          n.loaiNhuCau === 'CO_DINH'
            ? n.thoiGianChup
            : (n.thoiGianMongMuonTu ?? n.thoiGianMongMuonDen);
        const va = getMongMuon(a);
        const vb = getMongMuon(b);
        if (!va && !vb) return 0;
        if (!va) return 1;
        if (!vb) return -1;
        return new Date(va).getTime() - new Date(vb).getTime();
      },
      render: (_, n) => {
        if (n.loaiNhuCau === 'CO_DINH') {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDateTime(n.thoiGianChup)}
            </Text>
          );
        }
        return (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateTime(n.thoiGianMongMuonTu)} → {formatDateTime(n.thoiGianMongMuonDen)}
          </Text>
        );
      },
    },
    {
      title: 'Ngày nhận',
      dataIndex: 'thoiGianTra',
      width: 140,
      sorter: (a, b) => {
        if (!a.thoiGianTra && !b.thoiGianTra) return 0;
        if (!a.thoiGianTra) return 1;
        if (!b.thoiGianTra) return -1;
        return new Date(a.thoiGianTra).getTime() - new Date(b.thoiGianTra).getTime();
      },
      render: (v: Date | string | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDateTime(v)}
        </Text>
      ),
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
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            Import
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
                  mode="multiple"
                  allowClear
                  maxTagCount="responsive"
                  placeholder="Tất cả trạng thái"
                  value={trangThai}
                  onChange={(v) => {
                    setTrangThai(v);
                    setPage(1);
                  }}
                  options={Object.entries(TRANG_THAI_NHU_CAU_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Nguồn" style={{ marginBottom: 0 }}>
                <Select
                  mode="multiple"
                  allowClear
                  maxTagCount="responsive"
                  placeholder="Tất cả nguồn"
                  value={nguonIds}
                  onChange={(v) => {
                    setNguonIds(v);
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
                  mode="multiple"
                  allowClear
                  maxTagCount="responsive"
                  placeholder="Tất cả mục tiêu"
                  value={mucTieuIds}
                  onChange={(v) => {
                    setMucTieuIds(v);
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
                  mode="multiple"
                  allowClear
                  maxTagCount="responsive"
                  placeholder="Tất cả loại"
                  value={loaiNhuCau}
                  onChange={(v) => {
                    setLoaiNhuCau(v);
                    setPage(1);
                  }}
                  options={Object.entries(LOAI_NHU_CAU_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Loại ảnh" style={{ marginBottom: 0 }}>
                <Select
                  mode="multiple"
                  allowClear
                  maxTagCount="responsive"
                  placeholder="Tất cả loại ảnh"
                  value={loaiAnhChup}
                  onChange={(v) => {
                    setLoaiAnhChup(v);
                    setPage(1);
                  }}
                  options={Object.entries(LOAI_ANH_CHUP_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Từ ngày" style={{ marginBottom: 0 }}>
                <Input
                  type="date"
                  value={tuNgay}
                  onChange={(e) => {
                    setTuNgay(e.target.value);
                    setPage(1);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Đến ngày" style={{ marginBottom: 0 }}>
                <Input
                  type="date"
                  value={denNgay}
                  onChange={(e) => {
                    setDenNgay(e.target.value);
                    setPage(1);
                  }}
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
              <Form.Item label="" style={{ marginBottom: 0 }}>
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
        key={editing ? `edit-${editing.id}` : 'create'}
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        mucTieuList={mucTieuData ?? []}
        nguonList={nguonData ?? []}
      />

      <NhuCauImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <ThongKeThoiGianPanel />
    </div>
  );
}
