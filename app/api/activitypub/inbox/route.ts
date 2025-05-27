import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySignature } from '@/lib/activitypub';

export async function POST(request: Request) {
  try {
    // Verify the request signature
    const signature = request.headers.get('signature');
    if (!signature) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const isValid = await verifySignature(request, signature);
    if (!isValid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Handle different activity types
    switch (body.type) {
      case 'Follow':
        await handleFollow(body);
        break;
      case 'Undo':
        if (body.object?.type === 'Follow') {
          await handleUnfollow(body);
        }
        break;
      case 'Create':
        if (body.object?.type === 'Note') {
          await handleNote(body);
        }
        break;
      case 'Announce':
        await handleAnnounce(body);
        break;
      case 'Like':
        await handleLike(body);
        break;
    }

    return new NextResponse('OK', { status: 202 });
  } catch (error) {
    console.error('Error processing inbox activity:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function handleFollow(activity: any) {
  const follower = activity.actor;
  await prisma.follower.create({
    data: {
      actorId: follower,
      inbox: activity.actor.inbox,
      sharedInbox: activity.actor.sharedInbox,
      name: activity.actor.name || activity.actor.preferredUsername,
      username: activity.actor.preferredUsername,
      domain: new URL(follower).hostname,
    },
  });
}

async function handleUnfollow(activity: any) {
  const follower = activity.actor;
  await prisma.follower.delete({
    where: {
      actorId: follower,
    },
  });
}

async function handleNote(activity: any) {
  const note = activity.object;
  await prisma.post.create({
    data: {
      title: note.name || 'Untitled',
      content: note.content,
      author: {
        connectOrCreate: {
          where: { email: activity.actor },
          create: {
            email: activity.actor,
            name: activity.actor.name || activity.actor.preferredUsername,
          },
        },
      },
      forum: {
        connect: {
          id: process.env.DEFAULT_FORUM_ID,
        },
      },
      activityPubId: note.id,
    },
  });
}

async function handleAnnounce(activity: any) {
  const post = await prisma.post.findFirst({
    where: { activityPubId: activity.object },
  });

  if (post) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        reblogCount: {
          increment: 1,
        },
      },
    });
  }
}

async function handleLike(activity: any) {
  const post = await prisma.post.findFirst({
    where: { activityPubId: activity.object },
  });

  if (post) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });
  }
} 