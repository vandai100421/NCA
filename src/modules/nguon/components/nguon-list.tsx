'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Card, Flex, Input, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { api } from '@/lib/api';
import { confirmDelete } from '@/lib/confirm';
import type { Nguon } from '@/infrastructure/prisma/generated/client';
import {
  NGUON_LOAI_LABELS,
  TINH_TRANG_NGUON_LABELS,
  TINH_TRANG_TAG_COLOR,
} from '@/modules/shared/constants';
import { useDeleteNguon } from '../hooks/use-nguon';
import { NguonFormDialog } from './nguon-form-dialog';

const { Title, Paragraph, Text } = Typography;

export function NguonList() {
  const { notification } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nguon | null>(null);
  const [search, setSearch] = useState('');
  const deleteMut = useDeleteNguon();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['nguon', search] as const,
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return api.get<Nguon[]>(`/api/nguon${qs}`);
    },
  });

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (n: Nguon) => {
    setEditing(n);
    setOpen(true);
  };

  const handleDelete = async (n: Nguon) => {
    const ok = await confirmDelete(`Xóa nguồn "${n.tenNguon}"?`);
    if (!ok) return;
    try {
      await deleteMut.mutateAsync(n.id);
      notification.success({ message: 'Đã xóa nguồn' });
    } catch (e) {
      notification.error({
        message: 'Không xóa được',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const columns: TableProps<Nguon>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 72,
      render: (id: number) => <Text code>{id}</Text>,
    },
    { title: 'Tên nguồn', dataIndex: 'tenNguon' },
    {
      title: 'Loại',
      dataIndex: 'nguon',
      width: 110,
      render: (v: Nguon['nguon']) => (
        <Tag>{NGUON_LOAI_LABELS[v as keyof typeof NGUON_LOAI_LABELS] ?? v}</Tag>
      ),
    },
    {
      title: 'Thời gian SD',
      dataIndex: 'thoiGianSuDung',
      ellipsis: true,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Tình trạng',
      dataIndex: 'tinhTrang',
      width: 140,
      render: (v: Nguon['tinhTrang']) => (
        <Tag color={TINH_TRANG_TAG_COLOR[v]}>{TINH_TRANG_NGUON_LABELS[v]}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, n) => (
        <Flex gap={4} justify="center">
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
            Nguồn
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Đối tượng cung cấp ảnh
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm nguồn
        </Button>
      </Flex>

      <Card title="Tìm kiếm">
        <Input.Search
          placeholder="Tìm theo tên / loại / đánh giá..."
          allowClear
          onSearch={(v) => setSearch(v.trim())}
          style={{ maxWidth: 480 }}
        />
      </Card>

      <Card title="Danh sách nguồn">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
            onRetry={() => void refetch()}
          />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Chưa có nguồn nào"
            description="Bấm “Thêm nguồn” để tạo bản ghi đầu tiên."
            action={
              <Button onClick={handleAdd} icon={<PlusOutlined />}>
                Thêm nguồn
              </Button>
            }
          />
        ) : (
          <Table<Nguon>
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        )}
      </Card>

      <NguonFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
