import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import EditPostForm from "@/app/components/EditPostForm";

export default async function EditPostPage({
  params,
}: {
  params: { id: string; postId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    include: {
      forum: true,
    },
  });

  if (!post) {
    redirect(`/forums/${params.id}`);
  }

  if (post.userId !== session.user.id) {
    redirect(`/forums/${params.id}/posts/${params.postId}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Post in {post.forum.name}</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <EditPostForm post={post} />
        </div>
      </div>
    </div>
  );
} 