import { MajorDetailView } from "@/sections/majors/view/major-detail-view";

export default async function MajorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year } = await searchParams;
  return <MajorDetailView majorId={id} joinYearId={year ?? ""} />;
}
