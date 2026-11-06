import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAudience } from "@/lib/visibility";

const postInclude = {
  author: { select: { id: true, name: true, image: true } },
  groups: { select: { id: true, name: true } },
} as const;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, forumId, visibility, groupIds } =
      await request.json();

    if (!title || !content || !forumId) {
      return NextResponse.json(
        { error: "Title, content, and forum ID are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const audience = await resolveAudience(user.id, { visibility, groupIds });
    if (!audience.ok) {
      return NextResponse.json({ error: audience.error }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        forumId,
        authorId: user.id,
        visibility: audience.visibility,
        groups: { connect: audience.groupIds.map((id) => ({ id })) },
      },
      include: postInclude,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, content, visibility, groupIds } = await request.json();

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: "Post ID, title, and content are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own posts" },
        { status: 403 }
      );
    }

    // Audience is only changed when the client sends it.
    let audienceData = {};
    if (visibility !== undefined) {
      const audience = await resolveAudience(user.id, {
        visibility,
        groupIds,
      });
      if (!audience.ok) {
        return NextResponse.json({ error: audience.error }, { status: 400 });
      }
      audienceData = {
        visibility: audience.visibility,
        groups: { set: audience.groupIds.map((gid) => ({ id: gid })) },
      };
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        ...audienceData,
      },
      include: postInclude,
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
} 