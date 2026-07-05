'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { MucTieu, Nguon } from '@/infrastructure/prisma/generated/client';
import {
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
  PAGE_SIZE_OPTIONS,
  TRANG_THAI_NHU_CAU_LABELS,
} from '@/modules/shared/constants';
import type { LoaiNhuCau, TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';
import { useNhuCauList, useDeleteNhuCau } from '../hooks/use-nhu-cau-anh';
import { NhuCauFormDialog } from './nhu-cau-form-dialog';
import type { NhuCauAnhDetail } from '../api/nhu-cau-anh-service';

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

export function NhuCauList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [trangThai, setTrangThai] = useState<TrangThaiNhuCau | 'ALL'>('ALL');
  const [nguonId, setNguonId] = useState<number | 'ALL'>('ALL');
  const [mucTieuId, setMucTieuId] = useState<number | 'ALL'>('ALL');
  const [loaiNhuCau, setLoaiNhuCau] = useState<LoaiNhuCau | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NhuCauAnhDetail | null>(null);
  const deleteMut = useDeleteNhuCau();

  const { data: mucTieuData } = useQuery({
    queryKey: ['muc-tieu'],
    queryFn: () => api.get<MucTieu[]>('/api/muc-tieu'),
  });
  const { data: nguonData } = useQuery({
    queryKey: ['nguon'],
    queryFn: () => api.get<Nguon[]>('/api/nguon'),
  });

  const { data, isLoading, error, isFetching, refetch } = useNhuCauList({
    page,
    pageSize,
    trangThai: trangThai === 'ALL' ? undefined : trangThai,
    nguonId: nguonId === 'ALL' ? undefined : nguonId,
    mucTieuId: mucTieuId === 'ALL' ? undefined : mucTieuId,
    loaiNhuCau: loaiNhuCau === 'ALL' ? undefined : loaiNhuCau,
    search: search || undefined,
  });

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (n: NhuCauAnhDetail) => {
    setEditing(n);
    setOpen(true);
  };

  const handleDelete = async (n: NhuCauAnhDetail) => {
    if (!confirm(`Xóa nhu cầu ảnh #${n.id}?`)) return;
    try {
      await deleteMut.mutateAsync(n.id);
      toast.success('Đã xóa nhu cầu ảnh');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không xóa được');
    }
  };

  const resetFilters = () => {
    setTrangThai('ALL');
    setNguonId('ALL');
    setMucTieuId('ALL');
    setLoaiNhuCau('ALL');
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (trangThai !== 'ALL') params.set('trangThai', trangThai);
    if (nguonId !== 'ALL') params.set('nguonId', String(nguonId));
    if (mucTieuId !== 'ALL') params.set('mucTieuId', String(mucTieuId));
    if (loaiNhuCau !== 'ALL') params.set('loaiNhuCau', loaiNhuCau);
    if (search) params.set('search', search);
    const qs = params.toString();
    window.location.href = `/api/nhu-cau-anh/export${qs ? `?${qs}` : ''}`;
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nhu cầu ảnh</h2>
          <p className="text-sm text-muted-foreground">Quản lý nhu cầu đặt chụp ảnh</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isLoading || !!error}>
            <Download className="size-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="size-4 mr-2" />
            Thêm nhu cầu
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-trangThai">Trạng thái</Label>
              <Select
                value={trangThai}
                onValueChange={(v) => {
                  setTrangThai(v as TrangThaiNhuCau | 'ALL');
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-trangThai">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  {Object.entries(TRANG_THAI_NHU_CAU_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-nguonId">Nguồn</Label>
              <Select
                value={String(nguonId)}
                onValueChange={(v) => {
                  setNguonId(v === 'ALL' ? 'ALL' : Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-nguonId">
                  <SelectValue placeholder="Nguồn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả nguồn</SelectItem>
                  {(nguonData ?? []).map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {n.tenNguon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-mucTieuId">Mục tiêu</Label>
              <Select
                value={String(mucTieuId)}
                onValueChange={(v) => {
                  setMucTieuId(v === 'ALL' ? 'ALL' : Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-mucTieuId">
                  <SelectValue placeholder="Mục tiêu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả mục tiêu</SelectItem>
                  {(mucTieuData ?? []).map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.ten}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-loaiNhuCau">Loại nhu cầu</Label>
              <Select
                value={loaiNhuCau}
                onValueChange={(v) => {
                  setLoaiNhuCau(v as LoaiNhuCau | 'ALL');
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-loaiNhuCau">
                  <SelectValue placeholder="Loại nhu cầu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  {Object.entries(LOAI_NHU_CAU_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-search">Tìm kiếm</Label>
              <div className="flex gap-2">
                <Input
                  id="filter-search"
                  placeholder="Tìm kiếm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button type="button" variant="secondary" size="icon" onClick={handleSearch}>
                  <Search className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="opacity-0">Thao tác</Label>
              <Button variant="ghost" onClick={resetFilters}>
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách nhu cầu ảnh
            {isFetching && !isLoading && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">đang tải...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
              onRetry={() => void refetch()}
            />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              title="Chưa có nhu cầu ảnh nào"
              description="Bấm “Thêm nhu cầu” để tạo bản ghi đầu tiên."
              action={
                <Button onClick={handleAdd} variant="outline" size="sm">
                  <Plus className="size-4 mr-2" />
                  Thêm nhu cầu
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>Mục tiêu</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead className="w-24">Loại</TableHead>
                  <TableHead>Địa bàn</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="w-32">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/nhu-cau-anh/${n.id}`} className="text-primary hover:underline">
                        #{n.id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{n.mucTieu.ten}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary">
                        {NGUON_LOAI_LABELS[n.nguon.nguon as keyof typeof NGUON_LOAI_LABELS] ??
                          n.nguon.nguon}
                      </Badge>{' '}
                      {n.nguon.tenNguon}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{LOAI_NHU_CAU_LABELS[n.loaiNhuCau]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-xs" title={n.diaBan}>
                      {n.diaBan}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(TRANG_THAI_BADGE[n.trangThai])}>
                        {TRANG_THAI_NHU_CAU_LABELS[n.trangThai]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/nhu-cau-anh/${n.id}`}>
                          <Button variant="ghost" size="icon" title="Xem chi tiết">
                            <Search className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(n)}
                          title="Sửa"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(n)}
                          title="Xóa"
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Hiển thị</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>
                  / {total} — trang {page}/{totalPages}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <NhuCauFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        mucTieuList={mucTieuData ?? []}
        nguonList={nguonData ?? []}
      />
    </div>
  );
}
