import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import CreatePostForm from "@/app/components/CreatePostForm";

export default async function NewPostPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const forum = await prisma.forum.findUnique({
    where: { id: params.id },
  });

  if (!forum) {
    redirect("/forums");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Post in {forum.name}</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <CreatePostForm forumId={forum.id} />
        </div>
      </div>
    </div>
  );
} 