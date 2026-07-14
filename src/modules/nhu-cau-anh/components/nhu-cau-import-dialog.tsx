'use client';

import { useState } from 'react';
import { Alert, App, Button, Modal, Table, Tag, Typography, Upload } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { useImportNhuCau } from '../hooks/use-nhu-cau-anh';
import type { NhuCauImportResult, NhuCauImportRowResult } from '../schema/nhu-cau-import-schema';

const { Dragger } = Upload;
const { Text } = Typography;

interface NhuCauImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRowData(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.mucTieu) parts.push(`Mục tiêu: ${data.mucTieu}`);
  if (data.nguon) parts.push(`Nguồn: ${data.nguon}`);
  if (data.diaBan) parts.push(`Địa bàn: ${data.diaBan}`);
  if (data.loaiNhuCau) parts.push(`Loại: ${data.loaiNhuCau}`);
  return parts.join(' | ') || '—';
}

export function NhuCauImportDialog({ open, onOpenChange }: NhuCauImportDialogProps) {
  const { notification } = App.useApp();
  const importMut = useImportNhuCau();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<NhuCauImportResult | null>(null);

  const beforeUpload = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
      notification.error({
        message: 'Định dạng không hỗ trợ',
        description: 'Chỉ chấp nhận file .xlsx hoặc .csv',
      });
      return Upload.LIST_IGNORE;
    }
    setFile(f);
    setResult(null);
    return false;
  };

  const handleImport = async () => {
    if (!file) {
      notification.warning({ message: 'Chưa chọn file' });
      return;
    }
    try {
      const res = await importMut.mutateAsync(file);
      setResult(res);
      if (res.failed === 0) {
        notification.success({ message: `Đã import ${res.created} nhu cầu ảnh` });
      } else {
        notification.warning({
          message: `Import xong: ${res.created} thành công, ${res.failed} lỗi`,
        });
      }
    } catch (e) {
      notification.error({
        message: 'Import thất bại',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/nhu-cau-anh/import';
  };

  const columns: TableProps<NhuCauImportRowResult>['columns'] = [
    { title: 'Dòng', dataIndex: 'row', width: 70 },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (s: string) =>
        s === 'success' ? <Tag color="green">Thành công</Tag> : <Tag color="red">Lỗi</Tag>,
    },
    {
      title: 'Chi tiết',
      key: 'info',
      render: (_, r) =>
        r.status === 'success' ? (
          <Text type="success">Đã tạo nhu cầu #{r.id}</Text>
        ) : (
          <Text type="danger">{r.message}</Text>
        ),
    },
    {
      title: 'Dữ liệu dòng',
      key: 'data',
      render: (_, r) => formatRowData(r.data),
    },
  ];

  const pending = importMut.isPending;

  return (
    <Modal
      title="Import nhu cầu ảnh từ file"
      open={open}
      onCancel={handleClose}
      width={860}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleClose}>Đóng</Button>
            <Button type="primary" onClick={handleImport} loading={pending} disabled={!file}>
              Import
            </Button>
          </div>
        </div>
      }
    >
      <Dragger
        accept=".xlsx,.csv"
        beforeUpload={beforeUpload}
        maxCount={1}
        fileList={file ? [{ uid: '-1', name: file.name, status: 'done' }] : []}
        onRemove={() => {
          setFile(null);
          setResult(null);
        }}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Kéo thả file vào đây hoặc bấm để chọn</p>
        <p className="ant-upload-hint">Hỗ trợ file .xlsx hoặc .csv. Tối đa 5MB, 1000 dòng.</p>
      </Dragger>

      {result && (
        <>
          <Alert
            type={result.failed === 0 ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 12 }}
            message={`Đã thêm ${result.created} / Lỗi ${result.failed} / Tổng ${result.total} dòng`}
          />
          <Table<NhuCauImportRowResult>
            columns={columns}
            dataSource={result.results}
            rowKey="row"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 600 }}
          />
        </>
      )}
    </Modal>
  );
}
