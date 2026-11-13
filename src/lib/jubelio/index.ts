import type { components } from '@/lib/jubelio/schema';

export { type AccessTokenProvider, createJubelioClient, type JubelioClient, type JubelioClientOptions } from '@/lib/jubelio/client';
export { JubelioApiError, unwrap } from '@/lib/jubelio/errors';
export {
  createOAuthClient,
  type OAuthClient,
  type OAuthClientOptions,
  OAuthError,
  type TokenSet,
} from '@/lib/jubelio/oauth';
export { collectAll, paginate } from '@/lib/jubelio/paginate';
export type { components, operations, paths } from '@/lib/jubelio/schema';

export type JubelioSchemas = components['schemas'];
