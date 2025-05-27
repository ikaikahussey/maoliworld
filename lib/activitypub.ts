import crypto from 'crypto';
import { prisma } from './prisma';

export async function verifySignature(request: Request, signature: string): Promise<boolean> {
  try {
    const signatureParts = signature.split(',');
    const signatureMap = new Map(
      signatureParts.map(part => {
        const [key, value] = part.split('=');
        return [key, value.replace(/"/g, '')];
      })
    );

    const keyId = signatureMap.get('keyId');
    if (!keyId) return false;

    const headers = signatureMap.get('headers')?.split(' ');
    if (!headers) return false;

    const signatureValue = signatureMap.get('signature');
    if (!signatureValue) return false;

    // Get the actor's public key
    const actor = await fetch(keyId).then(res => res.json());
    const publicKey = actor.publicKey.publicKeyPem;

    // Reconstruct the signature string
    const signatureString = headers
      .map(header => {
        if (header === '(request-target)') {
          return '(request-target): post /api/activitypub/inbox';
        }
        return `${header}: ${request.headers.get(header)}`;
      })
      .join('\n');

    // Verify the signature
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(signatureString);
    return verifier.verify(publicKey, signatureValue, 'base64');
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

export async function sendActivity(activity: any, to: string) {
  try {
    const followers = await prisma.follower.findMany({
      where: {
        OR: [
          { inbox: to },
          { sharedInbox: to }
        ]
      }
    });

    const privateKey = process.env.ACTIVITYPUB_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ACTIVITYPUB_PRIVATE_KEY not set');
    }

    const date = new Date().toUTCString();
    const digest = crypto
      .createHash('sha256')
      .update(JSON.stringify(activity))
      .digest('base64');

    const signatureString = [
      '(request-target): post /api/activitypub/inbox',
      `host: ${new URL(to).host}`,
      'date: ' + date,
      'digest: SHA-256=' + digest,
      'content-type: application/activity+json'
    ].join('\n');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureString);
    const signature = signer.sign(privateKey, 'base64');

    const signatureHeader = [
      'keyId="' + process.env.NEXT_PUBLIC_SITE_URL + '/api/activitypub/actor#main-key"',
      'algorithm="rsa-sha256"',
      'headers="(request-target) host date digest content-type"',
      'signature="' + signature + '"'
    ].join(',');

    const response = await fetch(to, {
      method: 'POST',
      headers: {
        'Host': new URL(to).host,
        'Date': date,
        'Digest': 'SHA-256=' + digest,
        'Content-Type': 'application/activity+json',
        'Signature': signatureHeader
      },
      body: JSON.stringify(activity)
    });

    if (!response.ok) {
      throw new Error(`Failed to send activity: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending activity:', error);
    return false;
  }
}

export function createActivity(type: string, object: any, to: string[]) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/activities/${crypto.randomUUID()}`,
    type,
    actor: `${process.env.NEXT_PUBLIC_SITE_URL}/api/activitypub/actor`,
    to,
    object
  };
} 