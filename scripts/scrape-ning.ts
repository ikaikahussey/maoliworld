import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface ScrapedPost {
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
  comments?: ScrapedComment[];
}

interface ScrapedComment {
  id: string;
  content: string;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
  replies?: ScrapedComment[];
}

async function scrapeNingContent() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'data', 'ning-export');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get the main forum page
    const response = await axios.get('https://maoliworld.ning.com/forum');
    const $ = cheerio.load(response.data);

    const posts: ScrapedPost[] = [];
    const postElements = $('.forum-post').toArray();

    // Process posts sequentially to avoid overwhelming the server
    for (const element of postElements) {
      const post = $(element);
      const postId = post.attr('data-post-id') || '';
      const title = post.find('.post-title').text().trim();
      const content = post.find('.post-content').html() || '';
      const authorName = post.find('.author-name').text().trim();
      const authorEmail = post.find('.author-email').text().trim();
      const createdAt = post.find('.post-date').attr('datetime') || '';
      const category = post.find('.post-category').text().trim();
      const tags = post.find('.post-tags .tag').map((_, tag) => $(tag).text().trim()).get();

      // Get comments for this post
      const comments = await scrapeComments(postId);

      posts.push({
        id: postId,
        title,
        content,
        author: {
          name: authorName,
          email: authorEmail,
        },
        createdAt,
        category,
        tags,
        comments,
      });

      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save the scraped data
    fs.writeFileSync(
      path.join(outputDir, 'posts.json'),
      JSON.stringify(posts, null, 2)
    );

    console.log(`Successfully scraped ${posts.length} posts`);
  } catch (error) {
    console.error('Error scraping Ning content:', error);
  }
}

async function scrapeComments(postId: string): Promise<ScrapedComment[]> {
  try {
    const response = await axios.get(`https://maoliworld.ning.com/forum/post/${postId}/comments`);
    const $ = cheerio.load(response.data);
    const comments: ScrapedComment[] = [];

    const commentElements = $('.comment').toArray();
    for (const element of commentElements) {
      const comment = $(element);
      const commentId = comment.attr('data-comment-id') || '';
      const content = comment.find('.comment-content').html() || '';
      const authorName = comment.find('.author-name').text().trim();
      const authorEmail = comment.find('.author-email').text().trim();
      const createdAt = comment.find('.comment-date').attr('datetime') || '';

      // Get replies for this comment
      const replies = await scrapeReplies(commentId);

      comments.push({
        id: commentId,
        content,
        author: {
          name: authorName,
          email: authorEmail,
        },
        createdAt,
        replies,
      });

      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return comments;
  } catch (error) {
    console.error(`Error scraping comments for post ${postId}:`, error);
    return [];
  }
}

async function scrapeReplies(commentId: string): Promise<ScrapedComment[]> {
  try {
    const response = await axios.get(`https://maoliworld.ning.com/forum/comment/${commentId}/replies`);
    const $ = cheerio.load(response.data);
    const replies: ScrapedComment[] = [];

    const replyElements = $('.reply').toArray();
    for (const element of replyElements) {
      const reply = $(element);
      const replyId = reply.attr('data-reply-id') || '';
      const content = reply.find('.reply-content').html() || '';
      const authorName = reply.find('.author-name').text().trim();
      const authorEmail = reply.find('.author-email').text().trim();
      const createdAt = reply.find('.reply-date').attr('datetime') || '';

      replies.push({
        id: replyId,
        content,
        author: {
          name: authorName,
          email: authorEmail,
        },
        createdAt,
      });

      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return replies;
  } catch (error) {
    console.error(`Error scraping replies for comment ${commentId}:`, error);
    return [];
  }
}

// Run the scraper
scrapeNingContent(); 