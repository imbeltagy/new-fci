import { AdminPostDetailView } from "@/sections/rooms/admin-post-detail-view";

export default async function AdminPostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  return <AdminPostDetailView roomId={id} postId={postId} />;
}
