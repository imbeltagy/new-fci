import { RoomFeedView } from "@/sections/community/room-feed-view";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomFeedView roomId={roomId} />;
}
