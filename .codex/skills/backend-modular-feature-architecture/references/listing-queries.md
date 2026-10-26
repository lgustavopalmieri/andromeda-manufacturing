# Listing queries — pagination, sort, filters, text search & facets

> Reference for the `modular-feature-architecture` skill. Shared building blocks:
> `src/modules/@shared/query/` and `src/modules/@shared/pagination/`. TypeORM
> translator: `src/platform/database/postgres/typeorm/query/`. Reference feature (real
> code): `src/modules/machine/features/list-machines/`.

## 1. Core concept

Every **listing** (a feature that returns a collection) speaks the same query language:
**pagination + sort + structured filters + free-text search + facets**. The standard
follows the same philosophy as the rest of the architecture:

- **Pure value objects in `@shared/query`** (no framework, no SQL) carry the caller's
  intent already validated and normalized: `Pagination`, `Sort`, `TextSearch`,
  `ListQuery`.
- **A single TypeORM translator in `platform/`** turns those VOs into query-builder
  calls. It is the only place that knows the ORM — swapping it never touches the
  domain or `@shared`.
- **Each feature declares an explicit whitelist** (a `ListQuerySpec`) of what is
  sortable / searchable / facetable, plus the physical column map in its outbound
  adapter. Business intent stays visible; we never sort/filter on an arbitrary column.

The output shape adapts to the input: `facets` only appear in the response when the
caller asks for them.

## 2. Role and when to use it

Use this standard for **any feature that lists a collection** (`list-machines`,
`list-sites`, and future `list-production-orders`, KPIs, quality metrics, telemetry
slices...). If a feature returns a single aggregate (`get-one`, `find-by-id`), it does
**not** need this — it's for collections that a UI (or an AI agent) paginates and
narrows down.

Don't reach for the whole standard when a listing is genuinely trivial: pagination
alone (`@shared/pagination`) is still fine. But when a listing needs client-controlled
ordering, more than one filter, text search, or facet counts, adopt the full standard
instead of inventing per-feature parsing.

## 3. The HTTP contract

```
?page=1&limit=20                 # pagination (page/limit, clamped to MAX_LIMIT)
&sort=-createdAt,name            # JSON:API style: '-' = desc; a unique tiebreaker (id) is auto-appended
&q=hydraulic                     # free-text search across the feature's searchable columns
&status=active,maintenance       # structured filter (IN); repeatable (?status=a&status=b) or comma-list
&siteId=<uuid>&areaId=<uuid>     # more structured filters (all optional by default)
&facets=status,siteId            # opt-in: adds count-per-value buckets to the response
```

Response (extends the paginated envelope; `facets` present only when requested):

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

Filters are **optional by default**; a feature that needs one **required** simply makes
its own Zod field non-optional in the feature schema.

## 4. Shared building blocks (`@shared/query`)

`@shared/query` re-exports `@shared/pagination` and adds the query VOs + Zod helpers.
Import everything from `@shared/query`.

- **`Sort.from(requested, { allowed, fallback, tiebreaker })`** — keeps only whitelisted
  fields, falls back to the default sort when empty, and **always appends the unique
  tiebreaker** (`id`). This is what makes offset pagination deterministic — an
  `ORDER BY name` with duplicate names would otherwise shuffle rows between pages.
- **`TextSearch.from(raw)`** — trims and escapes SQL LIKE wildcards (`%`, `_`, `\`), so a
  user-typed term is always a literal; returns `undefined` when there's nothing to search.
- **`resolveFacets(requested, facetable)`** — de-dupes requested facets and drops anything
  not facetable; empty means "compute none".
- **`ListQuery<F>`** — the single VO a listing use case builds. Bundles the generic query
  concerns (pagination, sort, search, requested facets) with the feature's strongly-typed
  `filters` (opaque to this layer). `buildResult(items, total, facets?)` assembles the
  `ListResult<T>`.
- **Zod helpers** — `sortSchema(allowed)`, `searchSchema(minLength)`, `facetsSchema(facetable)`,
  `multiValueParam` (single value / repeated param / comma-list → de-duped array).

**TypeORM translator** (`platform/.../typeorm/query/typeorm-list-query.ts`): `applySort`,
`applyPagination`, `applyTextSearch`, `computeFacets`, and the `ColumnMap` type. It lives in
`platform/` because it depends on `SelectQueryBuilder` — never import it from the domain.

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

The spec carries **API field names only** — no column. Both the edge schema and the use
case consume it, so the whitelist isn't duplicated.

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

Like `PaginationInput`, `ListQueryProps` is a cross-cutting `@shared` contract, so using it
in `domain/types` follows the same precedent as pagination.

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

`tenantId` stays a **separate, identity-derived argument** (a security concern, never part
of the client's query). Everything else travels in the one `ListQuery`.

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

An unknown sort field, an unknown facet, or a too-short `q` fail here → **400 at the edge**.

### `inbound/http/http-handler.ts` — adapt input

Build the typed `filters` object (omitting empty arrays with the `...(cond ? {x} : {})`
pattern) and map `q` → `search`; hand the assembled `ListQueryProps` to the use case.

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

**Tenant scope, soft-delete and structured filters stay written by hand** in the repository
(visible and auditable); only the mechanical parts (sort, pagination, search, facet
aggregation) are delegated to the translator. The tiebreaker column must exist in the sort
column map, otherwise determinism is silently lost.

## 6. Facets — opt-in by design

Facets are **opt-in per feature** (`facetable` in the spec) **and per request** (`?facets=`),
because each facet is an extra `GROUP BY` query. `computeFacets` derives every facet from the
same fully-filtered base query (tenant + filters + search already applied), so counts reflect
the current result set (single-select semantics). Enable facets where they pay off (machine
fleet, production orders, telemetry); skip them on low-cardinality, hierarchy-navigated lists
like sites/areas/lines.

## 7. Text search & indexing

- Default strategy is `ILIKE '%term%'` across the feature's `SEARCH_COLUMNS`, always tenant-scoped.
- `ILIKE` with a leading wildcard can't use a btree index. Back searchable columns with a
  **GIN `pg_trgm`** index (requires `CREATE EXTENSION pg_trgm`, done in a migration).
- Reserve full-text (`tsvector`/`tsquery` + GIN) for genuinely long text (descriptions, notes).
- For the default sort, add a composite index `(tenant_id, <sort_col>, id)` so ordering +
  tiebreaker + tenant scope are index-backed and offset pagination stays cheap.

See the reference migration `1750000000011-AddMachineQueryIndexes` and `references/platform.md`.

## 8. Testing (see `references/testing.md`)

- **`@shared/query` VOs**: pure unit tests (`Sort`, `TextSearch`, `resolveFacets`, `ListQuery`,
  the Zod helpers).
- **Use case**: unit test with a repository stub — assert the built `ListQuery` (pagination,
  sort with tiebreaker, filters, resolved facets) and that facets surface into the result.
- **Repository**: integration test (testcontainers) — cover filters, ordering (asc/desc),
  case-insensitive search, facet buckets honoring active filters, and tenant isolation.

## 9. How to start (new listing feature)

1. `application/query-spec.ts`: declare `sortable`, `defaultSort`, `tiebreaker`, optional
   `facetable`, optional `searchMinLength`.
2. `domain/types.ts`: `<Feat>Filters` (structured) + `<Feat>InputProps = ListQueryProps<<Feat>Filters>`.
3. `application/interfaces.ts`: `ListResult<T>`, a repository-result type with optional
   `facets`, and `findAllByTenant(tenantId, query: ListQuery<Filters>)`.
4. `application/usecase.ts`: `ListQuery.from(input, spec)` → repo → `query.buildResult(...)`.
5. `inbound/http/schema.ts`: `paginationSchema.merge(...)` composing `sortSchema`,
   `searchSchema`, `facetsSchema` and the feature's filter fields.
6. `inbound/http/http-handler.ts`: build typed `filters`, map `q`→`search`, assemble the input.
7. `outbound/typeorm`: define `SORT_COLUMNS` (include the tiebreaker!), `SEARCH_COLUMNS`,
   `FACET_COLUMNS`; keep tenant/soft-delete/filters explicit; delegate the rest to the translator.
8. Add the supporting indexes in a migration (`pg_trgm` for search, composite for the default sort).
9. Write the tests per layer.

## 10. Common mistakes (what NOT to do)

- ❌ Hardcoding `ORDER BY` in the repository. ✅ Client-controlled sort via `Sort` + `applySort`.
- ❌ Sorting/filtering on a field the client passed without a whitelist. ✅ Validate against the
  feature's `ListQuerySpec` (400 at the edge) — never trust an arbitrary column name.
- ❌ Forgetting the unique tiebreaker (or leaving `id` out of `SORT_COLUMNS`). ✅ It's what keeps
  offset pagination deterministic.
- ❌ Re-implementing multi-value param parsing per feature. ✅ Reuse `multiValueParam`.
- ❌ Building the wildcard pattern from raw user input. ✅ `TextSearch` escapes wildcards for you.
- ❌ Computing facets on every request. ✅ Opt-in via `facetable` + `?facets=`.
- ❌ Importing the TypeORM translator from the domain/application. ✅ It's `platform/`; only the
  outbound adapter touches it.
- ❌ Letting `tenantId` ride inside the client query. ✅ It's a separate, identity-derived argument.
