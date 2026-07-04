'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  LOAI_ANH_CHUP_LABELS,
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
  TRANG_THAI_NHU_CAU_LABELS,
} from '@/modules/shared/constants';
import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';
import { useNhuCauDetail, useTransitionNhuCau } from '../hooks/use-nhu-cau-anh';
import { getNextStates } from '../lib/state-machine';

const TRANG_THAI_BADGE: Record<TrangThaiNhuCau, string> = {
  CHO_DUYET: 'bg-slate-100 text-slate-700',
  DA_DUYET: 'bg-blue-100 text-blue-700',
  DA_PHAN_CONG: 'bg-indigo-100 text-indigo-700',
  DANG_CHUP: 'bg-amber-100 text-amber-700',
  DA_CHUP: 'bg-cyan-100 text-cyan-700',
  DA_TRA_ANH: 'bg-emerald-100 text-emerald-700',
  TU_CHOI: 'bg-rose-100 text-rose-700',
  DA_HUY: 'bg-zinc-100 text-zinc-500',
};

const formatDate = (d: Date | string | null | undefined): string => {
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function NhuCauDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const { data, isLoading, error } = useNhuCauDetail(id);
  const transitionMut = useTransitionNhuCau();

  const [nextState, setNextState] = useState<TrangThaiNhuCau | ''>('');
  const [ghiChu, setGhiChu] = useState('');

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
      </p>
    );
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Không tìm thấy nhu cầu.</p>;
  }

  const nextStates = getNextStates(data.trangThai);

  const handleTransition = async () => {
    if (!nextState) {
      toast.error('Vui lòng chọn trạng thái mới');
      return;
    }
    try {
      await transitionMut.mutateAsync({
        id,
        input: {
          trangThaiMoi: nextState,
          ghiChu: ghiChu || undefined,
        },
      });
      toast.success(`Đã chuyển sang "${TRANG_THAI_NHU_CAU_LABELS[nextState]}"`);
      setNextState('');
      setGhiChu('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi chuyển trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nhu cầu ảnh #{data.id}</h2>
          <p className="text-sm text-muted-foreground">Tạo lúc {formatDate(data.thoiGianDat)}</p>
        </div>
        <Badge variant="outline" className={cn('ml-auto', TRANG_THAI_BADGE[data.trangThai])}>
          {TRANG_THAI_NHU_CAU_LABELS[data.trangThai]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin nhu cầu</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="Mục tiêu" value={data.mucTieu.ten} />
            <InfoRow
              label="Nguồn"
              value={
                <>
                  <Badge variant="secondary" className="mr-1">
                    {NGUON_LOAI_LABELS[data.nguon.nguon as keyof typeof NGUON_LOAI_LABELS] ??
                      data.nguon.nguon}
                  </Badge>
                  {data.nguon.tenNguon}
                </>
              }
            />
            <InfoRow
              label="Loại nhu cầu"
              value={<Badge variant="outline">{LOAI_NHU_CAU_LABELS[data.loaiNhuCau]}</Badge>}
            />
            <InfoRow
              label="Loại ảnh chụp"
              value={<Badge variant="outline">{LOAI_ANH_CHUP_LABELS[data.loaiAnhChup]}</Badge>}
            />
            <InfoRow label="Địa bàn" value={data.diaBan} />
            <InfoRow label="Độ phân giải" value={data.doPhanGiai} />
            <InfoRow label="Tọa độ" value={`${data.toaDoX}, ${data.toaDoY}`} />
            {data.loaiNhuCau === 'CO_DINH' ? (
              <InfoRow label="Thời gian chụp" value={formatDate(data.thoiGianChup)} />
            ) : (
              <>
                <InfoRow label="Mong muốn chụp từ" value={formatDate(data.thoiGianMongMuonTu)} />
                <InfoRow label="Mong muốn chụp đến" value={formatDate(data.thoiGianMongMuonDen)} />
              </>
            )}
            <InfoRow label="Thời gian trả ảnh" value={formatDate(data.thoiGianTra)} />
            {data.moTa && (
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Mô tả</span>
                <span className="text-sm whitespace-pre-wrap">{data.moTa}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chuyển trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextStates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Trạng thái hiện tại là trạng thái cuối, không thể chuyển tiếp.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Trạng thái mới</label>
                  <Select
                    value={nextState}
                    onValueChange={(v) => setNextState(v as TrangThaiNhuCau)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStates.map((s) => (
                        <SelectItem key={s} value={s}>
                          {TRANG_THAI_NHU_CAU_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Ghi chú (tuỳ chọn)</label>
                  <textarea
                    className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Lý do chuyển trạng thái..."
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleTransition}
                  disabled={transitionMut.isPending || !nextState}
                >
                  {transitionMut.isPending ? 'Đang chuyển...' : 'Chuyển trạng thái'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Lịch sử trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.lichSu.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có lịch sử.</p>
          ) : (
            <ol className="relative border-l border-border ml-2 space-y-4">
              {data.lichSu.map((entry) => (
                <li key={entry.id} className="ml-4 pl-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.trangThaiCu ? (
                      <>
                        <Badge
                          variant="outline"
                          className={cn(TRANG_THAI_BADGE[entry.trangThaiCu])}
                        >
                          {TRANG_THAI_NHU_CAU_LABELS[entry.trangThaiCu]}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                      </>
                    ) : null}
                    <Badge variant="outline" className={cn(TRANG_THAI_BADGE[entry.trangThaiMoi])}>
                      {TRANG_THAI_NHU_CAU_LABELS[entry.trangThaiMoi]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.thoiGian)}
                    </span>
                  </div>
                  {entry.ghiChu && (
                    <p className="text-xs text-muted-foreground mt-1">{entry.ghiChu}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
