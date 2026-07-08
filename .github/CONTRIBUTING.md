# Contributing Guide

Thank you for your interest in contributing to this project!

## Before You Start

* Check the open issues before starting work.
* Avoid working on issues that are already assigned.
* Comment on an issue and wait for assignment if required.
* Reach out to maintainers if requirements are unclear.

## Setup

1. Fork the repository.
2. Clone your fork locally:

   ```bash
   git clone <your-fork-url>
   ```
3. Navigate to the project directory:

   ```bash
   cd File-Sharing-System
   ```
4. Install dependencies:

   ```bash
   npm install
   ```

   > This also installs the Git commit-msg hook via Husky. Every commit is validated automatically.

5. Start the development server:

   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following the existing project structure.
3. Test your changes before submitting.
4. Commit using the Conventional Commits format (see below).

## Commit Message Format

This project enforces [Conventional Commits](https://www.conventionalcommits.org/). A commit-msg hook will reject any commit that doesn't follow the format.

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructure without feature/fix |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration |
| `chore` | Maintenance tasks |
| `revert` | Revert a previous commit |

### Good Commits ✅

```
feat: add file preview modal
```
```
fix(upload): handle empty file name gracefully
```
```
docs: update setup instructions in contributing guide
```
```
refactor(auth): extract token validation to helper function
```
```
feat(ui)!: redesign dashboard layout

BREAKING CHANGE: sidebar nav items moved to top bar.
Update any custom CSS targeting `.sidebar-nav`.
```
```
fix(download): prevent duplicate requests on double click

Fixes #142
```

### Bad Commits ❌

```
Fixed bug
```
> Missing type prefix.

```
feat: Fixed the upload bug
```
> Wrong tense — use imperative mood: "fix" not "Fixed".

```
FEAT: add share link
```
> Type must be lowercase.

```
feat: Add a new feature that lets users download multiple files at once by selecting them with checkboxes and clicking the download button
```
> Description exceeds 72 characters — keep it concise.

```
update stuff
```
> No type, too vague.

```
wip
```
> Never commit work-in-progress — finish the change first.

### Scopes (Optional)

Use a scope in parentheses to name the area of the codebase affected:

```
feat(auth): add OAuth2 login
fix(api): handle 429 rate limit response
test(upload): add unit tests for chunked upload
```

Use kebab-case for multi-word scopes: `feat(file-preview): ...`

### Breaking Changes

Append `!` after the type/scope and add a `BREAKING CHANGE:` footer:

```
feat(api)!: change file URL format

BREAKING CHANGE: Shared file URLs now include a version prefix `/v2/`.
Old links will redirect automatically for 30 days.
```

## AI Skills

This repo ships a set of project-specific AI skills in [`.agents/skills/`](../.agents/skills/). If you use Claude Code, these load automatically and give the model context tuned to _this_ codebase rather than generic advice.

### Available skills

| Skill | When to use |
|---|---|
| `conventional-commit` | Run before every commit — it reads your staged diff and writes the commit message for you, so the `commit-msg` hook never rejects your work |
| `nodejs-express-server` | Adding a route, middleware, or auth change to `server/` — gives patterns aligned with Express 5 and the existing code structure |
| `redis-best-practices` | Touching anything that uses the optional Redis layer (rate-limiting, session caching) — covers key naming, TTL, and connection pooling |
| `vitest-testing-patterns` | Writing or fixing tests in `client/__tests__/` — covers mocking, async patterns, and coverage setup for Vitest |
| `wcag-audit-patterns` | Before submitting UI changes — catches accessibility violations early so reviewers don't have to |

### Workflow

1. Make your code changes as normal.
2. Before committing, invoke the `conventional-commit` skill — it stages your files, inspects the diff, and produces a spec-compliant message that passes `commitlint`.
3. When adding server routes or middleware, open the `nodejs-express-server` skill for copy-paste patterns (error handling, auth guards, input validation).
4. When writing tests, invoke `vitest-testing-patterns` for mock setup and file organisation that matches the existing `__tests__/` structure.
5. For any UI change, run `wcag-audit-patterns` to check for accessibility issues before opening a PR.

Skills reduce the feedback loop: you get project-specific guidance inline instead of waiting for a review comment to point out the same pattern.

## Pull Request Guidelines

1. Push your branch to your fork.
2. Open a Pull Request.
3. Reference the related issue number in the PR description using keywords like `Closes #123` or `Fixes #123`. This is **required** and checked by an automated workflow.
4. Include screenshots for UI-related changes.
5. Provide a clear description of the changes made.

Thank you for contributing!
