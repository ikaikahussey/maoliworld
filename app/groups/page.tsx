import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupsManager from "@/app/components/GroupsManager";

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  const groups = await prisma.group.findMany({
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { role: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
        <p className="mt-1 text-gray-600">
          Join groups to share posts with a smaller audience. When you create a
          post you can choose to show it to all users or only to members of
          your groups.
        </p>
      </div>
      <GroupsManager
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          memberCount: g._count.members,
          isMember: g.members.length > 0,
        }))}
      />
    </div>
  );
}
