# tripletree — portfolio

A bilingual (EN default / 中文) portfolio site that is itself a case study. No framework, no build step.

**The idea:** a *fidelity dial* re-renders the whole site as one of three layers, all driven by one token contract:

| Key | Layer | What you see |
|---|---|---|
| `1` | Intent | The PRD: wireframe styling, every section shows its user story |
| `2` | System | The blueprint: grid, token labels, component boundaries |
| `3` | Shipped | The product |

Other shortcuts: `L` language, `T` token console (accent, theme, display font, radius).

## Run

Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy

Static files only — GitHub Pages (Settings → Pages → deploy from branch, root), Vercel, Netlify or Cloudflare Pages all work as-is.

## Edit

- `app.js` → `CONFIG.email`: set a public contact address. While it is empty, the contact button links to the GitHub profile.
- Copy: English lives in the element, Chinese in its `data-zh` attribute (`index.html`). Widget copy lives in `app.js` as `[en, zh]` pairs.
- Tokens: the three layers are defined at the top of `styles.css`.
