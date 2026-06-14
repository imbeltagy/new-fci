"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { createPost } from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import type { Post } from "@repo/common/types/post";

export function PostComposer({
  roomId,
  onCreated,
}: {
  roomId: string;
  onCreated: (post: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
  }

  async function submit() {
    if (!content.trim() && !image) return;
    setSubmitting(true);
    const res = await createPost(roomId, {
      content: content.trim(),
      image: image ?? undefined,
    });
    setSubmitting(false);
    if (!res.success || !res.data) {
      toast.error(res.message);
      return;
    }
    setContent("");
    clearImage();
    onCreated(res.data.post);
  }

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="Share something with the channel..."
        className="w-full resize-none bg-transparent text-sm outline-none"
      />

      {preview && (
        <div className="relative w-fit">
          <img src={preview} alt="preview" className="max-h-48 rounded-lg" />
          <button
            onClick={clearImage}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          aria-label="Add image"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={pickImage}
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={submitting || (!content.trim() && !image)}
        >
          {submitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}
