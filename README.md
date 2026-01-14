UrbanCart — E-commerce Demo
Short, modern Next.js storefront demo showcasing reusable UI components, Tailwind styling, and example pages. The app metadata is defined in the root layout.

Features
Reusable UI components: header, footer, hero, product-card, grids, newsletter.
Deal of the day countdown and product discount calculation.
ShadCN-style component setup with Tailwind and Radix primitives.
Tech stack
Next.js 16.x
React 19.x
TypeScript
Tailwind CSS
Lucide icons and Radix UI primitives
Dependency versions and scripts are declared in package.json.
Requirements
Node 18+ recommended.
npm, yarn, or pnpm.
Git for source control.
Quick start
Follow these steps to run the project locally.

# install
npm install

# development
npm run dev

# build
npm run build

# start production
npm start
NPM scripts are defined in package.json.

Project structure
Short overview of main folders and files.

app/ — Next.js routes and layout (app/layout.tsx, app/page.tsx).
components/ — UI components (header, footer, hero, product-card, grids, newsletter).
components/ui/ — design primitives (button, input).
lib/ — utilities (cn helper).
components.json — shadcn config and path aliases.
next.config.mjs, postcss.config.mjs, tsconfig.json — build and toolchain config.
Components overview
Header — navigation, search, cart, badges.
ProductCard — image, price, discount calculation, quick actions.
ProductGrid / CategoryGrid — product and category listings.
DealOfTheDay — countdown timer logic.
Newsletter — email capture form.
Configuration notes
next.config.mjs sets TypeScript rules and image handling.
Tailwind and PostCSS use postcss.config.mjs.
Aliases and component config live in components.json.
Testing & linting
Lint script available: npm run lint (see package.json).
No tests included by default. Add your chosen test framework and scripts.
Deployment
Deploy to Vercel, Netlify, or any Node host.
For Vercel, use default Next.js build settings and set environment variables if needed.
Contributing
Open issues for bugs or feature requests.
Fork the repo, create a feature branch, and open a PR.
Keep components small, accessible, and reusable.
License
Add a LICENSE file to set the project license (for example, MIT).
