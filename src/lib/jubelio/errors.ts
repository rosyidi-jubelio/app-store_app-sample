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

  get isUnauthorized() {
    return this.status === 401;
  }

  get isMissingScope() {
    return this.code === 'endpoint_not_authorized';
  }
}
