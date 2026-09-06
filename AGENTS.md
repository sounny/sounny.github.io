# AGENTS.md

## Project

This repository contains the GitHub Pages site for Sounny. The site is a collection of web applications, projects, teaching resources, and related content.

## Important Rules

- Keep `index.html` at the repository root.
- Do not move the main page into a subfolder.
- Preserve existing functionality unless a change specifically requires it.
- Use simple, readable HTML, CSS, and JavaScript.
- Keep the site responsive and touch-friendly.
- Test links and interactive features after making changes.
- Avoid unnecessary dependencies.
- Do not expose API keys, passwords, tokens, or other secrets in client-side code.

## GitHub Pages

The site is intended to run as a static GitHub Pages website. Relative paths should work from the repository root.

## Editing Guidance

When adding a new standalone web app, prefer a self-contained folder unless the user explicitly requests that the app use only the root `index.html`.

When the user requests a single-file implementation, place the complete implementation in `index.html` and keep the root clean.

## Commits

Use clear, concise commit messages that describe the change.
