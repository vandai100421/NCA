'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Flex, Form, Input, Modal } from 'antd';
import { useCreateMucTieu, useUpdateMucTieu } from '../hooks/use-muc-tieu';
import { createMucTieuSchema, type CreateMucTieuInput } from '../schema/muc-tieu-schema';
import type { MucTieu } from '@/infrastructure/prisma/generated/client';

interface MucTieuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: MucTieu | null;
}

export function MucTieuFormDialog({ open, onOpenChange, editing }: MucTieuFormDialogProps) {
  const { notification } = App.useApp();
  const isEdit = Boolean(editing);
  const createMut = useCreateMucTieu();
  const updateMut = useUpdateMucTieu();

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateMucTieuInput>({
    resolver: zodResolver(createMucTieuSchema),
    defaultValues: { ten: editing?.ten ?? '' },
  });

  const tenValue = useWatch({ control, name: 'ten' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && editing) {
        await updateMut.mutateAsync({ id: editing.id, input: values });
        notification.success({ title: 'Đã cập nhật mục tiêu' });
      } else {
        await createMut.mutateAsync(values);
        notification.success({ title: 'Đã tạo mục tiêu mới' });
      }
      onOpenChange(false);
    } catch (e) {
      notification.error({
        message: 'Lỗi không xác định',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  });

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <Modal
      title={isEdit ? 'Sửa mục tiêu' : 'Tạo mục tiêu mới'}
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      destroyOnHidden
    >
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <Form layout="vertical" component={false}>
          <Form.Item
            label="Tên mục tiêu"
            validateStatus={errors.ten ? 'error' : undefined}
            help={errors.ten?.message}
          >
            <Input
              value={tenValue}
              onChange={(e) => setValue('ten', e.target.value)}
              placeholder="VD: Khu công nghiệp Bắc Thăng Long"
            />
          </Form.Item>
          <Flex justify="end" gap="small">
            <Button onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={pending}>
              Lưu
            </Button>
          </Flex>
        </Form>
      </form>
    </Modal>
  );
}
