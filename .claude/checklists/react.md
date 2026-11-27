# React & Next.js Engineering Checklist (MyCast `frontend/`)

## Component & Hook Best Practices
- [ ] **Dependency Arrays**: Accurately specify all dependencies in `useEffect`, `useCallback`, and `useMemo`. Never suppress ESLint hook warnings without documented justification.
- [ ] **Server vs. Client Boundaries**: In Next.js App Router (React 19), keep components server-rendered by default. Mark `'use client'` only on leaves requiring state, hooks, or event listeners.
- [ ] **Derived State**: Compute derived state during render rather than synchronizing it via `useEffect` and extra state variables.
- [ ] **Props & Composition**: Avoid deeply nested prop drilling; use composition, custom hooks, or React Context for shared state.
- [ ] **Interface Naming**: Never use an `I` prefix on TypeScript prop or model interfaces.

## Design System & Performance (`DESIGN.md` & Tailwind CSS v4)
- [ ] **MyCast Palette & Contrast**: Follow `DESIGN.md` and `frontend/CLAUDE.md` — `#1c1c1c` dark canvas, `#2d2d2d` charcoal cards, `#9bf73c` lime CTA accents. Always use dark text (`#1c1c1c` / `#2d2d2d`) on lime buttons, never white.
- [ ] **Key Property Hygiene**: Always use stable, unique IDs for list `key` props; avoid array index keys on dynamic lists.
- [ ] **Bundle Size**: Avoid importing entire utility libraries; use path imports or tree-shakeable named exports.
- [ ] **Image & Media Optimization**: Use explicit aspect ratios on video cards and thumbnails to prevent layout shifts (CLS).

## Security & Accessibility (a11y)
- [ ] **XSS Prevention**: Never use `dangerouslySetInnerHTML` with unsanitized user content.
- [ ] **Keyboard Navigation**: Ensure all interactive elements are focusable and triggerable via keyboard (`Enter` / `Space`).
- [ ] **ARIA Attributes**: Include proper `aria-label`, `role`, and semantic HTML (`<main>`, `<nav>`, `<button>`).
- [ ] **Iconography**: Use a standard icon library (e.g., `lucide-react`) rather than raw emoji as UI icons.

## Verification
- [ ] Run `cd frontend && npm run lint && npm run build`.
