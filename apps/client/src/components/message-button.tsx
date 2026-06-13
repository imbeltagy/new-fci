"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { startConversation } from "@repo/common/actions/conversations.action";
import { Button } from "@repo/common/components/ui/button";

/** Opens (or reopens) a 1:1 chat with the given user and navigates to it. */
export function MessageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await startConversation(userId);
    setLoading(false);
    if (!res.success || !res.data) {
      toast.error(res.message);
      return;
    }
    router.push(`/chat/${res.data.conversation.id}`);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={handleClick}
      disabled={loading}
      title="Message"
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
}
