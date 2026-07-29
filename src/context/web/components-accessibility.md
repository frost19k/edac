<!-- Context: web/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# Components, Accessibility & Performance

Patterns for styling components, accessibility requirements, performance optimization, and alternative frameworks.

## Quick Reference

- **Components**: Use Flowbite patterns (buttons, cards, forms)
- **A11y**: Semantic HTML, ARIA labels, visible focus states
- **Performance**: Preconnect fonts, lazy-load images, inline critical CSS
- **Alternatives**: Bootstrap, Bulma, Foundation (if user requests)

---

## Component Styling Patterns

### Buttons

```html
<button class="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">Primary</button>
<button class="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors">Secondary</button>
<button class="border-2 border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-all">Outline</button>
```

### Cards

```html
<!-- Basic card -->
<div class="bg-card text-card-foreground rounded-lg shadow-md p-6">
  <h3 class="text-xl font-semibold mb-2">Card Title</h3>
  <p class="text-muted-foreground">Card content</p>
</div>
```

### Forms

```html
<div class="space-y-2">
  <label class="block text-sm font-medium">Email</label>
  <input type="email" class="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all" placeholder="you@example.com">
</div>
```

---

## Accessibility Standards

- **ARIA labels**: Required for icon buttons, navigation landmarks
- **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>` — never div soup
- **Focus states**: Always provide visible focus indicators

```html
<button aria-label="Close dialog"><svg>...</svg></button>
<nav aria-label="Main navigation">...</nav>
```

```css
button:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
```

---

## Performance Optimization

```html
<!-- Preconnect + preload fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

```html
<!-- Responsive images with lazy loading -->
<img src="image-800.jpg" srcset="image-400.jpg 400w, image-800.jpg 800w" sizes="(max-width: 768px) 100vw, 50vw" alt="Description" loading="lazy">
```

```html
<!-- Inline critical CSS, load rest async -->
<style>body { margin: 0; font-family: system-ui; } .hero { min-height: 100vh; }</style>
<link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">
```

---

## Framework Alternatives

If the user requests a different framework:

**Bootstrap**:
```html
<link href="[Bootstrap CSS CDN URL v5.3.0]" rel="stylesheet">
<script src="[Bootstrap JS Bundle CDN URL v5.3.0]"></script>
```

**Bulma**:
```html
<link rel="stylesheet" href="[Bulma CSS CDN URL v0.9.4]">
```

**Foundation**:
```html
<link rel="stylesheet" href="[Foundation CSS CDN URL v6.7.5]">
<script src="[Foundation JS CDN URL v6.7.5]"></script>
```

---

## References

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Flowbite Components](https://flowbite.com/docs/getting-started/introduction/)

---

## Related

- [css-framework.md](css-framework.md) — Framework loading and setup
- [responsive-layout.md](responsive-layout.md) — Breakpoints and layout patterns
- [typography-colors.md](typography-colors.md) — Colors, contrast, and typography
