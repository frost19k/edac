<!-- Context: web/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# CSS Framework Conventions

Standards for loading and using Tailwind CSS + Flowbite component library.

## Quick Reference

- **Framework**: Tailwind CSS + Flowbite (default)
- **Approach**: Mobile-first responsive
- **Format**: Utility-first CSS
- **Production**: Build-tool-based setup (not CDN)

---

## Tailwind CSS

### Loading Methods

**Development (CDN)** — script tag enables JIT compilation:

```html
<!-- ⚠️ CDN script tag — development use only -->
<script src="[Tailwind CSS CDN URL]"></script>
```

> **Note**: The CDN script tag is for development and prototyping only. It is not recommended for production because it generates styles at runtime. For production, use a build-tool-based setup (Tailwind CLI, PostCSS plugin, or Vite plugin) that generates optimized, purged CSS.

**Production (Recommended)** — build-tool-based:

```bash
npm install -D tailwindcss
npx tailwindcss init
```

```css
/* Input CSS */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```bash
npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify
```

### Why Build Tools Over CDN

- Tree-shaking removes unused CSS (smaller bundle)
- No runtime overhead on page load
- Cacheable static CSS file
- Works with CSP (Content Security Policy)

---

## Flowbite

### Loading

```html
<!-- Flowbite CSS -->
<link href="[Flowbite CSS CDN URL]" rel="stylesheet">

<!-- Flowbite JS -->
<script src="[Flowbite JS CDN URL]"></script>
```

**Usage**: Default component library unless user specifies otherwise.

### Available Components

- Buttons, forms, modals
- Navigation, dropdowns, tabs
- Cards, alerts, badges
- Tables, pagination
- Tooltips, popovers

---

## Best Practices

### Do's ✅

- Use Tailwind utility classes for rapid development
- Use Flowbite as default component library
- Ensure all designs are mobile-first responsive
- Test at multiple breakpoints
- Use semantic HTML elements
- Provide ARIA labels for interactive elements
- Use CSS custom properties for theming
- Apply `!important` sparingly — only for framework overrides
- Ensure proper color contrast (WCAG AA)

### Don'ts ❌

- Don't use Bootstrap blue without explicit request
- Don't use Tailwind CDN in production — use build tools
- Don't skip responsive design
- Don't use div soup (use semantic HTML)
- Don't forget focus states
- Don't hardcode colors (use theme variables)
- Don't skip accessibility testing
- Don't use tiny touch targets (<44px)
- Don't mix color formats
- Don't over-use `!important`

---

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CLI](https://tailwindcss.com/docs/installation/using-postcss)
- [Flowbite Components](https://flowbite.com/docs/getting-started/introduction/)

---

## Related

- [responsive-layout.md](responsive-layout.md) — Breakpoints and layout patterns
- [typography-colors.md](typography-colors.md) — Colors, contrast, and typography
- [components-accessibility.md](components-accessibility.md) — Component patterns and a11y
