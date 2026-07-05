'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, Image as ImageIcon, Target, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
  TRANG_THAI_NHU_CAU_LABELS,
} from '@/modules/shared/constants';
import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';
import type { TongQuanStats } from '../api/thong-ke-service';
import { ThongKeThoiGianPanel } from './thong-ke-thoi-gian-panel';

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

const ALL_TRANG_THAI: TrangThaiNhuCau[] = [
  'CHO_DUYET',
  'DA_DUYET',
  'DA_PHAN_CONG',
  'DANG_CHUP',
  'DA_CHUP',
  'DA_TRA_ANH',
  'TU_CHOI',
  'DA_HUY',
];

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {title}
          <span className="text-muted-foreground">{icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        <Link href={href} className="text-xs text-primary hover:underline mt-2 inline-block">
          Xem danh sách →
        </Link>
      </CardContent>
    </Card>
  );
}

export function TongQuanDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['thong-ke', 'tong-quan'] as const,
    queryFn: () => api.get<TongQuanStats>('/api/thong-ke/tong-quan'),
  });

  if (isLoading) {
    return <LoadingState message="Đang tải số liệu thống kê..." />;
  }
  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) {
    return <EmptyState title="Chưa có dữ liệu thống kê" />;
  }

  const countByTrangThai = new Map(data.theoTrangThai.map((t) => [t.trangThai, t.count]));
  const maxNguonCount = data.theoNguon.reduce((max, n) => Math.max(max, n.count), 0);
  const countByLoai = new Map(data.theoLoaiNhuCau.map((l) => [l.loaiNhuCau, l.count]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tổng quan</h2>
        <p className="text-sm text-muted-foreground">Hệ thống quản lý nhu cầu đặt ảnh nội bộ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Nhu cầu ảnh"
          value={data.totalNhuCau}
          icon={<ImageIcon className="size-5" />}
          href="/nhu-cau-anh"
        />
        <StatCard
          title="Nguồn"
          value={data.totalNguon}
          icon={<Layers className="size-5" />}
          href="/nguon"
        />
        <StatCard
          title="Mục tiêu"
          value={data.totalMucTieu}
          icon={<Target className="size-5" />}
          href="/muc-tieu"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              Nhu cầu theo trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.totalNhuCau === 0 ? (
              <EmptyState title="Chưa có nhu cầu ảnh nào" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ALL_TRANG_THAI.map((state) => {
                  const count = countByTrangThai.get(state) ?? 0;
                  return (
                    <div key={state} className="flex flex-col gap-2 rounded-lg border p-3">
                      <Badge variant="outline" className={cn('w-fit', TRANG_THAI_BADGE[state])}>
                        {TRANG_THAI_NHU_CAU_LABELS[state]}
                      </Badge>
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân loại nhu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.totalNhuCau === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              Object.entries(LOAI_NHU_CAU_LABELS).map(([value, label]) => {
                const count = countByLoai.get(value as 'CO_DINH' | 'DOT_XUAT') ?? 0;
                const pct = data.totalNhuCau > 0 ? Math.round((count / data.totalNhuCau) * 100) : 0;
                return (
                  <div key={value} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nhu cầu theo nguồn (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.theoNguon.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu theo nguồn" />
          ) : (
            <div className="space-y-3">
              {data.theoNguon.map((n) => {
                const pct = maxNguonCount > 0 ? Math.round((n.count / maxNguonCount) * 100) : 0;
                return (
                  <div key={n.nguonId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon}
                        </Badge>
                        {n.tenNguon}
                      </span>
                      <span className="font-medium">{n.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ThongKeThoiGianPanel />
    </div>
  );
}
