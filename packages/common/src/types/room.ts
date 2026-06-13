export type RoomType = "community" | "major_channel" | "subject_channel";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  joinYearId: string | null;
  majorId: string | null;
  subjectId: string | null;
  joinYear: { id: string; year: number } | null;
  major: { id: string; name: string; code: string } | null;
  subject: { id: string; name: string; code: string } | null;
  createdAt: string;
  updatedAt: string;
  /** Present only on the "my rooms" listing. */
  unread?: number;
}

export interface CreateRoomBody {
  name: string;
  type: RoomType;
  joinYearId?: string;
  majorId?: string;
  subjectId?: string;
}

export interface RoomMute {
  id: string;
  roomId: string;
  userId: string;
  mutedUntil: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}
