import { NextResponse } from 'next/server';

export async function GET() {
  const actor = {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    "id": `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/actor`,
    "type": "Application",
    "name": "Maoli World",
    "preferredUsername": "maoliworld",
    "summary": "A community forum for sharing and discussing Hawaiian culture",
    "inbox": `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/inbox`,
    "outbox": `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/outbox`,
    "followers": `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/followers`,
    "following": `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/following`,
    "url": process.env.NEXT_PUBLIC_SITE_URL,
    "publicKey": {
      "id": `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/actor#main-key`,
      "owner": `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/actor`,
      "publicKeyPem": process.env.ACTIVITYPUB_PUBLIC_KEY
    }
  };

  return NextResponse.json(actor, {
    headers: {
      'Content-Type': 'application/activity+json'
    }
  });
} 