'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  NhuCauAnhDetail,
  NhuCauListResult,
  NhuCauListQuery,
} from '../api/nhu-cau-anh-service';
import type {
  CreateNhuCauInput,
  TransitionInput,
  UpdateNhuCauInput,
} from '../schema/nhu-cau-anh-schema';

const KEY = ['nhu-cau-anh'] as const;
const KEY_DETAIL = ['nhu-cau-anh', 'detail'] as const;

export function useNhuCauList(query: NhuCauListQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.trangThai) params.set('trangThai', query.trangThai);
  if (query.nguonId) params.set('nguonId', String(query.nguonId));
  if (query.mucTieuId) params.set('mucTieuId', String(query.mucTieuId));
  if (query.loaiNhuCau) params.set('loaiNhuCau', query.loaiNhuCau);
  if (query.loaiAnhChup) params.set('loaiAnhChup', query.loaiAnhChup);
  if (query.search) params.set('search', query.search);

  return useQuery({
    queryKey: [...KEY, 'list', query] as const,
    queryFn: () => api.get<NhuCauListResult>(`/api/nhu-cau-anh?${params.toString()}`),
    placeholderData: (prev) => prev,
  });
}

export function useNhuCauDetail(id: number) {
  return useQuery({
    queryKey: [...KEY_DETAIL, id] as const,
    queryFn: () => api.get<NhuCauAnhDetail>(`/api/nhu-cau-anh/${id}`),
    enabled: id > 0,
  });
}

export function useCreateNhuCau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNhuCauInput) => api.post<NhuCauAnhDetail>('/api/nhu-cau-anh', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpdateNhuCau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateNhuCauInput }) =>
      api.put<NhuCauAnhDetail>(`/api/nhu-cau-anh/${id}`, input),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.setQueryData([...KEY_DETAIL, vars.id], data);
    },
  });
}

export function useTransitionNhuCau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TransitionInput }) =>
      api.post<NhuCauAnhDetail>(`/api/nhu-cau-anh/${id}/transition`, input),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.setQueryData([...KEY_DETAIL, vars.id], data);
    },
  });
}

export function useDeleteNhuCau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/nhu-cau-anh/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
