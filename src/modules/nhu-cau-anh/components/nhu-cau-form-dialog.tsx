'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Flex, Form, Input, Modal, Select } from 'antd';
import { api } from '@/lib/api';
import { searchableProps } from '@/lib/select';
import type { MucTieu, Nguon } from '@/infrastructure/prisma/generated/client';
import {
  LOAI_ANH_CHUP_LABELS,
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
} from '@/modules/shared/constants';
import type { LoaiAnhChup, LoaiNhuCau } from '@/infrastructure/prisma/generated/client';
import { useCreateNhuCau, useUpdateNhuCau } from '../hooks/use-nhu-cau-anh';
import { nhuCauFormSchema, type NhuCauFormValues } from '../schema/nhu-cau-form-schema';
import type { NhuCauAnhDetail } from '../api/nhu-cau-anh-service';

interface NhuCauFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: NhuCauAnhDetail | null;
  mucTieuList: MucTieu[];
  nguonList: Nguon[];
}

type FormValues = NhuCauFormValues;

const toLocalInput = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export function NhuCauFormDialog({
  open,
  onOpenChange,
  editing,
  mucTieuList,
  nguonList,
}: NhuCauFormDialogProps) {
  const { notification } = App.useApp();
  const isEdit = Boolean(editing);
  const createMut = useCreateNhuCau();
  const updateMut = useUpdateNhuCau();

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(nhuCauFormSchema),
    defaultValues: {
      mucTieuId: editing ? String(editing.mucTieuId) : '',
      nguonId: editing ? String(editing.nguonId) : '',
      loaiNhuCau: editing?.loaiNhuCau ?? 'CO_DINH',
      diaBan: editing?.diaBan ?? '',
      loaiAnhChup: editing?.loaiAnhChup ?? 'QUANG_HOC',
      toaDoX: editing ? String(editing.toaDoX) : '',
      toaDoY: editing ? String(editing.toaDoY) : '',
      thoiGianDat: toLocalInput(editing?.thoiGianDat),
      thoiGianChup: toLocalInput(editing?.thoiGianChup),
      thoiGianMongMuonTu: toLocalInput(editing?.thoiGianMongMuonTu),
      thoiGianMongMuonDen: toLocalInput(editing?.thoiGianMongMuonDen),
      doPhanGiai: editing?.doPhanGiai ?? '',
      moTa: editing?.moTa ?? '',
    },
  });

  const loaiNhuCauValue = useWatch({ control, name: 'loaiNhuCau' });
  const mucTieuIdValue = useWatch({ control, name: 'mucTieuId' });
  const nguonIdValue = useWatch({ control, name: 'nguonId' });
  const loaiAnhChupValue = useWatch({ control, name: 'loaiAnhChup' });
  const diaBanValue = useWatch({ control, name: 'diaBan' });
  const toaDoXValue = useWatch({ control, name: 'toaDoX' });
  const toaDoYValue = useWatch({ control, name: 'toaDoY' });
  const thoiGianDatValue = useWatch({ control, name: 'thoiGianDat' });
  const thoiGianChupValue = useWatch({ control, name: 'thoiGianChup' });
  const thoiGianMongMuonTuValue = useWatch({ control, name: 'thoiGianMongMuonTu' });
  const thoiGianMongMuonDenValue = useWatch({ control, name: 'thoiGianMongMuonDen' });
  const doPhanGiaiValue = useWatch({ control, name: 'doPhanGiai' });
  const moTaValue = useWatch({ control, name: 'moTa' });

  const onSubmit = handleSubmit(async (values) => {
    const common = {
      mucTieuId: Number(values.mucTieuId),
      nguonId: Number(values.nguonId),
      diaBan: values.diaBan,
      loaiAnhChup: values.loaiAnhChup,
      toaDoX: Number(values.toaDoX),
      toaDoY: Number(values.toaDoY),
      thoiGianDat:
        values.thoiGianDat && values.thoiGianDat.length > 0
          ? new Date(values.thoiGianDat)
          : undefined,
      doPhanGiai: values.doPhanGiai,
      moTa: values.moTa && values.moTa.length > 0 ? values.moTa : undefined,
    };

    const payload =
      values.loaiNhuCau === 'CO_DINH'
        ? {
            ...common,
            loaiNhuCau: 'CO_DINH' as const,
            thoiGianChup: new Date(values.thoiGianChup ?? ''),
          }
        : {
            ...common,
            loaiNhuCau: 'DOT_XUAT' as const,
            thoiGianMongMuonTu: new Date(values.thoiGianMongMuonTu ?? ''),
            thoiGianMongMuonDen: new Date(values.thoiGianMongMuonDen ?? ''),
          };

    try {
      if (isEdit && editing) {
        await updateMut.mutateAsync({ id: editing.id, input: payload });
        notification.success({ title: 'Đã cập nhật nhu cầu ảnh' });
      } else {
        await createMut.mutateAsync(payload);
        notification.success({ title: 'Đã tạo nhu cầu ảnh mới' });
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

  const mucTieuOptions = mucTieuList.map((m) => ({ value: String(m.id), label: m.ten }));
  const nguonOptions = nguonList.map((n) => ({
    value: String(n.id),
    label: `${NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon} — ${n.tenNguon}`,
  }));

  return (
    <Modal
      title={isEdit ? 'Sửa nhu cầu ảnh' : 'Tạo nhu cầu ảnh mới'}
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <Form layout="vertical" component={false}>
          <Flex gap={16} wrap>
            <Form.Item
              label="Mục tiêu"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.mucTieuId ? 'error' : undefined}
              help={errors.mucTieuId?.message}
            >
              <Select
                value={mucTieuIdValue || undefined}
                onChange={(v) => setValue('mucTieuId', v ?? '')}
                placeholder="Chọn mục tiêu"
                options={mucTieuOptions}
                {...searchableProps(mucTieuOptions)}
              />
            </Form.Item>

            <Form.Item
              label="Nguồn"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.nguonId ? 'error' : undefined}
              help={errors.nguonId?.message}
            >
              <Select
                value={nguonIdValue || undefined}
                onChange={(v) => setValue('nguonId', v ?? '')}
                placeholder="Chọn nguồn"
                options={nguonOptions}
                {...searchableProps(nguonOptions)}
              />
            </Form.Item>
          </Flex>

          <Flex gap={16} wrap>
            <Form.Item
              label="Loại nhu cầu"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.loaiNhuCau ? 'error' : undefined}
              help={isEdit ? 'Không thể đổi loại nhu cầu sau khi tạo' : errors.loaiNhuCau?.message}
            >
              <Select
                value={loaiNhuCauValue}
                onChange={(v) => setValue('loaiNhuCau', v as LoaiNhuCau)}
                disabled={isEdit}
                options={Object.entries(LOAI_NHU_CAU_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Loại ảnh chụp"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.loaiAnhChup ? 'error' : undefined}
              help={errors.loaiAnhChup?.message}
            >
              <Select
                value={loaiAnhChupValue}
                onChange={(v) => setValue('loaiAnhChup', v as LoaiAnhChup)}
                options={Object.entries(LOAI_ANH_CHUP_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
          </Flex>

          <Form.Item
            label="Địa bàn"
            validateStatus={errors.diaBan ? 'error' : undefined}
            help={errors.diaBan?.message}
          >
            <Input
              value={diaBanValue}
              onChange={(e) => setValue('diaBan', e.target.value)}
              placeholder="VD: Hà Nội, quận Cầu Giấy"
            />
          </Form.Item>

          <Flex gap={16} wrap>
            <Form.Item
              label="Tọa độ X (kinh độ)"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.toaDoX ? 'error' : undefined}
              help={errors.toaDoX?.message}
            >
              <Input
                type="number"
                step="any"
                value={toaDoXValue}
                onChange={(e) => setValue('toaDoX', e.target.value)}
                placeholder="VD: 105.8342"
              />
            </Form.Item>
            <Form.Item
              label="Tọa độ Y (vĩ độ)"
              style={{ flex: 1, minWidth: 240 }}
              validateStatus={errors.toaDoY ? 'error' : undefined}
              help={errors.toaDoY?.message}
            >
              <Input
                type="number"
                step="any"
                value={toaDoYValue}
                onChange={(e) => setValue('toaDoY', e.target.value)}
                placeholder="VD: 21.0278"
              />
            </Form.Item>
          </Flex>

          <Form.Item
            label="Thời gian đặt"
            validateStatus={errors.thoiGianDat ? 'error' : undefined}
            help={errors.thoiGianDat?.message ?? 'Bỏ trống để lấy thời điểm hiện tại'}
          >
            <Input
              type="datetime-local"
              value={thoiGianDatValue}
              onChange={(e) => setValue('thoiGianDat', e.target.value)}
            />
          </Form.Item>

          {loaiNhuCauValue === 'CO_DINH' ? (
            <Form.Item
              label="Thời gian chụp"
              validateStatus={errors.thoiGianChup ? 'error' : undefined}
              help={errors.thoiGianChup?.message}
            >
              <Input
                type="datetime-local"
                value={thoiGianChupValue}
                onChange={(e) => setValue('thoiGianChup', e.target.value)}
              />
            </Form.Item>
          ) : (
            <Flex gap={16} wrap>
              <Form.Item
                label="Mong muốn chụp từ"
                style={{ flex: 1, minWidth: 240 }}
                validateStatus={errors.thoiGianMongMuonTu ? 'error' : undefined}
                help={errors.thoiGianMongMuonTu?.message}
              >
                <Input
                  type="datetime-local"
                  value={thoiGianMongMuonTuValue}
                  onChange={(e) => setValue('thoiGianMongMuonTu', e.target.value)}
                />
              </Form.Item>
              <Form.Item
                label="Mong muốn chụp đến"
                style={{ flex: 1, minWidth: 240 }}
                validateStatus={errors.thoiGianMongMuonDen ? 'error' : undefined}
                help={errors.thoiGianMongMuonDen?.message}
              >
                <Input
                  type="datetime-local"
                  value={thoiGianMongMuonDenValue}
                  onChange={(e) => setValue('thoiGianMongMuonDen', e.target.value)}
                />
              </Form.Item>
            </Flex>
          )}

          <Form.Item
            label="Độ phân giải"
            validateStatus={errors.doPhanGiai ? 'error' : undefined}
            help={errors.doPhanGiai?.message}
          >
            <Input
              value={doPhanGiaiValue}
              onChange={(e) => setValue('doPhanGiai', e.target.value)}
              placeholder="VD: 0.5m, 1m"
            />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            validateStatus={errors.moTa ? 'error' : undefined}
            help={errors.moTa?.message}
          >
            <Input.TextArea
              rows={3}
              value={moTaValue}
              onChange={(e) => setValue('moTa', e.target.value)}
              placeholder="Mô tả thêm về nhu cầu..."
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

export async function fetchMucTieuNguonForForm() {
  const [mucTieu, nguon] = await Promise.all([
    api.get<MucTieu[]>('/api/muc-tieu'),
    api.get<Nguon[]>('/api/nguon'),
  ]);
  return { mucTieu, nguon };
}
