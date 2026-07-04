'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
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
  const isEdit = Boolean(editing);
  const createMut = useCreateNhuCau();
  const updateMut = useUpdateNhuCau();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(nhuCauFormSchema),
    defaultValues: {
      mucTieuId: '',
      nguonId: '',
      loaiNhuCau: 'CO_DINH',
      diaBan: '',
      loaiAnhChup: 'QUANG_HOC',
      toaDoX: '',
      toaDoY: '',
      thoiGianChup: '',
      thoiGianMongMuonTu: '',
      thoiGianMongMuonDen: '',
      doPhanGiai: '',
      moTa: '',
    },
  });

  const loaiNhuCauValue = useWatch({ control, name: 'loaiNhuCau' });
  const mucTieuIdValue = useWatch({ control, name: 'mucTieuId' });
  const nguonIdValue = useWatch({ control, name: 'nguonId' });
  const loaiAnhChupValue = useWatch({ control, name: 'loaiAnhChup' });

  useEffect(() => {
    if (open) {
      reset({
        mucTieuId: editing ? String(editing.mucTieuId) : '',
        nguonId: editing ? String(editing.nguonId) : '',
        loaiNhuCau: editing?.loaiNhuCau ?? 'CO_DINH',
        diaBan: editing?.diaBan ?? '',
        loaiAnhChup: editing?.loaiAnhChup ?? 'QUANG_HOC',
        toaDoX: editing ? String(editing.toaDoX) : '',
        toaDoY: editing ? String(editing.toaDoY) : '',
        thoiGianChup: toLocalInput(editing?.thoiGianChup),
        thoiGianMongMuonTu: toLocalInput(editing?.thoiGianMongMuonTu),
        thoiGianMongMuonDen: toLocalInput(editing?.thoiGianMongMuonDen),
        doPhanGiai: editing?.doPhanGiai ?? '',
        moTa: editing?.moTa ?? '',
      });
    }
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const common = {
      mucTieuId: Number(values.mucTieuId),
      nguonId: Number(values.nguonId),
      diaBan: values.diaBan,
      loaiAnhChup: values.loaiAnhChup,
      toaDoX: Number(values.toaDoX),
      toaDoY: Number(values.toaDoY),
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
        toast.success('Đã cập nhật nhu cầu ảnh');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Đã tạo nhu cầu ảnh mới');
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi không xác định');
    }
  });

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa nhu cầu ảnh' : 'Tạo nhu cầu ảnh mới'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mục tiêu</Label>
              <Select
                value={String(mucTieuIdValue)}
                onValueChange={(v) => setValue('mucTieuId', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mục tiêu" />
                </SelectTrigger>
                <SelectContent>
                  {mucTieuList.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.ten}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mucTieuId && (
                <p className="text-sm text-destructive">{errors.mucTieuId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nguồn</Label>
              <Select
                value={String(nguonIdValue)}
                onValueChange={(v) => setValue('nguonId', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nguồn" />
                </SelectTrigger>
                <SelectContent>
                  {nguonList.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon} —{' '}
                      {n.tenNguon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nguonId && (
                <p className="text-sm text-destructive">{errors.nguonId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại nhu cầu</Label>
              <Select
                value={loaiNhuCauValue}
                onValueChange={(v) => setValue('loaiNhuCau', v as LoaiNhuCau)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại nhu cầu" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOAI_NHU_CAU_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Không thể đổi loại nhu cầu sau khi tạo
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Loại ảnh chụp</Label>
              <Select
                value={loaiAnhChupValue}
                onValueChange={(v) => setValue('loaiAnhChup', v as LoaiAnhChup)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại ảnh" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOAI_ANH_CHUP_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.loaiAnhChup && (
                <p className="text-sm text-destructive">{errors.loaiAnhChup.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diaBan">Địa bàn</Label>
            <Input id="diaBan" placeholder="VD: Hà Nội, quận Cầu Giấy" {...register('diaBan')} />
            {errors.diaBan && <p className="text-sm text-destructive">{errors.diaBan.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="toaDoX">Tọa độ X (kinh độ)</Label>
              <Input
                id="toaDoX"
                type="number"
                step="any"
                placeholder="VD: 105.8342"
                {...register('toaDoX')}
              />
              {errors.toaDoX && <p className="text-sm text-destructive">{errors.toaDoX.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="toaDoY">Tọa độ Y (vĩ độ)</Label>
              <Input
                id="toaDoY"
                type="number"
                step="any"
                placeholder="VD: 21.0278"
                {...register('toaDoY')}
              />
              {errors.toaDoY && <p className="text-sm text-destructive">{errors.toaDoY.message}</p>}
            </div>
          </div>

          {loaiNhuCauValue === 'CO_DINH' ? (
            <div className="space-y-2">
              <Label htmlFor="thoiGianChup">Thời gian chụp</Label>
              <Input id="thoiGianChup" type="datetime-local" {...register('thoiGianChup')} />
              {errors.thoiGianChup && (
                <p className="text-sm text-destructive">{errors.thoiGianChup.message}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thoiGianMongMuonTu">Mong muốn chụp từ</Label>
                <Input
                  id="thoiGianMongMuonTu"
                  type="datetime-local"
                  {...register('thoiGianMongMuonTu')}
                />
                {errors.thoiGianMongMuonTu && (
                  <p className="text-sm text-destructive">{errors.thoiGianMongMuonTu.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="thoiGianMongMuonDen">Mong muốn chụp đến</Label>
                <Input
                  id="thoiGianMongMuonDen"
                  type="datetime-local"
                  {...register('thoiGianMongMuonDen')}
                />
                {errors.thoiGianMongMuonDen && (
                  <p className="text-sm text-destructive">{errors.thoiGianMongMuonDen.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doPhanGiai">Độ phân giải</Label>
              <Input id="doPhanGiai" placeholder="VD: 0.5m, 1m" {...register('doPhanGiai')} />
              {errors.doPhanGiai && (
                <p className="text-sm text-destructive">{errors.doPhanGiai.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moTa">Mô tả</Label>
            <textarea
              id="moTa"
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Mô tả thêm về nhu cầu..."
              {...register('moTa')}
            />
            {errors.moTa && <p className="text-sm text-destructive">{errors.moTa.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export async function fetchMucTieuNguonForForm() {
  const [mucTieu, nguon] = await Promise.all([
    api.get<MucTieu[]>('/api/muc-tieu'),
    api.get<Nguon[]>('/api/nguon'),
  ]);
  return { mucTieu, nguon };
}
