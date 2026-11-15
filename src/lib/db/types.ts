export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  execute(text: string, params?: unknown[]): Promise<number>;
}
