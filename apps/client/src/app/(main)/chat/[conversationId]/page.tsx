import { DmChatView } from "@/sections/chat/dm-chat-view";

export default async function DmChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <DmChatView conversationId={conversationId} />;
}
