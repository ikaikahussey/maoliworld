"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface SearchFormProps {
  initialQuery?: string;
  initialCategory?: string;
  initialTags?: string[];
  categories: Category[];
  tags: Tag[];
}

export function SearchForm({
  initialQuery = "",
  initialCategory = "",
  initialTags = [],
  categories,
  tags,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (query) searchParams.set("q", query);
    if (category) searchParams.set("category", category);
    if (selectedTags.length > 0) searchParams.set("tags", selectedTags.join(","));
    router.push(`/search?${searchParams.toString()}`);
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
        <label htmlFor="query" className="form-label">
          Search Query
        </label>
        <input
          type="text"
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="form-input"
          placeholder="Search posts..."
        />
      </div>

      <div>
        <label htmlFor="category" className="form-label">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input"
        >
          <option value="">All Categories</option>
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

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          Search
        </button>
      </div>
    </form>
  );
} 