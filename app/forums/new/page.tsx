import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateForumForm from "@/app/components/CreateForumForm";

export default async function NewForumPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Forum</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <CreateForumForm />
        </div>
      </div>
    </div>
  );
} 