'use client';

import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { DownloadOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { useImportNhuCau } from '../hooks/use-nhu-cau-anh';
import { useCreateMucTieu } from '@/modules/muc-tieu/hooks/use-muc-tieu';
import { useCreateNguon } from '@/modules/nguon/hooks/use-nguon';
import type { CreateNguonInput } from '@/modules/nguon/schema/nguon-schema';
import {
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
  NGUON_LOAI_OPTIONS,
  TINH_TRANG_NGUON_LABELS,
  TRANG_THAI_NHU_CAU_LABELS,
} from '@/modules/shared/constants';
import type { TinhTrangNguon } from '@/infrastructure/prisma/generated/client';
import type {
  MissingEntityInfo,
  NhuCauImportResult,
  NhuCauImportRowResult,
  NhuCauMissingRecord,
  NhuCauSyncResult,
  NhuCauSyncRowResult,
} from '../schema/nhu-cau-import-schema';

const { Dragger } = Upload;
const { Text, Link } = Typography;

type ImportMode = 'append' | 'sync';

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

function formatDateTime(d: Date | string | null | undefined): string {
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
}

function isSyncResult(r: NhuCauImportResult | NhuCauSyncResult): r is NhuCauSyncResult {
  return 'updated' in r && 'missing' in r;
}

export function NhuCauImportDialog({ open, onOpenChange }: NhuCauImportDialogProps) {
  const { notification } = App.useApp();
  const importMut = useImportNhuCau();
  const createMucTieuMut = useCreateMucTieu();
  const createNguonMut = useCreateNguon();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>('append');
  const [result, setResult] = useState<NhuCauImportResult | NhuCauSyncResult | null>(null);
  const [missingOpen, setMissingOpen] = useState(false);
  const [createdKeys, setCreatedKeys] = useState<Set<string>>(new Set());
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [quickCreate, setQuickCreate] = useState<MissingEntityInfo | null>(null);
  const [nguonForm] = Form.useForm<{
    nguon: (typeof NGUON_LOAI_OPTIONS)[number];
    tenNguon: string;
    thoiGianSuDung: string;
    tinhTrang: TinhTrangNguon;
    danhGia?: string;
  }>();

  const entityKey = (e: MissingEntityInfo) => `${e.kind}:${e.name.toLowerCase()}`;

  const handleCreateMucTieu = async (name: string) => {
    const key = `mucTieu:${name.toLowerCase()}`;
    setCreatingKey(key);
    try {
      await createMucTieuMut.mutateAsync({ ten: name });
      setCreatedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      notification.success({ message: `Đã tạo mục tiêu "${name}"` });
    } catch (e) {
      notification.error({
        message: 'Tạo mục tiêu thất bại',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCreatingKey(null);
    }
  };

  const handleCreateNguon = async (values: {
    nguon: (typeof NGUON_LOAI_OPTIONS)[number];
    tenNguon: string;
    thoiGianSuDung: string;
    tinhTrang: TinhTrangNguon;
    danhGia?: string;
  }) => {
    const name = quickCreate?.name ?? values.tenNguon;
    const input: CreateNguonInput = {
      nguon: values.nguon,
      tenNguon: values.tenNguon,
      thoiGianSuDung: values.thoiGianSuDung,
      tinhTrang: values.tinhTrang,
      danhGia: values.danhGia && values.danhGia.length > 0 ? values.danhGia : undefined,
    };
    try {
      await createNguonMut.mutateAsync(input);
      const key = `nguon:${name.toLowerCase()}`;
      setCreatedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      notification.success({ message: `Đã tạo nguồn "${values.tenNguon}"` });
      setQuickCreate(null);
      nguonForm.resetFields();
    } catch (e) {
      notification.error({
        message: 'Tạo nguồn thất bại',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

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
      const res = await importMut.mutateAsync({ file, mode });
      setResult(res);
      if (isSyncResult(res)) {
        const msg = `Đã tạo ${res.created} / Cập nhật ${res.updated} / Lỗi ${res.failed} / Tổng ${res.total}`;
        if (res.failed === 0) {
          notification.success({ message: msg });
        } else {
          notification.warning({ message: msg });
        }
      } else {
        if (res.failed === 0) {
          notification.success({ message: `Đã import ${res.created} nhu cầu ảnh` });
        } else {
          notification.warning({
            message: `Import xong: ${res.created} thành công, ${res.failed} lỗi`,
          });
        }
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
    setMissingOpen(false);
    setCreatedKeys(new Set());
    setCreatingKey(null);
    setQuickCreate(null);
    onOpenChange(false);
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/nhu-cau-anh/import';
  };

  const renderErrorDetail = (r: { message?: string; missingEntity?: MissingEntityInfo }) => {
    const entity = r.missingEntity;
    if (!entity) {
      return <Text type="danger">{r.message}</Text>;
    }
    const key = entityKey(entity);
    const created = createdKeys.has(key);
    const label = entity.kind === 'mucTieu' ? 'mục tiêu' : 'nguồn';
    if (created) {
      return (
        <div>
          <Text type="danger">{r.message}</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="green">Đã tạo {label}</Tag>{' '}
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bấm &quot;{mode === 'sync' ? 'Đồng bộ' : 'Import'}&quot; lại để nhập dòng này
            </Text>
          </div>
        </div>
      );
    }
    return (
      <div>
        <Text type="danger">{r.message}</Text>
        <div style={{ marginTop: 4 }}>
          {entity.kind === 'mucTieu' ? (
            <Popconfirm
              title={`Tạo mục tiêu "${entity.name}" ngay?`}
              okText="Tạo"
              cancelText="Hủy"
              onConfirm={() => handleCreateMucTieu(entity.name)}
              disabled={creatingKey === key}
            >
              <Button
                size="small"
                type="primary"
                ghost
                icon={<PlusOutlined />}
                loading={creatingKey === key}
              >
                Tạo mục tiêu
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              type="primary"
              ghost
              icon={<PlusOutlined />}
              onClick={() => setQuickCreate(entity)}
            >
              Tạo nguồn
            </Button>
          )}
        </div>
      </div>
    );
  };

  const appendColumns: TableProps<NhuCauImportRowResult>['columns'] = [
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
          renderErrorDetail(r)
        ),
    },
    {
      title: 'Dữ liệu dòng',
      key: 'data',
      render: (_, r) => formatRowData(r.data),
    },
  ];

  const syncColumns: TableProps<NhuCauSyncRowResult>['columns'] = [
    { title: 'Dòng', dataIndex: 'row', width: 70 },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 110,
      render: (a: string) => {
        if (a === 'created') return <Tag color="blue">Tạo mới</Tag>;
        if (a === 'updated') return <Tag color="cyan">Cập nhật</Tag>;
        return <Tag color="red">Lỗi</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 100,
      render: (s: string) =>
        s === 'success' ? <Tag color="green">OK</Tag> : <Tag color="red">Lỗi</Tag>,
    },
    {
      title: 'Chi tiết',
      key: 'info',
      render: (_, r) => {
        if (r.status === 'error') return renderErrorDetail(r);
        return <Text type="success">{r.message}</Text>;
      },
    },
    {
      title: 'Dữ liệu dòng',
      key: 'data',
      render: (_, r) => formatRowData(r.data),
    },
  ];

  const missingColumns: TableProps<NhuCauMissingRecord>['columns'] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Mục tiêu', dataIndex: 'mucTieu' },
    { title: 'Nguồn', dataIndex: 'nguon' },
    { title: 'Địa bàn', dataIndex: 'diaBan' },
    {
      title: 'Loại',
      dataIndex: 'loaiNhuCau',
      width: 100,
      render: (v: string) => LOAI_NHU_CAU_LABELS[v as keyof typeof LOAI_NHU_CAU_LABELS] ?? v,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 110,
      render: (v: string) =>
        TRANG_THAI_NHU_CAU_LABELS[v as keyof typeof TRANG_THAI_NHU_CAU_LABELS] ?? v,
    },
    {
      title: 'Thời gian đặt',
      dataIndex: 'thoiGianDat',
      width: 150,
      render: (d: Date) => formatDateTime(d),
    },
  ];

  const pending = importMut.isPending;
  const syncMissing = result && isSyncResult(result) ? result.missing : [];

  return (
    <Modal
      title="Import nhu cầu ảnh từ file"
      open={open}
      onCancel={handleClose}
      width={920}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleClose}>Đóng</Button>
            <Button type="primary" onClick={handleImport} loading={pending} disabled={!file}>
              {mode === 'sync' ? 'Đồng bộ' : 'Import'}
            </Button>
          </div>
        </div>
      }
    >
      <Radio.Group
        value={mode}
        onChange={(e) => {
          setMode(e.target.value as ImportMode);
          setResult(null);
        }}
        style={{ marginBottom: 12 }}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="append">Thêm mới</Radio.Button>
        <Radio.Button value="sync">Đồng bộ cập nhật</Radio.Button>
      </Radio.Group>

      {mode === 'sync' && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chế độ đồng bộ: cập nhật bản ghi đã có + tạo bản ghi mới"
          description={
            <span>
              Hệ thống khớp theo: <b>Mục tiêu + Nguồn + Địa bàn + Thời gian chụp/mong muốn từ</b>.
              Khuyến nghị: Export CSV hiện tại → sửa file → import ở chế độ này để giữ nguyên khóa
              khớp. Cột <b>Trạng thái</b> và <b>Thời gian trả ảnh</b> dùng để cập nhật kết quả.
            </span>
          }
        />
      )}

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
        <p className="ant-upload-hint">
          Hỗ trợ file .xlsx hoặc .csv. Tối đa 5MB, 1000 dòng.
          {mode === 'sync' && ' Dùng sheet "Đồng bộ" trong file mẫu.'}
        </p>
      </Dragger>

      {result && (
        <>
          <Alert
            type={result.failed === 0 ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 12 }}
            message={
              isSyncResult(result)
                ? `Đã tạo ${result.created} / Cập nhật ${result.updated} / Lỗi ${result.failed} / Tổng ${result.total} dòng`
                : `Đã thêm ${result.created} / Lỗi ${result.failed} / Tổng ${result.total} dòng`
            }
          />
          {createdKeys.size > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={`Đã tạo ${createdKeys.size} mục tiêu/nguồn mới`}
              description={
                <span>
                  Bấm <b>{mode === 'sync' ? 'Đồng bộ' : 'Import'}</b> để nhập lại file — các dòng
                  lỗi trước đây sẽ được xử lý lại.
                </span>
              }
            />
          )}
          {isSyncResult(result) ? (
            <Table<NhuCauSyncRowResult>
              columns={syncColumns}
              dataSource={result.results}
              rowKey="row"
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 700 }}
            />
          ) : (
            <Table<NhuCauImportRowResult>
              columns={appendColumns}
              dataSource={result.results}
              rowKey="row"
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 600 }}
            />
          )}

          {isSyncResult(result) && result.missing.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
              message={`${result.missing.length} nhu cầu trong hệ thống không có trong file`}
              description={
                <span>
                  Các bản ghi này <b>không bị thay đổi</b>.{' '}
                  <Link onClick={() => setMissingOpen(true)}>Xem danh sách</Link>
                </span>
              }
            />
          )}
        </>
      )}

      <Modal
        title={`Danh sách nhu cầu không có trong file (${syncMissing.length})`}
        open={missingOpen}
        onCancel={() => setMissingOpen(false)}
        width={860}
        footer={<Button onClick={() => setMissingOpen(false)}>Đóng</Button>}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Các nhu cầu dưới đây đang có trong hệ thống nhưng không được cập nhật trong file. Chúng KHÔNG bị thay đổi."
        />
        <Table<NhuCauMissingRecord>
          columns={missingColumns}
          dataSource={syncMissing}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 700 }}
        />
      </Modal>

      <Modal
        title="Tạo nguồn mới"
        open={quickCreate?.kind === 'nguon'}
        onCancel={() => setQuickCreate(null)}
        onOk={() => nguonForm.submit()}
        confirmLoading={createNguonMut.isPending}
        okText="Tạo"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            <span>
              Nguồn <b>&quot;{quickCreate?.name}&quot;</b> chưa có trong hệ thống. Điền thông tin
              còn thiếu để tạo ngay.
            </span>
          }
        />
        <Form
          key={quickCreate?.name ?? 'none'}
          form={nguonForm}
          layout="vertical"
          initialValues={{
            nguon: 'vệ tinh' as (typeof NGUON_LOAI_OPTIONS)[number],
            tenNguon: quickCreate?.name ?? '',
            thoiGianSuDung: '',
            tinhTrang: 'HOAT_DONG' as TinhTrangNguon,
          }}
          onFinish={(values) => {
            void handleCreateNguon(values);
          }}
        >
          <Form.Item
            label="Loại nguồn"
            name="nguon"
            rules={[{ required: true, message: 'Vui lòng chọn loại nguồn' }]}
          >
            <Select
              options={NGUON_LOAI_OPTIONS.map((opt) => ({
                value: opt,
                label: NGUON_LOAI_LABELS[opt],
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Tên nguồn"
            name="tenNguon"
            rules={[{ required: true, message: 'Tên nguồn là bắt buộc' }]}
          >
            <Input placeholder="VD: VT-Optical-Sat1" />
          </Form.Item>
          <Form.Item
            label="Thời gian sử dụng"
            name="thoiGianSuDung"
            rules={[{ required: true, message: 'Thời gian sử dụng là bắt buộc' }]}
          >
            <Input placeholder="VD: 01/01/2025 - 31/12/2025" />
          </Form.Item>
          <Form.Item
            label="Tình trạng"
            name="tinhTrang"
            rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
          >
            <Select
              options={Object.entries(TINH_TRANG_NGUON_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item label="Đánh giá" name="danhGia">
            <Input.TextArea rows={2} placeholder="Ghi chú về chất lượng nguồn..." />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
}
