"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import RichTextEditor from "./RichTextEditor";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: User;
  replies: Comment[];
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  user: User | null;
}

export function CommentSection({ postId, comments, user }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          postId,
          parentId: replyingTo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      setNewComment("");
      setReplyingTo(null);
      window.location.reload();
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const CommentComponent = ({ comment }: { comment: Comment }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <img
            src={comment.author.image || "/default-avatar.png"}
            alt={comment.author.name || "User"}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <span className="font-medium text-gray-900">
              {comment.author.name || "Anonymous"}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        {user && (
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
        )}
      </div>
      <div
        className="mt-2 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: comment.content }}
      />
      {replyingTo === comment.id && (
        <form onSubmit={handleSubmit} className="mt-4">
          <RichTextEditor
            content={newComment}
            onChange={setNewComment}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Post Reply
            </button>
          </div>
        </form>
      )}
      {comment.replies.length > 0 && (
        <div className="mt-4 ml-8 space-y-4">
          {comment.replies.map((reply) => (
            <CommentComponent key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <RichTextEditor
            content={newComment}
            onChange={setNewComment}
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <p className="text-gray-500">
          Please{" "}
          <a href="/auth/signin" className="text-blue-600 hover:text-blue-800">
            sign in
          </a>{" "}
          to post comments.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentComponent key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
} 