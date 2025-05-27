import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { notFound } from "next/navigation";
import { CommentSection } from "../../../../components/CommentSection";
import { FediverseInteractions } from "../../../../components/FediverseInteractions";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
  replies: Comment[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
  comments: Comment[];
}

interface Forum {
  id: string;
  name: string;
  description: string;
}

interface Tag {
  id: string;
  name: string;
}

interface PostPageProps {
  params: {
    id: string;
    postId: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const session = await getServerSession(authOptions);
  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    include: {
      author: true,
      forum: true,
      category: true,
      tags: true,
      comments: {
        where: { parentId: null },
        include: {
          author: true,
          replies: {
            include: {
              author: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href={`/forums/${params.id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to {post.forum.name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{post.title}</h1>
        </div>
        {session?.user?.email === post.author.email && (
          <Link
            href={`/forums/${params.id}/posts/${params.postId}/edit`}
            className="btn-secondary"
          >
            Edit Post
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {post.category && (
          <span className="tag bg-blue-100 text-blue-800">
            {post.category.name}
          </span>
        )}
        {post.tags.map((tag: Tag) => (
          <span key={tag.id} className="tag bg-gray-100 text-gray-800">
            {tag.name}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={post.author.image || "/default-avatar.png"}
              alt={post.author.name || "User"}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                {post.author.name}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {post._count.comments} comments
          </div>
        </div>

        {post.activityPubId && (
          <FediverseInteractions
            postId={post.id}
            activityPubId={post.activityPubId}
            likeCount={post.likeCount}
            reblogCount={post.reblogCount}
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>
        <CommentSection
          postId={post.id}
          comments={post.comments}
          user={session?.user || null}
        />
      </div>
    </div>
  );
} 