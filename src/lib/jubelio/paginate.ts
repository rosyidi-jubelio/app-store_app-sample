type Page<T> = {
  data?: T[] | null;
};

export async function* paginate<T>(
  fetchPage: (page: number, pageSize: number) => Promise<Page<T>>,
  options: { pageSize?: number; startPage?: number } = {},
): AsyncGenerator<T> {
  const pageSize = options.pageSize ?? 50;
  let page = options.startPage ?? 1;
  while (true) {
    const rows = (await fetchPage(page, pageSize)).data ?? [];
    yield* rows;
    if (rows.length < pageSize) return;
    page += 1;
  }
}

export async function collectAll<T>(iterator: AsyncIterable<T>, limit = Number.POSITIVE_INFINITY): Promise<T[]> {
  const rows: T[] = [];
  for await (const row of iterator) {
    rows.push(row);
    if (rows.length >= limit) break;
  }
  return rows;
}
