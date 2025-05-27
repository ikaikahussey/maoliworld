import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SearchForm } from "../components/SearchForm";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface SearchParams {
  query?: string;
  categoryId?: string;
  tag?: string;
  forumId?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
  tags: {
    id: string;
    name: string;
  }[];
  forum: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; tags?: string };
}) {
  const session = await getServerSession(authOptions);
  const query = searchParams.q || "";
  const category = searchParams.category || "";
  const tags = searchParams.tags ? searchParams.tags.split(",") : [];

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  let posts: Post[] = [];
  if (query || category || tags.length > 0) {
    posts = await prisma.post.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { content: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          category
            ? {
                category: {
                  name: { equals: category, mode: "insensitive" },
                },
              }
            : {},
          tags.length > 0
            ? {
                tags: {
                  some: {
                    name: { in: tags, mode: "insensitive" },
                  },
                },
              }
            : {},
        ],
      },
      include: {
        user: true,
        forum: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const allTags = await prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Search</h2>
            <SearchForm
              initialQuery={query}
              initialCategory={category}
              initialTags={tags}
              categories={categories}
              tags={allTags}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Search Results
            {query && ` for "${query}"`}
            {category && ` in ${categories.find((c: Category) => c.id === category)?.name}`}
            {tags.length > 0 && ` tagged with "${tags.join(", ")}"`}
          </h1>

          {posts.length === 0 ? (
            <p className="text-gray-500">No posts found matching your search criteria.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post: Post) => (
                <div
                  key={post.id}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {post.user.image ? (
                          <Image
                            src={post.user.image}
                            alt={post.user.name || "User avatar"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm text-gray-500">
                              {post.user.name?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {post.user.name || "Anonymous"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {post.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {post.category.name}
                          </span>
                        )}
                        {post.tags.map((tag: { id: string; name: string }) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      href={`/forums/${post.forum.id}/posts/${post.id}`}
                      className="block"
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {post.title}
                      </h2>
                      <div
                        className="text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    </Link>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {post._count.comments} comments
                        </span>
                      </div>
                      <Link
                        href={`/forums/${post.forum.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        {post.forum.name}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 