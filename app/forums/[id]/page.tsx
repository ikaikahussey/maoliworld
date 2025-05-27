import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { notFound } from "next/navigation";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  _count: {
    comments: number;
  };
  category?: {
    id: string;
    name: string;
  };
  tags: {
    id: string;
    name: string;
  }[];
}

interface Forum {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  posts: Post[];
  categories: {
    id: string;
    name: string;
  }[];
}

interface ForumPageProps {
  params: {
    id: string;
  };
}

export default async function ForumPage({ params }: ForumPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const forum = await prisma.forum.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { name: "asc" },
      },
      posts: {
        include: {
          author: true,
          category: true,
          tags: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  }) as Forum | null;

  if (!forum) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{forum.name}</h1>
          <p className="text-gray-600 mt-1">{forum.description}</p>
        </div>
        <Link href={`/forums/${forum.id}/posts/new`} className="btn-primary">
          Create Post
        </Link>
      </div>

      {forum.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {forum.categories.map((category) => (
            <Link
              key={category.id}
              href={`/forums/${forum.id}?category=${category.id}`}
              className="tag bg-blue-100 text-blue-800"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6">
        {forum.posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <Link
                  href={`/forums/${forum.id}/posts/${post.id}`}
                  className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                >
                  {post.title}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.category && (
                    <span className="tag bg-blue-100 text-blue-800">
                      {post.category.name}
                    </span>
                  )}
                  {post.tags.map((tag) => (
                    <span key={tag.id} className="tag bg-gray-100 text-gray-800">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {post._count.comments} comments
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={post.author.image || "/default-avatar.png"}
                  alt={post.author.name || "User"}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600">
                  {post.author.name}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 