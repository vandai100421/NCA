import { describe, expect, it } from 'vitest';
import { canTransition, getNextStates, isDeletable, isTerminal } from './state-machine';
import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';

const ALL_STATES: TrangThaiNhuCau[] = [
  'CHO_DUYET',
  'DA_DUYET',
  'DA_PHAN_CONG',
  'DANG_CHUP',
  'DA_CHUP',
  'DA_TRA_ANH',
  'TU_CHOI',
  'DA_HUY',
];

describe('state-machine', () => {
  describe('canTransition', () => {
    it('cho phép các chuyển tiếp hợp lệ theo workflow', () => {
      expect(canTransition('CHO_DUYET', 'DA_DUYET')).toBe(true);
      expect(canTransition('CHO_DUYET', 'TU_CHOI')).toBe(true);
      expect(canTransition('DA_DUYET', 'DA_PHAN_CONG')).toBe(true);
      expect(canTransition('DA_DUYET', 'DA_HUY')).toBe(true);
      expect(canTransition('DA_PHAN_CONG', 'DANG_CHUP')).toBe(true);
      expect(canTransition('DA_PHAN_CONG', 'DA_HUY')).toBe(true);
      expect(canTransition('DANG_CHUP', 'DA_CHUP')).toBe(true);
      expect(canTransition('DANG_CHUP', 'DA_HUY')).toBe(true);
      expect(canTransition('DA_CHUP', 'DA_TRA_ANH')).toBe(true);
    });

    it('từ chối các chuyển tiếp lệch workflow', () => {
      expect(canTransition('CHO_DUYET', 'DANG_CHUP')).toBe(false);
      expect(canTransition('DA_DUYET', 'DA_CHUP')).toBe(false);
      expect(canTransition('DA_PHAN_CONG', 'DA_TRA_ANH')).toBe(false);
      expect(canTransition('DA_CHUP', 'TU_CHOI')).toBe(false);
    });

    it('không cho quay lui trạng thái', () => {
      expect(canTransition('DA_DUYET', 'CHO_DUYET')).toBe(false);
      expect(canTransition('DA_PHAN_CONG', 'DA_DUYET')).toBe(false);
      expect(canTransition('DANG_CHUP', 'DA_PHAN_CONG')).toBe(false);
      expect(canTransition('DA_CHUP', 'DANG_CHUP')).toBe(false);
      expect(canTransition('DA_TRA_ANH', 'DA_CHUP')).toBe(false);
    });

    it('từ chối chuyển sang cùng trạng thái hiện tại', () => {
      for (const s of ALL_STATES) {
        expect(canTransition(s, s)).toBe(false);
      }
    });

    it('trạng thái terminal không chuyển đi được', () => {
      expect(canTransition('DA_TRA_ANH', 'DA_DUYET')).toBe(false);
      expect(canTransition('TU_CHOI', 'CHO_DUYET')).toBe(false);
      expect(canTransition('DA_HUY', 'DA_DUYET')).toBe(false);
    });
  });

  describe('getNextStates', () => {
    it('trả về danh sách trạng thái kế tiếp hợp lệ', () => {
      expect(getNextStates('CHO_DUYET')).toEqual(['DA_DUYET', 'TU_CHOI']);
      expect(getNextStates('DA_DUYET')).toEqual(['DA_PHAN_CONG', 'DA_HUY']);
      expect(getNextStates('DA_PHAN_CONG')).toEqual(['DANG_CHUP', 'DA_HUY']);
      expect(getNextStates('DANG_CHUP')).toEqual(['DA_CHUP', 'DA_HUY']);
      expect(getNextStates('DA_CHUP')).toEqual(['DA_TRA_ANH']);
    });

    it('trạng thái terminal trả về mảng rỗng', () => {
      expect(getNextStates('DA_TRA_ANH')).toEqual([]);
      expect(getNextStates('TU_CHOI')).toEqual([]);
      expect(getNextStates('DA_HUY')).toEqual([]);
    });

    it('trả về mảng mới mỗi lần gọi (không share reference)', () => {
      const a = getNextStates('CHO_DUYET');
      const b = getNextStates('CHO_DUYET');
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('isTerminal', () => {
    it('trả true cho DA_TRA_ANH, TU_CHOI, DA_HUY', () => {
      expect(isTerminal('DA_TRA_ANH')).toBe(true);
      expect(isTerminal('TU_CHOI')).toBe(true);
      expect(isTerminal('DA_HUY')).toBe(true);
    });

    it('trả false cho các trạng thái đang xử lý', () => {
      expect(isTerminal('CHO_DUYET')).toBe(false);
      expect(isTerminal('DA_DUYET')).toBe(false);
      expect(isTerminal('DA_PHAN_CONG')).toBe(false);
      expect(isTerminal('DANG_CHUP')).toBe(false);
      expect(isTerminal('DA_CHUP')).toBe(false);
    });
  });

  describe('isDeletable', () => {
    it('cho xóa khi CHO_DUYET, TU_CHOI, DA_HUY', () => {
      expect(isDeletable('CHO_DUYET')).toBe(true);
      expect(isDeletable('TU_CHOI')).toBe(true);
      expect(isDeletable('DA_HUY')).toBe(true);
    });

    it('không cho xóa khi đang xử lý hoặc đã hoàn thành', () => {
      expect(isDeletable('DA_DUYET')).toBe(false);
      expect(isDeletable('DA_PHAN_CONG')).toBe(false);
      expect(isDeletable('DANG_CHUP')).toBe(false);
      expect(isDeletable('DA_CHUP')).toBe(false);
      expect(isDeletable('DA_TRA_ANH')).toBe(false);
    });
  });
});
