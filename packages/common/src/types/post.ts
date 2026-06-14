import type { UserRole } from "./user";

export interface PostAuthor {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  imageUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  isStaff: boolean;
  isPinned: boolean;
}

export interface PostsPage {
  posts: Post[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PostComment {
  id: string;
  postId: string;
  parentId: string | null;
  deleted: boolean;
  content: string | null;
  createdAt: string;
  author: (PostAuthor & { isStaff: boolean }) | null;
}

export interface LikeResult {
  likeCount: number;
  likedByMe: boolean;
}

// ── Socket event payloads ───────────────────────────────────────────────────

export interface PostLikeEvent {
  postId: string;
  likeCount: number;
}

export interface PostCommentEvent {
  postId: string;
  commentCount: number;
}

export interface PostDeletedEvent {
  postId: string;
}
