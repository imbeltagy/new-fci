import { PostDetailView } from "@/sections/community/post-detail-view";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ roomId: string; postId: string }>;
}) {
  const { roomId, postId } = await params;
  return <PostDetailView roomId={roomId} postId={postId} />;
}
