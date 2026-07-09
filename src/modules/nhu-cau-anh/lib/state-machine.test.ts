import { describe, expect, it } from 'vitest';
import { canTransition, getNextStates, isDeletable, isTerminal } from './state-machine';
import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';

const ALL_STATES: TrangThaiNhuCau[] = ['DA_DAT', 'FAIL', 'DA_NHAN'];

describe('state-machine', () => {
  describe('canTransition', () => {
    it('cho phép DA_DAT → DA_NHAN và DA_DAT → FAIL', () => {
      expect(canTransition('DA_DAT', 'DA_NHAN')).toBe(true);
      expect(canTransition('DA_DAT', 'FAIL')).toBe(true);
    });

    it('từ chối chuyển tiếp lệch workflow', () => {
      expect(canTransition('DA_NHAN', 'DA_DAT')).toBe(false);
      expect(canTransition('DA_NHAN', 'FAIL')).toBe(false);
      expect(canTransition('FAIL', 'DA_DAT')).toBe(false);
      expect(canTransition('FAIL', 'DA_NHAN')).toBe(false);
    });

    it('không cho quay lui trạng thái', () => {
      expect(canTransition('DA_NHAN', 'DA_DAT')).toBe(false);
      expect(canTransition('FAIL', 'DA_DAT')).toBe(false);
    });

    it('từ chối chuyển sang cùng trạng thái hiện tại', () => {
      for (const s of ALL_STATES) {
        expect(canTransition(s, s)).toBe(false);
      }
    });

    it('trạng thái terminal không chuyển đi được', () => {
      expect(canTransition('DA_NHAN', 'DA_DAT')).toBe(false);
      expect(canTransition('FAIL', 'DA_DAT')).toBe(false);
    });
  });

  describe('getNextStates', () => {
    it('DA_DAT trả về [DA_NHAN, FAIL]', () => {
      expect(getNextStates('DA_DAT')).toEqual(['DA_NHAN', 'FAIL']);
    });

    it('trạng thái terminal trả về mảng rỗng', () => {
      expect(getNextStates('DA_NHAN')).toEqual([]);
      expect(getNextStates('FAIL')).toEqual([]);
    });

    it('trả về mảng mới mỗi lần gọi (không share reference)', () => {
      const a = getNextStates('DA_DAT');
      const b = getNextStates('DA_DAT');
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('isTerminal', () => {
    it('trả true cho DA_NHAN, FAIL', () => {
      expect(isTerminal('DA_NHAN')).toBe(true);
      expect(isTerminal('FAIL')).toBe(true);
    });

    it('trả false cho DA_DAT', () => {
      expect(isTerminal('DA_DAT')).toBe(false);
    });
  });

  describe('isDeletable', () => {
    it('cho xóa khi DA_DAT, FAIL', () => {
      expect(isDeletable('DA_DAT')).toBe(true);
      expect(isDeletable('FAIL')).toBe(true);
    });

    it('không cho xóa khi DA_NHAN', () => {
      expect(isDeletable('DA_NHAN')).toBe(false);
    });
  });
});
