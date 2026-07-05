'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Nguon } from '@/infrastructure/prisma/generated/client';
import { NGUON_LOAI_LABELS, TINH_TRANG_NGUON_LABELS } from '@/modules/shared/constants';
import { cn } from '@/lib/utils';
import { useDeleteNguon } from '../hooks/use-nguon';
import { NguonFormDialog } from './nguon-form-dialog';

const TINH_TRANG_BADGE: Record<Nguon['tinhTrang'], string> = {
  HOAT_DONG: 'bg-emerald-100 text-emerald-700',
  BAO_TRI: 'bg-amber-100 text-amber-700',
  NGUNG_HOAT_DONG: 'bg-rose-100 text-rose-700',
};

export function NguonList() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nguon | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const deleteMut = useDeleteNguon();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['nguon', search] as const,
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return api.get<Nguon[]>(`/api/nguon${qs}`);
    },
  });

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (n: Nguon) => {
    setEditing(n);
    setOpen(true);
  };

  const handleDelete = async (n: Nguon) => {
    if (!confirm(`Xóa nguồn "${n.tenNguon}"?`)) return;
    try {
      await deleteMut.mutateAsync(n.id);
      toast.success('Đã xóa nguồn');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không xóa được');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nguồn</h2>
          <p className="text-sm text-muted-foreground">Đối tượng cung cấp ảnh</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4 mr-2" />
          Thêm nguồn
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5 max-w-md">
            <Label htmlFor="filter-search">Tìm kiếm</Label>
            <div className="flex gap-2">
              <Input
                id="filter-search"
                placeholder="Tìm theo tên / loại / đánh giá..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button type="button" variant="secondary" size="icon" onClick={handleSearch}>
                <Search className="size-4" />
              </Button>
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                  }}
                >
                  Xoá
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nguồn</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
              onRetry={() => void refetch()}
            />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="Chưa có nguồn nào"
              description="Bấm “Thêm nguồn” để tạo bản ghi đầu tiên."
              action={
                <Button onClick={handleAdd} variant="outline" size="sm">
                  <Plus className="size-4 mr-2" />
                  Thêm nguồn
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tên nguồn</TableHead>
                  <TableHead className="w-24">Loại</TableHead>
                  <TableHead className="w-40">Thời gian SD</TableHead>
                  <TableHead className="w-28">Tình trạng</TableHead>
                  <TableHead className="w-32">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-xs">{n.id}</TableCell>
                    <TableCell className="font-medium">{n.tenNguon}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {NGUON_LOAI_LABELS[n.nguon as keyof typeof NGUON_LOAI_LABELS] ?? n.nguon}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {n.thoiGianSuDung}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(TINH_TRANG_BADGE[n.tinhTrang])}>
                        {TINH_TRANG_NGUON_LABELS[n.tinhTrang]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
        </CardContent>
      </Card>

      <NguonFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
