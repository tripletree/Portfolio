# tripletree — portfolio

A bilingual (EN default / 中文) portfolio. Static files, no framework, no build step.

## Structure

| File | What |
|---|---|
| `index.html` | Home: hero, work index, operating model, services, contact |
| `atlas.html` `forge.html` `relay.html` `prism.html` | One page per case study |
| `site.css` `site.js` | Shared styles and behaviour |
| `assets/` | Case-study images (client names removed) |

## Things to try

- `A` reads the current page as an agent would (markdown, copyable). `H` returns.
- `⌘K` / `Ctrl K` or `/` opens the command palette.
- `L` switches language. `←` `→` move between case studies.
- Hover the work index for previews; drag the before/after figures; click any screenshot to zoom.

## Run

```bash
python3 -m http.server 8080
```

## Edit

- `site.js` → `CONFIG.email`: set a public contact address. While empty, the contact button links to the GitHub profile.
- Copy: English lives in the element, Chinese in its `data-zh` attribute.
- Project names (Atlas, Forge, Relay, Prism) are codenames; client names are deliberately absent.
