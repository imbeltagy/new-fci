import { AdminRoomFeedView } from "@/sections/rooms/admin-room-feed-view";

export default async function AdminRoomFeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminRoomFeedView roomId={id} />;
}
