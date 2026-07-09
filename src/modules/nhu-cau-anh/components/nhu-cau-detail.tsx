'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Select,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  LOAI_ANH_CHUP_LABELS,
  LOAI_NHU_CAU_LABELS,
  NGUON_LOAI_LABELS,
  TRANG_THAI_NHU_CAU_LABELS,
  TRANG_THAI_TAG_COLOR,
} from '@/modules/shared/constants';
import type { TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';
import { useNhuCauDetail, useTransitionNhuCau } from '../hooks/use-nhu-cau-anh';
import { getNextStates } from '../lib/state-machine';

const { Title, Paragraph, Text } = Typography;

const formatDate = (d: Date | string | null | undefined): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function NhuCauDetail() {
  const { notification } = App.useApp();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const { data, isLoading, error, refetch } = useNhuCauDetail(id);
  const transitionMut = useTransitionNhuCau();

  const [nextState, setNextState] = useState<TrangThaiNhuCau | undefined>(undefined);
  const [ghiChu, setGhiChu] = useState('');

  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) {
    return <EmptyState title="Không tìm thấy nhu cầu" description="Nhu cầu ảnh không tồn tại." />;
  }

  const nextStates = getNextStates(data.trangThai);

  const handleTransition = async () => {
    if (!nextState) {
      notification.warning({ message: 'Vui lòng chọn trạng thái mới' });
      return;
    }
    try {
      await transitionMut.mutateAsync({
        id,
        input: {
          trangThaiMoi: nextState,
          ghiChu: ghiChu || undefined,
        },
      });
      notification.success({
        message: `Đã chuyển sang "${TRANG_THAI_NHU_CAU_LABELS[nextState]}"`,
      });
      setNextState(undefined);
      setGhiChu('');
    } catch (e) {
      notification.error({
        message: 'Lỗi chuyển trạng thái',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Flex align="center" gap={12}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Nhu cầu ảnh #{data.id}
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Tạo lúc {formatDate(data.thoiGianDat)}
          </Paragraph>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Tag color={TRANG_THAI_TAG_COLOR[data.trangThai]}>
            {TRANG_THAI_NHU_CAU_LABELS[data.trangThai]}
          </Tag>
        </div>
      </Flex>

      <Flex gap={24} vertical={false} wrap>
        <Card title="Thông tin nhu cầu" style={{ flex: 2, minWidth: 320 }}>
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Mục tiêu">{data.mucTieu.ten}</Descriptions.Item>
            <Descriptions.Item label="Nguồn">
              <Flex gap={6} align="center" wrap>
                <Tag>
                  {NGUON_LOAI_LABELS[data.nguon.nguon as keyof typeof NGUON_LOAI_LABELS] ??
                    data.nguon.nguon}
                </Tag>
                {data.nguon.tenNguon}
              </Flex>
            </Descriptions.Item>
            <Descriptions.Item label="Loại nhu cầu">
              <Tag>{LOAI_NHU_CAU_LABELS[data.loaiNhuCau]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại ảnh chụp">
              <Tag>{LOAI_ANH_CHUP_LABELS[data.loaiAnhChup]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Địa bàn">{data.diaBan}</Descriptions.Item>
            <Descriptions.Item label="Độ phân giải">{data.doPhanGiai}</Descriptions.Item>
            <Descriptions.Item label="Tọa độ">
              {data.toaDoX}, {data.toaDoY}
            </Descriptions.Item>
            {data.loaiNhuCau === 'CO_DINH' ? (
              <Descriptions.Item label="Thời gian chụp">
                {formatDate(data.thoiGianChup)}
              </Descriptions.Item>
            ) : (
              <>
                <Descriptions.Item label="Mong muốn chụp từ">
                  {formatDate(data.thoiGianMongMuonTu)}
                </Descriptions.Item>
                <Descriptions.Item label="Mong muốn chụp đến">
                  {formatDate(data.thoiGianMongMuonDen)}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Thời gian trả ảnh">
              {formatDate(data.thoiGianTra)}
            </Descriptions.Item>
            {data.moTa && (
              <Descriptions.Item label="Mô tả" span={2}>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{data.moTa}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title="Chuyển trạng thái" style={{ flex: 1, minWidth: 280 }}>
          {nextStates.length === 0 ? (
            <Text type="secondary">
              Trạng thái hiện tại là trạng thái cuối, không thể chuyển tiếp.
            </Text>
          ) : (
            <Flex vertical gap={12}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Trạng thái mới
                </Text>
                <Select
                  value={nextState}
                  onChange={(v) => setNextState(v)}
                  placeholder="Chọn trạng thái"
                  style={{ width: '100%', marginTop: 4 }}
                  options={nextStates.map((s) => ({
                    value: s,
                    label: TRANG_THAI_NHU_CAU_LABELS[s],
                  }))}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ghi chú (tuỳ chọn)
                </Text>
                <Input.TextArea
                  rows={3}
                  placeholder="Lý do chuyển trạng thái..."
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  style={{ marginTop: 4 }}
                />
              </div>
              <Button
                type="primary"
                block
                onClick={() => void handleTransition()}
                loading={transitionMut.isPending}
                disabled={!nextState}
              >
                Chuyển trạng thái
              </Button>
            </Flex>
          )}
        </Card>
      </Flex>

      <Card
        title={
          <Flex align="center" gap={8}>
            <ClockCircleOutlined />
            <span>Lịch sử trạng thái</span>
          </Flex>
        }
      >
        {data.lichSu.length === 0 ? (
          <Text type="secondary">Chưa có lịch sử.</Text>
        ) : (
          <Timeline
            items={data.lichSu.map((entry) => ({
              color: TRANG_THAI_TAG_COLOR[entry.trangThaiMoi] === 'default' ? 'gray' : 'blue',
              children: (
                <Flex gap={8} align="center" wrap>
                  {entry.trangThaiCu ? (
                    <>
                      <Tag color={TRANG_THAI_TAG_COLOR[entry.trangThaiCu]}>
                        {TRANG_THAI_NHU_CAU_LABELS[entry.trangThaiCu]}
                      </Tag>
                      <Text type="secondary">→</Text>
                    </>
                  ) : null}
                  <Tag color={TRANG_THAI_TAG_COLOR[entry.trangThaiMoi]}>
                    {TRANG_THAI_NHU_CAU_LABELS[entry.trangThaiMoi]}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(entry.thoiGian)}
                  </Text>
                  {entry.ghiChu && (
                    <Text type="secondary" style={{ fontSize: 12, width: '100%' }}>
                      {entry.ghiChu}
                    </Text>
                  )}
                </Flex>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
