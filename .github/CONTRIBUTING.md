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

## Pull Request Guidelines

1. Push your branch to your fork.
2. Open a Pull Request.
3. Reference the related issue number.
4. Include screenshots for UI-related changes.
5. Provide a clear description of the changes made.

Thank you for contributing!
