import { AssessmentDetailView } from "@/sections/assessments/assessment-detail-view";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssessmentDetailView assessmentId={id} />;
}
