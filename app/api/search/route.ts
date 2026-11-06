import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { visiblePostsWhere } from "@/lib/visibility";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const categoryId = searchParams.get("categoryId");
    const tag = searchParams.get("tag");
    const forumId = searchParams.get("forumId");

    if (!query && !categoryId && !tag) {
      return new NextResponse("Search query, category, or tag is required", { status: 400 });
    }

    const posts = await prisma.post.findMany({
      where: {
        AND: [
          visiblePostsWhere(session.user.id),
          forumId ? { forumId } : {},
          categoryId ? { categoryId } : {},
          tag ? {
            tags: {
              some: {
                name: tag,
              },
            },
          } : {},
          query ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          } : {},
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        forum: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error searching posts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 