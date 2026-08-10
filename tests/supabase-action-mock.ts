import { vi } from "vitest";

export type QueryResponse = {
  data?: unknown;
  error?: { code: string } | null;
};

export type QueryBuilderMock = {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  then: (
    onFulfilled: (value: QueryResponse) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
  update: ReturnType<typeof vi.fn>;
};

export function createSupabaseActionMock() {
  const queues = new Map<string, QueryResponse[]>();
  const builders = new Map<string, QueryBuilderMock[]>();
  const getUser = vi.fn();

  const from = vi.fn((table: string) => {
    const response = queues.get(table)?.shift() ?? { data: null, error: null };
    const builder: QueryBuilderMock = {
      delete: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      maybeSingle: vi.fn().mockResolvedValue(response),
      select: vi.fn(() => builder),
      then: (onFulfilled, onRejected) =>
        Promise.resolve(response).then(onFulfilled, onRejected),
      update: vi.fn(() => builder),
    };

    const tableBuilders = builders.get(table) ?? [];
    tableBuilders.push(builder);
    builders.set(table, tableBuilders);
    return builder;
  });

  return {
    client: { auth: { getUser }, from },
    from,
    getUser,
    latest(table: string) {
      return builders.get(table)?.at(-1);
    },
    queue(table: string, ...responses: QueryResponse[]) {
      queues.set(table, [...(queues.get(table) ?? []), ...responses]);
    },
    reset() {
      queues.clear();
      builders.clear();
      from.mockClear();
      getUser.mockReset();
    },
  };
}
