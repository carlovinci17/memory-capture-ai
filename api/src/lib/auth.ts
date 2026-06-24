import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { getPrincipal } from './account';
import { isCosmosConfigured } from './cosmos';
import { checkApproval } from './users';
import { json } from './http';

export type ApprovedAccount = { accountId: string };

/**
 * Returns the authenticated+approved account, or an HttpResponseInit to return directly.
 * Discriminate with: if (!('accountId' in result)) return result;
 */
export async function requireApproved(req: HttpRequest): Promise<ApprovedAccount | HttpResponseInit> {
  const principal = getPrincipal(req);
  if (!principal) return json(401, { error: 'unauthenticated', message: 'Sign in required.' });

  if (!isCosmosConfigured()) {
    // Dev/demo mode without Cosmos — skip approval check
    return { accountId: principal.userId };
  }

  const status = await checkApproval(principal.userId, principal.userDetails ?? '', principal.name);

  if (status === 'pending') {
    return json(403, {
      error: 'pending_approval',
      message: 'Your account is pending approval. You will receive an email when approved.',
    });
  }
  if (status === 'denied') {
    return json(403, {
      error: 'access_denied',
      message: 'Your account request was not approved.',
    });
  }
  return { accountId: principal.userId };
}
