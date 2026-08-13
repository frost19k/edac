---
description: Standards for color palette, contrast, typography hierarchy, and CSS override strategies.
version: 1.0
updated: 2026-08-13
---

# Typography, Colors & CSS Specificity

Standards for color palette, contrast, typography hierarchy, and CSS override strategies.

## Quick Reference

- **Colors**: Use semantic names, avoid Bootstrap blue
- **Contrast**: WCAG AA minimum (4.5:1 for text)
- **Typography**: Inter font, responsive heading scale
- **Specificity**: Prefer Tailwind utilities over `!important`

---

## Color Palette Guidelines

### Avoid Bootstrap Blue

**Rule**: NEVER use generic Bootstrap blue (#007bff) unless explicitly requested.

**Why**: Overused, lacks personality, feels dated.

### Recommended Alternatives

```css
/* Instead of Bootstrap blue */
--bootstrap-blue: #007bff; /* ❌ Avoid */

/* Use contextual colors */
--primary: oklch(0.6489 0.2370 26.9728);    /* Vibrant orange */
--accent: oklch(0.5635 0.2408 260.8178);     /* Rich purple */
--info: oklch(0.6200 0.1900 260);            /* Modern blue */
--success: oklch(0.7323 0.2492 142.4953);    /* Fresh green */
```

### Color Usage Rules

1. **Semantic naming**: Use `--primary`, `--accent`, not `--blue`, `--red`
2. **Brand alignment**: Choose colors that match project personality
3. **Contrast testing**: Ensure WCAG AA compliance (4.5:1 minimum)
4. **Consistency**: Use theme variables throughout

---

## Background/Foreground Contrast

**Rule**: Light component → Dark background; Dark component → Light background. Ensures visibility and visual hierarchy.

```html
<!-- Light card on dark background -->
<div class="bg-gray-900 p-8">
  <div class="bg-white text-gray-900 p-6 rounded-lg">Light card</div>
</div>

<!-- Dark card on light background -->
<div class="bg-gray-50 p-8">
  <div class="bg-gray-900 text-white p-6 rounded-lg">Dark card</div>
</div>
```

- **Posters/Hero Sections**: High contrast, overlay gradients for text on images
- **Cards/Panels**: Subtle shadows, clear boundaries, consistent padding

---

## Typography Standards

### Heading Hierarchy

```html
<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold">Main Heading</h1>
<h2 class="text-3xl md:text-4xl font-semibold">Section Heading</h2>
<h3 class="text-2xl md:text-3xl font-semibold">Subsection</h3>
<h4 class="text-xl md:text-2xl font-medium">Minor Heading</h4>

<!-- Body text -->
<p class="text-base md:text-lg leading-relaxed">Body text</p>
<p class="text-sm text-gray-600">Secondary text</p>
<p class="text-xs text-gray-500">Caption text</p>
```

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="[Google Fonts URL for Inter, weights 400;500;600;700]" rel="stylesheet">
```

```css
body {
  font-family: 'Inter', sans-serif;
}
```

### Readability

- **Line length**: 60-80 characters optimal
- **Line height**: 1.5-1.75 for body text
- **Font size**: Minimum 16px for body text
- **Contrast**: 4.5:1 minimum for normal text

---

## CSS Specificity & Overrides

**Rule**: Prefer Tailwind utility classes over custom CSS and `!important`. Only use `!important` for genuine framework overrides that cannot be set otherwise.

```html
<!-- ✅ Tailwind utilities handle most cases -->
<div class="m-4 p-4 flex text-lg font-bold">Styled with utilities</div>
```

### When !important Is Acceptable

```css
/* Only for framework-level overrides */
h1 { font-size: 2.5rem !important; font-weight: 700 !important; }
body { font-family: 'Inter', sans-serif !important; color: var(--foreground) !important; }
```

### When NOT to Use !important

```css
/* ❌ Overuse — use Tailwind utilities instead */
.element { margin: 1rem !important; padding: 1rem !important; display: flex !important; }
/* ✅ Better */ <div class="m-4 p-4 flex">
```

**Best Practices**: Prefer utilities over custom CSS. Use `!important` sparingly. Scope custom styles. Use CSS custom properties for theming.

---

## References

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)

---

## Related Files

- [css-framework.md](css-framework.md) — Framework loading and setup
- [responsive-layout.md](responsive-layout.md) — Breakpoints and layout patterns
- [components-accessibility.md](components-accessibility.md) — Component patterns and a11y
