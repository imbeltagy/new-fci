import { RoomChatView } from "@/sections/community/room-chat-view";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomChatView roomId={roomId} />;
}
