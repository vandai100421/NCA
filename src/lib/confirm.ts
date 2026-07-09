'use client';

import { Modal } from 'antd';

export function confirmDelete(content: string, title = 'Xác nhận xóa'): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.confirm({
      title,
      content,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}
