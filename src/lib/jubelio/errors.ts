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

type ApiResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

type ErrorBody = {
  error?: { code?: string; message?: string } | null;
  request_id?: string;
};

export async function unwrap<T>(result: Promise<ApiResult<T>> | ApiResult<T>): Promise<NonNullable<T>> {
  const { data, error, response } = await result;
  if (response.ok && data !== undefined && data !== null) {
    return data as NonNullable<T>;
  }
  const body = (error ?? {}) as ErrorBody;
  throw new JubelioApiError(
    response.status,
    body.error?.code ?? 'unknown_error',
    body.error?.message ?? response.statusText,
    body.request_id ?? response.headers.get('x-request-id'),
  );
}
