"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface PostFormProps {
  forumId: string;
  categories: Category[];
  tags: Tag[];
  initialData?: {
    id: string;
    title: string;
    content: string;
    categoryId?: string;
    tagIds?: string[];
  };
}

export default function PostForm({
  forumId,
  categories,
  tags,
  initialData,
}: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tagIds || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        initialData ? `/api/posts?id=${initialData.id}` : "/api/posts",
        {
          method: initialData ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
            forumId,
            categoryId,
            tagIds: selectedTags,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save post");

      const post = await response.json();
      router.push(`/forums/${forumId}/posts/${post.id}`);
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="form-input"
          placeholder="Enter post title..."
        />
      </div>

      <div>
        <label htmlFor="category" className="form-label">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="form-input"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`tag ${
                selectedTags.includes(tag.id)
                  ? "bg-blue-800 text-white"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="content" className="form-label">
          Content
        </label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Post" : "Create Post"}
        </button>
      </div>
    </form>
  );
} 