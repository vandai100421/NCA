'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Card, Flex, Input, Table, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { api } from '@/lib/api';
import { confirmDelete } from '@/lib/confirm';
import type { MucTieu } from '@/infrastructure/prisma/generated/client';
import { useDeleteMucTieu } from '../hooks/use-muc-tieu';
import { MucTieuFormDialog } from './muc-tieu-form-dialog';

const { Title, Paragraph, Text } = Typography;

export function MucTieuList() {
  const { notification } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MucTieu | null>(null);
  const [search, setSearch] = useState('');
  const deleteMut = useDeleteMucTieu();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['muc-tieu', search] as const,
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return api.get<MucTieu[]>(`/api/muc-tieu${qs}`);
    },
  });

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (m: MucTieu) => {
    setEditing(m);
    setOpen(true);
  };

  const handleDelete = async (m: MucTieu) => {
    const ok = await confirmDelete(`Xóa mục tiêu "${m.ten}"?`);
    if (!ok) return;
    try {
      await deleteMut.mutateAsync(m.id);
      notification.success({ message: 'Đã xóa mục tiêu' });
    } catch (e) {
      notification.error({
        message: 'Không xóa được',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const columns: TableProps<MucTieu>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 72,
      render: (id: number) => <Text code>{id}</Text>,
    },
    { title: 'Tên mục tiêu', dataIndex: 'ten' },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, m) => (
        <Flex gap={4} justify="center">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(m)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => void handleDelete(m)}
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
            Mục tiêu
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Đối tượng cần chụp ảnh
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm mục tiêu
        </Button>
      </Flex>

      <Card title="Tìm kiếm">
        <Input.Search
          placeholder="Tìm theo tên mục tiêu..."
          allowClear
          onSearch={(v) => setSearch(v.trim())}
          style={{ maxWidth: 480 }}
        />
      </Card>

      <Card title="Danh sách mục tiêu">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
            onRetry={() => void refetch()}
          />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Chưa có mục tiêu nào"
            description="Bấm “Thêm mục tiêu” để tạo bản ghi đầu tiên."
            action={
              <Button onClick={handleAdd} icon={<PlusOutlined />}>
                Thêm mục tiêu
              </Button>
            }
          />
        ) : (
          <Table<MucTieu>
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        )}
      </Card>

      <MucTieuFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
