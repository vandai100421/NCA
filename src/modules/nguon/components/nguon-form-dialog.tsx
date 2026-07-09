'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Flex, Form, Input, Modal, Select } from 'antd';
import { useCreateNguon, useUpdateNguon } from '../hooks/use-nguon';
import { createNguonSchema, type CreateNguonInput } from '../schema/nguon-schema';
import {
  NGUON_LOAI_LABELS,
  NGUON_LOAI_OPTIONS,
  TINH_TRANG_NGUON_LABELS,
} from '@/modules/shared/constants';
import type { Nguon } from '@/infrastructure/prisma/generated/client';
import type { TinhTrangNguon } from '@/infrastructure/prisma/generated/client';

interface NguonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Nguon | null;
}

type FormValues = Omit<CreateNguonInput, 'danhGia'> & { danhGia: string };

export function NguonFormDialog({ open, onOpenChange, editing }: NguonFormDialogProps) {
  const { notification } = App.useApp();
  const isEdit = Boolean(editing);
  const createMut = useCreateNguon();
  const updateMut = useUpdateNguon();

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createNguonSchema) as never,
    defaultValues: {
      nguon: (editing?.nguon ?? 'vệ tinh') as (typeof NGUON_LOAI_OPTIONS)[number],
      tenNguon: editing?.tenNguon ?? '',
      thoiGianSuDung: editing?.thoiGianSuDung ?? '',
      tinhTrang: editing?.tinhTrang ?? 'HOAT_DONG',
      danhGia: editing?.danhGia ?? '',
    },
  });

  const nguonValue = useWatch({ control, name: 'nguon' });
  const tenNguonValue = useWatch({ control, name: 'tenNguon' });
  const thoiGianSuDungValue = useWatch({ control, name: 'thoiGianSuDung' });
  const tinhTrangValue = useWatch({ control, name: 'tinhTrang' });
  const danhGiaValue = useWatch({ control, name: 'danhGia' });

  const onSubmit = handleSubmit(async (values) => {
    const input: CreateNguonInput = {
      nguon: values.nguon,
      tenNguon: values.tenNguon,
      thoiGianSuDung: values.thoiGianSuDung,
      tinhTrang: values.tinhTrang,
      danhGia: values.danhGia && values.danhGia.length > 0 ? values.danhGia : undefined,
    };
    try {
      if (isEdit && editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
        notification.success({ title: 'Đã cập nhật nguồn' });
      } else {
        await createMut.mutateAsync(input);
        notification.success({ title: 'Đã tạo nguồn mới' });
      }
      onOpenChange(false);
    } catch (e) {
      notification.error({
        message: 'Lỗi không xác định',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  });

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <Modal
      title={isEdit ? 'Sửa nguồn' : 'Tạo nguồn mới'}
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <Form layout="vertical" component={false}>
          <Flex gap={16} wrap>
            <Form.Item
              label="Loại nguồn"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.nguon ? 'error' : undefined}
              help={errors.nguon?.message}
            >
              <Select
                value={nguonValue}
                onChange={(v) => setValue('nguon', v)}
                options={NGUON_LOAI_OPTIONS.map((opt) => ({
                  value: opt,
                  label: NGUON_LOAI_LABELS[opt],
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Tên nguồn"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.tenNguon ? 'error' : undefined}
              help={errors.tenNguon?.message}
            >
              <Input
                value={tenNguonValue}
                onChange={(e) => setValue('tenNguon', e.target.value)}
                placeholder="VD: VT-Optical-Sat1"
              />
            </Form.Item>
          </Flex>

          <Flex gap={16} wrap>
            <Form.Item
              label="Thời gian sử dụng"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.thoiGianSuDung ? 'error' : undefined}
              help={errors.thoiGianSuDung?.message}
            >
              <Input
                value={thoiGianSuDungValue}
                onChange={(e) => setValue('thoiGianSuDung', e.target.value)}
                placeholder="VD: 01/01/2025 - 31/12/2025"
              />
            </Form.Item>

            <Form.Item
              label="Tình trạng"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.tinhTrang ? 'error' : undefined}
              help={errors.tinhTrang?.message}
            >
              <Select
                value={tinhTrangValue}
                onChange={(v) => setValue('tinhTrang', v as TinhTrangNguon)}
                options={Object.entries(TINH_TRANG_NGUON_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
          </Flex>

          <Form.Item
            label="Đánh giá"
            validateStatus={errors.danhGia ? 'error' : undefined}
            help={errors.danhGia?.message}
          >
            <Input.TextArea
              rows={3}
              value={danhGiaValue}
              onChange={(e) => setValue('danhGia', e.target.value)}
              placeholder="Ghi chú về chất lượng nguồn..."
            />
          </Form.Item>

          <Flex justify="end" gap="small">
            <Button onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={pending}>
              Lưu
            </Button>
          </Flex>
        </Form>
      </form>
    </Modal>
  );
}
