import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// POST: join the group
export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
    create: { userId: session.user.id, groupId: group.id },
    update: {},
  });
  return NextResponse.json({ success: true });
}

// DELETE: leave the group
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.groupMember.deleteMany({
    where: { userId: session.user.id, groupId: params.id },
  });
  return NextResponse.json({ success: true });
}
