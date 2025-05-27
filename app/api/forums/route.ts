import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Forum name is required" },
        { status: 400 }
      );
    }

    const forum = await prisma.forum.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(forum);
  } catch (error) {
    console.error("Error creating forum:", error);
    return NextResponse.json(
      { error: "Failed to create forum" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const forums = await prisma.forum.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(forums);
  } catch (error) {
    console.error("Error fetching forums:", error);
    return NextResponse.json(
      { error: "Failed to fetch forums" },
      { status: 500 }
    );
  }
} 