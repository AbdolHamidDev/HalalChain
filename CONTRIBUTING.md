# Contributing to HalalChain

Thank you for your interest in contributing to HalalChain! 🎉

We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and more.

## Getting Started

1. **Fork** the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/HalalChain.git
   cd HalalChain
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/AbdolHamidDev/HalalChain.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create a branch for your changes:
   ```bash
   git checkout -b feat/my-feature
   ```

## Development Workflow

### Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, dependencies, tooling |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring |
| `test/` | Adding or updating tests |

### Before Submitting

- Run tests locally: `npm run test -w backend`
- Ensure the backend builds: `npm run build -w backend`
- Ensure the frontend builds: `npm run build -w frontend`
- Write clear, descriptive commit messages following [Conventional Commits](https://www.conventionalcommits.org/):
  ```
  feat: add certificate upload to Cloudinary
  fix: resolve race condition in SSE stream
  docs: update API endpoint table
  ```

### Pull Request Process

1. Push your branch to your fork:
   ```bash
   git push origin feat/my-feature
   ```
2. Open a Pull Request against the `main` branch.
3. Fill in the PR template with a clear description of your changes.
4. Ensure CI checks pass (GitHub Actions will run automatically).
5. A maintainer will review your PR and may request changes.

### Code Standards

- **TypeScript** — strict mode enabled in both `backend/tsconfig.json` and `frontend/tsconfig.json`
- **Formatting** — we follow the project's existing style (2-space indentation, consistent quotes)
- **Backend** — validate all inputs with Zod schemas; use Prisma for database access
- **Frontend** — use Tailwind CSS 4 for styling; leverage shadcn/ui components when possible
- **Tests** — write Vitest tests for backend logic; property-based tests with `fast-check` are encouraged for rule/validation logic

## Reporting Issues

- **Bug reports** — include steps to reproduce, expected vs. actual behaviour, and relevant environment details
- **Feature requests** — describe the problem you want to solve, not just the solution

## Security

If you discover a security vulnerability, please do **not** open a public issue. Instead, email the maintainer directly or open a draft security advisory on GitHub.

## Code of Conduct

All contributors must abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful, inclusive, and constructive.

---

Thank you for helping make HalalChain better! 🙌