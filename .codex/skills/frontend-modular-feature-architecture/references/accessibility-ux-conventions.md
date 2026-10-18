# Accessibility & UX Conventions — andromeda-frontend

> Reference for the `frontend-modular-feature-architecture` skill.
> These patterns were established during the initial UI/UX audit and **must be followed
> in every new screen or component**. They complement the `frontend-web-design-guidelines`
> skill (which covers full audits); this document records the **decisions already baked
> into the codebase** so they propagate consistently as the app grows.

---

## 1. Async feedback — always use an `aria-live` container

Never render a status message conditionally and expect screen readers to announce it
reliably. Keep a container **always present** in the DOM and swap its content:

```tsx
// ✅ correct — container is always mounted; content changes trigger announcement
<div aria-live="polite" aria-atomic="true">
  {serverError && <p>{serverError}</p>}
</div>;

// ❌ wrong — conditional mount is not reliably announced on re-render
{
  serverError && <p role="alert">{serverError}</p>;
}
```

Use `aria-live="polite"` for non-critical updates (validation errors, server errors,
status messages). Use `role="alert"` only for errors rendered on **initial mount** (e.g.
a missing token on page load) where the element is inserted once and immediately
announced.

---

## 2. Form fields — let `FormField` own all ARIA

`FormField` in `@andromeda/design-system` propagates `aria-required`, `aria-invalid`, and
`aria-describedby` to the input via its render-prop `inputProps`. Always use `FormField`
for labeled inputs — never wire these attributes manually on an `<Input>`:

```tsx
// ✅ correct — ARIA attributes come from FormField automatically
<FormField label="Email" required error={errors.email?.message}>
  {(inputProps) => (
    <Input {...inputProps} {...register("email")} type="email" />
  )}
</FormField>

// ❌ wrong — manual ARIA duplicates or misses what FormField already provides
<Input aria-label="Email" aria-required={true} {...register("email")} />
```

---

## 3. Icons — always decorative inside labelled elements

All `Icon*` components from `@andromeda/design-system` have `aria-hidden="true"` baked
in. They are always decorative when used inside a button or link that already has an
accessible name (via `aria-label`, visible text, or `FormField` label).

Do not pass `aria-label` to an `Icon*` component. If you need the icon to be the sole
accessible name (rare), use the raw lucide component directly with `role="img"` and
`aria-label` on the SVG element.

---

## 4. Buttons and links — specific, Title Case labels

- All button labels and headings use **Title Case** (Chicago style): "Create Account",
  "Sign In", "Set Password" — not "Create account", "Sign in".
- Button labels must be **specific to the action**: "Save API Key" not "Save"; "Create
  Account" not "Continue".
- Loading states use `"<Action>ing…"` with a proper ellipsis character (`…`, not `...`):
  "Signing in…", "Creating account…", "Saving…".
- Error messages always include a **next step**, not just the problem description:
  "This link has expired. Request a new invitation link." — not "This link has expired."

---

## 5. Page headings — every page has an `<h1>`

Every screen must have exactly one `<h1>`. Apply `text-balance` on all headings to
prevent typographic widows. Use responsive font sizes instead of `whitespace-nowrap`:

```tsx
// ✅ correct
<h1 className="text-3xl sm:text-5xl font-bold text-balance">
  Create Your Account
</h1>

// ❌ wrong — clips on mobile, no widow prevention
<h1 className="text-5xl font-bold whitespace-nowrap">Create your account</h1>
```

On the landing page the logo SVG (which already carries `role="img"` and
`aria-label="Andromeda"`) acts as the `<h1>`:

```tsx
<h1>
  <AndromedaLogo height={58} />
</h1>
```

---

## 6. SVG assets — always set explicit `width`

SVGs rendered with only `height` cause Cumulative Layout Shift (CLS) because the browser
cannot reserve the correct space before paint. Derive `width` from the `viewBox` aspect
ratio:

```tsx
// ✅ correct — width derived from viewBox (420 / 48 ≈ 8.75)
const width = Math.round((420 / 48) * height);
<svg viewBox="0 0 420 48" width={width} height={height} />;
```

---

## 7. Layout components and landmark structure

- **Public pages** (unauthenticated): wrap with `CenteredLayout`. It renders
  `<main id="main-content">`, which is the skip-link target. If a public page is ever
  nested inside another `<main>`, pass `as="div"` to avoid duplicate landmark elements.
- **Authenticated pages**: rendered inside `AppLayout` (via `AppLayoutWrapper`), which
  owns the `<main id="main-content">`. Do not add a second `<main>` inside a page
  component.
- **`AppDrawer` labels are i18n props** — `sidebarLabel`, `navigationLabel`,
  `collapseLabel`, and `expandLabel` are required string props on `AppLayout`. When i18n
  lands, pass these through the translation function.

---

## 8. Design-system contracts that enforce accessibility

These are handled at the component level — no action needed per feature, but understand
what they guarantee:

| Component     | Guarantee                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `Icon*`       | `aria-hidden="true"` always set — icons are invisible to screen readers                                       |
| `FormField`   | Propagates `aria-required`, `aria-invalid`, `aria-describedby` to the input                                   |
| `AppDrawer`   | `<aside>` and `<nav>` have required `aria-label` props; toggle buttons have `aria-expanded` + `aria-controls` |
| `Skeleton`    | `aria-hidden="true"` + `motion-reduce:animate-none` — hidden from AT and respects reduced-motion              |
| `globals.css` | `prefers-reduced-motion` reset disables all animations/transitions globally; `color-scheme` set per theme     |
| `theme.store` | `applyTheme` syncs `color-scheme` and `meta[name=theme-color]` on every toggle                                |
| `index.html`  | Skip link (`<a href="#main-content">`) present; `<html lang="en">` set                                        |
