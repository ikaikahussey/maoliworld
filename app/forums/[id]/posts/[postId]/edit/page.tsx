import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import EditPostForm from "@/app/components/EditPostForm";
import { getUserGroups } from "@/lib/visibility";

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
      groups: { select: { id: true, name: true } },
    },
  });

  if (!post) {
    redirect(`/forums/${params.id}`);
  }

  if (post.authorId !== session.user.id) {
    redirect(`/forums/${params.id}/posts/${params.postId}`);
  }

  const groups = await getUserGroups(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Post in {post.forum.name}</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <EditPostForm post={post} groups={groups} />
        </div>
      </div>
    </div>
  );
} 