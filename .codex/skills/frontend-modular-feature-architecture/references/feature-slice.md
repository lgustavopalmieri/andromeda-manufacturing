# The feature slice — building a screen

> Reference for the `frontend-modular-feature-architecture` skill. Reference feature:
> `src/features/sign-up/**` (register an account + its owner user). This file walks the
> vertical slice layer by layer, in the order you build it. Read `references/i18n.md` for
> the i18n layer and `references/testing.md` for the colocated tests.

## 1. Core concept

A **feature slice** is one screen (or one tight cluster of screens) with everything it
needs, top to bottom: validation (`schema/`), transport (`api/`), logic (`hooks/`),
presentation (`components/`), copy (`i18n/`), the screen itself (`<feature>.page.tsx`),
its mounting (`<feature>.route.ts`), and its test doubles (`@test-utils/`). The slice is
**additive**: you create it without editing other slices.

Within the slice, responsibilities are strictly separated (the flow from `SKILL.md` §3):

```
route → page → component → hook → { schema, api }
```

- **route** — where the screen mounts and which guard owns it.
- **page** — session/loading gate, layout choice, composition of components.
- **component** — presentational; renders design-system primitives, wires events.
- **hook** — the brain: form state, validation resolver, mutation/query, payload mapping.
- **schema** — the validation contract (pure, localized).
- **api** — the transport contract (DTOs + `httpClient` calls).

Keep each layer doing only its job. A component that fetches, a page that owns form
state, or a hook that renders JSX are the three most common slice smells.

## 2. `schema/` — the validation contract

**Role.** Declare the shape and rules of the form's values, and derive the form's
TypeScript type from them. Messages are **localized**, so the schema is a **factory** that
takes an i18next `TFunction` and returns the Zod object.

```ts
// schema/sign-up.schema.ts — reference example
import { z } from "zod";
import type { TFunction } from "i18next";

export function makeSignUpSchema(t: TFunction) {
  const slugSchema = z
    .string()
    .min(1, t("errors.slug_required"))
    .regex(/^[a-z0-9-]+$/, t("errors.slug_format"));

  return z.object({
    accountName: z.string().min(1, t("errors.account_name_required")),
    accountSlug: slugSchema,
    legalName: z.string().optional(),
    taxId: z.string().optional(),
    ownerName: z.string().min(1, t("errors.owner_name_required")),
    ownerUsername: z.string().min(1, t("errors.owner_username_required")),
    ownerEmail: z
      .string()
      .min(1, t("errors.owner_email_required"))
      .email(t("errors.owner_email_invalid")),
  });
}

export type SignUpFormValues = z.infer<ReturnType<typeof makeSignUpSchema>>;
```

Notes that matter:

- The exported **type** is `z.infer<ReturnType<typeof makeSignUpSchema>>` — the form
  values are always derived from the schema, never hand-written.
- Every message is a **key** passed to `t(...)`, never a literal. The key namespace
  (`errors.*`) matches the feature's `i18n/interface.ts`.
- **Optional fields** use `.optional()` and stay as empty strings in the form; the hook's
  `toPayload` decides whether to send them (see §4).

## 3. `api/` — the transport contract

**Role.** Own the feature's HTTP calls and the DTOs for them. DTOs are built from the
**shared entity contracts** (`types/entities/*`) with `Pick`/`Partial`, so the client and
server stay in sync. Functions are thin wrappers over `lib/http-client`.

```ts
// api/sign-up.api.ts — reference example
import { httpClient } from "../../../lib/http-client";
import type { AccountEntityInterface } from "../../../types/entities/account/account.entity";
import type { AccountSettings } from "../../../types/entities/account/account.interfaces";
import type { UserEntityInterface } from "../../../types/entities/user/user.entity";

export interface CreateAccountRequest {
  name: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  settings: AccountSettings | Record<string, never>;
  owner: Pick<UserEntityInterface, "name" | "username" | "email">;
}

export interface CreateAccountResponse {
  account: Pick<AccountEntityInterface, "id" | "slug" | "name" | "plan" | "status" | "ownerUserId">;
  owner: Pick<UserEntityInterface, "id" | "name" | "username" | "email" | "status">;
}

export function createAccount(payload: CreateAccountRequest): Promise<CreateAccountResponse> {
  return httpClient.post<CreateAccountResponse>("/api/v1/accounts", payload);
}
```

Notes that matter:

- The function returns the **unwrapped** data (`CreateAccountResponse`), not the
  `{ error, data, message }` envelope — `httpClient` unwraps it and throws `ApiError` on
  failure (see `references/state-transport-auth.md`).
- **Never** `fetch` here. **Never** put React or form types in this file — the API layer
  speaks DTOs, not `FormValues`. Mapping `FormValues → Request` is the hook's job.
- The `Request`/`Response` suffix is the convention; build the DTOs from
  `types/entities/*` so a backend field change surfaces as a type error here.

## 4. `hooks/` — the screen's brain

**Role.** This is the frontend's _usecase_. It owns: building the **localized** schema,
wiring **React Hook Form** with `zodResolver`, the **TanStack** mutation/query, the
`FormValues → Request` mapping, and exposing a **small, flat API** for the component.

```ts
// hooks/use-sign-up-form.ts — reference example
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { makeSignUpSchema, type SignUpFormValues } from "../schema/sign-up.schema";
import { createAccount, type CreateAccountResponse } from "../api/sign-up.api";

function toPayload(values: SignUpFormValues) {
  return {
    name: values.accountName,
    slug: values.accountSlug,
    legalName: values.legalName || undefined,
    taxId: values.taxId || undefined,
    settings: {},
    owner: {
      name: values.ownerName,
      username: values.ownerUsername,
      email: values.ownerEmail,
    },
  };
}

export function useSignUpForm() {
  const { i18n } = useTranslation("sign-up");

  const schema = useMemo(() => {
    const t = i18n.getFixedT(i18n.language, "sign-up");
    return makeSignUpSchema(t);
  }, [i18n, i18n.language]);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountName: "",
      accountSlug: "",
      legalName: "",
      taxId: "",
      ownerName: "",
      ownerUsername: "",
      ownerEmail: "",
    },
  });

  const mutation = useMutation<CreateAccountResponse, Error, SignUpFormValues>({
    mutationFn: (values) => createAccount(toPayload(values)),
    retry: false,
  });

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    serverError: mutation.error?.message ?? null,
    data: mutation.data ?? null,
  };
}
```

Notes that matter:

- **Localized schema, rebuilt on locale change.** `useMemo` keyed on `i18n.language`
  rebuilds the schema when the user switches language, so validation messages re-localize.
  `i18n.getFixedT(language, "sign-up")` pins the translator to this namespace/locale.
- **`defaultValues` are all empty strings** (controlled inputs from first render — no
  uncontrolled→controlled warnings).
- **`toPayload` is the mapping seam.** It converts empty optionals to `undefined` (so they
  are omitted from the JSON body) and nests the owner. Keep this pure and unit-test it via
  the hook (see `references/testing.md`).
- **`retry: false`** on the mutation: a failed sign-up should surface immediately, not
  silently retry.
- **The returned API is flat and presentational-friendly:** `form`, `onSubmit`,
  `isPending`, `isSuccess`, `serverError` (already unwrapped to a string or `null`),
  `data`. The component never touches `mutation.*` directly.

## 5. `components/` — presentational only

**Role.** Render the UI. Consume the hook, compose `@andromeda/design-system` primitives,
wire ARIA through `FormField`, and tag elements with `data-testid`s from the registry.
A form screen typically splits into three components: the **form**, a **hero** (heading +
subtitle), and a **skeleton** (loading placeholder that mirrors the form's shape).

```tsx
// components/sign-up-form.tsx — reference example (trimmed to the essentials)
import { useTranslation } from "react-i18next";
import { Button, FormField, Input } from "@andromeda/design-system";
import { signUpFormIds } from "../@test-utils/test-ids";
import { useSignUpForm } from "../hooks/use-sign-up-form";

export function SignUpForm() {
  const { t } = useTranslation("sign-up");
  const { form, onSubmit, isPending, isSuccess, serverError } = useSignUpForm();
  const {
    register,
    formState: { errors },
  } = form;

  if (isSuccess) {
    return <p data-testid={signUpFormIds.successMessage}>{t("success")}</p>;
  }

  return (
    <form
      data-testid={signUpFormIds.form}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* Async feedback lives in an always-mounted aria-live container (a11y §1). */}
      <div aria-live="polite" aria-atomic="true">
        {serverError && <p data-testid={signUpFormIds.serverError}>{serverError}</p>}
      </div>

      {/* Fieldsets group related inputs and are disabled while the request is in flight. */}
      <fieldset
        data-testid={signUpFormIds.fieldsetAccount}
        disabled={isPending}
        className="flex flex-col gap-4"
      >
        <legend>{t("form.fieldset_account")}</legend>

        {/* FormField owns aria-required / aria-invalid / aria-describedby (a11y §2). */}
        <FormField
          label={t("form.account_name_label")}
          required
          error={errors.accountName?.message}
        >
          {(inputProps) => (
            <Input
              {...inputProps}
              {...register("accountName")}
              data-testid={signUpFormIds.accountNameInput}
              type="text"
              placeholder={t("form.account_name_placeholder")}
              autoComplete="organization"
            />
          )}
        </FormField>
        {/* …the remaining account fields… */}
      </fieldset>

      {/* …the owner fieldset… */}

      <Button
        type="submit"
        data-testid={signUpFormIds.submitButton}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? t("form.submitting") : t("form.submit")}
      </Button>
    </form>
  );
}
```

Patterns to reproduce:

- **The hook is the only source of logic.** The component reads `form`, `onSubmit`,
  `isPending`, `isSuccess`, `serverError`. No `useMutation`, no validation here.
- **Success replaces the form.** When `isSuccess`, render the success message _instead_ of
  the form (the form disappears from the DOM — tests assert this).
- **`disabled={isPending}`** on the fieldsets (disables all inputs at once) and the submit
  button; the label swaps to `t("form.submitting")` (`"Creating Account…"`).
- **`noValidate`** on the `<form>` — validation is Zod's job, not the browser's.
- **Every meaningful element carries a `data-testid`** from `signUpFormIds` and copy comes
  from `t(...)`. Correct `autoComplete` tokens (`organization`, `name`, `username`,
  `email`) are set per field.
- The **hero** (`sign-up-hero.tsx`) renders the single `<h1>` + subtitle from i18n; the
  **skeleton** (`sign-up-skeleton.tsx`) composes `Skeleton` blocks that mirror the form's
  layout so there's no layout shift when content replaces it.

For component API shape (props vs. children, compound components) defer to
**frontend-composition-patterns**; for the ARIA/copy rules see
`references/accessibility-ux-conventions.md`.

## 6. `<feature>.page.tsx` — the screen

**Role.** Gate on session status (render the skeleton while the session resolves), pick
the layout, and compose the components. The page owns **no** form state and does **no**
data fetching.

```tsx
// sign-up.page.tsx — reference example
import { SESSION_STATUS, useSessionStore } from "../../stores/session.store";
import { PublicLayout } from "../../ui/layout/public/public-layout";
import { signUpPageIds } from "./@test-utils/test-ids";
import { SignUpForm } from "./components/sign-up-form";
import { SignUpHero } from "./components/sign-up-hero";
import { SignUpSkeleton } from "./components/sign-up-skeleton";

export function SignUpPage() {
  const status = useSessionStore((s) => s.status);

  if (status === SESSION_STATUS.IDLE || status === SESSION_STATUS.LOADING) {
    return (
      <PublicLayout>
        <SignUpSkeleton />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="w-full" data-testid={signUpPageIds.page}>
        <SignUpHero />
        <div className="w-full max-w-md m-auto">
          <SignUpForm />
        </div>
      </div>
    </PublicLayout>
  );
}
```

Notes that matter:

- **Session gate first.** While the session is `IDLE`/`LOADING`, render the skeleton (still
  inside the layout, so the shell doesn't jump). Once resolved, render the real content.
- **Layout choice:** public screens use `PublicLayout` (renders the `<main>` landmark);
  authenticated screens render inside `AppLayout` — never add a second `<main>` (a11y §7).
- **Subscribe narrowly** to the store: `useSessionStore((s) => s.status)` selects only what
  the page needs, avoiding re-renders on unrelated session changes.

## 7. `<feature>.route.ts` — mounting under a guard

**Role.** Create the TanStack route and attach it to the correct **parent guard route**.
Registration into the tree happens centrally in `src/router.tsx`.

```ts
// sign-up.route.ts — reference example
import { createRoute } from "@tanstack/react-router";
import { SignUpPage } from "./sign-up.page";
import { guestGuardRoute } from "../../router/routes/guest-guard.route";

export const signUpRoute = createRoute({
  getParentRoute: () => guestGuardRoute,
  path: "/sign-up",
  component: SignUpPage,
});
```

- `sign-up` is guest-only, so it hangs off `guestGuardRoute` (redirects authenticated
  users away). Authenticated screens hang off `authGuardRoute`/`appLayoutRoute`; role-gated
  screens off a role guard. See `references/state-transport-auth.md`.
- Then register it in `src/router.tsx`:
  `guestGuardRoute.addChildren([landingRoute, signInRoute, signUpRoute])`.

## 8. How to start a new slice (checklist)

1. `mkdir src/features/<feature>` and decide which layers the screen needs (a static page
   needs only `page` + `route`; a form/data screen needs the full set).
2. If it speaks about a new entity, add the contract under `types/entities/`.
3. `schema/<feature>.schema.ts` → `make<Feature>Schema(t)` + `<Feature>FormValues`.
4. `api/<feature>.api.ts` → DTOs + `httpClient` functions.
5. `i18n/interface.ts` + locale files; register the namespace in `src/i18n.ts`
   (`references/i18n.md`).
6. `hooks/use-<feature>-form.ts` → localized schema (`useMemo`) + RHF + mutation/query +
   `toPayload`.
7. `components/` → presentational form/hero/skeleton, consuming the hook.
8. `<feature>.page.tsx` → session gate + layout + composition.
9. `<feature>.route.ts` → `createRoute` under the right guard; register in `router.tsx`.
10. `@test-utils/` + colocated tests per layer (`references/testing.md`).

## 9. Common mistakes (what NOT to do)

- ❌ A component calling `useMutation`/`fetch` or running validation. ✅ Logic lives in the
  hook; the component only renders and wires events.
- ❌ The page owning form state or fetching data. ✅ The page gates on session and composes;
  the hook owns state.
- ❌ Hand-writing the `FormValues` type. ✅ Infer it from the schema
  (`z.infer<ReturnType<typeof make…Schema>>`).
- ❌ A static (non-factory) schema with hard-coded English messages. ✅ A `make…Schema(t)`
  factory whose messages are translation keys (the `sign-up` pattern; older features are
  the anti-pattern to fix).
- ❌ Putting `FormValues → Request` mapping in the component or the API layer. ✅ It's
  `toPayload` inside the hook.
- ❌ API functions returning the raw `{ error, data }` envelope. ✅ Return unwrapped data;
  `httpClient` unwraps and throws `ApiError`.
- ❌ Elements without `data-testid`s / literal copy in JSX. ✅ Test-ids from the registry,
  copy from `t(...)`.
- ❌ Adding a second `<main>` or skipping the loading skeleton. ✅ One landmark per page;
  gate on session status.
