---
description: Requirements for responsive design, breakpoints, and common layout approaches using Tailwind CSS.
version: 1.0
updated: 2026-08-13
---

# Responsive Design & Layout Patterns

Requirements for responsive design, breakpoints, and common layout approaches using Tailwind CSS.

## Quick Reference

- **Approach**: Mobile-first responsive
- **Breakpoints**: Tailwind defaults (sm, md, lg, xl, 2xl)
- **Layout**: Flexbox for 1D, Grid for 2D

---

## Responsive Design Requirements

### Mobile-First Approach

**Rule**: ALL designs MUST be responsive.

### Breakpoints (Tailwind Defaults)

```css
/* Mobile first — base styles apply to mobile */
.element { }

/* Small devices (640px and up) */
@media (min-width: 640px) { }  /* sm: */

/* Medium devices (768px and up) */
@media (min-width: 768px) { }  /* md: */

/* Large devices (1024px and up) */
@media (min-width: 1024px) { } /* lg: */

/* Extra large devices (1280px and up) */
@media (min-width: 1280px) { } /* xl: */

/* 2XL devices (1536px and up) */
@media (min-width: 1536px) { } /* 2xl: */
```

### Tailwind Responsive Syntax

```html
<!-- Mobile: stack, Desktop: side-by-side -->
<div class="flex flex-col md:flex-row">
  <div class="w-full md:w-1/2">Left</div>
  <div class="w-full md:w-1/2">Right</div>
</div>

<!-- Mobile: full width, Desktop: constrained -->
<div class="w-full lg:w-3/4 xl:w-1/2 mx-auto">
  Content
</div>
```

### Testing Requirements

- Test at minimum: 375px, 768px, 1024px, 1440px
- Verify touch targets (min 44×44px)
- Check text readability at all sizes
- Ensure images scale properly
- Test navigation on mobile

---

## Layout Patterns

### Flexbox (1D Layouts)

```html
<!-- Horizontal layout -->
<div class="flex items-center gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Vertical layout -->
<div class="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Centered content -->
<div class="flex items-center justify-center min-h-screen">
  <div>Centered content</div>
</div>
```

### Grid (2D Layouts)

```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Dashboard layout -->
<div class="grid grid-cols-12 gap-4">
  <aside class="col-span-12 lg:col-span-3">Sidebar</aside>
  <main class="col-span-12 lg:col-span-9">Content</main>
</div>
```

### Container Patterns

```html
<!-- Centered container with max width -->
<div class="container mx-auto px-4 max-w-7xl">
  Content
</div>

<!-- Full-width section with contained content -->
<section class="w-full bg-gray-50">
  <div class="container mx-auto px-4 py-12 max-w-6xl">
    Content
  </div>
</section>
```

---

## References

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind Flexbox](https://tailwindcss.com/docs/flex)
- [Tailwind Grid](https://tailwindcss.com/docs/grid-template-columns)

---

## Related Files

- [css-framework.md](css-framework.md) — Framework loading and setup
- [typography-colors.md](typography-colors.md) — Colors, contrast, and typography
- [components-accessibility.md](components-accessibility.md) — Component patterns and a11y
