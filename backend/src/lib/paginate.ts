export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limitRaw = Number.isInteger(rawLimit) ? rawLimit : 20;
  const limit = Math.min(Math.max(limitRaw <= 0 ? 1 : limitRaw, 1), 100);

  return { page, limit };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);
  return { data, page: params.page, limit: params.limit, total, totalPages };
}
