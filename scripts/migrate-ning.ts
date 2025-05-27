import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse } from 'date-fns';

const prisma = new PrismaClient();

interface NingPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
  category?: string;
  tags?: string[];
  comments?: NingComment[];
}

interface NingComment {
  id: string;
  content: string;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
  replies?: NingComment[];
}

async function migrateNingContent() {
  try {
    // 1. Create default forum if it doesn't exist
    const defaultForum = await prisma.forum.upsert({
      where: { id: process.env.DEFAULT_FORUM_ID || 'default' },
      update: {},
      create: {
        id: process.env.DEFAULT_FORUM_ID || 'default',
        name: 'Maoli World',
        description: 'A community forum for sharing and discussing Hawaiian culture',
      },
    });

    // 2. Create default category if it doesn't exist
    const defaultCategory = await prisma.category.upsert({
      where: {
        forumId_name: {
          forumId: defaultForum.id,
          name: 'General',
        },
      },
      update: {},
      create: {
        name: 'General',
        description: 'General discussions',
        forumId: defaultForum.id,
      },
    });

    // 3. Fetch and parse Ning content
    const ningContent = await fetchNingContent();
    
    // 4. Process each post
    for (const post of ningContent) {
      // Create or find author
      const author = await prisma.user.upsert({
        where: { email: post.author.email },
        update: {},
        create: {
          email: post.author.email,
          name: post.author.name,
        },
      });

      // Create post
      const newPost = await prisma.post.create({
        data: {
          title: post.title,
          content: post.content,
          authorId: author.id,
          forumId: defaultForum.id,
          categoryId: defaultCategory.id,
          createdAt: parse(post.createdAt, 'yyyy-MM-dd HH:mm:ss', new Date()),
          tags: {
            connectOrCreate: post.tags?.map(tag => ({
              where: { name: tag },
              create: { name: tag },
            })) || [],
          },
        },
      });

      // Process comments
      if (post.comments) {
        await processComments(post.comments, newPost.id, author.id);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function processComments(comments: NingComment[], postId: string, authorId: string) {
  for (const comment of comments) {
    // Create or find comment author
    const commentAuthor = await prisma.user.upsert({
      where: { email: comment.author.email },
      update: {},
      create: {
        email: comment.author.email,
        name: comment.author.name,
      },
    });

    // Create comment
    const newComment = await prisma.comment.create({
      data: {
        content: comment.content,
        userId: commentAuthor.id,
        postId: postId,
        createdAt: parse(comment.createdAt, 'yyyy-MM-dd HH:mm:ss', new Date()),
      },
    });

    // Process replies
    if (comment.replies) {
      await processReplies(comment.replies, postId, newComment.id, commentAuthor.id);
    }
  }
}

async function processReplies(replies: NingComment[], postId: string, parentId: string, authorId: string) {
  for (const reply of replies) {
    // Create or find reply author
    const replyAuthor = await prisma.user.upsert({
      where: { email: reply.author.email },
      update: {},
      create: {
        email: reply.author.email,
        name: reply.author.name,
      },
    });

    // Create reply
    await prisma.comment.create({
      data: {
        content: reply.content,
        userId: replyAuthor.id,
        postId: postId,
        parentId: parentId,
        createdAt: parse(reply.createdAt, 'yyyy-MM-dd HH:mm:ss', new Date()),
      },
    });
  }
}

async function fetchNingContent(): Promise<NingPost[]> {
  // This is a placeholder - you'll need to implement the actual Ning API calls
  // or web scraping logic based on your Ning site's structure
  try {
    const response = await axios.get('https://maoliworld.ning.com/api/posts');
    return response.data;
  } catch (error) {
    console.error('Error fetching Ning content:', error);
    return [];
  }
}

// Run the migration
migrateNingContent(); 