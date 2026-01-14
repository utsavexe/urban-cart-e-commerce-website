# Urbancart Ecommerce

Lightweight Next.js e-commerce starter built with the app directory.

## Features
- Next.js (app router)
- TypeScript
- Components and UI primitives in `components/` and `components/ui/`

## Prerequisites
- Node.js 18+ or compatible
- pnpm (recommended) or npm

## Install

```powershell
pnpm install
```

## Run (development)

```powershell
pnpm dev
```

## Build

```powershell
pnpm build
pnpm start
```

## Deploy to GitHub (quick steps)

1. Initialize git (if not already):

```powershell
git init
git add .
git commit -m "chore: initial commit"
```

2. Create a remote repo and push (using GitHub CLI):

```powershell
# replace <owner/repo> or omit to create under your account
gh repo create urbancart-ecommerce --public --source=. --remote=origin --push
```

If you prefer the web UI, create a new repo on github.com and then run:

```powershell
git remote add origin https://github.com/<your-username>/urbancart-ecommerce.git
git branch -M main
git push -u origin main
```

## Deploying to Vercel

1. Install the Vercel CLI (optional) or connect the repo on vercel.com.

```powershell
pnpm i -g vercel
vercel login
vercel --prod
```

Or simply connect the GitHub repo from Vercel dashboard — Vercel will handle builds automatically.

## CI / GitHub Actions

You can add a workflow to `.github/workflows/` to build and test on push. Example minimal job:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm build
```

## Notes
- Adjust commands if you use `npm` or `yarn` instead of `pnpm`.
- If you want, I can: set up a GitHub Actions workflow, create the repo using the GitHub API (you'll need to provide a token), or configure automatic Vercel deployment.

---

Created for the `urbancart ecommerce` project.
