<!-- Context: web/navigation | Priority: critical | Version: 1.2 | Updated: 2026-07-28 -->

# Web UI Context

**Purpose**: Web-based UI patterns, animations, styling standards, and React component design

---

## Core Files

| File | Description | Priority |
|------|-------------|----------|
| [animation-basics.md](animation-basics.md) | Animation fundamentals, timing, easing | high |
| [animation-components.md](animation-components.md) | Button, card, modal, dropdown animations | high |
| [animation-chat.md](animation-chat.md) | Chat UI and message animations | medium |
| [animation-loading.md](animation-loading.md) | Skeleton, spinner, progress animations | medium |
| [animation-forms.md](animation-forms.md) | Form input and validation animations | medium |
| [animation-advanced.md](animation-advanced.md) | Recipes, best practices, accessibility | medium |
| [css-framework.md](css-framework.md) | CSS frameworks, Tailwind patterns, styling best practices | high |
| [responsive-layout.md](responsive-layout.md) | Responsive design patterns and layout strategies | high |
| [typography-colors.md](typography-colors.md) | Typography systems and color palette standards | high |
| [components-accessibility.md](components-accessibility.md) | Web component patterns and accessibility standards | high |
| [react-patterns.md](react-patterns.md) | Modern React patterns, hooks, component design | high |
| [design-systems.md](design-systems.md) | Design system principles and component libraries | medium |
| [images-guide.md](images-guide.md) | Placeholder and responsive images | medium |
| [icons-guide.md](icons-guide.md) | Icon systems (Lucide, Heroicons, FA) | medium |
| [fonts-guide.md](fonts-guide.md) | Font loading and optimization | medium |
| [cdn-resources.md](cdn-resources.md) | CDN libraries and resources | medium |

## Subcategories

| Subcategory | Description | Path |
|-------------|-------------|------|
| **design/** | Advanced design patterns (scrollytelling, effects) | [design/navigation.md](design/navigation.md) |

---

## Loading Strategy

### For general web UI work:
1. Load `css-framework.md` (CSS frameworks, Tailwind)
2. Load `responsive-layout.md` (responsive patterns)
3. Load `typography-colors.md` (typography, colors)
4. Load `components-accessibility.md` (components, a11y)
5. Load `react-patterns.md` (component patterns)
6. Reference animation files if animations needed

### For animation work:
1. Load `animation-basics.md` (fundamentals, timing, easing)
2. Load `animation-components.md` (UI component animations)
3. Reference `animation-chat.md` for chat UI patterns
4. Reference `animation-advanced.md` for recipes and accessibility

### For scroll animations:
1. Navigate to `design/` subcategory
2. Load scroll-linked animation guides

---

## Scope

- ✅ CSS animations and transitions
- ✅ Tailwind CSS and utility-first styling
- ✅ React component patterns and hooks
- ✅ Design systems and component libraries
- ✅ Icon libraries and web fonts
- ✅ Scroll-linked animations (scrollytelling)
- ✅ Canvas-based rendering
- ✅ Framer Motion patterns

---

## Related Categories

- `dev/` - General development patterns (backend, APIs, clean code)

---

## Used By

**Agents**: frontend-specialist, design-specialist, ui-developer, react-developer, animation-expert
