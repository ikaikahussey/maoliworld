import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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
}

interface Forum {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  _count: {
    posts: number;
  };
  posts: Post[];
}

export default async function ForumsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const forums = await prisma.forum.findMany({
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
      posts: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: true,
        },
      },
    },
  }) as Forum[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Forums</h1>
        {session && (
          <Link href="/forums/new" className="btn-primary">
            Create Forum
          </Link>
        )}
      </div>

      <div className="grid gap-6">
        {forums.map((forum) => (
          <div
            key={forum.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <Link
                  href={`/forums/${forum.id}`}
                  className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                >
                  {forum.name}
                </Link>
                <p className="text-gray-600 mt-1">{forum.description}</p>
              </div>
              <div className="text-sm text-gray-500">
                {forum._count.posts} posts
              </div>
            </div>

            {forum.posts[0] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img
                      src={forum.posts[0].author.image || "/default-avatar.png"}
                      alt={forum.posts[0].author.name || "User"}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {forum.posts[0].author.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(forum.posts[0].createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <Link
                  href={`/forums/${forum.id}/posts/${forum.posts[0].id}`}
                  className="mt-2 text-sm text-gray-900 hover:text-blue-600 line-clamp-2"
                >
                  {forum.posts[0].title}
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 