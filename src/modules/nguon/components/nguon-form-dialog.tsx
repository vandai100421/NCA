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
import { useCreateNguon, useUpdateNguon } from '../hooks/use-nguon';
import { createNguonSchema, type CreateNguonInput } from '../schema/nguon-schema';
import {
  NGUON_LOAI_OPTIONS,
  NGUON_LOAI_LABELS,
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
  const isEdit = Boolean(editing);
  const createMut = useCreateNguon();
  const updateMut = useUpdateNguon();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createNguonSchema) as never,
    defaultValues: {
      nguon: 'vệ tinh',
      tenNguon: '',
      thoiGianSuDung: '',
      tinhTrang: 'HOAT_DONG',
      danhGia: '',
    },
  });

  const nguonValue = useWatch({ control, name: 'nguon' });
  const tinhTrangValue = useWatch({ control, name: 'tinhTrang' });

  useEffect(() => {
    if (open) {
      reset({
        nguon: (editing?.nguon ?? 'vệ tinh') as (typeof NGUON_LOAI_OPTIONS)[number],
        tenNguon: editing?.tenNguon ?? '',
        thoiGianSuDung: editing?.thoiGianSuDung ?? '',
        tinhTrang: editing?.tinhTrang ?? 'HOAT_DONG',
        danhGia: editing?.danhGia ?? '',
      });
    }
  }, [open, editing, reset]);

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
        toast.success('Đã cập nhật nguồn');
      } else {
        await createMut.mutateAsync(input);
        toast.success('Đã tạo nguồn mới');
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi không xác định');
    }
  });

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa nguồn' : 'Tạo nguồn mới'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại nguồn</Label>
              <Select
                value={nguonValue}
                onValueChange={(v) =>
                  setValue('nguon', (v ?? 'vệ tinh') as (typeof NGUON_LOAI_OPTIONS)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại nguồn" />
                </SelectTrigger>
                <SelectContent>
                  {NGUON_LOAI_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {NGUON_LOAI_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nguon && <p className="text-sm text-destructive">{errors.nguon.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenNguon">Tên nguồn</Label>
              <Input id="tenNguon" placeholder="VD: VT-Optical-Sat1" {...register('tenNguon')} />
              {errors.tenNguon && (
                <p className="text-sm text-destructive">{errors.tenNguon.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thoiGianSuDung">Thời gian sử dụng</Label>
              <Input
                id="thoiGianSuDung"
                placeholder="VD: 01/01/2025 - 31/12/2025"
                {...register('thoiGianSuDung')}
              />
              {errors.thoiGianSuDung && (
                <p className="text-sm text-destructive">{errors.thoiGianSuDung.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tình trạng</Label>
              <Select
                value={tinhTrangValue}
                onValueChange={(v) => setValue('tinhTrang', (v ?? 'HOAT_DONG') as TinhTrangNguon)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tình trạng" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TINH_TRANG_NGUON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tinhTrang && (
                <p className="text-sm text-destructive">{errors.tinhTrang.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="danhGia">Đánh giá</Label>
            <textarea
              id="danhGia"
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Ghi chú về chất lượng nguồn..."
              {...register('danhGia')}
            />
            {errors.danhGia && <p className="text-sm text-destructive">{errors.danhGia.message}</p>}
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
