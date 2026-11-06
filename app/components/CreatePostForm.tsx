"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import AudienceSelector, { GroupOption, Visibility } from "./AudienceSelector";

interface CreatePostFormProps {
  forumId: string;
  groups: GroupOption[];
}

export default function CreatePostForm({ forumId, groups }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          forumId,
          visibility,
          groupIds: visibility === "GROUPS" ? groupIds : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to create post");
      }

      const post = await response.json();
      router.push(`/forums/${forumId}/posts/${post.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create post."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter post title"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          Content
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Write your post content here..."
        />
      </div>

      <AudienceSelector
        groups={groups}
        visibility={visibility}
        selectedGroupIds={groupIds}
        onVisibilityChange={setVisibility}
        onSelectedGroupIdsChange={setGroupIds}
      />

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            isSubmitting || (visibility === "GROUPS" && groupIds.length === 0)
          }
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Post"}
        </button>
      </div>
    </form>
  );
} 