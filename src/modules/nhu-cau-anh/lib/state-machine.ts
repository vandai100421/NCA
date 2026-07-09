import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';

const TRANSITIONS: Record<TrangThaiNhuCau, TrangThaiNhuCau[]> = {
  DA_DAT: ['DA_NHAN', 'DA_HUY'],
  DA_NHAN: [],
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
  return state === 'DA_DAT' || state === 'DA_HUY';
}
