import { AdminAssessmentDetailView } from "@/sections/assessments/admin-assessment-detail-view";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminAssessmentDetailView assessmentId={id} />;
}
