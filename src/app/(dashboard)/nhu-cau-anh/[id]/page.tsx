import { NhuCauDetail } from '@/modules/nhu-cau-anh/components/nhu-cau-detail';

export default async function Page({ params }: PageProps<'/nhu-cau-anh/[id]'>) {
  await params;
  return <NhuCauDetail />;
}
