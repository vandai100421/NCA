'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { LOAI_NHU_CAU_LABELS, NGUON_LOAI_LABELS } from '@/modules/shared/constants';
import type { ThongKeThoiGian, ThongKeNguonThoiGian, ChamHanItem } from '../api/thong-ke-service';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

function StatCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'amber' | 'slate' | 'blue';
}) {
  const toneClass: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-600 bg-slate-100',
    blue: 'text-blue-600 bg-blue-50',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={cn('flex size-11 items-center justify-center rounded-lg', toneClass[tone])}>
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function NguonRow({ n, maxTong }: { n: ThongKeNguonThoiGian; maxTong: number }) {
  const tiLeDung = n.tong > 0 ? Math.round((n.dungHan / n.tong) * 100) : 0;
  const pct = maxTong > 0 ? Math.round((n.tong / maxTong) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <Badge variant="secondary">
            {NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon}
          </Badge>
          {n.tenNguon}
        </span>
        <span className="font-medium">
          {n.tong} <span className="text-xs font-normal text-emerald-600">({tiLeDung}% đúng)</span>
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 bg-emerald-500 transition-all"
          style={{ width: `${(pct * n.dungHan) / Math.max(n.tong, 1)}%` }}
        />
        <div
          className="h-2 bg-amber-500 transition-all"
          style={{ width: `${(pct * n.chamHan) / Math.max(n.tong, 1)}%` }}
        />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="text-emerald-600">Đúng hạn: {n.dungHan}</span>
        <span className="text-amber-600">Chậm hạn: {n.chamHan}</span>
      </div>
    </div>
  );
}

function ChamHanTable({ items }: { items: ChamHanItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Mục tiêu</TableHead>
          <TableHead>Nguồn</TableHead>
          <TableHead className="w-28">Loại</TableHead>
          <TableHead className="w-32">Hạn mong muốn</TableHead>
          <TableHead className="w-32">Ngày trả</TableHead>
          <TableHead className="w-24 text-right">Trễ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => (
          <TableRow key={it.id}>
            <TableCell className="font-mono text-xs">
              <Link href={`/nhu-cau-anh/${it.id}`} className="text-primary hover:underline">
                #{it.id}
              </Link>
            </TableCell>
            <TableCell className="font-medium">{it.mucTieuTen}</TableCell>
            <TableCell className="text-xs">{it.nguonTen}</TableCell>
            <TableCell>
              <Badge variant="outline">{LOAI_NHU_CAU_LABELS[it.loaiNhuCau]}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(it.hanMongMuon)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(it.thoiGianTra)}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="outline" className="bg-amber-100 text-amber-700">
                {it.soNgayTre} ngày
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ThongKeThoiGianPanel() {
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [appliedTu, setAppliedTu] = useState<string>('');
  const [appliedDen, setAppliedDen] = useState<string>('');

  const params = new URLSearchParams();
  if (appliedTu) params.set('tuNgay', appliedTu);
  if (appliedDen) params.set('denNgay', appliedDen);
  const qs = params.toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['thong-ke', 'thoi-gian', appliedTu, appliedDen] as const,
    queryFn: () => api.get<ThongKeThoiGian>(`/api/thong-ke/thoi-gian${qs ? `?${qs}` : ''}`),
  });

  const handleApply = () => {
    setAppliedTu(tuNgay);
    setAppliedDen(denNgay);
  };

  const handleReset = () => {
    setTuNgay('');
    setDenNgay('');
    setAppliedTu('');
    setAppliedDen('');
  };

  const maxTong = data ? data.theoNguon.reduce((max, n) => Math.max(max, n.tong), 0) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="size-4" />
          Thống kê đáp ứng theo thời gian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-tuNgay">Từ ngày</Label>
            <Input
              id="filter-tuNgay"
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-denNgay">Đến ngày</Label>
            <Input
              id="filter-denNgay"
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              className="w-44"
            />
          </div>
          <Button type="button" size="sm" onClick={handleApply}>
            Áp dụng
          </Button>
          {(appliedTu || appliedDen) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              Xoá lọc
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
            onRetry={() => void refetch()}
          />
        ) : !data ? (
          <EmptyState title="Chưa có dữ liệu" />
        ) : data.tongDaTraAnh === 0 ? (
          <EmptyState
            title="Chưa có nhu cầu nào đã trả ảnh"
            description="Thống kê đúng/chậm hạn chỉ áp dụng cho nhu cầu đã trả ảnh."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Đã trả ảnh"
                value={data.tongDaTraAnh}
                icon={<CheckCircle2 className="size-5" />}
                tone="blue"
              />
              <StatCard
                title="Đúng hạn"
                value={data.dungHan}
                hint={`${data.tiLeDungHan}% tổng số`}
                icon={<CheckCircle2 className="size-5" />}
                tone="emerald"
              />
              <StatCard
                title="Chậm hạn"
                value={data.chamHan}
                hint={`${100 - data.tiLeDungHan}% tổng số`}
                icon={<AlertTriangle className="size-5" />}
                tone="amber"
              />
              <StatCard
                title="Tỷ lệ đúng hạn"
                value={`${data.tiLeDungHan}%`}
                icon={<Clock className="size-5" />}
                tone="slate"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Phân loại theo nguồn</h4>
              {data.theoNguon.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu theo nguồn.</p>
              ) : (
                <div className="space-y-4">
                  {data.theoNguon.map((n) => (
                    <NguonRow key={n.nguonId} n={n} maxTong={maxTong} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                Danh sách nhu cầu chậm hạn ({data.danhSachChamHan.length})
              </h4>
              {data.danhSachChamHan.length === 0 ? (
                <p className="text-sm text-emerald-600">
                  Không có nhu cầu nào chậm hạn. Tuyệt vời!
                </p>
              ) : (
                <ChamHanTable items={data.danhSachChamHan} />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
