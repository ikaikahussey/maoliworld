"use client";

import { useState } from 'react';
import { createActivity, sendActivity } from '@/lib/activitypub';

interface FediverseInteractionsProps {
  postId: string;
  activityPubId: string;
  likeCount: number;
  reblogCount: number;
}

export function FediverseInteractions({
  postId,
  activityPubId,
  likeCount,
  reblogCount,
}: FediverseInteractionsProps) {
  const [likes, setLikes] = useState(likeCount);
  const [reblogs, setReblogs] = useState(reblogCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isReblogged, setIsReblogged] = useState(false);

  const handleLike = async () => {
    try {
      const activity = createActivity('Like', activityPubId, ['https://www.w3.org/ns/activitystreams#Public']);
      const success = await sendActivity(activity, process.env.NEXT_PUBLIC_SITE_URL + '/api/activitypub/inbox');
      
      if (success) {
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReblog = async () => {
    try {
      const activity = createActivity('Announce', activityPubId, ['https://www.w3.org/ns/activitystreams#Public']);
      const success = await sendActivity(activity, process.env.NEXT_PUBLIC_SITE_URL + '/api/activitypub/inbox');
      
      if (success) {
        setReblogs(prev => prev + 1);
        setIsReblogged(true);
      }
    } catch (error) {
      console.error('Error reblogging post:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4 mt-4">
      <button
        onClick={handleLike}
        disabled={isLiked}
        className={`flex items-center space-x-1 text-sm ${
          isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill={isLiked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{likes}</span>
      </button>

      <button
        onClick={handleReblog}
        disabled={isReblogged}
        className={`flex items-center space-x-1 text-sm ${
          isReblogged ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill={isReblogged ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        <span>{reblogs}</span>
      </button>
    </div>
  );
} 