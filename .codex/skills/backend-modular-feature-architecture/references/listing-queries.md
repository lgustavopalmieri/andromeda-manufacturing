# Listing queries — pagination, sort, filters, text search & facets

Shared: `src/modules/@shared/query/`, `src/modules/@shared/pagination/`.
Translator: `src/platform/database/postgres/typeorm/query/`.
Reference: `src/modules/machine/features/list-machines/`.

## 1. Core concept

Listings share pagination, sort, structured filters, free-text search and facets.
Pure shared VOs (`Pagination`, `Sort`, `TextSearch`, `ListQuery`) validate/normalize
intent without SQL/frameworks. One platform TypeORM translator maps them to query-builder
calls; replacing it leaves domain/shared unchanged. Each feature declares an explicit
sortable/searchable/facetable whitelist (`ListQuerySpec`) and outbound physical column
maps. Never accept arbitrary columns. Return facets only when requested.

## 2. Role and when to use it

Use for collections narrowed/paginated by humans or AI: machines, sites, orders, KPIs,
quality and telemetry. Single-aggregate get-one/find-by-id needs no listing query.
Pagination alone (`@shared/pagination`) is enough for genuinely trivial lists; adopt
the full standard for client-controlled order, multiple filters, search or facet counts,
rather than inventing per-feature parsing.

## 3. The HTTP contract

```
?page=1&limit=20                 # pagination (page/limit, clamped to MAX_LIMIT)
&sort=-createdAt,name            # JSON:API style: '-' = desc; a unique tiebreaker (id) is auto-appended
&q=hydraulic                     # free-text search across the feature's searchable columns
&status=active,maintenance       # structured filter (IN); repeatable (?status=a&status=b) or comma-list
&siteId=<uuid>&areaId=<uuid>     # more structured filters (all optional by default)
&facets=status,siteId            # opt-in: adds count-per-value buckets to the response
```

Extend the paginated response; include facets only on request:

```jsonc
{
  "error": false,
  "data": {
    "data": [/* items */],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false,
    },
    "facets": {
      "status": [
        { "value": "active", "count": 30 },
        { "value": "maintenance", "count": 12 },
      ],
    },
  },
}
```

Filters default to optional; make the feature's Zod field non-optional when required.

## 4. Shared building blocks (`@shared/query`)

Import from `@shared/query`, which also re-exports pagination:

- `Sort.from(requested, { allowed, fallback, tiebreaker })`: retain whitelisted fields,
  fall back when empty, **always append a unique tiebreaker** (`id`) for deterministic
  offset pagination when other sort values repeat.
- `TextSearch.from(raw)`: trim and escape LIKE `%`, `_` and backslash so search is literal;
  return undefined for empty search.
- `resolveFacets(requested, facetable)`: deduplicate, discard disallowed facets;
  empty means compute none.
- `ListQuery<F>`: bundle pagination, sort, search, requested facets and opaque typed
  filters. `buildResult(items, total, facets?)` creates `ListResult<T>`.
- Zod: `sortSchema(allowed)`, `searchSchema(minLength)`, `facetsSchema(facetable)`,
  `multiValueParam` (single/repeated/comma-separated values → deduplicated array).

Platform `typeorm-list-query.ts` supplies `applySort`, `applyPagination`,
`applyTextSearch`, `computeFacets`, `ColumnMap`; it depends on SelectQueryBuilder.
Only outbound uses it, never domain/application.

## 5. File anatomy of a listing feature (`list-machines`)

### `application/query-spec.ts` — the whitelist (single source of truth)

```ts
import { SORT_DIRECTION, type ListQuerySpec } from "@shared/query";

export const listMachinesQuerySpec: ListQuerySpec = {
  sortable: ["name", "code", "status", "createdAt", "updatedAt"],
  defaultSort: [{ field: "createdAt", direction: SORT_DIRECTION.ASC }],
  tiebreaker: "id",
  facetable: ["status", "siteId", "areaId", "productionLineId"],
  searchMinLength: 2,
};
```

Declare API fields only, no columns. Edge schema and usecase share this whitelist.

### `domain/types.ts` — typed filters + input

```ts
import type { ListQueryProps } from "@shared/query";

export interface ListMachinesFilters {
  status?: string[];
  siteId?: string[];
  areaId?: string[];
  productionLineId?: string[];
}

export type ListMachinesInputProps = ListQueryProps<ListMachinesFilters>;
```

Like PaginationInput, ListQueryProps is a cross-cutting shared contract permitted in
domain/types.

### `application/interfaces.ts` — ports

```ts
export type ListMachinesResult = ListResult<MachineWithOperations>;

export interface ListMachinesRepositoryResult {
  items: MachineWithOperations[];
  total: number;
  facets?: FacetResult;
}

export interface ListMachinesRepositoryInterface {
  findAllByTenant(
    tenantId: string,
    query: ListQuery<ListMachinesFilters>,
  ): Promise<ListMachinesRepositoryResult>;
}
```

Keep tenantId separate and identity-derived, never in client query; all other query
concerns travel in ListQuery.

### `application/usecase.ts` — thin orchestration

```ts
protected async handle(input, identity) {
  const query = ListQuery.from<ListMachinesFilters>(input, listMachinesQuerySpec);
  const { items, total, facets } = await this.machineRepository.findAllByTenant(
    identity.tenantId,
    query,
  );
  return query.buildResult(items, total, facets);
}
```

### `inbound/http/schema.ts` — compose the helpers

```ts
export const listMachinesSchema = paginationSchema.merge(
  z.object({
    sort: sortSchema(listMachinesQuerySpec.sortable),
    q: searchSchema(listMachinesQuerySpec.searchMinLength),
    facets: facetsSchema(listMachinesQuerySpec.facetable ?? []),
    status: z.preprocess(multiValueParam, z.array(z.enum(...)).optional()),
    siteId: uuidListSchema("siteId"),
    // ...
  }),
);
```

Unknown sort/facet fields and too-short q fail at the edge with `400`.

### `inbound/http/http-handler.ts` — adapt input

Build typed filters, omitting empty arrays (`...(cond ? {x} : {})`); map q → search
and pass assembled ListQueryProps to the usecase.

### `outbound/typeorm/*.repository.ts` — apply + column maps

```ts
const SORT_COLUMNS: ColumnMap = {
  name: "machine.name",
  createdAt: "machine.createdAt",
  id: "machine.id" /* ... */,
};
const SEARCH_COLUMNS = ["machine.name", "machine.code"] as const;
const FACET_COLUMNS: ColumnMap = { status: "machine.status", siteId: "machine.siteId" /* ... */ };

const baseQuery = repo
  .createQueryBuilder("machine")
  .where("machine.tenantId = :tenantId", { tenantId })
  .andWhere("machine.deletedAt IS NULL");
this.applyFilters(baseQuery, query.filters); // structured filters stay explicit here
applyTextSearch(baseQuery, query.search, SEARCH_COLUMNS);

const total = await baseQuery.clone().getCount();

const pageQuery = baseQuery.clone();
applySort(pageQuery, query.sort, SORT_COLUMNS); // tiebreaker 'id' MUST be in the map
applyPagination(pageQuery, query.pagination);
const rows = await pageQuery.getMany();

const facets = query.hasFacets
  ? await computeFacets(baseQuery, query.facets, FACET_COLUMNS)
  : undefined;
```

Keep tenant scope, soft deletion and structured filters explicit/auditable in the
repository; delegate only sort, pagination, search and facet aggregation. Include the
tiebreaker in the sort column map or determinism is lost.

## 6. Facets — opt-in by design

Enable per feature (`facetable`) **and** request (`?facets=`): each adds a GROUP BY query.
Compute each facet from the same fully filtered base (tenant + filters + search),
reflecting current results with single-select semantics. Use where valuable (fleet,
orders, telemetry); skip low-cardinality hierarchy navigation (sites/areas/lines).

## 7. Text search & indexing

- Default: tenant-scoped `ILIKE '%term%'` across feature SEARCH_COLUMNS.
- Leading wildcards cannot use btree; add GIN pg_trgm indexes on searchable columns
  and `CREATE EXTENSION pg_trgm` in a migration.
- Use full-text tsvector/tsquery + GIN only for genuinely long descriptions/notes.
- Index default ordering with `(tenant_id, <sort_col>, id)` for tenant scope and
  tiebreaker-backed offset pagination.

See migration `1750000000011-AddMachineQueryIndexes` and `references/platform.md`.

## 8. Testing

Read [common testing rules](testing.md); use the current layer's guide for its SUT setup.

- Shared VOs/Zod: pure unit tests for Sort, TextSearch, resolveFacets and ListQuery.
- Usecase + repository stub: assert query pagination, sort/tiebreaker, filters, resolved
  facets and facets in results.
- Repository + testcontainers: filters, ascending/descending order, case-insensitive
  search, filtered facet buckets and tenant isolation.

## 9. How to start (new listing feature)

1. query-spec: sortable, defaultSort, tiebreaker, optional facetable/searchMinLength.
2. domain/types: typed filters + `<Feat>InputProps = ListQueryProps<<Feat>Filters>`.
3. application/interfaces: ListResult, repository result with optional facets,
   `findAllByTenant(tenantId, query: ListQuery<Filters>)`.
4. Usecase: `ListQuery.from(input, spec)` → repository → `query.buildResult(...)`.
5. Edge schema: merge paginationSchema with sort/search/facets helpers and feature filters.
6. Handler: typed filters, q → search, assembled input.
7. Outbound: SORT_COLUMNS including tiebreaker, SEARCH_COLUMNS, FACET_COLUMNS; explicit
   tenant/soft-delete/filters; delegate mechanics.
8. Migrate pg_trgm search and default-sort composite indexes.
9. Test each layer.

## 10. Common mistakes (what NOT to do)

- Do not hard-code ORDER BY; use client Sort + applySort.
- Never trust client column names; whitelist via ListQuerySpec and edge validation (`400`).
- Always include unique tiebreaker and its SORT_COLUMNS mapping.
- Reuse multiValueParam, not feature-specific parsing.
- Never build LIKE patterns from raw input; TextSearch escapes wildcards.
- No unconditional facets; feature + request opt-in.
- No translator imports in domain/application; outbound owns its use.
- Never accept tenantId in client query; pass it separately from identity.
