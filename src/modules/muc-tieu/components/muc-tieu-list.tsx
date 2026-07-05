'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { MucTieu } from '@/infrastructure/prisma/generated/client';
import { useDeleteMucTieu } from '../hooks/use-muc-tieu';
import { MucTieuFormDialog } from './muc-tieu-form-dialog';

export function MucTieuList() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MucTieu | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const deleteMut = useDeleteMucTieu();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['muc-tieu', search] as const,
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return api.get<MucTieu[]>(`/api/muc-tieu${qs}`);
    },
  });

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (m: MucTieu) => {
    setEditing(m);
    setOpen(true);
  };

  const handleDelete = async (m: MucTieu) => {
    if (!confirm(`Xóa mục tiêu "${m.ten}"?`)) return;
    try {
      await deleteMut.mutateAsync(m.id);
      toast.success('Đã xóa mục tiêu');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không xóa được');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mục tiêu</h2>
          <p className="text-sm text-muted-foreground">Đối tượng cần chụp ảnh</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4 mr-2" />
          Thêm mục tiêu
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
                placeholder="Tìm theo tên mục tiêu..."
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
          <CardTitle>Danh sách mục tiêu</CardTitle>
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
              title="Chưa có mục tiêu nào"
              description="Bấm “Thêm mục tiêu” để tạo bản ghi đầu tiên."
              action={
                <Button onClick={handleAdd} variant="outline" size="sm">
                  <Plus className="size-4 mr-2" />
                  Thêm mục tiêu
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tên mục tiêu</TableHead>
                  <TableHead className="w-32">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.id}</TableCell>
                    <TableCell className="font-medium">{m.ten}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(m)}
                          title="Sửa"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(m)}
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

      <MucTieuFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
