import type { Request, Response } from "express";

import type { StartConversationDto } from "./dto/request/start-conversation.dto";
import { ConversationsService } from "./conversations.service";

const svc = new ConversationsService();

export async function listConversations(req: Request, res: Response) {
  try {
    res.json({ conversations: await svc.listMine(req.user!.sub) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function startConversation(req: Request, res: Response) {
  try {
    const { userId } = req.body as StartConversationDto;
    res.status(201).json({ conversation: await svc.startConversation(req.user!.sub, userId) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getConversation(req: Request, res: Response) {
  try {
    const conversation = await svc.getConversation(req.params["id"] as string, req.user!.sub);
    res.json({ conversation });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const { page, limit } = req.query as Record<string, string | undefined>;
    const result = await svc.getMessages(
      req.params["id"] as string,
      req.user!.sub,
      Number(page) || -1,
      Math.min(Number(limit) || 20, 100),
    );
    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
