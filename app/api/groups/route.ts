import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups            -> all groups, with an `isMember` flag
// GET /api/groups?mine=true  -> only groups the current user belongs to
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const mine = new URL(request.url).searchParams.get("mine") === "true";

  const groups = await prisma.group.findMany({
    where: mine ? { members: { some: { userId } } } : undefined,
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { role: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    groups.map(({ members, ...g }) => ({
      ...g,
      isMember: members.length > 0,
      role: members[0]?.role ?? null,
    }))
  );
}

// POST /api/groups { name, description } -> creates a group; creator joins as admin
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await request.json();
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) {
    return NextResponse.json(
      { error: "Group name is required" },
      { status: 400 }
    );
  }

  try {
    const group = await prisma.group.create({
      data: {
        name: trimmed,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        creatorId: session.user.id,
        members: { create: { userId: session.user.id, role: "admin" } },
      },
    });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A group with that name already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
