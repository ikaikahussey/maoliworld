import { Prisma, PostVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export { PostVisibility };

/**
 * Prisma `where` fragment restricting posts to those the given user may see:
 * public posts, the user's own posts, and group posts shared with any group
 * the user belongs to. Anonymous viewers see public posts only.
 */
export function visiblePostsWhere(
  userId: string | null | undefined
): Prisma.PostWhereInput {
  if (!userId) {
    return { visibility: PostVisibility.PUBLIC };
  }
  return {
    OR: [
      { visibility: PostVisibility.PUBLIC },
      { authorId: userId },
      { groups: { some: { members: { some: { userId } } } } },
    ],
  };
}

/** Returns true if the user may view the post with the given id. */
export async function canViewPost(
  postId: string,
  userId: string | null | undefined
): Promise<boolean> {
  const count = await prisma.post.count({
    where: { AND: [{ id: postId }, visiblePostsWhere(userId)] },
  });
  return count > 0;
}

export type AudienceInput = {
  visibility?: unknown;
  groupIds?: unknown;
};

export type ResolvedAudience =
  | { ok: true; visibility: PostVisibility; groupIds: string[] }
  | { ok: false; error: string };

/**
 * Validates the audience a user picked for a post. Group posts must name at
 * least one group, and the author must be a member of every group named.
 */
export async function resolveAudience(
  userId: string,
  input: AudienceInput
): Promise<ResolvedAudience> {
  const visibility =
    input.visibility === undefined || input.visibility === null
      ? PostVisibility.PUBLIC
      : input.visibility;

  if (visibility === PostVisibility.PUBLIC) {
    return { ok: true, visibility: PostVisibility.PUBLIC, groupIds: [] };
  }
  if (visibility !== PostVisibility.GROUPS) {
    return { ok: false, error: "Visibility must be PUBLIC or GROUPS" };
  }

  if (
    !Array.isArray(input.groupIds) ||
    !input.groupIds.every((id) => typeof id === "string")
  ) {
    return { ok: false, error: "groupIds must be an array of group IDs" };
  }
  const groupIds = Array.from(new Set(input.groupIds as string[]));
  if (groupIds.length === 0) {
    return { ok: false, error: "Select at least one group" };
  }

  const memberships = await prisma.groupMember.count({
    where: { userId, groupId: { in: groupIds } },
  });
  if (memberships !== groupIds.length) {
    return {
      ok: false,
      error: "You can only post to groups you are a member of",
    };
  }

  return { ok: true, visibility: PostVisibility.GROUPS, groupIds };
}

/** Groups the user belongs to, for populating the audience picker. */
export function getUserGroups(userId: string) {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
