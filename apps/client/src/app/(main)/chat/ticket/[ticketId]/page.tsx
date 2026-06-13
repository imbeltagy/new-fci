import { TicketChatView } from "@/sections/chat/ticket-chat-view";

export default async function TicketChatPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <TicketChatView ticketId={ticketId} />;
}
