export class JubelioApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId: string | null,
  ) {
    super(`${status} ${code}: ${message}`);
    this.name = 'JubelioApiError';
  }

  get isMissingScope() {
    return this.code === 'endpoint_not_authorized';
  }
}

export class OAuthError extends Error {
  constructor(
    readonly code: string,
    readonly description: string,
    readonly status: number,
  ) {
    super(`${code}: ${description}`);
    this.name = 'OAuthError';
  }
}

export class SessionTokenError extends Error {
  constructor(readonly reason: string) {
    super(`invalid session token: ${reason}`);
    this.name = 'SessionTokenError';
  }
}
