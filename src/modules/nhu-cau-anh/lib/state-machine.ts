import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';

const TRANSITIONS: Record<TrangThaiNhuCau, TrangThaiNhuCau[]> = {
  CHO_DUYET: ['DA_DUYET', 'TU_CHOI'],
  DA_DUYET: ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_CHUP', 'DA_HUY'],
  DANG_CHUP: ['DA_CHUP', 'DA_HUY'],
  DA_CHUP: ['DA_TRA_ANH'],
  DA_TRA_ANH: [],
  TU_CHOI: [],
  DA_HUY: [],
};

export function canTransition(from: TrangThaiNhuCau, to: TrangThaiNhuCau): boolean {
  const allowed = TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

export function getNextStates(from: TrangThaiNhuCau): TrangThaiNhuCau[] {
  return [...(TRANSITIONS[from] ?? [])];
}

export function isTerminal(state: TrangThaiNhuCau): boolean {
  return (TRANSITIONS[state] ?? []).length === 0;
}

export function isDeletable(state: TrangThaiNhuCau): boolean {
  return state === 'CHO_DUYET' || state === 'TU_CHOI' || state === 'DA_HUY';
}
