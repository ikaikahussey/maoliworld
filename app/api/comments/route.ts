import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canViewPost } from "@/lib/visibility";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { content, postId, parentId } = await request.json();

    if (!content || !postId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!(await canViewPost(postId, session.user.id))) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // If parentId is provided, verify that the parent comment exists and belongs to the same post
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { postId: true },
      });

      if (!parentComment) {
        return new NextResponse("Parent comment not found", { status: 404 });
      }

      if (parentComment.postId !== postId) {
        return new NextResponse("Parent comment does not belong to the specified post", { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: session.user.id,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return new NextResponse("Post ID is required", { status: 400 });
    }

    if (!(await canViewPost(postId, session.user.id))) {
      return new NextResponse("Post not found", { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing comment ID", { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 