# ClientFlow

ClientFlow is a full-stack SaaS CRM dashboard built as a portfolio-grade project. It is designed to show practical product engineering across authentication, relational data modeling, dashboard analytics, billing simulation, testing, and deployment.

## Tech Stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- PostgreSQL on Neon
- Prisma ORM
- Auth.js
- Stripe test-mode billing
- Vitest for unit tests
- Playwright for browser tests
- Vercel for deployment

## Planned Features

- Workspace-based CRM dashboard
- Seeded demo account for portfolio visitors
- Client and lead management
- Deal pipeline with stages and values
- Task tracking and due dates
- Dashboard metrics
- Role-aware workspace access
- Stripe test checkout and subscription state
- Unit and end-to-end test coverage

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Then update `.env.local` with your local values. Real environment files are ignored by Git.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## App Routes

- `/` - public product preview
- `/login` - demo sign-in page
- `/dashboard` - protected CRM dashboard

Demo credentials are created by `npm run db:seed` from `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`.

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/clientflow?sslmode=require"
DIRECT_URL=""
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
DEMO_USER_EMAIL="demo@clientflow.app"
DEMO_USER_PASSWORD="ChangeMe123!"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_GROWTH_PRICE_ID=""
STRIPE_PRO_PRICE_ID=""
```

`DATABASE_URL` should use the pooled Neon URL for the running app. `DIRECT_URL` is optional and can use Neon's direct connection string for Prisma migrations when available. Stripe keys should come from Stripe test mode only.

For local Stripe webhooks, install the Stripe CLI, then run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret from that command into `STRIPE_WEBHOOK_SECRET`. The Growth and Pro variables should use the recurring Price IDs from the test-mode Stripe products.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run db:studio
```

`db:migrate` is used during local development to create and apply migrations. `db:deploy` is used in deployment environments to apply existing migrations. `db:seed` creates the demo workspace, CRM records, and demo user.

## Database Setup

Generate Prisma Client:

```bash
npm run db:generate
```

Create and apply a migration:

```bash
npm run db:migrate
```

Seed the demo workspace:

```bash
npm run db:seed
```

Open Prisma Studio:

```bash
npm run db:studio
```

## Development Roadmap

1. Scaffold Next.js app and baseline dashboard shell
2. Add database schema with Prisma and Neon PostgreSQL
3. Add Auth.js authentication and seeded demo login
4. Build clients, leads, deals, and tasks workflows
5. Add dashboard metrics and activity history
6. Add Stripe test-mode billing
7. Add Vitest and Playwright coverage
8. Deploy on Vercel with Neon

## Deployment Notes

The target deployment is Vercel Hobby with Neon Free Postgres. This keeps the project free to build, run, and show on a portfolio while still using a real production-style stack.
